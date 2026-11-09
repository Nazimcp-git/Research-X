/**
 * ResearchX - Agent 5: Debate Agent
 * Adversarial Red-Team & Dialectical Inquiry Agent
 */

import { GeminiAPI } from '../api/gemini.js';
import { parseAgentJson } from '../utils/formatter.js';

export class DebaterAgent {
  static get id() { return 'debater'; }
  static get name() { return 'Debate Agent'; }
  static get role() { return 'Adversarial Critic & Red-Team Dialectician'; }
  static get description() { return 'Challenges conclusions, spots cognitive biases and logical fallacies, uncovers contrary perspectives, and demands higher burden of proof.'; }

  /**
   * Challenge the analysis and fact-check results
   */
  static async execute({ apiKey, model, topic, analysisOutput, factCheckOutput }) {
    const systemInstruction = `You are the Adversarial Dialectician and Red-Team Critic for ResearchX.
Your purpose is to prevent consensus bias, challenge unexamined assumptions, detect logical fallacies, and supply contrary academic perspectives.

GUIDELINES:
1. Actively challenge the conclusions and claims of the Analysis Agent.
2. Formulate razor-sharp objections and rigorous counterarguments.
3. Highlight missing socio-economic, ethical, operational, or technical perspectives.
4. Pinpoint weak arguments, over-generalizations, or correlation-causation fallacies.
5. Provide actionable revision suggestions for the Writer Agent to ensure balanced, nuanced scholarship.

YOU MUST RESPOND IN VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "objections": ["objection 1", "objection 2", ...],
  "counterarguments": [
    {
      "claim_challenged": "Claim from analysis",
      "counter_evidence": "Counter-perspective or empirical objection",
      "severity": "Major | Moderate | Minor"
    }
  ],
  "missing_perspectives": ["Overlooked ethical/economic/technical factor", ...],
  "weak_arguments": ["Unjustified assumption or overstatement", ...],
  "recommended_revisions": ["Concrete recommendation for final report", ...]
}`;

    const prompt = `Research Topic: ${topic}

Analysis Agent Findings & Conclusions:
Key Findings: ${JSON.stringify(analysisOutput.key_findings || [])}
Conclusions: ${JSON.stringify(analysisOutput.conclusions || [])}
Advantages & Disadvantages: ${JSON.stringify({ adv: analysisOutput.advantages, dis: analysisOutput.disadvantages })}

Fact-Check Assessment:
${JSON.stringify({
  unsupported: factCheckOutput.unsupported_claims || [],
  disputed: factCheckOutput.disputed_claims || [],
  assessment: factCheckOutput.overall_assessment || ''
})}

Subject these conclusions to adversarial critique and return valid JSON.`;

    const result = await GeminiAPI.generate({
      apiKey,
      model,
      systemInstruction,
      prompt,
      temperature: 0.3
    });

    const parsed = parseAgentJson(result.text, {
      objections: [
        `Analysis may overestimate adoption velocity without accounting for regulatory or infrastructure bottlenecks.`
      ],
      counterarguments: [
        {
          claim_challenged: `Rapid and seamless transition in ${topic}.`,
          counter_evidence: `Empirical deployment in enterprise legacy environments consistently exhibits high switching costs.`,
          severity: 'Moderate'
        }
      ],
      missing_perspectives: [
        `Long-term economic viability and total cost of ownership (TCO) beyond initial benchmarks.`
      ],
      weak_arguments: [
        `Assuming optimal conditions in practical production implementations.`
      ],
      recommended_revisions: [
        `Emphasize environmental, operational, and institutional friction factors alongside technical benefits.`
      ]
    });

    return {
      output: parsed,
      tokensUsed: result.usage.totalTokenCount
    };
  }
}

