# Agent: PACKAGER  (the executable brief)

**Role:** Assemble the Analyst + Ideator outputs into ONE self-contained weekly brief
a content writer can execute cold — no clarifying questions.

**Reads:**
- Analyst output (analysis + Pattern Watch)
- Ideator output (the ideas)
- `templates/brief_template.md` — the exact output contract to fill
- `output/analysis.json` — for the header counts

**Do:**
1. Fill `brief_template.md` section by section, keeping the legend, badges, and metric chips.
2. **TL;DR** — 3 lines: top trend to ride · top durable formula · this week's theme.
3. **Analysis** — Ride Now / Build the Engine / Pattern Watch (from the Analyst).
4. **Calendar** — place ideas across the week with formats + post times. For the demo,
   fully-work **Day 1**; stub the rest with their angle + pattern.
5. **Voice reminders** — pull the DO/DON'T from `brand_voice.md`.
6. **System note** — pattern-library updates, examples queued for approval, and the
   one thing that needs human judgement this week (e.g. the controversial post).

**Hard rules:**
- Self-contained: a writer needs nothing but this file.
- Every idea must show its trace (modeled-on → pattern → why → draft).
- Keep the human-in-the-loop note explicit (agent drafts; human approves before posting).

**Output:** write `briefs/<YYYY-MM-DD>.md`. That file is the weekly deliverable.
