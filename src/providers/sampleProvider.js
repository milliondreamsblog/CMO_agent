// SampleProvider — reads the curated sample dataset.
// The ONLY volatile seam in the system. Apify/X-API providers implement the
// same getPosts() contract; nothing downstream changes when you swap them in.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.js';

export function sampleProvider() {
  return {
    name: 'sample',
    async getPosts({ since, until } = {}) {
      // Reads the sample set by default, or any cached file via DATA_FILE
      // (e.g. data/live_posts.json from `npm run scrape`).
      const file = process.env.DATA_FILE || 'data/sample_posts.json';
      const raw = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
      let posts = raw.posts || [];
      // In production the window is the last 7 days; the curated demo set is
      // treated as "the week's pull", so by default we return all of it.
      if (since) posts = posts.filter((p) => new Date(p.created_at) >= new Date(since));
      if (until) posts = posts.filter((p) => new Date(p.created_at) <= new Date(until));
      return posts;
    },
  };
}
