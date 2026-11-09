/**
 * ResearchX - Citation Manager
 * Validates inline citations, binds sources to markers, and builds academic bibliographies
 */

import { escapeHtml } from '../utils/helpers.js';

export class CitationManager {
  /**
   * Validate that all [N] references match registered source indices
   */
  static auditCitations(reportText, sources = []) {
    const citationRegex = /\[(\d+)\]/g;
    const matches = Array.from(reportText.matchAll(citationRegex));
    const citedIndices = new Set();
    const invalidIndices = new Set();

    for (const match of matches) {
      const idx = parseInt(match[1], 10);
      citedIndices.add(idx);
      if (idx < 1 || idx > sources.length) {
        invalidIndices.add(idx);
      }
    }

    return {
      totalCitationsCount: matches.length,
      uniqueSourcesCited: Array.from(citedIndices),
      invalidIndices: Array.from(invalidIndices),
      isValid: invalidIndices.size === 0
    };
  }

  /**
   * Build formal Markdown bibliography section
   */
  static generateBibliographyMarkdown(sources = []) {
    if (!sources || sources.length === 0) {
      return '## References\n\n*No external sources cited.*';
    }

    let md = '## References & Cited Sources\n\n';
    sources.forEach((s, idx) => {
      const citeNum = `[${idx + 1}]`;
      const title = s.title || 'Untitled Source';
      const url = s.url || '#';
      const date = s.published_date && s.published_date !== 'N/A' ? ` (${s.published_date})` : '';
      const domain = s.domain ? ` *${s.domain}*` : '';

      md += `${citeNum} **${title}**${domain}${date}. [Direct Link](${url})\n`;
      if (s.supporting_excerpt) {
        md += `> "${s.supporting_excerpt.slice(0, 200)}..."\n\n`;
      } else {
        md += '\n';
      }
    });

    return md;
  }
}

