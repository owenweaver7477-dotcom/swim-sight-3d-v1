-- 028_v1_coach_cue_snippets.sql
-- ONE new table. Additive and reversible: no existing table, column, policy or row is
-- touched. (Numbered 028 because 026 took the findings.title column and 027 the RLS
-- least-privilege pass; this is the table approved earlier as "026".)
--
-- Why: the finding composer offers reusable per-field phrases so a coach can write a
-- complete finding in under a minute. There is no existing concept to extend — a repo-wide
-- search for snippet/phrase_bank/saved_cue returns nothing. public.drills has singular
-- `coaching_cue` and plural `coaching_cues`, but those are per-drill canned text, not a
-- coach-authored reusable library.
--
-- The composer must degrade gracefully if this table is absent (bundled default phrases,
-- "save new phrase" hidden), so the feature is never coupled to the migration having run.
--
-- Shape follows the house style established by 010_v1_video_annotations.sql: uuid pk with
-- gen_random_uuid(), club_id FK cascade, nullable created_by -> auth.users on delete set
-- null, timestamptz created_at/updated_at with a set_updated_at trigger, club_id index,
-- RLS enabled, and a select/manage policy pair — every statement idempotent.

create table if not exists public.coach_cue_snippets (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  field text not null,
  body text not null,
  label text,
  stroke text,
  phase text,
  visibility text not null default 'club',
  is_active boolean not null default true,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which composer field a phrase belongs to. Drop-then-add so re-running the file with an
-- extended list replaces the old constraint rather than failing (house style, 010:74-77).
alter table public.coach_cue_snippets drop constraint if exists coach_cue_snippets_field_check;
alter table public.coach_cue_snippets add constraint coach_cue_snippets_field_check
  check (field in ('title', 'observation', 'why_it_matters', 'cue', 'next_focus'));

alter table public.coach_cue_snippets drop constraint if exists coach_cue_snippets_visibility_check;
alter table public.coach_cue_snippets add constraint coach_cue_snippets_visibility_check
  check (visibility in ('club', 'private'));

create index if not exists coach_cue_snippets_club_id_idx on public.coach_cue_snippets(club_id);
create index if not exists coach_cue_snippets_field_idx on public.coach_cue_snippets(club_id, field);

drop trigger if exists coach_cue_snippets_set_updated_at on public.coach_cue_snippets;
create trigger coach_cue_snippets_set_updated_at
  before update on public.coach_cue_snippets
  for each row execute function public.set_updated_at();

alter table public.coach_cue_snippets enable row level security;

-- COACH-ONLY, deliberately. This is a coach authoring aid, not swimmer-facing content, and
-- migration 023 established that swimmer/parent roles must not see coach-authoring
-- surfaces. Note this does NOT use the role-blind is_club_member predicate that migration
-- 027 had to sweep out of five tables — a new table must not reintroduce that class.
-- A coach sees the club's shared phrases plus their own private ones.
drop policy if exists "coach_cue_snippets_select_coaches" on public.coach_cue_snippets;
create policy "coach_cue_snippets_select_coaches" on public.coach_cue_snippets
for select using (
  public.is_app_admin()
  or (
    public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
    and (visibility = 'club' or created_by = auth.uid())
  )
);

drop policy if exists "coach_cue_snippets_manage_coaches" on public.coach_cue_snippets;
create policy "coach_cue_snippets_manage_coaches" on public.coach_cue_snippets
for all using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
) with check (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
);

-- Rollback (removes the table and everything attached to it; no other object is affected):
--   drop table if exists public.coach_cue_snippets;
