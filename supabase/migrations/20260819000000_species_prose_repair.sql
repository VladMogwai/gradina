-- `species` had only SELECT and INSERT policies, so a row inserted with a
-- failed (null) translation could never be repaired - RLS denies anything
-- not explicitly allowed, and the row is cached forever by scientific_name.
--
-- The USING clause deliberately restricts updates to rows whose prose is
-- actually missing: a client can fill a gap, but can never overwrite a
-- translation that already exists. That keeps shared reference data safe
-- from being clobbered while still letting the app self-heal.
drop policy if exists "Authenticated users repair species prose" on species;
create policy "Authenticated users repair species prose"
  on species for update
  using (
    auth.role() = 'authenticated'
    and (fallback_description is null or fallback_care is null)
  );
