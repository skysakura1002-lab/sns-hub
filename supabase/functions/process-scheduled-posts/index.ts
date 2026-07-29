import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'interval'

type TokyoDateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

type ScheduleRow = {
  id: string
  post_id: string
  user_id: string
  schedule_type: 'once' | 'recurring'
  scheduled_at: string | null
  next_run_at: string | null
  recurrence_type: RecurrenceType | null
  recurrence_interval: number | null
  recurrence_weekday: number | null
  recurrence_day_of_month: number | null
  end_at: string | null
  enabled: boolean
  posts:
    | {
        id: string
        user_id: string
        title: string | null
        body: string
        post_targets: Array<{
          id: string
          provider: string
          body: string
          status: string
        }> | null
      }
    | null
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

const getTokyoDateTimeParts = (date: Date): TokyoDateTimeParts => ({
  year: Number(getTokyoPart(date, 'year')),
  month: Number(getTokyoPart(date, 'month')),
  day: Number(getTokyoPart(date, 'day')),
  hour: Number(getTokyoPart(date, 'hour')),
  minute: Number(getTokyoPart(date, 'minute')),
})

const buildTokyoDate = ({
  year,
  month,
  day,
  hour,
  minute,
}: TokyoDateTimeParts): Date | null => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const isoWithOffset = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`
  const date = new Date(isoWithOffset)
  return Number.isNaN(date.getTime()) ? null : date
}

const getDaysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate()

const getTokyoWeekday = (date: Date): number => {
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

const withinEnd = (candidate: Date, endAt?: Date | null): Date | null => {
  if (endAt && candidate.getTime() > endAt.getTime()) {
    return null
  }
  return candidate
}

const computeNextRunAt = ({
  recurrenceType,
  recurrenceInterval,
  recurrenceWeekday,
  recurrenceDayOfMonth,
  hour,
  minute,
  from,
  endAt = null,
}: {
  recurrenceType: RecurrenceType
  recurrenceInterval?: number | null
  recurrenceWeekday?: number | null
  recurrenceDayOfMonth?: number | null
  hour: number
  minute: number
  from: Date
  endAt?: Date | null
}): Date | null => {
  if (recurrenceType === 'none') {
    return null
  }

  if (recurrenceType === 'daily') {
    for (let offset = 0; offset < 400; offset += 1) {
      const candidate = atTokyoTimeOnOffsetDays(from, offset, hour, minute)
      if (candidate && candidate.getTime() > from.getTime()) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  if (recurrenceType === 'weekly') {
    const targetWeekday = recurrenceWeekday ?? getTokyoWeekday(from)
    for (let offset = 0; offset < 400; offset += 1) {
      const candidate = atTokyoTimeOnOffsetDays(from, offset, hour, minute)
      if (
        candidate &&
        getTokyoWeekday(candidate) === targetWeekday &&
        candidate.getTime() > from.getTime()
      ) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  if (recurrenceType === 'monthly') {
    const dayOfMonth = recurrenceDayOfMonth ?? getTokyoDateTimeParts(from).day
    const start = getTokyoDateTimeParts(from)

    for (let monthOffset = 0; monthOffset < 36; monthOffset += 1) {
      const monthIndex = start.month - 1 + monthOffset
      const year = start.year + Math.floor(monthIndex / 12)
      const month = (monthIndex % 12) + 1
      const day = Math.min(dayOfMonth, getDaysInMonth(year, month))
      const candidate = buildTokyoDate({ year, month, day, hour, minute })

      if (candidate && candidate.getTime() > from.getTime()) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  if (recurrenceType === 'interval') {
    const intervalDays = Math.max(1, recurrenceInterval ?? 1)
    for (let step = 1; step < 400; step += 1) {
      const candidate = atTokyoTimeOnOffsetDays(from, step * intervalDays, hour, minute)
      if (candidate && candidate.getTime() > from.getTime()) {
        return withinEnd(candidate, endAt)
      }
    }
    return null
  }

  return null
}

const advanceSchedule = async (supabase: SupabaseClient, schedule: ScheduleRow) => {
  const currentRunAt = schedule.next_run_at ? new Date(schedule.next_run_at) : new Date()

  if (schedule.schedule_type !== 'recurring') {
    const { error } = await supabase
      .from('schedules')
      .update({
        enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.id)

    if (error) {
      throw new Error(error.message)
    }
    return { enabled: false, nextRunAt: null as string | null }
  }

  const recurrenceType = (schedule.recurrence_type ?? 'weekly') as RecurrenceType
  const timeParts = getTokyoDateTimeParts(currentRunAt)
  const next = computeNextRunAt({
    recurrenceType,
    recurrenceInterval: schedule.recurrence_interval,
    recurrenceWeekday: schedule.recurrence_weekday,
    recurrenceDayOfMonth: schedule.recurrence_day_of_month,
    hour: timeParts.hour,
    minute: timeParts.minute,
    from: currentRunAt,
    endAt: schedule.end_at ? new Date(schedule.end_at) : null,
  })

  if (!next) {
    const { error } = await supabase
      .from('schedules')
      .update({
        enabled: false,
        next_run_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.id)

    if (error) {
      throw new Error(error.message)
    }
    return { enabled: false, nextRunAt: null as string | null }
  }

  const nextIso = next.toISOString()
  const { error } = await supabase
    .from('schedules')
    .update({
      next_run_at: nextIso,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schedule.id)

  if (error) {
    throw new Error(error.message)
  }

  return { enabled: true, nextRunAt: nextIso }
}

const processSchedule = async (supabase: SupabaseClient, schedule: ScheduleRow) => {
  const post = schedule.posts
  if (!post) {
    throw new Error('Post not found for schedule')
  }

  const scheduledFor = schedule.next_run_at ?? new Date().toISOString()

  const { data: existingRuns, error: existingError } = await supabase
    .from('post_runs')
    .select('id, status')
    .eq('post_id', schedule.post_id)
    .eq('scheduled_for', scheduledFor)
    .in('status', ['pending', 'running', 'success'])
    .limit(1)

  if (existingError) {
    throw new Error(existingError.message)
  }

  if ((existingRuns?.length ?? 0) > 0) {
    console.log('Skip already processed schedule slot', {
      scheduleId: schedule.id,
      postId: schedule.post_id,
      scheduledFor,
    })
    await advanceSchedule(supabase, schedule)
    return { status: 'skipped' as const }
  }

  const { data: postRun, error: createError } = await supabase
    .from('post_runs')
    .insert({
      post_id: schedule.post_id,
      schedule_id: schedule.id,
      user_id: schedule.user_id,
      scheduled_for: scheduledFor,
      status: 'pending',
    })
    .select()
    .single()

  if (createError || !postRun) {
    throw new Error(createError?.message ?? 'Failed to create post_run')
  }

  console.log('post_run created', { postRunId: postRun.id, status: 'pending' })

  try {
    const { error: runningError } = await supabase
      .from('post_runs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', postRun.id)

    if (runningError) {
      throw new Error(runningError.message)
    }

    console.log('post_run running', {
      postRunId: postRun.id,
      postId: post.id,
      targets: (post.post_targets ?? []).map((target) => target.provider),
    })

    // SNS投稿は未接続。実行パイプラインの確認まで。
    const { error: successError } = await supabase
      .from('post_runs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', postRun.id)

    if (successError) {
      throw new Error(successError.message)
    }

    const advanced = await advanceSchedule(supabase, schedule)

    console.log('post_run success', {
      postRunId: postRun.id,
      nextRunAt: advanced.nextRunAt,
      enabled: advanced.enabled,
    })

    return { status: 'success' as const, postRunId: postRun.id, ...advanced }
  } catch (innerError) {
    const message = innerError instanceof Error ? innerError.message : 'Unknown error'

    await supabase
      .from('post_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', postRun.id)

    throw innerError
  }
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date().toISOString()

  const { data: schedules, error } = await supabase
    .from('schedules')
    .select(
      `
      *,
      posts (
        id,
        user_id,
        title,
        body,
        post_targets (*)
      )
    `,
    )
    .eq('enabled', true)
    .lte('next_run_at', now)

  if (error) {
    console.error(error)

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const results: Array<Record<string, unknown>> = []

  for (const schedule of (schedules as ScheduleRow[] | null) ?? []) {
    console.log('Scheduled post found', {
      scheduleId: schedule.id,
      postId: schedule.post_id,
    })

    try {
      const result = await processSchedule(supabase, schedule)
      results.push({
        scheduleId: schedule.id,
        postId: schedule.post_id,
        ...result,
      })
    } catch (processError) {
      const message = processError instanceof Error ? processError.message : 'Unknown error'
      console.error('Failed to process schedule', {
        scheduleId: schedule.id,
        postId: schedule.post_id,
        message,
      })

      results.push({
        scheduleId: schedule.id,
        postId: schedule.post_id,
        status: 'failed',
        error: message,
      })
    }
  }

  return new Response(
    JSON.stringify({
      processed: schedules?.length ?? 0,
      results,
      at: now,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
})
