
# CoachSight Core Master Plan for Claude Code

## Purpose of this document

This document is the long-term operating plan for Swim Sight 3D and CoachSight Core. It is designed to be placed inside the Swim Sight codebase so Claude Code can understand the full intention of the app, the future direction, the product philosophy, the AI server direction, the UI/UX standard, the safety rules, and the role of the internal assistant.

Claude Code should use this document as long-term product context. It must not treat Swim Sight as a generic app. Swim Sight is intended to become a serious swimming analysis platform for coaches, clubs, swimmers, and parents.

The app should feel simple to use, but advanced underneath. The surface experience should be clean and coach-friendly. The deeper system should support video upload, AI analysis, coach review, professional reporting, progress tracking, and future 3D biomechanics tools.

## Recommended file structure

Do not put this whole document only into CLAUDE.md. Claude Code should have a short CLAUDE.md for operating rules, then long-form context documents under /docs.

Recommended structure:

```text
/swim-sight-3d
  CLAUDE.md
  /docs
    PRODUCT_BRAIN.md
    FUTURE_APP_VISION.md
    AI_SERVER_ROADMAP.md
    UI_UX_STANDARD.md
    PILOT_READINESS_PLAN.md
    CHANGE_RULES.md
    COACHSIGHT_CORE_ASSISTANT_PLAN.md
    GMAIL_FEEDBACK_WORKFLOW.md
    WEEKLY_OPERATIONS_REVIEW.md
```

If there is a separate AI worker repo, it should also receive a smaller CLAUDE.md and a copy or summary of AI_SERVER_ROADMAP.md.



## 1. Product identity and core intention

Swim Sight 3D is a coach-first swimming analysis platform. Its purpose is to make high-quality technical feedback easier, faster, safer, and more professional for swimming coaches and clubs.

The long-term product should not become a random fitness app, generic video editor, or flashy AI toy. It should become a trusted swimming performance tool that helps coaches communicate technique clearly.

The app should serve four user groups:

1. Coaches: need a fast, reliable, private workflow for reviewing swimmer videos and creating reports.
2. Swimmers: need simple, understandable feedback with clear next-focus cues.
3. Parents: need professional reports that make coaching value visible.
4. Clubs: need organisation, progress tracking, repeatable analysis, and coach/team workflow.

The core promise is:

Swim Sight turns swim footage into structured technical feedback, coach-approved reports, and long-term progress insight.

The future version should feel like a performance department in a browser: simple enough for a club coach, but powerful enough to support biomechanics-level analysis later.

Key principles:

- Coaches stay in control.
- AI assists; it does not replace the coach.
- Swimmer video privacy is non-negotiable.
- Reports must look professional enough to send to parents, swimmers, clubs, and performance staff.
- The app should work before it becomes complex.
- The pilot experience matters more than building every future feature immediately.

## 2. Product north star

The north star is a complete coach workflow:

```text
Coach logs in
  -> chooses club/workspace
  -> creates or selects swimmer
  -> uploads video privately
  -> triggers AI-assisted analysis
  -> reviews video and AI findings
  -> approves or edits findings
  -> generates a professional report
  -> shares report securely
  -> tracks swimmer progress over time
```

Everything built should support this workflow. If a feature does not improve this workflow, it should be delayed.

The first great version of Swim Sight is not the most advanced version. The first great version is the version that a real coach can use from start to finish without confusion.

A real pilot coach should be able to say:

- I know where to upload a swimmer video.
- I know when the AI has finished.
- I can review the findings.
- I can approve, edit, or reject the findings.
- I can generate a report I am proud to send.
- I trust that videos and reports are private.
- I can see how this saves me time.

Future features must not damage the basic flow.

## 3. The app should look and feel like this

Swim Sight should look like a premium sport-tech platform, not a generic SaaS template.

Visual direction:

- Dark, clean, professional, water/sport-tech inspired.
- Strong contrast, clear hierarchy, minimal clutter.
- Calm, controlled, serious, and performance-focused.
- Avoid childish graphics, random gradients, fake analytics, or unnecessary animation.
- Use animation sparingly to make the product feel alive, not distracting.
- Public pages should build trust quickly.
- Logged-in pages should make the next action obvious.

The UI should be simple on the surface, with deeper features available only when needed.

Public website goals:

- Explain what Swim Sight does in one screen.
- Show the upload -> analysis -> coach report workflow.
- Make coaches feel this is credible and serious.
- Include pilot/early access call-to-action.
- Avoid overpromising full biomechanics if the system is not there yet.

Logged-in app goals:

