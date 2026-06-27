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

## Metadata Probe Callback Contract

Before pose detection, the worker may send a progress callback with safe video
metadata. This lets the app record real duration, frame rate, resolution, and
sampling readiness without pretending pose, 3D, force, or biomechanics are
available.

Supported progress statuses:

- `metadata_ready`
- `frames_sampled`

Example worker callback:

```json
{
  "job_id": "worker-job-id",
  "app_job_id": "app-ai-processing-job-id",
  "video_upload_id": "video-upload-id",
  "status": "metadata_ready",
  "stage": "metadata_probe",
  "progress_percent": 12,
  "video_metadata": {
    "duration_seconds": 42.5,
    "fps": 60,
    "frame_count": 2550,
    "width": 1920,
    "height": 1080,
    "codec": "h264",
    "container": "mp4",
    "file_size_mb": 146.2,
    "orientation": "landscape"
  },
  "frame_sampling": {
    "sampling_rate_fps": 5,
    "max_sampled_frames": 300
  },
  "warnings": []
}
```

The app normalises this into
`ai_processing_jobs.callback_summary.video_probe_summary`. That summary can
include:

- `availabilityState`
- safe `videoMetadata`
- `frameSampling` timestamp references
- warnings and structured errors

It must not include signed video URLs, storage paths, raw frame image data, raw
pose arrays, force values, drag estimates, or private worker internals.

`video_uploads.processing_status` remains one of the existing upload lifecycle
values such as `processing_ai`; `metadata_ready` and `frames_sampled` are stored
as job stages and callback-summary states, not as new database enum values.

## 2D Pose Callback Contract

After the worker reads scheduled frames and runs the current 2D pose backend, it
may send a progress callback with:

- `status: "pose_2d_ready"`
- a safe `pose_2d_summary`
- private `pose_artifact` metadata

Current pose model:

- `mediapipe_pose`
- BlazePose 33-landmark source inside the worker
- app-facing stable Swim Sight 3D joint names

Private 2D pose frame shape inside the worker artifact:

```json
{
  "timestamp_ms": 4000,
  "source_frame_index": 240,
  "sample_index": 20,
  "view_type": "side",
  "pose_model": "mediapipe_pose",
  "joints_2d": {
    "left_shoulder": {
      "x": 0.42,
      "y": 0.31,
      "confidence": 0.91,
      "visibility": 0.91,
      "status": "tracked"
    }
  },
  "frame_confidence": 0.76,
  "tracking_status": "partial"
}
```

Safe callback shape:

```json
{
  "job_id": "worker-job-id",
  "app_job_id": "app-ai-processing-job-id",
  "video_upload_id": "video-upload-id",
  "status": "pose_2d_ready",
  "pose_2d_summary": {
    "availabilityState": "pose_2d_ready",
    "ok": true,
    "model": "mediapipe_pose",
    "modelVersion": "blazepose_33",
    "sampledFrames": 213,
    "processedFrames": 213,
    "trackedFrames": 184,
    "partialFrames": 22,
    "failedFrames": 7,
    "averageFrameConfidence": 0.74,
    "lowConfidenceJointRate": 0.18,
    "viewType": "side",
    "warnings": []
  },
  "pose_artifact": {
    "artifact_type": "pose_2d_timeseries",
    "storage_visibility": "private",
    "format": "json",
    "frame_count": 213,
    "contains_raw_pose": true,
    "contains_video_pixels": false,
    "public_safe": false
  },
  "warnings": []
}
```

The app stores the safe summary in
`ai_processing_jobs.callback_summary.pose_2d_summary` and may keep safe artifact
metadata in `callback_summary.pose_artifact`. It must not copy raw 2D pose
frames, raw landmarks, frame images, signed URLs, private storage paths, local
worker paths, 3D coordinates, force values, or drag estimates into report/public
fields.

Phase 6 can use this private 2D pose artifact as the input for monocular 3D
lifting. Until then, it is internal evidence only and still requires coach
review before any report is shared.

## Monocular Estimated 3D Pose Callback Contract

The worker can now lift private 2D pose frames into a private estimated 3D
timeseries. This is single-view monocular 3D and must always be treated as an
estimate.

Current method:

- `source: "monocular_estimate"`
- `method: "anatomical_heuristic_lift"`
- `measurementType: "estimated"`
- `pose3dModel: "anatomical_heuristic_lift_v1"`
- `coordinateSystem: "hip_centered_relative"`
- `scale: "relative_body_units"`

Private 3D pose frame shape inside the worker artifact:

```json
{
  "timestamp_ms": 4000,
  "source_frame_index": 240,
  "sample_index": 20,
  "view_type": "Side",
  "source": "monocular_estimate",
  "method": "anatomical_heuristic_lift",
  "measurementType": "estimated",
  "pose_model": "mediapipe_pose",
  "pose_3d_model": "anatomical_heuristic_lift_v1",
  "joints_3d": {
    "left_shoulder": {
      "x": 0.12,
      "y": 1.42,
      "z": -0.08,
      "confidence": 0.76,
      "source_2d_confidence": 0.91,
      "status": "estimated"
    }
  },
  "frame_confidence": 0.7,
  "tracking_status": "partial"
}
```

Safe app callback shape:

```json
{
  "job_id": "worker-job-id",
  "app_job_id": "app-ai-processing-job-id",
  "video_upload_id": "video-upload-id",
  "status": "pose_3d_estimated",
  "pose_3d_summary": {
    "availabilityState": "pose_3d_estimated",
    "ok": true,
    "source": "monocular_estimate",
    "method": "anatomical_heuristic_lift",
    "measurementType": "estimated",
    "pose3dModel": "anatomical_heuristic_lift_v1",
    "inputPoseModel": "mediapipe_pose",
    "inputFrames": 213,
    "estimatedFrames": 184,
    "partialFrames": 22,
    "failedFrames": 7,
    "averageFrameConfidence": 0.68,
    "coordinateSystem": "hip_centered_relative",
    "scale": "relative_body_units",
    "calibration": {
      "cameraCalibrated": false,
      "worldScaleKnown": false,
      "multiView": false
    },
    "assumptions": [
      "single-view depth estimated from 2D pose sequence",
      "coordinates are relative body units, not measured metres",
      "z-depth is inferred from anatomical constraints and temporal smoothing"
    ],
    "warnings": []
  },
  "pose_3d_artifact": {
    "artifact_type": "pose_3d_timeseries",
    "storage_visibility": "private",
    "format": "json",
    "frame_count": 213,
    "contains_raw_pose": true,
    "contains_video_pixels": false,
    "public_safe": false,
    "source": "monocular_estimate",
    "measurementType": "estimated"
  },
  "warnings": []
}
```

The app stores this as
`ai_processing_jobs.callback_summary.pose_3d_summary` plus safe private artifact
metadata at `callback_summary.pose_3d_artifact`. It must preserve earlier
`video_probe_summary` and `pose_2d_summary` values when this callback arrives,
and it must preserve all progress summaries when the later final/manual-review
callback arrives.

Never expose raw `joints_3d`, raw `joints_2d`, frame images, signed URLs,
storage paths, local worker paths, force values, drag estimates, or internal
calibration data in public/shared reports.

Phase 7 can use the private 3D artifact for biomechanics calculations. That
next phase still must output safe summaries and keep coach approval as the gate
before anything is shared.

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
