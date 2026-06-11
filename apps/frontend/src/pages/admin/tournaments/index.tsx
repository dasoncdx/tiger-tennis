import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { request } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import '../students/index.scss'

export default function AdminTournaments() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [list, setList] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name:'', eventDate:'', venue:'', capacity:'32', registrationDeadline:'', grouping:''
  })

  function loadList() {
    request<any[]>('/tournaments', { needAuth: false }).then((d: any) => setList(d || []))
  }
  useEffect(() => { loadList() }, [])

  async function doAdd() {
    if (!form.name || !form.eventDate || !form.registrationDeadline) {
      return Taro.showToast({ title: '请填写必填项', icon: 'none' })
    }
    setAdding(true)
    try {
      await request('/tournaments', { method: 'POST', data: {
        name: form.name,
        eventDate: new Date(form.eventDate).toISOString(),
        venue: form.venue,
        capacity: Number(form.capacity),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        rules: '分组循环赛+单淘汰决赛',
        grouping: form.grouping,
        status: 'PUBLISHED',
      }})
      Taro.showToast({ title: '赛事已创建', icon: 'success' })
      setShowAdd(false)
      setForm({ name:'', eventDate:'', venue:'', capacity:'32', registrationDeadline:'', grouping:'' })
      loadList()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '创建失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  const STATUS_LABEL: Record<string,string> = { PUBLISHED:'报名中', CLOSED:'即将开始', FINISHED:'已结束', DRAFT:'草稿' }

  return (
    <View className='admin-page'>
      <View className='admin-nav'>
        <View className='nav-back' onClick={() => Taro.navigateBack()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </View>
        <Text className='nav-title'>赛事管理</Text>
        <View className='nav-action' onClick={() => setShowAdd(true)}><Text>+ 添加</Text></View>
      </View>

      <View className='list-body'>
        <Text className='list-count'>共 {list.length} 场赛事</Text>
        {list.length === 0 && <View className='empty-block'><Text>暂无赛事</Text></View>}
        {list.map(t => (
          <View key={t.id} className='list-item'>
            <View className='item-avatar' style={{ background:'linear-gradient(135deg,#FF9500,#FFB347)' }}>
              <Text style={{ fontSize:'18px' }}>🏆</Text>
            </View>
            <View className='item-info'>
              <Text className='item-name'>{t.name}</Text>
              <Text className='item-phone'>{new Date(t.eventDate).toLocaleDateString('zh-CN')} · {t.venue || '地点待定'} · {t.enrolledCount}/{t.capacity}人</Text>
            </View>
            <View className='status-pill' style={{ background: t.status==='PUBLISHED'?'#D8F3DC':'#F0F0F0' }}>
              <Text style={{ fontSize:'13px', color: t.status==='PUBLISHED'?'#1B4332':'#9A9A9A', fontWeight:'600' }}>
                {STATUS_LABEL[t.status]||t.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {showAdd && (
        <View className='modal-mask' onClick={() => setShowAdd(false)}>
          <View className='bottom-modal' onClick={(e:any) => e.stopPropagation()}>
            <Text className='modal-title'>添加赛事</Text>
            {[
              { label:'赛事名称 *', key:'name', placeholder:'如：Tiger杯第一届段位挑战赛', type:'text' },
              { label:'举办日期 *', key:'eventDate', placeholder:'格式：2025-07-10', type:'text' },
              { label:'比赛地点', key:'venue', placeholder:'如：广州天河网球中心', type:'text' },
              { label:'名额上限', key:'capacity', placeholder:'如：32', type:'number' },
              { label:'报名截止日期 *', key:'registrationDeadline', placeholder:'格式：2025-07-01', type:'text' },
              { label:'适合段位', key:'grouping', placeholder:'如：2.5-3.5', type:'text' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom:'12px' }}>
                <Text className='modal-label'>{f.label}</Text>
                <Input className='modal-input' type={f.type as any} placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onInput={(e:any) => setForm(prev => ({ ...prev, [f.key]: e.detail.value }))} />
              </View>
            ))}
            <View className={'modal-ok' + (adding?' disabled':'')} onClick={adding?undefined:doAdd}>
              <Text>{adding?'创建中...':'创建'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
