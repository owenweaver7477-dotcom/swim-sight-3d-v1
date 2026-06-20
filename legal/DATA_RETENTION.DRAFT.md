DRAFT — NOT legal advice. Must be reviewed and approved by a qualified lawyer before any real use.

# Data Retention Working Draft

This document describes the current technical design and the decisions still
required. It is not a final retention schedule and does not claim compliance
with any law.

## Draft retention schedule — periods require approval

| Data category | Current technical treatment | Final period / basis required |
| --- | --- | --- |
| Club and coach accounts | Retained while the workspace/account exists | `[DEFINE ACCOUNT CLOSURE AND LEGAL HOLD RULES]` |
| Swimmer profile and contact | Retained in the private club workspace | `[DEFINE CLUB RELATIONSHIP AND ERASURE PERIOD]` |
| Raw uploaded video | Selected after completed coach review or 30 days, whichever is first | Confirm final period and exceptions |
| Pose keypoints and processing telemetry | Stored with processing/report records where generated | Define period separately from raw video |
| AI-assisted draft findings | Internal until coach review; deleted during scoped erasure | Define rejected/draft retention |
| Coach-approved reports | May remain after raw footage deletion | Define club/report-history period |
| Key moments and annotation previews | Linked to the report; removed during scoped erasure | Define ordinary retention period |
| Consent record and guardian contact | Internal, server-controlled record | Define evidence period and contact deletion |
| Shared-report link records | Active until expiry/revocation; removed during erasure | Define expired-link retention |
| Deletion audit markers | Path-free event, status, timestamp, and counts | Define minimum and maximum audit period |
| Application/worker/security logs | Provider and app configuration dependent | Audit contents and set periods |
| Provider backups | Not controlled by live-row deletion alone | Verify rotation, restoration, and expiry |
| Website analytics/cookies | Depends on enabled production tools | Audit tools, basis, and retention |

## Raw uploaded footage

- Stored in the private `private-videos` bucket.
- Available through authorised application flows and short-lived signed access.
- Selected for deletion when a coach-approved/finalised workflow is complete or
  when `FOOTAGE_RETENTION_DAYS` has elapsed.
- `FOOTAGE_RETENTION_DAYS` defaults to 30 pending approval.
- The live database then keeps a path-free marker and clears the object path,
  original filename, and file-size fields.

This implementation should be tested against the final legal definition of
“processing complete”. Deleting raw footage too early must not prevent the
coach from completing the agreed review.

## Derived reports and AI artifacts

Coach-approved reports may remain after raw footage is deleted. An authenticated
erasure request removes findings, key frames, annotations, calibration
feedback, processing jobs, notification records, shared links, and stored
annotation previews associated with the swimmer. The report row is reduced to
an auditable deleted marker rather than public content.

AI-assisted findings are drafts until reviewed by a coach. Retaining a report
does not turn a draft into an approved finding.

## Backups — unresolved provider work

Deleting a live database row or object does not demonstrate immediate removal
from infrastructure backups. Before real use, verify and document for Supabase,
Vercel, Render, and any other provider:

- whether the relevant service creates backups or snapshots;
- the backup rotation and maximum expiry period;
- whether individual deletion inside a backup is possible;
- what happens if an older backup is restored;
- how a deletion request is prevented from reappearing after restoration; and
- which party handles provider deletion requests at contract end.

Until verified, the policy must not promise immediate deletion from all
backups.

## Logs

Audit Vercel function logs, Render worker logs, Supabase logs, security logs,
analytics, and local support exports. Set a justified retention period for each.
Logs must not contain signed video URLs, storage paths where avoidable, webhook
secrets, guardian contact, or raw AI payloads. Operational telemetry should use
IDs, aggregate counts, stages, and safe error codes.

## Consent and deletion records

Guardian contact is internal and excluded from public reports. An erasure
request clears guardian contact and marks consent withdrawn. Legal review must
decide whether a minimal consent-evidence record must remain, what it contains,
and for how long.

Deletion events retain identifiers, status, timestamps, and aggregate counts.
They do not store signed links or private storage paths. The lawyer must define
their final fields and period.

## No training or marketing reuse

The current operational purpose does not authorise swimmer footage, pose
keypoints, findings, or reports to be copied into an AI training/fine-tuning
dataset, research dataset, advertising library, or marketing asset collection.
Any future use requires separate legal review, a new retention schedule, and
separate specific permission before copying or retaining the data.

## Sub-processors and international transfers

The final schedule must align deletion and contract-end obligations across
Supabase, Vercel, Render, and any future provider. Confirm hosting regions,
sub-processors, contractual deletion commitments, backup periods, and any
international transfer safeguards before publication.

## Operational and legal approval required

Before enabling scheduled deletion for real footage:

1. A lawyer approves the controller/processor roles, lawful bases, biometric
   assessment, category periods, rights process, and exceptions.
2. The club tests completed-review deletion, age-based deletion, partial
   failures, retry, report availability, erasure, and restored-backup handling.
3. Provider regions, backups, logs, sub-processors, and transfer arrangements
   are documented.
4. The consent notice uses the same periods and accurately describes what
   happens to existing reports and backups.
