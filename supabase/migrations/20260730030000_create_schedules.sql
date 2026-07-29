create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  schedule_type text not null default 'once',
  scheduled_at timestamptz,
  timezone text not null default 'Asia/Tokyo',

  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint schedules_post_id_unique unique (post_id)
);

alter table public.schedules enable row level security;

drop policy if exists "users can read own schedules" on public.schedules;
drop policy if exists "users can insert own schedules" on public.schedules;
drop policy if exists "users can update own schedules" on public.schedules;
drop policy if exists "users can delete own schedules" on public.schedules;

create policy "users can read own schedules"
on public.schedules for select using (auth.uid() = user_id);

create policy "users can insert own schedules"
on public.schedules for insert with check (auth.uid() = user_id);

create policy "users can update own schedules"
on public.schedules for update using (auth.uid() = user_id);

create policy "users can delete own schedules"
on public.schedules for delete using (auth.uid() = user_id);

select to_regclass('public.schedules') as schedules_table;
