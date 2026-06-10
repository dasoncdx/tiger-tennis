import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { configApi, packagesApi, bookingsApi, usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import TabBar from '../../../components/TabBar'
import './index.scss'

function formatTime(iso: string) {
  const d = new Date(iso)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}月${day}日 ${h}:${min}`
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING: { label: '待确认', bg: '#FFF3CD', color: '#FF9500', border: '#FF9500' },
  CONFIRMED: { label: '已确认', bg: '#D8F3DC', color: '#1B4332', border: '#1B4332' },
  COMPLETED: { label: '已完成', bg: '#F0F0F0', color: '#9A9A9A', border: '#C8C8C8' },
  CANCELLED: { label: '已取消', bg: '#FFE8E8', color: '#FF3B30', border: '#FF3B30' },
}

export default function StudentHome() {
  const { user, token, loadFromStorage } = useAuthStore()
  const [banners, setBanners] = useState<{ id: string; imageUrl: string }[]>([])
  const [siteName, setSiteName] = useState('Tiger网球俱乐部')
  const [siteIntro, setSiteIntro] = useState('广州 · 专业网球培训')
  const [coaches, setCoaches] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])

  useEffect(() => {
    loadFromStorage()
    configApi.banners().then((data: any) => setBanners(data || []))
    configApi.site().then((data: any) => {
      setSiteName(data.site_name || 'Tiger网球俱乐部')
      setSiteIntro(data.site_intro || '广州 · 专业网球培训')
    })
    usersApi.coaches().then((data: any) => setCoaches(data || []))
  }, [])

  useEffect(() => {
    if (!token || !user) return
    packagesApi.studentPackages(user.id).then((data: any) => {
      const valid = (data || []).filter((p: any) => !p.isExpired && p.remainingLessons > 0)
      setPackages(valid)
    })
    bookingsApi.list({ status: 'CONFIRMED' }).then((data: any) => {
      const now = new Date()
      const upcoming = (data.list || [])
        .filter((b: any) => new Date(b.startTime) > now)
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 3)
      setUpcomingBookings(upcoming)
    })
  }, [token, user])

  return (
    <View className='home-page'>
      {/* Banner */}
      <View className='hero'>
        {banners.length > 0 ? (
          <Swiper className='hero-swiper' autoplay circular indicatorDots
            indicatorColor='rgba(255,255,255,0.4)' indicatorActiveColor='#fff'>
            {banners.map((b) => (
              <SwiperItem key={b.id}>
                <Image className='hero-img' src={b.imageUrl} mode='aspectFill' />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className='hero-fallback' />
        )}
        <View className='hero-overlay'>
          <Text className='hero-name'>{siteName}</Text>
          <Text className='hero-sub'>{siteIntro}</Text>
        </View>
      </View>

      {/* 内容区 */}
      <View className='home-content'>

        {/* 未登录引导 */}
        {!token && (
          <View className='login-card' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            <View className='login-card-left'>
              <View className='login-avatar'>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8"/>
                  <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </View>
              <View>
                <Text className='login-hint'>登录 / 注册</Text>
                <Text className='login-hint-sub'>登录查看课时与预约</Text>
              </View>
            </View>
            <Text className='login-arrow'>›</Text>
          </View>
        )}

        {/* 快捷入口 */}
        <View className='quick-actions'>
          <View className='quick-item' onClick={() => token ? Taro.navigateTo({ url: '/pages/student/booking/index' }) : Taro.navigateTo({ url: '/pages/login/index' })}>
            <View className='quick-icon'>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="#1B4332" strokeWidth="1.8"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="#1B4332" strokeWidth="1.8"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </View>
            <Text className='quick-label'>约课</Text>
          </View>
          <View className='quick-item' onClick={() => Taro.navigateTo({ url: '/pages/student/tournament/index' })}>
            <View className='quick-icon'>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 21H16M12 17V21M7 4H17V9C17 12.31 14.76 15 12 15C9.24 15 7 12.31 7 9V4Z" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </View>
            <Text className='quick-label'>赛事</Text>
          </View>
          <View className='quick-item' onClick={() => Taro.navigateTo({ url: '/pages/student/profile/index' })}>
            <View className='quick-icon'>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#1B4332" strokeWidth="1.8"/>
                <circle cx="12" cy="9" r="2.5" stroke="#1B4332" strokeWidth="1.8"/>
              </svg>
            </View>
            <Text className='quick-label'>我的</Text>
          </View>
        </View>

        {/* 我的课时（登录后） */}
        {token && user && packages.length > 0 && (
          <View className='section'>
            <View className='section-hd'>
              <Text className='section-title'>我的课时</Text>
              <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/student/profile/index' })}>全部 ›</Text>
            </View>
            <View className='pkg-card'>
              <View className='pkg-card-left'>
                <Text className='pkg-tag-text'>{packages[0].type === 'PRIVATE' ? '私教课' : '团课'}</Text>
                <Text className='pkg-name'>{packages[0].templateName}</Text>
                <Text className='pkg-expire'>有效期至 {new Date(packages[0].endDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}</Text>
              </View>
              <View className='pkg-card-right'>
                <Text className='pkg-num'>{packages[0].remainingLessons}</Text>
                <Text className='pkg-unit'>节可用</Text>
              </View>
            </View>
          </View>
        )}

        {/* 即将上课（登录后） */}
        {token && user && upcomingBookings.length > 0 && (
          <View className='section'>
            <View className='section-hd'>
              <Text className='section-title'>即将上课</Text>
              <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/student/booking/index' })}>全部 ›</Text>
            </View>
            {upcomingBookings.map((b, i) => {
              const s = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING
              return (
                <View key={b.id} className='upcoming-item' style={{ borderLeftColor: s.border }}>
                  <View className='upcoming-icon-wrap' style={{ background: s.bg }}>
                    <Text className='upcoming-icon-emoji'>🎾</Text>
                  </View>
                  <View className='upcoming-info'>
                    <Text className='upcoming-title'>{b.coach?.name} · 私教课</Text>
                    <Text className='upcoming-meta'>{formatTime(b.startTime)}{b.venue ? ` · ${b.venue}` : ''}</Text>
                  </View>
                  <View className='upcoming-badge' style={{ background: s.bg }}>
                    <Text style={{ color: s.color, fontSize: '11px', fontWeight: '500' }}>{s.label}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* 教练团队 */}
        <View className='section'>
          <View className='section-hd'>
            <Text className='section-title'>教练团队</Text>
            <Text className='section-more'>全部 ›</Text>
          </View>
          <ScrollView scrollX className='coaches-row' enableFlex>
            {coaches.map((c) => (
              <View key={c.id} className='coach-card'
                onClick={() => token ? Taro.navigateTo({ url: `/pages/student/booking/index?coachId=${c.id}` }) : Taro.navigateTo({ url: '/pages/login/index' })}>
                <View className='coach-avatar-wrap'>
                  {c.avatarUrl
                    ? <Image className='coach-avatar-img' src={c.avatarUrl} mode='aspectFill' />
                    : <View className='coach-avatar-fallback'><Text className='coach-avatar-char'>{c.name[0]}</Text></View>
                  }
                </View>
                <Text className='coach-name'>{c.name}</Text>
                {c.specialty && <View className='coach-tag'><Text>{c.specialty}</Text></View>}
              </View>
            ))}
          </ScrollView>
        </View>

      </View>

      <TabBar active='home' role='STUDENT' />
    </View>
  )
}
