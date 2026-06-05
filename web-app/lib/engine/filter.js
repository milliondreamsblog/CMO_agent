// Relevance filter + controversy guard (ported — pure).
const RELEVANCE_TERMS = [
  'ux', 'ui', 'user experience', 'design', 'product design', 'saas', 'onboarding',
  'activation', 'conversion', 'retention', 'design system', 'landing page',
  'hero section', 'prototype', 'wireframe', 'interface', 'usability', 'figma',
  'redesign', 'teardown', 'b2b', 'startup', 'founder', 'mrr', 'arr', 'pricing',
  'empty state', 'settings', 'checkout', 'dashboard', 'component', 'agency',
  'launch', 'feature', 'interaction', 'toggle', 'flow', 'app',
];

export function relevanceOf(post) {
  const text = (post.content?.text || '').toLowerCase();
  const matched = RELEVANCE_TERMS.filter((t) => text.includes(t));
  return { relevant: matched.length > 0, score: matched.length, matched };
}

export function controversyFlag(post, t) {
  const e = post.engagement || {};
  const replies = e.replies || 0;
  const ratio = replies / Math.max(e.likes || 0, 1);
  return replies >= t.controversy_min_replies && ratio >= t.controversy_reply_ratio;
}
