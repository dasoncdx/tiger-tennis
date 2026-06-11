import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, packagesApi, studentCoachApi } from '../../../services/api'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

export default function AdminStudents() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  const [students, setStudents] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])

  // 关联教练
  const [linkedCoaches, setLinkedCoaches] = useState<any[]>([])
  const [allCoaches, setAllCoaches] = useState<any[]>([])
  const [showBindCoach, setShowBindCoach] = useState(false)

  // 添加学员弹窗
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', phone: '' })
  const [adding, setAdding] = useState(false)

  // 发放套餐弹窗
  const [showIssue, setShowIssue] = useState(false)
  const [issueForm, setIssueForm] = useState({ templateId: '' })
  const [issuing, setIssuing] = useState(false)

  function load() {
    const params: Record<string, string> = { pageSize: '100' }
    if (keyword) params.keyword = keyword
    usersApi.students(params).then((data: any) => {
      // 待审批置顶
      const list = (data.list || []).sort((a: any, b: any) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1
        return 0
      })
      setStudents(list)
      setTotal(data.total || 0)
    })
  }

  useEffect(() => { load() }, [keyword])
  useEffect(() => {
    packagesApi.templates().then((d: any) => setTemplates(d || []))
    usersApi.coaches().then((d: any) => setAllCoaches(d || []))
  }, [])

  async function loadDetail(id: string) {
    const data: any = await usersApi.studentDetail(id)
    setDetail(data)
    // 同时加载已关联教练
    studentCoachApi.getStudentCoaches(id).then((d: any) => setLinkedCoaches(d || []))
  }

  // 添加学员（直接激活）
  async function doAdd() {
    if (!addForm.name || !addForm.phone) return Taro.showToast({ title: '请填写姓名和手机号', icon: 'none' })
    if (!/^1\d{10}$/.test(addForm.phone)) return Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
    setAdding(true)
    try {
      await usersApi.createStudent({ name: addForm.name, phone: addForm.phone, password: '123456' })
      Taro.showToast({ title: '学员已创建', icon: 'success' })
      setShowAdd(false)
      setAddForm({ name: '', phone: '' })
      load()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '创建失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  // 审批激活
  async function approveAccount(id: string) {
    await usersApi.updateStatus(id, 'ACTIVE')
    Taro.showToast({ title: '已激活', icon: 'success' })
    load()
    if (detail?.id === id) loadDetail(id)
  }

  // 发放套餐
  async function doIssue() {
    if (!issueForm.templateId) return Taro.showToast({ title: '请选择套餐', icon: 'none' })
    setIssuing(true)
    try {
      await packagesApi.issuePackage({ studentId: selected.id, templateId: issueForm.templateId })
      Taro.showToast({ title: '套餐已发放', icon: 'success' })
      setShowIssue(false)
      loadDetail(selected.id)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '发放失败', icon: 'none' })
    } finally {
      setIssuing(false)
    }
  }

  const STATUS_LABEL: Record<string, string> = { ACTIVE: '已激活', PENDING: '待审批', DISABLED: '已禁用' }

  // ── 详情页 ──
  if (selected && detail) {
    const isActive = detail.status === 'ACTIVE'
    return (
      <View className='admin-page'>
        <View className='admin-nav'>
          <View className='nav-back' onClick={() => { setSelected(null); setDetail(null) }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </View>
          <Text className='nav-title'>{detail.name}</Text>
        </View>

        <View className='detail-body'>
          {/* 基本信息 */}
          <View className='info-card'>
            <View className='info-row'><Text className='info-k'>姓名</Text><Text className='info-v'>{detail.name}</Text></View>
            <View className='info-row'><Text className='info-k'>手机号</Text><Text className='info-v'>{detail.phone}</Text></View>
            <View className='info-row'>
              <Text className='info-k'>状态</Text>
              <View style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <View className={`status-pill ${detail.status === 'ACTIVE' ? 'active' : 'pending'}`}>
                  <Text>{STATUS_LABEL[detail.status]}</Text>
                </View>
                {/* 2-2: 待审批时显示审批按钮 */}
                {detail.status === 'PENDING' && (
                  <View className='btn-approve' onClick={() => approveAccount(detail.id)}>
                    <Text>审批激活</Text>
                  </View>
                )}
              </View>
            </View>
            <View className='info-row'><Text className='info-k'>段位</Text><Text className='info-v'>{detail.ntrpLevel?.replace('LEVEL_','').replace('_','.') || '未评定'}</Text></View>
          </View>

          {/* 2-2: 只有激活状态才显示课时包 */}
          {isActive && (
            <View className='section-block'>
              <View className='section-hd'>
                <Text className='section-t'>课时包</Text>
                <View className='btn-issue' onClick={() => { setShowIssue(true) }}>
                  <Text>+ 发放</Text>
                </View>
              </View>
              {(detail.packages || []).filter((p: any) => !p.isExpired).length === 0 && (
                <Text className='empty-hint'>暂无有效套餐</Text>
              )}
              {(detail.packages || []).filter((p: any) => !p.isExpired).map((p: any) => (
                <View key={p.id} className='pkg-row'>
                  <View>
                    <Text className='pkg-name'>{p.name}</Text>
                    <Text className='pkg-expire'>有效期至 {new Date(p.endDate).toLocaleDateString('zh-CN')}</Text>
                  </View>
                  <Text className='pkg-remain'>{p.remainingLessons}/{p.totalLessons}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 关联教练区块 */}
          <View className='section-block' style={{ marginTop: '12px' }}>
            <View className='section-hd'>
              <Text className='section-t'>关联教练</Text>
              <View className='btn-issue' onClick={() => setShowBindCoach(true)}>
                <Text>+ 关联</Text>
              </View>
            </View>
            {linkedCoaches.length === 0 && (
              <Text className='empty-hint'>暂未关联教练</Text>
            )}
            {linkedCoaches.map((c: any) => (
              <View key={c.id} className='pkg-row'>
                <View>
                  <Text className='pkg-name'>{c.name}</Text>
                  <Text className='pkg-expire'>{c.specialty || '专业教练'}</Text>
                </View>
                <Text style={{ fontSize: '15px', color: '#FF3B30', cursor: 'pointer' }}
                  onClick={async () => {
                    await studentCoachApi.unbind(detail.id, c.id)
                    studentCoachApi.getStudentCoaches(detail.id).then((d: any) => setLinkedCoaches(d || []))
                    Taro.showToast({ title: '已解绑', icon: 'success' })
                  }}>解绑</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 发放套餐弹窗 */}
        {showIssue && (
          <View className='modal-mask' onClick={() => setShowIssue(false)}>
            <View className='bottom-modal' onClick={e => e.stopPropagation()}>
              <Text className='modal-title'>发放套餐</Text>
              <Text className='modal-label'>选择套餐</Text>
              {templates.map(t => (
                <View key={t.id}
                  className={`template-opt ${issueForm.templateId === t.id ? 'selected' : ''}`}
                  onClick={() => setIssueForm({ templateId: t.id })}>
                  <Text>{t.name}（{t.type === 'PRIVATE' ? '私教' : '团课'}·{t.totalLessons}节）</Text>
                </View>
              ))}
              <View className={`modal-ok ${issuing ? 'disabled' : ''}`} onClick={issuing ? undefined : doIssue}>
                <Text>{issuing ? '发放中...' : '确认发放'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 关联教练弹窗 */}
        {showBindCoach && (
          <View className='modal-mask' onClick={() => setShowBindCoach(false)}>
            <View className='bottom-modal' onClick={(e:any) => e.stopPropagation()}>
              <Text className='modal-title'>关联教练</Text>
              <Text className='modal-tip'>点击教练进行关联/解绑，可多选</Text>
              {allCoaches.map((c: any) => {
                const bound = linkedCoaches.some((l: any) => l.id === c.id)
                return (
                  <View key={c.id}
                    className={`template-opt ${bound ? 'selected' : ''}`}
                    onClick={async (e: any) => {
                      e.stopPropagation()
                      try {
                        if (bound) {
                          await studentCoachApi.unbind(detail.id, c.id)
                          Taro.showToast({ title: `已解绑 ${c.name}`, icon: 'success' })
                        } else {
                          await studentCoachApi.bind(detail.id, c.id)
                          Taro.showToast({ title: `已关联 ${c.name}`, icon: 'success' })
                        }
                        // 刷新已关联列表
                        const updated: any = await studentCoachApi.getStudentCoaches(detail.id)
                        setLinkedCoaches(updated || [])
                      } catch (err: any) {
                        Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
                      }
                    }}>
                    <Text>{bound ? '✓ ' : ''}{c.name}{c.specialty ? `  ·  ${c.specialty}` : ''}</Text>
                  </View>
                )
              })}
              <View className='modal-ok' onClick={(e:any) => { e.stopPropagation(); setShowBindCoach(false) }}>
                <Text>完成</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  // ── 列表页 ──
  return (
    <View className='admin-page'>
      <View className='admin-nav'>
        <View className='nav-back' onClick={() => Taro.navigateBack()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </View>
        <Text className='nav-title'>学员管理</Text>
        {/* 2-1: 添加学员按钮 */}
        <View className='nav-action' onClick={() => setShowAdd(true)}>
          <Text>+ 添加</Text>
        </View>
      </View>

      <View className='list-body'>
        <Input className='search-box' placeholder='搜索姓名/手机号' value={keyword}
          onInput={e => setKeyword(e.detail.value)} />
        <Text className='list-count'>共 {total} 位学员</Text>

        {students.map(s => (
          <View key={s.id} className='list-item' onClick={async () => { setSelected(s); await loadDetail(s.id) }}>
            <View className='item-avatar'><Text>{s.name[0]}</Text></View>
            <View className='item-info'>
              <Text className='item-name'>{s.name}</Text>
              <Text className='item-phone'>{s.phone}</Text>
            </View>
            {/* 2-3: 待审批橙色，激活绿色 */}
            <View className={`status-dot-outer ${s.status === 'ACTIVE' ? 'green' : s.status === 'PENDING' ? 'orange' : 'gray'}`} />
            <Text className='item-chevron'>›</Text>
          </View>
        ))}
      </View>

      {/* 2-1: 添加学员弹窗 */}
      {showAdd && (
        <View className='modal-mask' onClick={() => setShowAdd(false)}>
          <View className='bottom-modal' onClick={e => e.stopPropagation()}>
            <Text className='modal-title'>添加学员</Text>
            <Text className='modal-label'>姓名</Text>
            <Input className='modal-input' placeholder='请输入学员姓名' value={addForm.name}
              onInput={e => setAddForm(f => ({ ...f, name: e.detail.value }))} />
            <Text className='modal-label' style={{ marginTop: '14px' }}>手机号</Text>
            <Input className='modal-input' type='number' placeholder='请输入手机号' value={addForm.phone}
              onInput={e => setAddForm(f => ({ ...f, phone: e.detail.value }))} maxlength={11} />
            <Text className='modal-tip'>初始密码为 123456，学员登录后可修改</Text>
            <View className={`modal-ok ${adding ? 'disabled' : ''}`} onClick={adding ? undefined : doAdd}>
              <Text>{adding ? '创建中...' : '创建'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
