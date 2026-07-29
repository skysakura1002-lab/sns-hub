-- posts テーブル（何度実行しても安全な版）
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "users can read own posts" on public.posts;
drop policy if exists "users can insert own posts" on public.posts;
drop policy if exists "users can update own posts" on public.posts;
drop policy if exists "users can delete own posts" on public.posts;

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

-- 作成確認（1行出ればOK）
select to_regclass('public.posts') as posts_table;
