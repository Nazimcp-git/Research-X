/**
 * ResearchX - Agent 1: Orchestrator
 * Master Planner & Task Decomposition Agent
 */

import { GeminiAPI } from '../api/gemini.js';
import { parseAgentJson } from '../utils/formatter.js';

export class OrchestratorAgent {
  static get id() { return 'orchestrator'; }
  static get name() { return 'Orchestrator'; }
  static get role() { return 'Chief Systems Architect & Research Planner'; }
  static get description() { return 'Decomposes research topic into subquestions, formulates hypotheses, and schedules parallel research tasks.'; }

  /**
   * Plan the research strategy
   */
  static async execute({ apiKey, model, topic, description, depth, language, format, instructions }) {
    const systemInstruction = `You are the Lead Research Orchestrator for ResearchX, an elite academic and scientific multi-agent intelligence platform.
Your objective is to thoroughly analyze the user's research topic, scope, and requirements, then decompose it into an actionable, comprehensive research plan.

GUIDELINES:
1. Formulate 3 to 6 precise, deep-dive research questions.
2. Define between 3 and 6 distinct search and retrieval tasks that can be executed concurrently by Research Agents.
3. Determine which tasks can run in parallel (set "can_parallel": true).
4. Outline the expected sections for the final academic report.
5. Provide a succinct research strategy rationale.
6. YOU MUST RESPOND IN VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "research_title": "Precise, professional academic title",
  "research_objective": "Comprehensive statement of research aims and methodology",
  "research_questions": ["question 1", "question 2", ...],
  "tasks": [
    {
      "id": "task_1",
      "query": "High precision web search query",
      "focus": "Specific data, statistics, or mechanisms to uncover",
      "can_parallel": true
    }
  ],
  "expected_sections": ["Section 1", "Section 2", ...],
  "research_strategy": "Rationale for the selected investigative trajectory"
}`;

    const prompt = `Research Topic: ${topic}
Additional Scope/Context: ${description || 'None provided'}
Research Depth: ${depth || 'Standard'}
Preferred Language: ${language || 'English'}
Target Report Format: ${format || 'Academic Report'}
Special Instructions: ${instructions || 'None'}

Please construct the complete research plan in valid JSON format.`;

    const result = await GeminiAPI.generate({
      apiKey,
      model,
      systemInstruction,
      prompt,
      temperature: 0.1
    });

    const parsed = parseAgentJson(result.text, {
      research_title: topic,
      research_objective: `Investigate and synthesize state-of-the-art knowledge on: ${topic}`,
      research_questions: [
        `What are the core fundamentals and recent developments in ${topic}?`,
        `What empirical evidence and statistics exist regarding ${topic}?`,
        `What are the major challenges, trade-offs, and future trajectories for ${topic}?`
      ],
      tasks: [
        { id: 'task_1', query: `${topic} latest research developments and statistics`, focus: 'Recent empirical data and breakthroughs', can_parallel: true },
        { id: 'task_2', query: `${topic} advantages disadvantages comparative analysis`, focus: 'Comparative performance and limitations', can_parallel: true },
        { id: 'task_3', query: `${topic} controversies challenges and future outlook`, focus: 'Critical debate and unresolved questions', can_parallel: true }
      ],
      expected_sections: [
        'Executive Summary',
        'Introduction & Background',
        'Detailed Findings & Empirical Evidence',
        'Comparative Evaluation & Trade-offs',
        'Critical Challenges & Debate',
        'Future Directions & Conclusion',
        'References'
      ],
      research_strategy: 'Multi-faceted decomposition covering foundations, empirical metrics, comparative trade-offs, and critical debate.'
    });

    return {
      output: parsed,
      tokensUsed: result.usage.totalTokenCount
    };
  }
}

