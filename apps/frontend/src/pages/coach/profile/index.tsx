import TabBar from '../../../components/TabBar'
import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

export default function CoachProfile() {
  useEffect(() => { requireAuth('COACH') }, [])
  const { user, clearAuth } = useAuthStore()

  return (
    <View className='page coach-profile'>
      <View className='profile-header'>
        <View className='profile-avatar'><Text>{user?.name?.[0]}</Text></View>
        <View>
          <Text className='profile-name'>{user?.name}</Text>
          <Text className='profile-role'>教练</Text>
        </View>
      </View>
      <View className='page-content'>
        <View className='section'>
          <View className='menu-item'>
            <Text className='menu-label'>手机号</Text>
            <Text className='menu-value'>{user?.phone}</Text>
          </View>
        </View>
        <View className='section'>
          <View className='logout-btn' onClick={() => Taro.showModal({
            title: '退出登录', content: '确定要退出吗？',
            success: (res) => { if (res.confirm) { clearAuth(); Taro.redirectTo({ url: '/pages/login/index' }) } },
          })}>
            <Text>退出登录</Text>
          </View>
        </View>
      </View>
      <TabBar active="profile" role="COACH" />
    </View>
  )
}
