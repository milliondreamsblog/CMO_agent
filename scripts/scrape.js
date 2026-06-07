// One-time real scrape → cache to data/live_posts.json.
// Scrape ONCE (costs Apify credits), then iterate the demo offline for free:
//   $env:DATA_FILE='data/live_posts.json'; npm run analyze   (no re-scrape)
//
//   $env:APIFY_TOKEN='apify_api_...'; $env:MAX_ACCOUNTS='10'; $env:APIFY_MAX_ITEMS='300'
//   npm run scrape
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, ROOT } from '../src/config.js';
import { getProvider } from '../src/providers/index.js';
import { getTrackedHandles } from '../src/pipeline.js';

const config = loadConfig();
const maxAccounts = Number(process.env.MAX_ACCOUNTS) || 10;
const accounts = getTrackedHandles(config, maxAccounts);

if (!process.env.APIFY_MAX_ITEMS) process.env.APIFY_MAX_ITEMS = '300'; // ~30 posts/account for a week

console.error(`Scraping last 7 days for ${accounts.length} accounts: ${accounts.join(', ')}`);

const provider = getProvider('apify');
const posts = await provider.getPosts({ accounts });

const out = {
  _meta: {
    source: 'apify-live',
    scraped_accounts: accounts,
    count: posts.length,
    note: 'One-time real scrape. Re-run analysis offline with DATA_FILE=data/live_posts.json (no re-scrape).',
  },
  posts,
};

fs.writeFileSync(path.join(ROOT, 'data/live_posts.json'), JSON.stringify(out, null, 2));
console.error(`\n✓ wrote data/live_posts.json — ${posts.length} posts from ${accounts.length} accounts`);

// Print the first item so you can verify the field mapping immediately.
if (posts[0]) {
  console.error('\n--- first post (verify followers/engagement are non-zero) ---');
  console.error(JSON.stringify(posts[0], null, 2));
} else {
  console.error('\n⚠ 0 posts returned — check the actor id / input field names in apifyProvider.js');
}
