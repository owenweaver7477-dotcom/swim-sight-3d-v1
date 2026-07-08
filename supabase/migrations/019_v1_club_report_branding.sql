-- Club report branding fields (additive, nullable, reversible). No RLS change.
-- Applied to production 2026-07-08 (Batch 7E).
alter table public.clubs
  add column if not exists logo_url text,
  add column if not exists report_contact text,
  add column if not exists report_sign_off text,
  add column if not exists report_intro text,
  add column if not exists report_outro text;
