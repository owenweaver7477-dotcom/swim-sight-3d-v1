# Swim Sight 3D

Swim Sight 3D is a coach-led swim analysis platform for controlled club testing.

The V1 stack is:

- Vite React frontend
- Vercel hosting and API routes
- Supabase Auth, database, row-level security, and private storage
- External Python pose-analysis server on Render

## Safety Principles

- AI output is draft evidence only.
- Coaches must approve, edit, or reject findings before report inclusion.
- Weak or unreliable pose becomes manual review with zero fake findings.
- Private videos stay in private storage.
- Public shared reports use secure tokens and sanitized data only.
- No exact drag-force, medical, race-prediction, or formal SwimPro relationship claims are made.

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Environment Variables

Frontend-safe:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_BASE_URL=
VITE_AI_SERVER_URL=https://swim-sight-ai-server.onrender.com
```

Server-only:

```bash
SUPABASE_SERVICE_ROLE_KEY=
AI_SERVER_URL=https://swim-sight-ai-server.onrender.com
AI_WEBHOOK_SECRET=
PUBLIC_APP_URL=
```

Never commit `.env` files or real secrets.

## Setup Docs

Read these before testing or deploying:

- `SUPABASE_SETUP.md`
- `VERCEL_DEPLOYMENT.md`
- `INFRASTRUCTURE_LIMITS.md`
- `AI_JOB_ENGINE_TEST_PLAN.md`
- `COACH_PILOT_TEST_SCRIPT.md`
