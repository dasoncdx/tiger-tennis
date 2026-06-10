import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, configApi } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

export default function AdminSettings() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [siteForm, setSiteForm] = useState({ site_name: '', site_intro: '', site_phone: '', site_address: '' })
  const [tab, setTab] = useState<'accounts' | 'site'>('accounts')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    usersApi.students({ status: 'PENDING', pageSize: '50' }).then((data: any) => {
      // 也要加上教练的待审批 — 合并
      setPendingUsers(data.list || [])
    })
    configApi.site().then((data: any) => setSiteForm({
      site_name: data.site_name || '',
      site_intro: data.site_intro || '',
      site_phone: data.site_phone || '',
      site_address: data.site_address || '',
    }))
  }, [])

  async function activate(id: string) {
    await usersApi.updateStatus(id, 'ACTIVE')
    Taro.showToast({ title: '已激活', icon: 'success' })
    usersApi.students({ status: 'PENDING', pageSize: '50' }).then((data: any) => setPendingUsers(data.list || []))
  }

  async function saveSite() {
    setSaving(true)
    try {
      await configApi.updateSite(siteForm)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className='page admin-settings'>
      <View className='page-header'>
        <Text className='page-title'>设置</Text>
      </View>
      <View className='tab-header'>
        {[{ key: 'accounts', label: `账号管理${pendingUsers.length > 0 ? `(${pendingUsers.length})` : ''}` },
          { key: 'site', label: '机构信息' }].map((t) => (
          <View key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>
      <View className='page-content'>
        {tab === 'accounts' && (
          <View>
            {pendingUsers.length === 0 && <View className='empty'><Text>暂无待审批账号</Text></View>}
            {pendingUsers.map((u) => (
              <View key={u.id} className='user-row card'>
                <View className='user-info'>
                  <Text className='user-name'>{u.name}</Text>
                  <Text className='user-phone'>{u.phone}</Text>
                </View>
                <View className='user-actions'>
                  <View className='btn-activate' onClick={() => activate(u.id)}><Text>激活</Text></View>
                </View>
              </View>
            ))}
          </View>
        )}
        {tab === 'site' && (
          <View>
            <View className='form-card card'>
              {[
                { key: 'site_name', label: '机构名称' },
                { key: 'site_intro', label: '机构简介' },
                { key: 'site_phone', label: '联系电话' },
                { key: 'site_address', label: '地址' },
              ].map((f) => (
                <View key={f.key} className='form-item'>
                  <Text className='form-label'>{f.label}</Text>
                  <Input
                    className='form-input'
                    value={(siteForm as any)[f.key]}
                    onInput={(e) => setSiteForm((prev) => ({ ...prev, [f.key]: e.detail.value }))}
                    placeholder={`请输入${f.label}`}
                  />
                </View>
              ))}
              <View className={`btn-save ${saving ? 'disabled' : ''}`} onClick={saving ? undefined : saveSite}>
                <Text>{saving ? '保存中...' : '保存'}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
