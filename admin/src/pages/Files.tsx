import { useEffect, useState } from 'react'
import {
  Table, Tag, Button, Space, message, Popconfirm, Upload, Progress, Typography, Input, Tooltip, Badge,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { InboxOutlined, DownloadOutlined, DeleteOutlined, FileOutlined, CloudServerOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { fileApi, type FileRecord, type FileStatsInfo, type Paged } from '../api'

const { Dragger } = Upload
const { Text } = Typography

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export default function FilesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Paged<FileRecord>>({ total: 0, page: 1, page_size: 10, items: [] })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<FileStatsInfo | null>(null)
  const [filename, setFilename] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const load = async (page = 1, page_size = 10, name = filename) => {
    setLoading(true)
    try {
      const r = await fileApi.list({ page, page_size, filename: name || undefined })
      setData(r)
      const s = await fileApi.stats()
      setStats(s)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || t('common.failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1, 10, '') }, [])

  const remove = async (id: number) => {
    try {
      await fileApi.remove(id)
      message.success(t('common.success'))
      load(data.page, data.page_size)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || t('common.failed'))
    }
  }

  const columns = [
    {
      title: t('files.columns.name'),
      dataIndex: 'filename',
      render: (name: string, r: FileRecord) => (
        <Space>
          <FileOutlined style={{ color: '#1677ff' }} />
          <a href={fileApi.downloadUrl(r.id)} target="_blank" rel="noreferrer">{name}</a>
        </Space>
      ),
    },
    { title: t('files.columns.size'), dataIndex: 'size', width: 110, render: (v: number) => formatSize(v) },
    { title: t('files.columns.type'), dataIndex: 'content_type', width: 170, ellipsis: true, render: (v: string) => v || '-' },
    {
      title: t('files.columns.backend'),
      dataIndex: 'storage_backend',
      width: 90,
      render: (v: string) => <Tag icon={<CloudServerOutlined />} color="geekblue">{v}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'is_public',
      width: 100,
      render: (pub: boolean) => pub
        ? <Tag color="gold">{t('files.public')}</Tag>
        : <Tag color="default">{t('files.private')}</Tag>,
    },
    { title: t('files.columns.owner'), dataIndex: 'owner_id', width: 90 },
    { title: t('files.columns.createdAt'), dataIndex: 'created_at', width: 170, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: t('common.actions'),
      key: 'op',
      width: 140,
      render: (_: any, r: FileRecord) => (
        <Space>
          <Tooltip title={t('files.download')}>
            <Button size="small" icon={<DownloadOutlined />} href={fileApi.downloadUrl(r.id)} target="_blank" />
          </Tooltip>
          <Popconfirm title={t('files.deleteConfirm')} okText={t('common.confirm')} cancelText={t('common.cancel')} onConfirm={() => remove(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const pagination: TablePaginationConfig = {
    current: data.page,
    pageSize: data.page_size,
    total: data.total,
    showSizeChanger: true,
    showTotal: (total) => t('common.total', { count: total }),
    onChange: (p, ps) => load(p, ps),
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Badge status={stats?.storage_healthy ? 'success' : 'error'}
          text={t('files.backendStatus', {
            backend: stats?.backend || '-',
            files: stats?.total_files ?? 0,
            size: stats ? formatSize(stats.total_bytes) : '-',
          })}
        />
      </Space>

      <Dragger
        name="file"
        multiple={false}
        showUploadList={false}
        disabled={uploading}
        customRequest={async (opts) => {
          setUploading(true)
          setProgress(0)
          try {
            await fileApi.upload(opts.file as File, false, setProgress)
            message.success(t('files.uploadSuccess'))
            load(1, data.page_size)
          } catch (e: any) {
            message.error(e?.response?.data?.detail || t('common.failed'))
          } finally {
            setUploading(false)
            setProgress(0)
          }
        }}
        style={{ padding: '12px 20px', marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">{t('files.uploadTip')}</p>
        <p className="ant-upload-hint">{t('files.uploadHint')}</p>
        {uploading && <Progress percent={progress} size="small" style={{ maxWidth: 320, margin: '8px auto 0' }} />}
      </Dragger>

      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('files.searchName')}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          onSearch={(v) => load(1, data.page_size, v)}
          style={{ width: 240 }}
        />
        <Button onClick={() => load(data.page, data.page_size)}>{t('common.refresh')}</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data.items}
        loading={loading}
        pagination={pagination}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>{t('files.maxSizeTip')}</Text>
    </div>
  )
}
