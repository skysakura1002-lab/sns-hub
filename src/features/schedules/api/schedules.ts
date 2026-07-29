import { supabase } from '@/lib/supabase'

import type { RecurrenceType, Schedule, ScheduleType } from '@/features/schedules/types/schedule'

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

export type UpsertScheduleInput = {
  postId: string
  scheduleType: ScheduleType
  scheduledAt: string | null
  recurrenceType?: RecurrenceType | null
  recurrenceInterval?: number | null
  recurrenceWeekday?: number | null
  recurrenceDayOfMonth?: number | null
  endAt?: string | null
  nextRunAt?: string | null
  enabled: boolean
}

export const upsertSchedule = async (input: UpsertScheduleInput) => {
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
        post_id: input.postId,
        user_id: user.id,
        schedule_type: input.scheduleType,
        scheduled_at: input.scheduledAt,
        timezone: 'Asia/Tokyo',
        recurrence_type: input.recurrenceType ?? null,
        recurrence_interval: input.recurrenceInterval ?? null,
        recurrence_weekday: input.recurrenceWeekday ?? null,
        recurrence_day_of_month: input.recurrenceDayOfMonth ?? null,
        end_at: input.endAt ?? null,
        next_run_at: input.nextRunAt ?? null,
        enabled: input.enabled,
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
