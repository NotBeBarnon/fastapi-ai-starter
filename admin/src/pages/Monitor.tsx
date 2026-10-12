import { useEffect, useState, useCallback } from 'react'
import { Tabs, Card, Spin, Typography, Button, Space, Tag, Alert } from 'antd'
import { ReloadOutlined, CheckCircleTwoTone, WarningTwoTone, CloseCircleTwoTone } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { monitorApi } from '../api'

const { Text, Paragraph } = Typography

interface Probe {
  status: number
  data: any
  error?: string
}

export default function MonitorPage() {
  const { t } = useTranslation()
  const [healthz, setHealthz] = useState<Probe | null>(null)
  const [readyz, setReadyz] = useState<Probe | null>(null)
  const [metricsText, setMetricsText] = useState<string>('')
  const [metricsErr, setMetricsErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const renderStatusTag = (code: number) => {
    if (code >= 200 && code < 300) return <Tag color="success">{code} OK</Tag>
    if (code === 503) return <Tag color="warning">{code} Degraded</Tag>
    if (code >= 500) return <Tag color="error">{code} Error</Tag>
    return <Tag>{code}</Tag>
  }

  const load = useCallback(async () => {
    setLoading(true)
    setMetricsErr(null)

    const [h, r] = await Promise.all([
      monitorApi.healthz()
        .then((p) => ({ status: p.status, data: p.data } as Probe))
        .catch((e) => ({ status: 0, data: null, error: e?.message || t('http.networkError') } as Probe)),
      monitorApi.readyz()
        .then((p) => ({ status: p.status, data: p.data } as Probe))
        .catch((e) => ({ status: 0, data: null, error: e?.message || t('http.networkError') } as Probe)),
    ])
    setHealthz(h)
    setReadyz(r)

    try {
      setMetricsText(await monitorApi.metrics())
    } catch (e: any) {
      setMetricsErr(e?.response?.data?.detail || e?.message || t('monitor.metricsFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  const probeTabTitle = (label: string, probe: Probe | null) => {
    if (!probe) return label
    if (probe.error) return <span>{label} <Tag icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />} color="error">ERR</Tag></span>
    if (probe.status >= 200 && probe.status < 300) return <span>{label} <CheckCircleTwoTone twoToneColor="#52c41a" /></span>
    if (probe.status === 503) return <span>{label} <WarningTwoTone twoToneColor="#faad14" /></span>
    return <span>{label} <CloseCircleTwoTone twoToneColor="#ff4d4f" /></span>
  }

  const PrettyJson = ({ data }: { data: any }) => {
    if (data == null) return <Text type="secondary">{t('monitor.noData')}</Text>
    return (
      <pre style={{ margin: 0, maxHeight: 460, overflow: 'auto', fontSize: 12 }}>
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  const readyUp = readyz?.data?.components?.filter((c: any) => c.status === 'up').length ?? 0
  const readyTotal = readyz?.data?.components?.length ?? 0
  const readyStatusText = readyz?.data?.status === 'up' ? t('monitor.statusUp') : t('monitor.statusDown')

  return (
    <Spin spinning={loading}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load}>{t('monitor.refresh')}</Button>
        <Text type="secondary">{t('monitor.desc')}</Text>
      </Space>

      <Tabs
        items={[
          {
            key: 'readyz',
            label: probeTabTitle(t('monitor.readyz'), readyz),
            children: (
              <Card
                size="small"
                title={readyz ? <Space>{t('common.status')} {renderStatusTag(readyz.status)} {readyz.error && <Tag color="error">{readyz.error}</Tag>}</Space> : null}
              >
                {readyz?.data?.components && (
                  <Alert
                    style={{ marginBottom: 12 }}
                    type={readyz.status === 200 ? 'success' : 'warning'}
                    showIcon
                    message={t('monitor.overallUp', { status: readyStatusText, up: readyUp, total: readyTotal })}
                  />
                )}
                <PrettyJson data={readyz?.error ? { error: readyz.error } : readyz?.data} />
              </Card>
            ),
          },
          {
            key: 'healthz',
            label: probeTabTitle(t('monitor.healthz'), healthz),
            children: (
              <Card
                size="small"
                title={healthz ? <Space>{t('common.status')} {renderStatusTag(healthz.status)} {healthz.error && <Tag color="error">{healthz.error}</Tag>}</Space> : null}
              >
                <PrettyJson data={healthz?.error ? { error: healthz.error } : healthz?.data} />
              </Card>
            ),
          },
          {
            key: 'metrics',
            label: <span>{t('monitor.metrics')} <Tag color="blue">/metrics</Tag></span>,
            children: (
              <Card size="small">
                <Paragraph>
                  <Text type="secondary">{t('monitor.metricsDesc')}</Text>
                </Paragraph>
                {metricsErr ? (
                  <Alert type="error" showIcon message={t('monitor.metricsFailed')} description={metricsErr} />
                ) : (
                  <pre style={{ margin: 0, maxHeight: 560, overflow: 'auto', fontSize: 12, background: '#f6f8fa', padding: 12, borderRadius: 4 }}>
                    {metricsText || t('monitor.metricsEmpty')}
                  </pre>
                )}
              </Card>
            ),
          },
        ]}
      />
    </Spin>
  )
}
