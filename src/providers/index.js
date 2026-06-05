// Provider factory — the swap point between sample and live data.
import { sampleProvider } from './sampleProvider.js';
import { apifyProvider } from './apifyProvider.js';

export function getProvider(name = 'sample') {
  switch (name) {
    case 'sample':
      return sampleProvider();
    case 'apify':
      return apifyProvider(); // real X data — needs APIFY_TOKEN
    // case 'xapi': return xApiProvider();   // official API (future)
    default:
      throw new Error(`Unknown data provider: ${name}`);
  }
}
