# Swim Sight 3D Sunday Club Test Script

Use this for a controlled 20-30 minute coach test. The goal is to show a stable coach workflow, not to prove every future feature.

## Owen's Bring List

- iPad with Safari and enough battery.
- Laptop as backup/admin view.
- One 5-10 second swimming clip where the swimmer is clearly visible.
- One coach login ready.
- One swimmer profile ready, or details ready to enter.
- One fallback manual finding ready, for example: "Head lifts during breath, hips drop, cue: breathe low and return eyes down."
- One drill you can recommend from the Drill Library.
- One share-link test plan: open the report on another device or private browser.
- Safari Add to Home Screen ready to demonstrate PWA install.

## 2-Minute Intro Script

"Swim Sight 3D is a coach-reviewed swim analysis platform. A coach uploads a short clip, uses AI-assisted evidence where the video is strong enough, reviews every finding manually, adds coach notes and drawings, then shares a secure parent-ready report. If the AI evidence is weak, the system recommends manual review instead of inventing findings."

Say clearly:

- "AI-assisted, not automatic coaching."
- "Coach-reviewed before anything is shared."
- "Manual review is available whenever video evidence is not strong enough."
- "Shared reports contain approved content only."
- "SwimPro-exported footage is supported as a coach-uploaded file."

Do not claim:

- A formal SwimPro relationship or built-in camera connection.
- Exact drag measurement.
- Automatic diagnosis.
- Guaranteed biomechanics.
- Medical or clinical performance advice.
- Race prediction.

## iPad Install Steps

1. Open Safari.
2. Go to `https://swim-sight-3d-v1.vercel.app`.
3. Tap Share.
4. Tap Add to Home Screen.
5. Confirm the name is Swim Sight.
6. Open from the Home Screen icon.
7. Log in and confirm the app opens like a standalone coaching app.

## Test Account Checklist

- Email/password login works.
- The coach is in the correct club.
- The role is owner/admin/coach.
- If testing invite flow, open `/join?code=YOURCODE` while logged out and confirm the code is preserved through login/register.
- If Google auth is not enabled, use email/password.

## Test Video Checklist

- Use 5-10 seconds where the swimmer is visible.
- Side angle preferred.
- Avoid screen recordings if possible.
- Avoid heavily obstructed, tiny, or dark footage.
- Use footage the club has permission to upload and review.
- If using SwimPro footage, export the video first and upload the exported file manually.

## 10-Minute Demo Flow

1. Open the installed app from the iPad Home Screen.
2. Log in.
3. Confirm the club workspace and role.
4. Add or open one swimmer.
5. Assign a squad if available.
6. Open Analyse Video.
7. Select swimmer, stroke, camera angle, capture source, and review context.
8. Upload the short private clip.
9. Preview the video.
10. Send for AI Review.
11. Open AI Reviews.
12. Open the report.
13. Explain the reliability label.
14. Approve, edit, or reject any draft AI findings.
15. If AI does not return findings, add the fallback manual finding.
16. Pause the video and use Coach Draw to mark one frame.
17. Mark the annotation as Include in report.
18. Link a drill or technical focus if available.
19. Add coach summary and next focus.
20. Finalise the report.
21. Create/copy the secure shared report link.
22. Open the shared report on another device or private browser.

## Fallback If AI Does Not Return Findings

Say:

"This is the honest fallback. The app did not turn weak video evidence into fake AI findings. We can still complete a manual coach review, add verified observations, attach a drawing, and share a professional report."

Then:

1. Add a manual finding.
2. Add a coach cue and drill.
3. Add a Coach Draw annotation.
4. Finalise and share the report.

## What To Say About AI Accuracy

"AI evidence is treated as draft evidence. It can help the coach find things faster, but it must be checked against the video. If pose quality is weak, the workflow moves to manual review."

## Coach Feedback Questions

1. Could you understand what needed review today?
2. Was the upload flow clear on iPad?
3. Did the AI/manual-review language feel trustworthy?
4. Was Coach Draw easy enough with finger or stylus?
5. Would the shared report make sense to a parent or swimmer?
6. Which part felt slow, confusing, or unnecessary?
7. What would make you comfortable using this with a real squad next week?

## Post-Test Notes

- Coach name:
- Club/squad:
- Device:
- Video length/source:
- AI result: reliable / partial / manual review / failed
- Best moment:
- Biggest confusion:
- Must-fix before next test:
- Nice-to-have later:

## Pass Criteria

- Login works.
- Invite code join works if tested.
- Swimmer and squad workflow works.
- Private video upload works.
- AI Review creates either a report or an honest manual-review state.
- No fake findings appear on weak pose.
- Coach approval is required.
- Coach Draw can save at least one marked frame.
- Final/shared report shows approved findings and selected annotations only.
- Shared report excludes private video URLs and paths.
- iPad Home Screen install opens like an app.