- Dashboard should show next actions, not overwhelming charts.
- Upload flow should be clean and guided.
- Reports should be the most polished part of the app.
- Coach approval screens should feel safe and professional.
- Deep biomechanical tools should be optional/advanced.

The app should not become a huge dashboard full of meaningless graphs. Every chart must answer a coach question.

## 4. The simple-to-advanced product model

Swim Sight should have two levels of experience:

Level 1: Simple coach workflow

This is what most users see first:

- Upload video
- Add swimmer/stroke/event details
- Review AI suggestions
- Approve coach findings
- Generate report
- Share report

Level 2: Advanced analysis mode

This is optional and should not clutter the main app:

- Stroke phase breakdown
- Technical scores over time
- Side-by-side video review
- Key frame markers
- 2D pose overlays
- Estimated 3D pose review
- Reference model comparison
- Angle/velocity/timing estimates
- Club trend reports

The default user should not be forced into advanced mode. The advanced mode is for coaches who want deeper biomechanical insight.

Claude Code must preserve this product philosophy:

Simple first. Advanced when requested. Never overwhelm the coach.

## 5. Pilot readiness definition

Before adding large future systems, Swim Sight must become pilot-ready.

Pilot-ready means:

1. A coach can sign in successfully.
2. The coach can access a private workspace.
3. The coach can add/select a swimmer.
4. The coach can upload a private video.
5. The app can create a signed URL or safe video access method.
6. The AI worker can receive the analysis job.
7. The worker can return a safe callback summary.
8. The app can display AI-suggested findings.
9. The coach can approve/edit/reject findings.
10. The app can generate a professional report.
11. The report can be shared through a secure link.
12. Public shared reports do not expose private storage, private videos, or signed URLs unnecessarily.
13. The app clearly explains that AI suggestions require coach approval.
14. The full flow can be demonstrated without developer intervention.

The pilot version does not need every future feature. It needs reliability, clarity, safety, and trust.

Pilot success metrics:

- Coach completes upload -> report without help.
- Coach understands AI is assistant-only.
- Coach would send the report to a swimmer/parent.
- No private video/report leakage.
- Feedback clearly identifies next build priorities.

## 6. Current known protected features

Claude Code must assume that several important systems already exist and must be protected. It must not rebuild these from scratch unless Owen explicitly approves.

Protected app-side concepts:

- Private video upload.
- Signed video URL handling.
- AI analysis trigger.
- AI callback route/handler.
- Coach approval UI.
- AI finding cards.
- Approved coach report flow.
- Public share link flow.
- PDF/printable report export.
- Role/security checks.
- Pilot checklist/readiness controls.
- Report safety language.

Protected worker-side concepts:

- Storage access adapter.
- Signed URL fallback.
- Payload support for storage provider and video key.
- Safe callback summary.
- Private 2D/3D pose foundation.
- Signed URL/private key redaction in logs.
- Missing video-source rejection.
- Storage provider labels and future adapter support.

Claude Code should inspect the actual repo before assuming details, but it must treat these as important protected flows.

## 7. AI role and language standard

Swim Sight must avoid pretending that AI is perfect or medically diagnostic.

Correct language:

- AI-suggested finding.
- Coach review required.
- Estimated pose data.
- Technical cue suggestion.
- Video-based analysis estimate.
- Requires coach approval.
- Supports coaching workflow.

Avoid language like:

- Diagnosed.
- Proven.
- Guaranteed.
- Perfect analysis.
- Medical cause.
- Injury diagnosis.
- Automatic coaching truth.

AI should support the coach by identifying possible technical patterns. Final coaching authority remains with the coach.

Reports should always make this clear:

AI-generated findings are suggestions only and should be reviewed, edited, and approved by a qualified coach before being shared or acted upon.

## 8. Report quality standard

The report is one of Swim Sight's most important business assets. A report is what a coach, parent, or swimmer will judge the product by.

Reports should be:

- Clean.
- Professional.
- Coach-approved.
- Easy to understand.
- Specific to the swimmer and stroke.
- Clear about next focus.
- Safe in AI wording.
- Suitable for PDF/export/printing.

A good report should include:

- Swimmer name.
- Stroke.
- Date.
- Video reference.
- Coach name/club if available.
- Summary of key technical observations.
- Phase-specific findings.
- Severity/priority.
- Coaching cue.
- Drill or correction task.
- Next-focus section.
- AI-support disclaimer.
- Optional progress comparison if enough past reports exist.

Report design should feel like a real performance analysis document, not a casual chatbot answer.

Claude Code should prioritise report improvement before flashy features if the report is weak.

