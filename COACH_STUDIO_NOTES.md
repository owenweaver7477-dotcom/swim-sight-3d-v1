# Swim Sight 3D Coach Studio Notes

Coach Studio is the coach-controlled analysis workspace inside an AI Review report. It is not a failure mode. It is the primary manual video analysis path when a coach wants to work directly from the footage or when AI evidence is not strong enough.

## What Coach Studio Does

- Opens the private uploaded video through a short-lived signed preview.
- Provides **Open Fullscreen Review** for a cleaner pool-deck workflow.
- Lets the coach slow playback to 0.25x, 0.5x, 0.75x, or 1x.
- Provides 1 second jump controls and approximate frame-step controls.
- Shows timestamp and **Approx frame** while the coach plays, pauses, seeks, or steps.
- Captures the current timestamp for a coach-created finding.
- Saves key stamps with a label, approximate frame context, note, and optional report inclusion.
- Opens Coach Draw for Apple Pencil, stylus, finger, or mouse annotation.
- Attaches saved annotations to findings when useful.
- Sends only selected coach-created annotations to final/shared reports.

## Manual Analysis Flow

1. Open an uploaded video or an AI Review report.
2. Use the guided steps: **Video Review**, **Key Stamps**, **Coach Draw**, **Findings + Drills**, **Summary**, then **Finalise + Share**.
3. Open **Fullscreen Review** when working from the video.
4. Slow the video, jump by 1 second, or use **Step approx** to find the key moment.
5. Save a key stamp or choose **Finding from moment**.
6. Select stroke phase, optional fault tag, severity, observation, cue, drill, and next focus.
7. Save the coach-created finding.
8. Use Coach Draw to mark the frame if a visual cue would help.
9. Toggle **Include in report** only for annotations that are safe and useful for the swimmer/parent.
10. Finalise and share the report through the normal coach approval workflow.

## Fullscreen Review

Fullscreen Review is designed for iPad and pool-deck use. It is a fullscreen-style overlay, not a separate public video page.

Use it to:

- play the private video large on screen
- switch between 0.25x, 0.5x, 0.75x, and 1x speed
- jump back/forward 1 second
- step approximately one frame at a time
- save a key stamp
- open Coach Draw from the current moment
- create a coach finding from the current moment

Frame stepping is approximate because browser video playback does not guarantee certified frame-accurate stepping. Always verify the moment visually.

## When AI Recommends Manual Review

If the AI cannot find enough reliable pose evidence, continue in Coach Studio. Do not invent AI findings. Add only what the coach can verify from the video.

Recommended wording:

> The AI did not find enough reliable pose evidence in this clip, so we are using coach-led video review. The final report still contains coach-approved observations only.

## iPad and Stylus Tips

- Use Safari or the installed PWA on iPad.
- Keep the iPad in landscape for Coach Draw when possible.
- Pause the video before drawing.
- Use Apple Pencil or stylus for cleaner lines.
- If browser frame stepping is not exact, use the **Step approx** buttons and verify visually.

## Public Report Safety

Shared reports can include:

- approved coach findings
- coach summary and next focus
- selected drills
- selected coach-created annotations
- selected key-frame markers

Shared reports must not include:

- private video URLs
- signed preview URLs
- storage paths
- rejected or pending findings
- raw AI payloads
- calibration feedback
- private coach notes
