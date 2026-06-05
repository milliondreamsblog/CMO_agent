# Decision Log — Bricx Labs Weekly Content Agent

> The *reasoning* behind the build. This is the thinking-and-judgement record
> (35%) and the script backbone for the Loom (10%). Append-only; newest at top
> of each section. Dates are the decision dates.

---

## 0 · The framing (2026-06-02)

- **The assignment IS the job.** PDF 2 (the role) asks for someone to build Claude
  Code marketing agents; PDF 1 (the take-home) asks us to build exactly that. So
  we build it as if already employed — native to Claude Code, not a one-off script.
- **Grade weights drive priorities:** Execution 40% · Judgement 35% · System 15% ·
  Comms 10%. 75% is judgement + "it runs," not live data.

## 1 · Data strategy (2026-06-02)

- **Decision:** build the full pipeline on curated *sample data* behind a swappable
  `DataProvider` (Sample / Apify / XApi). Demo runs on Sample.
- **Why:** the assignment says sample data is "completely fine" and that they care
  about the *system* over live data. Official X API is ~$200/mo + rate-limited;
  scrapers break mid-demo. Isolating the volatile source behind one adapter turns
  the constraint into a system-design win and guarantees "it runs" (40%).

## 2 · Architecture, from first principles (2026-06-02)

- Designed by **contracts first**: lock the input (`Post`) and output (`Brief`)
  schemas; the middle is pure transformation.
- **Isolate volatility:** data source = one adapter; config (accounts/voice) =
  files; logic = stable core.
- **Code vs LLM split:** deterministic math (scoring, ranking) in code; judgement
  (why-it-worked, ideation) in LLM subagents. Never ask the LLM to do arithmetic;
  never ask code to judge a hook.
- **State = memory:** a `pattern_library.json` that compounds weekly is what makes
  this a *system*, not a script.
- **Human trust boundary:** human owns config (before) + approves the brief
  (after); the middle is automated. The agent drafts, it never auto-posts.

## 3 · Scoring (2026-06-02)

- **Not raw likes.** Intent-weighted engagement: bookmarks/quotes weighted high
  (save = strongest signal for insight content), likes low. Weights live in
  `scoring.yaml` — tunable hypotheses, not hardcoded truths.
- **Two-stage normalization:** ÷ reach (views→followers) to kill big-account bias,
  then ÷ the author's own median to isolate "*this post* beat *this author's* norm."
- **Reply guard:** abnormally reply-heavy posts are flagged "verify" (controversy/
  ratio ≠ quality) so we don't teach the writer to make rage-bait.

## 4 · The two-axis insight (2026-06-02)  ★ key judgement

