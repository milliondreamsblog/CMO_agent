'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { runAnalysis } from '../lib/engine';
import { defaultConfig } from '../lib/defaultConfig';
import { samplePosts } from '../lib/samplePosts';

const BADGE = {
  proven_peak: ['proven_peak', '⭐ PEAK'],
  durable: ['durable', '🏗 DURABLE'],
  trend: ['trend', '🔥 TREND'],
  noise: ['noise', 'noise'],
  unrated: ['unrated', 'unrated'],
};

function chip(m) {
  const b = m.breakout != null ? `breakout ${m.breakout.toFixed(2)}×` : '';
  const base = m.baseline_pct != null ? ` · baseline p${Math.round(m.baseline_pct)}` : '';
  return b + base;
}

function PostCard({ p }) {
  const [cls, label] = BADGE[p.metrics.quadrant] || ['', p.metrics.quadrant];
  const text = (p.content?.text || '').replace(/\n+/g, ' ').slice(0, 220);
  return (
    <div className={`post q-${p.metrics.quadrant}`}>
      <div className="row1">
        <span className="handle">@{p.author.handle}</span>
        <span className={`badge ${cls}`}>{label}</span>
        <span className="chip">{chip(p.metrics)}</span>
        {p.flags.controversial && <span className="warn">⚠ verify · reply-heavy</span>}
      </div>
      <div className="text">{text}…</div>
      <div className="meta">
        {(p.engagement?.views || 0).toLocaleString()} views · {(p.engagement?.bookmarks || 0).toLocaleString()} bookmarks · {(p.engagement?.likes || 0).toLocaleString()} likes
      </div>
    </div>
  );
}

export default function Page() {
  const [raw, setRaw] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('analysis');
  const [loadingBrief, setLoadingBrief] = useState(false);

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
      setAnalysis(runAnalysis(posts, defaultConfig));
      setTab('analysis');
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
          <div className="brand"><span className="dot" /> Bricx Content Engine</div>
          <a className="btn ghost" href="https://github.com" onClick={(e) => e.preventDefault()}>built in Claude Code</a>
        </div>
      </nav>

      <header className="hero wrap">
        <span className="eyebrow">Weekly content intelligence · paste data → analyze → brief</span>
        <h1>Know <span className="grad">what to post.</span> And why.</h1>
        <p className="sub">
          Paste a week of X posts as JSON. The engine scores them relative to each author's own
          baseline, separates viral spikes from durable formulas, filters off-topic noise — then
          drafts an executable, on-brand weekly brief.
        </p>
      </header>

      <main className="wrap">
        <div className="import-panel">
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
            placeholder='Paste posts JSON here — an array of posts, or { "posts": [ ... ] }. Click "Load sample data" to try it.'
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
          />
          <div className="actions">
            <button className="btn" onClick={analyze}>Analyze →</button>
            {analysis && (
              <button className="btn ghost" onClick={genBrief} disabled={loadingBrief}>
                {loadingBrief ? 'Generating brief…' : 'Generate brief (LLM)'}
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
              <div className={`tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>Analysis</div>
              <div className={`tab ${tab === 'brief' ? 'active' : ''}`} onClick={() => setTab('brief')}>The Brief</div>
            </div>

            {tab === 'analysis' && (
              <div>
                <div className="section-title" style={{ marginTop: 18 }}>🔥 Ride Now — breakout posts</div>
                {analysis.ride.length ? analysis.ride.map((p, i) => <PostCard p={p} key={'r' + i} />) : <p className="dim">none</p>}

                <div className="section-title" style={{ marginTop: 26 }}>🏗 Build the Engine — durable performers</div>
                {analysis.engine.length ? analysis.engine.map((p, i) => <PostCard p={p} key={'e' + i} />) : <p className="dim">none</p>}

                <div className="section-title" style={{ marginTop: 26 }}>🚫 Filtered out — high engagement, off-topic</div>
                {analysis.excluded.map((p, i) => (
                  <div className="post q-excluded" key={'x' + i}>
                    <div className="row1">
                      <span className="handle">@{p.author.handle}</span>
                      <span className="badge excluded">EXCLUDED · off-topic</span>
                      <span className="chip">{(p.engagement?.views || 0).toLocaleString()} views</span>
                    </div>
                    <div className="text">{(p.content?.text || '').slice(0, 160)}…</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'brief' && (
              <div>
                {brief ? (
                  <div className="brief" dangerouslySetInnerHTML={{ __html: marked.parse(brief) }} />
                ) : (
                  <div className="brief dim">
                    <p>No brief yet. Click <strong>“Generate brief (LLM)”</strong> above.</p>
                    <p style={{ marginTop: 8 }}>Requires <code>ANTHROPIC_API_KEY</code> set on the server (Vercel env or <code>.env.local</code>).</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer>The agent drafts · a human approves before anything posts.</footer>
    </>
  );
}
