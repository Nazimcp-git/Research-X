/**
 * ResearchX - Gemini API Integration Module
 * Official REST Integration with Structured JSON Responses, Auto-Cascade Failover & Token Tracking
 */

import { fetchWithTimeout, keyStore } from '../utils/helpers.js';

export class GeminiAPI {
  /**
   * Resilient cascade of operational models
   */
  static get fallbackCascade() {
    return [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-pro-latest'
    ];
  }

  /**
   * Normalize model identifier (e.g. "models/gemini-3.5-flash" -> "gemini-3.5-flash")
   */
  static cleanModelName(model) {
    if (!model) return 'gemini-flash-lite-latest';
    return String(model).trim().replace(/^models\//, '');
  }

  /**
   * Query Google ModelService to discover all models available for the provided API key
   */
  static async listModels(apiKey) {
    if (!apiKey) return [];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 10000);

      if (!response.ok) return [];

      const data = await response.json();
      const models = (data.models || [])
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => this.cleanModelName(m.name));

      return models;
    } catch (err) {
      console.warn('Gemini listModels notice:', err.message);
      return [];
    }
  }

  /**
   * Internal direct endpoint invocation
   */
  static async _callEndpoint({
    apiKey,
    model,
    systemInstruction = '',
    prompt = '',
    temperature = 0.2,
    timeoutMs = 20000
  }) {
    const activeModel = this.cleanModelName(model);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: Math.max(0.0, Math.min(1.0, temperature)),
        responseMimeType: 'application/json'
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, timeoutMs);

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errData = await response.json();
        if (errData.error?.message) {
          errorDetail = errData.error.message;
        }
      } catch (_) {}
      throw new Error(`Gemini API Error: ${errorDetail}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('Gemini returned an empty candidate response.');
    }

    const rawText = candidate.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0
    };

    return {
      text: rawText,
      usage,
      activeModel,
      finishReason: candidate.finishReason || 'STOP'
    };
  }

  /**
   * Execute prompt with system instructions, structured JSON, and automatic failover cascade
   */
  static async generate({
    apiKey,
    model = 'gemini-flash-lite-latest',
    systemInstruction = '',
    prompt = '',
    temperature = 0.2,
    timeoutMs = 22000
  }) {
    if (!apiKey) {
      throw new Error('Gemini API key is required. Please configure your key in Settings.');
    }

    let initialModel = this.cleanModelName(model);
    const triedModels = new Set();

    // Attempt with selected model first
    try {
      triedModels.add(initialModel);
      return await this._callEndpoint({
        apiKey,
        model: initialModel,
        systemInstruction,
        prompt,
        temperature,
        timeoutMs
      });
    } catch (err) {
      console.warn(`Primary model "${initialModel}" failed (${err.message}). Activating auto-failover cascade...`);

      // Attempt cascade through responsive operational models
      for (const fallback of this.fallbackCascade) {
        if (triedModels.has(fallback)) continue;
        triedModels.add(fallback);

        try {
          console.log(`Cascade failover attempting: ${fallback}...`);
          const result = await this._callEndpoint({
            apiKey,
            model: fallback,
            systemInstruction,
            prompt,
            temperature,
            timeoutMs: 16000
          });

          // Update active session model so subsequent calls use the responsive model
          keyStore.setModel(fallback);
          console.log(`Successfully recovered on failover model: ${fallback}`);
          return result;
        } catch (cascadeErr) {
          console.warn(`Failover model "${fallback}" also unavailable: ${cascadeErr.message}`);
        }
      }

      // If all fallbacks exhausted, throw sanitized error
      throw new Error(err.message.replace(/key=[^&\s]+/g, 'key=REDACTED'));
    }
  }

  /**
   * Test connection to Gemini API with fast failover validation
   */
  static async testConnection(apiKey, model = 'gemini-flash-lite-latest') {
    if (!apiKey) return { success: false, error: 'API key is empty.' };

    try {
      const targetModel = this.cleanModelName(model);
      const res = await this.generate({
        apiKey,
        model: targetModel,
        systemInstruction: 'Respond with a simple JSON object.',
        prompt: 'Return {"status":"ok","message":"connection successful"}',
        timeoutMs: 12000
      });

      // Fetch list of available models for the selector dropdown
      const availableModels = await this.listModels(apiKey);

      return {
        success: true,
        model: res.activeModel || targetModel,
        availableModels: availableModels.length > 0 ? availableModels : this.fallbackCascade,
        tokensUsed: res.usage.totalTokenCount
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }
}
