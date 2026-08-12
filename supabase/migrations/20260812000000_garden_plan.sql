-- Garden plan storage: one plan per user, with plants and zones as
-- child rows. save_garden_plan() replaces plants/zones wholesale on every
-- save since the client always sends the full current document.

create table if not exists garden_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  rows int not null,
  cols int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists garden_plants (
  id text primary key,
  garden_id uuid not null references garden_plans (id) on delete cascade,
  name text not null,
  start_row int not null,
  start_col int not null,
  width int not null,
  height int not null,
  photo_url text,
  color text,
  species text,
  species_uncertain boolean not null default false,
  last_watered_at timestamptz,
  care_advice text,
  notes text
);

create index if not exists garden_plants_garden_id_idx on garden_plants (garden_id);

create table if not exists garden_zones (
  id text primary key,
  garden_id uuid not null references garden_plans (id) on delete cascade,
  kind text not null,
  label text not null,
  start_row int not null,
  start_col int not null,
  width int not null,
  height int not null,
  color text not null,
  notes text
);

create index if not exists garden_zones_garden_id_idx on garden_zones (garden_id);

alter table garden_plans enable row level security;
alter table garden_plants enable row level security;
alter table garden_zones enable row level security;

create policy "Users manage their own garden plan"
  on garden_plans for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage their own plants"
  on garden_plants for all
  using (exists (select 1 from garden_plans p where p.id = garden_id and p.user_id = auth.uid()))
  with check (exists (select 1 from garden_plans p where p.id = garden_id and p.user_id = auth.uid()));

create policy "Users manage their own zones"
  on garden_zones for all
  using (exists (select 1 from garden_plans p where p.id = garden_id and p.user_id = auth.uid()))
  with check (exists (select 1 from garden_plans p where p.id = garden_id and p.user_id = auth.uid()));

-- Replaces the caller's whole garden document in one transaction: upserts
-- the plan row, then fully replaces its plants and zones from the given
-- JSON arrays. security invoker so it runs as the calling user and RLS
-- above still applies.
create or replace function save_garden_plan(p_rows int, p_cols int, p_plants jsonb, p_zones jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_garden_id uuid;
begin
  insert into garden_plans (user_id, rows, cols)
  values (auth.uid(), p_rows, p_cols)
  on conflict (user_id) do update set rows = excluded.rows, cols = excluded.cols, updated_at = now()
  returning id into v_garden_id;

  delete from garden_plants where garden_id = v_garden_id;
  insert into garden_plants (
    id, garden_id, name, start_row, start_col, width, height,
    photo_url, color, species, species_uncertain, last_watered_at, care_advice, notes
  )
  select
    elem ->> 'id',
    v_garden_id,
    elem ->> 'name',
    (elem ->> 'startRow')::int,
    (elem ->> 'startCol')::int,
    (elem ->> 'width')::int,
    (elem ->> 'height')::int,
    elem ->> 'photoUrl',
    elem ->> 'color',
    elem ->> 'species',
    coalesce((elem ->> 'speciesUncertain')::boolean, false),
    (elem ->> 'lastWateredAt')::timestamptz,
    elem ->> 'careAdvice',
    elem ->> 'notes'
  from jsonb_array_elements(p_plants) as elem;

  delete from garden_zones where garden_id = v_garden_id;
  insert into garden_zones (id, garden_id, kind, label, start_row, start_col, width, height, color, notes)
  select
    elem ->> 'id',
    v_garden_id,
    elem ->> 'kind',
    elem ->> 'label',
    (elem ->> 'startRow')::int,
    (elem ->> 'startCol')::int,
    (elem ->> 'width')::int,
    (elem ->> 'height')::int,
    elem ->> 'color',
    elem ->> 'notes'
  from jsonb_array_elements(p_zones) as elem;

  return v_garden_id;
end;
$$;
