import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, ntrpApi, notificationsApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

export default function AdminDashboard() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const { user, clearAuth } = useAuthStore()
  const [stats, setStats] = useState({ students: 0, coaches: 0, pendingAccounts: 0, pendingNtrp: 0 })

  useEffect(() => {
    if (!user) return
    Promise.all([
      usersApi.students({ pageSize: '1' }) as any,
      usersApi.students({ pageSize: '1', status: 'PENDING' }) as any,
      ntrpApi.applications({ status: 'PENDING', pageSize: '1' }) as any,
    ]).then(([s, pending, ntrp]) => {
      setStats({
        students: s.total || 0,
        coaches: 0,
        pendingAccounts: pending.total || 0,
        pendingNtrp: (ntrp as any).total || 0,
      })
    }).catch(() => {})
  }, [user])

  const menus = [
    { label: '学员管理', icon: '👥', url: '/pages/admin/students/index' },
    { label: '教练管理', icon: '🎾', url: '/pages/admin/coaches/index' },
    { label: '课程管理', icon: '📅', url: '/pages/admin/courses/index' },
    { label: '段位管理', icon: '🏆', url: '/pages/admin/ntrp/index', badge: stats.pendingNtrp },
    { label: '赛事管理', icon: '🏅', url: '/pages/admin/tournaments/index' },
    { label: '财务', icon: '💰', url: '/pages/admin/finance/index' },
    { label: '设置', icon: '⚙️', url: '/pages/admin/settings/index', badge: stats.pendingAccounts },
  ]

  return (
    <View className='page admin-dashboard'>
      <View className='admin-header'>
        <View>
          <Text className='admin-title'>管理后台</Text>
          <Text className='admin-name'>{user?.name}</Text>
        </View>
        <Text className='logout' onClick={() => Taro.showModal({
          title: '退出', content: '确定退出？',
          success: (res) => { if (res.confirm) { clearAuth(); Taro.redirectTo({ url: '/pages/login/index' }) } },
        })}>退出</Text>
      </View>

      <View className='page-content'>
        {/* 数据概览 */}
        <View className='stats-grid'>
          <View className='stat-card'>
            <Text className='stat-num'>{stats.students}</Text>
            <Text className='stat-label'>学员总数</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-num' style={{ color: stats.pendingAccounts > 0 ? '#FF9500' : undefined }}>{stats.pendingAccounts}</Text>
            <Text className='stat-label'>待审批账号</Text>
          </View>
          <View className='stat-card'>
            <Text className='stat-num' style={{ color: stats.pendingNtrp > 0 ? '#FF9500' : undefined }}>{stats.pendingNtrp}</Text>
            <Text className='stat-label'>晋级待审批</Text>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className='section'>
          <View className='menu-grid'>
            {menus.map((m) => (
              <View key={m.label} className='menu-card' onClick={() => Taro.navigateTo({ url: m.url })}>
                <View className='menu-icon-wrap'>
                  <Text className='menu-icon'>{m.icon}</Text>
                  {m.badge! > 0 && <View className='menu-badge'><Text>{m.badge}</Text></View>}
                </View>
                <Text className='menu-label'>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}
