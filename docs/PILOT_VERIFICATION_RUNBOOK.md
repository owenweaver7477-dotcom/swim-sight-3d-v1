# Swim Sight 3D — Pilot Verification Runbook

**Purpose:** A manual, step-by-step checklist to run *before* showing the app to a coach (e.g. Hiromi).
**How to use:** Work top to bottom. Tick each `[ ]`. Log anything that fails in the table in Section 4. Decide go/no-go with Section 5.

> This runbook was built from a read-only inspection of the repo. Anything that can **only** be confirmed in a live dashboard (Supabase / Vercel / Render) is marked **🔎 LIVE CHECK** — the code cannot prove it; you must look.

---

## 0. Before you start (5 min)

- [ ] You have login access to: **Supabase dashboard**, **Vercel dashboard**, **Render dashboard** (AI worker), and the app URL.
- [ ] You have **two separate email addresses** available (for the cross-club privacy test in 1C).
- [ ] You have a short **test swim video** file ready (something you're allowed to use).
- [ ] Decide your test URL: the **production** Vercel URL (recommended for a true pilot check), or a preview deploy.

---

## 1. Supabase checks

### 1A. Confirm migrations are applied  🔎 LIVE CHECK
The repo has **18 migration files** in `supabase/migrations/` (numbered 001–018, with intentional gaps: **there is no 014**, and 015 is split into 015a/015b). They are applied **manually via the SQL editor** (there's no Supabase CLI config in the repo), so you must confirm they actually ran.

- [ ] In Supabase → **SQL Editor**, run this read-only query and confirm you see the expected tables:
  ```sql
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name;
  ```
  **Expect these 22 tables:** `ai_credit_ledger`, `ai_finding_feedback`, `ai_processing_jobs`, `club_invites`, `club_members`, `clubs`, `data_deletion_events`, `drills`, `findings`, `key_frames`, `notification_logs`, `profiles`, `reference_assets`, `reference_profiles`, `reports`, `shared_report_links`, `squads`, `swimmers`, `swimmer_consent_records`, `technical_standards`, `video_annotations`, `video_uploads`.
- [ ] **⚠️ Known discrepancy to resolve:** `SUPABASE_SETUP.md` references a **migration 014 / `pilot_feedback` table**, but no such migration file exists in the repo and no code reads `pilot_feedback`. Run:
  ```sql
  select to_regclass('public.pilot_feedback') as pilot_feedback_table;
  ```
  - The app's **floating "Feedback" button** writes to the `CoachFeedback` entity (real DB) — that's the one that matters for pilot. Confirm **that** table/entity exists (check for `coach_feedback` in the table list, or wherever `CoachFeedback` maps).
  - `pilot_feedback` being `null` here is **OK** as long as `CoachFeedback` works (see 3M). Just don't rely on the `/pilot-launch` structured form for real data — it saves to the browser only (localStorage), not Supabase.

### 1B. Confirm RLS is enabled on the important tables  🔎 LIVE CHECK
Every table in the migrations calls `enable row level security`. Confirm it's actually **ON** in the live DB (a failed migration or manual toggle could leave a gap).

- [ ] Run:
  ```sql
  select relname as table_name, relrowsecurity as rls_enabled
  from pg_class
  where relnamespace = 'public'::regnamespace and relkind = 'r'
  order by relname;
  ```
  - [ ] **Every** row must show `rls_enabled = true`. Pay special attention to the privacy-critical tables: `swimmers`, `video_uploads`, `reports`, `findings`, `shared_report_links`, `ai_processing_jobs`, `clubs`, `club_members`.
- [ ] Confirm policies exist (not just RLS on):
  ```sql
  select tablename, count(*) as policies
  from pg_policies where schemaname = 'public'
  group by tablename order by tablename;
  ```
  - Every privacy-critical table above should have **≥ 1 policy**. (A table with RLS on and **zero** policies is default-deny — that's intentional for `shared_report_links`, `swimmer_consent_records`, `ai_credit_ledger` which are written only by the server, but should **not** be the case for `swimmers`/`reports`/`findings`.)
- [ ] Confirm the storage policies exist:
  ```sql
  select policyname, tablename from pg_policies
  where schemaname = 'storage' order by policyname;
  ```
  - Expect policies restricting `private-videos` insert/update/delete to club coach roles, and `club-branding` read/write policies.

### 1C. Two-account cross-club privacy test  🔎 LIVE CHECK — **THE most important test**
This proves one coach can never see another coach's swimmers, videos, or reports.

- [ ] **Coach A:** register with email #1 → create **Club A** → add a swimmer "A-Swimmer" → upload a video → (if the worker is live) run an analysis so a **Report A** exists. Note Report A's ID from the URL (`/ai-review?report_id=<COPY THIS>`).
- [ ] **Coach B:** in a **separate browser / incognito**, register with email #2 → create **Club B**.
- [ ] As Coach B, confirm you **cannot** see any of Coach A's data:
  - [ ] `/dashboard` shows only Club B (no A-Swimmer, no Report A).
  - [ ] `/swimmers` shows no A-Swimmer.
  - [ ] `/ai-reviews` (Coach Studio queue) shows none of Coach A's reports.
  - [ ] **Direct-URL attack:** as Coach B, paste `/ai-review?report_id=<Report A's ID>` into the address bar → it must **not** load Coach A's report (expect empty / not-found / access denied).
- [ ] **PASS = Coach B sees nothing of Coach A's, including via the direct URL.** Any leak here is an automatic **NO-GO**.

### 1D. Storage is private + signed URLs are used  🔎 LIVE CHECK
- [ ] Supabase → **Storage** → confirm bucket privacy:
  ```sql
  select id, name, public from storage.buckets order by name;
  ```
  - [ ] `private-videos` → `public = false`
  - [ ] `ai-artifacts` → `public = false`
  - [ ] `reference-assets` → `public = false`
  - [ ] `club-branding` → `public = true` **(this is intentional — club logos only. Confirm it never holds video or personal data.)**
- [ ] Confirm playback uses **signed URLs** (not public paths): in the app, open a swimmer video for playback. In browser **DevTools → Network**, the video request URL should be a **signed** Supabase storage URL (contains `token=`/`sign`), time-limited (~10 min). It must **not** be a `…/object/public/…` URL.
- [ ] On the **public shared report** page (Section 3J), confirm there is **no private video** and **no signed URL** anywhere in the page or its network payload.

---

## 2. Vercel checks

### 2A. Can the app deploy on my current plan?  🔎 LIVE CHECK
**Good news (corrected from earlier assumption):** the repo has **11 deployable serverless functions** (the 19 files under `api/_lib/` are shared helpers, excluded because the folder is underscore-prefixed) and **1 daily cron**. That is **within Vercel Hobby limits** (max 12 functions, small number of daily crons).

- [ ] Confirm the latest deployment **succeeded** (Vercel → Deployments → latest = "Ready", no build errors).
- [ ] Note the margin: **11 / 12 functions.** You have room for **only one more** API endpoint before you'd exceed Hobby and need **Pro**. Keep this in mind before adding features.
- [ ] 🔎 Confirm in the dashboard whether the project is actually on **Hobby or Pro** (the repo can't tell you). Either works today.

### 2B. Function count + cron  🔎 LIVE CHECK
- [ ] Vercel → project → **Functions**: confirm ~**11** functions listed. (Expected: `admin/ai-jobs/reset-timed-out`, `ai/[action]`, `clubs/create`, `clubs/invites/[id]/revoke`, `clubs/invites/create`, `clubs/join-invite`, `reports/[id]`, `reports/[id]/share-link`, `shared-report-links/[id]/disable`, `shared-reports/[token]`, `video-uploads/[id]/signed-url`.)
- [ ] Vercel → **Settings → Cron Jobs**: confirm **1 cron**, path `/api/admin/retention/delete-expired-footage`, schedule `0 3 * * *` (daily 03:00 UTC).
  - Note: that cron path is a **rewrite** into `api/admin/ai-jobs/reset-timed-out.js?action=retention_cleanup` — so if the cron "function" looks missing, that's why. Confirm the cron shows as **enabled**.
- [ ] Confirm the cron is authenticated: it should require `CRON_SECRET` (see 2C). A cron that runs without the secret set will fail — check the cron's last run status.

### 2C. Required environment variables are set  🔎 LIVE CHECK
In Vercel → **Settings → Environment Variables**, confirm all of these exist for the **Production** environment.

**Client (must be `VITE_`-prefixed — these ship to the browser, and that's fine):**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`  *(anon key only — never the service role key)*
- [ ] `VITE_APP_BASE_URL`
- [ ] `VITE_PUBLIC_SITE_URL`
- [ ] `VITE_SUPPORT_EMAIL` *(optional but recommended)*
- [ ] `VITE_ENABLE_GOOGLE_AUTH` *(set `false` unless you've configured Google)*

**Server-only (must have **NO** `VITE_` prefix):**
- [ ] `SUPABASE_SERVICE_ROLE_KEY`  ← **critical, and must never be VITE-prefixed**
- [ ] `AI_SERVER_URL`  *(the Render worker, e.g. `https://swim-sight-ai-server.onrender.com`)*
- [ ] `AI_WEBHOOK_SECRET`  *(validates the worker's callback so random external calls are rejected)*
- [ ] `CRON_SECRET`  *(authenticates the daily cron)*
- [ ] `PUBLIC_APP_URL`
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` *(server reads these; falls back to the VITE_ ones if absent — setting them explicitly is cleaner)*
- [ ] `REQUIRE_CONSENT`, `FOOTAGE_RETENTION_DAYS` *(optional; defaults are safe)*

### 2D. No server-only secret is exposed as a `VITE_` variable  🔎 LIVE CHECK
**Code verdict: PASS** — the repo cleanly separates client vs server vars, and a scan of the built bundle found **no** service-role key, webhook secret, or cron secret. But a secret added *directly in the Vercel dashboard* with a `VITE_` prefix would still leak to the browser, so confirm by eye:

- [ ] Scan the Vercel env var list: **nothing** starting with `VITE_` should contain `SERVICE`, `ROLE`, `SECRET`, `WEBHOOK`, `CRON`, or `PASSWORD`. Specifically confirm there is **no** `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_AI_WEBHOOK_SECRET`, or `VITE_CRON_SECRET`.
- [ ] Sanity check in the live app: open the site → DevTools → Console → type `import.meta` is not available, so instead check **Sources/Network** for the main JS bundle and search it for `service_role` — it should **not** appear.

---

## 3. App flow test — the coach journey

Run this straight through on the deployed app. Routes and button labels below are exact. **Desktop vs mobile use different labels for the same pages** — noted where it matters.

> **⚠️ Big dependency for steps E–H:** There is **no "simulate/demo" button** in the app. The **only** way to produce AI findings is the real Render worker. So end-to-end AI testing **requires the Render worker to be deployed, awake, and configured**. Free-tier Render **sleeps** — hit the worker URL once first to wake it, or the first analysis may hang. If the worker isn't ready, you can still test everything *except* live AI generation by using an existing report.

| # | Step | Route | What to click | Expected |
|---|------|-------|---------------|----------|
| A | Register coach | `/register` | Fill Email + Password + Confirm → **Create account** | Account created. *(If Supabase email confirmation is on, you'll see a "Check your email" screen — confirm, then log in.)* |
| B | Log in | `/login` | Fill Email + Password → **Log in** | Lands on `/dashboard` (existing club) or `/club-onboarding` (no club) |
| C | Create club workspace | `/club-onboarding` | "Create New Club" tab → Club/Squad Name → **Create Club Workspace** | Lands on `/dashboard` showing the club |
| D | Add swimmer | `/swimmers` | **Add Swimmer** → Name (required) → dialog **Add Swimmer** | Swimmer appears in the list |
| E | Upload video | `/analyse` | Select swimmer → choose file → **Upload to Private Storage** | Upload succeeds; CTA becomes **Continue to Configure →** |
| F | Trigger AI | `/analyse` (Configure step) | Set stroke + camera angle → tick the draft-AI confirmation → **Send for AI Review** | Job queued; goes to the Render worker. *(Alternative: **Open Coach Studio** = manual review, no AI.)* |
| G | Open report | `/ai-reviews` → click a row | Row button: **Review** (pending), **Open**, or **View Report** (finalised) | Opens `/ai-review?report_id=…` |
| H | Approve/reject/edit findings | `/ai-review?report_id=…` | Per finding: **Approve**, or **Reject** → reason + note → **Confirm Reject**. Edit cues inline; **Add Approved Coach Finding** for manual | Statuses update; approved findings show **Undo Approve** |
| I | Finalise report | same page (Finalise step) | **Finalise Coach Report** → in the modal, **Finalise Report** | *Button only appears when **0 findings are pending**.* Report status → finalised |
| J | Create share link | same page (ShareReportSection) | **Create Share Link** | *Enabled only when coach-approved AND 0 pending.* Public URL `…/shared-report/<token>` shown |
| K | Open public report on phone | `/shared-report/<token>` | Open the copied link on a **mobile** browser | Read-only report, "Coach Approved" badge, **no private video**, no sidebar |
| L | Download / print PDF | public page (or coach page) | **Download PDF** | Browser print dialog → **Save as PDF**. *(No server PDF — it's `window.print()`.)* Check multi-page report isn't clipped |
| M | Disable share link | `/ai-review?report_id=…` (ShareReportSection) | **Disable Link** | Link cleared. **Re-open the public URL → it should no longer resolve** |
| N | Submit feedback | floating button on `/analyse` and `/ai-review` | **Feedback** → pick Type → write Message → **Save Feedback** | Saved to the DB (`CoachFeedback`). *(The `/pilot-launch` form saves to that device only — don't rely on it for real feedback.)* |

**Detailed checkpoints while running the journey:**
- [ ] **F/G (AI):** After "Send for AI Review", the job actually processes and a report with findings appears (worker must be awake). If it hangs, check Render logs + `/api/ai/callback` + `AI_WEBHOOK_SECRET`.
- [ ] **H (the core rule):** Confirm findings arrive as **AI-suggested** and nothing is auto-approved. You must click Approve for each.
- [ ] **I (finalise gate):** Confirm you **cannot** finalise while any finding is still pending (the button is hidden). This is the coach-control guarantee.
- [ ] **J (share gate):** Confirm you **cannot** create a share link until the report is finalised/approved with 0 pending.
- [ ] **K (privacy):** On the public page, view source / network — confirm **no** private video URL, internal IDs, or unapproved findings are present.
- [ ] **L (print):** Print a report with **3+ findings** and confirm **all pages** render (the recent print fix should stop page-1 clipping) and no on-screen buttons appear in the PDF.
- [ ] **M (revoke):** Confirm the disabled link is truly dead on reload.

---

## 4. What to record during testing

Copy this table (or keep it in a spreadsheet). One row per check that fails or is noteworthy.

| Area / Step | Pass / Fail | Issue found | Severity (Blocker / Major / Minor) | Screenshot? (Y/N) | Fix before pilot or after? |
|-------------|-------------|-------------|-------------------------------------|-------------------|-----------------------------|
| 1A Migrations | | | | | |
| 1B RLS on tables | | | | | |
| 1C Cross-club privacy | | | | | |
| 1D Storage private / signed URLs | | | | | |
| 2A Deploy succeeds | | | | | |
| 2B Functions + cron | | | | | |
| 2C Env vars set | | | | | |
| 2D No VITE_ secret leak | | | | | |
| 3A–B Register / login | | | | | |
| 3C Club workspace | | | | | |
| 3D Add swimmer | | | | | |
| 3E Upload video | | | | | |
| 3F–G AI trigger + report | | | | | |
| 3H Approve/reject findings | | | | | |
| 3I Finalise gate | | | | | |
| 3J Share link gate | | | | | |
| 3K Public report on phone | | | | | |
| 3L Download/print PDF | | | | | |
| 3M Disable share link | | | | | |
| 3N Submit feedback | | | | | |

**Severity guide:** *Blocker* = unsafe or breaks the core flow (privacy leak, can't finalise, can't share, AI auto-approves). *Major* = works but confusing or ugly enough to hurt a coach's trust. *Minor* = cosmetic / edge case.

---

## 5. Pilot go/no-go criteria

### ✅ MUST PASS before showing a coach (any failure = **NO-GO**)
1. **Cross-club privacy (1C)** — Coach B cannot see Coach A's swimmers/videos/reports, including via direct URL.
2. **RLS on (1B)** — every privacy-critical table (`swimmers`, `video_uploads`, `reports`, `findings`, `shared_report_links`, `ai_processing_jobs`, `clubs`, `club_members`) has RLS enabled with policies.
3. **Storage private (1D)** — `private-videos` is not public; playback uses signed URLs; public report has no private video/URL.
4. **No secret leak (2D)** — no server secret exposed under a `VITE_` prefix.
5. **Deploy is green (2A)** and required **env vars are set (2C)** — especially `SUPABASE_SERVICE_ROLE_KEY`, `AI_WEBHOOK_SECRET`, `CRON_SECRET`, `AI_SERVER_URL`.
6. **Core flow works end-to-end (3A–3M)** — login → club → swimmer → upload → analysis → review → **approve** → finalise → share → open on phone → download PDF → disable link.
7. **Coach control holds (3H, 3I, 3J)** — findings are AI-*suggested*, finalise is blocked while any finding is pending, and sharing is blocked until approved. This rule must never be bypassable.
8. **Feedback capture works (3N)** — the floating Feedback button saves to the DB.

### 🟡 CAN WAIT until after the pilot starts
- The **`pilot_feedback` / migration-014 discrepancy** (1A) — fine as long as the floating `CoachFeedback` button works. Tidy the docs/migration later.
- `/pilot-launch` structured form saving only to localStorage (make it a real DB write later if you want that data).
- Duplicate/legacy label mismatches (sidebar "Coach Studio" vs mobile "Reports"; `/ai-review` vs `/ai-reviews`).
- The **6 undocumented `VITE_` feature flags** and `MAX_ACTIVE_AI_JOBS` missing from `.env.example` (hygiene, non-blocking).
- Vercel **11/12 function headroom** — not a problem now, but plan for Pro before adding endpoints.
- Cosmetic polish, dead pages, deeper analytics.

### ⚠️ Special note on AI (steps 3F–3H)
AI findings **only** come from the live **Render worker** — there is no simulate mode. If the worker is asleep/misconfigured on pilot day, the coach will see a hang at "Send for AI Review". **Before the session:** wake the worker, run one full analysis yourself, and confirm findings come back. If the worker can't be made reliable in time, consider demoing with a **pre-finalised report** (steps G–M) and running one live analysis only once the worker is confirmed warm.

---

*Read-only runbook. No code, schema, or deployment was changed to produce it. Update the checkboxes as you go.*
