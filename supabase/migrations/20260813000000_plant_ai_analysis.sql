-- Optional, on-demand AI analysis of a plant's photo (species ID with
-- confidence, description, care advice - localized ro/en/ru in one JSON
-- blob). Written directly by the analyze Server Action, but also needs to
-- survive save_garden_plan()'s wholesale delete+reinsert of garden_plants
-- on every autosave, so it's threaded through there too.

alter table garden_plants
  add column if not exists analyzed_at timestamptz,
  add column if not exists analysis jsonb;

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
    photo_url, color, species, species_uncertain, last_watered_at, care_advice, notes,
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
    elem ->> 'photoUrl',
    elem ->> 'color',
    elem ->> 'species',
    coalesce((elem ->> 'speciesUncertain')::boolean, false),
    (elem ->> 'lastWateredAt')::timestamptz,
    elem ->> 'careAdvice',
    elem ->> 'notes',
    (elem ->> 'analyzedAt')::timestamptz,
    elem -> 'analysis'
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
