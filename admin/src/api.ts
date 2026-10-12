import axios, { AxiosInstance, AxiosError } from 'axios'
import i18n from './i18n'

// 后端 API 基础路径（开发走 vite proxy，生产由 FastAPI 同域提供）
export const API_BASE = '/api/sample'

const TOKEN_KEY = 'fast_admin_token'
const USER_KEY = 'fast_admin_user'

export interface AdminUser {
  id: number
  username: string
  role: string
  is_active: boolean
  created_at?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AdminUser
}

export interface Paged<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

// ---------- token 存取 ----------
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
export function getSavedUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}
export function setSavedUser(u: AdminUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(u))
}

// ---------- axios 实例 ----------
export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const t = getToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken()
      // 避免在登录页循环跳转
      if (!location.pathname.endsWith('/admin/login') && !location.pathname.endsWith('/admin/')) {
        const redirect = encodeURIComponent(location.pathname + location.search)
        location.href = `/admin/login?redirect=${redirect}`
      }
    }
    return Promise.reject(error)
  },
)

// ---------- API ----------
export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await http.post('/user/login', { username, password })
    // 登录接口只返回 token，需再调 /user/me 拿用户信息
    setToken(data.access_token)
    try {
      const me = await userApi.me()
      setSavedUser(me)
      return { ...data, user: me }
    } catch {
      clearToken()
      throw new Error(i18n.t('http.serverError'))
    }
  },
  logout() {
    clearToken()
  },
}

export const userApi = {
  async me(): Promise<AdminUser> {
    const { data } = await http.get('/user/me')
    return data
  },
  async list(params: { page?: number; page_size?: number } = {}): Promise<Paged<AdminUser>> {
    const { data } = await http.get('/admin/users', { params })
    return data
  },
  async update(id: number, patch: { role?: string; is_active?: boolean }): Promise<AdminUser> {
    const { data } = await http.put(`/admin/users/${id}`, patch)
    return data
  },
}

export interface Beam {
  id: number
  name: string
  type: number
  is_active: boolean
  owner_id: number
  created_at: string
  modified_at: string
}

export const resourceApi = {
  async listBeams(params: {
    page?: number
    page_size?: number
    beam_type?: number
    owner_id?: number
    name_like?: string
  } = {}): Promise<Paged<Beam>> {
    const { data } = await http.get('/resource/admin/beams', { params })
    return data
  },
  async deleteBeam(id: number) {
    await http.delete(`/resource/beams/${id}`)
  },
}

export interface RagDoc {
  id: number
  title: string
  summary: string
  source: string
  chunk_count: number
  owner_id: number
  is_active: boolean
  created_at: string
  modified_at: string
}

export const ragApi = {
  async listDocs(params: { page?: number; page_size?: number; owner_id?: number } = {}): Promise<Paged<RagDoc>> {
    const { data } = await http.get('/rag/admin/docs', { params })
    return data
  },
  async stats(): Promise<{
    total_docs: number
    total_chunks: number
    index_size: number
    has_llm: boolean
    fallback_embedding: boolean
  }> {
    const { data } = await http.get('/rag/stats')
    return data
  },
  async deleteDoc(id: number) {
    await http.delete(`/rag/docs/${id}`)
  },
}

export interface LlmStats {
  call_count: number
  cost_total_usd: number
  providers: string[]
  default_provider: string
  enabled_providers: Record<string, { type: string; model: string; priority: number }>
  metrics: Record<string, unknown>
}

export const llmApi = {
  async stats(): Promise<LlmStats> {
    const { data } = await http.get('/llm/stats')
    return data
  },
  async health(): Promise<Record<string, unknown>> {
    const { data } = await http.get('/llm/health')
    return data
  },
}

export const monitorApi = {
  // readyz 在依赖（如 Redis/DB）异常时会返回 503，但 body 内仍包含组件状态明细，需要保留响应体
  async readyz(): Promise<{ status: number; data: any }> {
    const { status, data } = await http.get('/monitor/readyz', {
      validateStatus: (s) => s >= 200 && s < 600,
    })
    return { status, data }
  },
  async healthz(): Promise<{ status: number; data: any }> {
    const { status, data } = await http.get('/monitor/healthz', {
      validateStatus: (s) => s >= 200 && s < 600,
    })
    return { status, data }
  },
  async metrics(): Promise<string> {
    const { data } = await http.get('/monitor/metrics', {
      responseType: 'text',
      transformResponse: [(d) => (typeof d === 'string' ? d : JSON.stringify(d))],
    })
    return typeof data === 'string' ? data : JSON.stringify(data)
  },
}

// ---------- 文件上传 / 对象存储 ----------
export interface FileRecord {
  id: number
  filename: string
  key: string
  size: number
  content_type: string
  storage_backend: string
  etag: string
  is_public: boolean
  owner_id: number
  created_at: string
  modified_at: string
}

export interface FileStatsInfo {
  total_files: number
  total_bytes: number
  backend: string
  storage_healthy: boolean
}

export const fileApi = {
  async list(params: {
    page?: number
    page_size?: number
    owner_id?: number
    filename?: string
  } = {}): Promise<Paged<FileRecord>> {
    const { data } = await http.get('/files/admin/list', { params })
    return data
  },
  async upload(file: File, isPublic = false, onProgress?: (percent: number) => void): Promise<FileRecord> {
    const form = new FormData()
    form.append('file', file)
    form.append('is_public', String(isPublic))
    const { data } = await http.post('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    return data
  },
  async remove(id: number) {
    await http.delete(`/files/${id}`)
  },
  async stats(): Promise<FileStatsInfo> {
    const { data } = await http.get('/files/stats')
    return data
  },
  /** 带 token 的直链下载地址（用于 <a>/window.open） */
  downloadUrl(id: number): string {
    const token = getToken()
    return `${API_BASE}/files/${id}/download?token=${encodeURIComponent(token || '')}`
  },
}

// ---------- WebSocket 实时通信 ----------
export interface WsStats {
  connections: number
  rooms: number
  room_connections: Record<string, number>
}

export const wsApi = {
  /** 构造房间 WebSocket 地址（token 走 query，浏览器 WS 无法自定义请求头） */
  roomUrl(room: string): string {
    const token = getToken() || ''
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${location.host}${API_BASE}/ws/rooms/${encodeURIComponent(room)}?token=${encodeURIComponent(token)}`
  },
  async stats(): Promise<WsStats> {
    const { data } = await http.get('/ws/stats')
    return data
  },
  async broadcast(room: string, content: string, level = 'info') {
    const { data } = await http.post('/ws/broadcast', { room, content, level })
    return data as { room: string; delivered: number }
  },
}
