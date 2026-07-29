alter table public.schedules add column if not exists recurrence_type text;
alter table public.schedules add column if not exists recurrence_interval integer;
alter table public.schedules add column if not exists recurrence_weekday integer;
alter table public.schedules add column if not exists recurrence_day_of_month integer;
alter table public.schedules add column if not exists end_at timestamptz;
alter table public.schedules add column if not exists next_run_at timestamptz;

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name in (
    'recurrence_type',
    'recurrence_interval',
    'recurrence_weekday',
    'recurrence_day_of_month',
    'end_at',
    'next_run_at'
  )
order by column_name;
