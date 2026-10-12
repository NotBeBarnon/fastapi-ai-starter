import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Modal, Form, Select, Switch, message } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { userApi, type AdminUser, type Paged } from '../api'

export default function UsersPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Paged<AdminUser>>({ total: 0, page: 1, page_size: 10, items: [] })
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form] = Form.useForm()

  const load = async (page = 1, page_size = 10) => {
    setLoading(true)
    try {
      const r = await userApi.list({ page, page_size })
      setData(r)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || t('common.failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    form.setFieldsValue({ role: u.role, is_active: u.is_active })
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (!editing) return
    const values = await form.validateFields()
    try {
      await userApi.update(editing.id, values)
      message.success(t('common.success'))
      setEditOpen(false)
      load(data.page, data.page_size)
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      message.error(detail || t('common.failed'))
    }
  }

  const columns = [
    { title: t('users.columns.id'), dataIndex: 'id', width: 80 },
    { title: t('users.columns.username'), dataIndex: 'username' },
    {
      title: t('users.columns.role'),
      dataIndex: 'role',
      width: 120,
      render: (r: string) => (
        <Tag color={r === 'admin' ? 'blue' : 'default'}>
          {r === 'admin' ? t('common.roleAdmin') : t('common.roleUser')}
        </Tag>
      ),
    },
    {
      title: t('users.columns.status'),
      dataIndex: 'is_active',
      width: 100,
      render: (v: boolean) => v
        ? <Tag color="success">{t('common.enabled')}</Tag>
        : <Tag color="default">{t('common.disabled')}</Tag>,
    },
    {
      title: t('users.columns.createdAt'),
      dataIndex: 'created_at',
      width: 180,
      render: (d?: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: t('users.columns.actions'),
      key: 'op',
      width: 120,
      render: (_: any, record: AdminUser) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>{t('common.edit')}</Button>
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
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data.items}
        loading={loading}
        pagination={pagination}
      />
      <Modal
        title={`${t('users.editUser')}：${editing?.username}`}
        open={editOpen}
        onOk={submitEdit}
        onCancel={() => setEditOpen(false)}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('users.columns.role')} name="role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'user', label: t('common.roleUser') },
                { value: 'admin', label: t('common.roleAdmin') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('common.active')} name="is_active" valuePropName="checked">
            <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
