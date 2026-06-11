import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:3001'

function getToken() {
  try { return Taro.getStorageSync('token') } catch { return null }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  data?: Record<string, unknown>
  needAuth?: boolean
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, needAuth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (needAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await Taro.request({
    url: `${BASE_URL}/api/v1${path}`,
    method,
    data,
    header: headers,
  })

  if (res.statusCode === 401) {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('user')
    Taro.redirectTo({ url: '/pages/login/index' })
    throw new Error('未登录')
  }

  const body = res.data as { success: boolean; data?: T; error?: string }
  if (!body.success) throw new Error(body.error || '请求失败')
  return body.data as T
}

// ─── 认证 ─────────────────────────────────────
export const authApi = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; phone: string; role: string; avatarUrl?: string } }>(
      '/auth/login', { method: 'POST', data: { phone, password }, needAuth: false }
    ),
  register: (data: { name: string; phone: string; password: string; role: string; remark?: string }) =>
    request('/auth/register', { method: 'POST', data, needAuth: false }),
  me: () => request('/auth/me'),
}

// ─── 用户/教练 ────────────────────────────────
export const usersApi = {
  coaches: () => request<{ id: string; name: string; avatarUrl?: string; specialty?: string; bio?: string }[]>('/users/coaches'),
  coachDetail: (id: string) => request(`/users/coaches/${id}`),
  updateMe: (data: Record<string, unknown>) => request('/users/me', { method: 'PATCH', data }),
  students: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/users/students${qs}`)
  },
  studentDetail: (id: string) => request(`/users/students/${id}`),
  createStudent: (data: Record<string, unknown>) => request('/users/students', { method: 'POST', data }),
  updateUser: (id: string, data: Record<string, unknown>) => request(`/users/${id}`, { method: 'PATCH', data }),
  updateStatus: (id: string, status: string) => request(`/users/${id}/status`, { method: 'PATCH', data: { status } }),
  resetPassword: (id: string, password: string) => request(`/users/${id}/reset-password`, { method: 'POST', data: { password } }),
}

// ─── 段位 ─────────────────────────────────────
export const ntrpApi = {
  records: (studentId: string) => request(`/ntrp/records/${studentId}`),
  submitRecord: (data: Record<string, unknown>) => request('/ntrp/records', { method: 'POST', data }),
  applications: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/ntrp/applications${qs}`)
  },
  reviewApplication: (id: string, data: Record<string, unknown>) =>
    request(`/ntrp/applications/${id}`, { method: 'PATCH', data }),
  config: () => request('/ntrp/config'),
  updateConfig: (content: string) => request('/ntrp/config', { method: 'PUT', data: { content } }),
}

// ─── 套餐 ─────────────────────────────────────
export const packagesApi = {
  templates: () => request('/packages/templates'),
  createTemplate: (data: Record<string, unknown>) => request('/packages/templates', { method: 'POST', data }),
  updateTemplate: (id: string, data: Record<string, unknown>) => request(`/packages/templates/${id}`, { method: 'PATCH', data }),
  studentPackages: (studentId: string) => request(`/packages/student/${studentId}`),
  issuePackage: (data: Record<string, unknown>) => request('/packages/student', { method: 'POST', data }),
  consume: (data: Record<string, unknown>) => request('/packages/consume', { method: 'POST', data }),
}

// ─── 私教预约 ─────────────────────────────────
export const bookingsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/bookings${qs}`)
  },
  create: (data: Record<string, unknown>) => request('/bookings', { method: 'POST', data }),
  confirm: (id: string, venue?: string) => request(`/bookings/${id}/confirm`, { method: 'PATCH', data: { venue } }),
  reject: (id: string, rejectReason: string) => request(`/bookings/${id}/reject`, { method: 'PATCH', data: { rejectReason } }),
  cancel: (id: string) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  complete: (id: string) => request(`/bookings/${id}/complete`, { method: 'PATCH' }),
  coachSchedule: (coachId: string) => request(`/bookings/coach-schedule/${coachId}`),
  addSchedule: (data: Record<string, unknown>) => request('/bookings/coach-schedule', { method: 'POST', data }),
  deleteSchedule: (id: string) => request(`/bookings/coach-schedule/${id}`, { method: 'DELETE' }),
}

// ─── 团课 ─────────────────────────────────────
export const groupClassesApi = {
  list: () => request('/group-classes'),
  create: (data: Record<string, unknown>) => request('/group-classes', { method: 'POST', data }),
  update: (id: string, data: Record<string, unknown>) => request(`/group-classes/${id}`, { method: 'PATCH', data }),
  sessions: (classId: string) => request(`/group-classes/${classId}/sessions`),
  enroll: (classId: string, packageId?: string) =>
    request(`/group-classes/${classId}/enroll`, { method: 'POST', data: { packageId } }),
  submitAttendance: (sessionId: string, attendances: { studentId: string; attended: boolean }[]) =>
    request(`/group-classes/sessions/${sessionId}/attendance`, { method: 'POST', data: { attendances } }),
  revokeAttendance: (sessionId: string, studentId: string) =>
    request(`/group-classes/sessions/${sessionId}/attendance/${studentId}`, { method: 'DELETE' }),
}

// ─── 通知 ─────────────────────────────────────
export const notificationsApi = {
  list: () => request('/notifications'),
  unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
}

// ─── 配置 ─────────────────────────────────────
export const configApi = {
  site: () => request('/config/site', { needAuth: false }),
  updateSite: (data: Record<string, unknown>) => request('/config/site', { method: 'PUT', data }),
  banners: () => request('/config/banners', { needAuth: false }),
  addBanner: (imageUrl: string, sortOrder?: number) =>
    request('/config/banners', { method: 'POST', data: { imageUrl, sortOrder } }),
  deleteBanner: (id: string) => request(`/config/banners/${id}`, { method: 'DELETE' }),
  sortBanners: (ids: string[]) => request('/config/banners/sort', { method: 'PATCH', data: { ids } }),
}

// ─── 学员-教练关联（管理员）────────────────────
export const studentCoachApi = {
  bind: (studentId: string, coachId: string) =>
    request('/users/student-coach', { method: 'POST', data: { studentId, coachId } }),
  unbind: (studentId: string, coachId: string) =>
    request('/users/student-coach', { method: 'DELETE', data: { studentId, coachId } }),
  getCoachStudents: (coachId: string) =>
    request(`/users/coach-students/${coachId}`, { needAuth: true }),
  getStudentCoaches: (studentId: string) =>
    request(`/users/student-coaches/${studentId}`, { needAuth: true }),
}
