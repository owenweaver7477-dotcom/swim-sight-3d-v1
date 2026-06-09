# Swim Sight 3D Privacy Policy Checklist

This checklist is for controlled club testing and future launch preparation. It is not legal advice.

## Data The App Handles

- Coach account details: email, name, authentication identifiers.
- Club workspace details: club name, members, roles, invite codes.
- Swimmer profile details: name, squad, email fields, parent email fields, notes, stroke focus.
- Private video uploads: stored in Supabase Storage and accessed through short-lived signed URLs.
- AI processing records: job status, reliability, callback metadata, technical result summaries.
- Coach reports: approved findings, coach summaries, drills, annotations, next focus.
- Shared report links: public-safe report token and approved content only.
- Notification logs: manual share or email delivery status when configured.

## Public Sharing Rules

- Public shared reports must not include private video paths.
- Public shared reports must not include signed video URLs.
- Public shared reports must not include raw AI payloads.
- Public shared reports must not include pending/rejected findings.
- Public shared reports must not include private coach notes unless explicitly selected for report output.
- Shared report links can be disabled.

## Consent And Club Testing

- Confirm the club has permission to upload and review each swimmer video.
- Confirm parents/guardians understand shared report links can be opened by anyone with the token.
- Use short technical clips for testing where possible.
- Avoid uploading sensitive non-swimming footage.
- Avoid using third-party/reference footage unless the club has permission.

## Operational Checklist

- Supabase RLS enabled for all app tables.
- `private-videos` bucket remains private.
- Service role key exists only in server-side Vercel environment variables.
- AI webhook secret exists only in server-side Vercel/Render environment variables.
- No `.env` committed.
- Coach approval is required before findings appear in public reports.
- Weak/unreliable pose stays manual review and creates no fake findings.
