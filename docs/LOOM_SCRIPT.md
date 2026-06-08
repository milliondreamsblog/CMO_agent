# Loom Walkthrough Script (3–5 min)

Read naturally — a talking guide, not a teleprompter. `[SCREEN: …]` = what to show.
Target ~4.5 min. The four things they explicitly want: **what you built · where the human
stays in the loop · what breaks · your reasoning** (reasoning is weighted most).

**Tabs to have open, in order:** Sid's May-22 "hiring" post · the running app (localhost or
the Vercel URL) · `config/accounts.yaml` · `briefs/2026-06-03.md` (or the Brief tab) · `docs/DECISIONS.md`.

---

### 0:00 — Hook (~20s)
`[SCREEN: Sid's May-22 "hiring: X content strategist" post]`

> "This is a post Siddharth put up in May — hiring an X content strategist to *research trends
> and create viral content.* So instead of just pitching, I built the system that does the
> research-and-ideation half of that role, every week. It's called Cadence. Let me show you."

### 0:20 — What it does + the data decision (~40s)
`[SCREEN: the app — hero, then scroll to the import panel]`

> "Every week it does four things: pulls the top posts in our niche, works out *why* they
> performed, drafts on-brand ideas, and packages a brief a writer can run cold.
>
> First decision was data. The official X API is 200 dollars a month; scrapers are paid and
> fragile. The brief said they care more about the system than live data — so I isolated the
> data source behind a swappable adapter. I *did* wire a real Apify provider — and hit the
> paid-tier wall, which is exactly the fallback the brief blesses. So this runs on a curated
> sample set, and going live is a one-file swap. The constraint became a design decision."

### 0:55 — The thinking that matters (~55s)
`[SCREEN: config/accounts.yaml, then talk over the running board]`

> "Three judgement calls.
>
> **One — who we learn from.** I pulled Sid's own follow list — a strong design-craft cluster,
> but light on the SaaS founders he sells to. So Tier 1 mirrors his graph and I deliberately
> *extended* it. Copying his follows would inherit his blind spot.
>
> **Two — how I rank.** Not raw likes. Bookmarks weighted highest — a save is the strongest
> signal for insight content. And I score on two axes: a *breakout* — did this beat the
> author's own normal — versus a *baseline* — is this author consistently strong. A one-off
> viral spike and a repeatable formula teach different things, so the board splits into
> *Ride Now* and *Build the Engine*.
>
> **Three — the 'why' is grounded in named patterns**, in a small taxonomy file, not a vector
> DB. At this size it fits in one prompt and stays deterministic. RAG is the productionization
> story, not today's tool."

### 1:50 — Live demo (~70s)
`[SCREEN: app — click "Load sample data" → "Analyze"]`

> "Here it is. Click analyze — this half is pure code, no tokens. And you get a board.
>
> `[point at the columns]` Three color-coded lanes: Ride Now, Build the Engine, Filtered out.
> Each post renders as the actual tweet — so you see exactly what worked, with the engagement
> and our read layered on top.
>
> `[point at Filtered out → the Rolex post]` This vintage-Rolex post got **718 thousand views**
> — and the agent **excluded it**, because it's off-topic for SaaS UX. That's the difference
> between a real analyst and an engagement sort.
>
> `[point at the flagged post]` And this hot-take is flagged *verify, reply-heavy* — the
> controversy guard caught that its reach came from an argument, not value. So we don't teach
> the brand to make rage-bait.
>
> `[click the Brief tab]` And here's the brief it produces — each idea traces back: the source
> post, the pattern, *why* it worked, then a draft in Sid's voice, shown as a tweet preview.
> This Monday teardown is ready to post."
>
> `[toggle the theme once]` "Light or dark — built it to feel like a real product."

### 3:00 — Human in the loop + what breaks (~40s)
`[SCREEN: the brief's System Note section]`

> "Where the human stays in the loop: you own the inputs — the accounts and the voice — and you
> approve the brief before anything posts. The agent drafts; it never publishes. Approved posts
> feed back as voice examples — but only approved ones, so it doesn't drift into copying itself.
>
> What breaks or needs supervision: the data adapter is the fragile part — that's why it's
> isolated. The 'why' is a hypothesis, strongest when a pattern recurs over weeks. And anything
> flagged — like that controversial post — is handed to you, not acted on."

### 3:40 — System + close (~35s)
`[SCREEN: repo — DECISIONS.md / the weekly GitHub Action]`

> "Two things that make it a system, not a script: a pattern library meant to compound week
> over week, and it hosts on a weekly cron that opens a PR with the brief for review. Every
> decision is logged in a decisions doc. The whole thing is built in Claude Code — which is
> exactly the day-one job. Thanks for watching."

---

## Before you record
- [ ] App running and rehearsed once: **Load sample → Analyze → Brief tab → theme toggle**.
- [ ] Say the numbers out loud — **718K excluded**, **bookmarks-weighted**, **two-axis** — they're the memorable beats.
- [ ] Mention sample data **once, confidently** — it's a deliberate, brief-blessed choice, not an apology.
- [ ] Keep under 5:00. If long, trim section 0:55 (talk while scrolling the board).
- [ ] Optional 15-sec coda: *"and here's where I'd take it as a product"* → flash the SaaS architecture / Astro marketing site. Only if you're under time.
