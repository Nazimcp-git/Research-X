/**
 * ResearchX - Utility Helpers
 * Pure ES6 Module
 */

export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

/**
 * Generate a unique ID for research sessions or tasks
 */
export function generateId(prefix = 'res') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format timestamp into readable date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format execution time into readable duration
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const sec = (ms / 1000).toFixed(1);
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const remSec = (sec % 60).toFixed(0);
  return `${mins}m ${remSec}s`;
}

/**
 * Format token count (e.g. 1540 -> 1.5k)
 */
export function formatTokens(count) {
  if (!count) return '0';
  if (count < 1000) return `${count}`;
  return `${(count / 1000).toFixed(1)}k`;
}

/**
 * Relative time formatter ("5 mins ago")
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 45) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

/**
 * Extract clean domain name from URL
 */
export function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web source';
  }
}

/**
 * Escape HTML to prevent injection
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Global Toast Notification
 */
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Secure In-Memory & Session-Backed API Key Store
 * Keys are strictly held in client memory/sessionStorage.
 * Never uploaded to Firebase. Never logged to console.
 */
class ApiKeyStore {
  constructor() {
    this._memoryKeys = {
      gemini: sessionStorage.getItem('rx_gemini_key') || '',
      tavily: sessionStorage.getItem('rx_tavily_key') || '',
      jina: sessionStorage.getItem('rx_jina_key') || '',
      model: sessionStorage.getItem('rx_gemini_model') || 'gemini-flash-lite-latest'
    };
  }

  getKey(provider) {
    return this._memoryKeys[provider] || '';
  }

  setKey(provider, value) {
    const clean = (value || '').trim();
    this._memoryKeys[provider] = clean;
    if (clean) {
      sessionStorage.setItem(`rx_${provider}_key`, clean);
    } else {
      sessionStorage.removeItem(`rx_${provider}_key`);
    }
  }

  getModel() {
    const m = this._memoryKeys.model;
    if (!m || m.includes('2.5') || m === 'gemini-1.5-flash' || m === 'gemini-3.8-flash') {
      return 'gemini-flash-lite-latest';
    }
    return m;
  }

  setModel(modelName) {
    this._memoryKeys.model = modelName;
    sessionStorage.setItem('rx_gemini_model', modelName);
  }

  hasRequiredKeys() {
    return Boolean(this._memoryKeys.gemini);
  }

  hasSearchKeys() {
    return Boolean(this._memoryKeys.tavily);
  }

  clearAll() {
    this._memoryKeys = { gemini: '', tavily: '', jina: '', model: 'gemini-flash-lite-latest' };
    sessionStorage.removeItem('rx_gemini_key');
    sessionStorage.removeItem('rx_tavily_key');
    sessionStorage.removeItem('rx_jina_key');
    sessionStorage.removeItem('rx_gemini_model');
  }
}

export const keyStore = new ApiKeyStore();

/**
 * Timeout helper for fetch calls
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs / 1000} seconds.`));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then(res => {
        clearTimeout(timeout);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          reject(new Error(`Request timed out after ${timeoutMs / 1000} seconds.`));
        } else {
          reject(err);
        }
      });
  });
}

