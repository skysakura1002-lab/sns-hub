-- post_runs: アプリは閲覧のみ。作成・更新は service_role（Edge Function）のみ。

drop policy if exists "users can insert own post runs" on public.post_runs;
drop policy if exists "users can update own post runs" on public.post_runs;
drop policy if exists "users can read own post runs" on public.post_runs;

create policy "users can read own post runs"
on public.post_runs
for select
using (auth.uid() = user_id);
