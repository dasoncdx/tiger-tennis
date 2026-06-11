import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { packagesApi } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import '../students/index.scss'

export default function AdminCourses() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [courses, setCourses] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name:'', type:'PRIVATE', totalLessons:'10', price:'0', validDays:'90', description:''
  })

  function loadCourses() {
    packagesApi.templates().then((d: any) => setCourses(d || []))
  }
  useEffect(() => { loadCourses() }, [])

  async function doAdd() {
    if (!form.name) return Taro.showToast({ title: '请填写课程名称', icon: 'none' })
    setAdding(true)
    try {
      await packagesApi.createTemplate({
        name: form.name, type: form.type,
        totalLessons: Number(form.totalLessons),
        price: Number(form.price),
        validDays: Number(form.validDays),
      })
      Taro.showToast({ title: '课程已创建', icon: 'success' })
      setShowAdd(false)
      setForm({ name:'', type:'PRIVATE', totalLessons:'10', price:'0', validDays:'90', description:'' })
      loadCourses()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '创建失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  return (
    <View className='admin-page'>
      <View className='admin-nav'>
        <View className='nav-back' onClick={() => Taro.navigateBack()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </View>
        <Text className='nav-title'>课程管理</Text>
        <View className='nav-action' onClick={() => setShowAdd(true)}><Text>+ 添加</Text></View>
      </View>

      <View className='list-body'>
        <Text className='list-count'>共 {courses.length} 个课程</Text>
        {courses.length === 0 && <View className='empty-block'><Text>暂无课程，点右上角添加</Text></View>}
        {courses.map(c => (
          <View key={c.id} className='list-item'>
            <View className='item-avatar' style={{ background: c.type==='PRIVATE'?'linear-gradient(135deg,#1B4332,#2D6A4F)':'linear-gradient(135deg,#40916C,#52B788)' }}>
              <Text style={{ fontSize:'16px', color:'white', fontWeight:'700' }}>{c.type==='PRIVATE'?'私':'团'}</Text>
            </View>
            <View className='item-info'>
              <Text className='item-name'>{c.name}</Text>
              <Text className='item-phone'>{c.totalLessons}节·有效期{c.validDays}天</Text>
            </View>
            <View className={'status-dot-outer ' + (c.isActive?'green':'gray')} />
          </View>
        ))}
      </View>

      {showAdd && (
        <View className='modal-mask' onClick={() => setShowAdd(false)}>
          <View className='bottom-modal' onClick={(e:any) => e.stopPropagation()}>
            <Text className='modal-title'>添加课程</Text>
            <Text className='modal-label'>课程类型</Text>
            <View style={{ display:'flex', gap:'10px', marginBottom:'12px' }}>
              {[{v:'PRIVATE',l:'私教课'},{v:'GROUP',l:'团课'}].map(t => (
                <View key={t.v}
                  style={{ flex:1, height:'44px', borderRadius:'10px', border:`2px solid ${form.type===t.v?'#1B4332':'#F0F0F0'}`, background:form.type===t.v?'#D8F3DC':'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                  onClick={() => setForm(f=>({...f,type:t.v}))}>
                  <Text style={{ color:form.type===t.v?'#1B4332':'#4A4A4A', fontWeight:'600', fontSize:'17px' }}>{t.l}</Text>
                </View>
              ))}
            </View>
            {[
              { label:'课程名称', key:'name', placeholder:'如：私教10节卡', type:'text' },
              { label:'课时数', key:'totalLessons', placeholder:'如：10', type:'number' },
              { label:'有效期（天）', key:'validDays', placeholder:'如：90', type:'number' },
              { label:'参考价格（元）', key:'price', placeholder:'如：1500', type:'number' },
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
