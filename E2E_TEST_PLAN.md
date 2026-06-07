# V1 End-to-End Test Plan

Use a real Supabase project and a Vercel preview URL for the first live test. Render cannot callback to localhost unless a public tunnel is used.

## Preflight

1. Confirm Vercel preview deploy is green.
2. Confirm Supabase migrations are applied.
3. Confirm `private-videos` bucket is private.
4. Confirm Vercel env vars are configured.
5. Confirm Render has `AI_WEBHOOK_SECRET` if the Python server sends callback headers.
6. Confirm `PUBLIC_APP_URL` points to the Vercel preview URL.

## Core Flow

1. Register a new user.
2. Login.
3. Create club.
4. Confirm the user becomes owner.
5. Add swimmer.
6. Open Analyse Video.
7. Upload a 5-10 second private test clip.
8. Confirm file appears in Supabase Storage `private-videos`.
9. Confirm `video_uploads` row exists.
10. Preview the video through signed playback.
11. Click Send for AI Review.
12. Confirm `ai_processing_jobs` row is created.
13. Confirm Render receives `POST /process-video`.
14. Confirm Render downloads the signed Supabase video URL before it expires.
15. Confirm Render sends callback to `/api/ai/callback`.
16. Confirm callback passes secret validation.
17. Confirm job updates to `completed`, `unreliable_pose`, or `error`.
18. Confirm report row is created.
19. Confirm findings are created only if `analysis_mode = real_pose` and `real_pose_detected = true`.
20. Confirm weak pose creates a manual-review path with zero fake findings.
21. Open AI Reviews.
22. Open the report.
23. Approve/edit/reject finding if present.
24. Add manual finding if needed.
25. Add coach summary and next focus.
26. Finalise report.
27. Create shared report link.
28. Open shared link logged out/incognito.
29. Confirm public report shows approved content only.
30. Confirm public report does not show private data.

## Public Report Safety Checks

The public shared report must not show:

- Signed video URL.
- Storage `file_path`.
- `file_uri`.
- Raw AI payload.
- Rejected findings.
- Pending findings.
- Private coach notes.
- Internal admin/debug fields.
- Raw pose data.

It should show:

- Swim Sight 3D branding.
- Club display name.
- Swimmer display name.
- Stroke and review date.
- Coach summary.
- Technical summary if approved for sharing.
- Next focus.
- Approved/manual findings only.
- Assigned drills from approved findings.
- Disclaimer: "AI-assisted evidence supports coach review. Final report content is coach-approved."

## RLS Runtime QA

1. User can create own profile.
2. User can create club through API.
3. User can read own club membership.
4. User can add swimmer to own club.
5. User cannot see another club's swimmers.
6. User can upload video to own club path.
7. User cannot read private video bucket directly without signed URL.
8. Owner/admin/coach can trigger AI.
9. Swimmer/parent cannot trigger AI.
10. Owner/admin/coach can finalise/share report.
11. Public endpoint works without auth but only returns sanitized data.

## Failure Triage

Allowed fixes:

- RLS policy fixes.
- API auth/role fixes.
- Missing column mapping fixes.
- Signed URL expiry or path fixes.
- Callback matching/idempotency fixes.
- Report/finding status mapping fixes.
- UI states for runtime errors.

Not allowed:

- Fake AI results.
- Fake reports/findings.
- Weakening callback security.
- Public storage exposure.
- Bypassing role checks from frontend.
- Migrating deferred advanced features.
