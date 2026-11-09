/**
 * ResearchX - Agent 2: Research Agent
 * Multi-source Information Gathering (Tavily, Wikipedia, Jina Reader) & Extraction
 */

import { GeminiAPI } from '../api/gemini.js';
import { TavilyAPI } from '../api/tavily.js';
import { WikipediaAPI } from '../api/wikipedia.js';
import { JinaReaderAPI } from '../api/jina.js';
import { parseAgentJson } from '../utils/formatter.js';

export class ResearcherAgent {
  static get id() { return 'researcher'; }
  static get name() { return 'Researcher'; }
  static get role() { return 'Web & Academic Intelligence Scout'; }
  static get description() { return 'Executes parallel searches across Tavily, Wikipedia, and Jina Reader to gather empirical evidence, statistics, and verifiable sources.'; }

  /**
   * Execute a single research task
   */
  static async executeTask({
    apiKey,
    model,
    tavilyKey,
    jinaKey,
    task,
    language = 'en',
    maxSources = 4
  }) {
    const rawSources = [];

    // 1. Wikipedia Search (Free, CORS enabled, high reliability)
    try {
      const wikiResults = await WikipediaAPI.search({
        query: task.query || task.focus,
        lang: language === 'Malayalam' ? 'ml' : language === 'Arabic' ? 'ar' : language === 'Hindi' ? 'hi' : 'en',
        limit: 2
      });
      wikiResults.forEach(w => {
        rawSources.push({
          title: `Wikipedia: ${w.title}`,
          url: w.url,
          snippet: w.snippet,
          published_date: 'N/A'
        });
      });
    } catch (e) {
      console.warn('Researcher: Wikipedia query error:', e.message);
    }

    // 2. Tavily Web Search (if Tavily API key provided)
    if (tavilyKey) {
      try {
        const tavilyRes = await TavilyAPI.search({
          apiKey: tavilyKey,
          query: task.query,
          maxResults: maxSources,
          searchDepth: 'basic'
        });

        if (tavilyRes.results) {
          for (const item of tavilyRes.results) {
            rawSources.push({
              title: item.title,
              url: item.url,
              snippet: item.snippet,
              published_date: item.publishedDate || 'N/A'
            });
          }
        }
      } catch (e) {
        console.warn('Researcher: Tavily query error:', e.message);
      }
    }

    // 3. Jina Reader deep-read on top 1-2 web sources if available
    const deepContext = [];
    const candidates = rawSources.filter(s => s.url && !s.url.includes('wikipedia.org')).slice(0, 2);

    for (const cand of candidates) {
      try {
        const jinaRes = await JinaReaderAPI.extract({
          url: cand.url,
          apiKey: jinaKey,
          maxChars: 2500
        });
        if (jinaRes.content) {
          deepContext.push(`Source: ${cand.url}\nExcerpt: ${jinaRes.content}`);
          // Enhance snippet if available
          cand.snippet = jinaRes.content.slice(0, 400);
        }
      } catch (e) {
        console.warn('Researcher: Jina read error on', cand.url, e.message);
      }
    }

    // 4. Synthesize and extract findings via Gemini
    const systemInstruction = `You are a Senior Evidence Retrieval Specialist for ResearchX.
Your task is to analyze raw collected materials and extract verifiable facts, empirical statistics, concrete findings, and reputable sources.

CRITICAL RULES:
- Never fabricate sources, URLs, dates, or statistics.
- If no real external sources could be retrieved, note this honestly in "research_gaps" and extract general evidence concepts.
- Provide supporting excerpts for every source.
- YOU MUST RESPOND IN VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "task": "${task.query || ''}",
  "findings": ["finding 1", "finding 2", ...],
  "important_facts": ["fact 1", "fact 2", ...],
  "statistics": ["statistic with exact number and context", ...],
  "sources": [
    {
      "title": "Title of article",
      "url": "https://...",
      "published_date": "YYYY-MM-DD or N/A",
      "supporting_excerpt": "Exact text or summary supporting the facts"
    }
  ],
  "research_gaps": ["Unresolved question or missing data", ...]
}`;

    const prompt = `Research Task: ${task.query}
Focus Area: ${task.focus}
Raw Collected Web & Encyclopedia Materials:
${JSON.stringify(rawSources, null, 2)}

Deep Read Excerpts:
${deepContext.join('\n\n---\n\n') || 'None'}

Please extract structured evidence and return valid JSON.`;

    const result = await GeminiAPI.generate({
      apiKey,
      model,
      systemInstruction,
      prompt,
      temperature: 0.15
    });

    const parsed = parseAgentJson(result.text, {
      task: task.query,
      findings: [`Investigated ${task.query} across available academic and online resources.`],
      important_facts: [`Key concepts identified for ${task.focus}`],
      statistics: [],
      sources: rawSources.slice(0, maxSources).map(s => ({
        title: s.title,
        url: s.url,
        published_date: s.published_date || 'N/A',
        supporting_excerpt: s.snippet || 'Referenced evidence.'
      })),
      research_gaps: ['Requires deeper domain-specific empirical study.']
    });

    // Ensure rawSources are not lost if model returned empty sources array
    if ((!parsed.sources || parsed.sources.length === 0) && rawSources.length > 0) {
      parsed.sources = rawSources.slice(0, maxSources).map(s => ({
        title: s.title,
        url: s.url,
        published_date: s.published_date || 'N/A',
        supporting_excerpt: s.snippet || 'Evidence citation.'
      }));
    }

    return {
      output: parsed,
      tokensUsed: result.usage.totalTokenCount,
      rawCount: rawSources.length
    };
  }
}

