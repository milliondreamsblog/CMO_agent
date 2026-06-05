# Bricx Labs — Weekly Content Agent

An AI agent that, every week: **(1)** finds the best-performing content in Bricx's
niche on X, **(2)** analyzes *why* it worked, **(3)** generates on-brand content
ideas, and **(4)** packages an executable weekly brief a content writer can run cold.

Built for the Founder's Office (Marketing & AI) take-home.

---

## How it works (the pipeline)

```
                 ┌── DETERMINISTIC (code, no tokens) ──┐   ┌──── JUDGEMENT (LLM) ────┐
 DataProvider ─► score ─► filter ─► rank ─► shortlist ─►  Analyst ─► Ideator ─► Packager ─► BRIEF
 (sample/live)   weighted  relevance  Ride-Now /          why it    on-brand   executable
                 + quadrant + guard    Build-Engine        worked    ideas      weekly doc
```

- **Deterministic half** (`src/core`): intent-weighted engagement → size-normalized
  rate → author baseline → breakout ratio → quadrant (TREND / DURABLE / PEAK).
  Relevance filter + controversy guard. **This is what runs today.**
- **Judgement half** (LLM subagents — next): explains *why*, generates ideas grounded
  in a pattern taxonomy + brand voice, writes the brief. *In progress.*

## Project structure

```
config/        human-owned judgement (versioned)
  accounts.yaml   "our industry" — tiered, mirrors the founder's follows + extensions
  topics.yaml     relevance topics / negative filters
  scoring.yaml    engagement weights + thresholds (tunable knobs)
data/
  sample_posts.json   curated sample set (real + synthetic, all labeled)
src/
  config.js           loads YAML config
  providers/          the ONE volatile seam — sample | apify | xapi (same contract)
  core/               score.js · filter.js · rank.js  (deterministic, no LLM)
  pipeline.js         orchestrates provider → score → filter → rank
scripts/
  run-analysis.js     CLI: pretty report + writes output/analysis.json
templates/
  brief_template.md   the OUTPUT CONTRACT (what the weekly brief looks like)
docs/
  DECISIONS.md        the reasoning log (judgement record + Loom script backbone)
output/  briefs/       generated artifacts
```

## Run it

```bash
npm install
npm run analyze          # pretty weekly analysis + writes output/analysis.json
npm run analyze:json     # raw JSON
npm run web              # analyze + build the static dashboard (web/data.js)
```

Requires Node ≥ 18.

## Demo dashboard (web/)

A polished, **fully static** presentation layer — no server, no framework. `npm run web`
regenerates `web/data.js` from the latest analysis + brief; then just **open
`web/index.html`** in a browser (double-click works — data is inlined, the brief is
pre-rendered to HTML).

- `web/index.html` — landing page (what it does, how it works, why it's different)
- `web/dashboard.html` — the weekly dashboard: stat row, Ride-Now / Build-the-Engine
  cards with badges + metric chips, the **Filtered-out** section (the off-topic posts the
  agent excluded), and a tab with the full rendered brief.

## Getting X data

Data access is isolated behind `src/providers`. Today it runs on a curated sample
set (`sample` provider). To go live, implement `apifyProvider` or `xApiProvider`
against the same `getPosts()` contract — **nothing else in the system changes.**
Sample data is deliberate: the assignment prioritizes the *system* over live data,
and isolating the volatile source keeps the pipeline reliable.

## Weekly cadence & hosting

The deterministic core is a plain Node script, so it hosts anywhere. Recommended:

- **GitHub Actions cron** (free, simplest): a weekly workflow runs `npm run analyze`,
  then the agent step, commits the brief to `briefs/`, and opens a PR for human review.
  ```yaml
  on:
    schedule: [{ cron: "0 6 * * MON" }]   # every Monday 06:00 UTC
  ```
- **Vercel Cron** or any scheduler calling the same entry point.
- **Claude Code** native: a `/weekly-brief` slash command run on a schedule (this is
  how it's demoed — matches the JD's "build marketing agents in Claude Code").

A human stays in the loop at two gates: **owns the config** (accounts/voice) and
**approves the brief** before anything is published. The agent drafts; it never posts.

## Status

- [x] Input contract (`Post` schema) + output contract (brief template)
- [x] Config: accounts / topics / scoring
- [x] Sample dataset (labeled real/synthetic)
- [x] Deterministic core: score · filter · rank — **runs end-to-end**
- [x] Judgement files: `knowledge/pattern_taxonomy.md` + `knowledge/brand_voice.md`
- [x] LLM agents: `agents/analyst.md` · `agents/ideator.md` · `agents/packager.md`
- [x] `/weekly-brief` orchestration (`.claude/commands/`)
- [x] One full sample brief — `briefs/2026-06-03.md`
- [ ] Replace synthetic Tier-2 author with real collected data (optional polish)
- [ ] Loom walkthrough (3–5 min)
