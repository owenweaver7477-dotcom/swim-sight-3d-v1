# Production Reliability Test Plan

Use this plan before opening Swim Sight 3D to heavier club pilot traffic. The goal is to prove uploads, queueing, AI dispatch, callbacks, manual fallback, and public sharing behave safely under realistic use.

## Pre-Flight

1. Run Supabase migrations through `016_v1_true_ai_queue_concurrency.sql`.
2. Confirm Vercel has `MAX_ACTIVE_AI_JOBS` set if you want anything other than the default of `1`.
3. Confirm Vercel has `AI_SERVER_URL`, `AI_WEBHOOK_SECRET`, `PUBLIC_APP_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Confirm Render has the matching `AI_WEBHOOK_SECRET`.
5. Confirm the `private-videos` bucket is private.
6. Confirm Render health returns the expected engine version.
7. Confirm the Render worker is running the adaptive engine (`pose-mvp-0.5` or newer).

## Expected Queue States

- New trigger creates `ai_processing_jobs.status = queued` and `queue_status = queued`.
- If capacity is available, the API claims the job and sets `queue_status = dispatching`, then `status = accepted` and `queue_status = dispatched` when Render accepts it.
- Progress callbacks move the job to active processing states and `queue_status = processing`.
- Completion moves `queue_status` to `completed`, `manual_review`, `retry_available`, or `failed`.
- Queued jobs do not receive signed URLs until they are dispatched.
- Public shared reports never include signed URLs, storage paths, rejected findings, pending findings, raw AI payloads, or internal queue details.

## Test 1: Single Job Happy Path

1. Upload a 5-15 second MP4/MOV.
2. Click Send for AI Review.
3. Expected database state:
   - `video_uploads.processing_status = pending_ai` briefly, then `processing_ai` after dispatch.
   - `ai_processing_jobs.status = accepted` after Render accepts.
   - `queue_status = dispatched`, then `processing`, then `completed` or `manual_review`.
4. Expected UI:
   - Video Library shows queued/processing, never a blank spinner.
   - AI Job Monitor shows stage/progress and callback status.

## Test 2: Duplicate Send Click

1. Click Send for AI Review twice quickly on the same uploaded video.
2. Expected database state:
   - Only one active/queued job exists for that `video_upload_id`.
3. Expected UI:
   - The second action returns an already queued/in-progress message.

## Test 3: Two Jobs Submitted Back-To-Back

1. Upload two videos.
2. Send both for AI Review quickly.
3. With `MAX_ACTIVE_AI_JOBS=1`, expected database state:
   - First job dispatches to Render.
   - Second job stays `status = queued`, `queue_status = queued`.
   - Second job has a `queue_position`.
4. Expected UI:
   - First video shows processing.
   - Second video shows Queued for AI Review.

## Test 4: Three Jobs Submitted Back-To-Back

1. Upload three videos from the same or different coach accounts.
2. Send all three for AI Review.
3. Expected database state:
   - Only one active job if `MAX_ACTIVE_AI_JOBS=1`.
   - Remaining jobs keep queue positions.
4. Expected UI:
   - Coaches see their own club job details only.
   - AI Job Monitor shows global active/queued counts without exposing other club private details.

## Test 5: Render Unavailable

1. Temporarily point `AI_SERVER_URL` to an unavailable endpoint in a safe preview environment only.
2. Send one uploaded video for AI Review.
3. Expected database state:
   - Job becomes `retry_available` if attempts remain.
   - `dispatch_error` is populated with a coach-safe message.
   - Video remains available for retry or manual review.
4. Restore `AI_SERVER_URL` immediately after test.

## Test 6: Render Timeout

1. Use a preview environment or controlled network condition where Render does not accept within 20 seconds.
2. Expected:
   - Job becomes retryable with `error_code = render_acceptance_timeout`.
   - Video remains saved.
   - UI shows Retry AI Review and Continue Manual Review.

## Test 7: Failed Callback Simulation

1. In a safe test environment, use a wrong Render `AI_WEBHOOK_SECRET`.
2. Render should attempt callback, Vercel should reject it.
3. Reset timed-out jobs from AI Job Monitor after timeout.
4. Expected:
   - Timed-out active jobs become `timed_out`.
   - Queued jobs are not timed out just because they waited.

## Test 8: Weak Pose Manual Review

1. Use a video with poor angle/visibility.
2. Expected:
   - No fake findings are created.
   - Report opens in manual review state.
   - Coach can add manual finding, Coach Draw annotation, drill, and summary.

## Test 8A: Heavy Screen Recording Safety

1. Upload the known 44 MB high-resolution `.mov` screen recording.
2. Send it for AI Review.
3. Expected Render behavior:
   - Video download succeeds without logging the signed URL.
   - Worker logs source metadata and selects `reduced_ai` or `minimal_ai`.
   - Worker samples a short window only and resizes frames before pose detection.
4. Expected app behavior:
   - If pose evidence is usable, findings still arrive as pending coach-review drafts.
   - If pose evidence is weak, report becomes manual review with zero fake findings.
   - AI Job Monitor shows quality flags such as `screen_recording_possible`, `minimal_ai_sampling`, or `heavy_video_downsampled`.

## Test 9: Retry Failed Job

1. Trigger a retryable failure.
2. Click Retry AI Review.
3. Expected:
   - New attempt is queued.
   - Attempt count increases.
   - No duplicate active job exists for the same video.

## Test 10: Reset Timed-Out Job

1. Let an active job exceed the timeout threshold.
2. Use AI Job Monitor reset.
3. Expected:
   - Active stale job becomes `timed_out`.
   - Video becomes manual-review ready.
   - Jobs that are merely queued are left alone.

## Test 11: Manual Review While Queued

1. Queue a job behind another active job.
2. Open Manual Review from the video card.
3. Expected:
   - Coach can create manual findings while the AI job waits.
   - Final report still requires coach approval.

## Test 12: Shared Report Privacy

1. Finalise a report.
2. Create a shared link and open logged out.
3. Expected:
   - Approved findings and selected public-safe annotations only.
   - No `file_path`, signed URL, raw AI payload, rejected findings, pending findings, or notification logs.

## Test 13: iPad Upload

1. Install/open the PWA on iPad Safari.
2. Upload a 5-15 second clip.
3. Expected:
   - Upload row appears immediately.
   - Large file warnings are readable.
   - Send for AI Review shows queued/processing state.

## Test 14: 80-150 MB Upload

1. Upload an 80-150 MB clip on stable Wi-Fi.
2. Expected:
   - Upload row appears before storage upload completes.
   - Coach sees upload progress/state.
   - AI trigger is disabled until upload is complete.
   - AI worker downscales/samples based on resolution, FPS, duration, and decoded workload, not file size alone.

## Test 15: Calibration Feedback After Review

1. Approve, edit, reject, or add manual findings.
2. Expected:
   - Calibration feedback rows record coach action.
   - Public/shared report includes only coach-approved content.
