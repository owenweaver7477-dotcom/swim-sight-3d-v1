# Swim Sight 3D V1 Coach Testing Plan

Use this 20-minute test with a real coach, one real swimmer, and one short swim clip. Do not use fake AI results.

## Test Setup

- Test on the live Vercel app: https://swim-sight-3d-v1.vercel.app
- Use a 5-10 second MP4/MOV/WebM swim clip.
- Prefer a side-angle, above-water clip where the swimmer is clearly visible.
- Keep Supabase, Vercel, and Render logs open during the AI Review step.

## 20-Minute Coach Test

1. Log in or register.
   - Expected: coach reaches Dashboard or Club Onboarding.

2. Create a club workspace.
   - Expected: coach becomes owner and lands in the app shell.

3. Add one swimmer.
   - Expected: swimmer appears in Swimmers and Analyse Video.

4. Open Analyse Video.
   - Expected: coach understands the flow: select swimmer, upload clip, send for AI Review.

5. Upload a private 5-10 second video.
   - Expected: video uploads to private storage, previews through a signed URL, and does not expose storage paths.

6. Send the video for AI Review.
   - Expected: video status changes to queued/processing and an AI job row appears.

7. Confirm Render receives the job.
   - Expected: Render receives `POST /process-video` with a signed video URL.

8. Confirm callback reaches Vercel.
   - Expected: `ai_processing_jobs` updates and a report is created.

9. Open AI Reviews.
   - Expected: report appears in Coach Review Required, Processing, or Manual Review Recommended.

10. Open the report.
    - Expected: coach sees source video, AI evidence status, returned/accepted/filtered counts, and findings if the quality gate passed.

11. Review findings.
    - Approve one finding if it is accurate.
    - Edit one cue if wording needs coach adjustment.
    - Reject one finding if it is not visible in the video.

12. Add one manual finding.
    - Expected: coach can add a real observation even if AI evidence was weak.

13. Add coach summary and next focus.
    - Expected: saved coach text appears in the approved report section.

14. Finalise the report.
    - Expected: finalise is blocked while draft AI findings are pending.
    - Expected: finalised report is clearly coach-approved.

15. Create a shared report link.
    - Expected: public link opens logged out.

16. Review shared report as a parent/swimmer.
    - Expected: approved findings, coach summary, next focus, and drills are visible.
    - Expected: no private video link, file path, raw AI payload, rejected findings, pending findings, or internal job metadata appears.

17. Open Drill Library.
    - Expected: 9 packs are visible and each pack contains drills.
    - Expected: drill details include purpose, cue, setup, execution, common mistakes, progression, and equipment.

## Feedback Questions

- Did the Dashboard make it clear what to do next?
- Did Analyse Video explain what footage works best?
- Did AI Review feel trustworthy or too confident?
- Were the accepted/filtered AI counts understandable?
- Did manual review feel like a normal coach workflow rather than an error?
- Was finalising clear and appropriately strict?
- Would you send the shared report to a swimmer or parent?
- What wording felt confusing, too technical, or not coach-like?
- What is the one workflow that should become faster before broader coach rollout?

## Pass Criteria

- Coach can complete the core workflow without developer help.
- AI findings are never treated as final until coach-approved.
- Weak pose creates manual review, not fake findings.
- Shared report is public-safe.
- Coach can explain what happened at each step.
