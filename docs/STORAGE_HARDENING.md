# Storage Hardening Foundation

Swim Sight 3D treats uploaded swim videos as private raw footage. This document describes the current storage boundary and the future path for S3/GCS, Modal, or RunPod workers.

## Current Provider

The current provider is `supabase_private`.

Video uploads are stored in the private Supabase bucket:

```text
private-videos
```

The database keeps existing compatibility fields:

```text
file_bucket
file_path
storage_bucket
storage_path
mime_type
file_size_bytes
upload_status
created_by
club_id
```

The app derives provider-neutral fields from those records:

```text
storage_provider
video_storage_key
content_type
signed_read_url
signed_upload_url
```

`video_storage_key` is an internal private object identifier. It must not appear in public/shared reports.

## Signed Read Flow

Playback uses the consolidated signed read endpoint:

```text
POST /api/video-uploads/:id/signed-url
```

The route:

- requires an authenticated user,
- loads the requested `video_uploads` row,
- checks club membership,
- restricts swimmer/parent roles to their linked swimmer,
- rejects incomplete or failed uploads,
- creates a short-lived signed Supabase read URL,
- returns `signed_read_url` and legacy `signed_url` for compatibility.

The signed read TTL is currently 10 minutes. UI components should request a new signed URL when needed rather than storing it permanently.

## Signed Upload Readiness

Current browser uploads still use the existing private Supabase upload path. The storage adapter now gives the codebase provider-neutral names so future direct upload flows can add:

```text
signed_upload_url
upload_headers
storage_provider
video_storage_key
```

Do not add S3 or GCS credentials to the frontend. Future direct-to-S3/GCS uploads should request signed upload instructions from an authenticated API route after club/swimmer ownership checks.

## Private Storage Key Rules

Private object identifiers are allowed in:

- authenticated internal app state,
- `VideoUpload` compatibility fields,
- internal AI worker payloads,
- retention/deletion helpers.

They are not allowed in:

- public shared report payloads,
- public marketing pages,
- browser-visible error messages,
- logs shown to coaches,
- support/feedback email bodies unless explicitly reviewed.

Public report sanitisation blocks signed URLs, private file paths, bucket names, storage paths, `video_storage_key`, raw landmarks, rejected findings, guardian details, and debug payloads.

## AI Worker Access

The current Render worker still receives a short-lived `signed_video_url` for compatibility. The app now also sends:

```text
storage_provider
video_key
signed_video_url_expires_in_seconds
```

Future Modal/RunPod workers should prefer provider-native object access using the private `video_key` and scoped service credentials. Until that worker access is implemented, the signed URL remains short-lived and internal to the worker request.

## Retention Expectations

Retention helpers identify raw footage through the same private storage adapter. Raw footage can be deleted while derived, coach-approved report content remains.

Retention-ready video records should include, where supported:

```text
upload_completed_at
raw_footage_deleted_at
raw_footage_deletion_reason
retention_expires_at
```

`retention_expires_at` is a future-friendly field name. The current database does not require a new migration for this Phase 9 foundation.

## Future S3/GCS Migration Path

The provider abstraction is intentionally small:

1. Keep `video_storage_key` as the internal object identifier.
2. Add a provider adapter for direct uploads.
3. Add a provider adapter for signed reads.
4. Update the AI worker to read from provider-native storage.
5. Keep public/shared report sanitisation unchanged.
6. Keep retention/deletion helpers provider-aware.

This phase does not migrate storage providers and does not alter public report behaviour.
