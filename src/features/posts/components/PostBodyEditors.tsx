import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import {
  SOCIAL_PROVIDER_LABELS,
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/features/posts/types/post-target'

export type BodyEditorKey = 'common' | SocialProvider

export const ALL_BODY_EDITOR_KEYS = [
  'common',
  ...SOCIAL_PROVIDERS,
] as const satisfies readonly BodyEditorKey[]

const EDITOR_OPTIONS = [
  { key: 'common' as const, label: '共通' },
  ...SOCIAL_PROVIDERS.map((provider) => ({
    key: provider,
    label: SOCIAL_PROVIDER_LABELS[provider],
  })),
]

type PostBodyEditorsProps = {
  selectedKeys: BodyEditorKey[]
  onToggleKey: (key: BodyEditorKey) => void
  commonBody: string
  onChangeCommonBody: (value: string) => void
  providerBodies: Record<SocialProvider, string>
  onChangeProviderBody: (provider: SocialProvider, value: string) => void
}

export function PostBodyEditors({
  selectedKeys,
  onToggleKey,
  commonBody,
  onChangeCommonBody,
  providerBodies,
  onChangeProviderBody,
}: PostBodyEditorsProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.hint}>SNSは複数選択できます。共通を選ぶと他の選択は解除されます</Text>

      <View style={styles.tabs}>
        {EDITOR_OPTIONS.map((option) => {
          const selected = selectedKeys.includes(option.key)
          return (
            <Pressable
              key={option.key}
              style={[styles.tab, selected && styles.tabSelected]}
              onPress={() => onToggleKey(option.key)}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {selectedKeys.includes('common') ? (
        <View style={styles.field}>
          <Text style={styles.sectionLabel}>共通文章</Text>
          <TextInput
            multiline
            placeholder="共通の投稿内容"
            style={[styles.input, styles.body]}
            textAlignVertical="top"
            value={commonBody}
            onChangeText={onChangeCommonBody}
          />
        </View>
      ) : null}

      {SOCIAL_PROVIDERS.filter((provider) => selectedKeys.includes(provider)).map((provider) => (
        <View key={provider} style={styles.field}>
          <Text style={styles.sectionLabel}>{SOCIAL_PROVIDER_LABELS[provider]} 用本文</Text>
          <TextInput
            multiline
            placeholder={`${SOCIAL_PROVIDER_LABELS[provider]} 用の投稿内容`}
            style={[styles.input, styles.body]}
            textAlignVertical="top"
            value={providerBodies[provider]}
            onChangeText={(value) => onChangeProviderBody(provider, value)}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  tabText: {
    color: '#111',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#fff',
  },
  field: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
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
    minHeight: 120,
  },
})

const withoutCommonWhenMultipleProviders = (keys: BodyEditorKey[]): BodyEditorKey[] => {
  const selectedProviders = SOCIAL_PROVIDERS.filter((provider) => keys.includes(provider))

  if (selectedProviders.length >= 2) {
    return keys.filter((item) => item !== 'common')
  }

  return keys
}

export const toggleBodyEditorKey = (
  current: BodyEditorKey[],
  key: BodyEditorKey,
): BodyEditorKey[] => {
  if (key === 'common') {
    if (current.includes('common') && current.length === 1) {
      return current
    }
    return ['common']
  }

  let next: BodyEditorKey[]

  if (current.includes(key)) {
    if (current.length === 1) {
      return current
    }
    next = current.filter((item) => item !== key)
  } else {
    next = [...current.filter((item) => item !== 'common'), key]
  }

  return withoutCommonWhenMultipleProviders(next)
}
