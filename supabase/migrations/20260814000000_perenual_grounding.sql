-- Grounds plant care data in Perenual (structured botanical source) instead
-- of freeform Gemini prose. Gemini is reduced to identification only
-- (scientific_name + confidence); species-level facts (watering, sunlight,
-- hardiness, etc.) are looked up once per species and cached here, shared
-- across every plant instance of that species. Also drops manual watering
-- tracking (nobody maintained it) and the old freeform per-plant analysis
-- blob it replaces.

-- Shared reference data: one row per species, looked up via Gemini's ID +
-- Perenual, reused by every plant instance. Not scoped to a user - this
-- app treats the whole garden (and its species catalog) as shared data.
create table if not exists species (
  id uuid primary key default gen_random_uuid(),
  scientific_name text not null unique,
  data_source text not null check (data_source in ('perenual', 'gemini_fallback')),

  -- Populated when data_source = 'perenual'. Free tier only resolves
  -- reliably for species id 1-3000; ids above that or unmatched species
  -- fall back to gemini_fallback below instead of a half-populated row.
  perenual_id int,
  common_name text,
  watering text,
  watering_benchmark_value text,
  watering_benchmark_unit text,
  sunlight jsonb,
  pruning_month jsonb,
  hardiness_min int,
  hardiness_max int,
  soil jsonb,
  pest_susceptibility jsonb,
  drought_tolerant boolean,
  poisonous_to_humans boolean,
  poisonous_to_pets boolean,
  care_level text,
  growth_rate text,
  description text,

  -- Populated when data_source = 'gemini_fallback' (Perenual had no match):
  -- a validated, structured-output Gemini pass, localized ro/en/ru.
  fallback_description jsonb,
  fallback_care jsonb,

  created_at timestamptz not null default now()
);

alter table species enable row level security;

drop policy if exists "Authenticated users read species" on species;
create policy "Authenticated users read species"
  on species for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users add species" on species;
create policy "Authenticated users add species"
  on species for insert
  with check (auth.role() = 'authenticated');

-- Garden-level climate settings (the plot is one fixed location, not a
-- per-plant field). Nullable: unset until the user fills them in, and
-- every consumer (survivability flag, prose injection) degrades silently
-- when they're null instead of failing.
alter table garden_plans
  add column if not exists hardiness_zone text,
  add column if not exists last_frost_date date,
  add column if not exists first_frost_date date;

-- Drop manual watering tracking (nobody maintained the log) and the old
-- freeform per-plant analysis columns (replaced by species_id + a plain
-- confidence value - the actual care facts now live on `species`, shared
-- across instances instead of duplicated and re-guessed per plant).
alter table garden_plants
  drop column if exists last_watered_at,
  drop column if exists care_advice,
  drop column if exists species,
  drop column if exists species_uncertain,
  drop column if exists analysis,
  add column if not exists species_id uuid references species (id),
  add column if not exists identification_confidence text check (identification_confidence in ('low', 'medium', 'high'));

-- analyzed_at already exists (from the earlier freeform-analysis
-- migration) and keeps its meaning: when identification last ran.

-- save_garden_plan() gains the 3 garden-settings params and the plants
-- upsert now writes species_id/identification_confidence instead of the
-- dropped columns. The old 4-arg signature is a distinct overload in
-- Postgres, not automatically replaced by a longer parameter list, so it
-- has to be dropped explicitly or both would coexist.
drop function if exists save_garden_plan(int, int, jsonb, jsonb);

create or replace function save_garden_plan(
  p_rows int,
  p_cols int,
  p_plants jsonb,
  p_zones jsonb,
  p_hardiness_zone text default null,
  p_last_frost_date date default null,
  p_first_frost_date date default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_garden_id uuid;
begin
  insert into garden_plans (user_id, rows, cols, hardiness_zone, last_frost_date, first_frost_date)
  values (auth.uid(), p_rows, p_cols, p_hardiness_zone, p_last_frost_date, p_first_frost_date)
  on conflict (user_id) do update set
    rows = excluded.rows,
    cols = excluded.cols,
    hardiness_zone = excluded.hardiness_zone,
    last_frost_date = excluded.last_frost_date,
    first_frost_date = excluded.first_frost_date,
    updated_at = now()
  returning id into v_garden_id;

  -- Upsert-existing + delete-only-what's-gone (not delete+reinsert-all):
  -- garden_plants.id is stable across saves, and plant_photos references
  -- it with `on delete cascade` - wholesale deleting rows that still
  -- exist would silently wipe their photos on every autosave.
  insert into garden_plants (
    id, garden_id, name, start_row, start_col, width, height,
    color, species_id, identification_confidence, notes, analyzed_at
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
    nullif(elem ->> 'speciesId', '')::uuid,
    elem ->> 'identificationConfidence',
    elem ->> 'notes',
    (elem ->> 'analyzedAt')::timestamptz
  from jsonb_array_elements(p_plants) as elem
  on conflict (id) do update set
    garden_id = excluded.garden_id,
    name = excluded.name,
    start_row = excluded.start_row,
    start_col = excluded.start_col,
    width = excluded.width,
    height = excluded.height,
    color = excluded.color,
    species_id = excluded.species_id,
    identification_confidence = excluded.identification_confidence,
    notes = excluded.notes,
    analyzed_at = excluded.analyzed_at;

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
