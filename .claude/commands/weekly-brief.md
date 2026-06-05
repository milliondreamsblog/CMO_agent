---
description: Run the full weekly Bricx content pipeline and produce the brief
---

You are orchestrating the Bricx Labs weekly content agent. Run these steps in order.

## Step 1 — RESEARCH + ANALYZE (deterministic)
Run the scoring core:
```
npm run analyze
```
This reads the data provider, scores every post, applies the relevance filter and
controversy guard, ranks into Ride-Now / Build-the-Engine, and writes
`output/analysis.json`. Read that file.

## Step 2 — ANALYST (why)
Follow `agents/analyst.md`. Using `output/analysis.json` + `knowledge/pattern_taxonomy.md`,
explain *why* each shortlisted post worked, grounded in named patterns. Produce the
per-post analysis + the Pattern Watch tally.

## Step 3 — IDEATOR (on-brand ideas)
Follow `agents/ideator.md`. Using the Analyst output + `knowledge/brand_voice.md`,
produce 5–7 traceable, on-brand ideas split into Ride-Now and Build-the-Engine.

## Step 4 — PACKAGER (the brief)
Follow `agents/packager.md`. Fill `templates/brief_template.md` and write the final
brief to `briefs/<today>.md`.

## Human-in-the-loop
Stop after writing the brief and surface: (a) anything flagged ⚠ for verification,
(b) which drafts you're least sure are on-voice. The human approves/edits before any
post goes live, and approved posts are saved to `voice/examples/`.

## Notes
- Default provider is `sample`. To run on live data, implement an Apify/X-API provider
  (same `getPosts()` contract) — nothing else changes.
- For headless/cron hosting, the same four steps run via the Claude Agent SDK.
