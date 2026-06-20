DRAFT — NOT legal advice. Must be reviewed and approved by a qualified lawyer before any real use.

# Data Retention Working Draft

This document describes the current technical design for legal and operational
review. It is not a final retention policy and does not claim compliance with
any particular law.

## Raw uploaded footage

- Stored in the private `private-videos` bucket.
- Available only through authorised application flows and short-lived signed
  access links.
- Selected for deletion when the coach-review workflow has produced a completed
  report, or when `FOOTAGE_RETENTION_DAYS` has elapsed since upload.
- `FOOTAGE_RETENTION_DAYS` defaults to 30 until a lawyer and the club approve a
  different period.
- After deletion, the database keeps a path-free marker and clears the private
  object path and original filename.

## Derived reports and AI artifacts

Coach-approved reports may remain after raw footage is deleted. On an
authenticated erasure request, the service removes findings, key frames,
annotations, calibration feedback, processing jobs, notification records,
shared links, and stored annotation previews associated with the swimmer. The
report row is reduced to an auditable deleted marker rather than public content.

AI-assisted findings are drafts until reviewed by a coach. Retaining a report
does not turn a draft into an approved finding.

## Consent records

Consent status and guardian contact are internal records. An erasure request
clears guardian contact and marks consent withdrawn. Legal review must decide
whether any minimum consent audit information must be retained and for how long.

## Audit markers

Deletion events record identifiers, status, timestamps, and aggregate deletion
counts. They do not store signed video links or private storage paths. Legal
review must define the final audit fields and retention period.

## Operational review required

Before enabling scheduled deletion, the club must test recovery, partial
failure handling, report availability after raw deletion, and the authenticated
erasure flow. A qualified lawyer must approve the final periods and wording.
