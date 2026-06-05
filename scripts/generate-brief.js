// Headless brief generator — the LLM half (Analyst → Ideator → Packager) as a CLI,
// for cron/CI. Reads the SAME knowledge + agent files the Claude Code command uses,
// so there's one source of truth. Requires ANTHROPIC_API_KEY.
//
//   node scripts/generate-brief.js        (run `npm run analyze` first to produce output/analysis.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY is not set. Add it to your env (or CI secrets).');
  process.exit(1);
}

const analysisPath = path.join(ROOT, 'output/analysis.json');
if (!fs.existsSync(analysisPath)) {
  console.error('✗ output/analysis.json not found. Run `npm run analyze` first.');
  process.exit(1);
}
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// One source of truth: assemble the system prompt from the real repo files.
const SYSTEM = [
  'You are the Bricx Labs weekly content agent. Run ANALYST, then IDEATOR, then PACKAGER in sequence and output ONE executable weekly brief in Markdown. Output ONLY the final brief.',
  '## ANALYST ROLE\n' + read('agents/analyst.md'),
  '## IDEATOR ROLE\n' + read('agents/ideator.md'),
  '## PACKAGER ROLE\n' + read('agents/packager.md'),
  '## PATTERN TAXONOMY\n' + read('knowledge/pattern_taxonomy.md'),
  '## BRAND VOICE\n' + read('knowledge/brand_voice.md'),
  '## OUTPUT TEMPLATE (fill this shape)\n' + read('templates/brief_template.md'),
].join('\n\n');

const slim = (p) => ({
  handle: p.author?.handle,
  text: p.content?.text,
  quadrant: p.metrics?.quadrant,
  breakout: p.metrics?.breakout != null ? Number(p.metrics.breakout.toFixed(2)) : null,
  baseline_pct: p.metrics?.baseline_pct != null ? Math.round(p.metrics.baseline_pct) : null,
  controversial: p.flags?.controversial || false,
  views: p.engagement?.views,
  bookmarks: p.engagement?.bookmarks,
  likes: p.engagement?.likes,
});
const payload = {
  counts: analysis.counts,
  ride: (analysis.ride || []).map(slim),
  engine: (analysis.engine || []).map(slim),
  excluded: (analysis.excluded || []).map((p) => ({ handle: p.author?.handle, text: p.content?.text, views: p.engagement?.views })),
};

const anthropic = new Anthropic({ apiKey });
const model = process.env.MODEL || 'claude-sonnet-4-6';

const msg = await anthropic.messages.create({
  model,
  max_tokens: 4000,
  system: SYSTEM,
  messages: [
    { role: 'user', content: 'Produce this week\'s brief from the deterministic analysis below.\n\n```json\n' + JSON.stringify(payload, null, 2) + '\n```' },
  ],
});

const brief = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
const date = new Date().toISOString().slice(0, 10);
const outPath = path.join(ROOT, 'briefs', `${date}.md`);
fs.mkdirSync(path.join(ROOT, 'briefs'), { recursive: true });
fs.writeFileSync(outPath, brief);
console.log(`✓ wrote briefs/${date}.md  (model: ${model})`);
