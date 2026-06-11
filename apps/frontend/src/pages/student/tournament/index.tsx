import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../stores/auth'
import { request } from '../../../services/api'
import TabBar from '../../../components/TabBar'
import './index.scss'

export default function TournamentPage() {
  const { user, token } = useAuthStore()
  // list 里每条直接带 isEnrolled 字段，避免异步竞态
  const [list, setList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)

  const loadList = useCallback(async (tab: string) => {
    setLoading(true)
    try {
      const statusMap: Record<string, string> = {
        all: '', open: 'PUBLISHED', upcoming: 'CLOSED', finished: 'FINISHED',
      }
      const qs = statusMap[tab] ? `?status=${statusMap[tab]}` : ''
      const data: any = await request(`/tournaments${qs}`, { needAuth: false })
      const tournaments = (data || []) as any[]

      // 如果已登录，一次性拉取我的报名记录，避免逐条查询
      let myEntryIds = new Set<string>()
      if (token && user) {
        try {
          const myEntries: any = await request('/tournaments/my-entries', { needAuth: true })
          ;(myEntries || []).forEach((e: any) => myEntryIds.add(e.tournamentId))
        } catch {}
      }

      // 将 isEnrolled 直接合并到每条数据
      const merged = tournaments.map((t: any) => ({
        ...t,
        isEnrolled: myEntryIds.has(t.id),
      }))
      setList(merged)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    loadList(activeTab)
  }, [activeTab, loadList])

  async function handleEnter(id: string, name: string) {
    if (!token) return Taro.navigateTo({ url: '/pages/login/index' })
    Taro.showModal({
      title: '确认报名',
      content: `确定报名参加「${name}」？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await request(`/tournaments/${id}/entries`, { method: 'POST' })
          Taro.showToast({ title: '报名成功！', icon: 'success' })
          // 报名成功：直接在本地更新该条状态，无需等待网络
          setList(prev => prev.map(t =>
            t.id === id
              ? { ...t, isEnrolled: true, enrolledCount: (t.enrolledCount || 0) + 1 }
              : t
          ))
        } catch (e: any) {
          Taro.showToast({ title: e.message || '报名失败', icon: 'none' })
        }
      },
    })
  }

  const STATUS_LABEL: Record<string, string> = {
    DRAFT: '草稿', PUBLISHED: '报名中', CLOSED: '即将开始', FINISHED: '已结束',
  }
  const STATUS_CLS: Record<string, string> = {
    PUBLISHED: 'badge--confirmed', CLOSED: 'badge--pending', FINISHED: 'badge--completed',
  }

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'open', label: '报名中' },
    { key: 'upcoming', label: '即将开始' },
    { key: 'finished', label: '已结束' },
  ]

  return (
    <View className='page'>
      <View className='tab-header'>
        {tabs.map(t => (
          <View key={t.key} className={`tab-header-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      <View className='page-content'>
        {loading && list.length === 0 && (
          <View className='empty' style={{ marginTop: 60 }}><Text>加载中...</Text></View>
        )}
        {!loading && list.length === 0 && (
          <View className='empty' style={{ marginTop: 60 }}><Text>暂无赛事</Text></View>
        )}

        {list.map(t => {
          const isFull = (t.enrolledCount || 0) >= t.capacity
          const isExpired = new Date() > new Date(t.registrationDeadline)
          const canEnroll = t.status === 'PUBLISHED' && !isFull && !isExpired && !t.isEnrolled

          return (
            <View key={t.id} className='tournament-card'>
              {t.coverUrl && <Image className='tournament-cover' src={t.coverUrl} mode='aspectFill' />}
              <View className='tournament-body'>
                <View className='tournament-header'>
                  <Text className='tournament-name'>{t.name}</Text>
                  {/* 已报名显示绿色「已报名」，否则显示赛事状态 */}
                  {t.isEnrolled ? (
                    <View className='badge badge--enrolled'><Text>已报名</Text></View>
                  ) : t.status !== 'DRAFT' && (
                    <View className={`badge ${STATUS_CLS[t.status] || ''}`}>
                      <Text>{STATUS_LABEL[t.status] || t.status}</Text>
                    </View>
                  )}
                </View>

                <Text className='tournament-meta'>
                  举办日期：{new Date(t.eventDate).toLocaleDateString('zh-CN')}
                </Text>
                {t.venue && (
                  <Text className='tournament-meta'>比赛地点：{t.venue}</Text>
                )}
                <Text className='tournament-meta'>
                  报名截止：{new Date(t.registrationDeadline).toLocaleDateString('zh-CN')}
                </Text>
                <Text className='tournament-meta'>
                  名额：{t.enrolledCount}/{t.capacity}
                </Text>

                {canEnroll && (
                  <View className='btn-primary' onClick={() => handleEnter(t.id, t.name)}>
                    <Text>立即报名</Text>
                  </View>
                )}
                {!t.isEnrolled && isFull && (
                  <View className='btn-disabled'><Text>名额已满</Text></View>
                )}
                {t.isEnrolled && (
                  <View className='btn-enrolled'><Text>✓ 已报名，期待比赛</Text></View>
                )}
              </View>
            </View>
          )
        })}
      </View>
      <TabBar active='tournament' role='STUDENT' />
    </View>
  )
}
