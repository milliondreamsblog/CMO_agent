# SaaS Architecture — "Weekly Content Intelligence" (working title)

> Productizing the Bricx weekly content agent into a multi-tenant SaaS.
> This is the plan, honestly scoped. The engine we built ports over; ~80% of the work
> is the product *around* it. Read the **Risks & COGS** section first — it's the part
> that decides whether this is a business.

---

## 1 · What the product is

A weekly **"what to post and why"** engine for B2B/SaaS brands. Each workspace tracks a
set of X accounts; every week the product researches top posts, explains *why* they
worked, drafts on-brand ideas, and hands the user a brief — which they **approve/edit**
and (later) schedule.

**The wedge (differentiation):** existing tools — Typefully, Hypefury, Tweet Hunter —
*compose and schedule*. None do the **research → why → on-brand ideation** intelligence
layer. We're not a composer; we're the strategist that tells the composer what to make.
(We can even integrate *with* them for posting.)

**ICP:** seed–Series A SaaS founders, content/growth teams, and design/marketing agencies
(agencies = multi-brand power users — likely the best first customers).

---

## 2 · What ports vs what's new

| From the current repo | Becomes | Status |
|---|---|---|
| `src/core` (score/filter/rank) | `packages/engine` | ✅ reuse as-is (pure functions) |
| `agents/*.md` prompts | `packages/agents` + a Claude API runner | ✅ prompts done; add SDK runner |
| `src/providers` | `packages/providers` (apify/xapi/sample) | 🟠 implement Apify for real |
| `Post`/`Brief` shapes | `packages/core` (Zod schemas, shared types) | 🟠 formalize as Zod |
| `config/*.yaml` | per-workspace rows in the DB | 🔴 net-new (multi-tenant) |
| CLI `run-analysis.js` | a dev tool + the worker pipeline | 🟠 |
| — | web app, auth, billing, DB, jobs, dashboard | 🔴 net-new |

---

## 3 · Monorepo layout (Turborepo — your stack)

```
apps/
  web/                Next.js (App Router) — landing + dashboard — Vercel
packages/
  core/               Zod schemas (Post, Brief, Idea), shared types
  engine/             scoring · filter · rank   (ported, pure, unit-tested)
  agents/             analyst/ideator/packager prompts + Anthropic runner (prompt-cached)
  providers/          apify · xapi · sample  (one getPosts() contract)
  db/                 Drizzle schema + queries (Supabase Postgres)
  jobs/               the weekly pipeline as durable steps (Inngest)
infra/
  inngest functions, vercel cron triggers
```

`turbo` for build/caching, Vercel for `apps/web` + serverless + cron, Supabase for
Postgres, Clerk for auth, Inngest for durable jobs, Anthropic for LLM, Apify for data,
Stripe for billing, Resend for email.

---

## 4 · The pipeline as durable jobs

Per workspace, weekly. Use **Inngest** (or Vercel Workflow) so each step is retryable and
crash-safe — the multi-step LLM pipeline needs durability.

```
Vercel Cron (weekly)
   └─► enqueue one job per active workspace (staggered to respect rate limits)
         step 1  INGEST    providers.apify.getPosts(trackedAccounts, last7d) → upsert posts
         step 2  SCORE     engine.analyzePosts(posts, workspace.scoring)       (no tokens)
         step 3  ANALYST   Claude: why + patterns  (taxonomy + voice are prompt-cached)
         step 4  IDEATOR   Claude: on-brand ideas
         step 5  PACKAGE   Claude: fill brief → persist brief + ideas (status=draft)
         step 6  NOTIFY    Resend email: "your weekly brief is ready to review"
```

Each step writes to the DB so a failure resumes mid-pipeline. Cost + timing logged per run.

---

## 5 · Database schema (Postgres / Supabase, via Drizzle)

```
users               id, clerk_id, email
workspaces          id, name, brand_handle, cadence, plan, stripe_customer_id, created_at
memberships         user_id, workspace_id, role (owner|editor|viewer)

tracked_accounts    id, workspace_id, handle, tier, source(mirror|extension), why
brand_voice         workspace_id, pov, tone_rules(jsonb), do(jsonb), dont(jsonb), registers(jsonb)
voice_examples      id, workspace_id, text, approved_by, created_at   -- the learning loop (approved only)
scoring_config      workspace_id, weights(jsonb), thresholds(jsonb)

posts               id, workspace_id, tweet_id, author(jsonb), engagement(jsonb),
                    content(jsonb), created_at, ingested_at   -- unique(workspace_id, tweet_id)
runs                id, workspace_id, status, cost_cents, started_at, finished_at, error
analyses            id, run_id, ride(jsonb), engine(jsonb), excluded(jsonb), pattern_watch(jsonb)
briefs              id, workspace_id, run_id, week_of, markdown, status(draft|approved), created_at
ideas               id, brief_id, title, draft, amplify_draft, pattern, source_url,
                    why, status(pending|approved|edited|scheduled|posted)
pattern_library     workspace_id, pattern, seen, from_durable, from_trend, confidence  -- compounds weekly

subscriptions       workspace_id, stripe_sub_id, plan, status, current_period_end
```

Row-level security by `workspace_id`. Everything multi-tenant from day one.

---

## 6 · Auth & billing

- **Clerk** (native Vercel Marketplace) — users + **Organizations = workspaces**, roles,
  invites. Middleware-protected dashboard.
