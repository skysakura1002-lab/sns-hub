import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { getPostTargets, upsertPostTarget } from '@/features/posts/api/post-targets'
import { deletePost, duplicatePost, getPostById, updatePost } from '@/features/posts/api/posts'
import {
  PostBodyEditors,
  toggleBodyEditorKey,
  type BodyEditorKey,
} from '@/features/posts/components/PostBodyEditors'
import { SOCIAL_PROVIDERS, type SocialProvider } from '@/features/posts/types/post-target'
import { getScheduleByPostId, upsertSchedule } from '@/features/schedules/api/schedules'
import { ScheduleTimingFields } from '@/features/schedules/components/ScheduleTimingFields'
import {
  formatTokyoDateTime,
  parseTokyoDateTimeInput,
} from '@/features/schedules/utils/tokyo-datetime'
import { createTemplate } from '@/features/templates/api/templates'

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
  const [selectedKeys, setSelectedKeys] = useState<BodyEditorKey[]>([...SOCIAL_PROVIDERS])
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAtText, setScheduledAtText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadPost = async () => {
      try {
        const [post, targets, schedule] = await Promise.all([
          getPostById(id),
          getPostTargets(id),
          getScheduleByPostId(id),
        ])

        setTitle(post.title ?? '')
        setCommonBody(post.body)

        setProviderBodies({
          x: targets.find((target) => target.provider === 'x')?.body ?? post.body,
          instagram: targets.find((target) => target.provider === 'instagram')?.body ?? post.body,
          threads: targets.find((target) => target.provider === 'threads')?.body ?? post.body,
        })

        const existingProviders = SOCIAL_PROVIDERS.filter((provider) =>
          targets.some((target) => target.provider === provider),
        )
        const providers = existingProviders.length > 0 ? existingProviders : [...SOCIAL_PROVIDERS]

        setSelectedKeys(
          providers.length >= 2 ? providers : (['common', ...providers] as BodyEditorKey[]),
        )

        if (schedule?.enabled && schedule.scheduled_at) {
          setIsScheduled(true)
          setScheduledAtText(formatTokyoDateTime(new Date(schedule.scheduled_at)))
        } else {
          setIsScheduled(false)
          setScheduledAtText('')
        }
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

  const handleToggleKey = (key: BodyEditorKey) => {
    setSelectedKeys((current) => toggleBodyEditorKey(current, key))
  }

  const handleChangeProviderBody = (provider: SocialProvider, value: string) => {
    setProviderBodies((current) => ({
      ...current,
      [provider]: value,
    }))
  }

  const selectedProviders = SOCIAL_PROVIDERS.filter((provider) => selectedKeys.includes(provider))

  const resolveScheduledAtIso = (): string | null => {
    if (!isScheduled) {
      return null
    }

    const parsed = parseTokyoDateTimeInput(scheduledAtText)
    if (!parsed) {
      throw new Error('日時は YYYY/MM/DD HH:mm 形式で入力してください（例: 2026/08/10 20:00）')
    }

    return parsed.toISOString()
  }

  const handleSave = async () => {
    if (!id) return

    try {
      setIsSaving(true)

      const scheduledAt = resolveScheduledAtIso()

      await updatePost(id, {
        title: title.trim() || undefined,
        body: commonBody,
      })

      await Promise.all(
        selectedProviders.map((provider) =>
          upsertPostTarget({
            postId: id,
            provider,
            body: providerBodies[provider] || commonBody,
          }),
        ),
      )

      await upsertSchedule({
        postId: id,
        scheduledAt,
        enabled: isScheduled,
      })

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
        selectedProviders.map((provider) =>
          upsertPostTarget({
            postId: duplicated.id,
            provider,
            body: providerBodies[provider] || commonBody,
          }),
        ),
      )

      await upsertSchedule({
        postId: duplicated.id,
        scheduledAt: resolveScheduledAtIso(),
        enabled: isScheduled,
      })

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        placeholder="タイトル"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <PostBodyEditors
        selectedKeys={selectedKeys}
        onToggleKey={handleToggleKey}
        commonBody={commonBody}
        onChangeCommonBody={setCommonBody}
        providerBodies={providerBodies}
        onChangeProviderBody={handleChangeProviderBody}
      />

      <ScheduleTimingFields
        isScheduled={isScheduled}
        onChangeIsScheduled={setIsScheduled}
        scheduledAtText={scheduledAtText}
        onChangeScheduledAtText={setScheduledAtText}
      />

      <View style={styles.actions}>
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
    </ScrollView>
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
    flexGrow: 1,
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
  actions: {
    gap: 8,
    paddingBottom: 24,
  },
})
