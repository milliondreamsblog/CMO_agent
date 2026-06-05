# Phase 2 — Real Data Spike (Apify)

> Goal: prove we can pull real X posts into the pipeline, and **measure the cost** — the one
> thing that decides whether this is a viable SaaS. *Run it small, look at the output, look at
> the bill.*

## 1 · Get an Apify token
- Sign up at [apify.com](https://apify.com) (free tier includes monthly credits).
- **Settings → Integrations → API tokens** → copy your token.

## 2 · Pick an actor
Default is [`apidojo/tweet-scraper`](https://apify.com/apidojo/tweet-scraper) — popular, returns
tweets with author + engagement (likes/reposts/replies/quotes/bookmarks/views). You can swap any
X scraper via `APIFY_ACTOR`. Check its **pricing** and **input/output schema** pages.

## 3 · Configure
```bash
cp .env.example .env        # then edit:
#   APIFY_TOKEN=apify_api_...
#   PROVIDER=apify
#   MAX_ACCOUNTS=3          # start tiny — cost control
#   APIFY_MAX_ITEMS=100
```
Load the env (Windows PowerShell): `Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim()) } }`
Or just set them inline: `$env:PROVIDER='apify'; $env:APIFY_TOKEN='...'`.

## 4 · Run it (small)
```bash
npm run analyze            # now hits Apify instead of sample data
```
- The provider logs `[apify] … fetched N items` to stderr.
- It writes `output/analysis.json` exactly as before — **the rest of the pipeline doesn't change.**

## 5 · ⚠️ First-run mapping check
Different actors name fields differently. If engagement/followers come back as `0`, open
`src/providers/apifyProvider.js`, temporarily log a raw item:
```js
const items = await res.json();
console.error(JSON.stringify(items[0], null, 2));   // inspect once
```
…then adjust the field names in `normalizeTweet()`. Discovering the real shape **is** the spike.

## 6 · Measure the cost (the actual deliverable)
- Apify Console → **Runs** → open this run → see **$ cost** + **compute units**.
- Compute **cost per post** = run cost ÷ items fetched.
- Extrapolate: `cost_per_workspace_week ≈ cost_per_post × posts_per_week`, and
  `× number_of_workspaces` for the SaaS.

## 7 · The gate decision
Write the numbers in `docs/DECISIONS.md`:
- ✅ **Sane** (cost-per-workspace-week << what a plan can charge) → proceed to Phase 3/4.
- ⚠️ **Too high** → mitigations: cache + dedupe, share ingestion across workspaces tracking the
  same public account, cap accounts/tier, or move heavy tiers to the official API. Re-measure.

## Notes
- `run-sync-get-dataset-items` has a ~5-min limit — fine for a small spike. For many accounts,
  switch to an async run + dataset fetch.
- Keep `MAX_ACCOUNTS` / `APIFY_MAX_ITEMS` low until you've seen one real bill.
