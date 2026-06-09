-- V1 Sunday readiness polish for club profiles and squad organisation.
-- Safe to run after 001-010; all columns are additive.

alter table public.clubs
  add column if not exists initials text,
  add column if not exists location text,
  add column if not exists head_coach_name text,
  add column if not exists default_training_focus text,
  add column if not exists primary_color text,
  add column if not exists accent_color text,
  add column if not exists notes text;

alter table public.squads
  add column if not exists description text,
  add column if not exists level text,
  add column if not exists lead_coach_name text,
  add column if not exists training_focus text,
  add column if not exists strokes_focus text[] not null default '{}',
  add column if not exists notes text,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz;

create index if not exists idx_squads_club_active on public.squads(club_id, is_active);

drop trigger if exists set_clubs_updated_at on public.clubs;
create trigger set_clubs_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

drop trigger if exists set_squads_updated_at on public.squads;
create trigger set_squads_updated_at
before update on public.squads
for each row execute function public.set_updated_at();
