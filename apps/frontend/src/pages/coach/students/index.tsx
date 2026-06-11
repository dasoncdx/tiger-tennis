import TabBar from '../../../components/TabBar'
import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, ntrpApi, request } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { requireAuth } from '../../../utils/auth'
import './index.scss'

const NTRP_LEVELS = ['LEVEL_2_5B','LEVEL_2_5A','LEVEL_3_0B','LEVEL_3_0A','LEVEL_3_5B','LEVEL_3_5A','LEVEL_4_0B','LEVEL_4_0A']
const NTRP_LABEL: Record<string, string> = {
  LEVEL_2_5B: '2.5B', LEVEL_2_5A: '2.5A', LEVEL_3_0B: '3.0B', LEVEL_3_0A: '3.0A',
  LEVEL_3_5B: '3.5B', LEVEL_3_5A: '3.5A', LEVEL_4_0B: '4.0B', LEVEL_4_0A: '4.0A',
}

const SCORE_KEYS = ['forehand','backhand','serve','movement','tactics'] as const
const SCORE_LABELS: Record<string, string> = {
  forehand:'正手', backhand:'反手', serve:'发球', movement:'移动', tactics:'战术'
}

const PAGE_SIZE = 10

export default function CoachStudents() {
  useEffect(() => { requireAuth('COACH') }, [])
  const { user } = useAuthStore()
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [tab, setTab] = useState<'eval'|'notes'|'reports'>('eval')

  // 段位评估
  const [records, setRecords] = useState<any[]>([])
  const [evalSubmitted, setEvalSubmitted] = useState(false)
  const [evalForm, setEvalForm] = useState({ forehand:3,backhand:3,serve:3,movement:3,tactics:3,remark:'',applyPromotion:false,toLevel:'' })
  const [submittingEval, setSubmittingEval] = useState(false)

  // 训练记录
  const [noteForm, setNoteForm] = useState({ content:'', improvement:'' })
  const [notes, setNotes] = useState<any[]>([])
  const [notePage, setNotePage] = useState(1)
  const [submittingNote, setSubmittingNote] = useState(false)

  // 月度反馈
  const [reportForm, setReportForm] = useState({ goodPoints:'', improvement:'', suggestion:'' })
  const [reports, setReports] = useState<any[]>([])
  const [reportPage, setReportPage] = useState(1)
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    if (!user) return
    // 改为从管理员绑定的关联关系获取学员
    request<any[]>(`/users/coach-students/${user.id}`, { needAuth: true })
      .then((d: any) => setStudents(d || []))
      .catch(() => setStudents([]))
  }, [user])

  function loadStudentData(s: any) {
    setSelected(s)
    setEvalSubmitted(false)
    ntrpApi.records(s.id).then((d: any) => setRecords(d || []))
    request<any[]>(`/training-notes/${s.id}`, { needAuth: true }).then((d: any) => setNotes(d || []))
    request<any[]>(`/monthly-reports/${s.id}`, { needAuth: true }).then((d: any) => setReports(d || []))
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
      setEvalSubmitted(true)
      Taro.showToast({ title: evalForm.applyPromotion ? '已提交，待管理员审批' : '评估已提交', icon: 'success' })
      ntrpApi.records(selected.id).then((d: any) => setRecords(d || []))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '提交失败', icon: 'none' })
    } finally {
      setSubmittingEval(false)
    }
  }

  async function submitNote() {
    if (!noteForm.content) return Taro.showToast({ title: '请填写训练内容', icon: 'none' })
    setSubmittingNote(true)
    try {
      await request('/training-notes', { method: 'POST', data: { studentId: selected.id, ...noteForm } })
      setNoteForm({ content: '', improvement: '' })
      Taro.showToast({ title: '已添加', icon: 'success' })
      request<any[]>(`/training-notes/${selected.id}`, { needAuth: true }).then((d: any) => setNotes(d || []))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '添加失败', icon: 'none' })
    } finally {
      setSubmittingNote(false)
    }
  }

  async function submitReport() {
    if (!reportForm.goodPoints || !reportForm.improvement || !reportForm.suggestion) {
      return Taro.showToast({ title: '请填写完整', icon: 'none' })
    }
    setSubmittingReport(true)
    try {
      await request('/monthly-reports', { method: 'POST', data: { studentId: selected.id, ...reportForm } })
      setReportForm({ goodPoints: '', improvement: '', suggestion: '' })
      Taro.showToast({ title: '反馈已发布', icon: 'success' })
      request<any[]>(`/monthly-reports/${selected.id}`, { needAuth: true }).then((d: any) => setReports(d || []))
    } catch (e: any) {
      Taro.showToast({ title: e.message || '发布失败', icon: 'none' })
    } finally {
      setSubmittingReport(false)
    }
  }

  // 分页
  const noteSlice = notes.slice(0, notePage * PAGE_SIZE)
  const reportSlice = reports.slice(0, reportPage * PAGE_SIZE)

  // ── 学员列表 ──
  if (!selected) {
    return (
      <View className='coach-students'>
        <View className='page-content' style={{ paddingTop: '16px' }}>
          <Text className='list-section-title'>我的学员</Text>
          {students.length === 0 && <View className='empty'><Text>暂无学员</Text></View>}
          {students.map(s => (
            <View key={s.id} className='student-item' onClick={() => loadStudentData(s)}>
              <View className='student-avatar'><Text>{s.name[0]}</Text></View>
              <View className='student-info'>
                {/* 4-1: 显示学员名称，不是教练名 */}
                <Text className='student-name'>{s.name}</Text>
                <Text className='student-phone'>{s.phone}</Text>
              </View>
              <Text className='chevron'>›</Text>
            </View>
          ))}
        </View>
        <TabBar active='tournament' role='COACH' />
      </View>
    )
  }

  // ── 学员详情 ──
  return (
    <View className='coach-students'>
      {/* 4-2: 只保留「‹」，删除「返回」大字 */}
      <View className='detail-header'>
        <View className='detail-back' onClick={() => setSelected(null)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </View>
        <Text className='detail-title'>{selected.name}</Text>
      </View>

      {/* 4-3: tab标题字体放大 */}
      <View className='detail-tabs'>
        {(['eval','notes','reports'] as const).map(t => (
          <View key={t} className={`detail-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            <Text>{{ eval:'段位评估', notes:'训练记录', reports:'月度反馈' }[t]}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className='detail-scroll'>
        <View className='page-content'>

          {/* ── 段位评估 ── */}
          {tab === 'eval' && (
            <View>
              {/* 4-4: 改为「评估明细」；4-5: 五维横排 */}
              {records.length > 0 && (
                <View className='eval-section'>
                  <Text className='eval-section-title'>评估明细</Text>
                  <View className='scores-row'>
                    {SCORE_KEYS.map(k => (
                      <View key={k} className='score-col'>
                        <Text className='score-label-txt'>{SCORE_LABELS[k]}</Text>
                        <Text className='score-val-txt'>{records[0][k]}</Text>
                        <View className='score-bar-v'>
                          <View className='score-bar-fill' style={{ height: `${records[0][k]*20}%` }} />
                        </View>
                      </View>
                    ))}
                  </View>
                  {records[0].remark && <Text className='eval-remark'>备注：{records[0].remark}</Text>}
                </View>
              )}

              {/* 评分输入：也横排 */}
              <View className='eval-form-card'>
                <Text className='eval-section-title'>提交新评估</Text>
                <View className='scores-input-row'>
                  {SCORE_KEYS.map(k => (
                    <View key={k} className='score-input-col'>
                      <Text className='score-input-label'>{SCORE_LABELS[k]}</Text>
                      <View className='score-input-btns'>
                        {[1,2,3,4,5].map(v => (
                          <View key={v}
                            className={`score-dot ${evalForm[k]===v?'active':''}`}
                            onClick={() => setEvalForm(f=>({...f,[k]:v}))}>
                            <Text>{v}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <View className='form-item-row'>
                  <Text className='form-label-sm'>备注</Text>
                  <Input className='form-input-sm' value={evalForm.remark}
                    onInput={e=>setEvalForm(f=>({...f,remark:e.detail.value}))}
                    placeholder='填写评估说明（选填）' />
                </View>

                <View className='promo-row' onClick={() => setEvalForm(f=>({...f,applyPromotion:!f.applyPromotion}))}>
                  <View className={`toggle-box ${evalForm.applyPromotion?'active':''}`} />
                  <Text className='promo-text'>申请晋级</Text>
                </View>

                {evalForm.applyPromotion && (
                  <View className='level-grid'>
                    {NTRP_LEVELS.map(l => (
                      <View key={l} className={`level-btn ${evalForm.toLevel===l?'active':''}`}
                        onClick={()=>setEvalForm(f=>({...f,toLevel:l}))}>
                        <Text>{NTRP_LABEL[l]}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 4-6: 提交后变为「已提交」 */}
                <View
                  className={`btn-submit-eval ${evalSubmitted||submittingEval?'submitted':''}`}
                  onClick={evalSubmitted||submittingEval ? undefined : submitEval}>
                  <Text>{evalSubmitted ? '✓ 已提交，待审批' : submittingEval ? '提交中...' : '提交评估'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── 训练记录 ── */}
          {tab === 'notes' && (
            <View>
              <View className='form-card'>
                <Text className='form-card-title'>添加训练记录</Text>
                <Input className='form-input-block' value={noteForm.content}
                  onInput={e=>setNoteForm(f=>({...f,content:e.detail.value}))}
                  placeholder='本次训练内容（必填）' />
                <Input className='form-input-block' style={{marginTop:'8px'}} value={noteForm.improvement}
                  onInput={e=>setNoteForm(f=>({...f,improvement:e.detail.value}))}
                  placeholder='重点改进项（选填）' />
                <View className={`btn-add ${submittingNote?'disabled':''}`}
                  onClick={submittingNote ? undefined : submitNote}>
                  <Text>{submittingNote?'添加中...':'添加'}</Text>
                </View>
              </View>

              {/* 5: 历史记录，10条/页，倒序 */}
              {notes.length > 0 && (
                <View className='history-list'>
                  <Text className='history-title'>历史记录（共{notes.length}条）</Text>
                  {noteSlice.map((n,i) => (
                    <View key={n.id||i} className='history-item'>
                      <Text className='history-date'>{new Date(n.createdAt).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})}</Text>
                      <View className='history-body'>
                        <Text className='history-content'>{n.content}</Text>
                        {n.improvement && <Text className='history-improve'>改进：{n.improvement}</Text>}
                      </View>
                    </View>
                  ))}
                  {notes.length > notePage * PAGE_SIZE && (
                    <View className='pagination-btn' onClick={()=>setNotePage(p=>p+1)}>
                      <Text>加载更多</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ── 月度反馈 ── */}
          {tab === 'reports' && (
            <View>
              <View className='form-card'>
                <Text className='form-card-title'>发布本月反馈</Text>
                <Input className='form-input-block' value={reportForm.goodPoints}
                  onInput={e=>setReportForm(f=>({...f,goodPoints:e.detail.value}))}
                  placeholder='本月打得好的地方（必填）' />
                <Input className='form-input-block' style={{marginTop:'8px'}} value={reportForm.improvement}
                  onInput={e=>setReportForm(f=>({...f,improvement:e.detail.value}))}
                  placeholder='需要改进的点（必填）' />
                <Input className='form-input-block' style={{marginTop:'8px'}} value={reportForm.suggestion}
                  onInput={e=>setReportForm(f=>({...f,suggestion:e.detail.value}))}
                  placeholder='下阶段训练建议（必填）' />
                <View className={`btn-add ${submittingReport?'disabled':''}`}
                  onClick={submittingReport ? undefined : submitReport}>
                  <Text>{submittingReport?'发布中...':'发布反馈'}</Text>
                </View>
              </View>

              {reports.length > 0 && (
                <View className='history-list'>
                  <Text className='history-title'>历史反馈（共{reports.length}条）</Text>
                  {reportSlice.map((r,i) => (
                    <View key={r.id||i} className='history-item'>
                      <Text className='history-date'>{r.month}</Text>
                      <View className='history-body'>
                        <Text className='history-content'>✅ {r.goodPoints}</Text>
                        <Text className='history-improve'>💡 {r.improvement}</Text>
                        <Text className='history-improve'>📋 {r.suggestion}</Text>
                      </View>
                    </View>
                  ))}
                  {reports.length > reportPage * PAGE_SIZE && (
                    <View className='pagination-btn' onClick={()=>setReportPage(p=>p+1)}>
                      <Text>加载更多</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>
      <TabBar active='tournament' role='COACH' />
    </View>
  )
}
