/**
 * ResearchX - Tavily Web Search API Integration Module
 * Real Web Search with Deduplication and Deep Fact Gathering
 */

import { fetchWithTimeout } from '../utils/helpers.js';

export class TavilyAPI {
  /**
   * Execute real-time web search
   */
  static async search({
    apiKey,
    query,
    searchDepth = 'basic', // 'basic' | 'advanced'
    maxResults = 5,
    includeAnswer = true,
    includeDomains = [],
    excludeDomains = [],
    timeoutMs = 25000
  }) {
    if (!apiKey) {
      throw new Error('Tavily API key is required for live web search.');
    }

    const endpoint = 'https://api.tavily.com/search';

    const payload = {
      api_key: apiKey,
      query,
      search_depth: searchDepth,
      max_results: Math.min(Math.max(1, maxResults), 15),
      include_answer: includeAnswer,
      include_raw_content: false
    };

    if (includeDomains.length > 0) payload.include_domains = includeDomains;
    if (excludeDomains.length > 0) payload.exclude_domains = excludeDomains;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      }, timeoutMs);

      if (!response.ok) {
        let errText = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.detail || errData.message) {
            errText = errData.detail || errData.message;
          }
        } catch (_) {}
        throw new Error(`Tavily Search Error: ${errText}`);
      }

      const data = await response.json();
      const rawResults = data.results || [];

      // Deduplicate results by normalized URL
      const seenUrls = new Set();
      const cleanResults = [];

      for (const item of rawResults) {
        const normUrl = (item.url || '').toLowerCase().trim().replace(/\/$/, '');
        if (!normUrl || seenUrls.has(normUrl)) continue;
        seenUrls.add(normUrl);

        cleanResults.push({
          title: item.title || 'Web Result',
          url: item.url,
          snippet: item.content || item.snippet || '',
          score: item.score || 0.8,
          publishedDate: item.published_date || null
        });
      }

      return {
        query,
        answer: data.answer || null,
        results: cleanResults
      };
    } catch (err) {
      // Do not expose secrets in error messages
      throw new Error(err.message.replace(/Bearer\s+[A-Za-z0-9_-]+/g, 'Bearer REDACTED'));
    }
  }

  /**
   * Test connection to Tavily Search API
   */
  static async testConnection(apiKey) {
    if (!apiKey) return { success: false, error: 'Tavily API key is empty.' };

    try {
      const res = await this.search({
        apiKey,
        query: 'Artificial Intelligence research',
        maxResults: 1,
        searchDepth: 'basic',
        timeoutMs: 12000
      });

      return {
        success: true,
        resultsFound: res.results.length
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }
}

