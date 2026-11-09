/**
 * ResearchX - Agent 3: Analysis Agent
 * Synthesizes Findings, Comparative Trade-offs, and Evidence-based Insights
 */

import { GeminiAPI } from '../api/gemini.js';
import { parseAgentJson } from '../utils/formatter.js';

export class AnalystAgent {
  static get id() { return 'analyst'; }
  static get name() { return 'Analysis Agent'; }
  static get role() { return 'Quantitative & Comparative Data Analyst'; }
  static get description() { return 'Synthesizes gathered evidence, uncovers cross-domain patterns, evaluates trade-offs, and formulates evidence-based conclusions.'; }

  /**
   * Analyze findings gathered by all research agents
   */
  static async execute({ apiKey, model, topic, researchOutputs, allSources }) {
    const systemInstruction = `You are the Lead Data & Synthesis Analyst for ResearchX.
Your role is to deeply analyze all collected research findings, empirical statistics, and evidence gathered across subtasks.

RESPONSIBILITIES:
1. Synthesize multi-source information into cohesive key findings.
2. Formulate explicit advantages and disadvantages.
3. Construct side-by-side comparative matrices/points.
4. Detect underlying patterns, statistical trends, and correlations.
5. Formulate profound, evidence-grounded insights.
6. Provide solid, non-generic conclusions.

YOU MUST RESPOND IN VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "key_findings": ["finding 1", "finding 2", ...],
  "advantages": ["advantage 1", "advantage 2", ...],
  "disadvantages": ["disadvantage 1", "limitation 2", ...],
  "comparisons": [
    {
      "dimension": "Aspect/Metric being compared",
      "option_a": "Entity/Approach A assessment",
      "option_b": "Entity/Approach B assessment",
      "verdict": "Evidence-based takeaway"
    }
  ],
  "patterns": ["pattern 1", "pattern 2", ...],
  "insights": ["insight 1", "insight 2", ...],
  "conclusions": ["conclusion 1", "conclusion 2", ...]
}`;

    const prompt = `Research Topic: ${topic}
Collected Research Findings Across All Tasks:
${JSON.stringify(researchOutputs, null, 2)}

Verified Sources Count: ${allSources.length}

Perform comprehensive scientific analysis and output structured JSON.`;

    const result = await GeminiAPI.generate({
      apiKey,
      model,
      systemInstruction,
      prompt,
      temperature: 0.2
    });

    const parsed = parseAgentJson(result.text, {
      key_findings: [`Comprehensive investigation revealed significant advancements in ${topic}.`],
      advantages: [`Accelerates domain innovation and capability.`],
      disadvantages: [`Implementation complexities and resource overhead.`],
      comparisons: [
        {
          dimension: 'Standard vs Modern Approaches',
          option_a: 'Legacy baseline methods',
          option_b: 'Next-generation paradigm',
          verdict: 'Modern approaches offer superior scalability at the cost of setup complexity.'
        }
      ],
      patterns: [`Increasing convergence across automated workflows and empirical validation.`],
      insights: [`Synergistic integrations yield disproportionately higher efficiency.`],
      conclusions: [`${topic} represents a transformative shift with clear empirical backing.`]
    });

    return {
      output: parsed,
      tokensUsed: result.usage.totalTokenCount
    };
  }
}

