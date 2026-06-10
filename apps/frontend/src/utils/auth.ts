import Taro from '@tarojs/taro'
import { useAuthStore } from '../stores/auth'

type Role = 'STUDENT' | 'COACH' | 'ADMIN'

/**
 * 检查登录态，未登录跳到登录页
 * 在页面 useEffect 里调用
 */
export function requireAuth(requiredRole?: Role) {
  const { token, user, loadFromStorage } = useAuthStore.getState()

  if (!token || !user) {
    loadFromStorage()
    const { token: t2, user: u2 } = useAuthStore.getState()
    if (!t2 || !u2) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return false
    }
  }

  const { user: currentUser } = useAuthStore.getState()
  if (requiredRole && currentUser?.role !== requiredRole) {
    Taro.redirectTo({ url: '/pages/login/index' })
    return false
  }
  return true
}

/**
 * 登录后跳转到对应端首页
 */
export function redirectToHome(role: Role) {
  const routes: Record<Role, string> = {
    STUDENT: '/pages/student/home/index',
    COACH: '/pages/coach/home/index',
    ADMIN: '/pages/admin/dashboard/index',
  }
  Taro.switchTab({ url: routes[role] }).catch(() => {
    Taro.redirectTo({ url: routes[role] })
  })
}
