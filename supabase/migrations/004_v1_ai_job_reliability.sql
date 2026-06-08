-- Swim Sight 3D V1 AI job reliability hardening.
-- Adds granular lifecycle states and metadata used by the Vercel AI routes.

alter type public.ai_job_status add value if not exists 'accepted';
alter type public.ai_job_status add value if not exists 'downloading_video';
alter type public.ai_job_status add value if not exists 'extracting_frames';
alter type public.ai_job_status add value if not exists 'running_pose_detection';
alter type public.ai_job_status add value if not exists 'analysing_stroke';
alter type public.ai_job_status add value if not exists 'generating_outputs';
alter type public.ai_job_status add value if not exists 'callback_sending';
alter type public.ai_job_status add value if not exists 'manual_review_recommended';
alter type public.ai_job_status add value if not exists 'timed_out';

alter table public.ai_processing_jobs
  add column if not exists processing_duration_seconds numeric,
  add column if not exists retry_count integer not null default 0,
  add column if not exists analysis_mode text,
  add column if not exists video_duration_seconds numeric,
  add column if not exists video_fps numeric,
  add column if not exists callback_summary jsonb not null default '{}'::jsonb;

create index if not exists ai_processing_jobs_status_idx
  on public.ai_processing_jobs(status);

create index if not exists ai_processing_jobs_retry_count_idx
  on public.ai_processing_jobs(retry_count);
