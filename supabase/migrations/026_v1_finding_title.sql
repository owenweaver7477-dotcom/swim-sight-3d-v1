-- 026_v1_finding_title.sql
-- Additive, nullable, reversible. No RLS change, no data change, no existing query affected.
--
-- Why: `findings` had no column for the coach-facing heading, and that caused silent data
-- loss in a REQUIRED field. The manual finding form (src/pages/Analyse.jsx) marks
-- "Finding name *" required and disables submit without it, but `mapFindingToDb` in
-- src/lib/data/entities.js destructured `finding_name` away and used it only as a fallback
-- into `observation`:
--
--     observation: remaining.observation || coach_sees || finding_name
--
-- so whenever the coach also filled "Coach sees...", the heading they were forced to type
-- was dropped before the insert. Confirmed by capturing the exact row the data layer sends
-- (scripts/_supabase_stub.mjs): `finding_name` was absent from the payload entirely.
--
-- Giving the heading its own column fixes the loss without removing a field coaches already
-- use. Existing rows keep `title` NULL and continue to read their heading from `observation`,
-- so nothing changes for data written before this migration.

alter table public.findings add column if not exists title text;

comment on column public.findings.title is
  'Coach-authored finding heading (the scannable line above the body). Nullable: rows created before migration 026 fall back to `observation`.';

-- Rollback:
--   alter table public.findings drop column if exists title;
