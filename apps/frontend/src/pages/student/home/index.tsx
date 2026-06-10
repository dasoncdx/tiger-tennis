import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { configApi, packagesApi, bookingsApi, usersApi } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import TabBar from '../../../components/TabBar'
import './index.scss'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const STATUS_CONFIG: Record<string, {label:string;bg:string;color:string;border:string}> = {
  PENDING:   { label:'待确认', bg:'#FFF3CD', color:'#FF9500', border:'#FF9500' },
  CONFIRMED: { label:'已确认', bg:'#D8F3DC', color:'#1B4332', border:'#1B4332' },
  COMPLETED: { label:'已完成', bg:'#F0F0F0', color:'#9A9A9A', border:'#C8C8C8' },
  CANCELLED: { label:'已取消', bg:'#FFE8E8', color:'#FF3B30', border:'#FF3B30' },
}

// 默认公告数据
const DEFAULT_NOTICES = [
  { id: '1', title: '2025年暑期招生简章', content: '现面向6-16岁青少年开放暑期网球培训班，分初级、中级、高级三个班型，小班教学，每班不超过8人。报名咨询请联系管理员。', date: '2025-06-01' },
  { id: '2', title: '场地使用须知', content: '请学员在上课时间前10分钟到达场地做热身准备，请穿着专业网球鞋进入场地，禁止穿拖鞋、皮鞋上场。', date: '2025-05-15' },
]