- **Stripe** — tiered subscriptions. Pricing **must clear data COGS** (see §8):
  | Plan | Tracked accounts | Briefs/mo | Seats | Notes |
  |---|---|---|---|---|
  | Starter | 15 | 4 | 1 | solo founder |
  | Growth | 40 | 4 | 3 | team |
  | Agency | 40 × N brands | 4 × N | seats | multi-workspace, best margin |
  - Usage caps enforced in-app; overage → upgrade prompt.

---

## 7 · Dashboard screens (the product surface)

1. **Onboarding wizard** — the magic moment:
   - "Define your industry" → suggest accounts, and **mirror-a-handle's-follow-graph**
     (the exact judgement move from the assignment, productized as a feature).
   - "Define your voice" → guided rules, *or* paste 5 posts → auto-distill a voice profile.
   - Set cadence.
2. **Weekly Brief** — Ride-Now / Build-the-Engine, Pattern Watch, the metric chips & badges.
3. **Approve / Edit** — per idea: edit the draft inline, approve → moves to "ready"
   (later: schedule via X OAuth or push to Typefully/Buffer). **This human-in-loop flow IS
   the product** — approved posts feed `voice_examples` and sharpen the voice.
4. **Pattern Analytics** — what's winning over weeks (from `pattern_library`).
5. **Settings** — accounts, voice, scoring weights, team, billing.

---

## 8 · Risks & COGS  ← read this first

**The make-or-break is data, not the frontend.**

- 🔴 **X data access & cost.** Apify charges per run; cost = accounts × workspaces × weeks.
  This is the recurring cost-of-goods. Mitigations: cache + dedupe, cap accounts per tier,
  stagger runs, share ingestion across workspaces tracking the same public accounts
  (one pull of @levelsio serves every workspace tracking him). **Action: in Phase 2, measure
  real cost-per-workspace before pricing.**
- 🔴 **X ToS / scraper fragility.** Scrapers break and violate ToS. Mitigation: the provider
  abstraction (swap actors fast), offer official-API tier for higher plans, degrade gracefully.
- 🟠 **LLM cost.** Per brief ≈ 3 Claude calls. Taxonomy + voice are static → **prompt-cache
  them** (90% off on cache hits). Modest and predictable; cheaper than the data.
- 🟠 **On-brand drift.** Human-in-loop approval + approved-only voice examples is the guardrail.
- 🟠 **Differentiation.** Stay the *intelligence* layer; don't try to out-compose Typefully.

**Rough COGS per workspace/month (validate in Phase 2):** Apify (dominant, variable) +
Anthropic (small, cached) + flat infra (Vercel/Supabase/Inngest base). Price the cheapest
plan at a comfortable multiple of measured COGS.

---

## 9 · Phased roadmap

```
Phase 0  Ship the assignment. Pitch this vision in the interview.            ← now
Phase 1  Landing page + waitlist (Next.js/Vercel). Validate demand. ~1 day.
Phase 2  Real data spike: Apify provider, ONE real workspace, end-to-end.
         → proves the hard part + reveals true COGS. (Gate: is the cost sane?)
Phase 3  Single-tenant dashboard: brief view + approve/edit, persist to Supabase.
         (Could run as "agency mode" — you operate it for paying clients first.)
Phase 4  Multi-tenant self-serve: Clerk auth, per-workspace config, Inngest cron,
         Stripe billing, onboarding wizard.
Phase 5  Posting integrations (X OAuth / Typefully), analytics, voice auto-distill.
```

**Smartest go-to-market:** start as **agency mode** (Phase 3) — run it manually for a few
paying SaaS/agency clients on real data. That validates value, funds the data cost, and
de-risks before building full self-serve. Many infra-heavy SaaS start as a service.

---

## 9b · Two surfaces: marketing site vs app (SEO decision)

The SaaS is **two separate deploys**, because their needs are opposite:

| | Marketing site | The app |
|---|---|---|
| Domain | `yourdomain.com` | `app.yourdomain.com` |
| Stack | **Astro + TypeScript on Cloudflare Pages** (static/hybrid) | the tool (Next/Astro-island), auth, stateful |
| Goal | rank, convert, load instantly | interactive, gated, dynamic |
| SEO | ✅ the whole point | ❌ irrelevant (content is behind interaction) |
| Surfaces | home · features · pricing · **blog/docs** | dashboard · briefs · settings |

- **Why Astro for marketing:** ships ~zero JS, static-first → top Core Web Vitals → ranks.
  Cloudflare = cheap, global edge, generous free tier. `@astrojs/cloudflare` adapter; the
  Anthropic SDK runs on Workers (fetch-based; may need `nodejs_compat`).
- **Why NOT pick the app framework for SEO:** the app's value is generated client-side from
  user input — nothing for crawlers to index. App framework choice is about DX/interactivity,
  not SEO. (For the *assignment* demo, SEO is moot entirely — it's a direct link.)
- **Growth flywheel:** the agent can generate the marketing site's SEO content —
  programmatic pages like "best B2B SaaS design accounts to follow (2026)" or weekly
  "what made the top design posts work." The product becomes its own content engine.

## 10 · Immediate next actions (when you start)

1. `npx create-turbo` → move `src/` into `packages/engine` + `packages/providers`.
2. Formalize `Post`/`Brief`/`Idea` as Zod in `packages/core`.
3. Build the Apify provider; run it for one real account; **log the cost.** (Phase-2 gate.)
4. Scaffold `apps/web` landing page + waitlist on Vercel.

Everything from `config/*.yaml` and `knowledge/*.md` becomes seed data / defaults for a
new workspace — the assignment artifacts are literally the product's starter template.
