import { createClient } from 'npm:@supabase/supabase-js@2'

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

  for (const schedule of schedules ?? []) {
    console.log('Scheduled post found', {
      scheduleId: schedule.id,
      postId: schedule.post_id,
    })
  }

  return new Response(
    JSON.stringify({
      processed: schedules?.length ?? 0,
      at: now,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
})
