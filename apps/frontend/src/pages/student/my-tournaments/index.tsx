import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../stores/auth'
import { request } from '../../../services/api'
import './index.scss'

const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A', LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A', LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

export default function MyTournamentsPage() {
  const { user, token } = useAuthStore()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !user) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    // 直接用新接口一次性拿所有报名记录
    request<any[]>('/tournaments/my-entries', { needAuth: true })
      .then((data: any) => {
        setEntries(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, user])

  const STATUS_LABEL: Record<string, string> = {
    DRAFT: '草稿', PUBLISHED: '报名中', CLOSED: '即将开始', FINISHED: '已结束',
  }
  const STATUS_COLOR: Record<string, string> = {
    PUBLISHED: '#1B4332', CLOSED: '#FF9500', FINISHED: '#9A9A9A',
  }

  return (
    <View className='my-tournaments-page'>
      <View className='page-nav'>
        <View className='nav-back' onClick={() => Taro.navigateBack()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </View>
        <Text className='nav-title'>我的赛事</Text>
      </View>

      <View className='mt-content'>
        {loading && <View className='mt-loading'><Text>加载中...</Text></View>}

        {!loading && entries.length === 0 && (
          <View className='mt-empty'>
            <Text className='mt-empty-icon'>🏆</Text>
            <Text className='mt-empty-text'>暂未报名任何赛事</Text>
            <View className='mt-go-btn' onClick={() => Taro.navigateTo({ url: '/pages/student/tournament/index' })}>
              <Text>去看看赛事</Text>
            </View>
          </View>
        )}

        {entries.map(entry => {
          const t = entry.tournament
          if (!t) return null
          return (
            <View key={entry.id} className='mt-card'>
              <View className='mt-card-hd'>
                <Text className='mt-name'>{t.name}</Text>
                <View className='mt-status' style={{
                  background: STATUS_COLOR[t.status] ? `${STATUS_COLOR[t.status]}20` : '#F0F0F0'
                }}>
                  <Text style={{ color: STATUS_COLOR[t.status] || '#9A9A9A', fontSize: '14px', fontWeight: '600' }}>
                    {STATUS_LABEL[t.status] || t.status}
                  </Text>
                </View>
              </View>

              <View className='mt-info-list'>
                <View className='mt-info-row'>
                  <Text className='mt-info-label'>📅 比赛日期</Text>
                  <Text className='mt-info-value'>
                    {new Date(t.eventDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </View>
                {t.venue && (
                  <View className='mt-info-row'>
                    <Text className='mt-info-label'>📍 比赛地点</Text>
                    <Text className='mt-info-value'>{t.venue}</Text>
                  </View>
                )}
                {t.grouping && (
                  <View className='mt-info-row'>
                    <Text className='mt-info-label'>🎯 分组说明</Text>
                    <Text className='mt-info-value'>{t.grouping}</Text>
                  </View>
                )}
                <View className='mt-info-row'>
                  <Text className='mt-info-label'>🎾 报名段位</Text>
                  <Text className='mt-info-value'>{NTRP_LABEL[entry.ntrpSnapshot] || entry.ntrpSnapshot || '未评定'}</Text>
                </View>
                {entry.ranking != null && (
                  <View className='mt-info-row'>
                    <Text className='mt-info-label'>🏅 最终名次</Text>
                    <Text className='mt-info-value' style={{ color: '#1B4332', fontWeight: '700' }}>第 {entry.ranking} 名</Text>
                  </View>
                )}
              </View>

              <Text className='mt-enroll-date'>
                报名时间：{new Date(entry.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
