/**
 * ResearchX - Formatter & Data Parser Utilities
 * Pure ES6 Module
 */

import { escapeHtml, extractDomain } from './helpers.js';

/**
 * Robust JSON extraction from LLM response
 * Handles markdown code fences, leading/trailing prose, and unescaped characters
 */
export function parseAgentJson(rawText, fallback = {}) {
  if (!rawText) return fallback;
  if (typeof rawText === 'object') return rawText;

  let cleaned = String(rawText).trim();

  // Strip ```json and ``` fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find first { or [ and last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('JSON direct parse failed, attempting sanitization:', err.message);
    try {
      // Common fixes: trailing commas, newline escapes
      const sanitized = cleaned
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u0019]+/g, ' ');
      return JSON.parse(sanitized);
    } catch (e2) {
      console.error('Failed to parse agent JSON:', e2);
      return fallback;
    }
  }
}

export { formatDuration, formatTokens } from './helpers.js';

/**
 * Transform report text to enrich citations [1], [2] with interactive badges
 */
export function enrichCitations(reportText, sources = []) {
  if (!reportText) return '';

  // Replace [1], [2], [1, 2] with interactive markup
  return reportText.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (match, nums) => {
    const list = nums.split(',').map(n => n.trim());
    return list.map(n => {
      const idx = parseInt(n, 10);
      const source = sources[idx - 1];
      const titleAttr = source ? escapeHtml(source.title || source.url) : `Source ${idx}`;
      const url = source ? source.url : '#';
      return `<a class="citation-ref" href="${url}" target="_blank" rel="noopener noreferrer" title="${titleAttr}">[${idx}]</a>`;
    }).join(' ');
  });
}

/**
 * Build Cytoscape graph elements from structured research data
 * Connects Topic -> Key Concepts -> Organizations/Entities -> Evidence/Statistics -> Sources
 */
export function buildCytoscapeElements(research) {
  const elements = [];
  const addedNodes = new Set();

  function addNode(id, label, type, extra = {}) {
    if (addedNodes.has(id)) return;
    addedNodes.add(id);
    elements.push({
      data: {
        id,
        label,
        type,
        ...extra
      }
    });
  }

  function addEdge(source, target, label = '') {
    const edgeId = `e_${source}_${target}`;
    elements.push({
      data: {
        id: edgeId,
        source,
        target,
        label
      }
    });
  }

  // 1. Root Topic Node
  const rootId = 'topic_root';
  const topicTitle = research.topic || 'Research Topic';
  addNode(rootId, topicTitle, 'topic', {
    description: research.description || 'Primary research objective',
    depth: research.depth
  });

  // 2. Findings / Concepts from Analyst Agent
  const findings = research.findings?.key_findings || research.plan?.expected_sections || [];
  findings.slice(0, 6).forEach((finding, idx) => {
    const conceptId = `concept_${idx}`;
    const cleanLabel = typeof finding === 'string' ? finding.slice(0, 45) + (finding.length > 45 ? '...' : '') : `Finding ${idx + 1}`;
    addNode(conceptId, cleanLabel, 'concept', {
      fullText: typeof finding === 'string' ? finding : JSON.stringify(finding)
    });
    addEdge(rootId, conceptId, 'relates to');
  });

  // 3. Comparisons / Advantages
  const advantages = research.findings?.advantages || [];
  advantages.slice(0, 3).forEach((adv, idx) => {
    const advId = `adv_${idx}`;
    const label = typeof adv === 'string' ? adv.slice(0, 40) + '...' : `Advantage ${idx + 1}`;
    addNode(advId, label, 'evidence', {
      fullText: adv
    });
    addEdge(rootId, advId, 'advantage');
  });

  // 4. Debate / Counterarguments
  const objections = research.debate?.objections || research.debate?.counterarguments || [];
  objections.slice(0, 3).forEach((obj, idx) => {
    const objId = `debate_${idx}`;
    const label = typeof obj === 'string' ? obj.slice(0, 40) + '...' : `Counterpoint ${idx + 1}`;
    addNode(objId, label, 'organization', {
      fullText: obj
    });
    addEdge(rootId, objId, 'critique');
  });

  // 5. Sources collected
  const sources = research.sources || [];
  sources.slice(0, 7).forEach((src, idx) => {
    const srcId = `source_${idx}`;
    const domain = extractDomain(src.url || '');
    addNode(srcId, domain, 'source', {
      title: src.title || domain,
      url: src.url,
      snippet: src.supporting_excerpt || src.snippet || ''
    });

    // Link source to closest concept or root
    const targetConcept = elements.find(el => el.data.type === 'concept');
    if (targetConcept) {
      addEdge(targetConcept.data.id, srcId, 'cited by');
    } else {
      addEdge(rootId, srcId, 'source');
    }
  });

  return elements;
}

