// ==================== 可切换的存档与账号服务层 ====================
// 后续接入线上后端时，只需将 mode 改为 'remote' 并配置 apiBaseUrl（服务端口地址）即可平滑切换。

export const STORAGE_CONFIG = {
  mode: 'local', // 'local' | 'remote'
  apiBaseUrl: 'http://localhost:3000/api' // 预留线上服务端口配置
};

const ACCOUNTS_INDEX_KEY = 'wasteland_accounts_v1';
const CURRENT_USER_KEY = 'wasteland_current_user_v1';
const LEGACY_SAVE_KEY = 'wasteland_scavenger_save_v3';

function profileSaveKey(username) {
  return `wasteland_save_user_${encodeURIComponent(username)}`;
}

// ---------- 本地存储适配器 ----------
class LocalStorageAdapter {
  getAccounts() {
    try {
      const list = JSON.parse(localStorage.getItem(ACCOUNTS_INDEX_KEY) || '[]');
      if (Array.isArray(list) && list.length > 0) return list;
    } catch { /* ignore */ }
    const def = [{ username: '废土游客', createdAt: Date.now(), lastLogin: Date.now() }];
    localStorage.setItem(ACCOUNTS_INDEX_KEY, JSON.stringify(def));
    return def;
  }

  saveAccounts(list) {
    localStorage.setItem(ACCOUNTS_INDEX_KEY, JSON.stringify(list));
  }

  getCurrentUser() {
    const cur = localStorage.getItem(CURRENT_USER_KEY);
    if (cur) return cur;
    const accounts = this.getAccounts();
    const first = accounts[0].username;
    localStorage.setItem(CURRENT_USER_KEY, first);
    return first;
  }

  loginOrCreate(username) {
    const clean = String(username || '').trim();
    if (!clean) throw new Error('请输入有效的幸存者代号');
    if (clean.length > 16) throw new Error('代号长度不能超过 16 个字符');

    const accounts = this.getAccounts();
    const existing = accounts.find(a => a.username === clean);
    if (existing) {
      existing.lastLogin = Date.now();
    } else {
      accounts.push({ username: clean, createdAt: Date.now(), lastLogin: Date.now() });
    }
    this.saveAccounts(accounts);
    localStorage.setItem(CURRENT_USER_KEY, clean);
    return { username: clean, isNew: !existing };
  }

  deleteAccount(username) {
    let accounts = this.getAccounts().filter(a => a.username !== username);
    if (accounts.length === 0) {
      accounts = [{ username: '废土游客', createdAt: Date.now(), lastLogin: Date.now() }];
    }
    this.saveAccounts(accounts);
    localStorage.removeItem(profileSaveKey(username));
    if (this.getCurrentUser() === username) {
      localStorage.setItem(CURRENT_USER_KEY, accounts[0].username);
    }
    return this.getCurrentUser();
  }

  loadSave(username) {
    const key = profileSaveKey(username);
    let raw = localStorage.getItem(key);
    // 兼容迁移旧版单人存档到默认账号
    if (!raw && username === '废土游客') {
      const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        raw = legacy;
      }
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  writeSave(username, stateObj) {
    localStorage.setItem(profileSaveKey(username), JSON.stringify(stateObj));
    return { ok: true, savedAt: Date.now() };
  }

  clearSave(username) {
    localStorage.removeItem(profileSaveKey(username));
  }
}

// ---------- 线上服务适配器（预留接口，方便后续切换服务端口） ----------
class RemoteStorageAdapter {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    if (!res.ok) throw new Error(`服务端错误: ${res.status}`);
    return res.json();
  }

  getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_KEY) || '未登录';
  }

  getAccounts() {
    return [{ username: this.getCurrentUser(), createdAt: Date.now(), lastLogin: Date.now() }];
  }

  async loginOrCreate(username, password = '') {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    localStorage.setItem(CURRENT_USER_KEY, data.username || username);
    return data;
  }

  async loadSave(username) {
    return this.request(`/save/${encodeURIComponent(username)}`);
  }

  async writeSave(username, stateObj) {
    return this.request(`/save/${encodeURIComponent(username)}`, {
      method: 'PUT',
      body: JSON.stringify(stateObj)
    });
  }

  async clearSave(username) {
    return this.request(`/save/${encodeURIComponent(username)}`, { method: 'DELETE' });
  }
}

// ---------- 统一导出门面 ----------
export function createStorageService(config = STORAGE_CONFIG) {
  if (config.mode === 'remote') {
    return new RemoteStorageAdapter(config.apiBaseUrl);
  }
  return new LocalStorageAdapter();
}

export const storage = createStorageService();