## 9. AI server long-term vision

The AI server should eventually become a robust video analysis engine. It should not be a fragile script that only works for one demo video.

Long-term AI server capabilities:

1. Receive secure analysis jobs from the app.
2. Validate job payloads.
3. Access private videos safely.
4. Redact secrets and signed URLs from logs.
5. Extract video metadata.
6. Run frame sampling.
7. Detect swimmer/body landmarks where possible.
8. Generate 2D pose artifacts.
9. Estimate 3D pose where supported.
10. Segment stroke phases.
11. Detect technical fault patterns.
12. Score confidence and quality.
13. Return safe summaries to the app.
14. Store private artifacts securely.
15. Support future model upgrades.

The AI server should be modular. Do not build everything into one giant file.

Recommended modules:

```text
app/video_storage.py
app/video_probe.py
app/frame_sampler.py
app/pose_2d_detector.py
app/pose_3d_lifter.py
app/stroke_phase_detector.py
app/fault_detector.py
app/report_summariser.py
app/callback_client.py
app/security/redaction.py
app/config.py
```

Each module should be testable.

The server should fail safely. If pose detection fails, it should return a clear analysis status rather than crashing or pretending the analysis is accurate.

## 10. AI analysis maturity ladder

The AI system should progress through maturity stages.

Stage 1: Job handling and safe callback

- App triggers analysis.
- Worker receives payload.
- Worker validates video access.
- Worker returns safe status and placeholder/summary.

Stage 2: Video metadata and frame extraction

- Worker reads video duration, FPS, resolution, frame count.
- Worker extracts frames or key frames.
- Worker stores/returns safe metadata.

Stage 3: 2D pose foundation

- Worker runs 2D pose detection where possible.
- Stores private 2D pose artifact.
- Reports confidence and failure cases.

Stage 4: Stroke phase tagging

- Worker estimates phases such as catch, press, recovery, kick setup, foot turn, finish, streamline.
- Coach can edit/confirm phases.

Stage 5: AI-suggested fault detection

- Worker suggests technical findings with confidence.
- Examples: head lift, dropped hips, wide knees, early foot turn, rushed recovery, poor streamline.
- Coach must approve.

Stage 6: Estimated 3D pose lifting

- Worker estimates 3D structure from available video.
- Output must be labelled estimated, not exact.

Stage 7: Multi-angle analysis

- Supports side + front/aerial pairing.
- Improves accuracy with synchronised footage.

Stage 8: Reference comparison

- Compare swimmer pattern to a reference movement model.
- Provide coach-friendly differences.

Stage 9: Long-term progress analytics

- Track technical scores over multiple reports.
- Club trends.
- Repeated fault patterns.

Claude Code should not jump to Stage 9 before Stages 1-5 are reliable.

## 11. Data, privacy, and security rules

Security is central to Swim Sight because the app may contain videos of minors, private coaching feedback, club data, and customer information.

Non-negotiable security rules:

- Private videos must not be public by default.
- Signed URLs must expire.
- Signed URLs should not be exposed in public reports unless explicitly designed and safe.
- AI callbacks must validate secrets.
- User roles must be enforced.
- Club/workspace data must remain separated.
- Public share links must only show approved content.
- Logs must not expose secrets, signed URLs, keys, private file paths, or private video URLs.
- Database writes must be deliberate and tested.
- Deletion must require explicit approval and ideally soft-delete first.

Claude Code must never read or expose .env files, API keys, database secrets, service role keys, private tokens, or production credentials.

Suggested deny rules in .claude/settings.json:

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(**/.env)",
      "Read(**/.env.*)",
      "Read(**/*secret*)",
      "Read(**/*key*)",
      "Read(**/node_modules/**)",
      "Read(**/.git/**)",
      "Bash(rm -rf *)",
      "Bash(git push*)",
      "Bash(vercel --prod*)",
      "Bash(npm publish*)"
    ]
  }
}
```

## 12. CoachSight Core assistant concept

CoachSight Core is the internal AI assistant for Swim Sight 3D. It is not the customer-facing app. It is not a random public Jarvis clone. It is Owen's internal command centre and product brain.

CoachSight Core should help Owen talk to the Swim Sight business and app from his laptop.

It should be able to answer:

- What is wrong with the app right now?
- What should be fixed before the pilot?
- What are coaches asking for?
- What is the safest next build?
- Which files need changing?
- What could break?
- What should be tested?
- What should I do this week?
- What emails need replies?
- What feedback should become product tasks?

CoachSight Core should operate in four modes:

1. Diagnosis mode: inspect app/product/business and identify the biggest problems.
2. Build mode: plan and make approved code changes.
3. Feedback mode: summarise Gmail/user/coach feedback and convert it into product tasks.
4. Operations mode: help with weekly business priorities, leads, pilot tracking, and documentation.

CoachSight Core should be powerful, but not autonomous in dangerous areas. Owen remains final decision-maker.

## 13. Is CoachSight Core separate from the app?

Initial answer: no separate full app yet.

For the first version, CoachSight Core should live as Claude Code project context inside the Swim Sight repos.

Recommended first setup:

```text
/swim-sight-3d
  CLAUDE.md
  /.claude/settings.json
  /docs/PRODUCT_BRAIN.md
  /docs/FUTURE_APP_VISION.md
  /docs/AI_SERVER_ROADMAP.md
  /docs/CHANGE_RULES.md
  /docs/COACHSIGHT_CORE_ASSISTANT_PLAN.md
