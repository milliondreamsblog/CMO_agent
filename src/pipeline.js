// Orchestrates the deterministic half: provider -> score -> filter -> rank.
// The output of this feeds the LLM agents (Analyst/Ideator/Packager).
import { getProvider } from './providers/index.js';
import { analyzePosts } from './core/score.js';
import { relevanceOf, controversyFlag } from './core/filter.js';
import { buildShortlists } from './core/rank.js';

export async function runPipeline({ config, providerName = 'sample', window = {} }) {
  const provider = getProvider(providerName);
  const posts = await provider.getPosts(window);

  const scored = analyzePosts(posts, config.scoring);

  for (const p of scored) {
    const rel = relevanceOf(p, config.topics);
    p.flags = {
      relevant: rel.relevant,
      relevance_score: rel.score,
      matched: rel.matched,
      controversial: controversyFlag(p, config.scoring.thresholds),
    };
  }

  const lists = buildShortlists(scored);
  return {
    provider: provider.name,
    window,
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
