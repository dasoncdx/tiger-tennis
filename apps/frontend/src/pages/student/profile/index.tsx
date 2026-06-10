import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../stores/auth'
import { packagesApi, ntrpApi, notificationsApi } from '../../../services/api'
import TabBar from '../../../components/TabBar'
import './index.scss'

const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A', LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A', LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

const NOTIF_TYPE_LABEL: Record<string, string> = {
  BOOKING: '预约', NTRP: '段位', TOURNAMENT: '赛事', FEEDBACK: '反馈', SYSTEM: '系统',
}

export default function ProfilePage() {
  const { user, token, clearAuth, loadFromStorage } = useAuthStore()
  const [packages, setPackages] = useState<any[]>([])
  const [ntrpRecords, setNtrpRecords] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [page, setPage] = useState<'main' | 'notifications'>('main')
  const [currentLevel, setCurrentLevel] = useState<string | null>(null)

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!token || !user) return
    packagesApi.studentPackages(user.id).then((d: any) => setPackages(d || []))
    ntrpApi.records(user.id).then((d: any) => setNtrpRecords(d || []))
    ntrpApi.applications({ status: 'APPROVED', pageSize: '1' } as any)
      .then((d: any) => {
        const list = d?.list || []
        if (list.length > 0) setCurrentLevel(list[0].toLevel)
      }).catch(() => {})
    notificationsApi.unreadCount().then((d: any) => setUnread(d.count || 0))
    notificationsApi.list().then((d: any) => setNotifications(d || []))
  }, [token, user])

  function handleLogout() {
    Taro.showModal({
      title: '退出登录', content: '确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          clearAuth()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  // 未登录
  if (!token || !user) {
    return (
      <View className='profile-page'>
        <View className='profile-header'>
          <View className='avatar-wrap'>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8"/>
              <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </View>
          <View>
            <Text className='profile-name'>登录 / 注册</Text>
            <Text className='profile-phone'>登录后查看段位与课时</Text>
          </View>
        </View>
        <View style={{ padding: '24px 16px' }}>
          <View className='btn-primary-block' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            <Text>立即登录</Text>
          </View>
          <View className='btn-outline-block' onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>
            <Text>注册账号</Text>
          </View>
        </View>
        <TabBar active='profile' role='STUDENT' />
      </View>
    )
  }

  // 通知页
  if (page === 'notifications') {
    return (
      <View className='profile-page'>
        <View className='sub-nav'>
          <View className='sub-nav-back' onClick={() => setPage('main')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </View>
          <Text className='sub-nav-title'>消息通知</Text>
          {unread > 0 && (
            <Text className='mark-all-btn' onClick={async () => {
              await notificationsApi.markAllRead()
              setNotifications((p) => p.map((n) => ({ ...n, isRead: true })))
              setUnread(0)
            }}>全部已读</Text>
          )}
        </View>
        <View style={{ padding: '12px 16px 80px' }}>
          {notifications.length === 0 && (
            <View className='empty-center'><Text>暂无通知</Text></View>
          )}
          {notifications.map((n) => (
            <View key={n.id} className={`notif-item ${n.isRead ? '' : 'unread'}`}
              onClick={() => !n.isRead && markRead(n.id)}>
              {!n.isRead && <View className='notif-dot' />}
              <View className='notif-body'>
                <View className='notif-hd'>
                  <Text className='notif-title'>{n.title}</Text>
                  <View className='notif-type-tag'><Text>{NOTIF_TYPE_LABEL[n.type] || n.type}</Text></View>
                </View>
                <Text className='notif-content'>{n.content}</Text>
                <Text className='notif-time'>{new Date(n.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          ))}
        </View>
        <TabBar active='profile' role='STUDENT' />
      </View>
    )
  }

  const latestRecord = ntrpRecords[0]
  const validPkgs = packages.filter((p) => !p.isExpired)
  const scores = latestRecord
    ? [
        { label: '正手', val: latestRecord.forehand },
        { label: '反手', val: latestRecord.backhand },
        { label: '发球', val: latestRecord.serve },
        { label: '移动', val: latestRecord.movement },
        { label: '战术', val: latestRecord.tactics },
      ]
    : []

  return (
    <View className='profile-page'>
      {/* 头部 */}
      <View className='profile-header'>
        <View className='avatar-wrap'>
          <Text className='avatar-char'>{user.name[0]}</Text>
        </View>
        <View className='profile-header-info'>
          <Text className='profile-name'>{user.name}</Text>
          <Text className='profile-phone'>{user.phone}</Text>
        </View>
      </View>

      <View className='profile-content'>
        {/* 段位卡 */}
        <View className='ntrp-card'>
          <View className='ntrp-card-left'>
            <Text className='ntrp-card-label'>当前段位</Text>
            <Text className='ntrp-card-level'>{currentLevel ? NTRP_LABEL[currentLevel] : '未评定'}</Text>
            {scores.length > 0 && (
              <View className='ntrp-scores'>
                {scores.map((s) => (
                  <View key={s.label} className='ntrp-score-item'>
                    <Text className='ntrp-score-num'>{s.val}</Text>
                    <Text className='ntrp-score-label'>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className='ntrp-card-right'>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
              <path d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.8)"/>
            </svg>
          </View>
        </View>

        {/* 课时包 */}
        <View className='profile-section'>
          <View className='ps-hd'>
            <Text className='ps-title'>我的课时包</Text>
          </View>
          {validPkgs.length === 0 && (
            <Text className='empty-hint'>暂无有效套餐，请联系管理员购买</Text>
          )}
          {validPkgs.map((p) => (
            <View key={p.id} className='pkg-row'>
              <View className='pkg-row-left'>
                <View className={`pkg-type-dot ${p.type === 'PRIVATE' ? 'private' : 'group'}`} />
                <View>
                  <Text className='pkg-row-name'>{p.templateName}</Text>
                  <Text className='pkg-row-expire'>有效期至 {new Date(p.endDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}</Text>
                </View>
              </View>
              <View className='pkg-row-right'>
                <Text className='pkg-row-num'>{p.remainingLessons}</Text>
                <Text className='pkg-row-unit'>/ {p.totalLessons}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 菜单列表 */}
        <View className='menu-list'>
          <View className='menu-item' onClick={() => setPage('notifications')}>
            <View className='menu-item-left'>
              <View className='menu-icon-wrap'>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8C18 6.4 17.37 4.97 16.36 3.89C15.35 2.77 13.75 2 12 2C10.25 2 8.65 2.77 7.64 3.89C6.63 4.97 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M13.73 21C13.55 21.3 13.3 21.55 13 21.73C12.7 21.91 12.36 22 12 22C11.64 22 11.3 21.91 11 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </View>
              <Text className='menu-item-label'>消息通知</Text>
            </View>
            <View className='menu-item-right'>
              {unread > 0 && <View className='unread-badge'><Text>{unread > 99 ? '99+' : unread}</Text></View>}
              <Text className='menu-chevron'>›</Text>
            </View>
          </View>

          <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/student/my-tournaments/index' })}>
            <View className='menu-item-left'>
              <View className='menu-icon-wrap'>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M8 21H16M12 17V21M7 4H17V9C17 12.31 14.76 15 12 15C9.24 15 7 12.31 7 9V4Z" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </View>
              <Text className='menu-item-label'>我的赛事</Text>
            </View>
            <Text className='menu-chevron'>›</Text>
          </View>
        </View>

        {/* 退出 */}
        <View className='logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>

      <TabBar active='profile' role='STUDENT' />
    </View>
  )
}
