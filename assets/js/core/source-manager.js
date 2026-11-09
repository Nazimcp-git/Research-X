/**
 * ResearchX - Source Manager
 * Manages source deduplication, domain normalization, credibility rating, and indexing
 */

import { extractDomain } from '../utils/helpers.js';

export class SourceManager {
  constructor() {
    this.sources = [];
    this.urlMap = new Map();
  }

  /**
   * Reset sources list
   */
  clear() {
    this.sources = [];
    this.urlMap.clear();
  }

  /**
   * Add source candidate with automatic deduplication
   */
  addSource(candidate) {
    if (!candidate || !candidate.url) return null;

    const normalizedUrl = candidate.url.toLowerCase().trim().replace(/\/$/, '');
    if (this.urlMap.has(normalizedUrl)) {
      // Merge supporting excerpt if new excerpt is richer
      const existing = this.urlMap.get(normalizedUrl);
      if (candidate.supporting_excerpt && (!existing.supporting_excerpt || candidate.supporting_excerpt.length > existing.supporting_excerpt.length)) {
        existing.supporting_excerpt = candidate.supporting_excerpt;
      }
      return existing;
    }

    const domain = extractDomain(candidate.url);
    const credibility = this.evaluateCredibility(candidate.url, candidate.title);

    const sourceObj = {
      id: `src_${this.sources.length + 1}`,
      citationIndex: this.sources.length + 1,
      title: candidate.title || domain,
      url: candidate.url,
      domain,
      published_date: candidate.published_date || candidate.publishedDate || 'N/A',
      supporting_excerpt: candidate.supporting_excerpt || candidate.snippet || '',
      credibilityScore: credibility.score,
      credibilityBadge: credibility.badge,
      addedAt: Date.now()
    };

    this.sources.push(sourceObj);
    this.urlMap.set(normalizedUrl, sourceObj);
    return sourceObj;
  }

  /**
   * Bulk add an array of sources
   */
  addSources(candidates = []) {
    return candidates.map(c => this.addSource(c)).filter(Boolean);
  }

  /**
   * Get all registered sources
   */
  getAll() {
    return [...this.sources];
  }

  /**
   * Evaluate source credibility based on TLD and domain patterns
   */
  evaluateCredibility(url, title = '') {
    const lowerUrl = (url || '').toLowerCase();
    if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('arxiv.org') || lowerUrl.includes('nature.com') || lowerUrl.includes('science.org') || lowerUrl.includes('ieee.org') || lowerUrl.includes('acm.org')) {
      return { score: 95, badge: 'Peer-Reviewed / Gov' };
    }
    if (lowerUrl.includes('wikipedia.org')) {
      return { score: 85, badge: 'Encyclopedia' };
    }
    if (lowerUrl.includes('.org') || lowerUrl.includes('reuters.com') || lowerUrl.includes('bloomberg.com') || lowerUrl.includes('bbc.com') || lowerUrl.includes('wsj.com')) {
      return { score: 88, badge: 'Verified Media' };
    }
    return { score: 75, badge: 'Web Publication' };
  }
}

