import TabBar from '../../../components/TabBar'
import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { bookingsApi, notificationsApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function CoachHome() {
  useEffect(() => { requireAuth('COACH') }, [])
  const { user } = useAuthStore()
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    bookingsApi.list({ status: 'PENDING' }).then((data: any) => setPendingBookings(data.list || []))
    bookingsApi.list({ status: 'CONFIRMED' }).then((data: any) => {
      const now = new Date()
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
      setTodayBookings((data.list || []).filter((b: any) => {
        const t = new Date(b.startTime)
        return t >= todayStart && t <= todayEnd
      }))
    })
    notificationsApi.unreadCount().then((d: any) => setUnread(d.count))
  }, [user])

  async function confirmBooking(id: string) {
    Taro.showModal({
      title: '确认预约',
      editable: true,
      placeholderText: '填写场地信息（选填）',
      success: async (res) => {
        if (res.confirm) {
          try {
            await bookingsApi.confirm(id, res.content || undefined)
            Taro.showToast({ title: '已确认', icon: 'success' })
            bookingsApi.list({ status: 'PENDING' }).then((data: any) => setPendingBookings(data.list || []))
          } catch (e: any) {
            Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  async function rejectBooking(id: string) {
    Taro.showModal({
      title: '拒绝预约',
      editable: true,
      placeholderText: '请填写拒绝原因（必填）',
      success: async (res) => {
        if (res.confirm) {
          if (!res.content) return Taro.showToast({ title: '请填写拒绝原因', icon: 'none' })
          try {
            await bookingsApi.reject(id, res.content)
            Taro.showToast({ title: '已拒绝', icon: 'success' })
            bookingsApi.list({ status: 'PENDING' }).then((data: any) => setPendingBookings(data.list || []))
          } catch (e: any) {
            Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  return (
    <View className='page coach-home'>
      <View className='coach-header'>
        <View>
          <Text className='coach-welcome'>你好，{user?.name}</Text>
          <Text className='coach-role'>教练</Text>
        </View>
        {unread > 0 && <View className='unread-dot'><Text>{unread}</Text></View>}
      </View>

      <View className='page-content'>
        {/* 今日课程 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>今日课程</Text>
            <Text className='section-count'>{todayBookings.length} 节</Text>
          </View>
          {todayBookings.length === 0 && <View className='empty'><Text>今日暂无课程</Text></View>}
          {todayBookings.map((b) => (
            <View key={b.id} className='today-booking'>
              <View className='today-time'>
                <Text>{String(new Date(b.startTime).getHours()).padStart(2, '0')}:{String(new Date(b.startTime).getMinutes()).padStart(2, '0')}</Text>
              </View>
              <View className='today-info'>
                <Text className='today-name'>{b.student?.name}</Text>
                <Text className='today-venue'>{b.venue || '场地待定'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 待处理约课 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>待处理预约</Text>
            {pendingBookings.length > 0 && (
              <View className='badge-count'><Text>{pendingBookings.length}</Text></View>
            )}
          </View>
          {pendingBookings.length === 0 && <View className='empty'><Text>暂无待处理预约</Text></View>}
          {pendingBookings.map((b) => (
            <View key={b.id} className='pending-card'>
              <View className='pending-info'>
                <Text className='pending-name'>{b.student?.name}</Text>
                <Text className='pending-time'>{formatDateTime(b.startTime)} – {String(new Date(b.endTime).getHours()).padStart(2, '0')}:{String(new Date(b.endTime).getMinutes()).padStart(2, '0')}</Text>
                {b.remark && <Text className='pending-remark'>备注：{b.remark}</Text>}
              </View>
              <View className='pending-actions'>
                <View className='btn-confirm' onClick={() => confirmBooking(b.id)}><Text>确认</Text></View>
                <View className='btn-reject' onClick={() => rejectBooking(b.id)}><Text>拒绝</Text></View>
              </View>
            </View>
          ))}
        </View>
      </View>
      <TabBar active='home' role='COACH' />
    </View>
  )
}
