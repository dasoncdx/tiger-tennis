import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, packagesApi } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

export default function AdminStudents() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [students, setStudents] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [showIssue, setShowIssue] = useState(false)
  const [issueForm, setIssueForm] = useState({ templateId: '', startDate: '' })

  function load() {
    const params: Record<string, string> = { pageSize: '50' }
    if (keyword) params.keyword = keyword
    if (statusFilter) params.status = statusFilter
    usersApi.students(params).then((data: any) => {
      setStudents(data.list || [])
      setTotal(data.total || 0)
    })
  }

  useEffect(() => { load() }, [keyword, statusFilter])
  useEffect(() => { packagesApi.templates().then((data: any) => setTemplates(data)) }, [])

  async function loadDetail(id: string) {
    const data: any = await usersApi.studentDetail(id)
    setDetail(data)
  }

  async function approveAccount(id: string) {
    await usersApi.updateStatus(id, 'ACTIVE')
    Taro.showToast({ title: '已激活', icon: 'success' })
    load()
    if (detail?.id === id) loadDetail(id)
  }

  async function issuePackage() {
    if (!issueForm.templateId) return Taro.showToast({ title: '请选择套餐', icon: 'none' })
    try {
      await packagesApi.issuePackage({ studentId: selected.id, templateId: issueForm.templateId, startDate: issueForm.startDate || undefined })
      Taro.showToast({ title: '套餐已发放', icon: 'success' })
      setShowIssue(false)
      loadDetail(selected.id)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '发放失败', icon: 'none' })
    }
  }

  const STATUS_MAP: Record<string, string> = { ACTIVE: '已激活', PENDING: '待审批', DISABLED: '已禁用' }

  if (selected && detail) {
    return (
      <View className='page admin-detail'>
        <View className='detail-header'>
          <Text className='back' onClick={() => { setSelected(null); setDetail(null) }}>‹ 返回</Text>
          <Text className='detail-title'>{detail.name}</Text>
        </View>
        <View className='page-content'>
          {/* 基本信息 */}
          <View className='info-card card'>
            <View className='info-row'><Text className='info-label'>手机号</Text><Text>{detail.phone}</Text></View>
            <View className='info-row'><Text className='info-label'>状态</Text>
              <View className='status-actions'>
                <Text className={`status-tag ${detail.status === 'ACTIVE' ? 'active' : 'pending'}`}>{STATUS_MAP[detail.status]}</Text>
                {detail.status === 'PENDING' && (
                  <Text className='btn-text' onClick={() => approveAccount(detail.id)}>激活</Text>
                )}
              </View>
            </View>
            <View className='info-row'><Text className='info-label'>注册时间</Text><Text>{new Date(detail.createdAt).toLocaleDateString('zh-CN')}</Text></View>
            <View className='info-row'><Text className='info-label'>当前段位</Text><Text>{detail.ntrpLevel?.replace('LEVEL_', '').replace('_', '.') || '未评定'}</Text></View>
          </View>

          {/* 课时包 */}
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>课时包</Text>
              <Text className='section-more' onClick={() => setShowIssue(true)}>+ 发放</Text>
            </View>
            {detail.packages?.filter((p: any) => !p.isExpired).map((p: any) => (
              <View key={p.id} className='pkg-row card'>
                <View>
                  <Text className='pkg-name'>{p.name}</Text>
                  <Text className='pkg-expire'>有效期至 {new Date(p.endDate).toLocaleDateString('zh-CN')}</Text>
                </View>
                <View>
                  <Text className='pkg-remain'>{p.remainingLessons}/{p.totalLessons}</Text>
                  <Text className='pkg-unit'>节可用</Text>
                </View>
              </View>
            ))}
            {detail.packages?.filter((p: any) => !p.isExpired).length === 0 && (
              <Text className='empty-text'>暂无有效套餐</Text>
            )}
          </View>

          {/* 发放套餐弹窗 */}
          {showIssue && (
            <View className='modal-mask'>
              <View className='modal'>
                <Text className='modal-title'>发放套餐</Text>
                <View className='form-item'>
                  <Text className='form-label'>选择套餐</Text>
                  {templates.map((t) => (
                    <View
                      key={t.id}
                      className={`template-option ${issueForm.templateId === t.id ? 'selected' : ''}`}
                      onClick={() => setIssueForm((f) => ({ ...f, templateId: t.id }))}
                    >
                      <Text>{t.name} · {t.type === 'PRIVATE' ? '私教' : '团课'} · {t.totalLessons}节</Text>
                    </View>
                  ))}
                </View>
                <View className='modal-actions'>
                  <Text className='modal-cancel' onClick={() => setShowIssue(false)}>取消</Text>
                  <Text className='modal-confirm' onClick={issuePackage}>确认发放</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className='page admin-students'>
      <View className='list-header'>
        <View className='search-bar'>
          <Input className='search-input' placeholder='搜索姓名/手机号' value={keyword} onInput={(e) => setKeyword(e.detail.value)} />
        </View>
        <View className='filter-bar'>
          {[{ key: '', label: '全部' }, { key: 'ACTIVE', label: '已激活' }, { key: 'PENDING', label: '待审批' }].map((f) => (
            <View key={f.key} className={`filter-btn ${statusFilter === f.key ? 'active' : ''}`} onClick={() => setStatusFilter(f.key)}>
              <Text>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='page-content'>
        <Text className='list-count'>共 {total} 位学员</Text>
        {students.map((s) => (
          <View key={s.id} className='student-row' onClick={async () => { setSelected(s); await loadDetail(s.id) }}>
            <View className='student-avatar'><Text>{s.name[0]}</Text></View>
            <View className='student-info'>
              <Text className='student-name'>{s.name}</Text>
              <Text className='student-phone'>{s.phone}</Text>
            </View>
            <View>
              <View className={`status-dot ${s.status === 'ACTIVE' ? 'active' : s.status === 'PENDING' ? 'pending' : 'disabled'}`} />
              <Text className='chevron'>›</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
