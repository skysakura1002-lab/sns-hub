import { useState } from 'react'
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'

import { createPost } from '@/features/posts/api/posts'

export default function NewPostScreen() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)

      await createPost({
        title: title.trim() || undefined,
        body,
      })

      router.back()
    } catch (error) {
      Alert.alert('保存に失敗しました', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="タイトル"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        multiline
        placeholder="投稿内容"
        style={[styles.input, styles.body]}
        textAlignVertical="top"
        value={body}
        onChangeText={setBody}
      />

      <Button
        disabled={isSaving}
        title={isSaving ? '保存中...' : '下書き保存'}
        onPress={() => {
          void handleSave()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  body: {
    minHeight: 180,
  },
})
