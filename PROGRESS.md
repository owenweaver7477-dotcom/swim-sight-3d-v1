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
| 1 | **Phase 1.1a — coach-facing AI nav/icon/copy purge.** Sidebar "Analyse Video"→"New Review"; retired the `Brain` icon (contradicts coach-led) and `FlaskConical` (signals beta) across Sidebar, Dashboard, reviews list, review page, finding card, VideoLibrary; WorkflowStepper "AI Suggested"→"Video Review", "Coach Review"→"Coach Findings"; "Back to AI Review"→"Back to review"; "AI Review Queue"→"Review Queue"; "Configure AI Review"→"Start review". | Sidebar, TeamDashboard, AIReportsListPage, AIReportPage, AIFindingCard, VideoLibrary, WorkflowStepper, ReportNavActions, ClubSettings | lint OK · build OK · **18/18 guards** | `a634c97` |
| 2 | **Phase 1.1b/1.3 — remaining coach-visible + marketing AI copy.** Deleted the "V1 Coach Flow" label (brief Appendix B) and reworded its 3 helper steps without AI ("Coach approves / AI output is draft evidence" → "Review the clip / mark the moments that matter"); "AI Review is disabled until the private upload completes" → "Review opens once the private upload completes"; **public marketing** link labelled "Coach-approved AI" → "Trust & privacy"; feedback category "AI Trust" → "Review quality". AI strings remaining in `Analyse.jsx` are inside the `!AI_PILOT_LOCKED` branch (not rendered) and admin-only pages. | Analyse, PrivacyVideoReviewPage, FeedbackModal | lint OK · build OK · **18/18 guards** | `6be026c` |
| 3 | **Phase 3.1 + 2.4 — branded support email & person-name validation.** `SUPPORT_EMAIL` default gmail → `support@swimsight3d.com` (single env-overridable constant; **merge prerequisite flagged in-file**). New `src/lib/validation.js` (`isValidPersonName` / `personNameError`): names must be ≥2 chars and contain a letter — deliberately permissive about accents/apostrophes/non-Latin scripts so real names like "Ng" or "O'Brien" are never blocked. Wired into **both** the Add and Edit swimmer dialogs (previously only `.trim()`, so the swimmer named "o" was allowed) with an inline error + `aria-invalid`/`aria-describedby`. | supportConfig, validation (new), Swimmers | lint OK · build OK · **18/18 guards** | `851818b` |
| 4 | **Phase 4.2 — theme contrast guard (audit CRITICAL a11y).** The 16 club themes recolour `--primary`/`--accent`, which are used as **text/icons** (`text-primary`), not just fills — the audit's finding that a contrast failure was "baked into a user setting". Added `ensureTextContrast()` (+ `hslTripletToHex`, `isContrastAdjusted`) which nudges only *lightness*, preserving hue/saturation, until the colour clears **AA 4.5:1** against the current surface. Fills/rings keep the vivid original. Re-runs on theme toggle (surface changes). **Measured:** 14/16 presets already passed and are untouched; Sky 4.10→4.51 and Sunset 3.56→4.53. Custom colours proven safe both ways: `#ffe600` 1.27→4.53 in light, left vivid (13.31) in dark. | clubTheme, AppLayout | lint OK · build OK · **18/18 guards** · numeric contrast test both themes | `36f9d01` |
| 5 | **Phase 4.7 — accessible names on the collapsed icon rail.** The desktop sidebar collapses to icons, so labels are clipped; audit §7 flagged "icon-only collapsed sidebar has no visible text alternative/tooltip". Added `title` (hover tooltip), `aria-label` (name for assistive tech while the text is clipped) and `aria-current="page"` on the active item; decorative icons marked `aria-hidden`. | Sidebar | lint OK · build OK · **18/18 guards** (broken-build commit 8618187 fixed in the follow-up) | `8618187` |
| 6 | **Phase 3.3 / 5.6 — drill library differentiation (audit A8, CRITICAL "reads as seed data").** *Diagnosis first:* the audit blamed the drill **data**, but the bundled defaults are already rich — **107 drills, 8 categories, 34 distinct doses**. The real defect was in the **rendering**: `categoryTag()` collapsed Freestyle/Backstroke/Breaststroke/Butterfly to one "Technique" badge, `categoryText()` gave them one sky accent, and `CategoryIcon()` gave them all `Waves` — so the eye had nothing to lock onto. (The identical "4 × 25m easy technique" the audit saw comes from **9 uniform `shared_default` rows in the DB**, which are *added* to — not merged over — the good defaults.) Replaced with a `STROKE_STYLES` map: distinct icon + accent + chip per category (**8 distinct icons, was 4**), and the badge now shows **difficulty** (Beginner→Elite, real variation) instead of a constant. | DrillLibrary | `lint && build` OK · **18/18 guards** · data-level distinctness verified | `1eab89c` |
| 7 | **Phase 3.1b — "Powered by" as a per-tier setting (audit S5).** Added `showsReportAttribution(planKey)` derived from the **existing `clubs.plan_key`** — **no migration needed**. Free/pilot tiers keep the attribution; paid club tiers (Club Pro, AI Assist, Elite) get a report headed by the **club's own logo + name** instead. Applied to `PrintableReport` (the PDF that actually gets handed to parents — the audit's specific concern). **Escalated, not done:** the shared-link page's attribution, because `api/shared-reports/[token].js` deliberately exposes only `club: { name }` and gating it would require changing that **protected** endpoint's payload (a computed boolean, never `plan_key` — leaking a commercial tier to an anonymous viewer would be wrong). Needs owner approval. | featureGates, PrintableReport | `lint && build` OK · **18/18 guards** incl. public-report-safety | _next_ |
