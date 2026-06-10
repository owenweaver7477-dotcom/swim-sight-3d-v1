-- Swim Sight 3D V1 large video upload lifecycle.
-- Keeps existing videos compatible while allowing the app to create a
-- video_uploads row before private storage upload starts.

alter type public.video_processing_status add value if not exists 'preparing_upload';
alter type public.video_processing_status add value if not exists 'uploading';
alter type public.video_processing_status add value if not exists 'upload_failed';
alter type public.video_processing_status add value if not exists 'pending_ai';
alter type public.video_processing_status add value if not exists 'processing';

alter table public.video_uploads
  add column if not exists upload_status text,
  add column if not exists file_size_mb numeric,
  add column if not exists upload_started_at timestamptz,
  add column if not exists upload_completed_at timestamptz,
  add column if not exists upload_error text,
  add column if not exists upload_retry_count integer not null default 0,
  add column if not exists last_upload_attempt_at timestamptz,
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists duration_seconds numeric;

alter table public.video_uploads
  drop constraint if exists video_uploads_upload_status_check;

alter table public.video_uploads
  add constraint video_uploads_upload_status_check
  check (
    upload_status is null
    or upload_status in (
      'preparing_upload',
      'uploading',
      'uploaded',
      'upload_failed',
      'pending_ai',
      'processing',
      'manual_review',
      'error'
    )
  );

update public.video_uploads
set
  upload_status = coalesce(upload_status, 'uploaded'),
  storage_bucket = coalesce(storage_bucket, file_bucket),
  storage_path = coalesce(storage_path, file_path),
  file_size_mb = coalesce(
    file_size_mb,
    case
      when file_size_bytes is not null then round((file_size_bytes::numeric / 1048576), 2)
      else null
    end
  ),
  upload_completed_at = coalesce(upload_completed_at, created_at)
where processing_status in ('uploaded', 'queued_ai', 'processing_ai', 'completed', 'unreliable_pose', 'manual_review')
  and (upload_status is null or storage_bucket is null or storage_path is null or file_size_mb is null);

create index if not exists video_uploads_upload_status_idx
  on public.video_uploads(upload_status);

create index if not exists video_uploads_upload_started_at_idx
  on public.video_uploads(upload_started_at);
