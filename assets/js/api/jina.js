/**
 * ResearchX - Jina Reader API Integration Module
 * Extracts full-text clean Markdown from web source URLs
 */

import { fetchWithTimeout } from '../utils/helpers.js';

export class JinaReaderAPI {
  /**
   * Extract webpage content into readable Markdown
   */
  static async extract({ url, apiKey = '', maxChars = 4000, timeoutMs = 25000 }) {
    if (!url || !url.startsWith('http')) {
      throw new Error('Valid HTTP/HTTPS URL is required for content extraction.');
    }

    const endpoint = `https://r.jina.ai/${url}`;

    const headers = {
      'Accept': 'application/json',
      'X-No-Cache': 'true'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers
      }, timeoutMs);

      if (!response.ok) {
        throw new Error(`Jina Reader HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.data?.content || data.content || '';
      const title = data.data?.title || data.title || '';

      const truncated = content.length > maxChars
        ? content.slice(0, maxChars) + '\n\n...[Content truncated for analysis]...'
        : content;

      return {
        url,
        title,
        content: truncated,
        description: data.data?.description || ''
      };
    } catch (err) {
      // Fallback: Return null so caller can proceed with Tavily snippet without crashing
      return {
        url,
        title: '',
        content: null,
        error: err.message
      };
    }
  }

  /**
   * Test connection to Jina Reader
   */
  static async testConnection(apiKey = '') {
    try {
      const res = await this.extract({
        url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        apiKey,
        maxChars: 300,
        timeoutMs: 12000
      });

      if (res.content) {
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to extract content' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

