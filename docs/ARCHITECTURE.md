# Architecture — visual

Diagrams render natively on GitHub (Mermaid). They're **diagrams-as-code** — versioned and
diffable, never stale PNGs.

---

## How to build these — a principal engineer's guide to a senior designer

Before the diagrams, the rules they follow. If you're (re)drawing system architecture, this is
the rubric:

1. **Pick an altitude and stay there (C4 model).** Four levels — **Context** (who uses it +
   external systems), **Container** (the major deployable/runtime pieces), **Component** (modules
   inside a container), **Code** (rare; only the gnarly bits). *One diagram = one altitude.* The
   most common failure is mixing "user" and "a for-loop" in the same picture.

2. **One diagram answers one question.** State it in a sentence first. *"How does data flow each
   week?"* *"How is a post classified?"* If you can't name the question, the diagram is unfocused
   and will accrete boxes until it's wallpaper.

3. **Show boundaries, not just boxes.** The value is in the *lines you group*. Use subgraphs for
   **trust/runtime boundaries** — deterministic-vs-LLM, client-vs-server, our-code-vs-vendor.
   Boundaries are where the design decisions live.

4. **Direction encodes meaning.** Left→right for pipelines and time; top→down for decisions and
   hierarchy. Be consistent — readers infer flow from layout before they read a single label.

5. **Name nodes by responsibility, not technology.** "Data Provider", not "Apify". The diagram
   should survive a vendor swap. Put the tech in a sub-label or a deployment view.

6. **Give node types distinct shapes + a legend.** Process `[ ]`, decision `{ }`, datastore
   `[( )]`, external/human a different shape. The eye should parse type before reading text.

7. **Mark the human and the fragile seams explicitly.** Where a human approves, and where the
   system touches something it doesn't control (an API, a scraper) — those are the two places
   reviewers care about most. Make them impossible to miss.

8. **Progressive disclosure.** Start at Context. Drill down *only* where the complexity earns a
   second diagram. Don't draw the Component view of a box nobody asks about.

