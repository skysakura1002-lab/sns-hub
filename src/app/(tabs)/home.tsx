import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { signOut } from '@/features/auth/api/auth'
import { useAuth } from '@/features/auth/hooks/useAuth'

export default function HomeScreen() {
  const { user } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    setMessage(null)
    try {
      await signOut()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'ログアウトに失敗しました')
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホーム</Text>
      <Text style={styles.email}>{user?.email ?? 'ユーザー情報なし'}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {loading ? <ActivityIndicator /> : null}
      <Pressable disabled={loading} style={styles.button} onPress={() => void handleSignOut()}>
        <Text style={styles.buttonText}>ログアウト</Text>
      </Pressable>
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
  email: {
    color: '#444',
  },
  message: {
    color: '#b00020',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
