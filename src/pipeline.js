// Orchestrates the deterministic half: provider -> score -> filter -> rank.
// The output of this feeds the LLM agents (Analyst/Ideator/Packager).
import { getProvider } from './providers/index.js';
import { analyzePosts } from './core/score.js';
import { relevanceOf, controversyFlag } from './core/filter.js';
import { buildShortlists } from './core/rank.js';

// Flatten all `handle`s from the tiered config/accounts.yaml. Tiers without an
// `accounts` array (e.g. competitive_watch `candidates`) are skipped.
export function getTrackedHandles(config, limit) {
  const accts = config.accounts || {};
  const handles = [];
  for (const key of Object.keys(accts)) {
    const tier = accts[key];
    if (tier && Array.isArray(tier.accounts)) {
      for (const a of tier.accounts) if (a && a.handle) handles.push(a.handle);
    }
  }
  return limit ? handles.slice(0, limit) : handles;
}

export async function runPipeline({ config, providerName = 'sample', window = {} }) {
  const provider = getProvider(providerName);
  const accounts = getTrackedHandles(config, window.maxAccounts);
  const posts = await provider.getPosts({ ...window, accounts });

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
