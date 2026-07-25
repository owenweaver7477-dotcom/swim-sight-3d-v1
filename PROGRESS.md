# Launch Hardening — Progress Log

**Branch:** `feat/launch-hardening` (never committed to `main`)
**Brief:** Autonomous Build Brief — turn the Meridian design audit into a production-ready,
fully-manual coach video-review product.
**Started:** 2026-07-25

---

## Environment / commands (verified)

| Purpose | Command |
|---|---|
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Guard battery | 18 × `npm run test:<name>` (see CLAUDE.md §13) |

**Test infrastructure gap (logged, not silently skipped):** the repo has **no Playwright,
no vitest/jest, and no axe** tooling. The brief's Phase 9 gates (e2e, automated axe, visual
regression, Lighthouse CI) therefore require building test infrastructure from zero — that is
a substantial workstream in itself. Recorded in the deferred list; existing verification is
lint + build + the 18-script guard battery, which is run after every unit of work.

---

## ⚠️ DECISION ESCALATED — AI backend deletion NOT performed autonomously

The brief (Phase 1.1) says: *"Delete dead AI code paths, API routes, jobs… remove AI-related
env vars and dependencies."*

**I have deliberately NOT deleted the AI backend.** Reasons, all verifiable in-repo:

1. **It is a protected system.** `CLAUDE.md` §6 lists "AI trigger → callback" as protected and
   §7 forbids changing it without an explicit `APPROVE:` from Owen. The brief cannot override
   the repo's own safety contract; only Owen can.
2. **AI is *locked, not absent*.** `src/lib/aiPilotLock.js` gates everything behind
   `VITE_ENABLE_AI_REVIEW` (default off). It is already invisible to coaches — the *perceived*
   product is already 100% manual.
3. **It would break 6 guard scripts** (`test:ai-processing-reliability`, `ai-output-selection`,
   `ai-metadata-callback`, `pose-2d-callback`, `pose-3d-callback`, `analysis-jobs`) which exist
   to protect worker-callback integrity.
4. **It would orphan a separate repository** — the Render worker `swim-sight-ai-server` — plus
   DB tables/migrations, which this repo cannot safely clean up.
5. **It is irreversible-ish and unnecessary for the goal.** Purging *user-facing* AI achieves
   100% of the visible objective ("zero AI references a user can see"); deleting the backend
   adds no user-visible benefit and can be done any time later, deliberately.

**What I did instead:** purge every **user-facing** AI reference (copy, labels, nav, marketing,
metadata) so the product reads as fully manual — the brief's actual acceptance criterion — and
left the dormant, flag-locked backend untouched.

**→ Needs Owen:** if you *do* want the AI backend physically deleted (worker repo, API routes,
DB tables, guards), reply `APPROVE: delete AI backend` and it becomes a clean, dedicated task.

---

## Task log

| # | Task | Files | Verification | Commit |
|---|---|---|---|---|
| 1 | **Phase 1.1a — coach-facing AI nav/icon/copy purge.** Sidebar "Analyse Video"→"New Review"; retired the `Brain` icon (contradicts coach-led) and `FlaskConical` (signals beta) across Sidebar, Dashboard, reviews list, review page, finding card, VideoLibrary; WorkflowStepper "AI Suggested"→"Video Review", "Coach Review"→"Coach Findings"; "Back to AI Review"→"Back to review"; "AI Review Queue"→"Review Queue"; "Configure AI Review"→"Start review". | Sidebar, TeamDashboard, AIReportsListPage, AIReportPage, AIFindingCard, VideoLibrary, WorkflowStepper, ReportNavActions, ClubSettings | lint OK · build OK · **18/18 guards** | `4bf3442` |
