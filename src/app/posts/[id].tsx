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
import { getPostRuns } from '@/features/schedules/api/post-runs'
import { getScheduleByPostId, upsertSchedule } from '@/features/schedules/api/schedules'
import { PostRunHistory } from '@/features/schedules/components/PostRunHistory'
import { ScheduleTimingFields } from '@/features/schedules/components/ScheduleTimingFields'
import type { PostRun } from '@/features/schedules/types/post-run'
import type { RecurrenceType, ScheduleMode } from '@/features/schedules/types/schedule'
import { buildUpsertScheduleInput } from '@/features/schedules/utils/build-upsert-schedule'
import { createTemplate } from '@/features/templates/api/templates'
import { toUserErrorMessage } from '@/utils/error-message'

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
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now')
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceWeekday, setRecurrenceWeekday] = useState<number | null>(null)
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | null>(null)
  const [endAt, setEndAt] = useState<Date | null>(null)
  const [postRuns, setPostRuns] = useState<PostRun[]>([])
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

        if (!schedule?.enabled) {
          setScheduleMode('now')
          setScheduledAt(null)
          setEndAt(null)
        } else if (schedule.schedule_type === 'recurring') {
          setScheduleMode('recurring')
          setScheduledAt(
            schedule.next_run_at
              ? new Date(schedule.next_run_at)
              : schedule.scheduled_at
                ? new Date(schedule.scheduled_at)
                : null,
          )
          setRecurrenceType(schedule.recurrence_type ?? 'weekly')
          setRecurrenceInterval(schedule.recurrence_interval ?? 1)
          setRecurrenceWeekday(schedule.recurrence_weekday)
          setRecurrenceDayOfMonth(schedule.recurrence_day_of_month)
          setEndAt(schedule.end_at ? new Date(schedule.end_at) : null)
        } else {
          setScheduleMode('once')
          setScheduledAt(schedule.scheduled_at ? new Date(schedule.scheduled_at) : null)
          setRecurrenceType('none')
          setEndAt(null)
        }

        try {
          const runs = await getPostRuns(id)
          setPostRuns(runs)
        } catch {
          setPostRuns([])
        }
      } catch (error) {
        console.error(error)
        Alert.alert('投稿を取得できませんでした', toUserErrorMessage(error))
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

  const scheduleFormState = {
    scheduleMode,
    scheduledAt,
    recurrenceType,
    recurrenceInterval,
    recurrenceWeekday,
    recurrenceDayOfMonth,
    endAt,
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
        selectedProviders.map((provider) =>
          upsertPostTarget({
            postId: id,
            provider,
            body: providerBodies[provider] || commonBody,
          }),
        ),
      )

      try {
        await upsertSchedule(buildUpsertScheduleInput(id, scheduleFormState))
      } catch (scheduleError) {
        Alert.alert(
          '投稿は保存しましたが、予約設定に失敗しました',
          toUserErrorMessage(scheduleError),
        )
        router.back()
        return
      }

      router.back()
    } catch (error) {
      Alert.alert('更新に失敗しました', toUserErrorMessage(error))
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

      await upsertSchedule(buildUpsertScheduleInput(duplicated.id, scheduleFormState))

      router.replace({
        pathname: '/posts/[id]',
        params: {
          id: duplicated.id,
        },
      })
    } catch (error) {
      Alert.alert('複製に失敗しました', toUserErrorMessage(error))
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
      Alert.alert('保存に失敗しました', toUserErrorMessage(error))
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
              Alert.alert('削除に失敗しました', toUserErrorMessage(error))
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
        scheduleMode={scheduleMode}
        onChangeScheduleMode={setScheduleMode}
        scheduledAt={scheduledAt}
        onChangeScheduledAt={setScheduledAt}
        recurrenceType={recurrenceType}
        onChangeRecurrenceType={setRecurrenceType}
        recurrenceInterval={recurrenceInterval}
        onChangeRecurrenceInterval={setRecurrenceInterval}
        recurrenceWeekday={recurrenceWeekday}
        onChangeRecurrenceWeekday={setRecurrenceWeekday}
        recurrenceDayOfMonth={recurrenceDayOfMonth}
        onChangeRecurrenceDayOfMonth={setRecurrenceDayOfMonth}
        endAt={endAt}
        onChangeEndAt={setEndAt}
      />

      <PostRunHistory runs={postRuns} />

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
