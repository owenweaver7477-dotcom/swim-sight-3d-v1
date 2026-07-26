# Swim Sight 3D — App Repo Control File (CLAUDE.md)

> **This is the APP repository control file.**
> You are inside **Swim Sight 3D V1** — the user-facing product coaches actually use.
> This is **NOT** CoachSight Core (the private operations brain) and **NOT** the AI worker repo.
> Repo path: `/Users/owen_weaver/Documents/Swim Sight 3D V1`
> Stack: **React / Vite**, deployed to **Vercel**. Backend services: **Supabase** (auth, Postgres, storage). AI processing happens in a separate **Render** worker (`swim-sight-ai-server`).
>
> Vision, roadmap, and master safety policy live in **CoachSight Core**, not here. This file is the operating contract for working *inside the app code*.

---

## 1. What Swim Sight 3D Is

Swim Sight 3D is a professional swimming-analysis platform for coaches, clubs, swimmers, and parents. A coach uploads a private swimmer video, AI-supported analysis suggests technical findings, the **coach reviews and approves**, and the app generates a professional report that can be securely shared or exported.

The current priority is **pilot readiness**: making the core coach workflow reliable, clear, and professional enough for a real coach or club to test — not building advanced features.

**The core pilot flow this app owns:**

```
coach login
  → private video upload
  → AI analysis trigger
  → (worker processes on Render)
  → callback to app
  → AI-suggested findings
  → coach review & approval
  → professional report
  → secure share link / PDF export
```

**Already-built foundations to preserve (inspect before rewriting):** login/register/password, private coach workspace, club/swimmer management, private video upload, signed-URL handling, AI trigger, AI callback handling, report structure, coach approval UI, approved-report flow, public share-link foundation, PDF/export foundation, pilot-readiness route/checklist work.

---

## 2. The Product North Star

> **Make high-quality swimming analysis accessible to club-level coaches — simple on the surface, powerful underneath — while the coach stays in full control of every finding that reaches a swimmer or parent.**

Positioning: a serious, swimming-specific performance tool (in the spirit of Hudl / Dartfish) made practical for club coaches. Trust, simplicity, privacy, and coach control come before feature count. Every screen should make the **next action obvious**; no cluttered analytics dashboards full of meaningless numbers.

When choosing what to build or fix, rank by: **pilot impact → coach value → technical risk → trust/safety → time to implement → risk of breaking existing features.** High-impact, low-risk work first.

---

## 3. The Rule: AI Suggests, Coaches Decide

This is the single most important product rule and it is **inviolable**.

- No AI finding may appear as final truth without **coach approval**.
- No AI output may reach a **shared report** without passing through coach review.
- This is not a setting, a feature flag, or a dev/test convenience. It cannot be bypassed — not temporarily, not in dev, not for testing.
- If a bug exists *in* the approval flow, the fix still goes through review (Owen). It never "routes around" approval.

If any requested change would weaken, skip, auto-confirm, or hide the coach approval step — **refuse and explain why.**

---

## 4. Safe AI Language (use this)

All AI-generated content in the UI and reports must be framed as **suggestions for the coach**, clearly separated from coach-approved content. Use language like:

- "AI-suggested finding"
- "Coach review required"
- "Estimated pose data"
- "Possible technical issue"
- "Suggested cue"
- "Suggested drill"
- "Confidence score"

Reports must visually and textually separate **AI-suggested** content from **coach-approved** content, and include a clear disclaimer about AI assistance.

---

## 5. Unsafe / Overpromising Language (never ship this)

Never present AI output using language that implies certainty, diagnosis, or medical/biomechanical authority:

- "Guaranteed"
- "Diagnosed" / "Diagnosis"
- "Proven"
- "Perfect"
- "Medical cause" / "Injury cause"
- "Definitive biomechanics conclusion"

No unverified biomechanics claims. No injury or medical claims. If copy drifts toward certainty, soften it to suggestion language (Section 4).

---

## 6. Protected App Systems

Treat these as load-bearing. Inspect and understand before changing; do not weaken:

