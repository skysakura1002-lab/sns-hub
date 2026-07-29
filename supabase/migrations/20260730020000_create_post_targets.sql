create table if not exists public.post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  body text not null default '',
  status text not null default 'draft',
  external_post_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(post_id, provider)
);

alter table public.post_targets enable row level security;

drop policy if exists "users can read own post targets" on public.post_targets;
drop policy if exists "users can insert own post targets" on public.post_targets;
drop policy if exists "users can update own post targets" on public.post_targets;
drop policy if exists "users can delete own post targets" on public.post_targets;

create policy "users can read own post targets"
on public.post_targets for select using (auth.uid() = user_id);

create policy "users can insert own post targets"
on public.post_targets for insert with check (auth.uid() = user_id);

create policy "users can update own post targets"
on public.post_targets for update using (auth.uid() = user_id);

create policy "users can delete own post targets"
on public.post_targets for delete using (auth.uid() = user_id);

select to_regclass('public.post_targets') as post_targets_table;
