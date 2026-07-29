import {
  buildTokyoDate,
  getDaysInMonth,
  getTokyoDateTimeParts,
} from '@/features/schedules/utils/tokyo-datetime'
import type { RecurrenceType } from '@/features/schedules/types/schedule'

export type NextRunInput = {
  recurrenceType: RecurrenceType
  recurrenceInterval?: number | null
  recurrenceWeekday?: number | null
  recurrenceDayOfMonth?: number | null
  hour: number
  minute: number
  from?: Date
  endAt?: Date | null
}

const WEEKDAY_SHORT_TO_NUMBER: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export const getTokyoWeekday = (date: Date): number => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  }).format(date)

  return WEEKDAY_SHORT_TO_NUMBER[weekday] ?? 0
}

const atTokyoTimeOnOffsetDays = (
  from: Date,
  dayOffset: number,
  hour: number,
  minute: number,
): Date | null => {
  const base = getTokyoDateTimeParts(from)
  const utcProbe = Date.UTC(base.year, base.month - 1, base.day + dayOffset, 12, 0, 0)
  const probeParts = getTokyoDateTimeParts(new Date(utcProbe))

  return buildTokyoDate({
    year: probeParts.year,
    month: probeParts.month,
    day: probeParts.day,
    hour,
    minute,
  })
}

const clampDayOfMonth = (year: number, month: number, dayOfMonth: number): number =>
  Math.min(dayOfMonth, getDaysInMonth(year, month))

const withinEnd = (candidate: Date, endAt?: Date | null): Date | null => {
  if (endAt && candidate.getTime() > endAt.getTime()) {
    return null
  }
  return candidate
}

/**
 * Compute the next run instant (UTC Date) after `from` for the given recurrence.
 * Returns null when no valid future run exists (e.g. past end_at).
 */
export const computeNextRunAt = ({
  recurrenceType,
  recurrenceInterval,
  recurrenceWeekday,
  recurrenceDayOfMonth,
  hour,
  minute,
  from = new Date(),
  endAt = null,
}: NextRunInput): Date | null => {
  if (recurrenceType === 'none') {
    return null
  }

  if (recurrenceType === 'daily') {
    for (let offset = 0; offset < 3; offset += 1) {
      const candidate = atTokyoTimeOnOffsetDays(from, offset, hour, minute)
      if (candidate && candidate.getTime() >= from.getTime()) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  if (recurrenceType === 'weekly') {
    const targetWeekday = recurrenceWeekday ?? getTokyoWeekday(from)

    for (let offset = 0; offset < 14; offset += 1) {
      const candidate = atTokyoTimeOnOffsetDays(from, offset, hour, minute)
      if (
        candidate &&
        getTokyoWeekday(candidate) === targetWeekday &&
        candidate.getTime() >= from.getTime()
      ) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  if (recurrenceType === 'monthly') {
    const dayOfMonth = recurrenceDayOfMonth ?? getTokyoDateTimeParts(from).day
    const start = getTokyoDateTimeParts(from)

    for (let monthOffset = 0; monthOffset < 24; monthOffset += 1) {
      const monthIndex = start.month - 1 + monthOffset
      const year = start.year + Math.floor(monthIndex / 12)
      const month = (monthIndex % 12) + 1
      const day = clampDayOfMonth(year, month, dayOfMonth)
      const candidate = buildTokyoDate({ year, month, day, hour, minute })

      if (candidate && candidate.getTime() >= from.getTime()) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  if (recurrenceType === 'interval') {
    const intervalDays = Math.max(1, recurrenceInterval ?? 1)

    for (let step = 0; step < 400; step += 1) {
      const candidate = atTokyoTimeOnOffsetDays(from, step * intervalDays, hour, minute)
      if (candidate && candidate.getTime() >= from.getTime()) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  return null
}
