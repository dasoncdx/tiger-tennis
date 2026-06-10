import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './TabBar.scss'

interface TabBarProps {
  active: 'home' | 'booking' | 'tournament' | 'profile'
  role?: 'STUDENT' | 'COACH' | 'ADMIN'
}

const STUDENT_TABS = [
  {
    key: 'home',
    label: '首页',
    url: '/pages/student/home/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          stroke={active ? '#1B4332' : '#BBBBBB'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          fill={active ? '#1B4332' : 'none'}
          fillOpacity={active ? 0.1 : 0}
        />
      </svg>
    ),
  },
  {
    key: 'booking',
    label: '约课',
    url: '/pages/student/booking/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="3"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <line x1="3" y1="9" x2="21" y2="9"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <line x1="8" y1="2" x2="8" y2="6"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="16" y2="6"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="15" r="2"
          fill={active ? '#1B4332' : '#BBBBBB'}/>
      </svg>
    ),
  },
  {
    key: 'tournament',
    label: '赛事',
    url: '/pages/student/tournament/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M8 21H16M12 17V21M7 4H17V9C17 12.3137 14.7614 15 12 15C9.23858 15 7 12.3137 7 9V4Z"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 6H4C4 6 4 11 7 11M17 6H20C20 6 20 11 17 11"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'profile',
    label: '我的',
    url: '/pages/student/profile/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const COACH_TABS = [
  {
    key: 'home',
    label: '首页',
    url: '/pages/coach/home/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'booking',
    label: '课表',
    url: '/pages/coach/schedule/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="3"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <line x1="3" y1="9" x2="21" y2="9"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <line x1="8" y1="2" x2="8" y2="6"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="16" y2="6"
          stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'tournament',
    label: '学员',
    url: '/pages/coach/students/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <path d="M3 20C3 17.2386 5.68629 15 9 15" stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="17" cy="10" r="2.5" stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <path d="M13 20C13 17.7909 14.7909 16 17 16C19.2091 16 21 17.7909 21 20" stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'profile',
    label: '我的',
    url: '/pages/coach/profile/index',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8"/>
        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={active ? '#1B4332' : '#BBBBBB'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function TabBar({ active, role = 'STUDENT' }: TabBarProps) {
  const tabs = role === 'COACH' ? COACH_TABS : STUDENT_TABS

  function navigate(url: string) {
    Taro.navigateTo({ url }).catch(() => {
      Taro.redirectTo({ url })
    })
  }

  return (
    <View className='tabbar'>
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <View
            key={tab.key}
            className={`tabbar-item ${isActive ? 'active' : ''}`}
            onClick={() => !isActive && navigate(tab.url)}
          >
            <View className='tabbar-icon'>{tab.icon(isActive)}</View>
            <Text className='tabbar-label'>{tab.label}</Text>
          </View>
        )
      })}
    </View>
  )
}
