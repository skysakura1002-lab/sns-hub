import { supabase } from '@/lib/supabase'

import type { Schedule } from '@/features/schedules/types/schedule'

export const getScheduleByPostId = async (postId: string): Promise<Schedule | null> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('post_id', postId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Schedule | null
}

type UpsertScheduleInput = {
  postId: string
  scheduledAt: string | null
  enabled: boolean
}

export const upsertSchedule = async ({ postId, scheduledAt, enabled }: UpsertScheduleInput) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const { data, error } = await supabase
    .from('schedules')
    .upsert(
      {
        post_id: postId,
        user_id: user.id,
        schedule_type: 'once',
        scheduled_at: scheduledAt,
        timezone: 'Asia/Tokyo',
        enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'post_id',
      },
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Schedule
}