```

The assistant is then used by running Claude Code from the terminal inside the repo:

```bash
cd "/Users/owen_weaver/Documents/Swim Sight 3D"
claude
```

Later, once the system is mature, CoachSight Core could become a separate internal operations app or dashboard. That later version could connect to Gmail, GitHub, Vercel, Supabase, Stripe, feedback forms, and analytics.

But do not start with a separate big assistant app. Start with Claude Code + docs + safety rules. That is the fastest and safest route.

Future separate assistant architecture:

```text
coach-sight-core/
  internal dashboard
  feedback inbox
  product task generator
  weekly operations report
  app health monitor
  deployment status monitor
  read-only analytics
```

This should only happen after Swim Sight's core pilot flow is reliable.

## 14. Claude Code change protocol

Claude Code must follow a strict change protocol every time.

Standard protocol:

1. Inspect before editing.
2. State the problem clearly.
3. List files involved.
4. State risk level.
5. Explain intended changes.
6. Wait for approval when risk is medium/high.
7. Make the smallest safe change.
8. Run tests/build/lint where available.
9. Summarise exactly what changed.
10. Explain how Owen should test it manually.
11. Do not deploy unless Owen explicitly asks.

Risk levels:

Low risk:

- Copy changes.
- Small UI spacing fixes.
- New docs.
- Non-functional text updates.

Medium risk:

- Component logic changes.
- Upload/report/dashboard flow changes.
- API route changes.
- Role-based UI changes.

High risk:

- Auth.
- Database schema.
- Storage permissions.
- AI callback handling.
- Public share-link permissions.
- Production environment variables.
- Payment/Stripe.
- Email sending.
- Deployment.

High-risk changes require explicit approval and rollback plan.

## 15. Business operating plan

Swim Sight should be built toward a real pilot and business, not just features.

Business priorities before pilot:

1. Clear public explanation of what the app does.
2. A clean coach demo flow.
3. Professional report example.
4. Secure upload/report flow.
5. Simple pricing hypothesis.
6. Pilot checklist.
7. Feedback collection form.
8. Manual support process for first users.

Do not overbuild Stripe, subscriptions, complex club billing, or advanced dashboards before the pilot proves coach value.

Potential business model after pilot:

- Free pilot for selected coaches/clubs.
- Paid coach account.
- Club workspace plan.
- Report pack or monthly plan.
- Premium AI/3D analysis tier later.
- Custom club onboarding/service fee later.

CoachSight Core should help Owen decide what is worth building now vs later.

Decision buckets:

- Build now: helps pilot, trust, upload, reports, basic feedback.
- Prepare soon: pricing, onboarding docs, simple analytics, better report examples.
- Do later: full subscriptions, deep club analytics, advanced 3D, multi-camera workflows.
- Avoid now: flashy features that do not improve pilot success.

## 16. Gmail and feedback workflow

Gmail should be connected carefully later, not on night one unless everything else is stable.

Gmail rules:

- Read/search Swim Sight related emails.
- Summarise feedback.
- Categorise issues.
- Draft replies only.
- Never send automatically.
- Never delete, archive, forward, or label without approval.

Feedback categories:

- Bug.
- Confusing UX.
- Missing feature.
- Report quality issue.
- AI analysis issue.
- Pricing question.
- Pilot interest.
- Coach request.
- Urgent reply needed.
- Sales opportunity.

Feedback should become product tasks using this format:

```text
Feedback pattern:
Evidence:
Product implication:
Suggested action:
Priority:
Risk:
Build before or after pilot:
```

CoachSight Core should not blindly implement every email request. It should judge requests by coach value, pilot impact, technical risk, and business impact.

## 17. Weekly operations review

CoachSight Core should eventually run a weekly review for Owen.

Weekly review prompt:

```text
CoachSight Core, run my weekly Swim Sight operations review.

