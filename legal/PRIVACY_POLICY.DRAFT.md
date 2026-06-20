DRAFT — NOT legal advice. Must be reviewed and approved by a qualified lawyer before any real use.

# Privacy Policy Working Draft

This is a plain-language input for legal review. It is not a published policy,
does not claim compliance with any law, and must not be presented to a club as
final. Items in square brackets must be completed before use.

## Identity, roles, and contact — lawyer decision required

- Product operator/legal entity: `[FULL LEGAL NAME AND REGISTRATION DETAILS]`
- Privacy contact: `[PRIVACY EMAIL AND POSTAL ADDRESS]`
- Effective date and version: `[DATE]`, `[VERSION]`
- Governing jurisdiction(s): `[CONFIRM BEFORE USE]`
- Supervisory authority and complaints route: `[E.G. ICO ONLY IF UK LAW APPLIES]`

The lawyer and each pilot club must determine and document who acts as
controller, joint controller, or processor for each activity. Do not assume one
relationship applies to everything. At minimum, decide separately for:

| Processing activity | Role decision still required |
| --- | --- |
| Club account and staff administration | Who decides the purpose and essential means? |
| Swimmer profile, video review, and report sharing | Is the club controller and Swim Sight 3D its processor, or another arrangement? |
| Security, abuse prevention, support, and service logs | Which activities are performed for the operator's own purposes? |
| Product analytics | Who controls collection and whether consent is required? |
| Any future model training or research | Treat as a new purpose requiring separate legal review and permission. |

The final contracts and policy must reflect the decided roles and instructions.

## Data the current service is designed to process

- Coach, club, and account details.
- Swimmer profile details entered by an authorised club user.
- Uploaded swimming video.
- Pose keypoints and processing telemetry derived from the video.
- AI-assisted draft findings, coach edits, internal coach notes, cues, and drills.
- Coach-approved reports and report-sharing records.
- Parent or guardian contact and consent records where applicable.
- Security, operational, consent, sharing, retention, and deletion audit records.
- Limited website or performance analytics, if enabled in the deployed app.

The final policy must replace this technical inventory with the verified,
definite list from the live production configuration.

## Why information is used and lawful basis — lawyer decision required

The intended purposes are private video review, coach-created analysis,
optional AI-assisted draft findings, swimmer reports, club administration,
security, support, retention, and deletion. AI output is a draft for coach
review. A coach decides what is approved and shared.

For every purpose above, the final policy must state the applicable lawful
basis and any additional condition needed for special-category data. Legal
review must specifically decide the basis for processing a minor's footage and
whether parent or guardian consent is valid and sufficient in each applicable
jurisdiction. Withdrawal must be as easy to request as consent was to give.

## Biometric and special-category assessment — unresolved

Video and derived pose keypoints relate to physical or behavioural movement.
A qualified lawyer must decide and document whether each data type is:

- personal data;
- biometric data;
- biometric data processed for unique identification;
- special-category data for another reason, including any health inference; or
- outside those categories for this particular technique-analysis purpose.

Swim Sight 3D is not intended to identify or authenticate a person from their
movement. That intended purpose does not replace the required legal and
technical assessment. The decision, rationale, safeguards, and any required
impact assessment must be completed before real footage is used.

## Private video and shared reports

Raw video is stored in a private storage bucket. Temporary signed links may be
used by authorised users and the private processing worker. Shared reports only
contain content selected or approved by a coach. Guardian contact, consent
details, private storage paths, signed links, raw AI payloads, rejected
findings, and internal coach notes are not part of the public shared-report
response.

## Service providers and international transfers — verify before use

The live deployment currently uses the following provider categories. The
final policy and contracts must confirm the exact legal entity, service,
hosting region, data processed, retention, sub-processors, and transfer
mechanism for the production account.

| Provider | Current technical purpose | Details still to verify |
| --- | --- | --- |
| Supabase | Authentication, database, and private object storage | Contracting entity, region, backups, sub-processors, transfer mechanism |
| Vercel | Web hosting, server functions, and optional analytics/performance data | Region, logs, analytics configuration, sub-processors, transfer mechanism |
| Render | Private video-processing worker | Region, temporary files, logs, sub-processors, transfer mechanism |
| Any future AI or support provider | Not authorised by this draft | Separate review and disclosure before use |

If data leaves the applicable jurisdiction, the final policy must describe the
lawyer-approved transfer basis and safeguards. Do not state that adequacy,
standard clauses, or another mechanism applies until deployment and contracts
have been checked.

## Retention and deletion

The current technical default selects raw footage for removal after the
coach-review workflow is complete or after 30 days, whichever occurs first.
The final periods must be approved and aligned with provider backup and log
retention. Deleting a live object does not by itself prove immediate removal
from every provider backup.

Authorised club users can request deletion of a swimmer's private footage and
AI artifacts. The system retains a limited, path-free audit marker. The final
policy must explain what happens to existing reports, backups, logs, and any
records that must be retained.

## Individual rights and complaints — jurisdiction dependent

The final policy must explain how a person or guardian can request access,
rectification, erasure, restriction, portability, or objection where those
rights apply, and how consent can be withdrawn. It must explain identity
verification, response routes, applicable exceptions, and the right to complain
to the relevant supervisory authority. Requests should be sent to
`[PRIVACY CONTACT — MUST BE COMPLETED]`.

## Security summary

Current technical measures include private video storage, role checks,
short-lived signed access, server-only secrets, coach approval before public
report inclusion, configurable retention, and path-free deletion markers.
These reduce risk but do not guarantee security. The final policy must describe
only controls verified in production and provide an incident contact process.

## Website storage, cookies, and analytics

The deployed website uses authentication/session storage and may use product
analytics or performance measurement. Before publication, audit the actual
browser storage, cookies, Vercel Analytics, Speed Insights, and any third-party
scripts. The lawyer must decide what notice or consent mechanism is required.

## No training or marketing without separate permission

Swimmer footage, pose keypoints, findings, and reports will not be used to train
or fine-tune an AI model, build a research dataset, advertise the product, or
create marketing material under this operational consent. Any such use is a
separate purpose and requires fresh legal review and separate, specific
permission before data is copied or used.

## Before publication

A qualified lawyer must resolve every placeholder and decision above, review
the live architecture and provider contracts, approve the controller/processor
arrangement, determine the biometric and special-category position, set the
lawful bases and retention periods, and approve the final rights and complaints
process.
