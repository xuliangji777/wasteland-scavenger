// ==================== 可切换的多槽位存档与账号服务层 ====================
// 后续接入线上后端时，只需将 mode 改为 'remote' 并配置 apiBaseUrl（服务端口地址）即可平滑切换。

export const STORAGE_CONFIG = {
  mode: 'local', // 'local' | 'remote'
  apiBaseUrl: 'http://localhost:3000/api' // 预留线上服务端口配置
};

const ACCOUNTS_INDEX_KEY = 'wasteland_accounts_v1';
const CURRENT_USER_KEY = 'wasteland_current_user_v1';
const LEGACY_SAVE_KEY = 'wasteland_scavenger_save_v3';

const SLOT_DEFS = [
  { slotId: 'auto',  label: '自动存档' },
  { slotId: 'slot1', label: '记录槽位 一' },
  { slotId: 'slot2', label: '记录槽位 二' },
  { slotId: 'slot3', label: '记录槽位 三' }
];

function profileSaveKey(username) {
  return `wasteland_save_user_${encodeURIComponent(username)}`;
}

function profileSlotKey(username, slotId) {
  if (slotId === 'auto') return profileSaveKey(username);
  return `wasteland_save_user_${encodeURIComponent(username)}_slot_${encodeURIComponent(slotId)}`;
}

function profileSlotMetaKey(username, slotId) {
  return `wasteland_meta_user_${encodeURIComponent(username)}_slot_${encodeURIComponent(slotId)}`;
}

function extractMetaFromState(stateObj, meta = {}) {
  const s = stateObj || {};
  return {
    mapName: meta.mapName || s.mapId || '墨石镇',
    lv: meta.lv ?? s.level ?? 1,
    gold: meta.gold ?? s.gold ?? 0,
    act: meta.act ?? Math.min(5, (Array.isArray(s.completedActs) ? s.completedActs.length : 0) + 1),
    savedAt: meta.savedAt || Date.now()
  };
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
    for (const def of SLOT_DEFS) {
      localStorage.removeItem(profileSlotKey(username, def.slotId));
      localStorage.removeItem(profileSlotMetaKey(username, def.slotId));
    }
    if (this.getCurrentUser() === username) {
      localStorage.setItem(CURRENT_USER_KEY, accounts[0].username);
    }
    return this.getCurrentUser();
  }

  // ---- 多槽位存档 API ----
  listSlots(username) {
    return SLOT_DEFS.map((def) => {
      const raw = localStorage.getItem(profileSlotKey(username, def.slotId));
      if (!raw) {
        return {
          slotId: def.slotId,
          label: def.label,
          mapName: '',
          lv: 0,
          gold: 0,
          act: 1,
          savedAt: 0,
          empty: true
        };
      }
      let meta = null;
      try {
        meta = JSON.parse(localStorage.getItem(profileSlotMetaKey(username, def.slotId)) || 'null');
      } catch { /* ignore */ }
      if (!meta) {
        try {
          const parsed = JSON.parse(raw);
          meta = extractMetaFromState(parsed);
        } catch {
          meta = { mapName: '未知区域', lv: 1, gold: 0, act: 1, savedAt: 0 };
        }
      }
      return {
        slotId: def.slotId,
        label: def.label,
        mapName: meta.mapName || '墨石镇',
        lv: meta.lv ?? 1,
        gold: meta.gold ?? 0,
        act: meta.act ?? 1,
        savedAt: meta.savedAt || 0,
        empty: false
      };
    });
  }

  writeSlot(username, slotId, stateObj, meta = {}) {
    const cleanSlot = SLOT_DEFS.some(d => d.slotId === slotId) ? slotId : 'auto';
    const fullMeta = extractMetaFromState(stateObj, meta);
    localStorage.setItem(profileSlotKey(username, cleanSlot), JSON.stringify(stateObj));
    localStorage.setItem(profileSlotMetaKey(username, cleanSlot), JSON.stringify(fullMeta));
    return { ok: true, slotId: cleanSlot, savedAt: fullMeta.savedAt };
  }

  loadSlot(username, slotId) {
    const cleanSlot = SLOT_DEFS.some(d => d.slotId === slotId) ? slotId : 'auto';
    const key = profileSlotKey(username, cleanSlot);
    let raw = localStorage.getItem(key);
    // 兼容迁移旧版单人存档到默认账号的 auto 槽位
    if (!raw && cleanSlot === 'auto' && username === '废土游客') {
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

  deleteSlot(username, slotId) {
    const cleanSlot = SLOT_DEFS.some(d => d.slotId === slotId) ? slotId : 'auto';
    localStorage.removeItem(profileSlotKey(username, cleanSlot));
    localStorage.removeItem(profileSlotMetaKey(username, cleanSlot));
    return { ok: true, slotId: cleanSlot };
  }

  // ---- 默认自动存档兼容门面（映射到 'auto'） ----
  loadSave(username) {
    return this.loadSlot(username, 'auto');
  }

  writeSave(username, stateObj, meta = {}) {
    return this.writeSlot(username, 'auto', stateObj, meta);
  }

  clearSave(username) {
    return this.deleteSlot(username, 'auto');
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

  async listSlots(username) {
    return this.request(`/save/${encodeURIComponent(username)}/slots`);
  }

  async writeSlot(username, slotId, stateObj, meta = {}) {
    return this.request(`/save/${encodeURIComponent(username)}/slots/${encodeURIComponent(slotId)}`, {
      method: 'PUT',
      body: JSON.stringify({ state: stateObj, meta: extractMetaFromState(stateObj, meta) })
    });
  }

  async loadSlot(username, slotId) {
    return this.request(`/save/${encodeURIComponent(username)}/slots/${encodeURIComponent(slotId)}`);
  }

  async deleteSlot(username, slotId) {
    return this.request(`/save/${encodeURIComponent(username)}/slots/${encodeURIComponent(slotId)}`, {
      method: 'DELETE'
    });
  }

  async loadSave(username) {
    return this.loadSlot(username, 'auto');
  }

  async writeSave(username, stateObj, meta = {}) {
    return this.writeSlot(username, 'auto', stateObj, meta);
  }

  async clearSave(username) {
    return this.deleteSlot(username, 'auto');
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
