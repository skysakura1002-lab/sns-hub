import { Pressable, Text } from 'react-native'
import { Stack, useRouter } from 'expo-router'

function HeaderBackButton() {
  const router = useRouter()

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => {
        if (router.canGoBack()) {
          router.back()
          return
        }

        router.replace('/(tabs)')
      }}
      style={{ paddingHorizontal: 4, paddingVertical: 8 }}
    >
      <Text style={{ fontSize: 16, color: '#007AFF' }}>‹ 戻る</Text>
    </Pressable>
  )
}

export default function PostsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <HeaderBackButton />,
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: '新しい投稿',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '投稿詳細',
        }}
      />
    </Stack>
  )
}
