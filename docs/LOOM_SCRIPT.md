# Loom Walkthrough Script (3–5 min)

Read naturally — this is a talking guide, not a teleprompter. `[SCREEN: …]` = what to
show. Target ~4.5 min. The four things they explicitly want: **what you built · where the
human stays in the loop · what breaks · your reasoning.** Reasoning is weighted most.

---

### 0:00 — Hook  (~20s)
`[SCREEN: Sid's May-22 "hiring: X content strategist" post]`

> "Before I show the build — this is a post Siddharth put up in May: *hiring an X content
> strategist to research trends and create viral content.* So instead of pitching, I built
> the system that does the research-and-ideation half of that role, every week. Let me walk
> you through it."

### 0:20 — What it does + the one big call  (~40s)
`[SCREEN: README pipeline diagram]`

> "Every week it does four things: pulls top posts in our niche, figures out *why* they
> worked, generates on-brand ideas, and packages a brief a content writer can run cold.
>
> The first decision was data. The official X API is 200 dollars a month and rate-limited;
> scrapers break. The brief said they care more about the *system* than live data — so I
> isolated the data source behind a swappable adapter. Today it runs on a curated sample
> set; going live is one file, and nothing else changes. That turned the constraint into a
> system-design choice instead of a blocker."

### 1:00 — The thinking that matters  (~60s)
`[SCREEN: config/accounts.yaml, then scoring.yaml]`

> "Three judgement calls I want to flag.
>
> **One — who we learn from.** I pulled Sid's own follow list — it's a strong design-craft
> cluster, but light on the SaaS *founders* he sells to and the *format teachers*. So Tier 1
> mirrors his graph, and I deliberately *extended* it. Copying his follows would inherit his
> blind spot.
>
> **Two — how we rank.** Not raw likes. Bookmarks weighted highest — a save is the strongest
> signal for insight content. And I score on two axes: a *breakout* (did this beat the
> author's own normal?) versus a *baseline* (is this author consistently strong?). A one-off
> viral spike and a repeatable formula teach different things — so the brief splits into
> *Ride Now* versus *Build the Engine*.
>
> **Three — the why is grounded in named patterns**, in a small taxonomy file — not a vector
> DB. At this size it fits in one prompt and stays deterministic. RAG is the productionization
> story, not today's tool."

### 2:00 — Live demo  (~60s)
`[SCREEN: terminal — run `npm run analyze`]`

> "Here it is running. Pure code, no tokens — scoring and ranking are deterministic.
>
> `[point at output]` Two things I want you to see. This Rolex post got **718,000 views** —
> and the agent **excluded it**, because it's off-topic for SaaS UX. That's the difference
> between a real analyst and an engagement sort. And this Figma 'hot take' — flagged
> *verify, reply-heavy* — the controversy guard caught that its reach came from an argument,
> not value, so we don't teach the brand to make rage-bait.
>
> `[SCREEN: briefs/2026-06-03.md]` And here's the brief it produces. Every idea traces back:
> the source post, the pattern, *why* it worked, then a draft in Sid's actual voice — laddered
> to 'design moves a number.' This Monday teardown is ready to post."

### 3:00 — Human in the loop + what breaks  (~45s)
`[SCREEN: brief §5 System Note]`

> "Where the human stays in the loop: you own the inputs — the accounts and the voice rules —
> and you approve the brief before anything posts. The agent drafts; it never publishes. And
> approved posts feed back as voice examples — but *only* approved ones, never raw drafts, so
> it doesn't drift into copying itself.
>
> What breaks or needs supervision: the data adapter is the fragile part — that's why it's
> isolated. The 'why' is a hypothesis, strongest when a pattern recurs over weeks. And
> anything flagged — like that controversial post — is deliberately handed to you, not acted on."

### 3:45 — Close  (~30s)
`[SCREEN: repo structure / DECISIONS.md]`

> "Two last things that make it a system, not a script: a pattern library that compounds
> week over week, and it hosts on a simple weekly cron that opens a PR with the brief for
> review. Everything's runnable, every decision is logged. This is exactly the weekly
> operation the role is about — thanks for watching."

---

## Before you record
- [ ] `npm install` done; `npm run analyze` runs clean (rehearse once).
- [ ] Tabs open in order: Sid's May-22 post · README diagram · accounts.yaml · terminal · briefs/2026-06-03.md · brief §5.
- [ ] Say the numbers out loud (718K excluded, two-axis, bookmarks-weighted) — they're the memorable beats.
- [ ] Keep it under 5:00. If long, trim section 1:00 (talk while scrolling).
- [ ] Mention it's sample data once, confidently — it's a deliberate choice, not an apology.
