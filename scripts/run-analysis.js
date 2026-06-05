// CLI entry for the deterministic analysis.
//   node scripts/run-analysis.js          -> pretty report + writes output/analysis.json
//   node scripts/run-analysis.js --json   -> raw JSON to stdout
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, ROOT } from '../src/config.js';
import { runPipeline } from '../src/pipeline.js';

const BADGE = { proven_peak: '⭐ PEAK', durable: '🏗 DURABLE', trend: '🔥 TREND', noise: '· noise', unrated: '· unrated' };

function chip(p) {
  const m = p.metrics;
  const b = m.breakout != null ? `breakout ${m.breakout.toFixed(2)}×` : 'breakout n/a';
  const base = m.baseline_pct != null ? `baseline p${Math.round(m.baseline_pct)}` : 'baseline n/a';
  const flag = p.flags.controversial ? ' · ⚠ verify (reply-heavy)' : '';
  return `${BADGE[m.quadrant]} · ${b} · ${base}${flag}`;
}

function line(p) {
  const text = (p.content?.text || '').replace(/\s+/g, ' ').slice(0, 70);
  return `  @${p.author.handle.padEnd(16)} ${chip(p)}\n      "${text}…"`;
}

function main() {
  const config = loadConfig();
  const providerName = process.env.PROVIDER || 'sample';
  const window = process.env.MAX_ACCOUNTS ? { maxAccounts: Number(process.env.MAX_ACCOUNTS) } : {};
  runPipeline({ config, providerName, window }).then((r) => {
    if (process.argv.includes('--json')) {
      process.stdout.write(JSON.stringify(r, null, 2));
      return;
    }

    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('  BRICX WEEKLY ANALYSIS  ·  provider:', r.provider);
    console.log('══════════════════════════════════════════════════════════════════');
    console.log(`  scanned ${r.counts.total}  ·  relevant ${r.counts.relevant}  ·  excluded ${r.counts.excluded}  ·  ride-now ${r.counts.ride_now}  ·  engine ${r.counts.engine}`);

    console.log('\n🔥 RIDE NOW  (breakout posts — time-sensitive)');
    console.log('──────────────────────────────────────────────────────────────────');
    r.ride.forEach((p) => console.log(line(p)));

    console.log('\n🏗  BUILD THE ENGINE  (durable performers — evergreen)');
    console.log('──────────────────────────────────────────────────────────────────');
    r.engine.forEach((p) => console.log(line(p)));

    console.log('\n🚫 EXCLUDED  (high engagement but off-topic — filtered out)');
    console.log('──────────────────────────────────────────────────────────────────');
    r.excluded.forEach((p) => {
      const v = p.engagement?.views?.toLocaleString() || '?';
      const text = (p.content?.text || '').replace(/\s+/g, ' ').slice(0, 60);
      console.log(`  @${p.author.handle.padEnd(16)} ${v} views — "${text}…"`);
    });

    console.log('\nℹ️  CONTEXT  (unrated — too few posts / near-zero baseline)');
    console.log('──────────────────────────────────────────────────────────────────');
    r.unrated.forEach((p) => console.log(`  @${p.author.handle.padEnd(16)} ${chip(p)}`));

    const outDir = path.join(ROOT, 'output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'analysis.json'), JSON.stringify(r, null, 2));
    console.log('\n✓ wrote output/analysis.json\n');
  });
}

main();
