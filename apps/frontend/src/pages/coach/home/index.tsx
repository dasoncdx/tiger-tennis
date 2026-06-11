import TabBar from '../../../components/TabBar'
import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { bookingsApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

function fmt(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function CoachHome() {
  useEffect(() => { requireAuth('COACH') }, [])
  const { user } = useAuthStore()
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  const [todayBookings, setTodayBookings] = useState<any[]>([])

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{show:boolean;bookingId:string;venue:string}>({show:false,bookingId:'',venue:''})
  const [confirming, setConfirming] = useState(false)

  function loadPending() {
    bookingsApi.list({ status: 'PENDING' }).then((d: any) => setPendingBookings(d.list || []))
  }

  useEffect(() => {
    if (!user) return
    loadPending()
    bookingsApi.list({ status: 'CONFIRMED' }).then((d: any) => {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0)
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
      setTodayBookings((d.list||[]).filter((b:any) => {
        const t = new Date(b.startTime)
        return t >= todayStart && t <= todayEnd
      }).sort((a:any,b:any) => new Date(a.startTime).getTime()-new Date(b.startTime).getTime()))
    })
  }, [user])

  async function doConfirm() {
    setConfirming(true)
    try {
      await bookingsApi.confirm(confirmModal.bookingId, confirmModal.venue || undefined)
      Taro.showToast({ title: '已确认，场地信息已同步', icon: 'success' })
      setConfirmModal({ show: false, bookingId: '', venue: '' })
      loadPending()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
    } finally {
      setConfirming(false)
    }
  }

  async function rejectBooking(id: string) {
    Taro.showModal({
      title: '拒绝预约',
      editable: true,
      placeholderText: '请填写拒绝原因（必填）',
      success: async (res) => {
        if (!res.confirm) return
        if (!res.content) return Taro.showToast({ title: '请填写拒绝原因', icon: 'none' })
        try {
          await bookingsApi.reject(id, res.content)
          Taro.showToast({ title: '已拒绝', icon: 'success' })
          loadPending()
        } catch (e: any) {
          Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
        }
      },
    })
  }

  return (
    <View className='coach-home'>
      {/* 顶部Banner：删除「教练」小字和红点 */}
      <View className='coach-header'>
        <Text className='coach-welcome'>你好，{user?.name}</Text>
      </View>

      <View className='page-content'>
        {/* 今日课程：完整时间 + 学员/场地右侧对齐 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>今日课程</Text>
            <Text className='section-count'>{todayBookings.length} 节</Text>
          </View>
          {todayBookings.length === 0 && <View className='empty'><Text>今日暂无课程</Text></View>}
          {todayBookings.map(b => (
            <View key={b.id} className='today-card'>
              <View className='today-card-left'>
                <Text className='today-time-range'>{fmt(b.startTime)}–{fmt(b.endTime)}</Text>
              </View>
              <View className='today-card-right'>
                <Text className='today-student'>{b.student?.name}</Text>
                <Text className='today-venue'>{b.venue || '场地待定'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 待处理预约 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>待处理预约</Text>
            {pendingBookings.length > 0 && (
              <View className='badge-count'><Text>{pendingBookings.length}</Text></View>
            )}
          </View>
          {pendingBookings.length === 0 && <View className='empty'><Text>暂无待处理预约</Text></View>}
          {pendingBookings.map(b => (
            <View key={b.id} className='pending-card'>
              <Text className='pending-student'>{b.student?.name}</Text>
              <Text className='pending-time'>
                {`${new Date(b.startTime).getMonth()+1}月${new Date(b.startTime).getDate()}日 `}
                {fmt(b.startTime)}–{fmt(b.endTime)}
              </Text>
              {b.remark && <Text className='pending-remark'>备注：{b.remark}</Text>}
              <View className='pending-actions'>
                <View className='btn-confirm'
                  onClick={() => setConfirmModal({ show: true, bookingId: b.id, venue: '' })}>
                  <Text>确认预约</Text>
                </View>
                <View className='btn-reject' onClick={() => rejectBooking(b.id)}>
                  <Text>拒绝</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 确认预约弹窗（填写场地） */}
      {confirmModal.show && (
        <View className='modal-mask' onClick={() => setConfirmModal({show:false,bookingId:'',venue:''})}>
          <View className='confirm-modal' onClick={e => e.stopPropagation()}>
            <Text className='modal-title'>确认预约</Text>
            <Text className='modal-label'>上课场地</Text>
            <Input
              className='modal-input'
              placeholder='请填写场地（如：1号球场）'
              value={confirmModal.venue}
              onInput={e => setConfirmModal(prev => ({...prev, venue: e.detail.value}))}
            />
            <Text className='modal-tip'>场地信息将同步展示给学员</Text>
            <View className='modal-actions'>
              <View className='modal-btn-cancel'
                onClick={() => setConfirmModal({show:false,bookingId:'',venue:''})}>
                <Text>取消</Text>
              </View>
              <View className={`modal-btn-ok ${confirming?'disabled':''}`}
                onClick={confirming ? undefined : doConfirm}>
                <Text>{confirming ? '提交中...' : '确认'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <TabBar active='home' role='COACH' />
    </View>
  )
}
