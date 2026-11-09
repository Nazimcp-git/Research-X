/**
 * ResearchX - Wikipedia MediaWiki Action API Integration
 * Free Encyclopedia Background Research with Multi-Language Support
 */

import { fetchWithTimeout } from '../utils/helpers.js';

export class WikipediaAPI {
  /**
   * Search Wikipedia articles and extract summary extracts
   */
  static async search({ query, lang = 'en', limit = 3, timeoutMs = 15000 }) {
    if (!query) return [];

    // Map language code if necessary
    const validLang = (lang || 'en').toLowerCase().trim();
    const endpoint = `https://${validLang}.wikipedia.org/w/api.php`;

    // 1. Search for matching page titles
    const searchUrl = `${endpoint}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json&origin=*`;

    try {
      const searchRes = await fetchWithTimeout(searchUrl, { method: 'GET' }, timeoutMs);
      if (!searchRes.ok) throw new Error(`Wikipedia search failed with HTTP ${searchRes.status}`);

      const searchData = await searchRes.json();
      const hits = searchData.query?.search || [];

      if (hits.length === 0) return [];

      // 2. Fetch page extracts and canonical URLs in bulk
      const pageTitles = hits.map(h => h.title).join('|');
      const extractUrl = `${endpoint}?action=query&prop=extracts|info&inprop=url&exintro=1&explaintext=1&titles=${encodeURIComponent(pageTitles)}&format=json&origin=*`;

      const extractRes = await fetchWithTimeout(extractUrl, { method: 'GET' }, timeoutMs);
      if (!extractRes.ok) return [];

      const extractData = await extractRes.json();
      const pages = extractData.query?.pages || {};

      const results = [];
      for (const pageId in pages) {
        if (pageId === '-1') continue;
        const page = pages[pageId];
        results.push({
          title: page.title,
          url: page.fullurl || `https://${validLang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          snippet: page.extract ? page.extract.slice(0, 750) : '',
          source: 'Wikipedia',
          publishedDate: null
        });
      }

      return results;
    } catch (err) {
      console.warn('Wikipedia search warning:', err.message);
      return [];
    }
  }
}

