import { supabase } from '@/lib/supabase'

import type { PostTarget, SocialProvider } from '@/features/posts/types/post-target'

export const getPostTargets = async (postId: string): Promise<PostTarget[]> => {
  const { data, error } = await supabase.from('post_targets').select('*').eq('post_id', postId)

  if (error) {
    throw new Error(error.message)
  }

  return (data as PostTarget[]) ?? []
}

type UpsertPostTargetInput = {
  postId: string
  provider: SocialProvider
  body: string
}

export const upsertPostTarget = async ({ postId, provider, body }: UpsertPostTargetInput) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const { data, error } = await supabase
    .from('post_targets')
    .upsert(
      {
        post_id: postId,
        user_id: user.id,
        provider,
        body,
        status: 'draft',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'post_id,provider',
      },
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PostTarget
}
