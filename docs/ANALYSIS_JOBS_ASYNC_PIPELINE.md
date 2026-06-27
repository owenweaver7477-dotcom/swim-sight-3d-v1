# Analysis Jobs Async Pipeline

## Current Flow Found

Swim Sight 3D already uses `ai_processing_jobs` as the durable app-side job record for AI-assisted analysis. The current app flow is:

1. Coach uploads/selects a private `video_uploads` row.
2. Coach chooses report outputs and confirms the AI-assisted draft workflow.
3. `/api/ai/trigger` creates an `ai_processing_jobs` row.
4. The app marks the video as `pending_ai`.
5. The queue helper tries to send the next queued job to the Render worker.
6. The worker returns an acceptance response quickly when available, then sends progress/final callbacks to `/api/ai/callback`.
7. The callback route updates `ai_processing_jobs`, the linked `video_uploads` row, and report/findings where safe.
8. The coach reviews, edits, approves, or rejects any draft findings before anything is shared.

No new database table was added in this phase. The existing `ai_processing_jobs` entity remains the source of truth.

## Existing Entities And Helpers

Found app-side job/report/callback pieces:

- `api/ai/[action].js` consolidated AI actions: `trigger`, `callback`, `cancel`, and now `status`.
- `api/_lib/ai/triggerHandler.js` creates a job and returns a safe job state.
- `api/_lib/aiQueue.js` claims queued jobs, signs private video URLs only for the worker dispatch, and records dispatch/acceptance state.
- `api/_lib/ai/callbackHandler.js` receives worker callbacks and preserves safe metadata, 2D pose, and estimated 3D summaries.
- `api/_lib/ai/cancelHandler.js` lets a coach request cancellation or exit to manual review.
- `api/_lib/ai/statusHandler.js` returns a safe job status by `job_id`.
- `src/components/analysis/VideoLibrary.jsx` displays upload/job status and polls active jobs with backoff.
- `src/pages/Analyse.jsx` starts AI-assisted analysis and keeps manual Coach Studio review available.

Found worker-side pieces:

- `main.py` exposes `POST /process-video`, `GET /jobs/{job_id}`, `POST /jobs/{job_id}/cancel`, and fast `/health`.
- `AI_WORKER_CONTRACT.md` documents the worker callback contract and current pose/progress stages.

## Final Job Fields

The app uses or maps these job fields:

- `id`
- `video_upload_id`
- `club_id`
- `swimmer_id`
- `created_by`
- `status`
- `queue_status`
- `stage`
- `progress_percent`
- `callback_summary`
- `server_job_id`
- `attempt_count`
- `retry_count`
- `max_attempts`
- `queued_at`
- `accepted_at`
- `started_at`
- `completed_at`
- `failed_at`
- `timed_out_at`
- `report_id`
- `error_code`
- `error_message`
- `last_error`
- `dispatch_error`

The client-facing job response maps this into safe fields:

- `job_id`
- `status`
- `analysis_job_status`
- `progress_label`
- `analysis_output`
- `user_error`
- `user_error_message`
- `developer_error_present`
- `manual_review_available`

Developer error details remain internal database fields and are not returned to normal coach UI responses.

## Statuses

Required app-level states:

- `created`
- `pending`
- `queued`
- `processing`
- `completed`
- `failed`

Optional states already supported:

- `cancelled`
- `cancel_requested`
- `timed_out`
- `retry_available`
- `manual_review_recommended`

Worker/progress stage values remain more detailed, but the UI maps them into the broader states above.

## Non-Blocking Trigger Flow

`/api/ai/trigger` now creates an app job first and returns a safe job response with `job_id`, status, and manual fallback copy. Worker acceptance is intentionally short-window. If Render is cold, unavailable, or delayed, the job is left queued/retryable or failed honestly instead of holding the frontend in a fragile long request.

Current accepted worker payload contains:

```json
{
  "job_id": "uuid",
  "video_upload_id": "uuid",
  "signed_video_url": "short-lived-private-url",
  "stroke_type": "Freestyle",
  "camera_angle": "Side",
  "review_context": {},
  "analysis_mode": "custom_report",
  "selected_report_outputs": [],
  "callback_url": "https://app.example/api/ai/callback"
}
```

Future GPU worker payloads should prefer:

```json
{
  "job_id": "uuid",
  "video_key": "private-storage-key-or-file-id",
  "analysis_options": {
    "model_tier": "mediapipe_fast",
    "extract_fps_cap": 60,
    "detect_stroke_phases": true,
    "generate_pdf_draft": false
  }
}
```

The current signed URL dispatch remains short-lived and private until storage hardening replaces it with durable worker-side object access.

## Polling And Backoff

Pilot polling uses simple HTTP/data polling, not WebSockets.

- First 2 minutes: every 5 seconds.
- After 2 minutes: every 15 seconds.
- After 10 minutes: every 30 seconds.
- Polling stops when no upload/job is active.
- React Query owns the polling lifecycle, so polling stops on component unmount.

## User Vs Developer Errors

Coach-facing fields:

- `user_error`
- `user_error_message`

Internal/developer-only fields:

- `last_error`
- `dispatch_error`
- `error_code`

The coach UI must not display Python tracebacks, private route names, signed URLs, storage paths, environment variable names, callback secrets, tokens, or stack traces.

## Manual Fallback

Manual Coach Studio review remains available when:

- no AI job exists,
- job is queued,
- job is processing,
- job fails,
- job times out,
- job is cancelled,
- credits or worker state cannot be confirmed,
- requested outputs are unavailable.

AI suggests. Coaches decide.

## Callback Contract

Callbacks must include or resolve:

- `job_id` or `app_job_id`
- `video_upload_id`
- `status`

Progress callbacks may include safe summaries:

- `video_probe_summary`
- `pose_2d_summary`
- `pose_3d_summary`

Final callbacks may create/update reports and findings only after app-side quality gates. Findings remain draft material until coach review.

Failure callbacks should include:

- `status: "failed"`, `timed_out`, or `manual_review_recommended`
- safe reason code
- safe coach message
- `manual_review_available: true`

## Privacy Rules

Never place these in public/shared reports:

- signed URLs,
- private storage paths,
- callback secrets,
- raw full tracebacks,
- raw pose arrays,
- private coach notes,
- guardian details,
- athlete height/mass,
- rejected findings,
- calibration internals.

Public reports only show coach-approved report fields.

## Remaining Before Storage Hardening

- Replace short-lived signed URL worker dispatch with a durable private object reference and worker-side authenticated read.
- Add explicit `video_key` support across app and worker payloads.
- Add artifact storage policy for private pose/metadata outputs.
- Add retention/deletion coverage for derived analysis artifacts.

## Remaining Before Modal / RunPod / S3 / SQS

- Define provider-neutral worker job payload.
- Add server-side entitlement enforcement for paid AI/GPU jobs.
- Add durable queue/provider adapter.
- Add provider-specific cancellation and timeout monitoring.
- Add staging tests for worker restart, retry, cancellation, and late callback suppression.
