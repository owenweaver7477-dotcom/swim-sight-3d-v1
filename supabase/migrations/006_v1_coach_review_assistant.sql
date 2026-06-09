-- Swim Sight 3D V1 coach review assistant support.
-- Adds optional public-safe drill metadata to coach-approved findings.

alter table public.findings
  add column if not exists linked_drill_id text,
  add column if not exists linked_drill_title text,
  add column if not exists linked_drill_summary text;

create index if not exists findings_linked_drill_id_idx on public.findings(linked_drill_id);
