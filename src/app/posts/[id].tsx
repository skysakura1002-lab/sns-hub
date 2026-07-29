import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { getPostTargets, upsertPostTarget } from '@/features/posts/api/post-targets'
import { deletePost, duplicatePost, getPostById, updatePost } from '@/features/posts/api/posts'
import {
  SOCIAL_PROVIDER_LABELS,
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/features/posts/types/post-target'
import { createTemplate } from '@/features/templates/api/templates'

type EditorTab = 'common' | SocialProvider

export default function PostDetailScreen() {
  const router = useRouter()
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>()
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const [title, setTitle] = useState('')
  const [commonBody, setCommonBody] = useState('')
  const [providerBodies, setProviderBodies] = useState<Record<SocialProvider, string>>({
    x: '',
    instagram: '',
    threads: '',
  })
  const [activeTab, setActiveTab] = useState<EditorTab>('common')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadPost = async () => {
      try {
        const [post, targets] = await Promise.all([getPostById(id), getPostTargets(id)])

        setTitle(post.title ?? '')
        setCommonBody(post.body)

        setProviderBodies({
          x: targets.find((target) => target.provider === 'x')?.body ?? post.body,
          instagram: targets.find((target) => target.provider === 'instagram')?.body ?? post.body,
          threads: targets.find((target) => target.provider === 'threads')?.body ?? post.body,
        })
      } catch (error) {
        console.error(error)
        Alert.alert(
          '投稿を取得できませんでした',
          error instanceof Error ? error.message : 'Unknown error',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadPost()
  }, [id])

  const tabs = useMemo(
    () =>
      [
        { key: 'common' as const, label: '共通' },
        ...SOCIAL_PROVIDERS.map((provider) => ({
          key: provider,
          label: SOCIAL_PROVIDER_LABELS[provider],
        })),
      ] as const,
    [],
  )

  const activeBody = activeTab === 'common' ? commonBody : providerBodies[activeTab]

  const setActiveBody = (value: string) => {
    if (activeTab === 'common') {
      setCommonBody(value)
      return
    }

    setProviderBodies((current) => ({
      ...current,
      [activeTab]: value,
    }))
  }

  const handleSave = async () => {
    if (!id) return

    try {
      setIsSaving(true)

      await updatePost(id, {
        title: title.trim() || undefined,
        body: commonBody,
      })

      await Promise.all(
        SOCIAL_PROVIDERS.map((provider) =>
          upsertPostTarget({
            postId: id,
            provider,
            body: providerBodies[provider],
          }),
        ),
      )

      router.back()
    } catch (error) {
      Alert.alert('更新に失敗しました', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!id) return

    try {
      const duplicated = await duplicatePost(id)

      await Promise.all(
        SOCIAL_PROVIDERS.map((provider) =>
          upsertPostTarget({
            postId: duplicated.id,
            provider,
            body: providerBodies[provider],
          }),
        ),
      )

      router.replace({
        pathname: '/posts/[id]',
        params: {
          id: duplicated.id,
        },
      })
    } catch (error) {
      Alert.alert('複製に失敗しました', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleSaveAsTemplate = async () => {
    try {
      await createTemplate({
        name: title.trim() || '無題のテンプレート',
        title: title.trim() || undefined,
        body: commonBody,
      })

      Alert.alert('テンプレートに保存しました')
    } catch (error) {
      Alert.alert('保存に失敗しました', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleDelete = () => {
    if (!id) return

    Alert.alert('投稿を削除しますか？', 'この操作は取り消せません。', [
      {
        text: 'キャンセル',
        style: 'cancel',
      },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePost(id)
              router.back()
            } catch (error) {
              Alert.alert(
                '削除に失敗しました',
                error instanceof Error ? error.message : 'Unknown error',
              )
            }
          })()
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="タイトル"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.key
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, selected && styles.tabSelected]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={styles.sectionLabel}>
        {activeTab === 'common' ? '共通文章' : `${SOCIAL_PROVIDER_LABELS[activeTab]} 用本文`}
      </Text>

      <TextInput
        multiline
        placeholder="投稿内容"
        style={[styles.input, styles.body]}
        textAlignVertical="top"
        value={activeBody}
        onChangeText={setActiveBody}
      />

      <Button
        disabled={isSaving}
        title={isSaving ? '保存中...' : '変更を保存'}
        onPress={() => {
          void handleSave()
        }}
      />

      <Button
        title="複製して新しい投稿を作る"
        onPress={() => {
          void handleDuplicate()
        }}
      />

      <Button
        title="テンプレートとして保存"
        onPress={() => {
          void handleSaveAsTemplate()
        }}
      />

      <Button color="red" title="削除" onPress={handleDelete} />
    </View>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  body: {
    minHeight: 160,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  tabText: {
    color: '#111',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
  },
})
