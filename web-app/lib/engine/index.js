// Browser-friendly orchestrator — same logic as the CLI pipeline, takes a config object.
import { analyzePosts } from './score.js';
import { relevanceOf, controversyFlag } from './filter.js';
import { buildShortlists } from './rank.js';

export function runAnalysis(posts, config) {
  const scored = analyzePosts(posts, config.scoring);
  for (const p of scored) {
    const rel = relevanceOf(p);
    p.flags = {
      relevant: rel.relevant,
      relevance_score: rel.score,
      matched: rel.matched,
      controversial: controversyFlag(p, config.scoring.thresholds),
    };
  }
  const lists = buildShortlists(scored);
  return {
    counts: {
      total: posts.length,
      relevant: scored.filter((p) => p.flags.relevant).length,
      excluded: lists.excluded.length,
      ride_now: lists.ride.length,
      engine: lists.engine.length,
    },
    ...lists,
    all: scored,
  };
}
