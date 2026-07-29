import { useState } from 'react'
import { Alert, Button, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'

import { upsertPostTarget } from '@/features/posts/api/post-targets'
import { createPost } from '@/features/posts/api/posts'
import {
  PostBodyEditors,
  toggleBodyEditorKey,
  type BodyEditorKey,
} from '@/features/posts/components/PostBodyEditors'
import { SOCIAL_PROVIDERS, type SocialProvider } from '@/features/posts/types/post-target'
import { upsertSchedule } from '@/features/schedules/api/schedules'
import { ScheduleTimingFields } from '@/features/schedules/components/ScheduleTimingFields'
import type { RecurrenceType, ScheduleMode } from '@/features/schedules/types/schedule'
import { buildUpsertScheduleInput } from '@/features/schedules/utils/build-upsert-schedule'
import { toUserErrorMessage } from '@/utils/error-message'

export default function NewPostScreen() {
  const router = useRouter()

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
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleKey = (key: BodyEditorKey) => {
    setSelectedKeys((current) => toggleBodyEditorKey(current, key))
  }

  const handleChangeProviderBody = (provider: SocialProvider, value: string) => {
    setProviderBodies((current) => ({
      ...current,
      [provider]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const selectedProviders = SOCIAL_PROVIDERS.filter((provider) =>
        selectedKeys.includes(provider),
      )

      const post = await createPost({
        title: title.trim() || undefined,
        body: commonBody,
      })

      await Promise.all(
        selectedProviders.map((provider) =>
          upsertPostTarget({
            postId: post.id,
            provider,
            body: providerBodies[provider] || commonBody,
          }),
        ),
      )

      try {
        await upsertSchedule(
          buildUpsertScheduleInput(post.id, {
            scheduleMode,
            scheduledAt,
            recurrenceType,
            recurrenceInterval,
            recurrenceWeekday,
            recurrenceDayOfMonth,
            endAt,
          }),
        )
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
      Alert.alert('保存に失敗しました', toUserErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
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

      <View style={styles.actions}>
        <Button
          disabled={isSaving}
          title={isSaving ? '保存中...' : '下書き保存'}
          onPress={() => {
            void handleSave()
          }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
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
