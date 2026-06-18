-- Phase 15A: backend-ready AI entitlements and credit ledger.
-- This does not add billing, checkout, Stripe, or payment collection.
-- Missing/null entitlement fields intentionally preserve current pilot AI access.

alter table public.clubs
  add column if not exists plan_key text,
  add column if not exists ai_enabled boolean,
  add column if not exists ai_pilot_access boolean,
  add column if not exists ai_credit_mode text,
  add column if not exists ai_entitlements_updated_at timestamptz,
  add column if not exists ai_entitlements_updated_by uuid references auth.users(id) on delete set null;

alter table public.clubs
  drop constraint if exists clubs_plan_key_check;
alter table public.clubs
  add constraint clubs_plan_key_check
  check (
    plan_key is null
    or plan_key in ('free_demo', 'coach_studio', 'ai_assist', 'club_pro', 'elite_lab')
  ) not valid;

alter table public.clubs
  drop constraint if exists clubs_ai_credit_mode_check;
alter table public.clubs
  add constraint clubs_ai_credit_mode_check
  check (
    ai_credit_mode is null
    or ai_credit_mode in ('pilot_unlimited', 'credit_limited', 'blocked')
  ) not valid;

create index if not exists clubs_plan_key_idx
  on public.clubs(plan_key);
create index if not exists clubs_ai_credit_mode_idx
  on public.clubs(ai_credit_mode);

create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  video_upload_id uuid references public.video_uploads(id) on delete set null,
  ai_processing_job_id uuid references public.ai_processing_jobs(id) on delete set null,
  amount integer not null check (amount <> 0),
  reason text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists ai_credit_ledger_club_id_idx
  on public.ai_credit_ledger(club_id);
create index if not exists ai_credit_ledger_user_id_idx
  on public.ai_credit_ledger(user_id);
create index if not exists ai_credit_ledger_video_upload_id_idx
  on public.ai_credit_ledger(video_upload_id);
create index if not exists ai_credit_ledger_ai_processing_job_id_idx
  on public.ai_credit_ledger(ai_processing_job_id);
create index if not exists ai_credit_ledger_created_at_idx
  on public.ai_credit_ledger(created_at);
create unique index if not exists ai_credit_ledger_unique_ai_job_debit_idx
  on public.ai_credit_ledger(ai_processing_job_id, reason)
  where amount < 0 and ai_processing_job_id is not null;

alter table public.ai_credit_ledger enable row level security;

drop policy if exists "ai_credit_ledger_select_members" on public.ai_credit_ledger;
create policy "ai_credit_ledger_select_members" on public.ai_credit_ledger
for select using (
  public.is_club_member(club_id)
  or public.is_app_admin()
);

comment on table public.ai_credit_ledger is
  'Pilot-ready AI credit ledger. Positive entries grant credits; negative entries consume credits. Not payment-backed until future billing work.';
comment on column public.clubs.ai_credit_mode is
  'pilot_unlimited preserves pilot access, credit_limited requires ledger balance, blocked disables AI Review.';
