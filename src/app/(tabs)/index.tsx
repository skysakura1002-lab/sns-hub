import { Link } from 'expo-router'
import { Button, StyleSheet, Text, View } from 'react-native'

import { signOut } from '@/features/auth/api/auth'
import { useSession } from '@/features/auth/hooks/useSession'

export default function HomeScreen() {
  const { session } = useSession()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホーム</Text>
      <Text style={styles.email}>{session?.user.email ?? ''}</Text>

      <Link href="/posts/new" style={styles.link}>
        新しい投稿を作る
      </Link>

      <Button
        title="ログアウト"
        onPress={() => {
          void signOut()
        }}
      />
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
    marginBottom: 8,
  },
  link: {
    color: '#0a7aff',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
})
