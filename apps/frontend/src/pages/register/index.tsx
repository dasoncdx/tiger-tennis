import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '../../services/api'
import './index.scss'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT', remark: '' })
  const [loading, setLoading] = useState(false)

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleRegister() {
    if (!form.name || !form.phone || !form.password) {
      return Taro.showToast({ title: '请填写完整信息', icon: 'none' })
    }
    if (form.password !== form.confirmPassword) {
      return Taro.showToast({ title: '两次密码不一致', icon: 'none' })
    }
    setLoading(true)
    try {
      await authApi.register({ name: form.name, phone: form.phone, password: form.password, role: form.role, remark: form.remark })
      Taro.showModal({
        title: '注册成功',
        content: '账号已提交，等待管理员审批后即可登录',
        showCancel: false,
        success: () => Taro.navigateBack(),
      })
    } catch (e: any) {
      Taro.showToast({ title: e.message || '注册失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='register-page'>
      <View className='register-header'>
        <Text className='register-title'>创建账号</Text>
        <Text className='register-sub'>注册后等待管理员审批激活</Text>
      </View>

      <View className='register-form'>
        {/* 角色选择 */}
        <View className='role-selector'>
          {(['STUDENT', 'COACH'] as const).map((r) => (
            <View
              key={r}
              className={`role-option ${form.role === r ? 'role-option--active' : ''}`}
              onClick={() => update('role', r)}
            >
              <Text>{r === 'STUDENT' ? '学员' : '教练'}</Text>
            </View>
          ))}
        </View>

        <View className='form-item'>
          <Text className='form-label'>姓名</Text>
          <Input className='form-input' placeholder='请输入真实姓名' value={form.name} onInput={(e) => update('name', e.detail.value)} maxlength={10} />
        </View>
        <View className='form-item'>
          <Text className='form-label'>手机号</Text>
          <Input className='form-input' type='number' placeholder='请输入手机号' value={form.phone} onInput={(e) => update('phone', e.detail.value)} maxlength={11} />
        </View>
        <View className='form-item'>
          <Text className='form-label'>密码</Text>
          <Input className='form-input' password placeholder='至少3位' value={form.password} onInput={(e) => update('password', e.detail.value)} />
        </View>
        <View className='form-item'>
          <Text className='form-label'>确认密码</Text>
          <Input className='form-input' password placeholder='再次输入密码' value={form.confirmPassword} onInput={(e) => update('confirmPassword', e.detail.value)} />
        </View>
        <View className='form-item'>
          <Text className='form-label'>备注（选填）</Text>
          <Input className='form-input' placeholder='可填写自我介绍或说明' value={form.remark} onInput={(e) => update('remark', e.detail.value)} maxlength={100} />
        </View>

        <View className={`btn-primary ${loading ? 'btn-disabled' : ''}`} onClick={loading ? undefined : handleRegister}>
          {loading ? '提交中...' : '提交注册'}
        </View>

        <View className='back-link' onClick={() => Taro.navigateBack()}>
          <Text>已有账号？返回登录</Text>
        </View>
      </View>
    </View>
  )
}
