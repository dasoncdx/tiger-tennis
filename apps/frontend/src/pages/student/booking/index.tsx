import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { groupClassesApi, bookingsApi, packagesApi, usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import TabBar from '../../../components/TabBar'
import './index.scss'

type MainTab = 'private' | 'group'

// 未来14天
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

// 生成当天 6:00-22:00 全时段（每小时一格）
function getDaySlots(date: Date) {
  const slots = []
  for (let h = 6; h < 22; h++) {
    const start = new Date(date)
    start.setHours(h, 0, 0, 0)
    const end = new Date(date)
    end.setHours(h + 1, 0, 0, 0)
    slots.push({ start, end, label: `${String(h).padStart(2,'0')}:00–${String(h+1).padStart(2,'0')}:00` })
  }
  return slots
}

// 判断某时段是否已被预约
function isSlotBooked(slotStart: Date, slotEnd: Date, bookedSlots: any[]) {
  return bookedSlots.some((b: any) => {
    const bs = new Date(b.startTime).getTime()
    const be = new Date(b.endTime).getTime()
    const ss = slotStart.getTime()
    const se = slotEnd.getTime()
    return bs < se && be > ss
  })
}

const WEEK_NAMES = ['日','一','二','三','四','五','六']

export default function BookingPage() {
  useEffect(() => { requireAuth('STUDENT') }, [])
  const { user } = useAuthStore()

  const [mainTab, setMainTab] = useState<MainTab>('private')
  const [coaches, setCoaches] = useState<any[]>([])
  const [selectedCoach, setSelectedCoach] = useState<any>(null)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [bookedSlots, setBookedSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{start:Date;end:Date;label:string}|null>(null)
  const [myPackages, setMyPackages] = useState<any[]>([])
  const [selectedPackage, setSelectedPackage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [groupClasses, setGroupClasses] = useState<any[]>([])
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')

  const days = getNext14Days()
  const selectedDate = days[selectedDayIdx]
  const allSlots = getDaySlots(selectedDate)
  const now = new Date()

  const loadBookings = useCallback(() => {
    if (user) bookingsApi.list().then((d:any) => setMyBookings(d.list||[]))
  }, [user])

  useEffect(() => {
    usersApi.coaches().then((d:any) => setCoaches(d||[]))
    if (mainTab === 'group') groupClassesApi.list().then((d:any) => setGroupClasses(d||[]))
    if (user) {
      packagesApi.studentPackages(user.id).then((d:any) =>
        setMyPackages((d||[]).filter((p:any)=>p.type==='PRIVATE'&&!p.isExpired&&p.remainingLessons>0))
      )
      loadBookings()
    }
  }, [mainTab, user])

  async function selectCoach(coach: any) {
    setSelectedCoach(coach)
    setSelectedSlot(null)
    setSelectedDayIdx(0)
    const data:any = await bookingsApi.coachSchedule(coach.id)
    setBookedSlots(data.booked||[])
  }

  async function submitBooking() {
    if (!selectedSlot||!selectedPackage||!user||!selectedCoach) return
    setSubmitting(true)
    try {
      await bookingsApi.create({
        coachId: selectedCoach.id,
        startTime: selectedSlot.start.toISOString(),
        endTime: selectedSlot.end.toISOString(),
        packageId: selectedPackage,
      })
      Taro.showToast({ title: '预约成功，等待教练确认', icon: 'success' })
      setSelectedCoach(null)
      setSelectedSlot(null)
      loadBookings()
    } catch (e:any) {
      Taro.showToast({ title: e.message||'预约失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_MAP:Record<string,{label:string;cls:string}> = {
    PENDING: {label:'待确认',cls:'badge-pending'},
    CONFIRMED: {label:'已确认',cls:'badge-confirmed'},
    COMPLETED: {label:'已完成',cls:'badge-completed'},
    CANCELLED: {label:'已取消',cls:'badge-cancelled'},
  }

  const filteredBookings = bookingStatusFilter==='all'
    ? myBookings
    : myBookings.filter(b=>b.status===bookingStatusFilter)

  return (
    <View className='booking-page'>
      {/* 主Tab */}
      <View className='main-tabs'>
        {(['private','group'] as MainTab[]).map(t => (
          <View key={t} className={`main-tab ${mainTab===t?'active':''}`}
            onClick={()=>{setMainTab(t);setSelectedCoach(null)}}>
            <Text>{t==='private'?'私教课':'团课'}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className='booking-scroll'>

        {/* ── 私教：选教练 ── */}
        {mainTab==='private' && !selectedCoach && (
          <View className='section-wrap'>
            <Text className='step-hint'>选择教练</Text>
            {coaches.map(c => (
              <View key={c.id} className='coach-list-item' onClick={()=>selectCoach(c)}>
                <View className='cli-avatar'>
                  {c.avatarUrl
                    ? <Image className='cli-avatar-img' src={c.avatarUrl} mode='aspectFill'/>
                    : <View className='cli-avatar-fallback'><Text>{c.name[0]}</Text></View>
                  }
                </View>
                <View className='cli-info'>
                  <Text className='cli-name'>{c.name}</Text>
                  <Text className='cli-spec'>{c.specialty||'专业教练'}</Text>
                </View>
                <Text className='chevron'>›</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 私教：选日期+时段 ── */}
        {mainTab==='private' && selectedCoach && (
          <View className='section-wrap'>
            {/* 已选教练 */}
            <View className='selected-coach-bar'>
              <View className='cli-avatar' style={{width:'40px',height:'40px'}}>
                {selectedCoach.avatarUrl
                  ? <Image className='cli-avatar-img' src={selectedCoach.avatarUrl} mode='aspectFill'/>
                  : <View className='cli-avatar-fallback'><Text>{selectedCoach.name[0]}</Text></View>
                }
              </View>
              <Text className='scb-name'>{selectedCoach.name}</Text>
              <Text className='scb-change' onClick={()=>setSelectedCoach(null)}>换一个</Text>
            </View>

            {/* 日期横滑 */}
            <Text className='step-hint' style={{marginTop:'16px'}}>选择日期</Text>
            <ScrollView scrollX className='date-scroll' enableFlex>
              {days.map((d,i) => (
                <View key={i}
                  className={`date-item ${selectedDayIdx===i?'active':''}`}
                  onClick={()=>{setSelectedDayIdx(i);setSelectedSlot(null)}}>
                  <Text className='date-week'>{i===0?'今天':`周${WEEK_NAMES[d.getDay()]}`}</Text>
                  <Text className='date-num'>{d.getMonth()+1}/{d.getDate()}</Text>
                </View>
              ))}
            </ScrollView>

            {/* 时段网格：6:00-22:00 每小时一格 */}
            <Text className='step-hint' style={{marginTop:'16px'}}>
              选择时段（{selectedDate.getMonth()+1}月{selectedDate.getDate()}日）
            </Text>
            <View className='time-grid'>
              {allSlots.map((slot, idx) => {
                const booked = isSlotBooked(slot.start, slot.end, bookedSlots)
                const past = slot.start <= now
                const disabled = booked || past
                const active = selectedSlot?.label === slot.label
                return (
                  <View key={idx}
                    className={`time-slot ${active?'active':''} ${disabled?'disabled':''}`}
                    onClick={()=>!disabled&&setSelectedSlot(slot)}>
                    <Text className='time-slot-text'>{slot.label}</Text>
                    {booked && <Text className='time-slot-sub'>已预约</Text>}
                  </View>
                )
              })}
            </View>

            {/* 确认区 */}
            {selectedSlot && (
              <View className='confirm-card'>
                <Text className='confirm-title'>选择消课套餐</Text>
                {myPackages.length===0 && <Text className='empty-text'>暂无可用私教套餐，请联系管理员</Text>}
                {myPackages.map(p => (
                  <View key={p.id}
                    className={`pkg-option ${selectedPackage===p.id?'selected':''}`}
                    onClick={()=>setSelectedPackage(p.id)}>
                    <Text className='pkg-option-name'>{p.templateName}</Text>
                    <Text className='pkg-option-remain'>剩余 {p.remainingLessons} 节</Text>
                  </View>
                ))}
                <View
                  className={`btn-confirm ${(!selectedPackage||submitting)?'disabled':''}`}
                  onClick={!selectedPackage||submitting?undefined:submitBooking}>
                  <Text>{submitting?'提交中...':`确认预约 · ${selectedDate.getMonth()+1}月${selectedDate.getDate()}日 ${selectedSlot.label}`}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── 团课 ── */}
        {mainTab==='group' && (
          <View className='section-wrap'>
            {groupClasses.map(gc => (
              <View key={gc.id} className='group-card'>
                <View className='group-card-hd'>
                  <Text className='group-name'>{gc.name}</Text>
                  <View className={`group-badge ${gc.isFull?'full':'open'}`}>
                    <Text>{gc.isFull?'已满':'报名中'}</Text>
                  </View>
                </View>
                <Text className='group-meta'>教练：{gc.coachName}</Text>
                <Text className='group-meta'>
                  {gc.classType==='RECURRING'
                    ?`每周${WEEK_NAMES[gc.weekday]} ${gc.startTimeStr}–${gc.endTimeStr}`:'限期班'}
                </Text>
                <Text className='group-meta'>
                  {gc.ntrpRange?`适合 ${gc.ntrpRange} ·`:''} {gc.enrolledCount}/{gc.capacity} 人
                </Text>
                {!gc.isFull && (
                  <View className='btn-enroll' onClick={()=>Taro.showModal({
                    title:'确认报名',content:`报名参加「${gc.name}」？`,
                    success:async res=>{
                      if(!res.confirm) return
                      try{
                        await groupClassesApi.enroll(gc.id)
                        Taro.showToast({title:'报名成功',icon:'success'})
                        groupClassesApi.list().then((d:any)=>setGroupClasses(d||[]))
                      }catch(e:any){Taro.showToast({title:e.message||'失败',icon:'none'})}
                    }
                  })}>
                    <Text>立即报名</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── 我的预约 ── */}
        <View className='section-wrap' style={{marginTop:'8px',paddingBottom:'16px'}}>
          <Text className='section-title-text'>我的预约</Text>
          <ScrollView scrollX className='status-tabs' enableFlex>
            {[{key:'all',label:'全部'},{key:'PENDING',label:'待确认'},{key:'CONFIRMED',label:'已确认'},{key:'COMPLETED',label:'已完成'}].map(t=>(
              <View key={t.key}
                className={`status-tab ${bookingStatusFilter===t.key?'active':''}`}
                onClick={()=>setBookingStatusFilter(t.key)}>
                <Text>{t.label}</Text>
              </View>
            ))}
          </ScrollView>

          {filteredBookings.length===0 && <View className='empty-wrap'><Text>暂无预约记录</Text></View>}
          {filteredBookings.map(b=>{
            const s = STATUS_MAP[b.status]||STATUS_MAP.PENDING
            const start = new Date(b.startTime)
            return (
              <View key={b.id} className='booking-item'>
                <View className='booking-date-col'>
                  <Text className='booking-month'>{start.getMonth()+1}月</Text>
                  <Text className='booking-day'>{start.getDate()}</Text>
                  <Text className='booking-weekday'>周{WEEK_NAMES[start.getDay()]}</Text>
                </View>
                <View className='booking-info-col'>
                  <Text className='booking-name'>私教课 · {b.coach?.name}</Text>
                  <Text className='booking-time'>
                    {String(start.getHours()).padStart(2,'0')}:{String(start.getMinutes()).padStart(2,'0')}
                    –{String(new Date(b.endTime).getHours()).padStart(2,'0')}:{String(new Date(b.endTime).getMinutes()).padStart(2,'0')}
                  </Text>
                  {b.venue && <Text className='booking-venue'>{b.venue}</Text>}
                </View>
                <View>
                  <View className={`status-badge ${s.cls}`}><Text>{s.label}</Text></View>
                  {b.status==='PENDING' && (
                    <Text className='cancel-text' onClick={()=>Taro.showModal({
                      title:'取消预约',content:'确定要取消这个预约吗？',
                      success:async res=>{if(res.confirm){await bookingsApi.cancel(b.id);Taro.showToast({title:'已取消',icon:'success'});loadBookings()}}
                    })}>取消</Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <TabBar active='booking' role='STUDENT'/>
    </View>
  )
}
