import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import '../students/index.scss'

export default function AdminCoaches() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [coaches, setCoaches] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', bio:'', specialty:'' })

  function loadCoaches() {
    usersApi.coaches().then((d: any) => setCoaches(d || []))
  }

  useEffect(() => { loadCoaches() }, [])

  async function doAdd() {
    if (!form.name || !form.phone) return Taro.showToast({ title: '请填写姓名和手机号', icon: 'none' })
    if (!/^1\d{10}$/.test(form.phone)) return Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
    setAdding(true)
    try {
      // 创建教练账号（直接激活）
      await usersApi.createStudent({ name: form.name, phone: form.phone, password: '123456', role: 'COACH' } as any)
      Taro.showToast({ title: '教练已创建', icon: 'success' })
      setShowAdd(false)
      setForm({ name:'', phone:'', bio:'', specialty:'' })
      loadCoaches()
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
        <Text className='nav-title'>教练管理</Text>
        <View className='nav-action' onClick={() => setShowAdd(true)}><Text>+ 添加</Text></View>
      </View>

      <View className='list-body'>
        <Text className='list-count'>共 {coaches.length} 位教练</Text>
        {coaches.length === 0 && <View className='empty-block'><Text>暂无教练，点右上角添加</Text></View>}
        {coaches.map(c => (
          <View key={c.id} className='list-item'>
            <View className='item-avatar'><Text>{c.name[0]}</Text></View>
            <View className='item-info'>
              <Text className='item-name'>{c.name}</Text>
              <Text className='item-phone'>{c.specialty || c.bio || '专业教练'}</Text>
            </View>
            <View className='status-dot-outer green' />
          </View>
        ))}
      </View>

      {showAdd && (
        <View className='modal-mask' onClick={() => setShowAdd(false)}>
          <View className='bottom-modal' onClick={(e: any) => e.stopPropagation()}>
            <Text className='modal-title'>添加教练</Text>
            {[
              { label:'姓名', key:'name', placeholder:'请输入教练姓名', type:'text' },
              { label:'手机号', key:'phone', placeholder:'请输入手机号', type:'number' },
              { label:'擅长方向', key:'specialty', placeholder:'如：正手专项、发球专项', type:'text' },
              { label:'个人简介', key:'bio', placeholder:'简短介绍（学员端展示）', type:'text' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom:'12px' }}>
                <Text className='modal-label'>{f.label}</Text>
                <Input className='modal-input' type={f.type as any} placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onInput={(e: any) => setForm(prev => ({ ...prev, [f.key]: e.detail.value }))} />
              </View>
            ))}
            <Text className='modal-tip'>初始密码为 123456，账号默认激活</Text>
            <View className={'modal-ok' + (adding?' disabled':'')} onClick={adding?undefined:doAdd}>
              <Text>{adding?'创建中...':'创建'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
