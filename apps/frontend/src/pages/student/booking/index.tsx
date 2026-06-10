import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupClassesApi, bookingsApi, packagesApi, usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import TabBar from '../../../components/TabBar'
import './index.scss'

type MainTab = 'private' | 'group'

// 生成未来14天日期数组
function getNext14Days() {
  const days: Date[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

const WEEK_NAMES = ['日', '一', '二', '三', '四', '五', '六']

function fmt(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function BookingPage() {
  useEffect(() => { requireAuth('STUDENT') }, [])
  const { user } = useAuthStore()

  const [mainTab, setMainTab] = useState<MainTab>('private')

  // 私教约课状态
  const [coaches, setCoaches] = useState<any[]>([])
  const [selectedCoach, setSelectedCoach] = useState<any>(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const [schedules, setSchedules] = useState<any[]>([])
  const [bookedSlots, setBookedSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [myPackages, setMyPackages] = useState<any[]>([])
  const [selectedPackage, setSelectedPackage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 团课状态
  const [groupClasses, setGroupClasses] = useState<any[]>([])

  // 我的预约
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [bookingTab, setBookingTab] = useState('all')

  const days = getNext14Days()
  const selectedDate = days[selectedDay]

  const loadBookings = useCallback(() => {
    if (user) bookingsApi.list().then((d: any) => setMyBookings(d.list || []))
  }, [user])

  useEffect(() => {
    usersApi.coaches().then((d: any) => setCoaches(d || []))
    if (mainTab === 'group') groupClassesApi.list().then((d: any) => setGroupClasses(d || []))
    if (user) {
      packagesApi.studentPackages(user.id).then((d: any) =>
        setMyPackages((d || []).filter((p: any) => p.type === 'PRIVATE' && !p.isExpired && p.remainingLessons > 0))
      )
      loadBookings()
    }
  }, [mainTab, user])

  async function selectCoach(coach: any) {
    setSelectedCoach(coach)
    setSelectedSlot(null)
    const data: any = await bookingsApi.coachSchedule(coach.id)
    setSchedules(data.schedules || [])
    setBookedSlots(data.booked || [])
  }

  // 按天过滤时段
  const daySlots = schedules.filter((s) => {
    const d = new Date(s.startTime)
    return d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth()
  })

  function isBooked(slot: any) {
    return bookedSlots.some((b: any) =>
      new Date(b.startTime).getTime() === new Date(slot.startTime).getTime()
    )
  }

  async function submitBooking() {
    if (!selectedSlot || !selectedPackage || !user || !selectedCoach) return
    setSubmitting(true)
    try {
      await bookingsApi.create({
        coachId: selectedCoach.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        packageId: selectedPackage,
      })
      Taro.showToast({ title: '预约成功，等待确认', icon: 'success' })
      setSelectedCoach(null)
      setSelectedSlot(null)
      loadBookings()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '预约失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: '待确认', cls: 'badge-pending' },
    CONFIRMED: { label: '已确认', cls: 'badge-confirmed' },
    COMPLETED: { label: '已完成', cls: 'badge-completed' },
    CANCELLED: { label: '已取消', cls: 'badge-cancelled' },
  }

  const filteredBookings = bookingTab === 'all' ? myBookings :
    myBookings.filter((b) => b.status === bookingTab)

  return (
    <View className='booking-page'>
      {/* 主Tab */}
      <View className='main-tabs'>
        {(['private', 'group'] as MainTab[]).map((t) => (
          <View key={t} className={`main-tab ${mainTab === t ? 'active' : ''}`}
            onClick={() => { setMainTab(t); setSelectedCoach(null) }}>
            <Text>{t === 'private' ? '私教课' : '团课'}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className='booking-scroll'>
        {/* ── 私教课 ── */}
        {mainTab === 'private' && !selectedCoach && (
          <View className='section-wrap'>
            <Text className='step-hint'>选择教练</Text>
            {coaches.map((c) => (
              <View key={c.id} className='coach-list-item' onClick={() => selectCoach(c)}>
                <View className='coach-li-avatar'>
                  {c.avatarUrl
                    ? <Image className='coach-li-img' src={c.avatarUrl} mode='aspectFill' />
                    : <View className='coach-li-fallback'><Text>{c.name[0]}</Text></View>
                  }
                </View>
                <View className='coach-li-info'>
                  <Text className='coach-li-name'>{c.name}</Text>
                  <Text className='coach-li-spec'>{c.specialty || '专业教练'}</Text>
                </View>
                <Text className='chevron'>›</Text>
              </View>
            ))}
          </View>
        )}

        {mainTab === 'private' && selectedCoach && (
          <View className='section-wrap'>
            {/* 教练信息 */}
            <View className='selected-coach-bar'>
              <View className='coach-li-avatar' style={{ width: '40px', height: '40px' }}>
                {selectedCoach.avatarUrl
                  ? <Image className='coach-li-img' src={selectedCoach.avatarUrl} mode='aspectFill' />
                  : <View className='coach-li-fallback'><Text>{selectedCoach.name[0]}</Text></View>
                }
              </View>
              <Text className='selected-coach-name'>{selectedCoach.name}</Text>
              <Text className='change-btn' onClick={() => setSelectedCoach(null)}>换一个</Text>
            </View>

            {/* 日期选择 */}
            <Text className='step-hint' style={{ marginTop: '16px' }}>选择日期</Text>
            <ScrollView scrollX className='date-scroll' enableFlex>
              {days.map((d, i) => {
                const isToday = i === 0
                const active = selectedDay === i
                return (
                  <View key={i} className={`date-item ${active ? 'active' : ''}`}
                    onClick={() => { setSelectedDay(i); setSelectedSlot(null) }}>
                    <Text className='date-week'>{isToday ? '今天' : `周${WEEK_NAMES[d.getDay()]}`}</Text>
                    <Text className='date-num'>{d.getMonth() + 1}/{d.getDate()}</Text>
                  </View>
                )
              })}
            </ScrollView>

            {/* 时段 */}
            <Text className='step-hint' style={{ marginTop: '16px' }}>
              选择时段（{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日）
            </Text>
            {daySlots.length === 0 && (
              <View className='empty-slots'><Text>当天暂无可用时段</Text></View>
            )}
            <View className='time-grid'>
              {daySlots.map((s) => {
                const booked = isBooked(s)
                const past = new Date(s.startTime) <= new Date()
                const disabled = booked || past
                const active = selectedSlot?.id === s.id
                return (
                  <View key={s.id}
                    className={`time-slot ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && setSelectedSlot(s)}>
                    <Text className='time-slot-text'>
                      {fmt(new Date(s.startTime))}–{fmt(new Date(s.endTime))}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* 确认区 */}
            {selectedSlot && (
              <View className='confirm-card'>
                <Text className='confirm-title'>选择消课套餐</Text>
                {myPackages.length === 0 && (
                  <Text className='empty-text'>暂无可用私教套餐，请联系管理员</Text>
                )}
                {myPackages.map((p) => (
                  <View key={p.id}
                    className={`pkg-option ${selectedPackage === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPackage(p.id)}>
                    <Text className='pkg-option-name'>{p.templateName}</Text>
                    <Text className='pkg-option-remain'>剩余 {p.remainingLessons} 节</Text>
                  </View>
                ))}
                <View
                  className={`btn-confirm ${(!selectedPackage || submitting) ? 'disabled' : ''}`}
                  onClick={!selectedPackage || submitting ? undefined : submitBooking}>
                  <Text>{submitting ? '提交中...' : `确认预约 · ${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 ${fmt(new Date(selectedSlot.startTime))}`}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── 团课 ── */}
        {mainTab === 'group' && (
          <View className='section-wrap'>
            {groupClasses.map((gc) => (
              <View key={gc.id} className='group-card'>
                <View className='group-card-hd'>
                  <Text className='group-name'>{gc.name}</Text>
                  <View className={`group-badge ${gc.isFull ? 'full' : 'open'}`}>
                    <Text>{gc.isFull ? '已满' : '报名中'}</Text>
                  </View>
                </View>
                <Text className='group-meta'>教练：{gc.coachName}</Text>
                <Text className='group-meta'>
                  {gc.classType === 'RECURRING'
                    ? `每周${WEEK_NAMES[gc.weekday]} ${gc.startTimeStr}–${gc.endTimeStr}`
                    : '限期班'}
                </Text>
                <Text className='group-meta'>
                  {gc.ntrpRange ? `适合 ${gc.ntrpRange} 段位` : ''} · {gc.enrolledCount}/{gc.capacity} 人
                </Text>
                {!gc.isFull && (
                  <View className='btn-enroll' onClick={() => Taro.showModal({
                    title: '确认报名',
                    content: `报名参加「${gc.name}」？`,
                    success: async (res) => {
                      if (!res.confirm) return
                      try {
                        await groupClassesApi.enroll(gc.id)
                        Taro.showToast({ title: '报名成功', icon: 'success' })
                        groupClassesApi.list().then((d: any) => setGroupClasses(d || []))
                      } catch (e: any) {
                        Taro.showToast({ title: e.message || '报名失败', icon: 'none' })
                      }
                    },
                  })}>
                    <Text>立即报名</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── 我的预约 ── */}
        <View className='section-wrap' style={{ marginTop: '8px' }}>
          <Text className='section-title-text'>我的预约</Text>
          <ScrollView scrollX className='status-tabs' enableFlex>
            {[
              { key: 'all', label: '全部' },
              { key: 'PENDING', label: '待确认' },
              { key: 'CONFIRMED', label: '已确认' },
              { key: 'COMPLETED', label: '已完成' },
            ].map((t) => (
              <View key={t.key}
                className={`status-tab ${bookingTab === t.key ? 'active' : ''}`}
                onClick={() => setBookingTab(t.key)}>
                <Text>{t.label}</Text>
              </View>
            ))}
          </ScrollView>

          {filteredBookings.length === 0 && (
            <View className='empty-wrap'><Text>暂无预约记录</Text></View>
          )}
          {filteredBookings.map((b) => {
            const s = STATUS_MAP[b.status] || STATUS_MAP.PENDING
            const start = new Date(b.startTime)
            return (
              <View key={b.id} className='booking-item'>
                <View className='booking-date-col'>
                  <Text className='booking-month'>{start.getMonth() + 1}月</Text>
                  <Text className='booking-day'>{start.getDate()}</Text>
                  <Text className='booking-weekday'>周{WEEK_NAMES[start.getDay()]}</Text>
                </View>
                <View className='booking-info-col'>
                  <Text className='booking-name'>私教课 · {b.coach?.name}</Text>
                  <Text className='booking-time'>{fmt(start)} – {fmt(new Date(b.endTime))}</Text>
                  {b.venue && <Text className='booking-venue'>{b.venue}</Text>}
                </View>
                <View>
                  <View className={`status-badge ${s.cls}`}><Text>{s.label}</Text></View>
                  {b.status === 'PENDING' && (
                    <Text className='cancel-text' onClick={() => Taro.showModal({
                      title: '取消预约', content: '确定要取消这个预约吗？',
                      success: async (res) => {
                        if (!res.confirm) return
                        await bookingsApi.cancel(b.id)
                        Taro.showToast({ title: '已取消', icon: 'success' })
                        loadBookings()
                      },
                    })}>取消</Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <TabBar active='booking' role='STUDENT' />
    </View>
  )
}
