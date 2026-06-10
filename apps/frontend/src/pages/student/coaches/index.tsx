import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi } from '../../../services/api'
import './index.scss'

export default function CoachListPage() {
  const [coaches, setCoaches] = useState<any[]>([])

  useEffect(() => {
    usersApi.coaches().then((d: any) => setCoaches(d || []))
  }, [])

  return (
    <View className='coach-list-page'>
      <View className='page-nav'>
        <View className='nav-back' onClick={() => Taro.navigateBack()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </View>
        <Text className='nav-title'>全部教练</Text>
      </View>

      <View className='cl-content'>
        {coaches.map((c) => (
          <View key={c.id} className='cl-item'
            onClick={() => Taro.navigateTo({ url: `/pages/student/coaches/detail?id=${c.id}` })}>
            <View className='cl-avatar-wrap'>
              {c.avatarUrl
                ? <Image className='cl-avatar-img' src={c.avatarUrl} mode='aspectFill' />
                : <View className='cl-avatar-fallback'><Text>{c.name[0]}</Text></View>
              }
            </View>
            <View className='cl-info'>
              <Text className='cl-name'>{c.name}</Text>
              <View className='cl-tags'>
                {c.specialty && (
                  <View className='cl-tag'><Text>{c.specialty}</Text></View>
                )}
                {c.bio && (
                  <Text className='cl-bio'>{c.bio}</Text>
                )}
              </View>
            </View>
            <Text className='cl-chevron'>›</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
