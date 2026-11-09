/**
 * ResearchX - Shared Application Controller & Modal Manager
 * Binds Sidebar Navigation, User Profile, API Settings Modal, and Lucide Icons
 */

import { AuthService } from './auth.js';
import { keyStore, showToast, escapeHtml } from './utils/helpers.js';
import { GeminiAPI } from './api/gemini.js';
import { TavilyAPI } from './api/tavily.js';
import { JinaReaderAPI } from './api/jina.js';

export class App {
  static init() {
    this.renderIcons();
    this.bindSidebar();
    this.bindSettingsModal();
    this.setupAuthDisplay();
  }

  /**
   * Refresh Lucide icons safely
   */
  static renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /**
   * Bind mobile sidebar toggling
   */
  static bindSidebar() {
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.querySelector('.app-sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  /**
   * Monitor user authentication and render name/email in sidebar
   */
  static setupAuthDisplay() {
    AuthService.onAuthStateChanged(user => {
      const nameEl = document.getElementById('user-display-name');
      const emailEl = document.getElementById('user-display-email');
      const avatarEl = document.getElementById('user-avatar-initials');

      if (user) {
        const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Guest Researcher');
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = user.email || 'guest@researchx.ai';
        if (avatarEl) avatarEl.textContent = name.slice(0, 2).toUpperCase();
      }

      // Bind logout buttons
      const logoutBtns = document.querySelectorAll('.btn-logout-action');
      logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await AuthService.logout();
            showToast('Signed out successfully.', 'info');
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 600);
          } catch (err) {
            showToast(`Sign out error: ${err.message}`, 'error');
          }
        });
      });
    });
  }

  /**
   * Bind and manage the API Configuration Settings Modal
   */
  static bindSettingsModal() {
    const openBtns = document.querySelectorAll('.btn-open-settings');
    const modalBackdrop = document.getElementById('modal-api-settings');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveBtn = document.getElementById('btn-save-settings');
    const clearBtn = document.getElementById('btn-clear-settings');

    const geminiInput = document.getElementById('input-gemini-key');
    const tavilyInput = document.getElementById('input-tavily-key');
    const jinaInput = document.getElementById('input-jina-key');
    const modelSelect = document.getElementById('select-gemini-model');

    const testGeminiBtn = document.getElementById('btn-test-gemini');
    const testTavilyBtn = document.getElementById('btn-test-tavily');
    const testJinaBtn = document.getElementById('btn-test-jina');

    const statusGemini = document.getElementById('status-gemini');
    const statusTavily = document.getElementById('status-tavily');
    const statusJina = document.getElementById('status-jina');

    // Populate existing keys from session
    const loadKeysIntoFields = () => {
      if (geminiInput) geminiInput.value = keyStore.getKey('gemini');
      if (tavilyInput) tavilyInput.value = keyStore.getKey('tavily');
      if (jinaInput) jinaInput.value = keyStore.getKey('jina');
      if (modelSelect) modelSelect.value = keyStore.getModel();
    };

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        loadKeysIntoFields();
        if (modalBackdrop) modalBackdrop.classList.add('open');
      });
    });

    if (closeBtn && modalBackdrop) {
      closeBtn.addEventListener('click', () => {
        modalBackdrop.classList.remove('open');
      });
    }

    // Toggle password visibility buttons
    document.querySelectorAll('.btn-toggle-key-mask').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = '<i data-lucide="eye-off"></i>';
          } else {
            input.type = 'password';
            btn.innerHTML = '<i data-lucide="eye"></i>';
          }
          this.renderIcons();
        }
      });
    });

    // Save Keys
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (geminiInput) keyStore.setKey('gemini', geminiInput.value);
        if (tavilyInput) keyStore.setKey('tavily', tavilyInput.value);
        if (jinaInput) keyStore.setKey('jina', jinaInput.value);
        if (modelSelect) keyStore.setModel(modelSelect.value);

        showToast('API Configuration saved to session memory.', 'success');
        if (modalBackdrop) modalBackdrop.classList.remove('open');
      });
    }

    // Clear Keys
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all API keys from session memory?')) {
          keyStore.clearAll();
          loadKeysIntoFields();
          if (statusGemini) statusGemini.innerHTML = '';
          if (statusTavily) statusTavily.innerHTML = '';
          if (statusJina) statusJina.innerHTML = '';
          showToast('API keys cleared.', 'info');
        }
      });
    }

    // Test Gemini Connection
    if (testGeminiBtn) {
      testGeminiBtn.addEventListener('click', async () => {
        const key = geminiInput?.value.trim() || keyStore.getKey('gemini');
        const model = modelSelect?.value || keyStore.getModel();
        if (!key) {
          showToast('Please enter a Gemini API key first.', 'warning');
          return;
        }

        testGeminiBtn.disabled = true;
        if (statusGemini) statusGemini.innerHTML = '<span class="text-sm text-muted">Testing...</span>';

        const res = await GeminiAPI.testConnection(key, model);
        testGeminiBtn.disabled = false;

        if (res.success) {
          if (statusGemini) statusGemini.innerHTML = '<span class="badge badge-success"><span class="status-dot"></span> Connected</span>';

          // If available models returned, update model dropdown
          if (modelSelect && Array.isArray(res.availableModels) && res.availableModels.length > 0) {
            modelSelect.innerHTML = res.availableModels.map(m => `
              <option value="${m}" ${m === res.model ? 'selected' : ''}>${m}</option>
            `).join('');
            keyStore.setModel(res.model);
          } else if (modelSelect && res.model) {
            modelSelect.value = res.model;
            keyStore.setModel(res.model);
          }

          showToast(`Gemini connection verified (${res.model})`, 'success');
        } else {
          if (statusGemini) statusGemini.innerHTML = `<span class="badge badge-error"><span class="status-dot"></span> Failed</span>`;
          showToast(`Gemini error: ${res.error}`, 'error', 6000);
        }
      });
    }

    // Test Tavily Connection
    if (testTavilyBtn) {
      testTavilyBtn.addEventListener('click', async () => {
        const key = tavilyInput?.value.trim() || keyStore.getKey('tavily');
        if (!key) {
          showToast('Please enter a Tavily API key first.', 'warning');
          return;
        }

        testTavilyBtn.disabled = true;
        if (statusTavily) statusTavily.innerHTML = '<span class="text-sm text-muted">Testing...</span>';

        const res = await TavilyAPI.testConnection(key);
        testTavilyBtn.disabled = false;

        if (res.success) {
          if (statusTavily) statusTavily.innerHTML = '<span class="badge badge-success"><span class="status-dot"></span> Connected</span>';
          showToast('Tavily search connection verified.', 'success');
        } else {
          if (statusTavily) statusTavily.innerHTML = `<span class="badge badge-error"><span class="status-dot"></span> Failed</span>`;
          showToast(`Tavily error: ${res.error}`, 'error', 6000);
        }
      });
    }

    // Test Jina Connection
    if (testJinaBtn) {
      testJinaBtn.addEventListener('click', async () => {
        const key = jinaInput?.value.trim() || keyStore.getKey('jina');
        testJinaBtn.disabled = true;
        if (statusJina) statusJina.innerHTML = '<span class="text-sm text-muted">Testing...</span>';

        const res = await JinaReaderAPI.testConnection(key);
        testJinaBtn.disabled = false;

        if (res.success) {
          if (statusJina) statusJina.innerHTML = '<span class="badge badge-success"><span class="status-dot"></span> Connected</span>';
          showToast('Jina Reader connection verified.', 'success');
        } else {
          if (statusJina) statusJina.innerHTML = `<span class="badge badge-error"><span class="status-dot"></span> Failed</span>`;
          showToast(`Jina Reader error: ${res.error}`, 'error', 6000);
        }
      });
    }
  }
}

