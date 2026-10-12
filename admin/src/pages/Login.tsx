import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Form, Input, Button, Card, message, Alert, Dropdown, Space } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api'
import { SUPPORTED_LANGUAGES } from '../i18n'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const forbidden = search.get('forbidden')

  const currentLang = i18n.language || 'zh-CN'
  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0]

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const resp = await authApi.login(values.username, values.password)
      if (resp.user.role !== 'admin') {
        message.error(t('login.nonAdmin'))
        authApi.logout()
        return
      }
      message.success(t('login.success'))
      const redirect = search.get('redirect') || '/'
      navigate(redirect, { replace: true })
    } catch (e: any) {
      message.error(e?.response?.data?.detail || e?.message || t('login.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <Dropdown
          menu={{
            selectedKeys: [currentLang],
            items: SUPPORTED_LANGUAGES.map((lang) => ({
              key: lang.code,
              label: (
                <Space>
                  <span style={{ fontSize: 16 }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                </Space>
              ),
              onClick: () => i18n.changeLanguage(lang.code),
            })),
          }}
          placement="bottomRight"
        >
          <Button ghost style={{ color: '#fff', borderColor: 'rgba(255,255,255,.6)' }}>
            <GlobalOutlined /> {currentLangInfo.flag} {currentLangInfo.label}
          </Button>
        </Dropdown>
      </div>

      <Card
        style={{ width: 380, boxShadow: '0 8px 30px rgba(0,0,0,.12)' }}
        title={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{t('login.title')}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{t('login.subtitle')}</div>
          </div>
        }
        bordered={false}
      >
        {forbidden && (
          <Alert
            type="error"
            showIcon
            message={t('http.forbidden')}
            description={t('login.nonAdmin')}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off" initialValues={{ username: 'admin' }}>
          <Form.Item
            label={t('common.username')}
            name="username"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('login.usernamePlaceholder')} size="large" />
          </Form.Item>
          <Form.Item
            label={t('common.password')}
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('login.passwordPlaceholder')} size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              {loading ? t('login.loggingIn') : t('login.submit')}
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
          {t('login.tip')}
        </div>
      </Card>
    </div>
  )
}
