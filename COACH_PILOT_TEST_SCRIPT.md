# Swim Sight 3D Coach Pilot Test Script

Use this for a controlled club pilot. The goal is to learn how coaches use the workflow, not to claim the app is fully automatic.

## 2-Minute Intro

Swim Sight 3D is an AI-assisted, coach-reviewed swim analysis platform. Coaches upload private swim footage, review draft evidence when the AI is confident enough, add manual findings when needed, draw on paused video frames, finalise the report, and share a secure parent/swimmer view.

Say clearly:

- AI findings are draft evidence until a coach approves them.
- Manual review is available and expected when video evidence is not strong enough.
- Shared reports show coach-approved content only.
- Footage exported from SwimPro or any standard camera system can be uploaded if the coach has permission to use the file.

Do not claim:

- Fully automatic coaching.
- Exact drag measurement.
- Official SwimPro integration or partnership.
- Medical diagnosis.
- Guaranteed biomechanics or race prediction.

## 10-Minute Demo Flow

1. Open Swim Sight 3D on iPad or laptop.
2. Log in and select the club workspace.
3. Confirm or create one squad.
4. Add or select one swimmer.
5. Upload one 5-15 second side-view MP4/MOV clip.
6. Wait for the upload to show `uploaded`.
7. Send the video for AI Review.
8. Open AI Reviews.
9. Open the report when it appears.
10. Approve, edit, reject, or add a manual finding.
11. Pause the video and use Coach Draw to mark one frame.
12. Include that annotation in the report.
13. Link a drill if useful.
14. Add coach summary and next focus.
15. Finalise the report.
16. Create a secure shared report link.
17. Open the shared link logged out or on another device.
18. Open AI Calibration and confirm feedback rows are captured after coach decisions.
19. Open Pilot Readiness and save one pilot feedback note.

## iPad Install Steps

1. Open Safari.
2. Go to `https://swim-sight-3d-v1.vercel.app`.
3. Tap Share.
4. Tap Add to Home Screen.
5. Name should appear as Swim Sight.
6. Open from the Home Screen icon before testing upload and Coach Draw.

## Test Video Checklist

Best first clip:

- 5-15 seconds.
- Side view.
- MP4 or MOV.
- 720p or 1080p.
- Under 80 MB for the first pass.
- Stable Wi-Fi.

Larger files:

- 80-150 MB is allowed but may take longer.
- 150 MB+ should be trimmed or compressed before a live demo if time matters.
- Keep the tab open until upload completes.

## If AI Returns Manual Review

Say:

The system did not find enough reliable pose evidence to create trustworthy draft findings. That is expected with some angles, lighting, distance, or water visibility. The coach can continue manually using the private video, Coach Draw, drills, and final report workflow.

Then test:

1. Continue manual review.
2. Add one manual finding.
3. Add one Coach Draw annotation.
4. Finalise and share the report.

## Manual Coach Studio Test

Use this even if AI returns findings, because Coach Studio is the coach-controlled analysis workflow.

1. Open the report and find the Coach Studio source video panel.
2. Set playback speed to 0.25x or 0.5x.
3. Use the 1 second and Step approx controls to find a key moment.
4. Choose Use timestamp for finding.
5. Select stroke phase and optional fault tag.
6. Add a coach-created observation, cue, drill, and next focus.
7. Save the finding.
8. Use Coach Draw on the same paused frame.
9. Attach the drawing to the coach-created finding or leave it as a report annotation.
10. Toggle Include in report for one safe annotation or marker.
11. Finalise the report and confirm the shared report shows selected coach-created content only.

Say:

Coach Studio means the product remains useful even when AI evidence is weak. The coach controls the final technical judgement.

## If Render Is Slow

1. Confirm the video upload completed.
2. Open AI Job Monitor if the user is owner/admin.
3. Check Render health: `https://swim-sight-ai-server.onrender.com/health`.
4. Use manual review if the AI job is slow or times out.
5. Do not imply the AI result is guaranteed to return during the live conversation.

## Shared Report Test

1. Create a shared report link after finalising.
2. Open it in a private/incognito window or on another device.
3. Confirm it shows:
   - swimmer name
   - coach summary
   - next focus
   - approved findings only
   - selected drills
   - selected coach-created annotations
   - AI-assisted coach-approved disclaimer
4. Confirm it does not show:
   - private video URL
   - signed URL
   - raw AI payload
   - rejected findings
   - pending findings
   - calibration feedback
   - notification logs

## Coach Feedback Questions

Ask:

1. Where did the workflow feel clear?
2. Where did you hesitate?
3. Would you trust the wording in the report?
4. Would the shared report make sense to a parent or swimmer?
5. Was Coach Draw easy enough on iPad?
6. Was the AI/manual-review distinction clear?
7. What would stop you using this after training?
8. What one thing would make the next pilot better?

## Record Notes

Use `/pilot-readiness` after the test and save:

- device used
- file size range
- flow tested
- what worked
- what was confusing
- bug description
- severity
- whether follow-up is okay
