import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, useFocusEffect } from 'expo-router'

import { signOut } from '@/features/auth/api/auth'
import { useSession } from '@/features/auth/hooks/useSession'
import { getPosts, type Post } from '@/features/posts/api/posts'
import { getSchedulesByPostIds } from '@/features/schedules/api/schedules'
import type { Schedule } from '@/features/schedules/types/schedule'
import { getScheduleListInfo } from '@/features/schedules/utils/schedule-label'
import { toUserErrorMessage } from '@/utils/error-message'

type PostListItem = Post & {
  schedule: Schedule | null
}

export default function HomeScreen() {
  const { session } = useSession()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      let active = true

      const load = async () => {
        try {
          setIsLoading(true)
          setErrorMessage(null)

          const postRows = await getPosts()
          const scheduleMap = await getSchedulesByPostIds(postRows.map((post) => post.id))

          if (active) {
            setPosts(
              postRows.map((post) => ({
                ...post,
                schedule: scheduleMap[post.id] ?? null,
              })),
            )
          }
        } catch (error) {
          if (active) {
            setErrorMessage(toUserErrorMessage(error))
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
        renderItem={({ item }) => {
          const scheduleInfo = getScheduleListInfo(item.schedule)

          return (
            <Link
              asChild
              href={{
                pathname: '/posts/[id]',
                params: { id: item.id },
              }}
            >
              <Pressable style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.title || '無題'}</Text>
                  <View style={styles.badges}>
                    <View style={[styles.badge, styles.badgeMuted]}>
                      <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        scheduleInfo.kind === 'recurring'
                          ? styles.badgeRecurring
                          : scheduleInfo.kind === 'once'
                            ? styles.badgeOnce
                            : styles.badgeMuted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          scheduleInfo.kind !== 'none' && styles.badgeTextStrong,
                        ]}
                      >
                        {scheduleInfo.badge}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text numberOfLines={2} style={styles.itemBody}>
                  {item.body}
                </Text>

                {scheduleInfo.detail ? (
                  <Text style={styles.scheduleDetail}>{scheduleInfo.detail}</Text>
                ) : null}
              </Pressable>
            </Link>
          )
        }}
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
    gap: 6,
  },
  itemHeader: {
    gap: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeMuted: {
    backgroundColor: '#f0f0f0',
  },
  badgeOnce: {
    backgroundColor: '#e8f1ff',
  },
  badgeRecurring: {
    backgroundColor: '#eaf7ee',
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  badgeTextStrong: {
    color: '#111',
  },
  itemBody: {
    color: '#333',
  },
  scheduleDetail: {
    fontSize: 13,
    color: '#555',
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
