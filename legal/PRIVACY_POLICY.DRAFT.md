DRAFT — NOT legal advice. Must be reviewed and approved by a qualified lawyer before any real use.

# Privacy Policy Working Draft

This document is a plain-language starting point for legal review. It is not a
published policy and does not claim compliance with any particular law.

## What Swim Sight 3D may collect

- Coach and club account details.
- Swimmer profile details entered by an authorised club user.
- Uploaded swimming video.
- Pose keypoints and processing telemetry derived from the video.
- AI-assisted draft findings, coach edits, coach notes, cues, and drills.
- Parent or guardian contact and consent records where the swimmer is a minor.
- Audit records for consent, sharing, retention, and deletion actions.

## Why the information is used

The information supports private video review, coach-created analysis, optional
AI-assisted draft findings, swimmer reports, and club administration. AI output
is a draft for coach review. A coach decides what is approved and shared.

## Private video and shared reports

Raw video is stored in a private storage bucket. Temporary signed links may be
used by authorised users and the private processing worker. Shared reports only
contain content selected or approved by a coach. Guardian contact, private
storage paths, signed links, raw AI payloads, and rejected findings are not part
of the public shared-report response.

## Retention and deletion

The current technical default is to remove raw footage after the coach-review
workflow is complete or after 30 days, whichever occurs first. The configured
period may be changed after legal and operational review. Derived reports may be
retained separately until an authorised deletion request is completed.

Authorised club users can request deletion of a swimmer's private footage and
AI artifacts. The system keeps a limited, path-free audit marker recording that
the deletion was requested and completed or requires follow-up.

## Minors and guardian consent

Before processing footage for a swimmer marked as a minor, the production
service is intended to require a recorded guardian-consent status. A withdrawn
or missing consent status prevents new AI processing when the enforcement flag
is enabled. Clubs remain responsible for following the lawyer-approved consent
process and for using footage only for the agreed purpose.

## Lawyer review required

A qualified lawyer must decide the final policy wording, lawful basis,
retention periods, contact process, jurisdiction-specific notices, and any
rights or obligations that apply before this text is used with real people.
