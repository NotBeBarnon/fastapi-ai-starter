import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, theme, Modal, Select, Space, Tooltip } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BookOutlined,
  MonitorOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  GlobalOutlined,
  FolderOpenOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authApi, getSavedUser } from '../api'
import { SUPPORTED_LANGUAGES } from '../i18n'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const user = getSavedUser()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    { key: '/users', icon: <TeamOutlined />, label: t('menu.users') },
    { key: '/resources', icon: <AppstoreOutlined />, label: t('menu.resources') },
    { key: '/knowledge', icon: <BookOutlined />, label: t('menu.knowledge') },
    { key: '/files', icon: <FolderOpenOutlined />, label: t('menu.files') },
    { key: '/realtime', icon: <ThunderboltOutlined />, label: t('menu.realtime') },
    { key: '/monitor', icon: <MonitorOutlined />, label: t('menu.monitor') },
  ]

  const handleLogout = () => {
    Modal.confirm({
      title: t('menu.logoutConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => {
        authApi.logout()
        navigate('/login', { replace: true })
      },
    })
  }

  const currentLang = i18n.language || 'zh-CN'
  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0]

  const languageMenu = {
    selectedKeys: [currentLang],
    items: SUPPORTED_LANGUAGES.map((lang) => ({
      key: lang.code,
      label: (
        <Space>
          <span style={{ fontSize: 16 }}>{lang.flag}</span>
          <span>{lang.label}</span>
        </Space>
      ),
      onClick: () => {
        i18n.changeLanguage(lang.code)
        // i18next-browser-languagedetector 会自动写入 localStorage
      },
    })),
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: colorBgContainer, boxShadow: '2px 0 8px rgba(0,0,0,.04)' }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 16,
            color: '#1677ff',
            letterSpacing: 1,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {collapsed ? 'AI' : 'AI Starter'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname === '/admin' ? '/' : location.pathname.replace(/^\/admin/, '')]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
              aria-label={t('layout.collapsedTip')}
            />
          </Space>
          <Space size={16}>
            <Dropdown menu={languageMenu} placement="bottomRight">
              <Tooltip title={t('layout.language')}>
                <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GlobalOutlined />
                  <span style={{ fontSize: 16 }}>{currentLangInfo.flag}</span>
                  <span>{currentLangInfo.label}</span>
                </Button>
              </Tooltip>
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: t('common.logout'),
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <span>{user?.username}</span>
                <span style={{ color: '#888', fontSize: 12 }}>({user?.role === 'admin' ? t('common.roleAdmin') : t('common.roleUser')})</span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, minHeight: 'calc(100vh - 120px)', background: colorBgContainer, borderRadius: 8 }}>
            <Outlet />
          </div>
        </Content>
        <div style={{ textAlign: 'center', padding: '8px 0', color: '#999', fontSize: 12 }}>
          {t('layout.copyright')}
        </div>
      </Layout>
    </Layout>
  )
}
