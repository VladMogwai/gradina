-- Stores a tiny LQIP blur placeholder per photo, generated client-side at
-- upload time (thumbhash - see plantPhotoApi.ts). Rendered by next/image as
-- placeholder="blur" so a photo never shows an empty box while loading.
--
-- Nullable with no backfill on purpose: photos uploaded before this column
-- existed simply render without a blur-up (exactly today's behavior), and
-- get one if they're ever re-uploaded. No width/height columns - every call
-- site renders with `fill` inside a fixed-aspect container, so intrinsic
-- dimensions are never needed.
alter table plant_photos add column if not exists placeholder text;
