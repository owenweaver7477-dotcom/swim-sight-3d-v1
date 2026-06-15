# Swim Sight 3D AI Job Engine Test Plan

Use this after running `supabase/migrations/015_v1_ai_job_engine_reliability.sql`.

## 1. Normal AI Trigger

1. Upload a 5-15 second side-view MP4/MOV.
2. Confirm the video row reaches `uploaded`.
3. Click **Send for AI Review** once.
4. Confirm the video changes to queued/processing.
5. In Supabase, confirm one `ai_processing_jobs` row exists with:
   - `status = accepted` after Render accepts
   - `attempt_count = 1`
   - `render_acceptance_status = accepted`
   - `callback_status = waiting` until callback returns

## 2. Duplicate Trigger Click

1. Click **Send for AI Review** twice quickly on the same uploaded video.
2. Confirm only one active job remains for that video.
3. Confirm the UI says the review is already in progress or continues showing processing.

## 3. Render Slow Wake-Up / Timeout

1. Temporarily use a Render service state that is sleeping or slow, or test immediately after inactivity.
2. Click **Send for AI Review**.
3. If Render does not accept within roughly 20 seconds, confirm:
   - the job becomes `retry_available` or `error`
   - `error_code` records `render_acceptance_timeout`
   - the private video remains saved
   - the UI shows retry/manual-review options

## 4. Callback Success

1. Let Render finish a successful job.
2. Confirm callback updates:
   - `callback_received = true`
   - `callback_status = completed` or `manual_review`
   - `processing_duration_seconds`
   - quality flags and pose reliability
3. Confirm report creation.
4. Confirm AI findings are created only when the quality gate passes.

## 5. Weak Pose / Manual Review

1. Upload a poor angle, unclear, or too-short clip.
2. Trigger AI Review.
3. Confirm the callback creates manual-review state with zero fake findings.
4. Add a manual finding, finalise, and share.

## 6. Retry Failed Job

1. Use a job with `retry_available`, `timed_out`, or retryable `error`.
2. Click **Retry AI Review** from Video Library or AI Jobs.
3. Confirm:
   - no duplicate active job is created
   - `attempt_count` increments
   - retry stops after `max_attempts`
   - manual review remains available

## 7. Reset Timed-Out Jobs

1. As owner/admin, open `/ai-jobs`.
2. Click **Reset Timed-Out Jobs**.
3. Confirm active jobs older than the threshold become `timed_out`.
4. Confirm video status becomes `manual_review`.
5. Confirm no signed URLs or private paths appear in the UI.

## 8. Shared Report Privacy

1. Finalise a report and create a shared link.
2. Open the shared report logged out.
3. Confirm it does not show:
   - signed video URLs
   - private storage paths
   - raw AI payloads
   - pending/rejected findings
   - internal job diagnostics

