import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, message, Popconfirm } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { resourceApi, type Beam, type Paged } from '../api'

export default function ResourcesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Paged<Beam>>({ total: 0, page: 1, page_size: 10, items: [] })
  const [loading, setLoading] = useState(false)

  const load = async (page = 1, page_size = 10) => {
    setLoading(true)
    try {
      const r = await resourceApi.listBeams({ page, page_size })
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
      await resourceApi.deleteBeam(id)
      message.success(t('common.success'))
      load(data.page, data.page_size)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || t('common.failed'))
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: t('resources.columns.title'), dataIndex: 'name' },
    {
      title: t('resources.type'),
      dataIndex: 'type',
      width: 110,
      render: (v: number) => {
        const label = v === 1 ? t('resources.typeKA') : v === 2 ? t('resources.typeX') : `#${v}`
        const color = v === 1 ? 'blue' : v === 2 ? 'purple' : 'default'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      width: 100,
      render: (v: boolean) => v
        ? <Tag color="success">{t('common.enabled')}</Tag>
        : <Tag color="default">{t('common.disabled')}</Tag>,
    },
    { title: t('resources.owner'), dataIndex: 'owner_id', width: 100 },
    { title: t('resources.columns.createdAt'), dataIndex: 'created_at', width: 180, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: t('common.actions'),
      key: 'op',
      width: 100,
      render: (_: any, r: Beam) => (
        <Popconfirm title={t('resources.deleteConfirm')} okText={t('common.confirm')} cancelText={t('common.cancel')} onConfirm={() => remove(r.id)}>
          <Button size="small" danger>{t('common.delete')}</Button>
        </Popconfirm>
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
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data.items}
      loading={loading}
      pagination={pagination}
    />
  )
}