9. **Label the edges that aren't obvious.** An arrow's meaning ("emits posts[]", "approved →
   voice examples") is often more important than the box. Unlabeled arrows hide the contract.

The diagrams below are ordered by altitude: **Context → Container → Flow → Decision → Sequence →
Web → Deployment.**

---

## 1 · System Context  *(Q: who and what does the agent talk to?)*

```mermaid
flowchart LR
    user["👤 Marketing Operator<br/>owns config, approves briefs"]
    x["🐦 X data<br/>via Apify / X API / sample"]
    claude["🧠 Anthropic Claude<br/>LLM reasoning"]
    agent(["⚙️ CMO Agent<br/>weekly content intelligence"])
    brief["📄 Weekly Brief<br/>ready-to-post ideas"]

    user -->|defines accounts & voice| agent
    x -->|top posts| agent
    agent -->|Analyst / Ideator / Packager prompts| claude
    claude -->|why + ideas + drafts| agent
    agent -->|generates| brief
    brief -->|reviews & approves| user
```

## 2 · Container / HLD  *(Q: what are the major building blocks, and where's the deterministic-vs-LLM boundary?)*

```mermaid
flowchart TB
    subgraph IN["📥 Inputs — human-owned"]
        cfg["config<br/>accounts · topics · scoring"]
        kn["knowledge<br/>taxonomy · brand voice"]
    end

    subgraph DET["⚙️ Deterministic core — code, no tokens"]
        prov["Data Provider<br/>sample | apify | xapi"]
        score["Score<br/>weighted → rate → baseline → quadrant"]
        filt["Filter<br/>relevance + controversy guard"]
        rank["Rank<br/>Ride-Now / Build-Engine"]
    end

    subgraph JUDGE["🧠 Judgement — LLM agents"]
        an["Analyst<br/>why it worked"]
        id["Ideator<br/>on-brand ideas"]
        pk["Packager<br/>the brief"]
    end

    state[("state<br/>pattern library")]
    brief["📄 briefs/[date].md"]

    cfg --> prov --> score --> filt --> rank
    rank --> an --> id --> pk --> brief
    kn --> an
    kn --> id
    pk --> state
    state -. compounds weekly .-> an
```

## 3 · Weekly pipeline flow  *(Q: what happens each week, and where does a human gate it?)*

```mermaid
flowchart TD
    start([Weekly trigger]) --> g1{{"👤 gate: config current?"}}
    g1 --> fetch["Fetch top posts<br/>(last 7 days)"]
    fetch --> score["Score<br/>weighted · rate · baseline · breakout"]
    score --> filter["Filter relevance<br/>+ flag controversy"]
    filter --> rank["Rank → Ride-Now / Build-Engine"]
    rank --> analyst["Analyst: why + patterns"]
    analyst --> ideator["Ideator: on-brand drafts"]
    ideator --> packager["Packager: assemble brief"]
    packager --> g2{{"👤 gate: approve / edit"}}
    g2 -->|approved| publish["Publish<br/>+ save approved → voice examples"]
    g2 -->|needs work| ideator
    publish --> done([Done])
```

## 4 · Scoring decision logic  *(Q: how is a single post classified into a quadrant?)*

```mermaid
flowchart TD
    p["Post"] --> rel{"relevant?<br/>(topic match)"}
    rel -->|no| excl[["excluded (off-topic)"]]
    rel -->|yes| w["weighted = Σ wᵢ · actionᵢ"]
    w --> r["rate = weighted / (views or followers)"]
    r --> base{"author reliable?<br/>≥3 posts AND medWeighted ≥ 25"}
    base -->|no| unrated[["unrated (context only)"]]
    base -->|yes| bo["breakout = weighted / medWeighted<br/>baseline_pct = rank of medRate"]
    bo --> q1{"breakout ≥ 2.0 ?"}
    q1 -->|yes| q2{"baseline ≥ p66 ?"}
    q1 -->|no| q3{"baseline ≥ p66 ?"}
    q2 -->|yes| peak["⭐ PEAK<br/>Ride-Now + Build-Engine"]
    q2 -->|no| trend["🔥 TREND<br/>Ride-Now"]
    q3 -->|yes| dur["🏗 DURABLE<br/>Build-Engine"]
    q3 -->|no| noise["· noise — drop"]
```

## 5 · Weekly run sequence  *(Q: in what order do the parts collaborate over time?)*

```mermaid
sequenceDiagram
    autonumber
    participant C as Cron
    participant P as Data Provider
    participant E as Core Engine
    participant K as Knowledge
    participant L as Claude (3 agents)
    participant H as Human

    C->>P: getPosts(accounts, last 7 days)
    P-->>E: posts[]
    E->>E: score · filter · rank
    E-->>L: shortlist (ride / engine)
    K-->>L: taxonomy + brand voice
    L->>L: Analyst → Ideator → Packager
    L-->>H: briefs/[date].md (draft)
    H->>H: review / edit
    H-->>K: approved posts → voice examples
```

## 6 · Web app request flow  *(Q: what runs in the browser vs on the server, and where's the key?)*

```mermaid
flowchart LR
    u["👤 User"] -->|paste JSON| page["page.js<br/>(browser)"]
    page -->|Analyze| eng["lib/engine<br/>(client-side, no key)"]
    eng -->|dashboard| page
    page -->|Generate brief| api["/api/brief<br/>(serverless)"]
    api -->|system prompt + analysis| claude["🧠 Anthropic Claude"]
    claude -->|brief markdown| api
    api --> page
    key[["ANTHROPIC_API_KEY<br/>server-only"]] -. injected .-> api
```

## 7 · Deployment view  *(Q: where does each piece actually run?)*

```mermaid
flowchart TB
    subgraph local["Local / CI"]
        cli["CLI<br/>npm run analyze"]
        gha["GitHub Actions<br/>weekly cron"]
    end
    subgraph vercel["Vercel"]
        web["web-app (Next.js)"]
        fn["/api/brief<br/>serverless fn"]
    end
    subgraph cf["Cloudflare Pages"]
        mkt["marketing site<br/>(Astro, SEO)"]
    end
    anthropic["🧠 Anthropic API"]
    repo["briefs/ → PR<br/>for human review"]

    gha --> repo
    web --> fn --> anthropic
    cli --> repo
```

---

### Why these seven, and not one big one
Each answers a single question at a single altitude (rule 1 + 2). A reader new to the system
goes **1 → 2** and understands the shape in 60 seconds; an implementer drops into **4** or **6**
for the part they're touching. That's progressive disclosure (rule 8) — the whole point of
having more than one diagram instead of one unreadable mural.
