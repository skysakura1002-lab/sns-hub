import 'react-native-gesture-handler'

import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'

import { useSession } from '@/features/auth/hooks/useSession'

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useSession()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return

    const isAuthRoute = segments[0] === '(auth)'

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/(auth)/login')
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, router, segments])

  if (isLoading) {
    return null
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
