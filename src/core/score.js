// Deterministic scoring core. No LLM, no tokens — just math.
// Produces, per post: weighted engagement, size-normalized rate, the author's
// baseline, the breakout ratio, the baseline percentile, and a quadrant.

export function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// % of values <= v  (where does this sit in the distribution)
export function percentileRank(v, arr) {
  if (!arr.length) return null;
  return (arr.filter((x) => x <= v).length / arr.length) * 100;
}

export function weightedEngagement(p, w) {
  const e = p.engagement || {};
  return (
    (e.likes || 0) * w.like +
    (e.reposts || 0) * w.repost +
    (e.replies || 0) * w.reply +
    (e.quotes || 0) * w.quote +
    (e.bookmarks || 0) * w.bookmark
  );
}

export function reachOf(p, reachCfg) {
  const views = p.engagement?.views || 0;
  if (reachCfg.prefer === 'views' && views > 0) return views;
  return p.author?.followers || 1;
}

function quadrantOf(m, t) {
  if (m.breakout == null || m.baseline_pct == null) return 'unrated';
  const breakoutHigh = m.breakout >= t.breakout_high;
  const baselineHigh = m.baseline_pct >= t.baseline_high_pct;
  if (breakoutHigh && baselineHigh) return 'proven_peak';
  if (!breakoutHigh && baselineHigh) return 'durable';
  if (breakoutHigh && !baselineHigh) return 'trend';
  return 'noise';
}

export function analyzePosts(posts, scoring) {
  const { weights, thresholds, reach, min_posts_for_baseline, min_baseline_weighted } = scoring;

  // 1) per-post weighted engagement + size-normalized rate
  const enriched = posts.map((p) => {
    const weighted = weightedEngagement(p, weights);
    const reachVal = reachOf(p, reach);
    return { ...p, metrics: { weighted, reach: reachVal, rate: weighted / reachVal } };
  });

  // 2) per-author baselines (need enough posts AND a non-trivial baseline)
  const byAuthor = {};
  for (const p of enriched) (byAuthor[p.author.handle] ||= []).push(p);

  const authorStats = {};
  for (const [handle, ps] of Object.entries(byAuthor)) {
    const medWeighted = median(ps.map((p) => p.metrics.weighted));
    const medRate = median(ps.map((p) => p.metrics.rate));
    const reliable = ps.length >= min_posts_for_baseline && medWeighted >= min_baseline_weighted;
    authorStats[handle] = { medWeighted, medRate, reliable, count: ps.length };
  }

  // percentile is computed only across authors with a reliable baseline
  const reliableRates = Object.values(authorStats)
    .filter((a) => a.reliable)
    .map((a) => a.medRate);

  // 3) breakout (self-relative spike) + baseline percentile (cross-author consistency) + quadrant
  for (const p of enriched) {
    const a = authorStats[p.author.handle];
    p.metrics.author_baseline_weighted = a.reliable ? a.medWeighted : null;
    p.metrics.author_baseline_rate = a.reliable ? a.medRate : null;
    p.metrics.breakout = a.reliable ? p.metrics.weighted / a.medWeighted : null;
    p.metrics.baseline_pct = a.reliable ? percentileRank(a.medRate, reliableRates) : null;
    p.metrics.quadrant = quadrantOf(p.metrics, thresholds);
  }

  return enriched;
}
