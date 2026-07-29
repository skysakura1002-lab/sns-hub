export type SocialProvider = 'x' | 'instagram' | 'threads'

export type PostTarget = {
  id: string
  post_id: string
  user_id: string
  provider: SocialProvider
  body: string
  status: string
  external_post_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export const SOCIAL_PROVIDERS = [
  'x',
  'instagram',
  'threads',
] as const satisfies readonly SocialProvider[]

export const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  x: 'X',
  instagram: 'Instagram',
  threads: 'Threads',
}
