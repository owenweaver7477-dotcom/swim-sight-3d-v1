# Swim Sight 3D AI Calibration Notes

Swim Sight 3D uses AI-assisted pose evidence as draft coaching input. A coach must verify each AI finding on the source video before it can appear in a final or shared report.

## Feedback Collected

Phase 5 records internal calibration events in `ai_finding_feedback`:

- AI findings a coach approves
- AI findings a coach edits
- AI findings a coach rejects
- Optional rejection reason and note
- Manual coach findings added when AI evidence is weak or incomplete
- Report finalisation summary counts
- Stroke, phase, fault tag, AI confidence, evidence note, and quality flags where available

This data is for calibration, QA, future threshold tuning, and future dataset export. It is not shown to swimmers or parents.

## Why Coach Review Remains Required

The AI system can miss context that a coach can see in video, including camera angle, occlusion, swimmer intent, fatigue, drill constraints, and coaching priorities. For that reason, Swim Sight treats AI output as:

`draft evidence -> coach verifies on video -> coach approves/edits/rejects -> final report`

Weak or partial pose evidence stays in manual review and generates zero AI findings.

## How Feedback Helps Future Calibration

Approved, edited, and rejected findings can later be used to evaluate:

- Which fault tags are commonly accepted
- Which fault tags are commonly rejected
- Whether confidence labels match coach decisions
- Which stroke phases need stricter thresholds
- Which quality flags usually lead to manual review
- Whether the AI is too cautious or too aggressive for a club pilot

## What Is Not Happening

- No automatic live retraining happens from every coach action.
- No medical diagnosis is made.
- No certainty-level accuracy claims are made.
- No numerical force, body-mechanics certainty, or race prediction claims are made.
- No private video paths, signed URLs, or raw private storage data are included in feedback exports or public reports.

## Future Upgrade Path

Possible post-pilot upgrades:

- Owner/admin calibration dataset export
- Curated model evaluation set from coach-reviewed cases
- Stroke-specific threshold tuning
- Coach-specific review preferences
- Better analysis of rejection reasons by camera angle and quality flag
- Periodic offline model evaluation before any model changes are promoted