- A one-off viral spike ≠ a consistently strong author. They teach different things.
  - **Breakout** (post vs own median) → a *trend* to ride; low confidence (n=1),
    high urgency.
  - **Baseline** (author's sustained rate) → a *durable formula* to build into the
    rotation; high confidence (n=many), evergreen.
- Plotted as a 2×2 → quadrants TREND / DURABLE / PEAK / noise. The brief splits into
  **🔥 Ride Now** vs **🏗 Build the Engine**. Consistency = statistical confidence
  in a pattern. For an agency wanting a sustainable engine, the durable performer is
  *more* valuable than the lucky viral hit.

## 5 · Pattern analysis: taxonomy, not RAG (2026-06-02)

- Ground "why it worked" in named copywriting/growth frameworks (PAS, curiosity-gap,
  case-study teardown, etc.) so analysis is *transferable* ("use PAS"), not vague
  ("strong hook").
- **Decision: a distilled `pattern_taxonomy.md` (~2k tokens), NOT a vector DB.**
  At this corpus size, prompt caching makes "read all patterns in one pass" nearly
  free and fully deterministic; RAG would add infra + a wrong-retrieval failure mode
  for no token saving. RAG is the *productionization* story (when the corpus grows
  to hundreds of full essays).
- Guards: allow "no clear framework — timing/authority/novelty"; treat patterns as
  hypotheses ranked by frequency, not proven causes.

## 6 · Output contract — the Brief (2026-06-02)

- Week-shaped **content calendar**; demo fully-works Day 1, stubs the rest (token
  economy; one deep example > seven shallow).
- Every post/idea carries a **badge + metric chip** so a writer sees why it's here
  and what to do with it. Every idea traces: modeled-on post → pattern → why →
  on-brand draft. File: `templates/brief_template.md`.

## 7 · Voice + audience target (2026-06-03)  ★ grounded in real data

- Studied the real accounts. **@bricxlabs is dormant** (110 followers, 1 following,
  portfolio dumps at 0–3 likes). **@siddharthvij_ is the live channel** (10.5K;
  build-in-public + community questions at 2–13K views). The one brand-account
  breakout was a *repost of an employee* — humans beat the faceless feed.
- **Decision: target = BOTH** — primary drafts in Sid's founder voice for his
  account, plus a lighter "brand-amplify" variant @bricxlabs reposts. Reflects how
  agencies actually run and revives the dead brand account by riding the founder.
- **Empirical Bricx voice:** lowercase, direct, founder-casual; positioning = SPEED
  for AI & B2B SaaS; winning formats = community questions + build-in-public proof
  (numbers + visual). Their stated pillar (insights/case studies) is the *empty
  shelf* the agent fills.
- **Voice learning loop:** `brand_voice.md` (rules) is human-owned; `voice/examples/`
  grows — but ONLY from human-approved posts, never raw drafts (avoids model drift).
- **Loom hook:** Sid's May-22-2026 post hiring an "X content strategist to research
  trends and create viral content" — this agent is that role, productized.

## 8 · Account selection (2026-06-03)  ★ key judgement

- Pulled @siddharthvij_'s follows: an **Indian product-designer cluster** — great for
  design craft + peer resonance, but light on the *buyers* (SaaS founders) and the
  *format teachers* (build-in-public / growth operators).
- **Decision:** Tier 1 **mirrors** his graph (design craft); Tiers 2–4 **extend**
  beyond it (SaaS founders, growth operators, AI builders) to cover who Bricx sells
  to and the structures we want to learn. Mirroring alone would inherit his blind
  spot; extending shows independent judgement. Full list + per-account why + exclusions
  in `config/accounts.yaml`.

## 9 · Competitive watch tier (2026-06-03)

- **Decision:** add `tier_5_competitive_watch` — rival SaaS/UX design agencies. Same
  audience + angle = the most directly *transferable* signal, plus a read on
  white-space (what rivals aren't covering = Bricx's lane).
- Handled differently: *learn the pattern, differentiate the angle* (never copy a
  competitor's voice), and tag ideas as "competitor pattern → Bricx's distinct spin."
- **Caveat:** most agency *brand* accounts are dead portfolio feeds (like @bricxlabs);
  prioritize **founder-led** competitor accounts that actually post. Candidate agencies
  (Eleken/Procreator/Ramotion/Clay/Halo Lab) are unverified — must confirm X activity
  and find founder handles before live use.

## 10 · Sample dataset (2026-06-03)

- Built `data/sample_posts.json` — 27 posts / 6 accounts. Every post tagged
  `real` vs `synthetic`; estimated follower counts flagged. Real posts carry real
  text + real visible stats; synthetic posts round out author baselines (median
  needs multiple posts/author) and exercise edge cases.
- Deliberately engineered to demonstrate: a DURABLE author (saas_teardowns) for
  "Build the Engine", a PEAK, two TREND breakouts (Jeevanshu rant, Vishal launch),
  the controversy guard (jn-005: replies >> likes), the relevance filter (luusssso
  Rolex post: 718K views but off-topic -> excluded), and the dead-brand contrast
  (bricxlabs). The filter + guard are the "judgement, not just engagement-sort" proof.
- `saas_teardowns` is a labeled synthetic stand-in for a real Tier-2 build-in-public
  author (@thepatwalls/@levelsio), to be replaced when that data is collected.

## 11 · Deterministic core built + running (2026-06-03)

- Node.js (ESM), one dep (js-yaml), hostable anywhere. Structure: config/ (judgement)
  · data/ · src/providers (the volatile seam) · src/core (score/filter/rank) ·
  scripts/run-analysis.js. README documents structure + GitHub-Actions-cron hosting.
- **Validated on sample data — every designed behavior fired:**
  - Relevance filter EXCLUDED the 718K-view off-topic Rolex post (judgement, not an
    engagement sort) while ranking a lower-view on-topic teardown #1.
  - Controversy guard flagged the Figma hot-take (replies >> likes) with ⚠ verify.
  - Quadrants correct: Pastery launch = TREND (21.6×), saas_teardowns = DURABLE engine,
    Sid milestone + audit thread = PEAK.
  - Baseline guard left the dead @bricxlabs account `unrated` instead of false-crowning it.
- Design note: breakout = weighted engagement vs author's own median (a self-relative
  *reach+engagement* spike); baseline percentile = size-normalized rate vs other authors
  (cross-author consistency). Two different bases on purpose.

## 12 · Judgement files + agent layer + first brief (2026-06-03)

- `knowledge/pattern_taxonomy.md` — ~30 named patterns across hook/structure/angle/
  format/timing, each with a "tell" + why, plus a No-pattern honesty guard. Flat file,
  not RAG (fits one prompt, caches, deterministic).
- `knowledge/brand_voice.md` — dual register (founder primary @siddharthvij_ + brand
  amplify @bricxlabs), grounded in real posts; DO/DON'T; gold-standard examples; learning
  loop (approved posts only).
- Agent prompts: `agents/analyst.md` (why), `agents/ideator.md` (on-brand ideas),
  `agents/packager.md` (the brief). Orchestrated by `.claude/commands/weekly-brief.md`.
- Generated the first full sample brief `briefs/2026-06-03.md`: TL;DR, Ride-Now/Engine
  analysis with grounded "why", Pattern Watch, a fully-worked Day-1 teardown thread in
  Sid's voice (+ brand-amplify variant), stubs for Tue–Fri, voice reminders, and a
  human-in-the-loop system note that explicitly flags the controversial post + the
  launch-spike. Demonstrates traceability (idea → pattern → why → draft) end to end.

## 13 · SaaS architecture plan (2026-06-03)

- On request, scoped productizing the agent into a multi-tenant SaaS: `docs/SAAS_ARCHITECTURE.md`.
- Honest conclusions: the engine ports cleanly, but ~80% of a SaaS is the surrounding
  product; the make-or-break is **X data access + cost (Apify COGS)**, not the frontend;
  the wedge is the *intelligence layer* (research→why→ideation), not composing/scheduling;
  smartest GTM is **agency mode first** (run it for paying clients on real data before
  self-serve). Phased roadmap (landing→data spike→single-tenant dashboard→multi-tenant).
- Out of scope for the assignment — captured as the "where I'd take this" interview pitch.

## 14 · MVP web presentation (2026-06-03)

- Built a polished, **fully static** demo layer (`web/`): `index.html` landing page +
  `dashboard.html`. `npm run web` regenerates `web/data.js` from the real analysis + brief;
  the brief is pre-rendered to HTML so it opens by double-click — no server, offline-safe,
  won't break mid-Loom.
- Dashboard shows the stat row, Ride-Now / Build-the-Engine cards (badges + metric chips +
  ⚠ flag), the **Filtered-out** section (the excluded 718K off-topic post — the judgement
  proof), and a tab with the full rendered brief. Replaces the terminal in the demo.

---

## ✅ SUBMISSION SUMMARY (final — 2026-06-03)

**Deliverables**
1. **The agent** — `src/` (deterministic core), `agents/` + `.claude/commands/` (LLM layer),
   `config/` + `knowledge/` (judgement), `providers/` (swappable data), `README.md`
   (run + hosting). Runs: `npm install && npm run web`.
2. **Sample output** — `briefs/2026-06-03.md` (+ viewable in the dashboard).
3. **Loom** — script ready in `docs/LOOM_SCRIPT.md` (record to finish).

**What it demonstrates** — research → grounded "why" → on-brand ideation → executable brief;
size-relative two-axis scoring (viral vs durable); relevance filter + controversy guard
(judgement, not an engagement sort); human-in-the-loop; a compounding pattern library;
a productionization + hosting story.

**Known limitations (stated honestly)** — runs on a curated sample set behind a swappable
adapter (live data is a one-file drop-in); `saas_teardowns` is a labeled synthetic stand-in
for a real Tier-2 author; consistency/baseline sharpens over weeks as the pattern library fills.

**Remaining (human):** record the Loom; optionally swap in real Tier-2 data.

*End of log.*
