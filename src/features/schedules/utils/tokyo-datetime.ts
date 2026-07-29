const TOKYO_INPUT_PATTERN = /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/

/** Display a UTC instant as Asia/Tokyo wall time: YYYY/MM/DD HH:mm */
export const formatTokyoDateTime = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`
}

/**
 * Parse YYYY/MM/DD HH:mm as Asia/Tokyo local time into a Date (UTC instant).
 */
export const parseTokyoDateTimeInput = (input: string): Date | null => {
  const match = input.trim().match(TOKYO_INPUT_PATTERN)
  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute] = match
  const isoWithOffset = `${year}-${month}-${day}T${hour}:${minute}:00+09:00`
  const date = new Date(isoWithOffset)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}
