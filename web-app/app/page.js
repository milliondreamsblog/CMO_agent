'use client';

import { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import { runAnalysis } from '../lib/engine';
import { defaultConfig } from '../lib/defaultConfig';
import { samplePosts } from '../lib/samplePosts';
import { parseBrief, parseSlots } from '../lib/parseBrief';

const BADGE = {
  proven_peak: { cls: 'proven_peak', icon: 'star', text: 'PEAK' },
  durable: { cls: 'durable', icon: 'layers', text: 'DURABLE' },
  trend: { cls: 'trend', icon: 'zap', text: 'TREND' },
  noise: { cls: 'noise', icon: null, text: 'noise' },
  unrated: { cls: 'unrated', icon: null, text: 'unrated' },
};

const AVATAR_COLORS = ['#c6f24e', '#7ed957', '#ff9d4d', '#ffd43b', '#5ed3e0', '#c08bff'];
function avatarColor(handle) {
  let h = 0;
  for (const c of handle) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
const fmt = (n) => {
  n = n || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};
function chipText(m) {
  const b = m.breakout != null ? `breakout ${m.breakout.toFixed(2)}×` : '';
  const base = m.baseline_pct != null ? ` · baseline p${Math.round(m.baseline_pct)}` : '';
  return b + base;
}

/* ---- minimalist (stroke) icon set ---- */
const ICONS = {
  trendingUp: (<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>),
  layers: (<><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>),
  ban: (<><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>),
  star: (<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />),
  zap: (<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>),
  moon: (<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />),
  sparkle: (<path d="M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.4l-1.9-5.8L4.3 10.7l5.8-1.9L12 3Z" />),
  dot: (<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />),
  arrow: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  alert: (<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  megaphone: (<><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>),
  info: (<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>),
};
function Ico({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      {ICONS[name]}
    </svg>
  );
}

/* ---- X engagement icons (filled) ---- */
const PATHS = {
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z',
  views: 'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z',
};
const TIcon = ({ d }) => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>);
const Verified = () => (
  <svg className="verified" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
  </svg>
);

function Tweet({ p, excluded, i, note }) {
  const e = p.engagement || {};
  const m = p.metrics || {};
  const b = BADGE[m.quadrant] || { cls: '', icon: null, text: m.quadrant || '' };
  const handle = p.author.handle;
  return (
    <article className={`tweet ${excluded ? 'excluded' : ''}`} style={{ '--i': i }}>
      <div className="tw-avatar" style={{ background: avatarColor(handle) }}>{handle[0].toUpperCase()}</div>
      <div className="tw-body">
        <div className="tw-head">
          <span className="tw-name">{p.author.name || handle}</span>
          {p.author.verified && <Verified />}
          <span className="tw-handle">@{handle}</span>
          {excluded
            ? <span className="badge badge-off"><Ico name="ban" size={11} />off-topic</span>
            : b.text && <span className={`badge ${b.cls}`}>{b.icon && <Ico name={b.icon} size={11} />}{b.text}</span>}
        </div>
        <div className="tw-text">{(p.content?.text || '').trim()}</div>
        <div className="tw-stats">
          <span><TIcon d={PATHS.reply} /> {fmt(e.replies)}</span>
          <span><TIcon d={PATHS.repost} /> {fmt(e.reposts)}</span>
          <span><TIcon d={PATHS.like} /> {fmt(e.likes)}</span>
          <span><TIcon d={PATHS.bookmark} /> {fmt(e.bookmarks)}</span>
          <span><TIcon d={PATHS.views} /> {fmt(e.views)}</span>
        </div>
        {!excluded && (m.breakout != null || p.flags?.controversial) && (
          <div className="tw-chip">
            <span>{chipText(m)}</span>
            {p.flags?.controversial && <span className="warn"><Ico name="alert" size={11} /> verify</span>}
          </div>
        )}
        {note && (note.why || note.pattern) && (
          <div className="tw-note">
            {note.pattern && <div className="tw-note-pat">{note.pattern}</div>}
            {note.why && <p>{note.why}</p>}
          </div>
        )}
      </div>
    </article>
  );
}

/* ---- parse the LLM's per-post "why" out of the brief Analysis prose ---- */
const cleanLine = (l) => l.replace(/^[-*\s>]+/, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
function parseAnalysisNotes(lines) {
  const notes = [];
  let cur = null;
  for (const raw of lines || []) {
    const line = cleanLine(raw);
    const m = line.match(/@([A-Za-z0-9_]+)\s*\((.*?)\)/);
    if (m) { cur = { handle: m[1], snippet: m[2], why: '', pattern: '' }; notes.push(cur); continue; }
    if (!cur) continue;
    const low = line.toLowerCase();
    if (low.startsWith('pattern')) cur.pattern = line.replace(/pattern[^:]*:\s*/i, '');
    else if (low.startsWith('why')) cur.why = line.replace(/why[^:]*:\s*/i, '');
  }
  return notes;
}
function matchNote(post, notes) {
  const txt = (post.content?.text || '').toLowerCase();
  return notes.find((n) => n.handle === post.author.handle && txt.includes(n.snippet.replace(/\.\.\.$/, '').trim().slice(0, 16).toLowerCase()));
}
function patternWatchMd(lines) {
  const idx = (lines || []).findIndex((l) => /pattern watch/i.test(l));
  return idx < 0 ? '' : lines.slice(idx).join('\n');
}

function Column({ kind, title, icon, posts, excluded }) {
  return (
    <div className={`column ${kind}`}>
      <div className="col-head"><span className="col-ico"><Ico name={icon} size={17} /></span> {title} <span className="col-count">{posts.length}</span></div>
      <div className="col-body">
        {posts.length
          ? posts.map((p, i) => <Tweet p={p} excluded={excluded} i={i} key={i} />)
          : <div className="col-empty">nothing here this week</div>}
      </div>
    </div>
  );
}

function BriefView({ md, analysis }) {
  const b = useMemo(() => parseBrief(md), [md]);
  const notes = useMemo(() => (b.analysis ? parseAnalysisNotes(b.analysis.body) : []), [b]);
  const [sub, setSub] = useState('calendar');
  const render = (lines) => marked.parse((lines || []).join('\n'));

  // Fallback: if the markdown didn't parse into sections, render it raw.
  if (!b.sections.length) {
    return <div className="brief" dangerouslySetInnerHTML={{ __html: marked.parse(md) }} />;
  }

  const slots = b.calendar ? parseSlots(b.calendar.body) : [];
  const TABS = [
    { id: 'calendar', label: 'Calendar', icon: 'calendar', has: !!b.calendar },
    { id: 'analysis', label: 'Analysis', icon: 'trendingUp', has: !!b.analysis },
    { id: 'voice', label: 'Voice', icon: 'megaphone', has: !!b.voice },
    { id: 'system', label: 'System', icon: 'info', has: !!b.system },
  ].filter((t) => t.has);

  return (
    <div className="briefview">
      {b.tldr && (
        <div className="tldr-banner" dangerouslySetInnerHTML={{ __html: render(b.tldr.body) }} />
      )}

      <div className="subtabs">
        {TABS.map((t) => (
          <button key={t.id} className={`subtab ${sub === t.id ? 'active' : ''}`} onClick={() => setSub(t.id)}>
            <Ico name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </div>

      {sub === 'calendar' && (
        slots.length ? (
          <div className="cal-grid">
            {slots.map((s, i) => (
              <div className="cal-card" key={i}>
                <div className="cal-day">{s.title}</div>
                <div className="brief" dangerouslySetInnerHTML={{ __html: render(s.body) }} />
              </div>
            ))}
          </div>
        ) : <div className="brief" dangerouslySetInnerHTML={{ __html: render(b.calendar?.body) }} />
      )}
      {sub === 'analysis' && (
        analysis ? (
          <div>
            <div className="group-title"><Ico name="trendingUp" size={18} /> Ride Now</div>
            {(analysis.ride || []).map((p, i) => <Tweet p={p} i={i} note={matchNote(p, notes)} key={'ar' + i} />)}
            <div className="group-title" style={{ marginTop: 24 }}><Ico name="layers" size={18} /> Build the Engine</div>
            {(analysis.engine || []).map((p, i) => <Tweet p={p} i={i} note={matchNote(p, notes)} key={'ae' + i} />)}
            {patternWatchMd(b.analysis?.body).trim() && (
              <div className="brief" style={{ marginTop: 18 }} dangerouslySetInnerHTML={{ __html: render(patternWatchMd(b.analysis.body).split('\n')) }} />
            )}
          </div>
        ) : <div className="brief" dangerouslySetInnerHTML={{ __html: render(b.analysis?.body) }} />
      )}
      {sub === 'voice' && <div className="brief" dangerouslySetInnerHTML={{ __html: render(b.voice?.body) }} />}
      {sub === 'system' && <div className="brief" dangerouslySetInnerHTML={{ __html: render(b.system?.body) }} />}
    </div>
  );
}

export default function Page() {
  const [raw, setRaw] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('board');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    // restore the last session (analysis + brief) so it persists across refreshes
    try {
      const a = localStorage.getItem('cadence_analysis');
      const br = localStorage.getItem('cadence_brief');
      if (a) setAnalysis(JSON.parse(a));
      if (br) setBrief(br);
    } catch (e) {}
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  }

  function loadSample() {
    setRaw(JSON.stringify(samplePosts, null, 2));
    setError('');
  }

  function analyze() {
    setError('');
    setBrief('');
    let posts;
    try {
      const parsed = JSON.parse(raw);
      posts = Array.isArray(parsed) ? parsed : parsed.posts || [];
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      return;
    }
    if (!posts.length) {
      setError('No posts found. Paste an array of posts, or an object like { "posts": [...] }.');
      return;
    }
    try {
      const result = runAnalysis(posts, defaultConfig);
      setAnalysis(result);
      setTab('board');
      try { localStorage.setItem('cadence_analysis', JSON.stringify(result)); } catch (e) {}
    } catch (e) {
      setError('Analysis failed: ' + e.message);
    }
  }

  async function genBrief() {
    if (!analysis) return;
    setLoadingBrief(true);
    setError('');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setBrief(data.brief);
      setTab('brief');
      try { localStorage.setItem('cadence_brief', data.brief); } catch (e) {}
    } catch (e) {
      setError('Brief generation failed: ' + e.message);
    } finally {
      setLoadingBrief(false);
    }
  }

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result));
    reader.readAsText(file);
  }

  return (
    <>
      <nav>
        <div className="wrap navinner">
          <div className="brand"><span className="dot">C</span> Cadence</div>
          <div className="nav-right">
            <span className="dim" style={{ fontSize: 13 }}>built in Claude Code</span>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light / dark" title="Toggle light / dark">
              <Ico name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </div>
      </nav>

      <header className="hero wrap">
        <span className="eyebrow"><Ico name="dot" size={8} /> weekly content intelligence</span>
        <h1>Know <span className="lime">what to post.</span><br />And exactly why.</h1>
        <p className="sub">
          Paste a week of X posts. The engine scores them against each author's own baseline,
          separates viral spikes from durable formulas, filters off-topic noise — then drafts an
          on-brand brief.
        </p>
      </header>

      <main className="wrap">
        <div className="card import-panel">
          <div className="import-head">
            <strong>1 · Import posts</strong>
            <div className="toolbar">
              <button className="btn ghost sm" onClick={loadSample}>Load sample data</button>
              <label className="btn ghost sm upload">
                Upload .json
                <input type="file" accept="application/json,.json" onChange={onUpload} hidden />
              </label>
            </div>
          </div>
          <textarea
            className="json-input"
            placeholder='Paste posts JSON — an array, or { "posts": [ ... ] }. Click "Load sample data" to try it.'
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
          />
          <div className="actions">
            <button className="btn" onClick={analyze}>Analyze <Ico name="arrow" size={15} /></button>
            {analysis && (
              <button className="btn ghost" onClick={genBrief} disabled={loadingBrief}>
                <Ico name="sparkle" size={15} /> {loadingBrief ? 'Generating brief…' : 'Generate brief'}
              </button>
            )}
          </div>
          {error && <div className="error">{error}</div>}
        </div>

        {analysis && (
          <>
            <div className="stat-row">
              {[
                ['scanned', analysis.counts.total],
                ['relevant', analysis.counts.relevant],
                ['excluded', analysis.counts.excluded],
                ['ride-now', analysis.counts.ride_now],
                ['engine', analysis.counts.engine],
              ].map(([l, v]) => (
                <div className="stat" key={l}>
                  <div className="v">{v}</div>
                  <div className="l">{l}</div>
                </div>
              ))}
            </div>

            <div className="tabs">
              <div className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</div>
              <div className={`tab ${tab === 'brief' ? 'active' : ''}`} onClick={() => setTab('brief')}>The Brief</div>
            </div>

            {tab === 'board' && (
              <div className="board">
                <Column kind="ride" title="Ride Now" icon="trendingUp" posts={analysis.ride} />
                <Column kind="engine" title="Build the Engine" icon="layers" posts={analysis.engine} />
                <Column kind="excluded" title="Filtered out" icon="ban" posts={analysis.excluded} excluded />
              </div>
            )}

            {tab === 'brief' && (
              brief
                ? <BriefView md={brief} analysis={analysis} />
                : (
                  <div className="brief dim">
                    <p>No brief yet. Click <strong>“Generate brief”</strong> above.</p>
                    <p style={{ marginTop: 8 }}>Requires <code>GEMINI_API_KEY</code> on the server (Vercel env or <code>web-app/.env.local</code>). Free key: aistudio.google.com/apikey</p>
                  </div>
                )
            )}
          </>
        )}
      </main>

      <footer>The agent drafts · a human approves before anything posts.</footer>
    </>
  );
}
