# Supabase Setup

This project uses Supabase for V1 auth, database, storage, and RLS. Do not put real secrets in this file.

## Before Sunday Test

Run this checklist before handing the app to a coach:

1. Run all migrations through `015b_v1_ai_job_engine_reliability.sql`.
2. Confirm `notification_logs` exists.
3. Confirm `video_annotations` exists.
4. Confirm `pilot_feedback` exists before using `/pilot-readiness`.
5. Confirm `clubs` has `initials`, `location`, `primary_color`, and `accent_color`.
6. Confirm `squads` has `level`, `training_focus`, `lead_coach_name`, `is_active`, and `archived_at`.
7. Confirm the `private-videos` bucket exists and is private.
8. Confirm Vercel has `SUPABASE_SERVICE_ROLE_KEY`, `AI_WEBHOOK_SECRET`, `AI_SERVER_URL`, and `PUBLIC_APP_URL`.
9. Confirm Render has the same `AI_WEBHOOK_SECRET` value as Vercel.
10. Confirm the Python callback sends `x-ai-webhook-secret` or `Authorization: Bearer <AI_WEBHOOK_SECRET>`.

## 1. Create Project

1. Create a new Supabase project.
2. Record the project URL and anon key for frontend environment variables.
3. Record the service role key for server-side Vercel API routes only.

## 2. Environment Variables

Frontend-safe:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_BASE_URL=
VITE_AI_SERVER_URL=https://swim-sight-ai-server.onrender.com
```

Server-only:

```bash
SUPABASE_SERVICE_ROLE_KEY=
AI_SERVER_URL=https://swim-sight-ai-server.onrender.com
AI_WEBHOOK_SECRET=
PUBLIC_APP_URL=
```

Local testing:

```bash
VITE_APP_BASE_URL=http://localhost:5173
```

If testing the Render callback locally, `PUBLIC_APP_URL` must be a public tunnel URL because Render cannot call localhost directly. The preferred first live E2E test is a Vercel preview URL.

Vercel preview/production:

```bash
PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

## 3. Apply Migrations

Apply in order:

1. `supabase/migrations/001_v1_core_schema.sql`
2. `supabase/migrations/002_v1_swimmer_profile_fields.sql`
3. `supabase/migrations/003_v1_private_video_storage_policies.sql`
4. `supabase/migrations/004_v1_ai_job_reliability.sql`
5. `supabase/migrations/005_v1_default_drills.sql`
6. `supabase/migrations/006_v1_coach_review_assistant.sql`
7. `supabase/migrations/007_v1_video_annotations.sql`
8. `supabase/migrations/008_v1_technical_standards_reference_library.sql`
9. `supabase/migrations/009_v1_notification_delivery.sql`
10. `supabase/migrations/010_v1_video_annotations.sql`
11. `supabase/migrations/011_v1_club_profile_squad_polish.sql`
12. `supabase/migrations/012_v1_large_video_upload_lifecycle.sql`
13. `supabase/migrations/013_v1_ai_feedback_calibration.sql`
14. `supabase/migrations/014_v1_pilot_feedback.sql`
15. `supabase/migrations/015a_v1_ai_job_status_enum_values.sql`
16. `supabase/migrations/015b_v1_ai_job_engine_reliability.sql`

Important: run `015a` and let it complete before running `015b`. PostgreSQL requires new enum values to be committed before later statements can use them.

Confirm that:

- RLS is enabled on all public V1 tables.
- Storage policies exist for `private-videos`.
- Helper functions such as `public.has_club_role` are present.
- `ai_processing_jobs` has the V1 reliability columns, attempt tracking, callback diagnostics, and granular statuses before testing AI Review callbacks.
- `drills` exists with shared default rows before testing database-backed Drill Library content.
- `video_annotations`, `technical_standards`, `reference_profiles`, `reference_assets`, `notification_logs`, `ai_finding_feedback`, and `pilot_feedback` exist before testing Coach Draw, standards/reference, report delivery, calibration, and pilot feedback.
- `clubs` has profile fields and `squads` has V1 organisation fields before testing club settings polish.

## 4. Storage

Create or confirm this bucket:

- `private-videos`

Bucket requirements:

- Private bucket.
- Never public.
- Upload path format: `{club_id}/{swimmer_id}/{video_upload_id}/{filename}`.
- Coaches access playback only through the signed URL API route.
- Public shared reports must never expose storage paths or signed URLs.

## 5. Auth

In Supabase Auth settings:

1. Enable email/password auth.
2. Configure Site URL:
   - Local: `http://localhost:5173`
   - Vercel preview/production URL for hosted testing.
3. Add redirect URLs:
   - `http://localhost:5173/*`
   - `https://your-vercel-app.vercel.app/*`
   - Production custom domain when available.

## 6. Service Role Safety

- `SUPABASE_SERVICE_ROLE_KEY` must be configured only in Vercel server environment variables.
- Never prefix the service role key with `VITE_`.
- Never import `api/_lib/supabaseServer.js` from `src`.
- Frontend code must use only `VITE_SUPABASE_ANON_KEY`.

## 7. RLS QA Checklist

Confirm live behavior:

1. User can create/read own profile.
2. User can create a club through API.
3. User can read their own `club_members` row.
4. Owner/admin/coach can create swimmers and video uploads for their club.
5. Users cannot read another club's swimmers, videos, reports, findings, or jobs.
6. Owner/admin/coach can trigger AI.
7. Swimmer/parent cannot trigger AI.
8. Owner/admin/coach can finalise/share reports.
9. Public shared report endpoint works without auth and returns sanitized data only.
