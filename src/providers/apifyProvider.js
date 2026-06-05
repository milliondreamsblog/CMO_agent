// ApifyProvider — fetches REAL X posts via an Apify actor, normalized to the Post schema.
// Uses the REST "run-sync-get-dataset-items" endpoint: one call, no polling. Needs APIFY_TOKEN.
//
// IMPORTANT (the spike): the input/output field names below target the popular
// `apidojo/tweet-scraper` actor. Different actors name fields differently. On the FIRST real
// run, log a raw item (`console.error(JSON.stringify(items[0]))`) and adjust the mapping if
// needed — discovering the real shape IS the point of this spike.

const num = (...v) => {
  for (const x of v) if (typeof x === 'number' && !Number.isNaN(x)) return x;
  return 0;
};

function detectMedia(t) {
  const m = t.media || t.extendedEntities?.media || t.extended_entities?.media || [];
  if (Array.isArray(m) && m.length) {
    const type = m[0]?.type;
    return type === 'video' || type === 'animated_gif' ? 'video' : 'image';
  }
  if (/https?:\/\//.test(t.text || t.fullText || '')) return 'link';
  return 'text';
}

// Map one raw actor item -> our Post schema. Defensive across common field-name variants.
export function normalizeTweet(t) {
  if (!t) return null;
  const a = t.author || t.user || {};
  const handle = a.userName || a.screen_name || a.username || t.username;
  if (!handle) return null;
  const text = t.text || t.fullText || t.full_text || '';
  return {
    id: String(t.id || t.id_str || t.tweetId || ''),
    url: t.url || t.twitterUrl || `https://x.com/${handle}/status/${t.id || ''}`,
    created_at: t.createdAt || t.created_at || t.date || null,
    author: {
      handle,
      name: a.name || '',
      followers: num(a.followers, a.followersCount, a.followers_count),
      following: num(a.following, a.followingCount, a.friends_count),
      verified: Boolean(a.isVerified || a.verified || a.isBlueVerified),
      tier: 'unknown', // backfilled from config if needed; not used by scoring
    },
    engagement: {
      likes: num(t.likeCount, t.favoriteCount, t.favorite_count, t.likes),
      reposts: num(t.retweetCount, t.retweet_count, t.reposts),
      replies: num(t.replyCount, t.reply_count, t.replies),
      quotes: num(t.quoteCount, t.quote_count, t.quotes),
      bookmarks: num(t.bookmarkCount, t.bookmark_count, t.bookmarks),
      views: num(t.viewCount, t.views, t.view_count),
    },
    content: {
      text,
      media_type: detectMedia(t),
      media_count: Array.isArray(t.media) ? t.media.length : 0,
      is_thread: Boolean(t.isThread),
      thread_len: 1,
      has_link: /https?:\/\//.test(text),
      post_type: t.isReply ? 'reply' : t.isQuote ? 'quote' : 'original',
    },
  };
}

export function apifyProvider() {
  return {
    name: 'apify',
    async getPosts({ accounts = [], since, maxItemsPerRun } = {}) {
      const token = process.env.APIFY_TOKEN;
      if (!token) throw new Error('APIFY_TOKEN is not set. Get one at apify.com → Settings → Integrations.');
      const actor = process.env.APIFY_ACTOR || 'apidojo~tweet-scraper';

      const start = since || new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10); // last 7 days
      const maxItems = Number(process.env.APIFY_MAX_ITEMS) || maxItemsPerRun || 100; // cost cap for the spike

      // Actor input — VERIFY against your actor's input schema.
      const input = {
        twitterHandles: accounts,
        maxItems,
        sort: 'Latest',
        start,
        tweetLanguage: 'en',
      };

      const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Apify run failed (${res.status}): ${body.slice(0, 300)}`);
      }

      const items = await res.json();
      const posts = items.map(normalizeTweet).filter(Boolean);
      // Spike telemetry — compare against the $ cost shown in the Apify console for this run.
      console.error(`[apify] actor=${actor} handles=${accounts.length} fetched=${posts.length} items`);
      return posts;
    },
  };
}
