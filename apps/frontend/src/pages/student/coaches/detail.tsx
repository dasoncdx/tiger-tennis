import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import './detail.scss'

export default function CoachDetailPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const coachId = router.params.id
  const [coach, setCoach] = useState<any>(null)

  useEffect(() => {
    if (coachId) {
      usersApi.coachDetail(coachId).then((d: any) => setCoach(d))
    }
  }, [coachId])

  if (!coach) {
    return (
      <View style={{ padding: '40px', textAlign: 'center' }}>
        <Text style={{ color: '#9A9A9A' }}>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='coach-detail-page'>
      <View className='cd-nav'>
        <View className='cd-back' onClick={() => Taro.navigateBack()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </View>
        <Text className='cd-nav-title'>教练详情</Text>
      </View>

      {/* 教练基本信息 */}
      <View className='cd-hero'>
        <View className='cd-avatar-wrap'>
          {coach.avatarUrl
            ? <Image className='cd-avatar-img' src={coach.avatarUrl} mode='aspectFill' />
            : <View className='cd-avatar-fallback'><Text>{coach.name[0]}</Text></View>
          }
        </View>
        <View className='cd-basic'>
          <Text className='cd-name'>{coach.name}</Text>
          {coach.yearsExp && (
            <Text className='cd-exp'>从业 {coach.yearsExp} 年</Text>
          )}
          {coach.specialty && (
            <View className='cd-tag-row'>
              <View className='cd-tag'><Text>{coach.specialty}</Text></View>
            </View>
          )}
        </View>
      </View>

      {/* 个人简介 */}
      {coach.bio && (
        <View className='cd-section'>
          <Text className='cd-section-title'>个人简介</Text>
          <Text className='cd-bio'>{coach.bio}</Text>
        </View>
      )}

      {/* 预约按钮 */}
      <View className='cd-footer'>
        <View className='cd-btn-book' onClick={() => {
          if (!token) {
            Taro.navigateTo({ url: '/pages/login/index' })
            return
          }
          Taro.navigateTo({ url: `/pages/student/booking/index?coachId=${coach.id}` })
        }}>
          <Text>立即预约</Text>
        </View>
      </View>
    </View>
  )
}
