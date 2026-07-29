export type ScheduleType = 'once' | 'recurring'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'interval'

export type ScheduleMode = 'now' | 'once' | 'recurring'

export type Schedule = {
  id: string
  post_id: string
  user_id: string
  schedule_type: ScheduleType
  scheduled_at: string | null
  timezone: string
  recurrence_type: RecurrenceType | null
  recurrence_interval: number | null
  recurrence_weekday: number | null
  recurrence_day_of_month: number | null
  end_at: string | null
  next_run_at: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

/** 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土 */
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const
