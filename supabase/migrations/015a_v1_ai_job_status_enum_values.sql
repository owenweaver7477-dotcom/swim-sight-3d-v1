-- Swim Sight 3D V1 AI job status enum additions.
-- Run this migration by itself before 015b. PostgreSQL requires newly added
-- enum values to be committed before they are used in later statements.

alter type public.ai_job_status add value if not exists 'manual_review';
alter type public.ai_job_status add value if not exists 'retry_available';
alter type public.ai_job_status add value if not exists 'cancelled';
