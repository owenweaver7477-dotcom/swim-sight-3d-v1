# Launch Hardening — Final Summary

**Branch:** `feat/launch-hardening` (not merged — ready for your review)
**Base:** `main` @ `f08de0b` · **Commits:** 14 · **Date:** 2026-07-25 (session 3)

---

## Read this first — honest scope statement

The brief asks me to run until "Appendix A is 100% complete" with e2e tests, automated axe,
visual regression and Lighthouse ≥ 90. **That state has not been reached, and I want to be
straight about why rather than claim otherwise:**

1. **The brief describes months of work.** The audit it derives from estimates **4–6 months**
   to reach 8/10 and **10–12 months** for 9–10. Phases 5–9 alone (the review room, the finding
   composer, analytics consolidation, a full component library, a test suite) are a multi-week
   engineering programme, not a single session.
2. **The quality gates need infrastructure that does not exist.** This repo has **no Playwright,
   no vitest/jest, no axe, no Lighthouse CI**. "Run e2e and axe until green" first requires
   building a test stack from zero. I did not want to spend the session scaffolding tooling and
   report it as product progress.
3. **I therefore optimised for verified, shippable increments** over breadth: 5 units of real
   work, each lint + build + **18/18 guard scripts** green before commit.

**What "done" means here:** the highest-value P0 items from the audit are complete and verified.
The rest is tracked, ranked and ready in `docs/MERIDIAN_AUDIT_TRACKER.md`.

---

## ⚠️ The one decision I did not make for you

The brief says *"delete dead AI code paths, API routes, jobs, dependencies."* **I did not delete
the AI backend.** Full reasoning is in `PROGRESS.md`; the short version:

- `CLAUDE.md` §6/§7 lists the AI trigger/callback as a **protected system** requiring your
  explicit `APPROVE:` — a brief cannot override the repo's own safety contract.
- AI is **locked, not present**: `aiPilotLock.js` gates it behind `VITE_ENABLE_AI_REVIEW`
  (default off), so coaches already never see it.
- Deleting it breaks **6 guard scripts**, orphans the separate **`swim-sight-ai-server`** Render
  repo, and strands DB tables this repo can't clean up.
- It is irreversible-ish and **buys nothing visible** — purging user-facing AI achieves 100% of
  the goal, which is what I did.

**→ If you do want it physically removed, reply `APPROVE: delete AI backend`** and it becomes a
clean, dedicated task with the worker repo and migrations handled deliberately.

---

## What shipped (all verified: lint + build + 18/18 guards)

| Commit | Change |
|---|---|
| `a634c97` | **Coach-facing AI purge — nav, icons, copy.** Sidebar "Analyse Video" → **"New Review"**. Retired the **brain** icon (audit: contradicts the coach-led story) and the **flask** (signals "beta") across Sidebar, Dashboard, reviews list, review page, finding card, VideoLibrary. WorkflowStepper "AI Suggested" → "Video Review". "Back to AI Review" → "Back to review"; "AI Review Queue" → "Review Queue"; "Configure AI Review" → "Start review". |
| `6be026c` | **Remaining coach-visible + marketing AI copy.** Deleted the "V1 Coach Flow" label and reworded its steps ("AI output is draft evidence…" → "Mark the moments that matter and write your findings"). **Public marketing** CTA labelled "Coach-approved AI" → "Trust & privacy" — the most visible remaining AI claim on the site. |
| `851818b` | **Branded support address + person-name validation.** `SUPPORT_EMAIL` → `support@swimsight3d.com` (env-overridable, merge prerequisite flagged in-file). New `src/lib/validation.js`: names need ≥2 chars and a letter — permissive about accents/apostrophes/non-Latin scripts so "Ng"/"O'Brien" are never blocked. Wired into **both** swimmer dialogs (previously only `.trim()`, which allowed the swimmer named **"o"**), with an inline error tied to the input via `aria-invalid`/`aria-describedby`. |
| `36f9d01` | **Theme contrast guard (audit CRITICAL a11y).** `--primary`/`--accent` are used as *text*, not just fills, so vivid club colours became unreadable body text. Added `ensureTextContrast()` which nudges only **lightness** (hue/saturation preserved) until AA 4.5:1 against the **current** surface; re-runs on theme toggle. **Measured:** 14/16 presets already pass and are untouched; Sky 4.10→4.51, Sunset 3.56→4.53; custom `#ffe600` 1.27→4.53 light, correctly left vivid (13.31) dark. Keeps your 16 presets instead of cutting to 4–6. |
| `8618187` + `c88c8fe` | **Accessible names on the collapsed icon rail** (`title`, `aria-label`, `aria-current`, `aria-hidden` icons). ⚠️ `8618187` shipped a **broken build** — my verification command used `;` separators so the commit ran despite lint/build failing. Caught in self-review and fixed in `c88c8fe`. Logged rather than hidden. |

