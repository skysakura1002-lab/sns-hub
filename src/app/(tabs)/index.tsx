import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, useFocusEffect } from 'expo-router'

import { signOut } from '@/features/auth/api/auth'
import { useSession } from '@/features/auth/hooks/useSession'
import { getPosts, type Post } from '@/features/posts/api/posts'

export default function HomeScreen() {
  const { session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      let active = true

      const load = async () => {
        try {
          setIsLoading(true)
          setErrorMessage(null)
          const data = await getPosts()
          if (active) setPosts(data)
        } catch (error) {
          if (active) {
            setErrorMessage(error instanceof Error ? error.message : '読み込みに失敗しました')
          }
        } finally {
          if (active) setIsLoading(false)
        }
      }

      void load()

      return () => {
        active = false
      }
    }, []),
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホーム</Text>
      <Text style={styles.email}>{session?.user.email ?? ''}</Text>

      <Link href="/posts/new" style={styles.link}>
        新しい投稿を作る
      </Link>

      {isLoading ? <ActivityIndicator /> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>投稿がありません</Text> : null}
        renderItem={({ item }) => (
          <Link
            asChild
            href={{
              pathname: '/posts/[id]',
              params: { id: item.id },
            }}
          >
            <Pressable style={styles.item}>
              <Text style={styles.itemTitle}>{item.title || '無題'}</Text>
              <Text numberOfLines={2} style={styles.itemBody}>
                {item.body}
              </Text>
              <Text style={styles.itemStatus}>{item.status}</Text>
            </Pressable>
          </Link>
        )}
      />

      <Pressable
        style={styles.logout}
        onPress={() => {
          void signOut()
        }}
      >
        <Text style={styles.logoutText}>ログアウト</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  email: {
    color: '#444',
    marginTop: 4,
    marginBottom: 8,
  },
  link: {
    color: '#0a7aff',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  list: {
    paddingBottom: 24,
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemBody: {
    marginTop: 4,
    color: '#333',
  },
  itemStatus: {
    marginTop: 6,
    color: '#888',
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
  error: {
    color: '#b00020',
    marginBottom: 8,
  },
  logout: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    color: '#b00020',
    fontWeight: '600',
  },
})