1. **Authentication & roles** — login, register, password, role checks, **workspace isolation** (a coach must never see another coach's/club's data).
2. **Private video upload** — videos must stay private; never expose raw file URLs, public bucket paths, or storage keys.
3. **Signed-URL handling** — signed URLs are temporary and secret; never log them or render them on public pages.
4. **AI trigger → callback** — the worker callback must stay protected by its secret/validation; never accept arbitrary external callbacks.
5. **Coach approval** — see Section 3.
6. **Reports** — must separate AI-suggested from coach-approved content; professional and safe.
7. **Share links** — public share pages show **only approved report content**; never private videos, internal IDs, signed URLs, or unapproved AI findings.
8. **Supabase data** — read paths only from app code as appropriate; no schema/RLS/data changes from a coding session without Owen running them.

---

## 7. What Claude Must Never Touch

Hard limits in this repo. If a task heads toward one of these, stop and flag it.

- ❌ Read, print, or commit `.env`, Supabase keys, service-role keys, or any secret.
- ❌ Trigger or promote a **Vercel deployment** (Owen deploys).
- ❌ **Push, merge, or delete branches** (Owen does this after review).
- ❌ Write to, update, delete, or change schema/**RLS** on Supabase; delete storage objects.
- ❌ Expose **signed URLs** or private video paths in code, logs, UI, or share pages.
- ❌ Weaken, bypass, or auto-confirm the **coach approval** step.
- ❌ Change authentication settings, user roles, or permissions.
- ❌ Add or modify any **Stripe/payment** behavior (out of scope for pilot).
- ❌ Add a new paid dependency/service without approval.

---

## 8. How Claude Should Inspect Before Editing

Default mode is **understand first, edit second.** Before changing anything:

1. **Map the repo** — structure, routing, main pages/components, where API calls and Supabase calls live. Confirmed 2026-07-16: routes in `src/App.jsx` (public pages eager, subpages/admin lazy); pages in `src/pages/` + `src/pages/public/`; shared UI in `src/components/ui/`; Supabase client in `src/lib/supabaseClient.js`, data access via `src/lib/data/entities.js`; serverless endpoints in `api/` (worker callbacks under `api/_lib/ai/`).
2. **Trace the relevant flow end-to-end** before touching it (e.g. for an upload bug, follow upload → signed URL → storage → trigger).
3. **Identify protected systems in scope** (Section 6) and note what must not change.
4. **State the smallest change** that fixes the issue and the blast radius.
5. **Preserve foundations** — prefer extending existing, working code over rewrites.
6. **Mark uncertainty** — anything not directly inspected is `[UNCONFIRMED]`, not assumed.
7. **Confirm risk level** (Section 9) and get approval where required (Section 14) **before** editing.

---

## 9. Risk Levels

Tag every proposed change so Owen can gauge it at a glance.

| Level | Meaning | Examples | Gate |
|---|---|---|---|
| 🟢 **Low** | Cosmetic / isolated, no protected system | Copy/text, spacing, colors, non-critical component styling, comments | Proceed; show diff for review |
| 🟡 **Medium** | Touches app logic but not a protected system | New non-critical component, refactor of isolated UI, client-side validation, report layout (non-approval) | Explain change + risk, then proceed on Owen's OK |
| 🔴 **High** | Touches a protected system (Section 6) or anything irreversible/external | Auth, roles, workspace isolation, upload, signed URLs, AI trigger/callback, approval flow, share-link visibility, Supabase access, deploy, env vars | **Stop. Requires explicit `APPROVE:` (Section 14).** Draft only until approved |

If unsure which level applies, treat it as the **higher** level.

---

## 10. Design Reference Locations

UI/UX direction: **simple, professional, dark/premium sport-tech, coach-first, calm not cluttered, clear about the next action.** Advanced biomechanics tools sit behind optional layers, not on the main path.

Reference locations (confirmed in-repo 2026-07-10):

- **Design tokens / theme:** `tailwind.config.js` (CSS-variable-driven tokens: background/foreground/primary/card/sidebar/chart, `darkMode: 'class'`) + `src/index.css` for the actual HSL values under `:root` and `.dark` (e.g. `--background: 210 40% 98%`, `--foreground: 210 74% 12%` deep navy, `--primary: 201 100% 36%`). Change token *values* in `src/index.css`; wire new tokens through `tailwind.config.js`.
- **Shared UI components:** `src/components/ui/` (shadcn-style primitives — `button.jsx`, `alert.jsx`, `badge.jsx`, `avatar.jsx`, etc.). Reuse these before hand-rolling. Public-marketing chrome lives in `src/components/public/` (`PublicNav`, `PublicFooter`, `PublicLayout`).
- **Brand assets:** live logo `public/brand/swim-sight-logo.png` (256px, used in nav/footer); social preview `public/og-swim-sight-3d.png` (1200×630); hero `public/hero/hero-desktop.jpg`. High-res source reference (logo, full-page screenshots) in `docs/design-reference/` — reference only, not imported by the app.
- **Report templates / layout:** `src/components/reports/PrintableReport.jsx` (PDF/print) and `src/components/reports/PublicReportView.jsx` (shared-link view). Public share safety is enforced server-side in `api/shared-reports/[token].js` + guarded by `npm run test:public-report-safety`.
- **Design spec / style guide:** no Figma. `docs/design-reference/Logged-In Page.png` and `docs/design-reference/Public UI Page.png` are **historical concept mockups, NOT the current brand** — they predate the 2026-07-11 coach-led repositioning and still show AI-forward branding ("AI SUGGESTS. COACHES DECIDE.", "AI ANALYSIS QUEUE"). Do NOT use them as the design target; matching them would reverse the coach-led rebrand (see the shipped public site + `[[coach-led-repositioning]]` memory for the real brand). Product/UI direction docs (`CoachSight_Core_Master_Plan…`, `Swim_Sight_3D_Codex_UI_Prompts.docx`) are in the same folder. There is no in-app living style guide — the current live public site + `src/components/ui/` are the ground truth for consistency.

---

## 11. First Safe Diagnosis Prompt

Paste this to run a **non-editing** diagnosis of the app:

> "You are working inside the Swim Sight 3D V1 app repo. Read this CLAUDE.md first. Do not edit anything, do not deploy, do not read .env or secrets, and do not weaken auth or the coach approval flow. Produce a non-editing diagnosis covering: app structure and routes; auth and role/workspace isolation; private video upload and signed-URL handling; AI trigger and callback validation; report display and coach-approval separation; share-link safety; and the top pilot-readiness blockers ranked by impact and risk. List any files I should not touch without caution. Mark anything you have not directly inspected as [UNCONFIRMED]."

---

## 12. First Safe UI Prompt

Paste this for **low-risk, design-system-respecting** UI work:

> "You are working inside the Swim Sight 3D V1 app repo. Read this CLAUDE.md first, including the design references (Section 10) and risk levels (Section 9). I want a 🟢/🟡 UI improvement only — do not touch auth, upload, signed URLs, AI trigger/callback, the approval flow, or share-link visibility. Before editing: show me the current component, the design tokens it uses, and the smallest change that achieves the goal. Keep AI-related copy in safe suggestion language (Section 4) and avoid overpromising language (Section 5). Present the change as a diff for my review. Do not deploy, push, or merge."

---

## 13. Testing / Check Commands

> ✅ Confirmed against `package.json` on 2026-07-16. There is **no `npm test`** — the
> suite is a battery of named guard scripts, listed below. Keep this list in sync.

```bash
npm install          # install deps (fresh checkouts need this before any check)
npm run dev          # run the app locally
npm run build        # production build — catches build errors before deploy
npm run preview      # preview the production build locally
npm run lint         # eslint (npm run lint:fix to autofix)
npm run typecheck    # type check
```

**Guard battery** — each is a standalone assertion script under `scripts/`. Run the
ones touching your change; run all of them before calling anything "done":

```bash
npm run test:safeguarding                # core safeguarding rules
npm run test:public-report-safety        # shared reports never leak unapproved/private content
npm run test:public-copy-safety          # public marketing copy stays inside safe language (Section 4/5)
npm run test:pilot-readiness             # pilot launch gate
npm run test:pilot-recovery              # AI failure states always leave a manual-review route
npm run test:ai-processing-reliability   # AI processing contract
npm run test:ai-output-selection         # which AI output is surfaced
npm run test:biomechanics-contracts      # biomechanics claim limits
npm run test:video-probe                 # video probe contracts
npm run test:ai-metadata-callback        # worker callback: metadata
npm run test:pose-2d-callback            # worker callback: 2D pose
npm run test:pose-3d-callback            # worker callback: 3D pose
npm run test:analyse-route-runtime-safety
npm run test:analysis-jobs               # job state machine
npm run test:storage-hardening           # storage/signed-URL hardening
npm run test:storage-adapter-readiness
npm run test:phase3-coach-polish         # coach studio / drill library surface
npm run test:production-surface          # route guards, admin gating, no private routes in public nav
npm run test:demo-mode-readonly          # demo mode never writes — exercised, not asserted
```

ℹ️ **`test:demo-mode-readonly` runs real code, not a source scan.** It imports the live
data layer via `scripts/_src_loader.mjs` (Node hooks that map Vite's `@/` alias and
`import.meta.env`) and actually calls every mutating adapter method. The check is
two-sided: with demo mode **on** each write must fail with `DemoModeWriteError`; with it
**off** the same call must fail with the Supabase config error instead — which is what
proves the write really does reach Supabase when it is not refused. A one-sided check
cannot tell "refused" apart from "never ran".

**Coverage is derived from the adapter, not listed.** Any method that is not on the small
`READ_ONLY_METHODS` allowlist (`list`/`filter`/`query`/`get`) is treated as a write and
must be refused, so a newly added write is caught **by default** rather than by someone
remembering to update a list. Add a new write method and the guard fails until you either
give it call arguments in `WRITE_CALL_ARGS` or consciously declare it a reader — unhandled
is treated as broken, not fine. (A hand-maintained list is exactly how `bulkCreate` reached
production unguarded.)

⚠️ **Guard scripts pin literal strings.** If a check fails because you renamed or
removed a pinned literal, do **not** delete the assertion to go green — restore the
literal, or repoint the guard at the real behaviour and say so in the diff. A guard
that was silently pointing at a dead file passes forever and protects nothing.

Rules for checks:
- **Build/test/lint are read-only verification** — running them is fine and encouraged before proposing a change is "done."
- Running the app locally (`npm run dev`) is fine. **Deploying is not** (Section 7).
- Never run a command that writes to Supabase, sends anything, or pushes code.
- After confirming the real scripts, replace this section's placeholders with the exact commands.

---

## 14. Approval Rules

CoachSight Core's policy applies here: **Claude advises and drafts; Owen decides and acts.**

- 🟢 **Low risk:** proceed and show the diff for review.
- 🟡 **Medium risk:** explain the change and its risk, then proceed once Owen agrees.
- 🔴 **High risk** (any protected system, or anything irreversible/external): **draft only — do not apply — until Owen types an explicit approval.**

**Approval format:** Owen types `APPROVE: [action]` (e.g. `APPROVE: change upload validation in UploadPage`). Without it, a high-risk change is not applied.

**Always requires `APPROVE:` (never silent):**
- Pushing to any branch, merging, or deleting a branch
- Deploying or promoting on Vercel
- Changing environment variables
- Any Supabase write, delete, schema, RLS, or bucket-policy change
- Any change to auth, roles, permissions, or the coach approval flow
- Adding a new paid dependency or service

If an action isn't listed but feels irreversible, costs money, or affects real users or their data — **treat it as high risk and ask first.**

---

*End of app repo control file. Source of truth for vision and master safety policy: CoachSight Core (`coachsight-core`). Keep this file accurate; update the `[UNCONFIRMED]` placeholders once verified inside the repo.*