export default function StudentHome() {
  const { user, token, loadFromStorage } = useAuthStore()
  const [banners, setBanners] = useState<{id:string;imageUrl:string}[]>([])
  const [siteName, setSiteName] = useState('Tiger网球俱乐部')
  const [coaches, setCoaches] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])

  useEffect(() => {
    loadFromStorage()
    configApi.banners().then((d:any) => setBanners(d||[]))
    configApi.site().then((d:any) => setSiteName(d.site_name||'Tiger网球俱乐部'))
    usersApi.coaches().then((d:any) => setCoaches(d||[]))
  }, [])

  useEffect(() => {
    if (!token||!user) return
    packagesApi.studentPackages(user.id).then((d:any) =>
      setPackages((d||[]).filter((p:any)=>!p.isExpired&&p.remainingLessons>0))
    )
    bookingsApi.list({ status:'CONFIRMED' }).then((d:any) => {
      const now = new Date()
      setUpcomingBookings(
        (d.list||[])
          .filter((b:any) => new Date(b.startTime) > now)
          .sort((a:any,b:any) => new Date(a.startTime).getTime()-new Date(b.startTime).getTime())
          .slice(0, 5)
      )
    })
  }, [token, user])

  return (
    <View className='home-page'>

      {/* Banner */}
      <View className='hero'>
        {banners.length > 0 ? (
          <Swiper className='hero-swiper' autoplay circular
            indicatorDots indicatorColor='rgba(255,255,255,0.35)' indicatorActiveColor='#fff'>
            {banners.map(b => (
              <SwiperItem key={b.id}><Image className='hero-img' src={b.imageUrl} mode='aspectFill'/></SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className='hero-fallback'>
            <View className='court-svg-wrap'>
              <svg width="375" height="200" viewBox="0 0 375 200" style={{opacity:0.1}}>
                <rect x="40" y="20" width="295" height="160" fill="none" stroke="white" strokeWidth="2"/>
                <line x1="187" y1="20" x2="187" y2="180" stroke="white" strokeWidth="1.5"/>
                <line x1="40" y1="100" x2="335" y2="100" stroke="white" strokeWidth="1.5"/>
                <rect x="40" y="55" width="295" height="90" fill="none" stroke="white" strokeWidth="1"/>
              </svg>
            </View>
          </View>
        )}
        <View className='hero-overlay'>
          <Text className='hero-name'>{siteName}</Text>
          <Text className='hero-sub'>广州 · 专业网球培训</Text>
        </View>
        <View className='hero-dots'>
          <View className='dot active'/><View className='dot'/><View className='dot'/>
        </View>
      </View>

      <View className='content'>

        {/* 未登录引导 */}
        {!token && (
          <View className='section'>
            <View className='login-guide' onClick={()=>Taro.navigateTo({url:'/pages/login/index'})}>
              <Text className='login-guide-text'>登录后可预约课程，查看段位与课时</Text>
              <View className='btn-green-block'><Text>立即登录</Text></View>
            </View>
          </View>
        )}

        {/* 我的课时（登录后，直接铺开，不要「全部>」） */}
        {token && user && packages.length > 0 && (
          <View className='section'>
            <Text className='section-title'>我的课时</Text>
            {packages.map(p => (
              <View key={p.id} className='pkg-card' style={{background:'linear-gradient(135deg,#1B4332 0%,#2D6A4F 100%)',marginBottom:'8px'}}>
                <View className='pkg-left'>
                  <Text className='pkg-label'>当前套餐</Text>
                  <Text className='pkg-name'>{p.templateName}</Text>
                  <View className='pkg-badge'><Text>{p.type==='PRIVATE'?'私教课':'团课'}</Text></View>
                  <Text className='pkg-expire'>有效期至 {new Date(p.endDate).toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'})}</Text>
                </View>
                <View className='pkg-right'>
                  <Text className='pkg-num'>{p.remainingLessons}</Text>
                  <Text className='pkg-unit'>节可用</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 即将上课（登录后，直接铺开，不要「全部>」） */}
        {token && user && upcomingBookings.length > 0 && (
          <View className='section'>
            <Text className='section-title'>即将上课</Text>
            {upcomingBookings.map((b) => {
              const s = STATUS_CONFIG[b.status]||STATUS_CONFIG.PENDING
              return (
                <View key={b.id} className='upcoming' style={{borderLeftColor:s.border}}>
                  <View className='upcoming-icon' style={{background:s.bg}}>
                    <Text style={{fontSize:'20px'}}>🎾</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text className='upcoming-title'>私教课 · {b.coach?.name}</Text>
                    <Text className='upcoming-meta'>{formatDate(b.startTime)}{b.venue?` · ${b.venue}`:''}</Text>
                  </View>
                  <View className='upcoming-badge' style={{background:s.bg}}>
                    <Text style={{color:s.color,fontSize:'13px',fontWeight:'500'}}>{s.label}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* 教练团队（「全部>」跳教练列表页） */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>教练团队</Text>
            <Text className='section-more' style={{color:'#1B4332'}}
              onClick={()=>Taro.navigateTo({url:'/pages/student/coaches/index'})}>全部 ›</Text>
          </View>
          <ScrollView scrollX className='coaches-scroll' enableFlex>
            {coaches.map(c => (
              <View key={c.id} className='coach-card'
                onClick={()=>Taro.navigateTo({url:`/pages/student/coaches/detail?id=${c.id}`})}>
                <View className='coach-avatar' style={{background:'linear-gradient(135deg,#1B4332,#2D6A4F)'}}>
                  {c.avatarUrl
                    ? <Image style={{width:'50px',height:'50px',borderRadius:'50%'}} src={c.avatarUrl} mode='aspectFill'/>
                    : <Text style={{fontSize:'22px',fontWeight:'700',color:'white'}}>{c.name[0]}</Text>
                  }
                </View>
                <Text className='coach-name'>{c.name}</Text>
                {c.specialty && (
                  <View className='coach-tag' style={{background:'#D8F3DC'}}>
                    <Text style={{fontSize:'12px',fontWeight:'500',color:'#1B4332'}}>{c.specialty}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 俱乐部公告 */}
        <View className='section'>
          <Text className='section-title' style={{marginBottom:'12px'}}>俱乐部公告</Text>
          {DEFAULT_NOTICES.map(n => (
            <View key={n.id} className='notice-item'>
              <View className='notice-dot' />
              <View className='notice-body'>
                <Text className='notice-title'>{n.title}</Text>
                <Text className='notice-content'>{n.content}</Text>
                <Text className='notice-date'>{n.date}</Text>
              </View>
            </View>
          ))}
        </View>

      </View>

      <TabBar active='home' role='STUDENT'/>
    </View>
  )
}
