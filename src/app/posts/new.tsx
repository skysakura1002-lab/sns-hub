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
import { parseTokyoDateTimeInput } from '@/features/schedules/utils/tokyo-datetime'

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
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAtText, setScheduledAtText] = useState('')
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

      let scheduledAt: string | null = null
      if (isScheduled) {
        const parsed = parseTokyoDateTimeInput(scheduledAtText)
        if (!parsed) {
          throw new Error('日時は YYYY/MM/DD HH:mm 形式で入力してください（例: 2026/08/10 20:00）')
        }
        scheduledAt = parsed.toISOString()
      }

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

      await upsertSchedule({
        postId: post.id,
        scheduledAt,
        enabled: isScheduled,
      })

      router.back()
    } catch (error) {
      Alert.alert('保存に失敗しました', error instanceof Error ? error.message : 'Unknown error')
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
        isScheduled={isScheduled}
        onChangeIsScheduled={setIsScheduled}
        scheduledAtText={scheduledAtText}
        onChangeScheduledAtText={setScheduledAtText}
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
