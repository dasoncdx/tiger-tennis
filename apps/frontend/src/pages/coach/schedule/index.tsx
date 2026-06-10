import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { bookingsApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

function getWeekDays() {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export default function CoachSchedule() {
  useEffect(() => { requireAuth('COACH') }, [])
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  const weekDays = getWeekDays()

  useEffect(() => {
    if (!user) return
    bookingsApi.list().then((data: any) => setBookings(data.list || []))
  }, [user])

  const selectedDate = weekDays[selectedDay]
  const dayBookings = bookings.filter((b) => {
    const bd = new Date(b.startTime)
    return (
      bd.getDate() === selectedDate.getDate() &&
      bd.getMonth() === selectedDate.getMonth() &&
      bd.getFullYear() === selectedDate.getFullYear()
    )
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const STATUS_LABEL: Record<string, string> = {
    PENDING: '待确认', CONFIRMED: '已确认', COMPLETED: '已完成', CANCELLED: '已取消',
  }
  const STATUS_CLS: Record<string, string> = {
    PENDING: 'badge--pending', CONFIRMED: 'badge--confirmed',
    COMPLETED: 'badge--completed', CANCELLED: 'badge--cancelled',
  }

  async function handleComplete(id: string) {
    try {
      await bookingsApi.complete(id)
      Taro.showToast({ title: '已完成并核销课时', icon: 'success' })
      bookingsApi.list().then((data: any) => setBookings(data.list || []))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  }

  const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <View className='page coach-schedule'>
      {/* 日期选择 */}
      <View className='day-selector'>
        {weekDays.map((d, i) => (
          <View key={i} className={`day-item ${selectedDay === i ? 'active' : ''}`} onClick={() => setSelectedDay(i)}>
            <Text className='day-name'>周{DAY_NAMES[d.getDay()]}</Text>
            <Text className='day-num'>{d.getDate()}</Text>
            {bookings.filter((b) => {
              const bd = new Date(b.startTime)
              return bd.getDate() === d.getDate() && bd.getMonth() === d.getMonth()
            }).length > 0 && <View className='day-dot' />}
          </View>
        ))}
      </View>

      <View className='page-content'>
        <View className='day-label'>
          <Text>
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 · 周{DAY_NAMES[selectedDate.getDay()]}
          </Text>
          <Text className='booking-count'>{dayBookings.length} 节课</Text>
        </View>

        {dayBookings.length === 0 && <View className='empty'><Text>当天暂无课程</Text></View>}

        {dayBookings.map((b) => (
          <View key={b.id} className='schedule-card'>
            <View className='schedule-time-bar' />
            <View className='schedule-body'>
              <View className='schedule-top'>
                <Text className='schedule-time'>
                  {String(new Date(b.startTime).getHours()).padStart(2, '0')}:{String(new Date(b.startTime).getMinutes()).padStart(2, '0')}
                  –{String(new Date(b.endTime).getHours()).padStart(2, '0')}:{String(new Date(b.endTime).getMinutes()).padStart(2, '0')}
                </Text>
                <View className={`badge ${STATUS_CLS[b.status]}`}><Text>{STATUS_LABEL[b.status]}</Text></View>
              </View>
              <Text className='schedule-student'>{b.student?.name} · 私教课</Text>
              {b.venue && <Text className='schedule-venue'>{b.venue}</Text>}
              {b.remark && <Text className='schedule-remark'>备注：{b.remark}</Text>}
              {b.status === 'CONFIRMED' && (
                <View className='schedule-actions'>
                  <View className='btn-complete' onClick={() => Taro.showModal({
                    title: '标记完成',
                    content: '标记为已完成并自动核销学员课时？',
                    success: (res) => { if (res.confirm) handleComplete(b.id) },
                  })}>
                    <Text>标记完成</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
