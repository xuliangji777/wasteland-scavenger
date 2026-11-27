// ==================== 微信小程序原生多槽位存档适配器 ====================
// 基于 wx.getStorageSync / wx.setStorageSync / wx.removeStorageSync
// 支持自动档 (auto) + 3 个手动记录碑槽位 (slot_1, slot_2, slot_3)

const SAVE_PREFIX = 'motu_save_v20_';
const META_PREFIX = 'motu_meta_v20_';
const PROLOGUE_KEY = 'motu_prologue_seen';

const SLOT_DEFS = [
  { slotId: 'auto',   label: '自动存档' },
  { slotId: 'slot_1', label: '记录槽位 一' },
  { slotId: 'slot_2', label: '记录槽位 二' },
  { slotId: 'slot_3', label: '记录槽位 三' }
];

// 内存兜底（仅在非微信环境如 Node 语法/单元测试时使用）
const _memStore = new Map();

function _getRaw(key) {
  try {
    if (typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function') {
      const val = wx.getStorageSync(key);
      return val === '' || val === undefined || val === null ? null : val;
    }
  } catch (_) {}
  return _memStore.has(key) ? _memStore.get(key) : null;
}

function _setRaw(key, val) {
  try {
    if (typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function') {
      wx.setStorageSync(key, val);
      return true;
    }
  } catch (_) {}
  _memStore.set(key, val);
  return true;
}

function _removeRaw(key) {
  try {
    if (typeof wx !== 'undefined' && typeof wx.removeStorageSync === 'function') {
      wx.removeStorageSync(key);
      return true;
    }
  } catch (_) {}
  _memStore.delete(key);
  return true;
}

function normalizeSlotId(slotId) {
  if (!slotId || slotId === 'auto') return 'auto';
  if (slotId === 'slot1' || slotId === 'slot_1' || slotId === 1 || slotId === '1') return 'slot_1';
  if (slotId === 'slot2' || slotId === 'slot_2' || slotId === 2 || slotId === '2') return 'slot_2';
  if (slotId === 'slot3' || slotId === 'slot_3' || slotId === 3 || slotId === '3') return 'slot_3';
  return 'auto';
}

function extractMeta(stateObj, meta = {}) {
  const s = stateObj || {};
  return {
    mapId: meta.mapId || s.mapId || 'town',
    mapName: meta.mapName || s.mapName || s.mapId || '墨石镇',
    lv: meta.lv !== undefined ? meta.lv : (s.level || 1),
    gold: meta.gold !== undefined ? meta.gold : (s.gold || 0),
    day: meta.day !== undefined ? meta.day : (s.day || 1),
    act: meta.act !== undefined
      ? meta.act
      : Math.min(5, (Array.isArray(s.completedActs) ? s.completedActs.length : 0) + 1),
    savedAt: meta.savedAt || Date.now()
  };
}

function listSlots() {
  return SLOT_DEFS.map((def) => {
    const raw = _getRaw(SAVE_PREFIX + def.slotId);
    if (!raw) {
      return {
        slotId: def.slotId,
        label: def.label,
        mapId: '',
        mapName: '',
        lv: 0,
        gold: 0,
        day: 0,
        act: 1,
        savedAt: 0,
        empty: true
      };
    }

    let meta = _getRaw(META_PREFIX + def.slotId);
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch (_) {
        meta = null;
      }
    }
    if (!meta || typeof meta !== 'object') {
      let parsed = raw;
      if (typeof raw === 'string') {
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          parsed = {};
        }
      }
      meta = extractMeta(parsed);
    }

    return {
      slotId: def.slotId,
      label: def.label,
      mapId: meta.mapId || 'town',
      mapName: meta.mapName || '墨石镇',
      lv: meta.lv || 1,
      gold: meta.gold || 0,
      day: meta.day || 1,
      act: meta.act || 1,
      savedAt: meta.savedAt || 0,
      empty: false
    };
  });
}

function saveToSlot(slotId, stateObj, meta = {}) {
  const cleanSlot = normalizeSlotId(slotId);
  const fullMeta = extractMeta(stateObj, meta);
  _setRaw(SAVE_PREFIX + cleanSlot, JSON.stringify(stateObj));
  _setRaw(META_PREFIX + cleanSlot, JSON.stringify(fullMeta));
  return { ok: true, slotId: cleanSlot, meta: fullMeta, savedAt: fullMeta.savedAt };
}

function loadFromSlot(slotId) {
  const cleanSlot = normalizeSlotId(slotId);
  const raw = _getRaw(SAVE_PREFIX + cleanSlot);
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function deleteSlot(slotId) {
  const cleanSlot = normalizeSlotId(slotId);
  _removeRaw(SAVE_PREFIX + cleanSlot);
  _removeRaw(META_PREFIX + cleanSlot);
  return { ok: true, slotId: cleanSlot };
}

function getPrologueSeen() {
  return Boolean(_getRaw(PROLOGUE_KEY));
}

function setPrologueSeen(val = true) {
  _setRaw(PROLOGUE_KEY, Boolean(val));
}

const storage = {
  SLOT_DEFS,
  normalizeSlotId,
  listSlots,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  // 兼容门面方法
  writeSlot: saveToSlot,
  loadSlot: loadFromSlot,
  saveAuto(stateObj, meta = {}) {
    return saveToSlot('auto', stateObj, meta);
  },
  loadAuto() {
    return loadFromSlot('auto');
  },
  writeSave(stateObj, meta = {}) {
    return saveToSlot('auto', stateObj, meta);
  },
  loadSave() {
    return loadFromSlot('auto');
  },
  clearSave() {
    return deleteSlot('auto');
  },
  getPrologueSeen,
  setPrologueSeen
};

module.exports = {
  SLOT_DEFS,
  listSlots,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  getPrologueSeen,
  setPrologueSeen,
  storage
};
