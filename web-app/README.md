# Bricx Content Engine — Web App

An interactive, hostable demo of the weekly content agent. **Paste a week of X posts as
JSON → Analyze (in-browser) → Generate brief (LLM).**

## What's where
- `lib/engine/` — the deterministic scoring core, ported from the CLI (pure JS, runs client-side)
- `lib/defaultConfig.js` — scoring weights/thresholds · `lib/samplePosts.js` — the "Load sample" data
- `app/page.js` — the tool UI (import → analyze → dashboard → brief)
- `app/api/brief/route.js` — serverless route that calls Claude (holds the API key server-side)
- `lib/prompts.js` — the Analyst+Ideator+Packager system prompt (taxonomy + brand voice)

## Run locally
```bash
cd web-app
npm install
cp .env.example .env.local      # add your ANTHROPIC_API_KEY for the brief button
npm run dev                     # http://localhost:3000
```
The **Analyze** step works with no key (pure client-side). The **Generate brief** button needs
`ANTHROPIC_API_KEY`.

## Deploy to Vercel
1. Push this folder to a Git repo (or `vercel` from the CLI).
2. In Vercel: **New Project** → set **Root Directory** to `web-app`.
3. Add env var **`ANTHROPIC_API_KEY`** in Project Settings → Environment Variables.
4. Deploy. The analysis runs on the client; the brief runs as a serverless function.

## Data format
Paste an array of posts (or `{ "posts": [...] }`). Each post:
```jsonc
{
  "author": { "handle": "...", "followers": 10500 },
  "engagement": { "likes": 0, "reposts": 0, "replies": 0, "quotes": 0, "bookmarks": 0, "views": 0 },
  "content": { "text": "..." }
}
```
Click **Load sample data** to see the expected shape.

## Note
For a public demo, consider light rate-limiting on `/api/brief` to cap LLM cost.
