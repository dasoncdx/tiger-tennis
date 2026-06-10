import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface UserInfo {
  id: string
  name: string
  phone: string
  role: 'STUDENT' | 'COACH' | 'ADMIN'
  avatarUrl?: string | null
}

interface AuthStore {
  token: string | null
  user: UserInfo | null
  setAuth: (token: string, user: UserInfo) => void
  clearAuth: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    Taro.setStorageSync('token', token)
    Taro.setStorageSync('user', JSON.stringify(user))
    set({ token, user })
  },

  clearAuth: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('user')
    set({ token: null, user: null })
  },

  loadFromStorage: () => {
    try {
      const token = Taro.getStorageSync('token')
      const userStr = Taro.getStorageSync('user')
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) })
      }
    } catch {}
  },
}))
