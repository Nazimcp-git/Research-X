/**
 * ResearchX - Database Service
 * Firebase Realtime Database Operations matching Section 8 Schema
 */

import { getDatabase } from './firebase.js';

export class DatabaseService {
  /**
   * Save complete or partial research session
   */
  static async saveResearch(userUid, researchData) {
    if (!userUid || !researchData.id) {
      throw new Error('User UID and Research ID are required to save research.');
    }
    const db = getDatabase();
    const researchRef = db.ref(`users/${userUid}/research/${researchData.id}`);
    await researchRef.update({
      ...researchData,
      updatedAt: Date.now()
    });
    return researchData;
  }

  /**
   * Save specific agent output into users/{uid}/research/{id}/agents/{agentId}
   */
  static async saveAgentData(userUid, researchId, agentId, data) {
    if (!userUid || !researchId || !agentId) return;
    const db = getDatabase();
    const agentRef = db.ref(`users/${userUid}/research/${researchId}/agents/${agentId}`);
    return agentRef.set({
      output: data,
      savedAt: Date.now()
    });
  }

  /**
   * Save sources array into users/{uid}/research/{id}/sources
   */
  static async saveSources(userUid, researchId, sources = []) {
    if (!userUid || !researchId) return;
    const db = getDatabase();
    const sourcesRef = db.ref(`users/${userUid}/research/${researchId}/sources`);
    return sourcesRef.set(sources);
  }

  /**
   * Update research progress and status
   */
  static async updateResearchProgress(userUid, researchId, updates) {
    if (!userUid || !researchId) return;
    const db = getDatabase();
    const ref = db.ref(`users/${userUid}/research/${researchId}`);
    return ref.update({
      ...updates,
      updatedAt: Date.now()
    });
  }

  /**
   * Fetch single research session by ID
   */
  static async getResearch(userUid, researchId) {
    if (!userUid || !researchId) return null;
    const db = getDatabase();
    const ref = db.ref(`users/${userUid}/research/${researchId}`);
    const snapshot = await ref.once('value');
    return snapshot.val();
  }

  /**
   * Fetch all research sessions for user
   */
  static async getAllResearch(userUid) {
    if (!userUid) return [];
    const db = getDatabase();
    const ref = db.ref(`users/${userUid}/research`);
    const snapshot = await ref.once('value');
    const data = snapshot.val();
    if (!data) return [];

    // Convert map to array and sort descending by createdAt
    return Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  /**
   * Delete research session
   */
  static async deleteResearch(userUid, researchId) {
    if (!userUid || !researchId) return;
    const db = getDatabase();
    const ref = db.ref(`users/${userUid}/research/${researchId}`);
    return ref.remove();
  }

  /**
   * Compute dashboard summary metrics
   */
  static async getDashboardMetrics(userUid) {
    const list = await this.getAllResearch(userUid);
    const totalSessions = list.length;
    const completedSessions = list.filter(r => r.status === 'completed').length;
    const totalSources = list.reduce((acc, curr) => acc + (curr.sources?.length || 0), 0);
    const totalTokens = list.reduce((acc, curr) => acc + (curr.usage?.totalTokens || 0), 0);

    return {
      totalSessions,
      completedSessions,
      totalSources,
      totalTokens,
      recentSessions: list.slice(0, 5)
    };
  }
}

