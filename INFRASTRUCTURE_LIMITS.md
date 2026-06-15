# Swim Sight 3D V1 Infrastructure Limits

This document sets realistic expectations for controlled club pilot testing. Swim Sight 3D V1 is ready for real coach testing, but the upload and AI pipeline should be tested with honest file sizes, stable Wi-Fi, and manual review fallback available.

## Current Architecture

- Frontend and API routes: Vercel
- Auth, database, and private video storage: Supabase
- AI processing server: Render
- AI callback path: Render posts results back to Vercel at `/api/ai/callback`
- Source of truth for jobs, reports, findings, annotations, and shared links: Supabase

Private swim video stays in the Supabase `private-videos` bucket. Vercel creates short-lived signed URLs only for authenticated playback or for the Render AI server to download the file. Public shared reports must never include private storage paths, signed URLs, raw AI payloads, or pending/rejected findings.

## Expected File Sizes

| Tier | Pilot Expectation | Coach Guidance |
| --- | --- | --- |
| Under 80 MB | Normal | Should upload on a reasonable Wi-Fi connection. |
| 80-150 MB | Allowed with warning | Keep the tab open. Upload and processing may take longer. |
| 150-250 MB | Strong warning | Recommend trimming or compressing before a live demo. |
| 250 MB+ | Not recommended for pilot | Use a shorter 5-15 second clip or compressed export. |

The app should create a `video_uploads` row before storage upload begins. If storage fails, the row should remain visible as `upload_failed` with retry/delete options.

## Recommended Demo File

- Length: 5-15 seconds
- Angle: side view where the swimmer is clearly visible
- Format: MP4 or MOV
- Resolution: 720p or 1080p
- Avoid raw 4K slow-motion for live demos unless compressed
- Avoid high-resolution screen recordings when possible; use the original camera export instead
- Keep the browser tab open until upload completes

## Why Storage Stays Private

Swimmer videos are private club assets. The `private-videos` bucket should remain private so public report links cannot expose source footage. Coaches can preview video only through authenticated short-lived signed URLs.

## Why Signed URLs Are Short-Lived

Signed URLs are temporary access grants. They are used for:

- authenticated coach playback
- Render AI processing download

They should not be stored in the database, copied into public reports, or sent to swimmers/parents.

## Why The Service Role Key Stays Server-Side

The Supabase service role key bypasses Row-Level Security and must only be used in Vercel API routes or controlled backend jobs. Browser code uses only the Supabase anon key with RLS.

## When Supabase Pro May Be Needed

Supabase Pro may be needed when pilot usage grows into:

- larger private video storage requirements
- higher upload volume
- larger database and storage egress needs
- more concurrent coaches uploading videos
- production backup and observability requirements

## When Paid Render May Be Needed

Paid Render may be needed when coaches need:

- fewer cold starts
- faster `/process-video` acceptance
- more reliable background processing
- more memory/CPU for larger clips
- predictable callback timing during club sessions

## AI Reliability And Manual Review

AI Review is evidence-assisted, not automatic truth. If pose evidence is weak, partial, blocked, or not coach-grade, the system must create a manual-review state with zero fake findings.

The Python AI worker uses adaptive processing instead of one fixed workload for every clip:

- `standard_ai`: normal short 720p/1080p camera clips receive the fullest V1 sampling window.
- `reduced_ai`: heavier clips are downsampled and sampled over a shorter safe window.
- `minimal_ai`: risky high-resolution, high-FPS, or screen-recording clips get a tiny pose attempt only.
- `manual_review_required`: unreadable, corrupt, extreme, or unsafe videos skip pose processing and return a manual-review report state.

File size is not the only factor. Decoded pixel workload matters more. A 44 MB high-resolution screen recording can be harder on the worker than a larger normal 1080p camera export because each decoded frame is much bigger.

Paid Render gives more CPU/memory headroom and fewer cold starts, but it does not replace safe adaptive processing. The worker should still downsample heavy videos and fall back to manual review instead of crashing.

Manual review remains valid because the coach can:

- open the uploaded private video
- add verified coach findings
- use Coach Draw annotations
- assign drills
- finalise the report
- create a secure shared report link
- manually notify swimmer/parent with the shared link

No fake findings should be created for weak pose, failed processing, timed-out jobs, or placeholder/error results.

## Future Infrastructure Upgrades

These are not required before the club pilot, but they are sensible next infrastructure upgrades after reliability is proven:

- resumable/TUS upload for large files
- server-side transcoding to web-friendly MP4
- background queue worker with Redis or durable queue
- persistent Render-side job store
- deeper biomechanics AI after upload and job reliability are stable

## File-Size Test Matrix

Run each tier on Mac Chrome/Safari, iPad Safari PWA, and iPhone Safari if possible.

### Tier 1: Small

- File: 5-10 seconds, under 20 MB
- Expected: row created immediately
- Expected: `uploading` visible during storage upload
- Expected: final status becomes `uploaded`, or `upload_failed` if storage fails
- Expected: retry/delete visible if failed
- Expected: AI trigger enabled only after `uploaded`
- Expected: Render receives `POST /process-video` if AI Review is triggered
- Expected: callback creates either an AI report or manual-review state
- Expected: manual fallback works even if AI is not used

### Tier 2: Medium

- File: 20-80 MB
- Expected: same as Tier 1
- Watch: upload time and iPad tab stability
- Coach note: keep tab open until upload completes

### Tier 3: Large

- File: 80-150 MB
- Expected: warning appears before upload
- Expected: row exists before upload completes
- Expected: failed/stalled upload remains visible after refresh
- Expected: retry/delete visible if failed
- Expected: AI Review is disabled until upload status is `uploaded`
- Watch: Wi-Fi stability, mobile Safari memory, Render download timing

### Tier 4: Too Large For Pilot

- File: 150 MB+
- Expected: strong warning appears before upload
- Expected: upload may still be allowed unless a technical limit blocks it
- Expected: coach is advised to trim/compress
- Expected: failed upload leaves visible recovery state
- Expected: manual review remains available after successful upload

## Pilot Pass Criteria

The build is ready for realistic 20-150 MB testing when:

- uploaded row appears before storage upload completes
- upload failure is recoverable
- AI starts only after a private object exists
- Render receives `POST /process-video`
- callback updates the Supabase job and report
- weak pose creates manual review with zero fake findings
- manual findings can be added and approved
- Coach Draw annotations can be saved and included
- report finalises
- shared report excludes private video URLs and paths
- manual notify copies a secure shared report link only
