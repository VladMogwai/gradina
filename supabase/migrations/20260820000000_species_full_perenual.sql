-- Widens `species` to everything Perenual's free tier actually returns.
-- Skipped on purpose: authority/subspecies/variety/attracts (null on every
-- species sampled), hardiness_location and care_guides (links to other
-- endpoints, not data), other_images and every x* field (paid tier - they
-- return the literal string "Upgrade Plan To Supreme For Access").
--
-- All nullable with no backfill: species cached before this migration keep
-- their existing columns and simply have these empty until re-resolved.

alter table species
  -- Classification. `type` is the growth form (tree, herb, shrub...),
  -- `cycle` the life cycle (Perennial, Annual, Biennial).
  add column if not exists type text,
  add column if not exists cycle text,
  -- Botanical taxonomy, Latin - deliberately not translated.
  add column if not exists family text,
  add column if not exists genus text,
  -- Other common names for the same species.
  add column if not exists other_name jsonb,
  -- Countries the species originates from.
  add column if not exists origin jsonb,
  -- How it is propagated (Cutting, Seed, Layering...).
  add column if not exists propagation jsonb,
  -- Size, as [{type: Height|Spread, min_value, max_value, unit}].
  add column if not exists dimensions jsonb,
  -- Per-part colouring, as [{part, color[]}].
  add column if not exists plant_anatomy jsonb,
  -- Pruning frequency, as {amount, interval}.
  add column if not exists pruning_count jsonb,
  -- Overall upkeep effort (Low, Moderate, High).
  add column if not exists maintenance text,
  add column if not exists flowering_season text,
  add column if not exists harvest_season text,
  -- Perenual's own photo, used only when the plant has none of its own.
  add column if not exists default_image_url text,

  -- Boolean traits. Kept as separate columns rather than one jsonb blob so
  -- they stay queryable (e.g. "show me every invasive species").
  add column if not exists salt_tolerant boolean,
  add column if not exists thorny boolean,
  add column if not exists invasive boolean,
  add column if not exists tropical boolean,
  add column if not exists indoor boolean,
  add column if not exists flowers boolean,
  add column if not exists cones boolean,
  add column if not exists fruits boolean,
  add column if not exists edible_fruit boolean,
  add column if not exists leaf boolean,
  add column if not exists edible_leaf boolean,
  add column if not exists cuisine boolean,
  add column if not exists medicinal boolean,
  add column if not exists seeds boolean;