Check the current app state, recent feedback, business priorities, and pilot readiness.

Give me:
1. Biggest app risk
2. Biggest business opportunity
3. Most important coach feedback pattern
4. Best next build task
5. Best sales/outreach task
6. What not to touch this week
7. What should be tested
8. What should be documented
9. One clear priority for the next 48 hours
```

Weekly output should be practical, not motivational.

It should separate:

- App build priority.
- Business/sales priority.
- Feedback priority.
- Documentation priority.
- Do-not-touch warning.

## 18. Roadmap phases

Recommended roadmap:

Phase A: Claude transition and safety foundation

- Pay for Claude plan.
- Install Claude Code.
- Commit current repo state.
- Add CLAUDE.md.
- Add .claude/settings.json.
- Add product brain docs.
- Run first diagnosis without editing.

Phase B: Pilot flow hardening

- Verify login/workspace/upload/AI/report/share flow.
- Improve confusing screens.
- Strengthen report quality.
- Add clearer empty states.
- Ensure public share safety.
- Confirm build/test process.

Phase C: Feedback loop

- Create feedback form.
- Connect Gmail read/draft workflow.
- Convert feedback into product tasks.
- Track pilot issues.

Phase D: AI server reliability

- Improve job validation.
- Improve video metadata/probe handling.
- Improve pose artifact handling.
- Improve callback summaries.
- Add failure states and confidence scoring.
- Add tests.

Phase E: Advanced coach tools

- Phase tagging.
- Better fault taxonomy.
- Stroke-specific templates.
- Progress tracking.
- Report comparisons.

Phase F: 3D/reference tools

- Estimated 3D pose viewer.
- Reference comparison.
- Multi-angle support.
- Model factory integration.
- Advanced biomechanics mode.

Phase G: Commercial scale

- Pricing.
- Stripe.
- Club plans.
- Onboarding flows.
- Analytics.
- Support workflows.
- Admin dashboard.

Do not skip straight to Phase F or G before Phase B is solid.

## 19. What Claude Code should do first

First command after setup:

```text
You are CoachSight Core, Swim Sight 3D's AI product brain.

Do not edit files yet.

Read CLAUDE.md and the docs folder. Then inspect the repository and run a full app diagnosis.

Focus on:
1. pilot readiness
2. app structure
3. protected flows
4. report quality
5. upload and AI analysis flow
6. coach approval flow
7. public and logged-in UI clarity
8. security risks
9. what should be built next

Return:
- biggest current problem
- what is working
- what is fragile
- what not to touch
- exact files to inspect/change first
- safest next implementation plan
- test plan
```

Second command:

```text
Choose the single safest highest-impact improvement.
Before editing, show me:
1. exact files
2. why each file needs changing
3. risk level
4. test plan
5. rollback plan
Wait for approval before editing.
```

Third command after approval:

```text
Make the approved small change only. Do not expand scope. After editing, run the safest available test/build command and summarise the result.
```

## 20. Definition of a great Swim Sight device/platform

The user's wording is that this should become a great device. In practical product terms, Swim Sight should become a complete analysis system, not just a website.

A great Swim Sight platform should eventually include:

- A clean coach app.
- Secure video handling.
- Reliable AI worker.
- Professional reports.
- Optional 3D reference tools.
- Long-term swimmer progress tracking.
- Club-level insight.
- Coach-controlled AI suggestions.
- A business operations brain through CoachSight Core.

The app should feel like this:

- Upload is effortless.
- AI processing is understandable.
- Coach approval is clear.
- Reports look professional.
- Data is private.
- The system gives better insight over time.
- The coach feels helped, not replaced.

The future hardware/device direction could eventually include camera setup guides, multi-angle capture, calibration support, and poolside workflow. But this should not be overbuilt before the app and AI workflow are reliable.

## 21. Final operating rule for Claude Code

Claude Code must always remember:

Swim Sight 3D is not just a coding project. It is a swimming performance product and future business.

The goal is not to add as many features as possible. The goal is to build the most trusted, useful, and coach-friendly swim analysis workflow possible.

Every change should be judged by:

- Does it help a coach?
- Does it improve pilot readiness?
- Does it make reports better?
- Does it protect privacy?
- Does it make the app easier to understand?
- Does it reduce or increase technical risk?
- Does it move toward the long-term vision without breaking the present app?

CoachSight Core is the assistant. Owen is the final decision-maker.
