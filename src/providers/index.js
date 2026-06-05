// Provider factory — the swap point between sample and live data.
import { sampleProvider } from './sampleProvider.js';

export function getProvider(name = 'sample') {
  switch (name) {
    case 'sample':
      return sampleProvider();
    // case 'apify': return apifyProvider();   // PRODUCTIONIZE: drop-in, same getPosts() contract
    // case 'xapi':  return xApiProvider();
    default:
      throw new Error(`Unknown data provider: ${name}`);
  }
}
