# Swim Sight 3D App Store Preparation

Swim Sight 3D is currently a Vercel-hosted PWA for controlled club testing. Coaches can install it on iPhone/iPad from Safari with Share -> Add to Home Screen.

## Current Sunday Build

- Install path: Safari -> Share -> Add to Home Screen.
- App name: Swim Sight 3D.
- Scope: swimming coaching review, private video upload, AI-assisted review, coach approval, reports, shared links, drills, annotations, and progress dashboards.
- Storage: Supabase Auth, database, and private storage.
- AI server: external Render Python service.

## Future Native App Path

1. Complete 2-4 controlled club testing sessions with written feedback.
2. Confirm privacy policy, terms, child/minor handling, and club consent flow.
3. Decide whether native is required or whether PWA is enough for the first pilot.
4. If native is required, wrap the existing Vite app with Capacitor or rebuild the mobile shell intentionally.
5. Add native camera/file permissions only if needed.
6. Test iPhone/iPad upload, login persistence, annotation touch handling, and report sharing.
7. Prepare App Store Connect listing, screenshots, support URL, privacy nutrition labels, and review notes.

## Claims To Avoid

- Do not claim a formal relationship with SwimPro unless one exists.
- Do not claim camera-control support for SwimPro systems.
- Do not claim exact drag measurement.
- Do not claim medical, clinical, or guaranteed performance outcomes.
- Do not claim AI findings are final without coach approval.

## Required Before App Store Submission

- Public privacy policy URL.
- Public support/contact URL.
- Deletion/export process for club data.
- Clear age/minor consent wording.
- Production monitoring for uploads, AI callbacks, and shared reports.
- A formal review of third-party footage and athlete image rights.
