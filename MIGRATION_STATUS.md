# Swim Sight 3D V1 Migration Status

## Current Base44 Baseline

- Source repo: `owenweaver7477-dotcom/swim-sight-3d-v1`
- Branch: `migration/supabase-v1`
- Baseline stack: exported Vite React app using Base44 SDK, Base44 entities, Base44 auth, Base44 functions, Base44 storage, and Base44 signed URLs.
- Base44 reference folders retained:
  - `base44/entities`
  - `base44/functions`

## Target Stack

- Frontend: Vite React, preserving the current professional Swim Sight 3D shell and core UI.
- Hosting: Vercel.
- Database/Auth/Storage: Supabase.
- Server/API layer: Vercel serverless API routes.
- External AI server: Render at `https://swim-sight-ai-server.onrender.com`.

## Migration Phases

1. Repository and baseline safety.
2. Build stabilization and scaffold commit.
3. Environment setup and Supabase client helpers.
4. Supabase V1 core schema, RLS, and storage buckets.
5. Adapter layer for Base44-like entity/function access.
6. Supabase Auth migration.
7. Club workspace migration.
8. Swimmers migration.
9. Private video upload migration.
10. Vercel API routes for signed URLs, AI trigger/callback, reports, and sharing.
11. AI Review page migration.
12. Public shared report migration.
13. Design preservation and advanced-feature deferral.
14. End-to-end testing and deployment readiness.

## Completed Steps

- Cloned the GitHub repo into the local workspace.
- Created branch `migration/supabase-v1`.
- Ran `npm install`.
- Confirmed the baseline app served locally with `npm run dev -- --host 127.0.0.1` and HTTP 200.
- Added Supabase dependency and migration scaffolding.
- Added `.env.example` with frontend and server-only migration variables.
- Added browser-safe Supabase client helper.
- Added API-only Supabase service-role helper under `api/_lib`.
- Added V1 Supabase schema, RLS helpers/policies, and storage bucket plan.
- Added Base44-like Supabase entity/function adapter scaffolds for incremental page migration.
- Added Vercel API route scaffolds for signed video URLs, AI trigger/callback, shared reports, soft report delete, and timed-out job reset.

## Build Diagnosis

- Environment captured during Phase 0.5 before clean reinstall:
  - Node: `v24.15.0`
  - npm: `11.12.1`
  - OS: Darwin arm64
  - Vite: `6.4.1`
  - Rollup: `4.57.1`
- After clean reinstall, the lockfile resolved to:
  - Vite: `6.4.3`
  - Rollup: `4.61.1`
- The original build hang reproduced before and after cache clearing.
- A clean install (`node_modules` and `package-lock.json` removed, then `npm install --cache .npm-cache`) restored guarded build completion.
- The scaffold was temporarily stashed and the stashed baseline also built successfully with the guarded runner.
- The Base44 Vite plugin logs `[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)`, which is expected when no Base44 proxy URL is configured.
- Conclusion: the hang was caused by a bad local dependency/toolchain state, not by the Supabase scaffold or Base44 Vite plugin.
- Current scaffold verification:
  - API/helper JavaScript files pass `node --check`.
  - `package.json`, `package-lock.json`, and `vercel.json` parse as valid JSON.
  - `npm run build` completed successfully with a 90-second guard.

## Known Risks

- Base44 calls are spread across many pages and components, so migration should use an adapter layer instead of editing every page at once.
- RLS must enforce club isolation. Frontend role checks are not sufficient.
- Private videos must never be exposed through public report endpoints.
- AI callback handling must be idempotent and must not create fake findings for weak or placeholder pose results.
- The Render AI callback must send `x-ai-webhook-secret` or `Authorization: Bearer <AI_WEBHOOK_SECRET>` for the new callback route to accept results.
- Advanced features should remain deferred until the core V1 coach workflow is stable.
- Existing dependency audit warnings are present in the exported app and were not addressed during baseline safety.

## Deferred Features

- Drag risk workflows.
- Annotations.
- 3D model/reference assets.
- Coach testing pack.
- Notifications/email.
- Advanced analytics, swimmer trends, and performance hub details.
- Drill library expansion and technical-standard deep linking.
