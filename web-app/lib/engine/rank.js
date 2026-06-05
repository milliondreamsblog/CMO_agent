// Shortlists (ported — pure).
export function buildShortlists(posts) {
  const relevant = posts.filter((p) => p.flags.relevant);
  const excluded = posts.filter((p) => !p.flags.relevant);
  const inQuadrant = (p, qs) => qs.includes(p.metrics.quadrant);

  const ride = relevant
    .filter((p) => inQuadrant(p, ['trend', 'proven_peak']))
    .sort((a, b) => (b.metrics.breakout || 0) - (a.metrics.breakout || 0));

  const engine = relevant
    .filter((p) => inQuadrant(p, ['durable', 'proven_peak']))
    .sort((a, b) => (b.metrics.rate || 0) - (a.metrics.rate || 0));

  const unrated = relevant
    .filter((p) => p.metrics.quadrant === 'unrated')
    .sort((a, b) => (b.metrics.rate || 0) - (a.metrics.rate || 0));

  return { ride, engine, unrated, excluded };
}
