import type { RecurrenceType, Schedule } from '@/features/schedules/types/schedule'
import { WEEKDAY_LABELS } from '@/features/schedules/types/schedule'
import {
  formatTokyoDateTime,
  getTokyoDateTimeParts,
} from '@/features/schedules/utils/tokyo-datetime'

const formatTime = (date: Date): string => {
  const parts = getTokyoDateTimeParts(date)
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
}

const formatRecurrence = (schedule: Schedule): string => {
  const type = (schedule.recurrence_type ?? 'weekly') as RecurrenceType
  const timeSource = schedule.next_run_at ?? schedule.scheduled_at
  const timeLabel = timeSource ? formatTime(new Date(timeSource)) : ''

  if (type === 'daily') {
    return timeLabel ? `毎日 ${timeLabel}` : '毎日'
  }

  if (type === 'weekly') {
    const weekday =
      schedule.recurrence_weekday != null ? WEEKDAY_LABELS[schedule.recurrence_weekday] : null
    if (weekday && timeLabel) {
      return `毎週${weekday}曜日 ${timeLabel}`
    }
    if (weekday) {
      return `毎週${weekday}曜日`
    }
    return '毎週'
  }

  if (type === 'monthly') {
    const day = schedule.recurrence_day_of_month
    if (day != null && timeLabel) {
      return `毎月${day}日 ${timeLabel}`
    }
    if (day != null) {
      return `毎月${day}日`
    }
    return '毎月'
  }

  if (type === 'interval') {
    const interval = schedule.recurrence_interval ?? 1
    return timeLabel ? `${interval}日ごと ${timeLabel}` : `${interval}日ごと`
  }

  return '繰り返し'
}

export type ScheduleListInfo = {
  kind: 'none' | 'once' | 'recurring'
  badge: string
  detail: string | null
}

export const getScheduleListInfo = (schedule: Schedule | null | undefined): ScheduleListInfo => {
  if (!schedule?.enabled) {
    return {
      kind: 'none',
      badge: '未予約',
      detail: null,
    }
  }

  const nextAt = schedule.next_run_at ?? schedule.scheduled_at
  const nextLabel = nextAt ? formatTokyoDateTime(new Date(nextAt)) : null

  if (schedule.schedule_type === 'recurring') {
    return {
      kind: 'recurring',
      badge: '繰り返し',
      detail: [formatRecurrence(schedule), nextLabel ? `次回 ${nextLabel}` : null]
        .filter(Boolean)
        .join(' ／ '),
    }
  }

  return {
    kind: 'once',
    badge: '予約',
    detail: nextLabel ? `${nextLabel}` : '日時指定あり',
  }
}
