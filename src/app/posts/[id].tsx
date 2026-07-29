import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Button, StyleSheet, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { deletePost, getPostById, updatePost } from '@/features/posts/api/posts'

export default function PostDetailScreen() {
  const router = useRouter()
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>()
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadPost = async () => {
      try {
        const post = await getPostById(id)

        setTitle(post.title ?? '')
        setBody(post.body)
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

  const handleSave = async () => {
    if (!id) return

    try {
      setIsSaving(true)

      await updatePost(id, {
        title: title.trim() || undefined,
        body,
      })

      router.back()
    } catch (error) {
      Alert.alert('更新に失敗しました', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSaving(false)
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
        title={isSaving ? '保存中...' : '変更を保存'}
        onPress={() => {
          void handleSave()
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
    gap: 16,
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
})
