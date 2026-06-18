# Swim Sight 3D AI Pipeline Contract Notes

Phase 15B app-side contract note for the Vercel/Supabase app and the Render AI worker.

Current worker engine: `pose-mvp-0.5`

## Current Production Flow

1. Coach uploads video into the private Supabase `private-videos` bucket.
2. The app creates or updates a `video_uploads` row with upload and processing state.
3. Coach starts AI Review from the app.
4. `/api/ai/trigger` authenticates the user, checks club role and AI entitlement/credit state, creates an `ai_processing_jobs` row, and marks the video pending AI.
5. The queue dispatcher creates a short-lived server-side signed URL for the private video.
6. The dispatcher sends the job to the Render worker at `POST /process-video`.
7. The worker accepts quickly and processes in the background.
8. The worker calls back to `/api/ai/callback`.
9. The callback route verifies the worker secret, updates the job/video state, applies the app-side quality gate, and creates or updates the report.
10. Coach reviews draft evidence in Swim Sight 3D before anything appears in a final/shared report.

## Current Worker Route

The active worker route is:

```text
POST /process-video
```

The app currently normalizes `AI_SERVER_URL` so a base Render URL becomes `/process-video`.

## Future `/analyse` Alias Decision

Do not change the app to `/analyse` yet.

If a future worker rebuild adds `/analyse`, keep `/process-video` available until both sides are migrated and deployed together. The current app, docs, and test plans should continue to treat `/process-video` as production.

## Canonical App Tables

The current pipeline intentionally stores different concerns in different tables:

- `video_uploads`: uploaded video record, private storage pointers, upload status, processing status
- `ai_processing_jobs`: queue status, attempts, worker acceptance, callback diagnostics, quality flags, credit linkage
- `reports`: report shell, finalisation state, coach summary, public share readiness
- `findings`: coach-created and AI-draft findings
- `key_frames`: callback key frame summaries
- `video_annotations`: coach-created key stamps and drawings
- `ai_finding_feedback`: coach feedback for calibration
- `ai_credit_ledger`: pilot/future paid AI credit events

## `video_analysis` Decision

Do not add a `video_analysis` table in the current app yet.

Future labelled pose, richer worker output, or model-comparison work may justify an additive table such as `video_analysis_runs` or `video_analysis_artifacts`. That table should store raw analysis artifacts and model metadata without replacing the current report workflow.

If added later, it should be server-side scoped and should not be exposed in shared reports by default.

## Callback Contract

The callback may include:

- job identifiers
- `video_upload_id`
- worker engine
- status/stage history
- `analysis_mode`
- `real_pose_detected`
- draft findings
- score and phase summaries when quality gates pass
- key frame summaries
- quality flags
- recommended next action
- pose reliability metrics
- processing tier and sampled-frame metadata

The callback must not include signed URLs, private storage paths, auth tokens, or worker secrets.

The app quality gate remains authoritative. If the worker returns weak evidence, or if app-side thresholds fail, the app suppresses AI findings and keeps the report in manual review.

## Manual Review Fallback

Manual Coach Studio is not a failure path. It is the reliable core workflow.

If AI cannot produce coach-grade evidence, the worker returns:

- manual-review status
- zero findings
- quality flags
- a recommended next action of manual review

The app should keep the uploaded video available for Coach Studio, Coach Draw, manual findings, drill linking, finalisation, and secure sharing.

## Coach Approval Rule

AI output is draft evidence only.

Shared reports should include only coach-approved/finalised content:

- approved findings
- coach-selected key moments
- coach-selected annotations
- coach summary and next focus
- safe drill recommendations

Shared reports must not include raw AI payloads, rejected findings, calibration feedback, private storage details, or internal job diagnostics.

## Paid AI / Credit Alignment

Phase 15A added server-side entitlement and credit foundations. The AI pipeline should continue to check paid/pilot access at `/api/ai/trigger`, before worker dispatch.

Manual Coach Studio remains available even when AI access is blocked or credits are unavailable.

## Future AI Server Roadmap

Future worker upgrades can add better pose engines, labelled stroke data, stronger temporal filtering, or richer model output, but they should preserve:

- quick accept from the worker
- private signed URL handling
- callback security
- zero fake findings on weak evidence
- app-side quality gate
- manual review fallback
- coach approval before sharing

Any future analysis-fed 3D or multi-angle work should be added behind a new product and data contract rather than bolted onto the current callback blindly.
