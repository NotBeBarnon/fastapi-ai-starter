import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Tag, Spin, Typography, Space } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  BookOutlined,
  ApiOutlined,
  CheckCircleTwoTone,
  WarningTwoTone,
  DatabaseOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { llmApi, monitorApi, ragApi, userApi } from '../api'

const { Title, Text } = Typography

export default function Dashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<{ total: number }>({ total: 0 })
  const [rag, setRag] = useState<{ total_docs: number; total_chunks: number; index_size: number; has_llm: boolean; fallback_embedding: boolean }>({
    total_docs: 0, total_chunks: 0, index_size: 0, has_llm: false, fallback_embedding: false,
  })
  const [llm, setLlm] = useState<{ call_count: number; providers: string[]; default_provider: string } | null>(null)
  const [readyz, setReadyz] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      userApi.list({ page: 1, page_size: 1 }).then(setUsers).catch(() => setUsers({ total: 0 })),
      ragApi.stats().then(setRag).catch(() => {}),
      llmApi.stats().then(setLlm).catch(() => {}),
      monitorApi.readyz().then(setReadyz).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const dbUp = readyz?.data?.components?.find((c: any) => c.name === 'database')?.status === 'up'
  const redisUp = readyz?.data?.components?.find((c: any) => c.name === 'redis')?.status === 'up'

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>{t('dashboard.title')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{t('dashboard.subtitle')}</Text>
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card><Statistic title={t('dashboard.userCount')} value={users.total} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title={t('dashboard.docCount')} value={rag.total_docs} prefix={<BookOutlined />} suffix={`/ ${rag.total_chunks} ${t('dashboard.chunks')}`} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title={t('dashboard.indexSize')} value={rag.index_size} prefix={<DatabaseOutlined />} suffix={t('dashboard.chunks')} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title={t('dashboard.llmCalls')} value={llm?.call_count ?? 0} prefix={<ApiOutlined />} suffix={t('dashboard.times')} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={t('dashboard.systemStatus')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Database: </Text>
                {dbUp ? <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">UP</Tag>
                     : <Tag icon={<WarningTwoTone twoToneColor="#ff4d4f" />} color="error">DOWN</Tag>}
              </div>
              <div>
                <Text>Redis: </Text>
                {redisUp ? <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">UP</Tag>
                        : <Tag icon={<WarningTwoTone twoToneColor="#ff4d4f" />} color="error">DOWN</Tag>}
              </div>
              <div>
                <Text>LLM: </Text>
                {rag.has_llm ? (
                  <Tag color="success">{llm?.default_provider || 'default'} · {llm?.providers?.length || 0} providers</Tag>
                ) : (
                  <Tag color="warning">not configured</Tag>
                )}
              </div>
              <div>
                <Text>Embedding: </Text>
                {rag.fallback_embedding
                  ? <Tag color="warning">fallback (pseudo-vector)</Tag>
                  : <Tag color="success">real vector</Tag>}
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('dashboard.details')}>
            <p><Text strong>FastAPI AI Starter v2.0.0</Text></p>
            <p><Text strong>API: </Text><Text code>/api/sample</Text></p>
            <p><Text strong>Swagger: </Text><a href="/api/sample/docs" target="_blank" rel="noreferrer">/api/sample/docs</a></p>
            <p><Text strong>Admin: </Text><Text code>/admin/</Text></p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
