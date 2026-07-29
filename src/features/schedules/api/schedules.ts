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

export const getSchedulesByPostIds = async (
  postIds: string[],
): Promise<Record<string, Schedule>> => {
  if (postIds.length === 0) {
    return {}
  }

  const { data, error } = await supabase.from('schedules').select('*').in('post_id', postIds)

  if (error) {
    throw new Error(error.message)
  }

  const map: Record<string, Schedule> = {}
  for (const row of (data as Schedule[]) ?? []) {
    map[row.post_id] = row
  }
  return map
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

const isMissingRecurrenceColumnError = (message: string) =>
  /recurrence_|next_run_at|end_at/i.test(message) && /column/i.test(message)

export const upsertSchedule = async (input: UpsertScheduleInput) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const baseRow = {
    post_id: input.postId,
    user_id: user.id,
    schedule_type: input.scheduleType === 'recurring' ? 'once' : input.scheduleType,
    scheduled_at: input.scheduledAt,
    timezone: 'Asia/Tokyo',
    enabled: input.enabled,
    updated_at: new Date().toISOString(),
  }

  const fullRow = {
    ...baseRow,
    schedule_type: input.scheduleType,
    recurrence_type: input.recurrenceType ?? null,
    recurrence_interval: input.recurrenceInterval ?? null,
    recurrence_weekday: input.recurrenceWeekday ?? null,
    recurrence_day_of_month: input.recurrenceDayOfMonth ?? null,
    end_at: input.endAt ?? null,
    next_run_at: input.nextRunAt ?? null,
  }

  const { data, error } = await supabase
    .from('schedules')
    .upsert(fullRow, {
      onConflict: 'post_id',
    })
    .select()
    .single()

  if (!error) {
    return data as Schedule
  }

  if (!isMissingRecurrenceColumnError(error.message)) {
    throw new Error(error.message)
  }

  // DBに繰り返し用カラムがまだ無い場合は、旧スキーマだけで保存する
  const { data: legacyData, error: legacyError } = await supabase
    .from('schedules')
    .upsert(baseRow, {
      onConflict: 'post_id',
    })
    .select()
    .single()

  if (legacyError) {
    throw new Error(
      '予約設定の保存に失敗しました。Supabaseで schedules の繰り返し用カラム追加SQLを実行してください。',
    )
  }

  if (input.scheduleType === 'recurring') {
    throw new Error(
      '繰り返し投稿用のカラムがDBにありません。Supabase SQL Editorでマイグレーションを実行してください。',
    )
  }

  return legacyData as Schedule
}
