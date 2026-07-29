export type ScheduleType = 'once'

export type Schedule = {
  id: string
  post_id: string
  user_id: string
  schedule_type: ScheduleType
  scheduled_at: string | null
  timezone: string
  enabled: boolean
  created_at: string
  updated_at: string
}
