import type {
  RecurrenceType,
  ScheduleMode,
  ScheduleType,
} from '@/features/schedules/types/schedule'
import { computeNextRunAt, getTokyoWeekday } from '@/features/schedules/utils/next-run-at'
import {
  getDefaultScheduledAt,
  getTokyoDateTimeParts,
} from '@/features/schedules/utils/tokyo-datetime'
import type { UpsertScheduleInput } from '@/features/schedules/api/schedules'

export type ScheduleFormState = {
  scheduleMode: ScheduleMode
  scheduledAt: Date | null
  recurrenceType: RecurrenceType
  recurrenceInterval: number
  recurrenceWeekday: number | null
  recurrenceDayOfMonth: number | null
  endAt: Date | null
}

export const buildUpsertScheduleInput = (
  postId: string,
  state: ScheduleFormState,
): UpsertScheduleInput => {
  if (state.scheduleMode === 'now') {
    return {
      postId,
      scheduleType: 'once',
      scheduledAt: null,
      recurrenceType: 'none',
      recurrenceInterval: null,
      recurrenceWeekday: null,
      recurrenceDayOfMonth: null,
      endAt: null,
      nextRunAt: null,
      enabled: false,
    }
  }

  if (state.scheduleMode === 'once') {
    if (!state.scheduledAt) {
      throw new Error('予約日時を選択してください')
    }

    const scheduledAtIso = state.scheduledAt.toISOString()

    return {
      postId,
      scheduleType: 'once',
      scheduledAt: scheduledAtIso,
      recurrenceType: 'none',
      recurrenceInterval: null,
      recurrenceWeekday: null,
      recurrenceDayOfMonth: null,
      endAt: null,
      nextRunAt: scheduledAtIso,
      enabled: true,
    }
  }

  const timeSource = state.scheduledAt ?? getDefaultScheduledAt()
  const timeParts = getTokyoDateTimeParts(timeSource)
  const recurrenceType = state.recurrenceType === 'none' ? 'weekly' : state.recurrenceType

  const nextRun = computeNextRunAt({
    recurrenceType,
    recurrenceInterval: state.recurrenceInterval,
    recurrenceWeekday: state.recurrenceWeekday ?? getTokyoWeekday(timeSource),
    recurrenceDayOfMonth: state.recurrenceDayOfMonth ?? timeParts.day,
    hour: timeParts.hour,
    minute: timeParts.minute,
    from: new Date(),
    endAt: state.endAt,
  })

  if (!nextRun) {
    throw new Error('終了日までに実行できる日時がありません')
  }

  const nextRunIso = nextRun.toISOString()
  const scheduleType: ScheduleType = 'recurring'

  return {
    postId,
    scheduleType,
    scheduledAt: nextRunIso,
    recurrenceType,
    recurrenceInterval:
      recurrenceType === 'interval' ? Math.max(1, state.recurrenceInterval) : null,
    recurrenceWeekday:
      recurrenceType === 'weekly' ? (state.recurrenceWeekday ?? getTokyoWeekday(timeSource)) : null,
    recurrenceDayOfMonth:
      recurrenceType === 'monthly' ? (state.recurrenceDayOfMonth ?? timeParts.day) : null,
    endAt: state.endAt ? state.endAt.toISOString() : null,
    nextRunAt: nextRunIso,
    enabled: true,
  }
}
