import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { signIn, signUp } from '@/features/auth/api/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setLoading(true)
    setMessage(null)
    try {
      const data = await signUp(email.trim(), password)
      if (data.session) {
        setMessage('登録してログインしました')
      } else {
        setMessage('登録しました。確認メールが必要な設定の場合はメールを確認してください')
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn() {
    setLoading(true)
    setMessage(null)
    try {
      await signIn(email.trim(), password)
      setMessage('ログインしました')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ログイン / 登録</Text>

      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="メールアドレス"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete="password"
        placeholder="パスワード（6文字以上）"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {loading ? <ActivityIndicator /> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        disabled={loading || !email || password.length < 6}
        style={[styles.button, styles.primary]}
        onPress={() => void handleSignIn()}
      >
        <Text style={styles.buttonText}>ログイン</Text>
      </Pressable>

      <Pressable
        disabled={loading || !email || password.length < 6}
        style={[styles.button, styles.secondary]}
        onPress={() => void handleSignUp()}
      >
        <Text style={styles.secondaryText}>新規登録</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#111',
  },
  secondary: {
    backgroundColor: '#f2f2f2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryText: {
    color: '#111',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: '#333',
  },
})
