# Vercel cutover — make the clean app the only public site

**Why:** there are two Vercel projects. The obsolete **Next.js** project
(`swim-sight-3d.vercel.app`) still serves diagnostics, dummy clubs, and legacy
pages — that's the trust risk an auditor (and a coach) can find. The current
**Vite** project (`swim-sight-3d-v1.vercel.app`) is hardened and correct.
Source fixes and commits do **not** change what the old project serves; only the
dashboard actions below do. Do this before sending the app to any coach.

## 0. Commit + push the cleanup (on your Mac, where git works)

```bash
cd "Swim Sight 3D V1"
git add -A
git commit -m "Harden production surface for coach demo"
git push
```

(If the worker repo also has uncommitted work, commit it separately in
`swim-sight-ai-server` with its own message.)

## 1. Promote the Vite project to production
- If the v1 project auto-deploys from this repo, the push above creates a
  production deployment. Confirm it's marked **Production** in Vercel → v1
  project → Deployments.
- Otherwise promote the latest good deployment to Production in the dashboard.

## 2. Choose ONE canonical destination
- **Recommended:** add a custom domain (e.g. `app.swimsight…`) to the **v1**
  project and make every marketing link + the SEO canonical point to it.
- If staying on a vercel.app subdomain for now, treat
  `swim-sight-3d-v1.vercel.app` as the only URL you ever share.

## 3. Retire the obsolete Next.js project (do not just redeploy over it)
In Vercel → the old `swim-sight-3d` project → Settings:
1. **Git** → disconnect the connected repository (stops auto-redeploys).
2. **Domains** → remove every domain/alias attached to it.
3. **Delete Project**.
- Result: the old URL stops serving the stale app.

## 4. Catch anyone who has the old link
- If `swim-sight-3d.vercel.app` is indexed or shared anywhere, add a redirect to
  the new canonical URL (a tiny redirect project/domain rule), or let it 404 and
  request de-indexing in Google Search Console. A coach Googling you must not
  land on the dead build.

## 5. Verify env on the live (v1) project — only the right values
- `REQUIRE_CONSENT=true`, `CRON_SECRET` set, the worker callback secret set,
  Supabase **URL + anon key** present (anon key is public by design).
- **No service-role key** or other server-only secret exposed to the client
  bundle. If the old project ever exposed one, rotate it in Supabase.

## 6. Logged-out retest (incognito) on the NEW destination
- [ ] `/` — clean marketing homepage, no diagnostics panel, no anon key text.
- [ ] `/dashboard` — redirects to `/login` (no app shell flash).
- [ ] `/team-dashboard` — not walkable logged out (redirect or clean locked page).
- [ ] `/pilot-launch` — owner/admin only.
- [ ] A shared-report link — opens read-only, no internal coach notes / drag block.
- [ ] The **old** URL no longer serves the app.

## 7. After cutover
- Confirm SEO canonical + sitemap point to the new domain only.
- Keep the production regression test (diagnostics / dummy clubs / route guards)
  in CI so this can't regress.

**Rollback:** deleting the old project is irreversible, but it holds no data you
rely on (the real app + DB are the v1 project + Supabase). If unsure, first
*disconnect Git + remove domains* (steps 3.1–3.2) and confirm everything's fine
for a day before deleting.
