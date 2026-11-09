/**
 * ResearchX - Agent Manager
 * Tracks execution states, timers, tasks, and outputs for all 7 AI Agents
 */

export class AgentManager {
  constructor() {
    this.agents = new Map();
    this.listeners = new Set();
    this.initAgents();
  }

  initAgents() {
    const definitions = [
      { id: 'orchestrator', name: 'Orchestrator', role: 'Chief Architect & Research Planner', icon: 'compass', defaultStatus: 'waiting' },
      { id: 'researcher', name: 'Researcher', role: 'Multi-Source Intelligence Scout', icon: 'search', defaultStatus: 'waiting' },
      { id: 'analyst', name: 'Analyst', role: 'Comparative & Pattern Data Analyst', icon: 'bar-chart-2', defaultStatus: 'waiting' },
      { id: 'factchecker', name: 'Fact-Checker', role: 'Verification Officer & Auditor', icon: 'shield-check', defaultStatus: 'waiting' },
      { id: 'debater', name: 'Debater', role: 'Adversarial Critic & Red-Team', icon: 'message-square', defaultStatus: 'waiting' },
      { id: 'writer', name: 'Writer', role: 'Lead Author & Report Synthesizer', icon: 'file-text', defaultStatus: 'waiting' },
      { id: 'editor', name: 'Editor', role: 'Editor-in-Chief & QA Certifier', icon: 'check-circle', defaultStatus: 'waiting' }
    ];

    definitions.forEach(def => {
      this.agents.set(def.id, {
        ...def,
        status: def.defaultStatus, // 'waiting'|'planning'|'searching'|'analyzing'|'verifying'|'debating'|'writing'|'reviewing'|'completed'|'failed'
        startTime: null,
        endTime: null,
        durationMs: 0,
        currentTask: 'Awaiting deployment...',
        completedTasks: 0,
        output: null,
        error: null
      });
    });
  }

  resetAll() {
    this.initAgents();
    this.notify();
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (!agent) return;

    if (updates.status && updates.status !== agent.status) {
      if (!agent.startTime && updates.status !== 'waiting') {
        agent.startTime = Date.now();
      }
      if (updates.status === 'completed' || updates.status === 'failed') {
        agent.endTime = Date.now();
        if (agent.startTime) {
          agent.durationMs = agent.endTime - agent.startTime;
        }
      }
    }

    Object.assign(agent, updates);
    this.notify(id, agent);
  }

  setTask(id, taskDescription) {
    this.updateAgent(id, { currentTask: taskDescription });
  }

  setStatus(id, status, error = null) {
    const updates = { status };
    if (error) updates.error = error;
    if (status === 'completed') {
      const current = this.agents.get(id);
      updates.completedTasks = (current?.completedTasks || 0) + 1;
    }
    this.updateAgent(id, updates);
  }

  setOutput(id, output) {
    this.updateAgent(id, { output });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(agentId, agent) {
    for (const listener of this.listeners) {
      try {
        listener(agentId, agent, this.getAll());
      } catch (err) {
        console.error('AgentManager listener error:', err);
      }
    }
  }
}

