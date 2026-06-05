# Project Plan & Roadmap — "Cadence" (working name)

> One source of truth for what we're building and in what order. Written after a deliberate
> pause to stop reacting and plan. *"Cadence"* is a placeholder name — easy to change.

---

## 1 · Vision

A weekly **content-intelligence engine**: it finds the best-performing content in your niche
on X, explains *why* it worked, and drafts on-brand ideas — so a content team always knows
what to post and why. Born as a Bricx Labs take-home; growing into an open-source tool and a
potential SaaS.

**One-line:** *Know what to post, and why — every week.*

---

## 2 · Honest current state

**✅ Built & working**
- The agent: deterministic engine (score/filter/rank) + LLM agents (Analyst/Ideator/Packager)
- Knowledge: pattern taxonomy + dual-register brand voice
- Config: tiered accounts, topics, scoring knobs
- Sample dataset (labeled real/synthetic) + one full sample brief
- CLI (`npm run analyze`, `npm run weekly`) + headless brief generator
- Static dashboard (`web/`) + **interactive Next.js app** (`web-app/`)
- Weekly GitHub Actions cron (opens a PR for review)
- Docs: README (HLD/LLD + Mermaid), ARCHITECTURE, DECISIONS, SAAS_ARCHITECTURE, LOOM_SCRIPT
- Repo live, MIT licensed, clean commit history

**❌ Not built yet**
- **Astro/Cloudflare marketing site** (only empty folders exist)
- Real X data integration (Apify) — still on sample data
- Engine as a shared TypeScript package (currently duplicated: `src/` + `web-app/lib/engine/`)
- Multi-tenant SaaS (auth, DB, billing)
- The Loom recording (assignment deliverable)

---

## 3 · Locked decisions (don't relitigate)

1. **Sample data behind a swappable `DataProvider`** — live data is a one-file drop-in.
2. **Code vs LLM split** — deterministic math in code; judgement in the LLM.
3. **Two-axis scoring** — breakout (viral spike) vs baseline (durable formula).
4. **Distilled taxonomy file, not RAG** — RAG is a later-scale productionization story.
5. **Human-in-the-loop** — the agent drafts; a human approves before posting.
6. **Two surfaces** — a marketing site (SEO) separate from the app (interactive).
7. **Open source, MIT.**

---

## 4 · Open decisions — with recommendations (confirm or flip)

| Decision | Options | **Recommendation** |
|---|---|---|
| **Hosting** | (a) all-Cloudflare/Astro · (b) two surfaces: app on Vercel + marketing on Cloudflare | **(b) for now.** The app already works on Vercel; don't rebuild working software speculatively. Marketing → Astro/Cloudflare. Consolidate to all-Cloudflare later *only if* the second platform becomes a real pain. |
| **Engine duplication** | keep two copies · extract one shared package | **Extract** `packages/engine` (TS) in the monorepo phase — single source of truth. |
| **Monorepo** | now · later | **Phase 3.** Don't pay monorepo setup cost until we have ≥2 real apps to share code. |
| **Product name** | Cadence (placeholder) | Decide before public launch; not blocking. |
| **Real data** | Apify · official API | **Apify**, spiked in Phase 2 to measure true cost before pricing. |

---

## 5 · Target architecture (where we're heading)

```
Turborepo (Phase 3)
├─ apps/
│  ├─ marketing/   Astro + TS · Cloudflare Pages   ← SEO surface (Phase 1)
│  └─ app/         the interactive tool (Next.js for now) ← built
├─ packages/
│  ├─ engine/      scoring core, TS, shared          ← extract from src/ + web-app/lib
│  ├─ core/        Zod schemas (Post, Brief, Idea)
│  ├─ agents/      prompts + Anthropic runner
│  └─ providers/   sample | apify | xapi
└─ (Phase 4) db (Supabase) · auth (Clerk) · billing (Stripe)
```

---

## 6 · Phased roadmap

- **Phase 0 — Ship the assignment.** Record the Loom from `LOOM_SCRIPT.md`. *(Job deliverable; do not let the product work block this.)*
- **Phase 1 — Marketing site.** Astro + TS on Cloudflare Pages: SEO landing (hero, how-it-works, features, the flywheel) + waitlist. Deployable.
- **Phase 2 — Real data spike.** Implement the Apify provider, run end-to-end for ONE real account, **measure cost-per-run**. Gate: is the data economics sane?
- **Phase 3 — Monorepo + consolidation.** Turborepo; extract `packages/engine` (TS) as the single source of truth; tidy the app.
- **Phase 4 — Multi-tenant SaaS.** Supabase (DB) · Clerk (auth) · Stripe (billing) · per-workspace config + weekly cron.
- **Phase 5 — Growth.** Posting integrations (X OAuth / Typefully), analytics, and the programmatic-SEO flywheel (the agent writes the marketing site's ranking content).

---

## 7 · Immediate next 3 actions

1. **Record the Loom** (Phase 0) — closes the assignment.
2. **Build the Astro/Cloudflare marketing site** (Phase 1) — the missing surface.
3. **Apify data spike** (Phase 2) — de-risk the one thing that decides if this is a business.

> Rule for ourselves: **one phase at a time, finish before starting the next.** No more
> half-built surfaces. Update this file when a decision changes.
