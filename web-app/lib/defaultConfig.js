// Default scoring config (the scoring.yaml values, as a JS object for the browser).
export const defaultConfig = {
  scoring: {
    weights: { like: 1, repost: 3, reply: 3, quote: 5, bookmark: 5 },
    thresholds: {
      breakout_high: 2.0,
      baseline_high_pct: 66,
      controversy_reply_ratio: 2.0,
      controversy_min_replies: 30,
    },
    min_posts_for_baseline: 3,
    min_baseline_weighted: 25,
    reach: { prefer: 'views' },
  },
};
