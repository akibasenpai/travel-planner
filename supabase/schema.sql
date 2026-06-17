-- たびめも: Supabase (PostgreSQL) テーブル定義
-- Supabase Dashboard > SQL Editor で実行してください

-- 行程1件分のJSON構造（schedules カラム内）:
-- {
--   "datetime": "2026/07/01 10:00",
--   "location": "東京駅",
--   "map_url": "https://maps.google.com/...",
--   "activity": "新幹線に乗る"
-- }

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  schedules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- schedules の各要素が必須キーを持つことを検証（任意）
alter table public.trips
  add constraint trips_schedules_is_array
  check (jsonb_typeof(schedules) = 'array');

create index if not exists trips_created_at_idx
  on public.trips (created_at desc);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
  before update on public.trips
  for each row
  execute function public.set_updated_at();

-- 認証なし・個人利用前提: anon キーから全操作を許可
-- ※ 本番では URL を知っている人だけがアクセスする想定
alter table public.trips enable row level security;

drop policy if exists "Allow public read" on public.trips;
create policy "Allow public read"
  on public.trips for select
  using (true);

drop policy if exists "Allow public insert" on public.trips;
create policy "Allow public insert"
  on public.trips for insert
  with check (true);

drop policy if exists "Allow public update" on public.trips;
create policy "Allow public update"
  on public.trips for update
  using (true)
  with check (true);

drop policy if exists "Allow public delete" on public.trips;
create policy "Allow public delete"
  on public.trips for delete
  using (true);
