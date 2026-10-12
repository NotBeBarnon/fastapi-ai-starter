import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, message, Popconfirm, Modal, Descriptions } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { ragApi, type Paged, type RagDoc } from '../api'

export default function KnowledgePage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Paged<RagDoc>>({ total: 0, page: 1, page_size: 10, items: [] })
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<RagDoc | null>(null)

  const load = async (page = 1, page_size = 10) => {
    setLoading(true)
    try {
      const r = await ragApi.listDocs({ page, page_size })
      setData(r)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || t('common.failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const remove = async (id: number) => {
    try {
      await ragApi.deleteDoc(id)
      message.success(t('common.success'))
      load(data.page, data.page_size)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || t('common.failed'))
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: t('knowledge.columns.title'), dataIndex: 'title' },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      width: 100,
      render: (v: boolean) => v
        ? <Tag color="success">{t('common.enabled')}</Tag>
        : <Tag color="default">{t('common.disabled')}</Tag>,
    },
    { title: t('knowledge.columns.chunks'), dataIndex: 'chunk_count', width: 100 },
    { title: t('knowledge.columns.owner'), dataIndex: 'owner_id', width: 100 },
    { title: 'Source', dataIndex: 'source', width: 140, render: (s: string) => s || '-' },
    { title: t('knowledge.columns.createdAt'), dataIndex: 'created_at', width: 180, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: t('common.actions'),
      key: 'op',
      width: 160,
      render: (_: any, r: RagDoc) => (
        <Space>
          <Button size="small" onClick={() => setDetail(r)}>{t('common.edit')}</Button>
          <Popconfirm title={t('knowledge.deleteConfirm')} okText={t('common.confirm')} cancelText={t('common.cancel')} onConfirm={() => remove(r.id)}>
            <Button size="small" danger>{t('common.delete')}</Button>
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
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data.items}
        loading={loading}
        pagination={pagination}
      />
      <Modal
        title={detail?.title}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={720}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label={t('knowledge.columns.owner')}>{detail.owner_id}</Descriptions.Item>
            <Descriptions.Item label={t('knowledge.chunkCount')}>{detail.chunk_count}</Descriptions.Item>
            <Descriptions.Item label="Source">{detail.source || '-'}</Descriptions.Item>
            <Descriptions.Item label="Summary">{detail.summary || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('knowledge.columns.createdAt')}>{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  )
}
