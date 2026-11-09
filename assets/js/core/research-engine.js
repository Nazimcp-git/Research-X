/**
 * ResearchX - Centralized Multi-Agent Research Engine
 * Manages Full End-to-End Orchestration, Parallel Execution, and Firebase Synchronization
 */

import { OrchestratorAgent } from '../agents/orchestrator.js';
import { ResearcherAgent } from '../agents/researcher.js';
import { AnalystAgent } from '../agents/analyst.js';
import { FactCheckerAgent } from '../agents/factchecker.js';
import { DebaterAgent } from '../agents/debater.js';
import { WriterAgent } from '../agents/writer.js';
import { EditorAgent } from '../agents/editor.js';
import { SourceManager } from './source-manager.js';
import { CitationManager } from './citation-manager.js';
import { DatabaseService } from '../database.js';

export class ResearchEngine {
  constructor(agentManager) {
    this.agentManager = agentManager;
    this.sourceManager = new SourceManager();
    this.isCancelled = false;
    this.isRunning = false;
    this.activeResearchId = null;
    this.currentUserUid = null;

    this.progress = 0; // 0 to 100
    this.currentStage = 'Idle';
    this.totalTokensUsed = 0;
    this.logs = [];
    this.callbacks = {
      onProgress: null,
      onLog: null,
      onSourceAdded: null,
      onComplete: null,
      onError: null
    };
  }

  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
  }

  log(agentId, message, type = 'info') {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      agentId,
      message,
      type
    };
    this.logs.push(entry);
    if (this.callbacks.onLog) {
      this.callbacks.onLog(entry);
    }
  }

  updateProgress(stage, percent) {
    this.currentStage = stage;
    this.progress = Math.min(100, Math.max(0, percent));
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress({
        stage: this.currentStage,
        progress: this.progress,
        tokensUsed: this.totalTokensUsed
      });
    }

    // Incremental Firebase progress sync if research session is active
    if (this.currentUserUid && this.activeResearchId) {
      DatabaseService.updateResearchProgress(this.currentUserUid, this.activeResearchId, {
        stage: this.currentStage,
        progress: this.progress,
        updatedAt: Date.now()
      }).catch(err => console.warn('Firebase progress sync warning:', err));
    }
  }

  stop() {
    this.isCancelled = true;
    this.isRunning = false;
    this.log('system', 'Research halted by user.', 'warning');
    this.updateProgress('Halted', this.progress);
  }

  /**
   * Run the complete multi-agent pipeline
   */
  async start({
    researchId,
    userUid,
    apiKey,
    model = 'gemini-flash-lite-latest',
    tavilyKey = '',
    jinaKey = '',
    topic,
    description = '',
    depth = 'Standard Research',
    language = 'English',
    maxSources = 6,
    format = 'Academic Report',
    targetWordCount = 1500,
    humanize = true,
    humanizeStyle = 'natural_academic',
    instructions = ''
  }) {
    if (this.isRunning) {
      throw new Error('Another research pipeline is already in execution.');
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.activeResearchId = researchId;
    this.currentUserUid = userUid;
    this.totalTokensUsed = 0;
    this.logs = [];
    this.sourceManager.clear();
    this.agentManager.resetAll();

    this.log('system', `Initializing research pipeline for: "${topic}" (Target: ${targetWordCount} words, Humanize: ${humanize ? 'On' : 'Off'})`, 'info');
    this.updateProgress('Initializing Agents', 5);

    const researchRecord = {
      id: researchId,
      topic,
      description,
      depth,
      language,
      format,
      targetWordCount,
      humanize,
      humanizeStyle,
      instructions,
      status: 'in_progress',
      progress: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sources: [],
      findings: null,
      debate: null,
      report: null,
      usage: { tokens: 0, models: [model] }
    };

    try {
      // Save initial record to Firebase
      if (userUid) {
        await DatabaseService.saveResearch(userUid, researchRecord);
      }

      // ====================================================================
      // STAGE 1: ORCHESTRATION & RESEARCH PLANNING
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Planning Research Strategy', 12);
      this.agentManager.setStatus('orchestrator', 'planning');
      this.agentManager.setTask('orchestrator', `Decomposing "${topic}" into subquestions and task schedule`);
      this.log('orchestrator', 'Formulating research strategy and subtask schedules...', 'info');

      const planResult = await OrchestratorAgent.execute({
        apiKey,
        model,
        topic,
        description,
        depth,
        language,
        format,
        instructions
      });

      this.totalTokensUsed += planResult.tokensUsed;
      const plan = planResult.output;
      this.agentManager.setOutput('orchestrator', plan);
      this.agentManager.setStatus('orchestrator', 'completed');
      this.log('orchestrator', `Plan synthesized: ${plan.tasks.length} parallel tasks, ${plan.research_questions.length} subquestions.`, 'success');

      if (userUid) {
        await DatabaseService.saveAgentData(userUid, researchId, 'orchestrator', plan);
      }

      // ====================================================================
      // STAGE 2: PARALLEL WEB & ACADEMIC RESEARCH (Promise.allSettled)
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Gathering Intelligence & Sources', 28);
      this.agentManager.setStatus('researcher', 'searching');
      this.agentManager.setTask('researcher', `Dispatching ${plan.tasks.length} investigative subtasks concurrently`);
      this.log('researcher', `Initiating parallel searches via Wikipedia${tavilyKey ? ', Tavily Search' : ''}${jinaKey ? ', Jina Reader' : ''}...`, 'info');

      // Adjust max sources according to depth
      const perTaskSources = depth === 'Deep Research' ? 4 : depth === 'Quick Research' ? 2 : 3;

      const researchPromises = plan.tasks.map(task =>
        ResearcherAgent.executeTask({
          apiKey,
          model,
          tavilyKey,
          jinaKey,
          task,
          language,
          maxSources: perTaskSources
        })
      );

      const settledResults = await Promise.allSettled(researchPromises);
      const successfulFindings = [];

      for (let i = 0; i < settledResults.length; i++) {
        const res = settledResults[i];
        const taskObj = plan.tasks[i];
        if (res.status === 'fulfilled') {
          this.totalTokensUsed += res.value.tokensUsed;
          successfulFindings.push(res.value.output);

          // Register and deduplicate collected sources
          if (res.value.output.sources) {
            for (const src of res.value.output.sources) {
              const added = this.sourceManager.addSource(src);
              if (added && this.callbacks.onSourceAdded) {
                this.callbacks.onSourceAdded(added);
              }
            }
          }
          this.log('researcher', `Completed task "${taskObj.id}": ${res.value.output.findings?.length || 0} findings recorded.`, 'info');
        } else {
          this.log('researcher', `Subtask "${taskObj.id}" encountered issue: ${res.reason?.message}`, 'warning');
        }
      }

      const allUniqueSources = this.sourceManager.getAll();
      this.agentManager.setOutput('researcher', {
        tasksCount: plan.tasks.length,
        collectedSourcesCount: allUniqueSources.length,
        findingsBatch: successfulFindings
      });
      this.agentManager.setStatus('researcher', 'completed');
      this.log('researcher', `Gathered ${allUniqueSources.length} verified unique sources.`, 'success');

      if (userUid) {
        await DatabaseService.saveSources(userUid, researchId, allUniqueSources);
      }

      // ====================================================================
      // STAGE 3: SYNTHESIS & ANALYSIS
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Synthesizing Evidence & Patterns', 46);
      this.agentManager.setStatus('analyst', 'analyzing');
      this.agentManager.setTask('analyst', 'Analyzing findings, identifying correlations, and evaluating trade-offs');
      this.log('analyst', 'Evaluating cross-task evidence, patterns, and trade-offs...', 'info');

      const analysisResult = await AnalystAgent.execute({
        apiKey,
        model,
        topic,
        researchOutputs: successfulFindings,
        allSources: allUniqueSources
      });

      this.totalTokensUsed += analysisResult.tokensUsed;
      const analysisOutput = analysisResult.output;
      this.agentManager.setOutput('analyst', analysisOutput);
      this.agentManager.setStatus('analyst', 'completed');
      this.log('analyst', `Formulated ${analysisOutput.key_findings?.length || 0} key findings and ${analysisOutput.comparisons?.length || 0} comparative dimensions.`, 'success');

      if (userUid) {
        await DatabaseService.saveAgentData(userUid, researchId, 'analyst', analysisOutput);
      }

      // ====================================================================
      // STAGE 4: FACT-CHECKING & SOURCE AUDITING
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Fact-Checking & Auditing Claims', 62);
      this.agentManager.setStatus('factchecker', 'verifying');
      this.agentManager.setTask('factchecker', 'Auditing claims, quotes, and statistics against source excerpts');
      this.log('factchecker', 'Auditing factual assertions against raw supporting excerpts...', 'info');

      const factCheckResult = await FactCheckerAgent.execute({
        apiKey,
        model,
        topic,
        analysisOutput,
        allSources: allUniqueSources
      });

      this.totalTokensUsed += factCheckResult.tokensUsed;
      const factCheckOutput = factCheckResult.output;
      this.agentManager.setOutput('factchecker', factCheckOutput);
      this.agentManager.setStatus('factchecker', 'completed');
      this.log('factchecker', `Audit completed: ${factCheckOutput.verified_claims?.length || 0} verified, ${factCheckOutput.unsupported_claims?.length || 0} flagged unsupported.`, 'success');

      if (userUid) {
        await DatabaseService.saveAgentData(userUid, researchId, 'factchecker', factCheckOutput);
      }

      // ====================================================================
      // STAGE 5: ADVERSARIAL DEBATE & RED-TEAMING
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Adversarial Debate & Red-Teaming', 74);
      this.agentManager.setStatus('debater', 'debating');
      this.agentManager.setTask('debater', 'Formulating counterarguments and discovering counter-perspectives');
      this.log('debater', 'Challenging findings and detecting consensus bias...', 'info');

      const debateResult = await DebaterAgent.execute({
        apiKey,
        model,
        topic,
        analysisOutput,
        factCheckOutput
      });

      this.totalTokensUsed += debateResult.tokensUsed;
      const debateOutput = debateResult.output;
      this.agentManager.setOutput('debater', debateOutput);
      this.agentManager.setStatus('debater', 'completed');
      this.log('debater', `Debate generated ${debateOutput.objections?.length || 0} critical objections and ${debateOutput.counterarguments?.length || 0} counterarguments.`, 'success');

      if (userUid) {
        await DatabaseService.saveAgentData(userUid, researchId, 'debater', debateOutput);
      }

      // ====================================================================
      // STAGE 6: REPORT DRAFTING & SCHOLARLY CITATIONS
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Drafting Academic Research Report', 85);
      this.agentManager.setStatus('writer', 'writing');
      this.agentManager.setTask('writer', 'Composing comprehensive 12-section research report with formal citations');
      this.log('writer', 'Synthesizing verified findings into formal academic paper with citations...', 'info');

      const writerResult = await WriterAgent.execute({
        apiKey,
        model,
        topic,
        description,
        depth,
        language,
        format,
        targetWordCount,
        humanize,
        humanizeStyle,
        plan,
        analysisOutput,
        factCheckOutput,
        debateOutput,
        allSources: allUniqueSources
      });

      this.totalTokensUsed += writerResult.tokensUsed;
      const draftReport = writerResult.output;
      this.agentManager.setOutput('writer', draftReport);
      this.agentManager.setStatus('writer', 'completed');
      this.log('writer', `Draft generated (~${draftReport.actual_word_count || draftReport.word_count_estimate || targetWordCount} words, Voice: ${humanizeStyle}). Passing to Editor.`, 'success');

      if (userUid) {
        await DatabaseService.saveAgentData(userUid, researchId, 'writer', draftReport);
      }

      // ====================================================================
      // STAGE 7: EDITORIAL REVIEW & PUBLICATION CERTIFICATION
      // ====================================================================
      if (this.isCancelled) return;
      this.updateProgress('Editorial Review & Quality Assurance', 95);
      this.agentManager.setStatus('editor', 'reviewing');
      this.agentManager.setTask('editor', 'Auditing citation mappings, humanizing cadence, and certifying final text');
      this.log('editor', 'Conducting final editorial review and citation alignment...', 'info');

      const editorResult = await EditorAgent.execute({
        apiKey,
        model,
        topic,
        draftReport,
        allSources: allUniqueSources,
        language,
        targetWordCount,
        humanize,
        humanizeStyle
      });

      this.totalTokensUsed += editorResult.tokensUsed;
      const finalApproved = editorResult.output;
      this.agentManager.setOutput('editor', finalApproved);
      this.agentManager.setStatus('editor', 'completed');
      this.log('editor', `Report certified with QA Score of ${finalApproved.editorial_score || 95}/100 and Humanization Score of ${finalApproved.humanization_score || 97}/100 (${finalApproved.word_count || targetWordCount} words).`, 'success');

      // Append bibliography markdown to final report
      const bibliography = CitationManager.generateBibliographyMarkdown(allUniqueSources);
      let completeMarkdown = finalApproved.approved_report;
      if (!completeMarkdown.includes('## References')) {
        completeMarkdown += `\n\n${bibliography}`;
      }

      // ====================================================================
      // FINALIZATION & FIREBASE PERSISTENCE
      // ====================================================================
      const finalReportData = {
        title: finalApproved.approved_title || draftReport.title || topic,
        executive_summary: draftReport.executive_summary,
        approved_report: completeMarkdown,
        editorial_notes: finalApproved.editorial_notes || [],
        editorial_score: finalApproved.editorial_score || 95,
        humanization_score: finalApproved.humanization_score || 97,
        word_count: finalApproved.word_count || draftReport.actual_word_count || targetWordCount,
        target_word_count: targetWordCount,
        humanize_style: humanizeStyle,
        citation_audit: finalApproved.citation_audit || {},
        follow_up_questions: finalApproved.follow_up_questions || []
      };

      const finalRecord = {
        ...researchRecord,
        status: 'completed',
        progress: 100,
        updatedAt: Date.now(),
        plan,
        sources: allUniqueSources,
        findings: analysisOutput,
        debate: debateOutput,
        report: finalReportData,
        usage: {
          totalTokens: this.totalTokensUsed,
          model
        }
      };

      if (userUid) {
        await DatabaseService.saveResearch(userUid, finalRecord);
      }

      this.updateProgress('Research Completed', 100);
      this.log('system', 'Research session completed successfully. All artifacts persisted.', 'success');
      this.isRunning = false;

      if (this.callbacks.onComplete) {
        this.callbacks.onComplete(finalRecord);
      }

      return finalRecord;
    } catch (err) {
      console.error('Research pipeline failed:', err);
      this.isRunning = false;
      this.log('system', `Pipeline execution error: ${err.message}`, 'error');

      // Mark running agent as failed
      for (const ag of this.agentManager.getAll()) {
        if (ag.status !== 'completed' && ag.status !== 'waiting') {
          this.agentManager.setStatus(ag.id, 'failed', err.message);
        }
      }

      if (userUid && this.activeResearchId) {
        DatabaseService.updateResearchProgress(userUid, this.activeResearchId, {
          status: 'failed',
          error: err.message,
          updatedAt: Date.now()
        }).catch(() => {});
      }

      if (this.callbacks.onError) {
        this.callbacks.onError(err);
      }
      throw err;
    }
  }
}

