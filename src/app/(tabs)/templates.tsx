import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'

import { createPost } from '@/features/posts/api/posts'
import { getTemplates, type Template } from '@/features/templates/api/templates'
import { toUserErrorMessage } from '@/utils/error-message'

export default function TemplatesScreen() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let active = true

      const load = async () => {
        try {
          setIsLoading(true)
          const data = await getTemplates()
          if (active) setTemplates(data)
        } catch (error) {
          if (active) {
            Alert.alert('読み込みに失敗しました', toUserErrorMessage(error))
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

  const handleSelectTemplate = async (template: Template) => {
    try {
      setIsCreating(true)

      const post = await createPost({
        title: template.title ?? undefined,
        body: template.body,
      })

      router.push({
        pathname: '/posts/[id]',
        params: { id: post.id },
      })
    } catch (error) {
      Alert.alert('下書きの作成に失敗しました', toUserErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>タップすると、テンプレートから新しい下書きを作ります</Text>

      {isLoading || isCreating ? <ActivityIndicator /> : null}

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>テンプレートがありません</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            disabled={isCreating}
            style={styles.item}
            onPress={() => {
              void handleSelectTemplate(item)
            }}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text numberOfLines={2} style={styles.body}>
              {item.body}
            </Text>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hint: {
    color: '#666',
    marginBottom: 8,
  },
  list: {
    paddingBottom: 24,
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    marginTop: 4,
    color: '#333',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
})
