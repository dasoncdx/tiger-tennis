import { View, Text } from '@tarojs/components'
import { useEffect } from 'react'
import { requireAuth } from '../../../utils/auth'
export default function Page() {
  useEffect(() => { requireAuth('ADMIN') }, [])
  return (
    <View style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '16px', color: '#9A9A9A' }}>功能开发中...</Text>
    </View>
  )
}
