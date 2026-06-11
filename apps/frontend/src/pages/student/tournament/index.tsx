import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../stores/auth'
import { request } from '../../../services/api'
import TabBar from '../../../components/TabBar'
import './index.scss'

const tournamentsApi = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return request<any[]>(`/tournaments${qs}`, { needAuth: false })
  },
  enter: (id: string) => request(`/tournaments/${id}/entries`, { method: 'POST' }),
  myEntry: (id: string) => request(`/tournaments/${id}/my-entry`, { needAuth: true }),
}

export default function TournamentPage() {
  const { user, token } = useAuthStore()
  const [list, setList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [checkingEntry, setCheckingEntry] = useState(false)

  async function loadList(tab: string) {
    const statusMap: Record<string, string | undefined> = {
      all: undefined, open: 'PUBLISHED', upcoming: 'CLOSED', finished: 'FINISHED',
    }
    const data = await tournamentsApi.list(statusMap[tab])
    setList(data || [])

    // 如果已登录，检查哪些赛事已报名
    if (token && user && data) {
      const ids = new Set<string>()
      await Promise.all((data as any[]).map(async (t: any) => {
        try {
          await tournamentsApi.myEntry(t.id)
          ids.add(t.id)
        } catch {}
      }))
      setEnrolledIds(ids)
    }
  }

  useEffect(() => {
    loadList(activeTab)
  }, [activeTab, token])

  async function handleEnter(id: string, name: string) {
    if (!token) return Taro.navigateTo({ url: '/pages/login/index' })
    Taro.showModal({
      title: '确认报名',
      content: `确定报名参加 ${name}？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await tournamentsApi.enter(id)
            Taro.showToast({ title: '报名成功', icon: 'success' })
            setEnrolledIds(prev => new Set([...prev, id]))
          } catch (e: any) {
            Taro.showToast({ title: e.message || '报名失败', icon: 'none' })
          }
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
        {tabs.map((t) => (
          <View key={t.key} className={`tab-header-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      <View className='page-content'>
        {list.length === 0 && (
          <View className='empty' style={{ marginTop: 60 }}>
            <Text>暂无赛事</Text>
          </View>
        )}
        {list.map((t) => {
          const isEnrolled = enrolledIds.has(t.id)
          const isFull = t.enrolledCount >= t.capacity
          const isExpired = new Date() > new Date(t.registrationDeadline)
          const canEnroll = t.status === 'PUBLISHED' && !isFull && !isExpired && !isEnrolled

          return (
            <View key={t.id} className='tournament-card'>
              {t.coverUrl && <Image className='tournament-cover' src={t.coverUrl} mode='aspectFill' />}
              <View className='tournament-body'>
                <View className='tournament-header'>
                  <Text className='tournament-name'>{t.name}</Text>
                  {/* 已报名显示「已报名」标签，否则显示赛事状态 */}
                  {isEnrolled ? (
                    <View className='badge badge--enrolled'>
                      <Text>已报名</Text>
                    </View>
                  ) : t.status !== 'DRAFT' && (
                    <View className={`badge ${STATUS_CLS[t.status] || ''}`}>
                      <Text>{STATUS_LABEL[t.status] || t.status}</Text>
                    </View>
                  )}
                </View>

                <Text className='tournament-meta'>
                  举办日期：{new Date(t.eventDate).toLocaleDateString('zh-CN')}
                </Text>
                {/* 比赛地点 */}
                {t.venue && (
                  <Text className='tournament-meta'>
                    比赛地点：{t.venue}
                  </Text>
                )}
                <Text className='tournament-meta'>
                  报名截止：{new Date(t.registrationDeadline).toLocaleDateString('zh-CN')}
                </Text>
                <Text className='tournament-meta'>
                  名额：{t.enrolledCount}/{t.capacity}
                </Text>

                {/* 按钮区域 */}
                {canEnroll && (
                  <View className='btn-primary' onClick={() => handleEnter(t.id, t.name)}>
                    <Text>立即报名</Text>
                  </View>
                )}
                {!isEnrolled && isFull && (
                  <View className='btn-disabled'><Text>名额已满</Text></View>
                )}
                {isEnrolled && (
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
