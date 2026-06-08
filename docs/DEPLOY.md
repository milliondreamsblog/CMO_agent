# Deploying the web-app to Vercel

The interactive app lives in `web-app/` (Next.js + a serverless `/api/brief` route that calls
Gemini). There are **two ways** to deploy — pick ONE.

---

## Option A — Vercel dashboard (recommended, simplest, no YAML)

1. Go to **[vercel.com](https://vercel.com)** → sign in with GitHub.
2. **Add New → Project** → import the `CMO_agent` repo.
3. **Root Directory → `web-app`** (click Edit and select the folder). ← the step people miss.
4. Framework auto-detects **Next.js**. Leave build settings default (`vercel.json` pins them anyway).
5. **Environment Variables** → add:
   - `GEMINI_API_KEY` = your key (`AIza…`)  *(get one free at aistudio.google.com/apikey)*
   - *(optional)* `GEMINI_MODEL` = `gemini-2.5-flash`
6. **Deploy** → live `*.vercel.app` URL in ~1 min. Auto-deploys on every push, with preview URLs per PR.

That's it. `Analyze` runs client-side (no key needed); `Generate brief` uses the serverless route + your key.

---

## Option B — GitHub Actions (`.github/workflows/deploy.yml`)

Use this if you want CI-controlled deploys instead of the dashboard integration.
**If you use this, disable the dashboard auto-deploy** (or delete the workflow) so you don't double-build.

**One-time setup:**
1. Locally: `cd web-app && npx vercel link` → creates `web-app/.vercel/project.json` with your `orgId` + `projectId`.
2. Add three **repo secrets** (Settings → Secrets and variables → Actions):
   - `VERCEL_TOKEN` — Vercel → Account Settings → Tokens
   - `VERCEL_ORG_ID` — the `orgId` from `project.json`
   - `VERCEL_PROJECT_ID` — the `projectId` from `project.json`
3. In the **Vercel project's** Environment Variables, set `GEMINI_API_KEY` (the workflow pulls these via `vercel pull`).

Then every push to `main` that touches `web-app/**` builds and deploys to production. Run on demand from the Actions tab.

---

## Files
- `web-app/vercel.json` — pins framework/build + the `/api/brief` function timeout (60s).
- `.github/workflows/deploy.yml` — the Actions deploy pipeline (Option B).

## Notes
- `web-app/.env.local` is **gitignored** and does NOT deploy — set `GEMINI_API_KEY` in Vercel env.
- The static dashboard (`web/`) can alternatively go on any static host (GitHub Pages / Netlify),
  but it has no live brief generation — that needs the serverless route (Vercel).
