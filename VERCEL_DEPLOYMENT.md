# Vercel Deployment

This Vite app is deployed to Vercel with serverless API routes under `/api`.

## 1. Import Project

1. Import the GitHub repo into Vercel.
2. Select the approved release branch for preview testing.
3. Framework preset: Vite.

## 2. Build Settings

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

Install command:

```bash
npm ci
```

## 3. Environment Variables

Frontend:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_BASE_URL=https://your-vercel-app.vercel.app
VITE_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
VITE_AI_SERVER_URL=https://swim-sight-ai-server.onrender.com
VITE_ENABLE_GOOGLE_AUTH=false
```

Server-only:

```bash
SUPABASE_SERVICE_ROLE_KEY=
AI_SERVER_URL=https://swim-sight-ai-server.onrender.com
AI_WEBHOOK_SECRET=
PUBLIC_APP_URL=https://your-vercel-app.vercel.app
REQUIRE_CONSENT=true
FOOTAGE_RETENTION_DAYS=30
CRON_SECRET=
```

Rules:

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Do not expose `AI_WEBHOOK_SECRET` to the browser.
- `PUBLIC_APP_URL` must be the URL Render can reach for `/api/ai/callback`.
- `REQUIRE_CONSENT` must be `true` before processing real footage of minors.
- `CRON_SECRET` protects scheduled retention work and must remain server-only.
- For preview deployments, update `PUBLIC_APP_URL` to the current preview URL before the first live AI test.

## 4. Routing

`vercel.json` rewrites non-API routes to `index.html` and leaves `/api/*` as serverless routes.

Confirm:

- `/login` loads.
- `/dashboard` redirects to login when logged out.
- `/shared-report/:token` loads without auth.
- `/api/shared-reports/:token` returns JSON for valid active tokens.

## 5. API Route Smoke Tests

After deploy, test:

1. `POST /api/clubs/create` with auth.
2. `POST /api/video-uploads/:id/signed-url` with auth.
3. `POST /api/ai/trigger` with auth and coach role.
4. `POST /api/ai/callback` with `x-ai-webhook-secret`.
5. `POST /api/reports/:id/share-link` with auth and finalised report.
6. `GET /api/shared-reports/:token` without auth.

## 6. Render Callback Secret Compatibility

The Vercel callback route accepts only:

- `x-ai-webhook-secret: <AI_WEBHOOK_SECRET>`
- or `Authorization: Bearer <AI_WEBHOOK_SECRET>`

Do not weaken the Vercel callback route. If the Render Python server does not send one of those headers, make the smallest Python-only patch:

1. Update the callback client, likely `app/callback_client.py`.
2. Add header `x-ai-webhook-secret: AI_WEBHOOK_SECRET`.
3. Add the same `AI_WEBHOOK_SECRET` value to Render env.
4. Redeploy the Python server.
5. Re-run the callback test.

## 7. Deployment Readiness

Before first E2E test:

- `npm ci && npm run build` passes in a clean checkout/install.
- `npm run test:safeguarding`, `npm run test:public-report-safety`, and `npm run test:pilot-readiness` pass.
- Supabase migrations are applied.
- `private-videos` bucket is private.
- Vercel env vars are set.
- Supabase Auth redirect URLs include the Vercel URL.
- Render callback URL points to Vercel `PUBLIC_APP_URL`.
