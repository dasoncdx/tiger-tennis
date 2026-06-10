import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupClassesApi, bookingsApi, packagesApi, usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

type Tab = 'private' | 'group'
type Step = 'coach' | 'time' | 'confirm'

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatHHMM(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function BookingPage() {
  useEffect(() => { requireAuth('STUDENT') }, [])

  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('private')

  // 私教约课状态
  const [step, setStep] = useState<Step>('coach')
  const [coaches, setCoaches] = useState<any[]>([])
  const [selectedCoach, setSelectedCoach] = useState<any>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [bookedSlots, setBookedSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // 团课状态
  const [groupClasses, setGroupClasses] = useState<any[]>([])

  // 我的预约
  const [myBookings, setMyBookings] = useState<any[]>([])

  const [activeSection, setActiveSection] = useState<'booking' | 'mine'>('booking')

  useEffect(() => {
    if (tab === 'private') {
      usersApi.coaches().then((data: any) => setCoaches(data))
      if (user) {
        packagesApi.studentPackages(user.id).then((data: any) =>
          setPackages(data.filter((p: any) => p.type === 'PRIVATE' && !p.isExpired && p.remainingLessons > 0))
        )
      }
    }
    if (tab === 'group') {
      groupClassesApi.list().then((data: any) => setGroupClasses(data))
    }
    if (user) {
      bookingsApi.list().then((data: any) => setMyBookings(data.list || []))
    }
  }, [tab, user])

  async function selectCoach(coach: any) {
    setSelectedCoach(coach)
    const data: any = await bookingsApi.coachSchedule(coach.id)
    setSchedules(data.schedules || [])
    setBookedSlots(data.booked || [])
    setStep('time')
  }

  function isSlotBooked(slot: any) {
    return bookedSlots.some((b: any) =>
      new Date(b.startTime).getTime() === new Date(slot.startTime).getTime()
    )
  }

  async function submitBooking() {
    if (!selectedSlot || !selectedPackage || !user) return
    setSubmitting(true)
    try {
      await bookingsApi.create({
        coachId: selectedCoach.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        packageId: selectedPackage,
      })
      Taro.showToast({ title: '预约成功，等待教练确认', icon: 'success' })
      setStep('coach')
      setSelectedCoach(null)
      setSelectedSlot(null)
      bookingsApi.list().then((data: any) => setMyBookings(data.list || []))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '预约失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelBooking(id: string) {
    try {
      await bookingsApi.cancel(id)
      Taro.showToast({ title: '已取消', icon: 'success' })
      bookingsApi.list().then((data: any) => setMyBookings(data.list || []))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '取消失败', icon: 'none' })
    }
  }

  const STATUS_LABEL: Record<string, string> = {
    PENDING: '待确认', CONFIRMED: '已确认', COMPLETED: '已完成', CANCELLED: '已取消',
  }
  const STATUS_CLS: Record<string, string> = {
    PENDING: 'badge--pending', CONFIRMED: 'badge--confirmed', COMPLETED: 'badge--completed', CANCELLED: 'badge--cancelled',
  }

  return (
    <View className='page'>
      {/* 顶部Tab */}
      <View className='tab-header'>
        {(['private', 'group'] as Tab[]).map((t) => (
          <View key={t} className={`tab-header-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <Text>{t === 'private' ? '私教课' : '团课'}</Text>
          </View>
        ))}
      </View>

      <View className='page-content'>
        {/* 私教课 */}
        {tab === 'private' && (
          <View>
            {step === 'coach' && (
              <View>
                <View className='section-title-row'><Text className='section-title'>选择教练</Text></View>
                {coaches.map((c) => (
                  <View key={c.id} className='coach-list-item' onClick={() => selectCoach(c)}>
                    <View className='coach-list-avatar'>
                      {c.avatarUrl
                        ? <Image className='coach-list-avatar-img' src={c.avatarUrl} mode='aspectFill' />
                        : <Text className='coach-list-avatar-text'>{c.name[0]}</Text>
                      }
                    </View>
                    <View className='coach-list-info'>
                      <Text className='coach-list-name'>{c.name}</Text>
                      <Text className='coach-list-spec'>{c.specialty || '专业教练'}</Text>
                    </View>
                    <Text className='chevron'>›</Text>
                  </View>
                ))}
              </View>
            )}

            {step === 'time' && selectedCoach && (
              <View>
                <View className='step-header'>
                  <Text className='back-btn' onClick={() => { setStep('coach'); setSelectedCoach(null) }}>‹ 返回</Text>
                  <Text className='step-title'>{selectedCoach.name} · 选择时段</Text>
                </View>
                {schedules.length === 0 && (
                  <View className='empty'><Text>暂无可预约时段</Text></View>
                )}
                <View className='time-grid'>
                  {schedules.map((s) => {
                    const booked = isSlotBooked(s)
                    const isPast = new Date(s.startTime) <= new Date()
                    const disabled = booked || isPast
                    return (
                      <View
                        key={s.id}
                        className={`time-slot ${selectedSlot?.id === s.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && setSelectedSlot(s)}
                      >
                        <Text>{formatDate(new Date(s.startTime))}</Text>
                        <Text>{formatHHMM(s.startTime)}–{formatHHMM(s.endTime)}</Text>
                      </View>
                    )
                  })}
                </View>
                {selectedSlot && (
                  <View className='confirm-panel'>
                    <Text className='confirm-label'>选择课时套餐</Text>
                    {packages.length === 0 && <Text className='empty-text'>暂无可用私教套餐，请联系管理员</Text>}
                    {packages.map((p) => (
                      <View
                        key={p.id}
                        className={`pkg-option ${selectedPackage === p.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPackage(p.id)}
                      >
                        <Text>{p.templateName}</Text>
                        <Text className='pkg-remain'>剩余 {p.remainingLessons} 节</Text>
                      </View>
                    ))}
                    <View
                      className={`btn-primary ${(!selectedPackage || submitting) ? 'disabled' : ''}`}
                      onClick={selectedPackage && !submitting ? submitBooking : undefined}
                    >
                      <Text>{submitting ? '提交中...' : '确认预约'}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* 团课 */}
        {tab === 'group' && (
          <View>
            {groupClasses.map((gc) => (
              <View key={gc.id} className='group-card'>
                <View className='group-card-header'>
                  <Text className='group-name'>{gc.name}</Text>
                  <View className={`badge ${gc.isFull ? 'badge--cancelled' : 'badge--confirmed'}`}>
                    <Text>{gc.isFull ? '已满' : '报名中'}</Text>
                  </View>
                </View>
                <Text className='group-meta'>{gc.coachName} · {gc.ntrpRange ? `适合 ${gc.ntrpRange}` : ''}</Text>
                <Text className='group-time'>
                  {gc.classType === 'RECURRING'
                    ? `每周${['日','一','二','三','四','五','六'][gc.weekday]} ${gc.startTimeStr}–${gc.endTimeStr}`
                    : '限期班'
                  }
                </Text>
                <Text className='group-capacity'>{gc.enrolledCount}/{gc.capacity} 人</Text>
                {!gc.isFull && (
                  <View className='btn-outline' onClick={() => Taro.showModal({
                    title: '确认报名',
                    content: `报名 ${gc.name}？`,
                    success: async (res) => {
                      if (res.confirm) {
                        try {
                          await groupClassesApi.enroll(gc.id)
                          Taro.showToast({ title: '报名成功', icon: 'success' })
                          groupClassesApi.list().then((data: any) => setGroupClasses(data))
                        } catch (e: any) {
                          Taro.showToast({ title: e.message || '报名失败', icon: 'none' })
                        }
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

        {/* 我的预约 */}
        <View className='section' style={{ marginTop: 28 }}>
          <View className='section-header'>
            <Text className='section-title'>我的预约</Text>
          </View>
          {myBookings.length === 0 && <View className='empty'><Text>暂无预约记录</Text></View>}
          {myBookings.slice(0, 5).map((b) => (
            <View key={b.id} className='booking-item'>
              <View className='booking-info'>
                <Text className='booking-title'>私教课 · {b.coach?.name}</Text>
                <Text className='booking-meta'>{new Date(b.startTime).toLocaleString('zh-CN')}{b.venue ? ` · ${b.venue}` : ''}</Text>
              </View>
              <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <View className={`badge ${STATUS_CLS[b.status]}`}><Text>{STATUS_LABEL[b.status]}</Text></View>
                {b.status === 'PENDING' && (
                  <Text className='cancel-btn' onClick={() => Taro.showModal({
                    title: '确认取消',
                    content: '确定要取消这个预约吗？',
                    success: (res) => { if (res.confirm) cancelBooking(b.id) },
                  })}>取消</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
