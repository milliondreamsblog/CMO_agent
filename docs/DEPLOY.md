# Deploying the web-app to Vercel

The interactive app lives in `web-app/` (Next.js + a serverless `/api/brief` route that calls
Gemini). It is **already live** — deployed via the Vercel CLI (no token/secret needed):

> **Live:** https://web-app-self-mu.vercel.app

`Analyze` works fully (client-side). `Generate brief` needs `GEMINI_API_KEY` set in the Vercel
project env (see below).

---

## Redeploy (CLI — what we used)
From the repo, you're logged in as the Vercel user already, so:
```bash
cd web-app
npx vercel --prod      # deploys to production
```
`web-app/vercel.json` pins the framework/build + the `/api/brief` 60s timeout.

## Auto-deploy on every push (no secrets)
Link the repo to the Vercel project once, in the **dashboard** — this is cleaner than a CI token:
1. vercel.com → the `web-app` project → **Settings → Git** → **Connect** the `CMO_agent` repo.
2. Set **Root Directory = `web-app`**.
3. Now every push to `main` auto-deploys, with preview URLs per PR. No GitHub Actions, no tokens.

## Enable the live "Generate brief" button
Add the key to the project (then redeploy):
- **Dashboard:** project → **Settings → Environment Variables** → add `GEMINI_API_KEY` (+ optional `GEMINI_MODEL=gemini-2.5-flash`).
- **Or CLI:** `cd web-app && npx vercel env add GEMINI_API_KEY production` → paste the value → `npx vercel --prod`.

## Notes
- `web-app/.env.local` and `web-app/.vercel/` are **gitignored** — your key and project link never get committed.
- A GitHub Actions deploy workflow was intentionally removed (it needed Vercel tokens). The CLI +
  dashboard Git integration cover deployment without any secrets.
- The static dashboard (`web/`) can alternatively go on any static host, but it has no live brief
  generation (that needs the serverless route on Vercel).
