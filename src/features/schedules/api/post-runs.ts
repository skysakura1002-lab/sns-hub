import { supabase } from '@/lib/supabase'

import type { PostRun, PostRunStatus } from '@/features/schedules/types/post-run'

/** アプリからは参照のみ。作成・更新は Edge Function（service_role）側で行う。 */
export const getPostRuns = async (postId: string): Promise<PostRun[]> => {
  const { data, error } = await supabase
    .from('post_runs')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as PostRun[]) ?? []
}

type CreatePostRunInput = {
  postId: string
  scheduleId?: string | null
  scheduledFor?: string | null
}

/** @deprecated クライアントからは使わない。Backend / service_role 用。 */
export const createPostRun = async ({
  postId,
  scheduleId = null,
  scheduledFor = null,
}: CreatePostRunInput) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const { data, error } = await supabase
    .from('post_runs')
    .insert({
      post_id: postId,
      schedule_id: scheduleId,
      user_id: user.id,
      scheduled_for: scheduledFor,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PostRun
}

/** @deprecated クライアントからは使わない。Backend / service_role 用。 */
export const updatePostRunStatus = async (
  id: string,
  status: PostRunStatus,
  errorMessage?: string | null,
) => {
  const updates: Record<string, unknown> = {
    status,
    error_message: errorMessage ?? null,
  }

  if (status === 'running') {
    updates.started_at = new Date().toISOString()
  }

  if (status === 'success' || status === 'failed') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('post_runs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PostRun
}
