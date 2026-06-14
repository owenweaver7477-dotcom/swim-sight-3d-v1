-- Phase 5: AI calibration feedback loop.
-- Captures coach decisions on AI draft findings without changing report output.

create table if not exists public.ai_finding_feedback (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  finding_id uuid references public.findings(id) on delete set null,
  video_upload_id uuid references public.video_uploads(id) on delete set null,
  ai_job_id uuid references public.ai_processing_jobs(id) on delete set null,
  coach_id uuid references auth.users(id) on delete set null,
  stroke text,
  phase text,
  fault_tag text,
  ai_confidence text,
  ai_confidence_score numeric,
  ai_evidence_note text,
  ai_finding_title text,
  ai_finding_description text,
  coach_action text not null,
  coach_rejection_reason text,
  coach_edit_summary text,
  coach_final_title text,
  coach_final_observation text,
  coach_final_cue text,
  coach_final_drill text,
  quality_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_finding_feedback_action_check check (
    coach_action in ('approved', 'edited', 'rejected', 'manual_added', 'finalised')
  )
);

create index if not exists ai_finding_feedback_club_id_idx
  on public.ai_finding_feedback(club_id);

create index if not exists ai_finding_feedback_report_id_idx
  on public.ai_finding_feedback(report_id);

create index if not exists ai_finding_feedback_finding_id_idx
  on public.ai_finding_feedback(finding_id);

create index if not exists ai_finding_feedback_ai_job_id_idx
  on public.ai_finding_feedback(ai_job_id);

create index if not exists ai_finding_feedback_action_idx
  on public.ai_finding_feedback(coach_action);

create index if not exists ai_finding_feedback_fault_tag_idx
  on public.ai_finding_feedback(fault_tag);

create index if not exists ai_finding_feedback_created_at_idx
  on public.ai_finding_feedback(created_at);

alter table public.ai_finding_feedback enable row level security;

drop policy if exists "ai_finding_feedback_select_coaches" on public.ai_finding_feedback;
create policy "ai_finding_feedback_select_coaches" on public.ai_finding_feedback
for select using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "ai_finding_feedback_insert_coaches" on public.ai_finding_feedback;
create policy "ai_finding_feedback_insert_coaches" on public.ai_finding_feedback
for insert with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "ai_finding_feedback_update_owner_admin" on public.ai_finding_feedback;
create policy "ai_finding_feedback_update_owner_admin" on public.ai_finding_feedback
for update using (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
);
