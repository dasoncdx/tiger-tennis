import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ntrpApi } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A', LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A', LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

export default function AdminNtrp() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [list, setList] = useState<any[]>([])
  const [tab, setTab] = useState('PENDING')

  function load() {
    ntrpApi.applications({ status: tab, pageSize: '50' }).then((data: any) => setList(data.list || []))
  }

  useEffect(() => { load() }, [tab])

  async function approve(id: string) {
    try {
      await ntrpApi.reviewApplication(id, { status: 'APPROVED' })
      Taro.showToast({ title: '已通过', icon: 'success' })
      load()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  }

  async function reject(id: string) {
    Taro.showModal({
      title: '驳回申请',
      editable: true,
      placeholderText: '请填写驳回原因（必填）',
      success: async (res) => {
        if (res.confirm) {
          if (!res.content) return Taro.showToast({ title: '请填写原因', icon: 'none' })
          try {
            await ntrpApi.reviewApplication(id, { status: 'REJECTED', reviewRemark: res.content })
            Taro.showToast({ title: '已驳回', icon: 'success' })
            load()
          } catch (e: any) {
            Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  const tabs = [
    { key: 'PENDING', label: '待审批' },
    { key: 'APPROVED', label: '已通过' },
    { key: 'REJECTED', label: '已驳回' },
  ]

  return (
    <View className='page admin-ntrp'>
      <View className='page-header'>
        <Text className='page-title'>段位管理</Text>
      </View>
      <View className='tab-header'>
        {tabs.map((t) => (
          <View key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>
      <View className='page-content'>
        {list.length === 0 && <View className='empty'><Text>暂无记录</Text></View>}
        {list.map((a) => (
          <View key={a.id} className='ntrp-card card'>
            <View className='ntrp-top'>
              <Text className='ntrp-student'>{a.student?.name}</Text>
              <Text className='ntrp-coach'>教练：{a.record?.coach?.name || '-'}</Text>
            </View>
            <View className='ntrp-levels'>
              <View className='ntrp-from'>
                <Text className='level-label'>当前</Text>
                <Text className='level-val'>{NTRP_LABEL[a.fromLevel] || a.fromLevel}</Text>
              </View>
              <Text className='ntrp-arrow'>→</Text>
              <View className='ntrp-to'>
                <Text className='level-label'>申请晋级至</Text>
                <Text className='level-val primary'>{NTRP_LABEL[a.toLevel] || a.toLevel}</Text>
              </View>
            </View>
            {a.record?.remark && <Text className='ntrp-remark'>备注：{a.record.remark}</Text>}
            <Text className='ntrp-time'>{new Date(a.createdAt).toLocaleDateString('zh-CN')}</Text>
            {tab === 'PENDING' && (
              <View className='ntrp-actions'>
                <View className='btn-approve' onClick={() => Taro.showModal({
                  title: '确认通过', content: `通过 ${a.student?.name} 的晋级申请？`,
                  success: (res) => { if (res.confirm) approve(a.id) },
                })}>
                  <Text>通过</Text>
                </View>
                <View className='btn-reject' onClick={() => reject(a.id)}>
                  <Text>驳回</Text>
                </View>
              </View>
            )}
            {tab === 'REJECTED' && a.reviewRemark && (
              <Text className='reject-reason'>驳回原因：{a.reviewRemark}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}
