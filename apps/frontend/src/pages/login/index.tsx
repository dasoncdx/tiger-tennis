import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { redirectToHome } from '../../utils/auth'
import './index.scss'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, token, user, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
    const { token: t, user: u } = useAuthStore.getState()
    if (t && u) redirectToHome(u.role as any)
  }, [])

  async function handleLogin() {
    if (!phone || !password) {
      return Taro.showToast({ title: '请输入手机号和密码', icon: 'none' })
    }
    setLoading(true)
    try {
      const res = await authApi.login(phone, password)
      setAuth(res.token, res.user as any)
      redirectToHome(res.user.role as any)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <View className='login-logo'>🎾</View>
        <Text className='login-title'>Tiger 网球俱乐部</Text>
        <Text className='login-sub'>欢迎回来</Text>
      </View>

      <View className='login-form'>
        <View className='form-item'>
          <Text className='form-label'>手机号</Text>
          <Input
            className='form-input'
            type='number'
            placeholder='请输入手机号'
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
            maxlength={11}
          />
        </View>
        <View className='form-item'>
          <Text className='form-label'>密码</Text>
          <Input
            className='form-input'
            password
            placeholder='请输入密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <View
          className={`btn-primary ${loading ? 'btn-disabled' : ''}`}
          onClick={loading ? undefined : handleLogin}
        >
          {loading ? '登录中...' : '登录'}
        </View>

        <View className='login-footer'>
          <Text className='login-footer-text'>还没有账号？</Text>
          <Text
            className='login-link'
            onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}
          >
            立即注册
          </Text>
        </View>

        <View className='login-hint'>
          <Text className='login-hint-text'>忘记密码？请联系管理员重置</Text>
        </View>
      </View>
    </View>
  )
}
