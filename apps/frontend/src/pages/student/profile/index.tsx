import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../stores/auth'
import { packagesApi, ntrpApi, notificationsApi } from '../../../services/api'
import './index.scss'

const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A', LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A', LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

const NOTIF_TYPE_LABEL: Record<string, string> = {
  BOOKING: '预约', NTRP: '段位', TOURNAMENT: '赛事', FEEDBACK: '月度反馈', SYSTEM: '系统',
}

export default function ProfilePage() {
  const { user, token, clearAuth, loadFromStorage } = useAuthStore()
  const [packages, setPackages] = useState<any[]>([])
  const [ntrpRecords, setNtrpRecords] = useState<any[]>([])
  const [ntrpApps, setNtrpApps] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [section, setSection] = useState<'main' | 'ntrp' | 'packages' | 'notifications'>('main')

  useEffect(() => {
    loadFromStorage()
    if (!token || !user) return
    packagesApi.studentPackages(user.id).then((data: any) => setPackages(data))
    ntrpApi.records(user.id).then((data: any) => setNtrpRecords(data))
    ntrpApi.applications({ studentId: user.id } as any).catch(() => {})
    notificationsApi.unreadCount().then((d: any) => setUnread(d.count))
    notificationsApi.list().then((data: any) => setNotifications(data))
  }, [token, user])

  function handleLogout() {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
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

  if (!token || !user) {
    return (
      <View className='page profile-page'>
        <View className='not-logged'>
          <Text className='not-logged-title'>登录 / 注册</Text>
          <Text className='not-logged-sub'>登录后查看段位、课时及消息</Text>
          <View className='btn-primary' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            <Text>登录</Text>
          </View>
          <View className='btn-outline' onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>
            <Text>注册</Text>
          </View>
        </View>
      </View>
    )
  }

  // 推导当前段位
  const latestNtrp = ntrpRecords[0]
  const currentLevel = ntrpApps.find((a: any) => a.status === 'APPROVED')?.toLevel ?? null

  // 通知页
  if (section === 'notifications') {
    return (
      <View className='page profile-page'>
        <View className='sub-header'>
          <Text className='back' onClick={() => setSection('main')}>‹</Text>
          <Text className='sub-title'>消息通知</Text>
          {unread > 0 && (
            <Text className='mark-all' onClick={async () => {
              await notificationsApi.markAllRead()
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
              setUnread(0)
            }}>全部已读</Text>
          )}
        </View>
        <View className='page-content'>
          {notifications.length === 0 && <View className='empty'><Text>暂无通知</Text></View>}
          {notifications.map((n) => (
            <View key={n.id} className={`notif-item ${n.isRead ? '' : 'unread'}`} onClick={() => !n.isRead && markRead(n.id)}>
              <View className='notif-dot' style={{ opacity: n.isRead ? 0 : 1 }} />
              <View className='notif-body'>
                <View className='notif-header'>
                  <Text className='notif-title'>{n.title}</Text>
                  <Text className='notif-type'>{NOTIF_TYPE_LABEL[n.type] || n.type}</Text>
                </View>
                <Text className='notif-content'>{n.content}</Text>
                <Text className='notif-time'>{new Date(n.createdAt).toLocaleString('zh-CN')}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className='page profile-page'>
      {/* 头部 */}
      <View className='profile-header'>
        <View className='profile-avatar'>
          <Text>{user.name[0]}</Text>
        </View>
        <View className='profile-info'>
          <Text className='profile-name'>{user.name}</Text>
          <Text className='profile-phone'>{user.phone}</Text>
        </View>
      </View>

      <View className='page-content'>
        {/* 段位卡 */}
        <View className='section' onClick={() => setSection('ntrp')}>
          <View className='ntrp-card'>
            <View className='ntrp-left'>
              <Text className='ntrp-label'>当前段位</Text>
              <Text className='ntrp-level'>{currentLevel ? NTRP_LABEL[currentLevel] : '未评定'}</Text>
              {latestNtrp && (
                <View className='ntrp-scores'>
                  {[
                    { label: '正手', val: latestNtrp.forehand },
                    { label: '反手', val: latestNtrp.backhand },
                    { label: '发球', val: latestNtrp.serve },
                    { label: '移动', val: latestNtrp.movement },
                    { label: '战术', val: latestNtrp.tactics },
                  ].map((s) => (
                    <View key={s.label} className='ntrp-score-item'>
                      <Text className='ntrp-score-val'>{s.val}</Text>
                      <Text className='ntrp-score-label'>{s.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Text className='ntrp-arrow'>›</Text>
          </View>
        </View>

        {/* 课时包 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>我的课时包</Text>
            <Text className='section-more' onClick={() => setSection('packages')}>全部 ›</Text>
          </View>
          {packages.filter((p) => !p.isExpired).slice(0, 2).map((p) => (
            <View key={p.id} className='package-row'>
              <View>
                <Text className='package-name'>{p.templateName}</Text>
                <Text className='package-expire'>有效期至 {new Date(p.endDate).toLocaleDateString('zh-CN')}</Text>
              </View>
              <View className='package-remain'>
                <Text className='package-num'>{p.remainingLessons}</Text>
                <Text className='package-unit'>/ {p.totalLessons} 节</Text>
              </View>
            </View>
          ))}
          {packages.filter((p) => !p.isExpired).length === 0 && (
            <Text className='empty-text'>暂无有效套餐，请联系管理员购买</Text>
          )}
        </View>

        {/* 消息通知 */}
        <View className='section'>
          <View className='menu-item' onClick={() => setSection('notifications')}>
            <Text className='menu-label'>消息通知</Text>
            <View style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unread > 0 && <View className='unread-badge'><Text>{unread}</Text></View>}
              <Text className='chevron'>›</Text>
            </View>
          </View>
        </View>

        {/* 退出 */}
        <View className='section'>
          <View className='logout-btn' onClick={handleLogout}>
            <Text>退出登录</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
