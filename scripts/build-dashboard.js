// Builds the static dashboard data file (web/data.js) from the generated analysis +
// the latest brief. Pre-renders the brief markdown to HTML so the dashboard is fully
// static — no server, no runtime fetch. Open web/index.html by double-clicking.
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { ROOT } from '../src/config.js';

const analysis = JSON.parse(fs.readFileSync(path.join(ROOT, 'output/analysis.json'), 'utf8'));

const briefsDir = path.join(ROOT, 'briefs');
const briefFiles = fs.readdirSync(briefsDir).filter((f) => f.endsWith('.md')).sort();
const latest = briefFiles[briefFiles.length - 1];
const briefMarkdown = fs.readFileSync(path.join(briefsDir, latest), 'utf8');

const slim = (p) => ({
  handle: p.author.handle,
  followers: p.author.followers,
  text: p.content?.text || '',
  views: p.engagement?.views || 0,
  bookmarks: p.engagement?.bookmarks || 0,
  likes: p.engagement?.likes || 0,
  quadrant: p.metrics?.quadrant,
  breakout: p.metrics?.breakout,
  baseline_pct: p.metrics?.baseline_pct,
  controversial: p.flags?.controversial || false,
});

const data = {
  week: latest.replace('.md', ''),
  counts: analysis.counts,
  ride: analysis.ride.map(slim),
  engine: analysis.engine.map(slim),
  excluded: analysis.excluded.map(slim),
  unrated: analysis.unrated.map(slim),
  briefHtml: marked.parse(briefMarkdown),
};

const webDir = path.join(ROOT, 'web');
fs.mkdirSync(webDir, { recursive: true });
fs.writeFileSync(path.join(webDir, 'data.js'), `window.__BRICX__ = ${JSON.stringify(data, null, 2)};\n`);
console.log(`✓ wrote web/data.js  (brief: ${latest}, ride ${data.ride.length}, engine ${data.engine.length}, excluded ${data.excluded.length})`);
console.log('  open web/index.html in a browser.');
