export type TokyoDateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const getTokyoPart = (date: Date, type: Intl.DateTimeFormatPartTypes): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return parts.find((part) => part.type === type)?.value ?? ''
}

/** Display a UTC instant as Asia/Tokyo wall time: YYYY/MM/DD HH:mm */
export const formatTokyoDateTime = (date: Date): string => {
  const parts = getTokyoDateTimeParts(date)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parts.year}/${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`
}

export const getTokyoDateTimeParts = (date: Date): TokyoDateTimeParts => ({
  year: Number(getTokyoPart(date, 'year')),
  month: Number(getTokyoPart(date, 'month')),
  day: Number(getTokyoPart(date, 'day')),
  hour: Number(getTokyoPart(date, 'hour')),
  minute: Number(getTokyoPart(date, 'minute')),
})

export const buildTokyoDate = ({
  year,
  month,
  day,
  hour,
  minute,
}: TokyoDateTimeParts): Date | null => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const isoWithOffset = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`
  const date = new Date(isoWithOffset)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export const getDaysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate()

/** Default: current time in Asia/Tokyo (minute precision). */
export const getDefaultScheduledAt = (now = new Date()): Date => {
  const parts = getTokyoDateTimeParts(now)
  return buildTokyoDate(parts) ?? now
}

/**
 * Parse YYYY/MM/DD HH:mm as Asia/Tokyo local time into a Date (UTC instant).
 */
export const parseTokyoDateTimeInput = (input: string): Date | null => {
  const match = input.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/)
  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute] = match
  return buildTokyoDate({
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  })
}