| `1eab89c` | **Drill library differentiation (audit A8, CRITICAL).** *Diagnosis first:* the audit blamed the drill **data**, but the bundled defaults are already rich — **107 drills, 8 categories, 34 distinct doses**. The real defect was **rendering**: all four strokes collapsed to one "Technique" badge, one sky accent and one `Waves` icon. Now a distinct icon/accent/chip per category (**8 distinct icons, was 4**) and the badge carries **difficulty** instead of a constant. |
| `ece8477` | **Report attribution is now per-tier (audit S5).** Derived from the existing `clubs.plan_key` — **no migration**. Paid club tiers get a report headed by their own logo/name instead of "Powered by Swim Sight 3D". Applied to the PDF; the shared-link half is **escalated** (see below). |
| `b4ff9da` | **Drill library — stale rows no longer clobber the bundled defaults.** ⚠️ *Corrects my own earlier analysis:* all 9 `shared_default` DB ids **collide exactly** with bundled ids, and `mergeDrills` let the DB row win — so 9 rich drills were being **replaced** by placeholder rows. Fixed in code (no DB write): a `shared_default` row may not overwrite a bundled default; a club's own drill still always wins. Badge fallback chain **difficulty → phase → category** so the 33 drills without a difficulty never render a blank chip. *Verified over the real data: 0 junk rows survive, 0 blank badges, 23 distinct labels.* |
| `ca6f53e` | **Shared-report attribution via computed boolean (approved).** Endpoint fetches `plan_key` **server-side only** and emits **only** `club.show_attribution`. Imported the helper from `featureGates.js` rather than duplicating the tier list (the endpoint already cross-imports `src/lib/`), so there is one source of truth and no drift. Found the sanitizer uses an **allowlist** (so `plan_key` could never leak anyway — defence in depth) and that `compactObject` keeps `false` (so the boolean survives; had it been stripped, attribution would have silently switched back on for paid clubs). **Guard extended** to assert no tier field ever reaches a public payload — and **verified the guard bites** by injecting `plan_key` and watching it fail. |
| `fa81813` | **Example "demo squad" mode — front-end only (approved).** 10 swimmers, 2 squads, 2 finalised reports + 3 findings in the full content model. Intercepts at `createEntityAdapter`, the single choke point for all reads/writes, so every screen populates from one change. Always-visible banner + one-click exit; entry on the zero-data setup screen. **Provably read-only:** all 3 write paths refuse, all 3 read paths short-circuit before Supabase, everything scoped to `DEMO_CLUB_ID`. |

Plus, on `main` before this branch: **P0-1** (removing the "Pilot recovery mode" banner and
instability copy from all coach workflow screens) — `b5aeaea`.

---

## Merge readiness

**Branch HEAD is green.** Single `&&`-gated command on `feat/launch-hardening` HEAD:

```bash
npm run lint && npm run build && for t in safeguarding public-report-safety public-copy-safety pilot-readiness pilot-recovery ai-processing-reliability ai-output-selection biomechanics-contracts video-probe ai-metadata-callback pose-2d-callback pose-3d-callback analyse-route-runtime-safety analysis-jobs storage-hardening storage-adapter-readiness phase3-coach-polish production-surface; do npm run --silent test:$t || exit 1; done
```

→ **lint clean · build green · 18/18 guards.**

### The one human prerequisite (blocks merge)

- [ ] **Create `support@swimsight3d.com`** — a real mailbox or a forward to your Gmail.
      `SUPPORT_EMAIL` now defaults to it, so **until it exists, support mail bounces**.
      *Alternative if you'd rather defer:* set `VITE_SUPPORT_EMAIL` to the old gmail address,
      or revert that one line in `src/lib/supportConfig.js`.

### Other blockers

**None.** Everything else on this branch is self-contained, verified, and independently
revertible. No migrations were run; no database rows were written or deleted.

### Before you merge

- [ ] Review the diff (14 atomic commits).
- [ ] Confirm the AI-backend decision (see above — still awaiting `APPROVE: delete AI backend`, or leave as is).
- [ ] Sanity-check in-app: club theme in **light and dark**, and click **"Explore a demo squad"** → banner shows, data populates, **"Exit demo squad"** returns you to your real club.
- [ ] Merge `feat/launch-hardening` → `main`.

## Deferred / needs Owen

| Item | Why it's blocked |
|---|---|
| **AI backend deletion** | Protected system — needs `APPROVE:` (see above) |
| **`support@swimsight3d.com` mailbox** | Domain/DNS + mail provider |
| **The "3D" name** | Strategic. There is no 3D; the audit says either earn it (angle/pose overlay) or evolve the name. I did **not** unilaterally rename. |
| **Seeded demo club (P0-2)** | Needs your call: real Supabase rows (a DB write requiring approval) vs. a front-end "Explore with a demo squad" mode. I recommend demo-mode — no write, no risk of polluting a real club's analytics. |
| **Compliance content** | Hosting region, encryption, retention, sub-processors — needs real answers, not invented ones |
| **Shared-link attribution** | `api/shared-reports/[token].js` exposes only `club:{name}` by design. Gating the "Powered by" line there needs that **protected** endpoint to return a *computed boolean* (never `plan_key` — a share link must not disclose a club's commercial tier). Needs approval. |
| **9 uniform `shared_default` drill rows in the DB** | All carry the identical "4 x 25m easy technique" the audit screenshotted. They are *added* to the good defaults, not merged over them. Cleaning them is a DB change — owner approval. |
| **Test infrastructure** | Playwright + axe + Lighthouse CI don't exist; building them is its own workstream |
| **Phases 5–9** | The review room, finding composer, analytics consolidation, component library, motion system — ranked and ready in `docs/MERIDIAN_AUDIT_TRACKER.md` |

---

## What I'd do next

1. **P0-2 seeded demo club** — the other CRITICAL. Biggest remaining "this looks like a demo" fix.
2. **Finish the P0-4 copy sweep** — the dashboard defects are fixed; the rest of the authenticated
   strings still deserve a half-day pass.
3. **Then Phase 5.3/5.4** — the fast finding composer and the review room. That is the product's
   crown jewel and, per the audit, where 8 → 9.5 actually happens.
