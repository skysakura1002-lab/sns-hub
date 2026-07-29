create table if not exists public.post_runs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,

  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  status text not null default 'pending',
  error_message text,

  created_at timestamptz not null default now()
);

alter table public.post_runs enable row level security;

drop policy if exists "users can read own post runs" on public.post_runs;
drop policy if exists "users can insert own post runs" on public.post_runs;
drop policy if exists "users can update own post runs" on public.post_runs;

create policy "users can read own post runs"
on public.post_runs for select using (auth.uid() = user_id);

create policy "users can insert own post runs"
on public.post_runs for insert with check (auth.uid() = user_id);

create policy "users can update own post runs"
on public.post_runs for update using (auth.uid() = user_id);

select to_regclass('public.post_runs') as post_runs_table;
