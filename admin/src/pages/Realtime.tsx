import { useEffect, useRef, useState } from 'react'
import {
  Input, Button, Space, Tag, Badge, message, Card, List, Avatar, Tooltip, Modal, Select, Typography,
} from 'antd'
import {
  SendOutlined, ApiOutlined, UserOutlined, ClusterOutlined, NotificationOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { wsApi, getSavedUser, type WsStats } from '../api'

const { Text } = Typography

interface ChatMsg {
  key: string
  kind: 'chat' | 'system' | 'presence' | 'error'
  ts: string
  content: string
  username?: string
  role?: string
  userId?: number
  online?: number
  self?: boolean
}

const PRESET_ROOMS = ['general', 'dev', 'ops', 'alerts']

export default function RealtimePage() {
  const { t } = useTranslation()
  const [room, setRoom] = useState('general')
  const [connected, setConnected] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [online, setOnline] = useState(0)
  const [users, setUsers] = useState<{ user_id: number; username: string; role: string }[]>([])
  const [stats, setStats] = useState<WsStats | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const roomRef = useRef(room)
  roomRef.current = room
  const listRef = useRef<HTMLDivElement>(null)
  const currentUserId = getSavedUser()?.id

  const pushMsg = (m: Omit<ChatMsg, 'key'>) => {
    setMsgs((prev) => [...prev.slice(-199), { ...m, key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }])
  }

  const connect = (targetRoom: string) => {
    wsRef.current?.close()
    const ws = new WebSocket(wsApi.roomUrl(targetRoom))
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setMsgs([])
    }
    ws.onmessage = (ev) => {
      let p: any
      try { p = JSON.parse(ev.data) } catch { return }
      const ts = p.ts || dayjs().toISOString()
      if (p.type === 'chat') {
        const d = p.data || {}
        const u = d.user || {}
        pushMsg({
          kind: 'chat', ts, content: d.content, username: u.username, role: u.role, userId: u.user_id,
          self: u.user_id === currentUserId,
        })
      } else if (p.type === 'system') {
        pushMsg({ kind: 'system', ts, content: (p.data || {}).message || '' })
      } else if (p.type === 'presence') {
        const d = p.data || {}
        setOnline(d.online ?? 0)
        setUsers(d.users || [])
        pushMsg({ kind: 'presence', ts, content: t('realtime.presenceChanged', { n: d.online ?? 0 }), online: d.online })
      } else if (p.type === 'error') {
        pushMsg({ kind: 'error', ts, content: (p.data || {}).message || 'error' })
      }
    }
    ws.onerror = () => {
      setConnected(false)
      message.error(t('realtime.connectError'))
    }
    ws.onclose = () => {
      if (roomRef.current === targetRoom) setConnected(false)
    }
  }

  useEffect(() => {
    connect(room)
    const refreshStats = () => wsApi.stats().then(setStats).catch(() => {})
    refreshStats()
    const timer = setInterval(refreshStats, 5000)
    return () => {
      clearInterval(timer)
      wsRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 自动滚到底
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const switchRoom = (r: string) => {
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(r)) {
      message.warning(t('realtime.invalidRoom'))
      return
    }
    setRoom(r)
    connect(r)
    wsApi.stats().then(setStats).catch(() => {})
  }

  const send = () => {
    const content = input.trim()
    if (!content || !connected) return
    wsRef.current?.send(JSON.stringify({ type: 'chat', data: { content } }))
    setInput('')
  }

  const serverBroadcast = () => {
    let content = ''
    Modal.confirm({
      title: t('realtime.serverPush'),
      content: (
        <Input.TextArea
          autoFocus
          rows={3}
          placeholder={t('realtime.serverPushPlaceholder')}
          onChange={(e) => { content = e.target.value }}
        />
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        if (!content.trim()) return
        try {
          const r = await wsApi.broadcast(room, content.trim())
          message.success(t('realtime.delivered', { n: r.delivered }))
        } catch (e: any) {
          message.error(e?.response?.data?.detail || t('common.failed'))
        }
      },
    })
  }

  const colorFor = (name?: string) => {
    const palette = ['#1677ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2']
    const idx = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    return palette[idx % palette.length]
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={room}
          style={{ width: 160 }}
          onChange={switchRoom}
          options={PRESET_ROOMS.map((r) => ({ value: r, label: `# ${r}` }))}
        />
        <Input
          style={{ width: 160 }}
          addonBefore="#"
          placeholder={t('realtime.customRoom')}
          onPressEnter={(e) => switchRoom((e.target as HTMLInputElement).value.trim())}
        />
        <Badge status={connected ? 'success' : 'error'}
          text={connected ? t('realtime.connected') : t('realtime.disconnected')} />
        <Tag icon={<ClusterOutlined />} color="blue">
          {t('realtime.online', { n: online })}
        </Tag>
        <Tooltip title={t('realtime.serverPushTip')}>
          <Button icon={<NotificationOutlined />} onClick={serverBroadcast}>{t('realtime.serverPush')}</Button>
        </Tooltip>
        {stats && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('realtime.serverStats', { conn: stats.connections, rooms: stats.rooms })}
          </Text>
        )}
      </Space>

      <Card
        size="small"
        styles={{ body: { padding: 0 } }}
        title={<Space><ApiOutlined />{t('realtime.channelTitle', { room })}</Space>}
        extra={
          <Space>
            {users.slice(0, 8).map((u) => (
              <Tooltip key={u.user_id} title={`${u.username} (${u.role})`}>
                <Avatar size="small" style={{ backgroundColor: colorFor(u.username) }}>{u.username.slice(0, 1).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Space>
        }
      >
        <div ref={listRef} style={{ height: 420, overflowY: 'auto', padding: 16, background: '#fafafa' }}>
          <List
            dataSource={msgs}
            renderItem={(m) => {
              if (m.kind === 'system' || m.kind === 'presence') {
                return (
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <Tag color={m.kind === 'presence' ? 'blue' : 'default'} style={{ fontSize: 12 }}>
                      {m.content} · {dayjs(m.ts).format('HH:mm:ss')}
                    </Tag>
                  </div>
                )
              }
              if (m.kind === 'error') {
                return (
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <Tag color="error">{m.content}</Tag>
                  </div>
                )
              }
              return (
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, justifyContent: m.self ? 'flex-end' : 'flex-start' }}>
                  {!m.self && <Avatar size="small" style={{ backgroundColor: colorFor(m.username) }} icon={<UserOutlined />} />}
                  <div style={{ maxWidth: '70%' }}>
                    <Space size={6} style={{ marginBottom: 2 }}>
                      <Text strong style={{ fontSize: 13 }}>{m.username}</Text>
                      {m.role === 'admin' && <Tag color="gold" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>admin</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(m.ts).format('HH:mm:ss')}</Text>
                    </Space>
                    <div style={{
                      background: m.self ? '#1677ff' : '#fff',
                      color: m.self ? '#fff' : 'inherit',
                      padding: '8px 12px', borderRadius: 8, display: 'inline-block',
                      boxShadow: '0 1px 2px rgba(0,0,0,.06)', wordBreak: 'break-word',
                    }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              )
            }}
          />
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={input}
              placeholder={connected ? t('realtime.inputPlaceholder') : t('realtime.disconnected')}
              disabled={!connected}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={send}
              maxLength={2000}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={send} disabled={!connected || !input.trim()}>
              {t('realtime.send')}
            </Button>
          </Space.Compact>
        </div>
      </Card>
    </div>
  )
}
