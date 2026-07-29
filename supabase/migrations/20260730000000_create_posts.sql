create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "users can read own posts"
on public.posts
for select
using (auth.uid() = user_id);

create policy "users can insert own posts"
on public.posts
for insert
with check (auth.uid() = user_id);

create policy "users can update own posts"
on public.posts
for update
using (auth.uid() = user_id);

create policy "users can delete own posts"
on public.posts
for delete
using (auth.uid() = user_id);
