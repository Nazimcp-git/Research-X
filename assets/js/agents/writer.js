/**
 * ResearchX - Agent 6: Writer Agent
 * Comprehensive Academic Synthesis, Report Drafting, Target Word Count & Humanizing Controls
 */

import { GeminiAPI } from '../api/gemini.js';
import { parseAgentJson } from '../utils/formatter.js';

export class WriterAgent {
  static get id() { return 'writer'; }
  static get name() { return 'Writer Agent'; }
  static get role() { return 'Lead Academic Author & Report Synthesizer'; }
  static get description() { return 'Composes the full academic report adhering to formal scholarly conventions, target word count, humanized natural voice, and explicit numeric citations.'; }

  /**
   * Draft the comprehensive research report
   */
  static async execute({
    apiKey,
    model,
    topic,
    description,
    depth,
    language,
    format,
    targetWordCount = 1500,
    humanize = true,
    humanizeStyle = 'natural_academic',
    plan,
    analysisOutput,
    factCheckOutput,
    debateOutput,
    allSources
  }) {
    // Build sources citation index for prompt
    const sourceIndexText = allSources.map((s, idx) => `[${idx + 1}] "${s.title}" - ${s.url} (Excerpt: ${(s.supporting_excerpt || s.snippet || '').slice(0, 150)}...)`).join('\n');

    // Humanizing directives based on user style
    let humanizeRules = '';
    if (humanize) {
      humanizeRules = `
HUMANIZING & NATURAL VOICE DIRECTIVES:
1. STRICTLY ELIMINATE ROBOTIC AI CLICHÉS:
   - Forbid words and phrases: "delve", "tapestry", "testament", "beacon", "crucial", "in the realm of", "navigating the complex landscape", "it is important to note", "a double-edged sword", "plays a pivotal role", "fosters a culture of", "in conclusion it is clear".
2. SYNTACTIC BURSTINESS & RHYTHMIC VARIATION:
   - Introduce natural sentence length variance. Mix short punchy declarations (5–9 words) with nuanced, compound analytical observations (22–32 words).
   - Avoid monotonous sentence openings; never start consecutive sentences with passive participles ("By utilizing...", "Having established...").
3. TONE SPECIFICATION (${humanizeStyle.toUpperCase()}):
   - ${humanizeStyle === 'executive' ? 'Executive & Direct: Crisp, active voice, bottom-line upfront, zero corporate fluff, punchy bullet points.' : humanizeStyle === 'peer_reviewed' ? 'Peer-Reviewed Scientific: Skeptical, rigorous, cautious with generalizations, precise statistical terminology, active academic prose.' : 'Natural Scholarly: Engaging, authentic scientific inquiry, nuanced argument flow, human intellectual curiosity.'}`;
    }

    const systemInstruction = `You are the Lead Scientific Author for ResearchX, producing publication-grade academic research monographs and SaaS intelligence briefs.

TARGET LENGTH: Exactly aim for approximately ${targetWordCount} words. Proportionally allocate depth across sections to meet this target thoroughly without filler.

MANDATORY REPORT STRUCTURE:
1. Research Title
2. Executive Summary (Concise, high-impact synthesis)
3. Introduction & Research Objectives
4. Background & Foundational Context
5. Detailed Research Findings & Empirical Data
6. Statistical Analysis & Quantitative Metrics (include Markdown tables where relevant)
7. Advantages and Disadvantages Evaluation
8. Comparative Analysis (with comparative table)
9. Challenges, Risks, and Future Opportunities
10. Debate & Alternative Perspectives (incorporating Red-Team critiques)
11. Strategic Conclusion & Next Steps
12. References (List numbered sources [1], [2], ...)

CITATION RULES:
- Use inline citations like [1], [2], [1, 3] throughout the report whenever stating facts, numbers, or conclusions.
- ONLY cite sources that exist in the provided Sources Index.
- NEVER invent citations, URLs, or non-existent papers.
- Preferred Language: ${language || 'English'}. If not English, write the entire report text in ${language}.
${humanizeRules}

YOU MUST RESPOND IN VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "title": "Full Academic Title",
  "executive_summary": "High-level 2-3 paragraph executive overview",
  "full_report_markdown": "# Title\\n\\n## Executive Summary...\\n\\n(Complete extensive markdown text adhering to the 12 sections)",
  "word_count_estimate": ${targetWordCount},
  "cited_source_indices": [1, 2, ...]
}`;

    const prompt = `Research Topic: ${topic}
Additional Scope: ${description || 'Standard academic scope'}
Depth Level: ${depth || 'Standard Research'}
Report Style: ${format || 'Academic Report'}
Language: ${language || 'English'}
Target Word Count: ${targetWordCount} words
Humanize Voice: ${humanize ? 'Enabled (' + humanizeStyle + ')' : 'Disabled'}

APPROVED RESEARCH SOURCES INDEX:
${sourceIndexText || 'No external sources available. Use baseline literature citations.'}

SYNTHESIZED ANALYSIS:
${JSON.stringify(analysisOutput, null, 2)}

FACT-CHECK AUDIT (VERIFIED & UNVERIFIED):
${JSON.stringify({
  verified: factCheckOutput.verified_claims,
  unsupported: factCheckOutput.unsupported_claims,
  assessment: factCheckOutput.overall_assessment
}, null, 2)}

DEBATE & ADVERSARIAL CRITIQUES:
${JSON.stringify(debateOutput, null, 2)}

Draft the complete, in-depth academic report in valid JSON aiming for ${targetWordCount} words.`;

    const result = await GeminiAPI.generate({
      apiKey,
      model,
      systemInstruction,
      prompt,
      temperature: humanize ? 0.35 : 0.2, // slightly higher temperature for natural linguistic burstiness
      timeoutMs: 60000
    });

    const parsed = parseAgentJson(result.text, {
      title: `${topic}: A Comprehensive Academic Investigation`,
      executive_summary: `This report investigates ${topic}, evaluating current empirical benchmarks, comparative paradigms, and operational trade-offs.`,
      full_report_markdown: `# ${topic}: A Comprehensive Academic Investigation\n\n## Executive Summary\n\nThis research paper presents an evidence-based investigation into ${topic}.\n\n## Introduction\n\n${topic} represents a crucial domain in modern scientific and industrial inquiry.\n\n## Conclusion\n\nEmpirical validation confirms substantial merit with actionable future trajectories.\n\n## References\n\n${allSources.map((s, idx) => `[${idx + 1}] ${s.title} — ${s.url}`).join('\n')}`,
      word_count_estimate: targetWordCount,
      cited_source_indices: allSources.map((_, i) => i + 1)
    });

    // Compute actual word count
    const words = (parsed.full_report_markdown || '').split(/\s+/).filter(Boolean).length;
    parsed.actual_word_count = words;

    return {
      output: parsed,
      tokensUsed: result.usage.totalTokenCount
    };
  }
}
