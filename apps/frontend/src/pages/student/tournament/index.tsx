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
}

export default function TournamentPage() {
  const { user, token } = useAuthStore()
  const [list, setList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const statusMap: Record<string, string | undefined> = {
      all: undefined, open: 'PUBLISHED', upcoming: 'CLOSED', finished: 'FINISHED',
    }
    tournamentsApi.list(statusMap[activeTab]).then((data) => setList(data))
  }, [activeTab])

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
            tournamentsApi.list().then((data) => setList(data))
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
          <View key={t.key} className={`tab-header-item ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
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
        {list.map((t) => (
          <View key={t.id} className='tournament-card'>
            {t.coverUrl && <Image className='tournament-cover' src={t.coverUrl} mode='aspectFill' />}
            <View className='tournament-body'>
              <View className='tournament-header'>
                <Text className='tournament-name'>{t.name}</Text>
                {t.status !== 'DRAFT' && (
                  <View className={`badge ${STATUS_CLS[t.status] || ''}`}>
                    <Text>{STATUS_LABEL[t.status] || t.status}</Text>
                  </View>
                )}
              </View>
              <Text className='tournament-meta'>
                举办日期：{new Date(t.eventDate).toLocaleDateString('zh-CN')}
              </Text>
              <Text className='tournament-meta'>
                报名截止：{new Date(t.registrationDeadline).toLocaleDateString('zh-CN')}
              </Text>
              <Text className='tournament-meta'>
                名额：{t.enrolledCount}/{t.capacity}
              </Text>
              {t.status === 'PUBLISHED' && t.enrolledCount < t.capacity && new Date() <= new Date(t.registrationDeadline) && (
                <View className='btn-primary' onClick={() => handleEnter(t.id, t.name)}>
                  <Text>立即报名</Text>
                </View>
              )}
              {t.status === 'PUBLISHED' && t.enrolledCount >= t.capacity && (
                <View className='btn-disabled'><Text>名额已满</Text></View>
              )}
            </View>
          </View>
        ))}
      </View>
      <TabBar active='tournament' role='STUDENT' />
    </View>
  )
}
