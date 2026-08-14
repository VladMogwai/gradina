-- Multi-photo support: one row per photo instead of a single photo_url
-- column, so add/remove/reorder stays simple.

create table if not exists plant_photos (
  id uuid primary key default gen_random_uuid(),
  plant_id text not null references garden_plants (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists plant_photos_plant_id_idx on plant_photos (plant_id);

alter table plant_photos enable row level security;

drop policy if exists "Users manage their own plant photos" on plant_photos;
create policy "Users manage their own plant photos"
  on plant_photos for all
  using (
    exists (
      select 1
      from garden_plants gp
      join garden_plans p on p.id = gp.garden_id
      where gp.id = plant_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from garden_plants gp
      join garden_plans p on p.id = gp.garden_id
      where gp.id = plant_id and p.user_id = auth.uid()
    )
  );

-- Backfill: turn each plant's existing single photo_url into its first
-- plant_photos row. The public URL always looks like
-- ".../object/public/plant-photos/<path>" - split_part after the bucket
-- name segment recovers the storage path uploadPlantPhoto() already uses.
insert into plant_photos (plant_id, storage_path, sort_order)
select id, split_part(photo_url, 'plant-photos/', 2), 0
from garden_plants
where photo_url is not null and photo_url <> '';

alter table garden_plants drop column if exists photo_url;

-- save_garden_plan() previously deleted + reinserted every plant on every
-- autosave. That's fine for plain columns, but plant_photos references
-- garden_plants.id with `on delete cascade` - deleting a plant row that
-- still exists (just to reinsert it identically) would silently wipe its
-- photos on the very next autosave. Switched to upsert-existing +
-- delete-only-what's-actually-gone so a plant's id (and therefore its
-- photo rows) survives across saves. Zones aren't referenced by anything,
-- so they're untouched.
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

  insert into garden_plants (
    id, garden_id, name, start_row, start_col, width, height,
    color, species, species_uncertain, last_watered_at, care_advice, notes,
    analyzed_at, analysis
  )
  select
    elem ->> 'id',
    v_garden_id,
    elem ->> 'name',
    (elem ->> 'startRow')::int,
    (elem ->> 'startCol')::int,
    (elem ->> 'width')::int,
    (elem ->> 'height')::int,
    elem ->> 'color',
    elem ->> 'species',
    coalesce((elem ->> 'speciesUncertain')::boolean, false),
    (elem ->> 'lastWateredAt')::timestamptz,
    elem ->> 'careAdvice',
    elem ->> 'notes',
    (elem ->> 'analyzedAt')::timestamptz,
    elem -> 'analysis'
  from jsonb_array_elements(p_plants) as elem
  on conflict (id) do update set
    garden_id = excluded.garden_id,
    name = excluded.name,
    start_row = excluded.start_row,
    start_col = excluded.start_col,
    width = excluded.width,
    height = excluded.height,
    color = excluded.color,
    species = excluded.species,
    species_uncertain = excluded.species_uncertain,
    last_watered_at = excluded.last_watered_at,
    care_advice = excluded.care_advice,
    notes = excluded.notes,
    analyzed_at = excluded.analyzed_at,
    analysis = excluded.analysis;

  delete from garden_plants
  where garden_id = v_garden_id
    and id not in (select coalesce(elem ->> 'id', '') from jsonb_array_elements(p_plants) as elem);

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
