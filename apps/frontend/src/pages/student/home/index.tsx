import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { configApi, packagesApi, bookingsApi, usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { redirectToHome } from '../../../utils/auth'
import './index.scss'

const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A',
  LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A',
  LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const m = d.getMonth() + 1, day = d.getDate(), h = d.getHours(), min = d.getMinutes()
  return `${m}/${day} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export default function StudentHome() {
  const { user, token } = useAuthStore()
  const [banners, setBanners] = useState<{ id: string; imageUrl: string }[]>([])
  const [siteName, setSiteName] = useState('Tiger网球俱乐部')
  const [coaches, setCoaches] = useState<{ id: string; name: string; avatarUrl?: string; specialty?: string }[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])

  useEffect(() => {
    // 公开数据
    configApi.banners().then((data: any) => setBanners(data))
    configApi.site().then((data: any) => setSiteName(data.site_name || 'Tiger网球俱乐部'))
    usersApi.coaches().then((data: any) => setCoaches(data))

    // 登录后数据
    if (token && user) {
      packagesApi.studentPackages(user.id).then((data: any) => {
        const now = new Date()
        setPackages(data.filter((p: any) => !p.isExpired && p.remainingLessons > 0))
      })
      bookingsApi.list({ status: 'CONFIRMED' }).then((data: any) => {
        const now = new Date()
        setUpcomingBookings(
          data.list
            .filter((b: any) => new Date(b.startTime) > now)
            .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 3)
        )
      })
    }
  }, [token, user])

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: '待确认', cls: 'badge--pending' },
    CONFIRMED: { label: '已确认', cls: 'badge--confirmed' },
    COMPLETED: { label: '已完成', cls: 'badge--completed' },
    CANCELLED: { label: '已取消', cls: 'badge--cancelled' },
  }

  return (
    <View className='page'>
      {/* Banner */}
      <View className='hero'>
        {banners.length > 0 ? (
          <Swiper className='hero-swiper' autoplay circular indicatorDots indicatorActiveColor='#fff'>
            {banners.map((b) => (
              <SwiperItem key={b.id}>
                <Image className='hero-img' src={b.imageUrl} mode='aspectFill' />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className='hero-placeholder'>
            <View className='hero-bg' />
          </View>
        )}
        <View className='hero-overlay'>
          <Text className='hero-name'>{siteName}</Text>
          <Text className='hero-sub'>广州 · 专业网球培训</Text>
        </View>
      </View>

      <View className='page-content'>
        {/* 登录后：课时卡 */}
        {token && user && packages.length > 0 && (
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>我的课时</Text>
              <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/student/profile/index' })}>全部 ›</Text>
            </View>
            {packages.slice(0, 1).map((p) => (
              <View key={p.id} className='pkg-card'>
                <View className='pkg-left'>
                  <Text className='pkg-label'>当前套餐</Text>
                  <Text className='pkg-name'>{p.templateName}</Text>
                  <View className='pkg-tag'><Text>{p.type === 'PRIVATE' ? '私教课' : '团课'}</Text></View>
                  <Text className='pkg-expire'>有效期至 {new Date(p.endDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}</Text>
                </View>
                <View className='pkg-right'>
                  <Text className='pkg-num'>{p.remainingLessons}</Text>
                  <Text className='pkg-unit'>节可用</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 登录后：即将上课 */}
        {token && user && upcomingBookings.length > 0 && (
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>即将上课</Text>
              <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/student/booking/index' })}>全部 ›</Text>
            </View>
            {upcomingBookings.map((b, i) => {
              const s = STATUS_MAP[b.status] || STATUS_MAP.PENDING
              return (
                <View key={b.id} className={`upcoming-card ${i === 0 ? 'upcoming-card--first' : ''}`}>
                  <View className={`upcoming-icon ${i === 0 ? 'upcoming-icon--first' : ''}`}>
                    <Text>🎾</Text>
                  </View>
                  <View className='upcoming-info'>
                    <Text className='upcoming-title'>私教课 · {b.coach.name}</Text>
                    <Text className='upcoming-meta'>{formatTime(b.startTime)}{b.venue ? ` · ${b.venue}` : ''}</Text>
                  </View>
                  <View className={`badge ${s.cls}`}><Text>{s.label}</Text></View>
                </View>
              )
            })}
          </View>
        )}

        {/* 未登录：登录引导 */}
        {!token && (
          <View className='section'>
            <View className='login-guide' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
              <Text className='login-guide-text'>登录后可预约课程，查看段位与课时</Text>
              <View className='btn-primary'><Text>立即登录</Text></View>
            </View>
          </View>
        )}

        {/* 教练团队 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>教练团队</Text>
            <Text className='section-more'>全部 ›</Text>
          </View>
          <ScrollView scrollX className='coaches-scroll'>
            {coaches.map((c) => (
              <View key={c.id} className='coach-card' onClick={() => Taro.navigateTo({ url: `/pages/student/booking/index?coachId=${c.id}` })}>
                <View className='coach-avatar'>
                  {c.avatarUrl
                    ? <Image className='coach-avatar-img' src={c.avatarUrl} mode='aspectFill' />
                    : <Text className='coach-avatar-text'>{c.name[0]}</Text>
                  }
                </View>
                <Text className='coach-name'>{c.name}</Text>
                {c.specialty && <View className='coach-tag'><Text>{c.specialty}</Text></View>}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  )
}
