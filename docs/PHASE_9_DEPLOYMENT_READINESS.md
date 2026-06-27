# Phase 9 Deployment Readiness

Checked: 21 June 2026

## Production domain reconciliation

Two separate Vercel projects are currently reachable:

- `swim-sight-3d.vercel.app` is the obsolete Next.js project. It still serves the old public shell with diagnostics, dummy clubs, and unprotected legacy pages.
- `swim-sight-3d-v1.vercel.app` is the current Vite project from this repository. Its public site has no diagnostic panel, and a logged-out request to `/dashboard` redirects to `/login` without rendering the app shell.

The obsolete project cannot be fixed by changing this repository alone. After the reviewed changes are committed and deployed to `swim-sight-3d-v1`, use the Vercel dashboard to retire or rename the old `swim-sight-3d` project and make the current Vite project the only coach-facing production destination. Until then, do not give coaches the obsolete URL.

## Release scope

This pass hardens existing release boundaries. It does not add a database migration, change the AI worker contract, or add a product feature.

Changes in this pass:

- Coach application routes now require a coach-role membership in addition to authentication.
- `/pilot-launch` is restricted to owner, admin, and coach roles.
- Missing or stale membership data no longer defaults to the coach role.
- Swimmer and parent accounts can request private playback only for their linked swimmer.
- Share links require every finding to have a final coach decision.
- Both public shared-report handlers require an active link and a finalised report.
- The legacy shared-report handler no longer returns drag blocks, internal IDs, or internal coach notes.
- Structured-data JSON escapes HTML-significant `<` characters before rendering.
- Internal AI, calibration, job-monitor, feedback, and product-improvement routes are owner/admin-only.
- Production UI no longer renders backend connection or developer diagnostic panels.
- A production-surface regression check rejects old diagnostic wording, dummy club names, and route-guard regressions.

## Verification

Required release checks:

```bash
npm run test:safeguarding
npm run test:public-report-safety
npm run test:pilot-readiness
npm run lint
npm run build
npm run typecheck
git diff --check
```

A clean temporary install passed the production build, and the Phase 8/9 files passed focused linting. The build emitted only the expected local message that the optional Base44 proxy was not enabled.

Full-project lint is not currently green: it reports 102 existing errors, primarily unused imports and React Three Fiber properties that the current ESLint setup treats as unknown DOM properties. Full-project JavaScript type checking also reports extensive existing dependency and untyped-component errors. These checks are not part of the Vercel build command and no Phase 9 compile error was found. They should be handled as a separate code-quality cleanup rather than mixed into this release hardening pass.

## Local build finding

The existing workspace `node_modules` can appear to stall before Vite transforms application code. Investigation showed extreme dependency-read latency on a nearly full local disk, including slow imports before the Base44 plugin or application source loaded. A clean `npm ci` copy on the same machine built successfully, so no speculative application rewrite is warranted.

Before relying on the in-place local install, free disk space and recreate dependencies:

```bash
rm -rf node_modules
npm ci
npm run build
```

Vercel uses a clean install, which matches the successful verification path.

## Vercel checks

Before deploying real pilot footage, confirm the Vercel project has:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_BASE_URL`, `VITE_PUBLIC_SITE_URL`, and `PUBLIC_APP_URL` set to the production origin
- `SUPABASE_SERVICE_ROLE_KEY` stored server-side only
- `AI_SERVER_URL` and `AI_WEBHOOK_SECRET`, matching the Render worker
- `REQUIRE_CONSENT=true` for real footage involving minors
- `FOOTAGE_RETENTION_DAYS` and a server-only `CRON_SECRET`
- the `private-videos` bucket still private
- production and email-confirmation URLs allowed in Supabase Auth

No Vercel deployment was triggered during Phase 9.

## Release decision

The source is ready to commit after Owen reviews the Phase 8 and Phase 9 changes together. It is suitable for a Vercel preview and controlled pilot deployment, subject to the environment checks above and a clean Vercel build. After deployment, smoke-test login, role denial, private playback, finalisation, share-link revocation, and a logged-out shared report. The existing full-project lint/type-check debt remains a known limitation, not a hidden pass.
