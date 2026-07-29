import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type ConnectionState = 'checking' | 'ok' | 'error'

export default function HomeScreen() {
  const [status, setStatus] = useState<ConnectionState>('checking')
  const [detail, setDetail] = useState('Supabase に接続中...')

  useEffect(() => {
    let cancelled = false

    async function checkConnection() {
      try {
        const { error } = await supabase.auth.getSession()
        if (cancelled) return

        if (error) {
          setStatus('error')
          setDetail(error.message)
          return
        }

        setStatus('ok')
        setDetail('Supabase 接続OK')
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setDetail(e instanceof Error ? e.message : '接続に失敗しました')
      }
    }

    void checkConnection()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SNS Hub</Text>
      {status === 'checking' ? <ActivityIndicator /> : null}
      <Text
        style={status === 'ok' ? styles.ok : status === 'error' ? styles.error : styles.pending}
      >
        {detail}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  pending: {
    color: '#666',
    textAlign: 'center',
  },
  ok: {
    color: '#0a7a32',
    textAlign: 'center',
  },
  error: {
    color: '#b00020',
    textAlign: 'center',
  },
})
