create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title text,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "users can read own templates" on public.templates;
drop policy if exists "users can insert own templates" on public.templates;
drop policy if exists "users can update own templates" on public.templates;
drop policy if exists "users can delete own templates" on public.templates;

create policy "users can read own templates"
on public.templates for select using (auth.uid() = user_id);

create policy "users can insert own templates"
on public.templates for insert with check (auth.uid() = user_id);

create policy "users can update own templates"
on public.templates for update using (auth.uid() = user_id);

create policy "users can delete own templates"
on public.templates for delete using (auth.uid() = user_id);

select to_regclass('public.templates') as templates_table;
