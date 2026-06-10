import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, ntrpApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

const NTRP_LEVELS = ['LEVEL_2_5B','LEVEL_2_5A','LEVEL_3_0B','LEVEL_3_0A','LEVEL_3_5B','LEVEL_3_5A','LEVEL_4_0B','LEVEL_4_0A']
const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A', LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A', LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

export default function CoachStudents() {
  useEffect(() => { requireAuth('COACH') }, [])
  const { user } = useAuthStore()
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [tab, setTab] = useState<'eval' | 'notes' | 'reports'>('eval')

  // 评估表单
  const [evalForm, setEvalForm] = useState({ forehand: 3, backhand: 3, serve: 3, movement: 3, tactics: 3, remark: '', applyPromotion: false, toLevel: '' })
  const [submittingEval, setSubmittingEval] = useState(false)

  // 训练记录表单
  const [noteForm, setNoteForm] = useState({ content: '', improvement: '' })
  const [reportForm, setReportForm] = useState({ goodPoints: '', improvement: '', suggestion: '' })

  useEffect(() => {
    if (!user) return
    usersApi.coaches(user.id).then((data: any) => setStudents(data)).catch(() => {
      // 没有 coaches/:id/students 就 fallback
      usersApi.students().then((data: any) => setStudents(data.list || []))
    })
  }, [user])

  async function selectStudent(s: any) {
    setSelected(s)
    ntrpApi.records(s.id).then((data: any) => setRecords(data))
  }

  async function submitEval() {
    if (!selected || !user) return
    setSubmittingEval(true)
    try {
      await ntrpApi.submitRecord({
        studentId: selected.id,
        coachId: user.id,
        ...evalForm,
        toLevel: evalForm.applyPromotion ? evalForm.toLevel : undefined,
      })
      Taro.showToast({ title: evalForm.applyPromotion ? '评估已提交，晋级申请待管理员审批' : '评估已提交', icon: 'success' })
      ntrpApi.records(selected.id).then((data: any) => setRecords(data))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '提交失败', icon: 'none' })
    } finally {
      setSubmittingEval(false)
    }
  }

  if (!selected) {
    return (
      <View className='page'>
        <View className='page-content'>
          <View className='section-header' style={{ marginTop: 16 }}>
            <Text className='section-title'>我的学员</Text>
          </View>
          {students.length === 0 && <View className='empty'><Text>暂无学员</Text></View>}
          {students.map((s) => (
            <View key={s.id} className='student-item' onClick={() => selectStudent(s)}>
              <View className='student-avatar'><Text>{s.name[0]}</Text></View>
              <View className='student-info'>
                <Text className='student-name'>{s.name}</Text>
                <Text className='student-phone'>{s.phone}</Text>
              </View>
              <Text className='chevron'>›</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className='page'>
      <View className='detail-header'>
        <Text className='back' onClick={() => setSelected(null)}>‹ 返回</Text>
        <Text className='detail-name'>{selected.name}</Text>
      </View>

      {/* Tab */}
      <View className='detail-tabs'>
        {(['eval', 'notes', 'reports'] as const).map((t) => (
          <View key={t} className={`detail-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <Text>{{ eval: '段位评估', notes: '训练记录', reports: '月度反馈' }[t]}</Text>
          </View>
        ))}
      </View>

      <View className='page-content'>
        {/* 段位评估 */}
        {tab === 'eval' && (
          <View>
            {records.length > 0 && (
              <View className='last-eval'>
                <Text className='eval-label'>最近评估</Text>
                {(['forehand','backhand','serve','movement','tactics'] as const).map((k) => (
                  <View key={k} className='eval-row'>
                    <Text className='eval-key'>{{ forehand:'正手',backhand:'反手',serve:'发球',movement:'移动',tactics:'战术' }[k]}</Text>
                    <View className='eval-bar'>
                      <View className='eval-fill' style={{ width: `${records[0][k] * 20}%` }} />
                    </View>
                    <Text className='eval-val'>{records[0][k]}/5</Text>
                  </View>
                ))}
              </View>
            )}

            <View className='eval-form'>
              <Text className='form-section-title'>提交新评估</Text>
              {(['forehand','backhand','serve','movement','tactics'] as const).map((k) => (
                <View key={k} className='score-row'>
                  <Text className='score-label'>{{ forehand:'正手',backhand:'反手',serve:'发球',movement:'移动',tactics:'战术' }[k]}</Text>
                  <View className='score-btns'>
                    {[1,2,3,4,5].map((v) => (
                      <View
                        key={v}
                        className={`score-btn ${evalForm[k] === v ? 'active' : ''}`}
                        onClick={() => setEvalForm((f) => ({ ...f, [k]: v }))}
                      >
                        <Text>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              <View className='form-item'>
                <Text className='form-label'>备注（选填）</Text>
                <Input className='form-input' value={evalForm.remark} onInput={(e) => setEvalForm((f) => ({ ...f, remark: e.detail.value }))} placeholder='填写评估说明' />
              </View>
              <View className='promo-toggle' onClick={() => setEvalForm((f) => ({ ...f, applyPromotion: !f.applyPromotion }))}>
                <View className={`toggle-box ${evalForm.applyPromotion ? 'active' : ''}`} />
                <Text>申请晋级</Text>
              </View>
              {evalForm.applyPromotion && (
                <View className='form-item'>
                  <Text className='form-label'>晋级至</Text>
                  <View className='level-selector'>
                    {NTRP_LEVELS.map((l) => (
                      <View key={l} className={`level-btn ${evalForm.toLevel === l ? 'active' : ''}`} onClick={() => setEvalForm((f) => ({ ...f, toLevel: l }))}>
                        <Text>{NTRP_LABEL[l]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View className={`btn-submit ${submittingEval ? 'disabled' : ''}`} onClick={submittingEval ? undefined : submitEval}>
                <Text>{submittingEval ? '提交中...' : '提交评估'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 训练记录 */}
        {tab === 'notes' && (
          <View>
            <View className='quick-form card'>
              <Text className='form-section-title'>添加训练记录</Text>
              <Input className='form-input' value={noteForm.content} onInput={(e) => setNoteForm((f) => ({ ...f, content: e.detail.value }))} placeholder='本次训练内容（必填）' />
              <Input className='form-input' style={{ marginTop: 8 }} value={noteForm.improvement} onInput={(e) => setNoteForm((f) => ({ ...f, improvement: e.detail.value }))} placeholder='重点改进项（选填）' />
              <View className='btn-submit' onClick={async () => {
                if (!noteForm.content) return Taro.showToast({ title: '请填写训练内容', icon: 'none' })
                try {
                  const { default: api } = await import('../../../services/api')
                  await (api as any).notesApi.createNote({ studentId: selected.id, ...noteForm })
                  setNoteForm({ content: '', improvement: '' })
                  Taro.showToast({ title: '已添加', icon: 'success' })
                } catch (e: any) {
                  // 简化导入
                }
              }}>
                <Text>添加</Text>
              </View>
            </View>
          </View>
        )}

        {/* 月度反馈 */}
        {tab === 'reports' && (
          <View>
            <View className='quick-form card'>
              <Text className='form-section-title'>发布本月反馈</Text>
              <Input className='form-input' value={reportForm.goodPoints} onInput={(e) => setReportForm((f) => ({ ...f, goodPoints: e.detail.value }))} placeholder='本月打得好的地方（必填）' />
              <Input className='form-input' style={{ marginTop: 8 }} value={reportForm.improvement} onInput={(e) => setReportForm((f) => ({ ...f, improvement: e.detail.value }))} placeholder='需要改进的点（必填）' />
              <Input className='form-input' style={{ marginTop: 8 }} value={reportForm.suggestion} onInput={(e) => setReportForm((f) => ({ ...f, suggestion: e.detail.value }))} placeholder='下阶段训练建议（必填）' />
              <View className='btn-submit' onClick={async () => {
                if (!reportForm.goodPoints || !reportForm.improvement || !reportForm.suggestion) {
                  return Taro.showToast({ title: '请填写完整', icon: 'none' })
                }
                try {
                  const { request } = await import('../../../services/api')
                  await request('/monthly-reports', { method: 'POST', data: { studentId: selected.id, ...reportForm } })
                  setReportForm({ goodPoints: '', improvement: '', suggestion: '' })
                  Taro.showToast({ title: '反馈已发布', icon: 'success' })
                } catch (e: any) {
                  Taro.showToast({ title: (e as any).message || '发布失败', icon: 'none' })
                }
              }}>
                <Text>发布反馈</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
