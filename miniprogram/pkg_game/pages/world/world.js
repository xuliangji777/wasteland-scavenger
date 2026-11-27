// ==================== 《墨土拾荒录》v20 · 纯原生微信小程序主玩法页面 ====================
const {
  QUALITY,
  REGIONS,
  ITEMS,
  ENEMIES,
  GUARDIANS,
  EQUIPMENT,
  AFFIXES,
  rollEquipment,
  ELIXIRS,
  RECIPES,
  dynamicFuse,
  COMBAT_SKILLS,
  NPCS,
  MAPS_BY_ID,
  MAIN_QUESTS,
  STORY_CHAPTERS,
  COLLECTIONS,
  SKILLS,
  WEATHERS,
  ENDINGS,
  SIDE_QUESTS,
  SKILL_BRANCHES,
  SHOP_STOCK,
  resolveAssetPath
} = require('../../utils/data.js');
const { storage } = require('../../utils/storage.js');
const { sfx } = require('../../utils/audio.js');
const rpgWorldMod = require('../../utils/rpg_world.js');
const RpgWorld = rpgWorldMod.RpgWorld || rpgWorldMod.InkWorldEngine || rpgWorldMod;

const SLOT_NAMES = {
  weapon: '武器',
  armor: '护甲',
  mech: '机甲核心',
  relic: '秘宝'
};

const SKILL_ICON_COORDS = {
  sk_slash: [0, 0], sk_palm: [1, 0], sk_shatter: [2, 0], sk_storm: [3, 0],
  sk_burst: [0, 1], sk_shotgun: [1, 1], sk_snipe: [2, 1], sk_airstrike: [3, 1],
  sk_cannon: [0, 2], sk_bits: [1, 2], sk_overdrive: [2, 2], sk_railgun: [3, 2],
  sk_shield: [0, 3], sk_fire: [1, 3], sk_heal: [2, 3], sk_crucible: [3, 3]
};

const ITEM_ICON_COORDS = {
  0: [0, 0], 1: [0, 0], 2: [0, 0],
  3: [1, 0], 13: [1, 0],
  4: [2, 0], 5: [2, 0], 19: [2, 0],
  6: [3, 0], 9: [3, 0],
  7: [0, 1], 15: [0, 1],
  8: [1, 1], 18: [1, 1],
  10: [2, 1],
  11: [3, 1], 27: [3, 1], 35: [3, 1],
  14: [0, 2],
  17: [1, 2],
  20: [2, 2],
  21: [3, 2],
  22: [0, 3],
  23: [1, 3],
  24: [2, 3],
  12: [3, 3], 16: [3, 3], 25: [3, 3], 26: [3, 3], 28: [3, 3], 29: [3, 3],
  30: [3, 3], 31: [3, 3], 32: [3, 3], 33: [3, 3], 34: [3, 3], 36: [3, 3], 37: [3, 3]
};

const GEAR_ICON_COORDS = {
  wpn_inkblade: [0, 0], wpn_qingcheng: [1, 0], wpn_flaregun: [2, 0], wpn_shotgun: [2, 0],
  wpn_pulsesword: [3, 0], wpn_gatling: [0, 1], wpn_artillery: [0, 1], wpn_sniper: [1, 1],
  wpn_plasma_rifle: [1, 1], wpn_railgun: [1, 1], wpn_xuanyuan: [2, 1],
  armor_ironwire: [0, 2], armor_exo: [2, 2],
  mech_steam_core: [3, 2], mech_crimson_frame: [0, 3], mech_bit_array: [1, 3], mech_tianshu_exo: [1, 3],
  relic_fox_orb: [2, 3], relic_thunder_seal: [2, 3], relic_tianshu: [3, 3]
};

const MODAL_META = {
  crucible:    { seal: '壶', title: '天工墨壶', sub: '阴阳两仪 · 五行灵枢炼化' },
  worldmap:    { seal: '图', title: '天下舆图', sub: '墨土五域 · 二十一境驿路' },
  bag:         { seal: '囊', title: '行囊与异纹神兵', sub: '佩剑着甲 · 百宝丹药' },
  skills:      { seal: '武', title: '武学奇术阁', sub: '六大修为 · 四系十六绝学' },
  quests:      { seal: '卷', title: '主线支线', sub: '五幕寻踪 · 八大悬赏 · 残卷古董' },
  shop:        { seal: '铺', title: '老黄杂货铺', sub: '废土补给与杂货收购' },
  inn:         { seal: '医', title: '回春医馆', sub: '歇脚疗伤 · 安神祛辐' },
  disassemble: { seal: '拆', title: '巧匠拆解坊', sub: '旧世电器与军工残骸拆解' },
  loan:        { seal: '钱', title: '黑哥钱庄', sub: '废土应急周转' },
  save:        { seal: '碑', title: '墨石记录碑', sub: '本地三档存读 · 离线永存' },
  settings:    { seal: '设', title: '墨土设置', sub: '触感震动与周目管理' },
  ending:      { seal: '终', title: '天命终局', sub: '墨土新章' }
};

const SETTINGS_KEY = 'motu_mp_game_settings_v1';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function expForNextLevel(lv) {
  return 80 + (lv - 1) * 65 + Math.floor(lv * lv * 12);
}

function getSpriteForEnemy(spriteType) {
  if (['rat', 'dog', 'boss_ratking', 'slime'].includes(spriteType)) {
    return '/pkg_game/assets/sprites/enemy_beast.png';
  }
  if (['drone', 'flame_mech', 'guard', 'auto_turret', 'heavy_mech', 'mech_taotie', 'boss_zhurong', 'raider', 'raider_shield', 'boss_duangang'].includes(spriteType)) {
    return '/pkg_game/assets/sprites/enemy_mech.png';
  }
  return '/pkg_game/assets/sprites/enemy_demon.png';
}

function getSpriteForGuardian(gid) {
  if (['guard_hound', 'guard_miasma'].includes(gid)) return '/pkg_game/assets/sprites/enemy_beast.png';
  if (['guard_puppet', 'guard_zhurong', 'guard_taotie', 'guard_falcon'].includes(gid)) return '/pkg_game/assets/sprites/enemy_mech.png';
  return '/pkg_game/assets/sprites/enemy_demon.png';
}

function getGearCoords(eq) {
  if (!eq) return [0, 0];
  if (GEAR_ICON_COORDS[eq.id]) return GEAR_ICON_COORDS[eq.id];
  if (eq.slot === 'mech') return eq.quality === 'legend' ? [1, 3] : [0, 3];
  if (eq.slot === 'relic') return eq.quality === 'legend' ? [3, 3] : [2, 3];
  if (eq.slot === 'armor') return eq.genre === 'scifi' ? [2, 2] : [0, 2];
  return [0, 0];
}

function getItemCoords(itemId) {
  return ITEM_ICON_COORDS[Number(itemId)] || [0, 0];
}

function getCrucibleElement(entry) {
  if (!entry) return '土';
  if (entry.kind === 'spirit') {
    const id = String(entry.id || '');
    if (['flame_mech', 'heavy_mech', 'fox_nine', 'dog', 'cyber_rakshasa'].includes(id)) return '火';
    if (['drone', 'guard', 'auto_turret', 'bronze_spirit', 'mech_taotie', 'raider', 'raider_shield'].includes(id)) return '金';
    if (['slime', 'mire_wisp', 'corpse_king'].includes(id)) return '木';
    return '水';
  }
  if (entry.kind === 'equip') {
    const eq = entry.eq || EQUIPMENT[entry.id];
    if (!eq) return '金';
    if (eq.slot === 'weapon' && (eq.proc === 'burn' || ['pistol', 'cannon', 'railgun'].includes(eq.weaponType))) return '火';
    if (eq.slot === 'weapon' || eq.slot === 'mech') return '金';
    return '土';
  }
  const id = Number(entry.id);
  if ([2, 3, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19].includes(id)) return '金';
  if ([1, 17, 22].includes(id)) return '木';
  if ([0, 21, 23].includes(id)) return '水';
  if ([7, 10, 14, 24].includes(id)) return '火';
  return '土';
}

function getWuXingOmen(a, b, match) {
  if (!a && !b) return '阴阳未济 · 纳灵入阵以启玄机';
  if (a && !b) return `阴仪初动 · ${getCrucibleElement(a)}灵入坤`;
  if (!a && b) return `阳仪初动 · ${getCrucibleElement(b)}灵入乾`;
  const pair = [getCrucibleElement(a), getCrucibleElement(b)].sort().join('');
  const omens = {
    金水: '金水相生 · 灵器通玄',
    木水: '水木清华 · 丹韵自成',
    木火: '木火通明 · 灵焰升腾',
    土火: '火土相融 · 丹鼎凝胎',
    土金: '土金相生 · 铸兵之象',
    火金: '火炼真金 · 铸兵之象',
    木金: '金刃伐木 · 破煞化形',
    土木: '木破玄土 · 地脉生灵',
    土水: '土镇玄水 · 凝魂聚魄',
    水火: '水火既济 · 阴阳化生'
  };
  const base = omens[pair] || '阴阳合璧 · 万象化生';
  return match ? `${base} · 丹方感应` : base;
}

function formatSaveTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const REGION_CHEST_ITEMS = [
  [4, 5, 13, 14, 20, 21, 22, 23],
  [5, 7, 12, 14, 15, 16, 22, 23],
  [6, 7, 8, 9, 18, 22, 23, 24],
  [6, 8, 10, 17, 18, 22, 23, 24],
  [8, 9, 10, 11, 19, 23, 24]
];

const REGION_MONSTER_DROPS = [
  [2, 3, 4, 13, 20, 21, 22],
  [3, 4, 5, 12, 14, 20, 22],
  [5, 6, 7, 8, 18, 21, 22, 23],
  [5, 7, 10, 17, 22, 23, 24],
  [6, 8, 9, 10, 11, 19, 23, 24]
];

const REGION_EQUIP_POOLS = [
  ['wpn_inkblade', 'wpn_flaregun', 'armor_ironwire', 'mech_steam_core'],
  ['wpn_qingcheng', 'wpn_shotgun', 'wpn_sniper', 'armor_ironwire', 'mech_steam_core'],
  ['wpn_gatling', 'wpn_artillery', 'wpn_pulsesword', 'mech_crimson_frame', 'armor_exo'],
  ['wpn_plasma_rifle', 'armor_exo', 'relic_fox_orb', 'mech_crimson_frame', 'wpn_pulsesword'],
  ['wpn_railgun', 'wpn_xuanyuan', 'mech_bit_array', 'mech_tianshu_exo', 'relic_thunder_seal', 'relic_tianshu']
];

const BOSS_RARE_MATS = [10, 11, 18, 19];

function getRegionTierIndex(mapOrRegionId) {
  const rid = typeof mapOrRegionId === 'string' ? mapOrRegionId : (mapOrRegionId && mapOrRegionId.regionId);
  const idx = REGIONS.findIndex((r) => r.id === rid);
  return idx >= 0 ? idx : 0;
}

function getChestKey(mapId, node) {
  const idPart = (node && node.id) || `${Math.round((node && node.x) || 0)}_${Math.round((node && node.y) || 0)}`;
  return `${mapId || 'map'}:${idPart}`;
}

function rollChestEquipQuality(s, regionIdx, isPremium) {
  const eagleBonus = 1 + ((s && s.skills && s.skills[1]) || 0) * 0.12 + ((s && s.skills && s.skills[5]) || 0) * 0.05;
  const mult = eagleBonus * (isPremium ? 1.35 : 1);
  const r = Math.random();
  const legendChance = Math.min(0.55, (0.04 + regionIdx * 0.08 + (isPremium ? 0.08 : 0)) * mult);
  const rareChance = Math.min(0.65, (0.30 + regionIdx * 0.10 + (isPremium ? 0.15 : 0)) * Math.sqrt(mult));
  if (r < legendChance) return 'legend';
  if (r < legendChance + rareChance) return 'rare';
  return 'fine';
}

function rollMonsterEquipQuality(regionIdx) {
  const r = Math.random();
  const rareChance = 0.08 + regionIdx * 0.08;
  const fineChance = 0.36 + regionIdx * 0.08;
  if (r < rareChance) return 'rare';
  if (r < rareChance + fineChance) return 'fine';
  return 'common';
}

function rollBossTierEquipment(baseId, quality, addThirdAffix = false) {
  const eq = rollEquipment(baseId, quality);
  if (!eq) return null;
  if (addThirdAffix && Array.isArray(eq.affixes) && eq.affixes.length < 3 && AFFIXES) {
    const existingIds = new Set(eq.affixes.map((a) => a.id));
    const extraPool = [...(AFFIXES.prefixes || []), ...(AFFIXES.suffixes || [])].filter((a) => !existingIds.has(a.id));
    if (extraPool.length) {
      const extra = extraPool[Math.floor(Math.random() * extraPool.length)];
      eq.affixes.push(extra);
      for (const [k, v] of Object.entries(extra.stat || {})) {
        eq[k] = (eq[k] || 0) + v;
      }
    }
  }
  return eq;
}

function grantItemToStateBagOrGold(s, itemId, quality, bagMax) {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (s.bag.length >= bagMax) {
    const autoGold = Math.max(15, Math.round(item.baseValue * ((QUALITY[quality] && QUALITY[quality].multiplier) || 1) * 0.75));
    s.gold += autoGold;
    return { item, quality, soldGold: autoGold, label: `${item.name}(折+${autoGold}币)` };
  }
  s.bag.push({
    uid: `loot_${Date.now()}_${Math.floor(Math.random() * 99999)}`,
    itemId: item.id,
    quality
  });
  return { item, quality, soldGold: 0, label: `${QUALITY[quality].name}·${item.name}` };
}

function createInitialState() {
  const starterWeapon = {
    ...EQUIPMENT.wpn_inkblade,
    uid: 'starter_wpn_inkblade',
    quality: 'common',
    affixes: []
  };
  return {
    version: 3,
    day: 1,
    mapId: 'town',
    heroX: 780,
    heroY: 615,
    level: 1,
    exp: 0,
    hp: 120,
    energy: 100,
    food: 100,
    gold: 120,
    debt: 0,
    reputation: 0,
    radShield: 0,
    warn: 0,
    tideSec: 60,
    skillPoints: 1,
    skills: [0, 0, 0, 0, 0, 0],
    bag: [
      { uid: 'init_1', itemId: 20, quality: 'common' },
      { uid: 'init_2', itemId: 20, quality: 'common' },
      { uid: 'init_3', itemId: 21, quality: 'common' },
      { uid: 'init_4', itemId: 22, quality: 'common' },
      { uid: 'init_5', itemId: 22, quality: 'common' },
      { uid: 'init_6', itemId: 2, quality: 'common' },
      { uid: 'init_7', itemId: 3, quality: 'common' },
      { uid: 'init_8', itemId: 5, quality: 'common' },
      { uid: 'init_9', itemId: 14, quality: 'fine' },
      { uid: 'init_10', itemId: 17, quality: 'fine' },
      { uid: 'init_11', itemId: 23, quality: 'common' }
    ],
    elixirs: {},
    equipped: { weapon: starterWeapon, armor: null, mech: null, relic: null },
    equipBag: [],
    capturedSpirits: { rat: 1 },
    unlockedGuardians: [],
    activeGuardianId: null,
    unlockedRegions: ['reg_town'],
    regionWeathers: { reg_town: 0, reg_ruins: 4, reg_arsenal: 3, reg_swamp: 1, reg_vault: 2 },
    completedSteps: [],
    completedActs: [],
    claimedSideQuests: [],
    stories: [],
    collections: [],
    defeatedBosses: [],
    openedChests: [],
    seenEnemies: [],
    endingsUnlocked: [],
    stats: { pick: 0, dis: 0, sellGold: 0, battleWin: 0, capture: 0, fuse: 0, salvageHeavy: 0, defeatHeavy: 0 }
  };
}

function migrateState(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== 'object') return base;
  const s = { ...base, ...raw };
  s.skills = Array.isArray(raw.skills) && raw.skills.length === 6 ? raw.skills.map((n) => Number(n) || 0) : base.skills;
  s.bag = Array.isArray(raw.bag) ? raw.bag.filter((b) => b && ITEMS[b.itemId]) : base.bag;
  s.elixirs = raw.elixirs && typeof raw.elixirs === 'object' ? raw.elixirs : {};
  s.equipped = { ...base.equipped, ...(raw.equipped || {}) };
  s.equipBag = Array.isArray(raw.equipBag) ? raw.equipBag.filter(Boolean) : [];
  s.capturedSpirits = raw.capturedSpirits && typeof raw.capturedSpirits === 'object' ? raw.capturedSpirits : {};
  s.unlockedGuardians = Array.isArray(raw.unlockedGuardians) ? raw.unlockedGuardians : [];
  s.unlockedRegions = Array.isArray(raw.unlockedRegions) && raw.unlockedRegions.length ? raw.unlockedRegions : ['reg_town'];
  s.regionWeathers = { ...base.regionWeathers, ...(raw.regionWeathers || {}) };
  s.completedSteps = Array.isArray(raw.completedSteps) ? raw.completedSteps : [];
  s.completedActs = Array.isArray(raw.completedActs) ? raw.completedActs : [];
  s.claimedSideQuests = Array.isArray(raw.claimedSideQuests) ? raw.claimedSideQuests : [];
  s.stories = Array.isArray(raw.stories) ? raw.stories : [];
  s.collections = Array.isArray(raw.collections) ? raw.collections : [];
  s.defeatedBosses = Array.isArray(raw.defeatedBosses) ? raw.defeatedBosses : [];
  s.openedChests = Array.isArray(raw.openedChests) ? raw.openedChests.filter(Boolean) : [];
  s.seenEnemies = Array.isArray(raw.seenEnemies) ? raw.seenEnemies : [];
  s.endingsUnlocked = Array.isArray(raw.endingsUnlocked) ? raw.endingsUnlocked : [];
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  if (!MAPS_BY_ID[s.mapId]) s.mapId = 'town';
  return s;
}

Page({
  data: {
    screenShake: false,
    sceneBanner: { show: false, region: '', title: '' },
    toast: { show: false, text: '', type: 'info' },

    hero: {
      level: 1, hp: 120, maxHp: 120, hpPct: 100,
      energy: 100, maxEnergy: 100, mpPct: 100, expPct: 0,
      food: 100, gold: 120, debt: 0, bagCount: 0, bagMax: 16,
      day: 1, warn: 0, tideSec: 60, radShield: 0, skillPoints: 1
    },
    questSummary: '',
    activeGuardianName: '',
    mapInfo: { id: 'town', name: '墨石镇', regionName: '墨石镇域', hasTide: false },
    weatherInfo: { name: '晴朗微风', color: '#d49a3a' },
    endingPct: 0,

    dpadActive: false,
    dpadDir: '',
    nearestTarget: null,

    dialog: { open: false, id: '', name: '', title: '', portrait: '/assets/portrait_laohuang.jpg', text: '', options: [] },

    inBattle: false,
    battle: {},
    battleVfx: { branch: 'martial', flashText: '', enemyAnim: '', heroAnim: '', guardianAnim: '', enemyDmg: '', enemyDmgType: '', heroDmg: '', heroDmgType: '' },
    captureAnim: { active: false, caption: '' },
    battleSubMode: '',
    battleSkillBranch: 'martial',
    skillBranches: SKILL_BRANCHES,
    battleBranchSkills: [],
    battleConsumables: [],

    activeModal: '',
    modalSeal: '',
    modalTitle: '',
    modalSub: '',

    crucibleTab: 'forge',
    crucibleFilter: 'all',
    crucibleView: { slotA: null, slotB: null, omen: '', matchName: '', canFuse: false, pool: [] },
    guardiansView: { unlockedCount: 0, list: [] },
    recipesView: [],

    worldMapView: { selectedRegionId: 'reg_town', regions: [], selected: null, subMaps: [] },

    bagTab: 'equip',
    bagView: { equipped: {}, stats: { atk: 18, def: 5, critPct: 8, penPct: 0 }, equipBag: [], items: [], elixirs: [] },

    skillsTab: 'passive',
    skillsView: { passive: [], combat: [] },

    questTab: 'main',
    questsView: { acts: [], side: [], stories: [], storiesCount: 0, collectionsCount: 0, canEnding: false },

    shopView: [],
    disView: { ratePct: 62, list: [] },
    saveView: { slots: [] },
    settingsView: { soundOn: true, shakeOn: true },
    endingView: null
  },

  // 运行时非视图字段
  state: null,
  world: null,
  battleRuntime: null,
  crucibleSlots: [null, null],
  selectedWorldRegionId: 'reg_town',
  shakeEnabled: true,
  toastTimer: null,
  bannerTimer: null,
  hazardTimer: null,
  saveTimer: null,

  onLoad() {
    this._loadLocalSettings();
    const saved = storage.loadFromSlot('auto');
    this.state = migrateState(saved);
    const map = MAPS_BY_ID[this.state.mapId] || MAPS_BY_ID.town;
    this.selectedWorldRegionId = map.regionId || 'reg_town';
    this.syncHUD();
  },

  onReady() {
    this._initCanvasWorld();
    this._startHazardLoop();
  },

  onShow() {
    if (this.world && !this.data.inBattle && !this.data.activeModal && !this.data.dialog.open) {
      this.world.paused = false;
    }
  },

  onHide() {
    if (this.world) this.world.paused = true;
    this.saveAutoNow();
  },

  onUnload() {
    this.saveAutoNow();
    if (this.hazardTimer) clearInterval(this.hazardTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.world && typeof this.world.destroy === 'function') {
      this.world.destroy();
    }
    this.world = null;
  },

  onResize() {
    // 旋转屏幕后重新适配 Canvas 尺寸
    if (this.world) {
      this._measureAndResizeCanvas();
    }
  },

  // ==================== 本地设置与自动存档 ====================
  _loadLocalSettings() {
    try {
      const raw = wx.getStorageSync(SETTINGS_KEY);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        this.shakeEnabled = parsed.shakeEnabled !== false;
      }
    } catch (_) {}
  },

  _saveLocalSettings() {
    try {
      wx.setStorageSync(SETTINGS_KEY, JSON.stringify({ shakeEnabled: this.shakeEnabled }));
    } catch (_) {}
  },

  getSaveMeta() {
    const s = this.state;
    const map = MAPS_BY_ID[s.mapId] || MAPS_BY_ID.town;
    return {
      mapId: s.mapId,
      mapName: map ? map.name : '墨石镇',
      lv: s.level || 1,
      gold: s.gold || 0,
      day: s.day || 1,
      act: Math.min(5, (s.completedActs || []).length + 1),
      savedAt: Date.now()
    };
  },

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveAutoNow(), 600);
  },

  saveAutoNow() {
    if (!this.state) return;
    if (this.world && this.world.hero) {
      this.state.heroX = Math.round(this.world.hero.x);
      this.state.heroY = Math.round(this.world.hero.y);
    }
    storage.saveToSlot('auto', this.state, this.getSaveMeta());
  },

  // ==================== Canvas 2D 引擎初始化 ====================
  _initCanvasWorld() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#world-canvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        this.showToast('画布初始化失败，请检查基础库版本', 'warn');
        return;
      }
      const canvas = res[0].node;
      const width = res[0].width || 800;
      const height = res[0].height || 390;
      const winInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const dpr = Math.min(2, winInfo.pixelRatio || 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      this.world = new RpgWorld(canvas, ctx, width, height, dpr, {
        onNearestChange: (target) => {
          this.setData({
            nearestTarget: target ? { type: target.type, label: target.label || '探索' } : null
          });
        },
        onInteract: (target) => {
          this.handleWorldInteract(target);
        },
        onEncounter: (worldEnemy) => {
          this.startBattle(worldEnemy);
        },
        getMoveSpeed: () => this.getHeroStats().moveSpeed,
        getNpcData: (npcId) => NPCS[npcId] || null,
        onFootstep: () => {
          sfx.footstep();
        }
      });

      this.state.openedChests = this.state.openedChests || [];
      this.world.loadMap(this.state.mapId, this.state.heroX, this.state.heroY, {
        openedChests: this.state.openedChests
      });
      if (this.state.activeGuardianId && typeof this.world.setActiveGuardian === 'function') {
        this.world.setActiveGuardian(this.state.activeGuardianId);
      }
      if (typeof this.world.setHeroWeapon === 'function') {
        this.world.setHeroWeapon((this.state.equipped && this.state.equipped.weapon && this.state.equipped.weapon.weaponType) || 'blade');
      }
      const map = MAPS_BY_ID[this.state.mapId] || MAPS_BY_ID.town;
      const reg = REGIONS.find((r) => r.id === map.regionId);
      if (typeof this.world.setWeather === 'function') {
        this.world.setWeather(this.state.regionWeathers[map.regionId] || 0);
      }
      if (typeof this.world.start === 'function') {
        this.world.start();
      }
      this.showSceneBanner(map.name, reg ? reg.name : '墨土五域');
    });
  },

  _measureAndResizeCanvas() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#world-canvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node || !this.world) return;
      const canvas = res[0].node;
      const width = res[0].width || 800;
      const height = res[0].height || 390;
      const winInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const dpr = Math.min(2, winInfo.pixelRatio || 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (typeof this.world.resize === 'function') {
        this.world.resize(width, height, dpr);
      }
    });
  },

  // ==================== 属性计算与 HUD 同步 ====================
  getHeroStats() {
    const s = this.state;
    const lv = s.level || 1;
    const stats = {
      maxHp: 100 + lv * 20,
      maxEnergy: 90 + lv * 10,
      atk: 14 + lv * 4 + (s.skills[4] || 0) * 6,
      def: 4 + Math.floor(lv * 1.6),
      crit: 0.08 + (s.skills[5] || 0) * 0.08,
      armorPen: 0,
      lifesteal: 0,
      radResist: 0,
      artilleryBonus: 0,
      skillBonus: 0,
      mechBonus: 0,
      dmgReduce: 0,
      mpRegen: 0,
      bonusDmg: 0,
      immuneTide: false,
      proc: null,
      bagMax: 16 + (s.skills[2] || 0) * 3,
      moveSpeed: 220 + (s.skills[0] || 0) * 26
    };
    ['weapon', 'armor', 'mech', 'relic'].forEach((slot) => {
      const eq = s.equipped[slot];
      if (!eq) return;
      stats.atk += eq.atk || 0;
      stats.def += eq.def || 0;
      stats.maxHp += eq.maxHp || 0;
      stats.maxEnergy += eq.maxEnergy || 0;
      stats.crit += eq.crit || 0;
      stats.armorPen += eq.armorPen || 0;
      stats.lifesteal += eq.lifesteal || 0;
      stats.radResist += eq.radResist || 0;
      stats.artilleryBonus += eq.artilleryBonus || 0;
      stats.skillBonus += eq.skillBonus || 0;
      stats.mechBonus += eq.mechBonus || 0;
      stats.dmgReduce += eq.dmgReduce || 0;
      stats.mpRegen += eq.mpRegen || 0;
      stats.bonusDmg += eq.bonusDmg || 0;
      if (eq.immuneTide) stats.immuneTide = true;
      if (eq.proc && !stats.proc) stats.proc = eq.proc;
    });
    const guard = s.activeGuardianId ? GUARDIANS[s.activeGuardianId] : null;
    if (guard && guard.atkBonusPct) {
      stats.atk = Math.round(stats.atk * (1 + guard.atkBonusPct));
    }
    stats.crit = Math.min(0.85, stats.crit);
    stats.armorPen = Math.min(0.85, stats.armorPen);
    stats.dmgReduce = Math.min(0.65, stats.dmgReduce);
    stats.radResist = Math.min(0.85, stats.radResist);
    return stats;
  },

  getSellPrice(bagEntry, bonusMult = 1) {
    const it = ITEMS[bagEntry.itemId];
    if (!it || it.baseValue <= 0) return 0;
    const qMult = (QUALITY[bagEntry.quality] && QUALITY[bagEntry.quality].multiplier) || 1;
    return Math.max(1, Math.round(it.baseValue * qMult * bonusMult));
  },

  getEquipSellPrice(eq) {
    const qMult = (QUALITY[eq.quality] && QUALITY[eq.quality].multiplier) || 1;
    const statVal = (eq.atk || 0) * 6 + (eq.def || 0) * 7 + (eq.maxHp || 0) * 1.2 + (eq.maxEnergy || 0) * 2;
    return Math.max(40, Math.round((80 + statVal) * qMult));
  },

  getCurrentQuestSummary() {
    for (let i = 0; i < MAIN_QUESTS.length; i++) {
      const act = MAIN_QUESTS[i];
      for (let j = 0; j < act.steps.length; j++) {
        const st = act.steps[j];
        if (!this.state.completedSteps.includes(st.id)) {
          return `【第${act.act}幕】${st.desc}`;
        }
      }
    }
    return '【天命已至】前往天枢核心或点击剧情卷轴见证结局！';
  },

  getEndingProgressPct() {
    const s = this.state;
    const stepPct = (s.completedSteps.length / 20) * 45;
    const bossPct = (s.defeatedBosses.length / 5) * 25;
    const storyPct = (s.stories.length / 5) * 15;
    const colPct = (s.collections.length / 8) * 15;
    return clamp(Math.round(stepPct + bossPct + storyPct + colPct), 0, 100);
  },

  syncHUD() {
    const s = this.state;
    const stats = this.getHeroStats();
    s.hp = clamp(s.hp, 0, stats.maxHp);
    s.energy = clamp(s.energy, 0, stats.maxEnergy);
    s.food = clamp(s.food, 0, 100);
    const needExp = expForNextLevel(s.level);
    const map = MAPS_BY_ID[s.mapId] || MAPS_BY_ID.town;
    const reg = REGIONS.find((r) => r.id === map.regionId) || REGIONS[0];
    const wIdx = s.regionWeathers[reg.id] || 0;
    const weather = WEATHERS[wIdx] || WEATHERS[0];
    const guard = s.activeGuardianId ? GUARDIANS[s.activeGuardianId] : null;

    this.setData({
      hero: {
        level: s.level,
        hp: Math.round(s.hp),
        maxHp: stats.maxHp,
        hpPct: Math.round((s.hp / stats.maxHp) * 100),
        energy: Math.round(s.energy),
        maxEnergy: stats.maxEnergy,
        mpPct: Math.round((s.energy / stats.maxEnergy) * 100),
        expPct: clamp(Math.round((s.exp / needExp) * 100), 0, 100),
        food: Math.round(s.food),
        gold: Math.round(s.gold),
        debt: Math.round(s.debt || 0),
        bagCount: s.bag.length,
        bagMax: stats.bagMax,
        day: s.day,
        warn: Math.round(s.warn || 0),
        tideSec: Math.round(s.tideSec || 60),
        radShield: s.radShield || 0,
        skillPoints: s.skillPoints || 0
      },
      questSummary: this.getCurrentQuestSummary(),
      activeGuardianName: guard ? guard.name : '',
      mapInfo: { id: map.id, name: map.name, regionName: reg.name, hasTide: Boolean(map.hasTide) },
      weatherInfo: { name: weather.name, color: weather.color },
      endingPct: this.getEndingProgressPct()
    });
  },

  showToast(text, type = 'info') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.setData({ toast: { show: true, text, type } });
    this.toastTimer = setTimeout(() => {
      this.setData({ 'toast.show': false });
    }, 2200);
  },

  showSceneBanner(title, region) {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.setData({ sceneBanner: { show: true, title, region } });
    this.bannerTimer = setTimeout(() => {
      this.setData({ 'sceneBanner.show': false });
    }, 2000);
  },

  triggerShake() {
    if (!this.shakeEnabled) return;
    this.setData({ screenShake: true });
    setTimeout(() => this.setData({ screenShake: false }), 250);
  },

  // ==================== 经验、主线与区域解锁 ====================
  gainExp(amount) {
    if (!amount || amount <= 0) return;
    const s = this.state;
    s.exp += Math.round(amount);
    let leveled = false;
    while (s.exp >= expForNextLevel(s.level)) {
      s.exp -= expForNextLevel(s.level);
      s.level += 1;
      s.skillPoints += 1;
      leveled = true;
    }
    if (leveled) {
      const stats = this.getHeroStats();
      s.hp = stats.maxHp;
      s.energy = stats.maxEnergy;
      sfx.ending();
      this.showToast(`修为突破！晋升至 Lv.${s.level}，获 1 点修为点！`, 'success');
    }
  },

  advanceQuestTrigger(triggerName) {
    const s = this.state;
    let changed = false;
    MAIN_QUESTS.forEach((act) => {
      act.steps.forEach((st) => {
        if (st.trigger === triggerName && !s.completedSteps.includes(st.id)) {
          s.completedSteps.push(st.id);
          changed = true;
          this.showToast(`主线推进：【${st.title}】达成！`, 'success');
        }
      });
      if (!s.completedActs.includes(act.id) && act.steps.every((st) => s.completedSteps.includes(st.id))) {
        s.completedActs.push(act.id);
        changed = true;
        if (act.reward) {
          if (act.reward.exp) this.gainExp(act.reward.exp);
          if (act.reward.gold) s.gold += act.reward.gold;
          if (act.reward.unlockRegion && !s.unlockedRegions.includes(act.reward.unlockRegion)) {
            s.unlockedRegions.push(act.reward.unlockRegion);
          }
        }
        sfx.ending();
        this.showToast(`【${act.title}】完结！新域已解锁！`, 'success');
      }
    });
    if (changed) {
      this.syncHUD();
      this.scheduleSave();
    }
  },

  unlockStoryRelic(storyId) {
    if (storyId === undefined || storyId === null) return;
    if (!this.state.stories.includes(storyId)) {
      this.state.stories.push(storyId);
      const ch = STORY_CHAPTERS[storyId];
      if (ch) this.showToast(`寻回剧情信物：【${ch.relic}】！`, 'success');
      this.advanceQuestTrigger(`get_story_${storyId}`);
    }
  },

  unlockCollection(colId) {
    if (colId === undefined || colId === null) return;
    if (!this.state.collections.includes(colId)) {
      this.state.collections.push(colId);
      const c = COLLECTIONS[colId];
      if (c) this.showToast(`收入战前古董：【${c.name}】！`, 'success');
    }
  },

  // ==================== 触控移动、寻路与场景切换 ====================
  onCanvasTap(e) {
    if (!this.world || this.data.inBattle || this.data.activeModal || this.data.dialog.open) return;
    const x = e.detail && typeof e.detail.x === 'number' ? e.detail.x : 0;
    const y = e.detail && typeof e.detail.y === 'number' ? e.detail.y : 0;
    if (typeof this.world.handleTap === 'function') {
      this.world.handleTap(x, y);
    }
  },

  onDpadStart(e) {
    const dx = Number(e.currentTarget.dataset.dx) || 0;
    const dy = Number(e.currentTarget.dataset.dy) || 0;
    const dir = e.currentTarget.dataset.dir || '';
    this.setData({ dpadActive: true, dpadDir: dir });
    if (this.world && typeof this.world.setInputDir === 'function') {
      this.world.setInputDir(dx, dy);
    }
  },

  onDpadEnd() {
    this.setData({ dpadActive: false, dpadDir: '' });
    if (this.world && typeof this.world.setInputDir === 'function') {
      this.world.setInputDir(0, 0);
    }
  },

  onInteractTap() {
    if (!this.world || this.data.inBattle) return;
    if (typeof this.world.interactNearest === 'function') {
      this.world.interactNearest();
    }
  },

  onRefreshLoot() {
    const s = this.state;
    const map = MAPS_BY_ID[s.mapId];
    if (!map) return;
    if (map.isSafe) {
      this.showToast('当前安全区域没有野外游荡异兽，请出城探索！', 'info');
      return;
    }
    if (s.energy < 8) {
      this.showToast('内息不足 8 点，请先歇脚或服药。', 'warn');
      return;
    }
    s.energy -= 8;
    s.day += 1;
    const pool = map.weatherPool || [0];
    const nextW = pool[Math.floor(Math.random() * pool.length)];
    s.regionWeathers[map.regionId] = nextW;
    if (this.world) {
      if (typeof this.world.setWeather === 'function') this.world.setWeather(nextW);
      // 刷新非首领游荡异兽（已永久开启的宝箱绝不复生）
      for (const en of this.world.enemies || []) {
        if (!en.alive && !(en.data && en.data.isBoss)) {
          en.alive = true;
          en.defeated = false;
          en.hp = en.maxHp;
          en.x = en.homeX;
          en.y = en.homeY;
          en.respawnTimer = 0;
        }
      }
    }
    sfx.uiTick();
    this.showToast(`第 ${s.day} 天：天气转为「${WEATHERS[nextW].name}」，区域游荡异兽已重新出没！`, 'info');
    this.syncHUD();
    this.scheduleSave();
  },

  enterMap(mapId, spawnX = null, spawnY = null) {
    const target = MAPS_BY_ID[mapId];
    if (!target) return;
    if (target.regionId && !this.state.unlockedRegions.includes(target.regionId)) {
      const reg = REGIONS.find((r) => r.id === target.regionId);
      this.showToast(`尚未打通前往「${reg ? reg.name : target.name}」的驿路！`, 'warn');
      return;
    }
    this.state.mapId = mapId;
    this.state.tideSec = 60;
    this.state.openedChests = this.state.openedChests || [];
    this.selectedWorldRegionId = target.regionId || 'reg_town';
    if (this.world && typeof this.world.loadMap === 'function') {
      this.world.loadMap(mapId, spawnX, spawnY, { openedChests: this.state.openedChests });
      if (typeof this.world.setWeather === 'function') {
        this.world.setWeather(this.state.regionWeathers[target.regionId] || 0);
      }
    }
    this.advanceQuestTrigger(`enter_${mapId}`);
    const reg = REGIONS.find((r) => r.id === target.regionId);
    this.showSceneBanner(target.name, reg ? reg.name : '墨土五域');
    sfx.uiTick();
    this.syncHUD();
    this.scheduleSave();
  },

  // ==================== 世界交互、搜刮与辐射潮 ====================
  _startHazardLoop() {
    if (this.hazardTimer) clearInterval(this.hazardTimer);
    this.hazardTimer = setInterval(() => {
      if (!this.state || this.data.inBattle || this.data.activeModal || this.data.dialog.open) return;
      const map = MAPS_BY_ID[this.state.mapId];
      if (!map || !map.hasTide) return;
      this.state.tideSec = Math.max(0, (this.state.tideSec || 60) - 1);
      if (this.state.tideSec === 0) {
        this.state.tideSec = 60;
        const stats = this.getHeroStats();
        if (stats.immuneTide) {
          this.showToast('天枢护心镜泛起青光，抵御了辐射潮！', 'success');
        } else if (this.state.radShield > 0) {
          this.state.radShield -= 1;
          this.showToast('抗辐射护盾破碎，为你挡下致命辐射潮！', 'info');
        } else {
          const dmg = Math.max(8, Math.round(stats.maxHp * 0.16 * (1 - stats.radResist)));
          this.state.hp = Math.max(1, this.state.hp - dmg);
          sfx.geiger();
          this.showToast(`墨色辐射潮袭来！损失 ${dmg} 点气血！`, 'warn');
        }
      }
      this.syncHUD();
    }, 1000);
  },

  handleWorldInteract(target) {
    if (!target || this.data.inBattle) return;
    if (target.type === 'building' && target.building) {
      const b = target.building;
      if (b.action === 'enter_map' && b.targetMap) this.enterMap(b.targetMap, b.targetSpawnX, b.targetSpawnY);
      else if (['shop', 'inn', 'disassemble', 'loan', 'worldmap'].includes(b.action)) this.openModalByName(b.action);
      else if (b.action === 'tasks') this.openModalByName('quests');
      else this.showToast(`探访了「${b.name}」`, 'info');
      return;
    }
    if (target.type === 'portal' && target.portal) {
      const p = target.portal;
      this.enterMap(p.to, p.targetX != null ? p.targetX : p.spawnX, p.targetY != null ? p.targetY : p.spawnY);
      return;
    }
    if (target.type === 'npc') {
      this.openNpcDialog(target.npcId);
      return;
    }
    if (target.type === 'save_point') {
      const stats = this.getHeroStats();
      const hHp = Math.round(stats.maxHp * 0.25);
      const hMp = Math.round(stats.maxEnergy * 0.25);
      this.state.hp = Math.min(stats.maxHp, this.state.hp + hHp);
      this.state.energy = Math.min(stats.maxEnergy, this.state.energy + hMp);
      sfx.ending();
      this.showToast(`墨石记录碑润泽：气血 +${hHp}，内息 +${hMp}！`, 'success');
      this.syncHUD();
      this.openModalByName('save');
      return;
    }
    if (target.type === 'loot' && target.node) {
      this.handleLootNode(target.node);
    }
  },

  handleLootNode(node) {
    if (!node || node.opened || node.collected) return;
    const s = this.state;
    s.openedChests = s.openedChests || [];
    const stats = this.getHeroStats();
    const map = MAPS_BY_ID[s.mapId] || MAPS_BY_ID.town;
    const chestKey = getChestKey(map.id, node);
    if (s.openedChests.includes(chestKey)) {
      node.opened = true;
      node.collected = true;
      if (this.world && typeof this.world.setOpenedChests === 'function') {
        this.world.setOpenedChests(s.openedChests);
      }
      return;
    }

    const isHeavy = node.type === 'abandoned_cannon' || node.type === 'mech_wreck';
    const costMp = isHeavy ? 10 : Math.max(2, 6 - (s.skills[0] || 0));
    if (s.energy < costMp) {
      this.showToast(`内息不足 ${costMp} 点，请先歇脚或服用补给！`, 'warn');
      return;
    }
    s.energy -= costMp;
    s.food = Math.max(0, s.food - 2);
    s.stats.pick = (s.stats.pick || 0) + 1;
    if (isHeavy || node.type === 'relic_spot') {
      s.stats.salvageHeavy = (s.stats.salvageHeavy || 0) + 1;
    }

    // 一次性永久开启，绝不复生
    node.opened = true;
    node.collected = true;
    s.openedChests.push(chestKey);
    if (this.world && typeof this.world.setOpenedChests === 'function') {
      this.world.setOpenedChests(s.openedChests);
    }

    const regionIdx = getRegionTierIndex(map);
    const isPremiumChest = isHeavy || node.type === 'vault_box' || node.type === 'relic_spot' || map.sceneType === 'cave';

    // 1. 区域阶梯丰厚废土币（地窟/秘匣/重型残骸额外 +50%）
    const baseGold = 45 + regionIdx * 65 + (s.level || 1) * 12;
    const goldGain = Math.round(baseGold * (1 + Math.random() * 0.5) * (isPremiumChest ? 1.5 : 1));
    s.gold += goldGain;

    const lootParts = [`+${goldGain} 币`];
    let bestQuality = 'fine';

    // 2. 剧情信物 / 古董概率掉落
    if (s.mapId === 'ruins' && !s.stories.includes(1) && Math.random() < 0.45) {
      this.unlockStoryRelic(1);
      lootParts.push('信物·旧磁带');
      bestQuality = 'legend';
    } else if (s.mapId === 'cave_b04' && !s.stories.includes(3) && Math.random() < 0.5) {
      this.unlockStoryRelic(3);
      lootParts.push('信物·生锈钥匙');
      bestQuality = 'legend';
    } else if (Math.random() < 0.10 + (s.skills[1] || 0) * 0.03) {
      const missing = COLLECTIONS.filter((c) => !s.collections.includes(c.id));
      if (missing.length) {
        const pick = missing[Math.floor(Math.random() * missing.length)];
        this.unlockCollection(pick.id);
        lootParts.push(`古董·${pick.name}`);
        bestQuality = 'rare';
      }
    }

    // 3. 1–2 件高价值区域物资/科技件/补给
    const itemPool = REGION_CHEST_ITEMS[regionIdx] || REGION_CHEST_ITEMS[0];
    const itemCount = isPremiumChest ? 2 : (Math.random() < 0.55 ? 2 : 1);
    const rareBoost = 1 + (s.skills[1] || 0) * 0.15 + (s.skills[5] || 0) * 0.08;
    for (let i = 0; i < itemCount; i++) {
      const itemId = itemPool[Math.floor(Math.random() * itemPool.length)];
      const r = Math.random();
      let quality = r < 0.04 * rareBoost ? 'legend' : r < 0.22 * rareBoost ? 'rare' : r < 0.60 * rareBoost ? 'fine' : 'common';
      if (isPremiumChest && quality === 'common') quality = 'fine';
      const res = grantItemToStateBagOrGold(s, itemId, quality, stats.bagMax);
      if (res) {
        lootParts.push(res.label);
        if (quality === 'legend' || (quality === 'rare' && bestQuality !== 'legend')) bestQuality = quality;
      }
    }

    // 地窟/秘匣 30% 概率额外赠丹药
    if (isPremiumChest && Math.random() < 0.30) {
      const elixirId = regionIdx >= 2 ? 'elixir_jiuzhuan' : 'elixir_ration';
      s.elixirs[elixirId] = (s.elixirs[elixirId] || 0) + 1;
      lootParts.push(`丹药·${(ELIXIRS[elixirId] && ELIXIRS[elixirId].name) || '九转青瘴丹'}`);
    }

    // 4. 品质词缀装备：地窟/秘匣/重型残骸 100% 必出，野外宝箱 55% 概率出
    const equipChance = isPremiumChest ? 1.0 : 0.55;
    if (Math.random() < equipChance) {
      const eqPool = Array.isArray(node.equipPool) && node.equipPool.length
        ? node.equipPool
        : (REGION_EQUIP_POOLS[regionIdx] || REGION_EQUIP_POOLS[0]);
      const baseId = eqPool[Math.floor(Math.random() * eqPool.length)];
      const eqQuality = rollChestEquipQuality(s, regionIdx, isPremiumChest);
      const eq = rollEquipment(baseId, eqQuality);
      if (eq) {
        s.equipBag.push(eq);
        lootParts.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
        bestQuality = eq.quality;
      }
    }

    sfx.pick(bestQuality);
    if (s.mapId === 'arsenal') this.advanceQuestTrigger('loot_arsenal');
    if (s.mapId === 'vault') this.advanceQuestTrigger('loot_vault');
    this.gainExp(18 + regionIdx * 8 + (isPremiumChest ? 12 : 0));
    this.showToast(`开启「${node.name || '宝箱'}」：${lootParts.join('、')}！`, 'success');
    this.syncHUD();
    this.scheduleSave();
  },

  // ==================== NPC 对话 ====================
  openNpcDialog(npcId) {
    const npc = NPCS[npcId];
    if (!npc) return;
    if (this.world) this.world.paused = true;
    sfx.uiTick();
    this.advanceQuestTrigger(`talk_${npcId}`);
    this.setData({
      dialog: {
        open: true,
        id: npc.id,
        name: npc.name,
        title: npc.title,
        portrait: resolveAssetPath(npc.portrait || 'assets/portrait_laohuang.jpg'),
        text: npc.talk,
        options: npc.options || []
      }
    });
  },

  closeDialog() {
    this.setData({ 'dialog.open': false });
    if (this.world && !this.data.inBattle && !this.data.activeModal) {
      this.world.paused = false;
    }
  },

  onDialogOptionTap(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const npc = NPCS[this.data.dialog.id];
    if (!npc) return;
    const opt = (npc.options || [])[idx];
    if (!opt) return;

    if (opt.action) {
      this.closeDialog();
      this.openModalByName(opt.action);
      return;
    }

    const s = this.state;
    const stats = this.getHeroStats();
    let reply = '“江湖路远，少侠保重。”';

    if (npc.id === 'laohuang') {
      if (idx === 1) reply = '“阿哲那块旧表停在 21:47。出东门去城郊废土找盲眼老鬼，防空洞鼠王窝里兴许就有下落！”';
      else if (idx === 2) {
        const mult = s.reputation >= 2 ? 1.15 : 1.0;
        const earned = this._sellAllTrash(mult);
        reply = earned > 0 ? `“爽快！按 ${Math.round(mult * 100)}% 市价收了，共计 ${earned} 废土币！”` : '“行囊里暂无可售废品，多去荒原转转吧。”';
      }
    } else if (npc.id === 'yaotong') {
      if (idx === 1) reply = '“毒泽辐射潮每隔一分钟涌动一次，备好抗辐射药剂或炼出天枢护心镜方可无虞。”';
      else if (idx === 2) {
        if (s.gold >= 60) { s.gold -= 60; s.reputation += 1; reply = '“多谢少侠义举！墨石镇声望 +1。”'; }
        else reply = '“少侠囊中羞涩，心意老夫领了。”';
      }
    } else if (npc.id === 'laogui') {
      if (idx === 0) {
        if (s.gold >= 150) { s.gold -= 150; this.onRefreshLoot(); reply = '“密道图归你了，眼前废墟的暗格都标好了！”'; }
        else reply = '“废土密道图要 150 废土币，凑齐再来。”';
      } else if (idx === 1) reply = '“城郊北坡下便是战前防空洞，鼠王盘踞深处，压低妖血用墨壶收它几个手下！”';
      else if (idx === 2) {
        s.hp = Math.min(stats.maxHp, s.hp + 25);
        s.energy = Math.min(stats.maxEnergy, s.energy + 20);
        reply = '“来，喝碗热茶暖暖身子。（+25 血 +20 息）”';
      }
    } else if (npc.id === 'shaobing') {
      if (idx === 0 && s.gold >= 200) { s.gold -= 200; s.warn = 0; reply = '“算你识相，警戒清零了！”'; }
      else if (idx === 1 && s.reputation >= 3) { s.warn = 0; reply = '“原来是墨石镇的大人物，小的有眼不识泰山！”'; }
      else if (idx === 2 && s.food >= 30) { s.food -= 30; s.warn = Math.floor(s.warn / 2); reply = '“干粮不错，放你一马。”'; }
      else reply = '“条件不够，莫要戏耍铁爪帮！”';
    } else if (npc.id === 'jiubao') {
      if (idx === 1) reply = '“地铁二号线塌方口后是铁爪二当家断钢，穿甲武学或重炮最克他！”';
      else if (idx === 2) {
        if (s.gold >= 40) { s.gold -= 40; s.energy = Math.min(stats.maxEnergy, s.energy + 35); reply = '“好酒入喉，内息 +35！”'; }
        else reply = '“烈酒 40 币一杯，概不赊账。”';
      }
    } else if (npc.id === 'tiejiang') {
      reply = '“B-04 冷却井深处盘踞着赤焰重甲·祝融七号，备好回春诀与护驾灵兽再去！”';
    } else if (npc.id === 'yinshi') {
      if (idx === 0) reply = '“故人阿哲就在东岸草庐修无线电，你快去见他吧。”';
      else if (idx === 1 && s.gold >= 300) { s.gold -= 300; s.radShield += 1; s.hp = Math.min(stats.maxHp, s.hp + 30); reply = '“收好这剂抗辐秘药，+1 护盾 +30 血！”'; }
      else if (idx === 2 && s.food >= 20) { s.food -= 20; s.reputation += 2; reply = '“老夫许久未尝烟火气了，声望 +2！”'; }
      else reply = '“备足资粮再来寻老夫吧。”';
    } else if (npc.id === 'azhe') {
      if (idx === 0) { this.unlockStoryRelic(4); reply = '“21:47……我全想起来了！去 07 号避难所终结天枢主脑吧，我替你守着电台！”'; }
      else if (idx === 1) { s.energy = stats.maxEnergy; reply = '“老伙计，内息已回满！”'; }
      else reply = '“玄墨大帝就在天枢地脉密窟深处，千万小心！”';
    } else if (npc.id === 'xuezhe') {
      if (idx === 0 && s.gold >= 400) { s.gold -= 400; s.skillPoints += 1; reply = '“神经强化完成！获得 1 点修为点！”'; }
      else if (idx === 1) reply = '“集齐 5 件剧情信物、8 件战前古董并击败玄墨大帝，即可解锁至高「墨土之王」结局！”';
      else if (idx === 2) {
        const earned = this._sellAllTrash(1.25);
        reply = earned > 0 ? `“按 125% 溢价收购完毕，共计 ${earned} 废土币！”` : '“暂无可收购的废品。”';
      } else reply = '“400 废土币方可启动神经强化。”';
    } else if (npc.id === 'jiaotou') {
      if (idx === 1) reply = '“古武重暴击、军火重破甲、墨甲擅重炮、奇术能控场疗伤，四系融会贯通方为宗师！”';
      else if (idx === 2) { s.energy = stats.maxEnergy; reply = '“吐纳周天，内息已完全恢复！”'; }
    }

    this.setData({ 'dialog.text': reply });
    this.syncHUD();
    this.scheduleSave();
  },

  // ==================== 2.5D 纯泼墨回合制战斗系统 ====================
  startBattle(worldEnemy) {
    const tpl = ENEMIES[worldEnemy.enemyId || worldEnemy.id];
    if (!tpl) return;
    if (this.world) this.world.paused = true;
    if (!this.state.seenEnemies.includes(tpl.id)) this.state.seenEnemies.push(tpl.id);

    const guard = this.state.activeGuardianId ? GUARDIANS[this.state.activeGuardianId] : null;
    this.battleRuntime = {
      worldEnemy,
      enemy: tpl,
      enemyHp: tpl.hp,
      enemyMaxHp: tpl.hp,
      enemyStatus: { burn: 0, poison: 0, defDown: 0, stun: 0 },
      heroShield: 0,
      heroDmgReduceTurns: 0,
      heroAtkBuffTurns: 0,
      captureBonus: 0,
      busy: false,
      turn: 1
    };

    sfx.alarm();
    this.setData({
      inBattle: true,
      battleSubMode: '',
      captureAnim: { active: false, caption: '' },
      battleVfx: { branch: 'martial', flashText: '', enemyAnim: '', heroAnim: '', guardianAnim: '', enemyDmg: '', enemyDmgType: '', heroDmg: '', heroDmgType: '' }
    });
    this._syncBattleView(`遭遇【${tpl.name}】！拔剑戒备，准备迎战！`);
  },

  _syncBattleView(logMsg) {
    const b = this.battleRuntime;
    if (!b) return;
    const guard = this.state.activeGuardianId ? GUARDIANS[this.state.activeGuardianId] : null;
    const hpPct = clamp(Math.round((b.enemyHp / b.enemyMaxHp) * 100), 0, 100);
    const canCapture = Boolean(b.enemy.capturable && !b.enemy.isBoss && hpPct <= 45);
    this.syncHUD();
    this.setData({
      battle: {
        enemy: b.enemy,
        enemySprite: getSpriteForEnemy(b.enemy.spriteType),
        enemyHp: Math.max(0, Math.round(b.enemyHp)),
        enemyMaxHp: b.enemyMaxHp,
        enemyHpPct: hpPct,
        enemyStatus: { ...b.enemyStatus },
        canCapture,
        heroShield: Math.round(b.heroShield),
        guardian: guard,
        guardianSprite: guard ? getSpriteForGuardian(guard.id) : '',
        busy: b.busy,
        turnText: b.busy ? '敌方回合' : `第 ${b.turn} 回合`,
        log: logMsg !== undefined ? logMsg : (this.data.battle.log || '')
      }
    });
    if (this.data.battleSubMode === 'skills') this._refreshBattleSkills();
    if (this.data.battleSubMode === 'items') this._refreshBattleConsumables();
  },

  _triggerBattleFlash(branch, text) {
    this.setData({ 'battleVfx.branch': branch, 'battleVfx.flashText': text });
    setTimeout(() => this.setData({ 'battleVfx.flashText': '' }), 780);
  },

  _showDmgFloat(isEnemy, text, type = '') {
    if (isEnemy) {
      this.setData({ 'battleVfx.enemyDmg': text, 'battleVfx.enemyDmgType': type, 'battleVfx.enemyAnim': 'hit' });
      setTimeout(() => this.setData({ 'battleVfx.enemyDmg': '', 'battleVfx.enemyAnim': '' }), 750);
    } else {
      this.setData({ 'battleVfx.heroDmg': text, 'battleVfx.heroDmgType': type, 'battleVfx.heroAnim': 'hit' });
      setTimeout(() => this.setData({ 'battleVfx.heroDmg': '', 'battleVfx.heroAnim': '' }), 750);
    }
  },

  _calcDamageToEnemy(mult = 1, opts = {}) {
    const stats = this.getHeroStats();
    const b = this.battleRuntime;
    let atk = stats.atk * (b.heroAtkBuffTurns > 0 ? 1.3 : 1);
    if (opts.isArtillery) atk *= (1 + stats.artilleryBonus);
    if (opts.isSkill) atk *= (1 + stats.skillBonus);
    let def = b.enemy.def || 0;
    if (b.enemyStatus.defDown > 0) def *= 0.75;
    if (opts.ignoreDef) def = 0;
    else def *= (1 - Math.min(0.85, stats.armorPen + (opts.armorPen || 0)));

    let dmg = Math.max(6, Math.round(atk * mult - def * 0.55) + (stats.bonusDmg || 0));
    const critChance = clamp(stats.crit + (opts.critBonus || 0), 0, 0.95);
    const isCrit = Boolean(opts.guaranteedCrit || Math.random() < critChance);
    if (isCrit) dmg = Math.round(dmg * 1.6);
    return { dmg, isCrit };
  },

  onBattleToggleSkills() {
    if (!this.battleRuntime || this.battleRuntime.busy) return;
    const next = this.data.battleSubMode === 'skills' ? '' : 'skills';
    this.setData({ battleSubMode: next });
    if (next === 'skills') this._refreshBattleSkills();
  },

  onSelectBattleBranch(e) {
    const branch = e.currentTarget.dataset.branch || 'martial';
    this.setData({ battleSkillBranch: branch });
    this._refreshBattleSkills();
  },

  _refreshBattleSkills() {
    const branch = this.data.battleSkillBranch || 'martial';
    const list = COMBAT_SKILLS.filter((sk) => sk.category === branch).map((sk) => {
      const coords = SKILL_ICON_COORDS[sk.id] || [0, 0];
      return {
        ...sk,
        col: coords[0],
        row: coords[1],
        locked: this.state.level < sk.unlockLv,
        canAfford: this.state.energy >= sk.mpCost
      };
    });
    this.setData({ battleBranchSkills: list });
  },

  onBattleToggleItems() {
    if (!this.battleRuntime || this.battleRuntime.busy) return;
    const next = this.data.battleSubMode === 'items' ? '' : 'items';
    this.setData({ battleSubMode: next });
    if (next === 'items') this._refreshBattleConsumables();
  },

  _refreshBattleConsumables() {
    const list = [];
    Object.entries(this.state.elixirs || {}).forEach(([id, count]) => {
      if (count > 0 && ELIXIRS[id]) {
        const coords = id === 'elixir_ration' ? [2, 2] : [0, 3];
        list.push({ kind: 'elixir', key: id, name: ELIXIRS[id].name, count, col: coords[0], row: coords[1] });
      }
    });
    const counts = {};
    this.state.bag.forEach((b) => {
      const it = ITEMS[b.itemId];
      if (it && it.isConsumable) counts[b.itemId] = (counts[b.itemId] || 0) + 1;
    });
    Object.entries(counts).forEach(([id, count]) => {
      const it = ITEMS[Number(id)];
      const coords = getItemCoords(id);
      list.push({ kind: 'item', key: String(id), name: it.name, count, col: coords[0], row: coords[1] });
    });
    this.setData({ battleConsumables: list });
  },

  onBattleAttack() {
    const b = this.battleRuntime;
    if (!b || b.busy) return;
    b.busy = true;
    this.setData({ battleSubMode: '', 'battleVfx.heroAnim': 'lunge-left' });
    setTimeout(() => this.setData({ 'battleVfx.heroAnim': '' }), 240);

    const { dmg, isCrit } = this._calcDamageToEnemy(1.0);
    b.enemyHp = Math.max(0, b.enemyHp - dmg);
    const stats = this.getHeroStats();
    if (stats.lifesteal > 0) {
      this.state.hp = Math.min(stats.maxHp, this.state.hp + Math.round(dmg * stats.lifesteal));
    }
    if (stats.proc === 'burn' && Math.random() < 0.25) b.enemyStatus.burn = 3;

    sfx.playCombatSfx('martial', isCrit);
    if (isCrit) this.triggerShake();
    this._showDmgFloat(true, isCrit ? `暴击 -${dmg}` : `-${dmg}`, isCrit ? 'crit' : '');
    const msg = `沈砚挥兵斩击，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`;
    this._syncBattleView(msg);

    if (b.enemyHp <= 0) {
      setTimeout(() => this._handleBattleVictory(false), 520);
    } else {
      setTimeout(() => this._runEnemyTurn([msg]), 520);
    }
  },

  onBattleUseSkill(e) {
    const b = this.battleRuntime;
    if (!b || b.busy) return;
    const sk = COMBAT_SKILLS.find((x) => x.id === e.currentTarget.dataset.id);
    if (!sk) return;
    if (this.state.level < sk.unlockLv) { this.showToast(`需 Lv.${sk.unlockLv} 方可领悟！`, 'warn'); return; }
    if (this.state.energy < sk.mpCost) { this.showToast('内息不足！', 'warn'); return; }

    this.state.energy -= sk.mpCost;
    b.busy = true;
    this.setData({ battleSubMode: '', 'battleVfx.heroAnim': 'lunge-left' });
    setTimeout(() => this.setData({ 'battleVfx.heroAnim': '' }), 260);
    this._triggerBattleFlash(sk.category, sk.name);
    sfx.playCombatSfx(sk.category, true);

    const stats = this.getHeroStats();
    let msg = `施展【${sk.name}】！`;

    if (sk.selfBuff === 'shield') {
      const sh = (sk.baseShield || 45) + this.state.level * (sk.perLvShield || 8);
      b.heroShield += sh;
      b.heroDmgReduceTurns = 2;
      msg = `【${sk.name}】展开 ${sh} 点气盾！`;
      this._showDmgFloat(false, `+${sh}盾`, 'heal');
    } else if (sk.selfBuff === 'overdrive') {
      b.heroShield += sk.baseShield || 65;
      b.heroAtkBuffTurns = 3;
      msg = `【${sk.name}】护盾 +${sk.baseShield}，攻击提升 30%！`;
      this._showDmgFloat(false, '超载', 'heal');
    } else if (sk.selfBuff === 'heal') {
      const heal = Math.round(stats.maxHp * (sk.healPct || 0.45));
      this.state.hp = Math.min(stats.maxHp, this.state.hp + heal);
      msg = `【${sk.name}】回复 ${heal} 点气血！`;
      this._showDmgFloat(false, `+${heal}`, 'heal');
    } else {
      const { dmg, isCrit } = this._calcDamageToEnemy(sk.mult || 1.6, {
        isSkill: true,
        isArtillery: sk.isArtillery,
        ignoreDef: sk.ignoreDef,
        armorPen: sk.armorPen,
        critBonus: sk.critBonus,
        guaranteedCrit: sk.guaranteedCrit
      });
      b.enemyHp = Math.max(0, b.enemyHp - dmg);
      if (sk.debuff === 'burn') b.enemyStatus.burn = 3;
      if (sk.debuff === 'def_down') b.enemyStatus.defDown = 3;
      if (sk.stun) b.enemyStatus.stun = sk.stun;
      if (sk.captureBonus) b.captureBonus += sk.captureBonus;
      this.triggerShake();
      this._showDmgFloat(true, isCrit ? `绝学暴击 -${dmg}` : `-${dmg}`, isCrit ? 'crit' : '');
      msg = `施展【${sk.name}】，重创敌方 ${dmg} 点气血！`;
    }

    this._syncBattleView(msg);
    if (b.enemyHp <= 0) {
      setTimeout(() => this._handleBattleVictory(false), 620);
    } else {
      setTimeout(() => this._runEnemyTurn([msg]), 620);
    }
  },

  onBattleCapture() {
    const b = this.battleRuntime;
    if (!b || b.busy) return;
    if (b.enemy.isBoss || !b.enemy.capturable) {
      this.showToast('区域首领妖气过盛，无法直接收入墨壶！', 'warn');
      return;
    }
    const hpRatio = b.enemyHp / b.enemyMaxHp;
    const rate = clamp((1 - hpRatio) * 0.92 + (hpRatio <= 0.45 ? 0.28 : 0) + (b.captureBonus || 0), 0.12, 0.96);

    b.busy = true;
    this.setData({
      battleSubMode: '',
      captureAnim: { active: true, caption: '天工墨壶倒悬 · 摄魂炼妖中...' }
    });
    sfx.playCombatSfx('mystic', true);
    this._syncBattleView(`祭出天工墨壶！当前收妖成功率约 ${Math.round(rate * 100)}%...`);

    setTimeout(() => {
      const success = Math.random() < rate;
      if (success) {
        this.setData({ 'captureAnim.caption': '妖魂入壶 · 收妖成功！' });
        sfx.ending();
        const eid = b.enemy.id;
        this.state.capturedSpirits[eid] = (this.state.capturedSpirits[eid] || 0) + 1;
        this.state.stats.capture = (this.state.stats.capture || 0) + 1;
        this.advanceQuestTrigger('capture_any');
        setTimeout(() => {
          this.setData({ captureAnim: { active: false, caption: '' } });
          this._handleBattleVictory(true);
        }, 720);
      } else {
        this.setData({ 'captureAnim.caption': '妖魂剧烈挣扎，挣脱了墨壶！' });
        setTimeout(() => {
          this.setData({ captureAnim: { active: false, caption: '' } });
          this._runEnemyTurn(['收妖失手！压低敌方血量至 45% 以下成功率大增！']);
        }, 560);
      }
    }, 950);
  },

  onBattleUseItem(e) {
    const b = this.battleRuntime;
    if (!b || b.busy) return;
    const kind = e.currentTarget.dataset.kind;
    const key = e.currentTarget.dataset.key;
    const stats = this.getHeroStats();
    let msg = '';

    if (kind === 'elixir') {
      const elx = ELIXIRS[key];
      if (!elx || !(this.state.elixirs[key] > 0)) return;
      this.state.elixirs[key] -= 1;
      if (elx.effect.hp) this.state.hp = Math.min(stats.maxHp, this.state.hp + elx.effect.hp);
      if (elx.effect.energy) this.state.energy = Math.min(stats.maxEnergy, this.state.energy + elx.effect.energy);
      if (elx.effect.food) this.state.food = Math.min(100, this.state.food + elx.effect.food);
      if (elx.effect.radShield) this.state.radShield += elx.effect.radShield;
      msg = `服下【${elx.name}】，元气大振！`;
    } else {
      const itemId = Number(key);
      const idx = this.state.bag.findIndex((x) => x.itemId === itemId);
      if (idx < 0) return;
      const it = ITEMS[itemId];
      this.state.bag.splice(idx, 1);
      if (it.effect && it.effect.clearWarn) {
        this.state.warn = 0;
        this.showToast('投出烟雾弹，趁烟脱身！', 'success');
        this._closeBattle();
        return;
      }
      if (it.effect && it.effect.hp) this.state.hp = Math.min(stats.maxHp, this.state.hp + it.effect.hp);
      if (it.effect && it.effect.energy) this.state.energy = Math.min(stats.maxEnergy, this.state.energy + it.effect.energy);
      if (it.effect && it.effect.food) this.state.food = Math.min(100, this.state.food + it.effect.food);
      if (it.effect && it.effect.radShield) this.state.radShield += it.effect.radShield;
      msg = `使用了【${it.name}】！`;
    }

    b.busy = true;
    this.setData({ battleSubMode: '' });
    sfx.pick('fine');
    this._showDmgFloat(false, '回元', 'heal');
    this._syncBattleView(msg);
    setTimeout(() => this._runEnemyTurn([msg]), 520);
  },

  onBattleRun() {
    const b = this.battleRuntime;
    if (!b || b.busy) return;
    const rate = b.enemy.isBoss ? 0.35 : clamp(0.62 + (this.state.skills[4] || 0) * 0.15, 0.62, 0.95);
    b.busy = true;
    this.setData({ battleSubMode: '' });
    if (Math.random() < rate) {
      this._syncBattleView('脚踏墨影步，安然脱离战圈！');
      sfx.uiTick();
      setTimeout(() => this._closeBattle(), 450);
    } else {
      this._runEnemyTurn(['退路被封，撤退失败！']);
    }
  },

  _runEnemyTurn(logs = []) {
    const b = this.battleRuntime;
    if (!b) return;
    const stats = this.getHeroStats();

    // 1. 护驾灵兽自动协战
    const guard = this.state.activeGuardianId ? GUARDIANS[this.state.activeGuardianId] : null;
    if (guard && b.enemyHp > 0) {
      this.setData({ 'battleVfx.guardianAnim': 'lunge-left' });
      setTimeout(() => this.setData({ 'battleVfx.guardianAnim': '' }), 260);
      if (guard.baseDmg) {
        const gDmg = guard.baseDmg + (guard.perLvDmg || 0) * this.state.level;
        b.enemyHp = Math.max(0, b.enemyHp - gDmg);
        logs.push(`护驾【${guard.name}】施展「${guard.skillName}」造成 ${gDmg} 伤害！`);
      }
      if (guard.shield) b.heroShield += guard.shield;
      if (guard.healHp) this.state.hp = Math.min(stats.maxHp, this.state.hp + guard.healHp);
      if (guard.healMp) this.state.energy = Math.min(stats.maxEnergy, this.state.energy + guard.healMp);
      if (guard.effect === 'poison') b.enemyStatus.poison = 3;
      if (guard.effect === 'armor_break') b.enemyStatus.defDown = 2;
      if (b.enemyHp <= 0) {
        this._syncBattleView(logs.join(' '));
        setTimeout(() => this._handleBattleVictory(false), 500);
        return;
      }
    }

    // 2. 敌方持续伤害（灼烧/剧毒）
    if (b.enemyStatus.burn > 0) {
      b.enemyHp = Math.max(0, b.enemyHp - 22);
      b.enemyStatus.burn -= 1;
      logs.push('敌方灼烧 -22 血！');
    }
    if (b.enemyStatus.poison > 0) {
      b.enemyHp = Math.max(0, b.enemyHp - 18);
      b.enemyStatus.poison -= 1;
      logs.push('敌方剧毒 -18 血！');
    }
    if (b.enemyHp <= 0) {
      this._syncBattleView(logs.join(' '));
      setTimeout(() => this._handleBattleVictory(false), 500);
      return;
    }

    // 3. 敌方行动
    if (b.enemyStatus.stun > 0) {
      b.enemyStatus.stun -= 1;
      logs.push(`${b.enemy.name}陷入眩晕，无法行动！`);
    } else {
      this.setData({ 'battleVfx.enemyAnim': 'lunge-right' });
      setTimeout(() => this.setData({ 'battleVfx.enemyAnim': '' }), 240);
      let raw = Math.max(4, Math.round((b.enemy.atk || 12) - stats.def * 0.55));
      const red = clamp(stats.dmgReduce + (b.heroDmgReduceTurns > 0 ? 0.3 : 0), 0, 0.78);
      raw = Math.max(2, Math.round(raw * (1 - red)));
      if (b.heroShield > 0) {
        const absorbed = Math.min(b.heroShield, raw);
        b.heroShield -= absorbed;
        raw -= absorbed;
      }
      this.state.hp = Math.max(0, this.state.hp - raw);
      sfx.playCombatSfx('martial', raw >= 24);
      this._showDmgFloat(false, `-${raw}`, 'enemy-hit');
      logs.push(`${b.enemy.name}反击造成 ${raw} 点伤害！`);
    }

    // 回合末回息与状态递减
    if (b.enemyStatus.defDown > 0) b.enemyStatus.defDown -= 1;
    if (b.heroDmgReduceTurns > 0) b.heroDmgReduceTurns -= 1;
    if (b.heroAtkBuffTurns > 0) b.heroAtkBuffTurns -= 1;
    if (stats.mpRegen > 0) {
      this.state.energy = Math.min(stats.maxEnergy, this.state.energy + stats.mpRegen);
    }

    b.turn += 1;
    b.busy = false;
    this._syncBattleView(logs.slice(-2).join(' '));

    if (this.state.hp <= 0) {
      setTimeout(() => this._handleBattleDefeat(), 500);
    }
  },

  _handleBattleVictory(captured = false) {
    const b = this.battleRuntime;
    if (!b) return;
    const en = b.enemy;
    const s = this.state;
    const stats = this.getHeroStats();
    const map = MAPS_BY_ID[s.mapId] || MAPS_BY_ID.town;
    const regionIdx = getRegionTierIndex(map);

    s.stats.battleWin = (s.stats.battleWin || 0) + 1;
    if (['heavy_mech', 'auto_turret', 'flame_mech', 'mech_taotie'].includes(en.id)) {
      s.stats.defeatHeavy = (s.stats.defeatHeavy || 0) + 1;
    }

    const expGain = captured ? Math.round((en.exp || 24) * 0.65) : (en.exp || 24);
    const goldGain = captured ? Math.round((en.gold || 30) * 0.65) : (en.gold || 30);
    s.gold += goldGain;
    this.gainExp(expGain);

    if (b.worldEnemy) {
      b.worldEnemy.alive = false;
      b.worldEnemy.defeated = true;
      b.worldEnemy.respawnTimer = en.isBoss ? 120 : 45;
    }

    const dropList = [];
    if (en.isBoss) {
      if (!s.defeatedBosses.includes(en.id)) s.defeatedBosses.push(en.id);
      if (en.dropSpiritId) {
        s.capturedSpirits[en.dropSpiritId] = (s.capturedSpirits[en.dropSpiritId] || 0) + 1;
      }
      this.advanceQuestTrigger(`defeat_${en.id}`);
      if (en.id === 'boss_ratking') this.unlockStoryRelic(0);
      if (en.id === 'boss_duangang') this.unlockStoryRelic(2);
      if (en.id === 'boss_zhurong') this.unlockStoryRelic(3);
      if (en.id === 'boss_lotus_bane') this.unlockStoryRelic(4);
      if (en.id === 'boss_tianshu') this.advanceQuestTrigger('trigger_ending');

      // 1. Boss 100% 必掉高阶暗黑词缀装备（2–3 强力词缀）
      const bossPool = {
        boss_ratking: ['wpn_inkblade', 'armor_ironwire', 'mech_steam_core'],
        boss_duangang: ['wpn_shotgun', 'wpn_qingcheng', 'wpn_sniper'],
        boss_zhurong: ['wpn_gatling', 'mech_crimson_frame', 'wpn_pulsesword'],
        boss_lotus_bane: ['relic_fox_orb', 'armor_exo', 'wpn_plasma_rifle'],
        boss_tianshu: ['wpn_xuanyuan', 'mech_tianshu_exo', 'relic_tianshu']
      }[en.id] || (REGION_EQUIP_POOLS[regionIdx] || ['wpn_qingcheng']);

      const isMidLateBoss = ['boss_zhurong', 'boss_lotus_bane', 'boss_tianshu'].includes(en.id);
      const bossQuality = en.isFinalBoss
        ? 'legend'
        : en.id === 'boss_lotus_bane'
          ? (Math.random() < 0.7 ? 'legend' : 'rare')
          : en.id === 'boss_zhurong'
            ? (Math.random() < 0.5 ? 'legend' : 'rare')
            : 'rare';
      const eq = rollBossTierEquipment(
        bossPool[Math.floor(Math.random() * bossPool.length)],
        bossQuality,
        bossQuality === 'legend' || isMidLateBoss
      );
      if (eq) {
        s.equipBag.push(eq);
        dropList.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
      }

      // 2. Boss 100% 必掉 1–2 件稀有锻造材料 / 稀世丹药
      const rareMatId = BOSS_RARE_MATS[Math.floor(Math.random() * BOSS_RARE_MATS.length)];
      const matRes = grantItemToStateBagOrGold(s, rareMatId, 'rare', stats.bagMax);
      if (matRes) dropList.push(matRes.label);

      if (Math.random() < 0.65) {
        s.elixirs.elixir_jiuzhuan = (s.elixirs.elixir_jiuzhuan || 0) + 1;
        dropList.push(`稀世丹药·${(ELIXIRS.elixir_jiuzhuan && ELIXIRS.elixir_jiuzhuan.name) || '九转青瘴丹'}`);
      } else {
        const rareMatId2 = BOSS_RARE_MATS[Math.floor(Math.random() * BOSS_RARE_MATS.length)];
        const matRes2 = grantItemToStateBagOrGold(s, rareMatId2, 'rare', stats.bagMax);
        if (matRes2) dropList.push(matRes2.label);
      }
    } else {
      // 普通怪物：~65% 概率掉落 1–2 件区域废土材料/科技件/草药/补给
      if (Math.random() < 0.65) {
        const mPool = REGION_MONSTER_DROPS[regionIdx] || REGION_MONSTER_DROPS[0];
        const count = Math.random() < 0.42 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const itemId = mPool[Math.floor(Math.random() * mPool.length)];
          const r = Math.random();
          const iq = r < 0.04 ? 'legend' : r < 0.16 ? 'rare' : r < 0.45 ? 'fine' : 'common';
          const res = grantItemToStateBagOrGold(s, itemId, iq, stats.bagMax);
          if (res) dropList.push(res.label);
        }
      }

      // 普通怪物：~30% 概率掉落区域匹配暗黑词缀装备
      if (!captured && Math.random() < 0.30) {
        const eqPool = REGION_EQUIP_POOLS[regionIdx] || REGION_EQUIP_POOLS[0];
        const pick = eqPool[Math.floor(Math.random() * eqPool.length)];
        const eq = rollEquipment(pick, rollMonsterEquipQuality(regionIdx));
        if (eq) {
          s.equipBag.push(eq);
          dropList.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
        }
      }
    }

    const dropSuffix = dropList.length ? ` 战利品：${dropList.join('、')}` : '';
    this.showToast(
      captured
        ? `成功收服【${en.spiritName || en.name}】！+${expGain}修为 +${goldGain}币${dropSuffix}`
        : `击败【${en.name}】！+${expGain}修为 +${goldGain}币${dropSuffix}`,
      'success'
    );
    this._closeBattle();
    this.syncHUD();
    this.scheduleSave();
  },

  _handleBattleDefeat() {
    const stats = this.getHeroStats();
    this.state.hp = Math.round(stats.maxHp * 0.5);
    this.state.energy = Math.round(stats.maxEnergy * 0.5);
    this.state.gold = Math.max(0, Math.round(this.state.gold * 0.85));
    this.showToast('重伤撤回墨石镇医馆休养（损失少量废土币）。', 'warn');
    this._closeBattle();
    this.enterMap('town', 780, 615);
  },

  _closeBattle() {
    this.battleRuntime = null;
    this.setData({ inBattle: false, battleSubMode: '', captureAnim: { active: false, caption: '' } });
    if (this.world) {
      if (typeof this.world.setEncounterCooldown === 'function') {
        this.world.setEncounterCooldown(2.0);
      }
      if (!this.data.activeModal && !this.data.dialog.open) {
        if (typeof this.world.setPaused === 'function') this.world.setPaused(false);
        else this.world.paused = false;
      }
    }
  },

  // ==================== 全屏无框手绘殿堂调度 ====================
  openModal(e) {
    const name = e.currentTarget.dataset.modal;
    this.openModalByName(name);
  },

  openModalByName(name) {
    if (!name || this.data.inBattle) return;
    const meta = MODAL_META[name] || { seal: '卷', title: '墨土卷轴', sub: '' };
    if (this.world) this.world.paused = true;
    sfx.uiTick();
    this.setData({
      activeModal: name,
      modalSeal: meta.seal,
      modalTitle: meta.title,
      modalSub: meta.sub
    });
    if (name === 'crucible') this._refreshCrucibleView();
    else if (name === 'worldmap') this._refreshWorldMapView();
    else if (name === 'bag') this._refreshBagView();
    else if (name === 'skills') this._refreshSkillsView();
    else if (name === 'quests') this._refreshQuestsView();
    else if (name === 'shop') this._refreshShopView();
    else if (name === 'disassemble') this._refreshDisView();
    else if (name === 'save') this._refreshSaveView();
    else if (name === 'settings') this._refreshSettingsView();
  },

  closeModal() {
    sfx.uiTick();
    this.setData({ activeModal: '' });
    if (this.world && !this.data.inBattle && !this.data.dialog.open) {
      this.world.paused = false;
    }
  },

  // ==================== 1. 天工墨壶 ====================
  onCrucibleTab(e) {
    this.setData({ crucibleTab: e.currentTarget.dataset.tab });
    this._refreshCrucibleView();
  },

  onCrucibleFilter(e) {
    this.setData({ crucibleFilter: e.currentTarget.dataset.filter });
    this._refreshCrucibleView();
  },

  _buildCruciblePool() {
    const s = this.state;
    const pool = [];
    Object.entries(s.capturedSpirits || {}).forEach(([eid, count]) => {
      if (count > 0 && ENEMIES[eid]) {
        const en = ENEMIES[eid];
        pool.push({
          key: `spirit:${eid}`, kind: 'spirit', id: eid, category: 'spirit',
          name: en.spiritName || en.name, count, countText: `×${count}`,
          elem: getCrucibleElement({ kind: 'spirit', id: eid }),
          color: '#5eead4', imgSrc: getSpriteForEnemy(en.spriteType)
        });
      }
    });
    const itemCounts = {};
    s.bag.forEach((b) => {
      const it = ITEMS[b.itemId];
      if (!it || it.isStory || it.isCollection) return;
      itemCounts[b.itemId] = (itemCounts[b.itemId] || 0) + 1;
    });
    Object.entries(itemCounts).forEach(([id, count]) => {
      const it = ITEMS[Number(id)];
      const coords = getItemCoords(id);
      pool.push({
        key: `item:${id}`, kind: 'item', id: Number(id), category: 'material',
        name: it.name, count, countText: `×${count}`,
        elem: getCrucibleElement({ kind: 'item', id: Number(id) }),
        color: '#f3e8d2', sheet: '/assets/icons_items.png', col: coords[0], row: coords[1]
      });
    });
    s.equipBag.forEach((eq) => {
      const coords = getGearCoords(eq);
      pool.push({
        key: `equip:${eq.uid}`, kind: 'equip', id: eq.id, uid: eq.uid, eq, category: 'equip',
        name: eq.name, count: 1, countText: '装备',
        elem: getCrucibleElement({ kind: 'equip', id: eq.id, eq }),
        color: (QUALITY[eq.quality] && QUALITY[eq.quality].color) || '#d49a3a',
        sheet: '/assets/icons_gear.png', col: coords[0], row: coords[1]
      });
    });
    return pool;
  },

  _findRecipeMatch(a, b) {
    if (!a || !b) return null;
    const na = { kind: a.kind === 'equip' ? 'item' : a.kind, id: a.id };
    const nb = { kind: b.kind === 'equip' ? 'item' : b.kind, id: b.id };
    return RECIPES.find((r) =>
      (r.matA.kind === na.kind && r.matA.id === na.id && r.matB.kind === nb.kind && r.matB.id === nb.id) ||
      (r.matA.kind === nb.kind && r.matA.id === nb.id && r.matB.kind === na.kind && r.matB.id === na.id)
    ) || null;
  },

  _refreshCrucibleView() {
    const allPool = this._buildCruciblePool();
    const filter = this.data.crucibleFilter;
    const selectedKeys = this.crucibleSlots.filter(Boolean).map((x) => x.key);
    const pool = allPool
      .filter((p) => filter === 'all' || p.category === filter)
      .map((p) => ({ ...p, selected: selectedKeys.includes(p.key) }));

    const [slotA, slotB] = this.crucibleSlots;
    const match = this._findRecipeMatch(slotA, slotB);
    const omen = getWuXingOmen(slotA, slotB, match);

    const gList = Object.values(GUARDIANS).map((g) => ({
      ...g,
      sprite: getSpriteForGuardian(g.id),
      color: (QUALITY[g.quality] && QUALITY[g.quality].color) || '#d49a3a',
      unlocked: this.state.unlockedGuardians.includes(g.id),
      active: this.state.activeGuardianId === g.id
    }));

    const hasMat = (m) => {
      if (m.kind === 'spirit') return (this.state.capturedSpirits[m.id] || 0) > 0;
      return this.state.bag.some((b) => b.itemId === m.id);
    };
    const matName = (m) => (m.kind === 'spirit' ? (ENEMIES[m.id]?.spiritName || ENEMIES[m.id]?.name || m.id) : (ITEMS[m.id]?.name || m.id));
    const recipesView = RECIPES.map((r) => ({
      id: r.id,
      name: r.name,
      desc: r.desc,
      color: (QUALITY[r.quality] && QUALITY[r.quality].color) || '#d49a3a',
      typeLabel: r.resultType === 'guardian' ? '护驾' : r.resultType === 'elixir' ? '灵丹' : '神兵',
      formula: `${matName(r.matA)} + ${matName(r.matB)}`,
      canQuickFill: hasMat(r.matA) && hasMat(r.matB)
    }));

    this.setData({
      crucibleView: { slotA, slotB, omen, matchName: match ? match.name : '', canFuse: Boolean(slotA && slotB), pool },
      guardiansView: { unlockedCount: this.state.unlockedGuardians.length, list: gList },
      recipesView
    });
  },

  onPickCrucibleEntry(e) {
    const key = e.currentTarget.dataset.key;
    const entry = this._buildCruciblePool().find((p) => p.key === key);
    if (!entry) return;
    if (!this.crucibleSlots[0]) this.crucibleSlots[0] = entry;
    else if (!this.crucibleSlots[1]) {
      if (this.crucibleSlots[0].key === entry.key && entry.count < 2) {
        this.showToast('同类素材仅余 1 份，请另选一味！', 'warn');
        return;
      }
      this.crucibleSlots[1] = entry;
    } else {
      this.crucibleSlots[0] = this.crucibleSlots[1];
      this.crucibleSlots[1] = entry;
    }
    sfx.uiTick();
    this._refreshCrucibleView();
  },

  onClearCrucibleSlot(e) {
    const idx = Number(e.currentTarget.dataset.slot);
    this.crucibleSlots[idx] = null;
    this._refreshCrucibleView();
  },

  onQuickFillRecipe(e) {
    const r = RECIPES.find((x) => x.id === e.currentTarget.dataset.id);
    if (!r) return;
    const pool = this._buildCruciblePool();
    const a = pool.find((p) => p.kind === r.matA.kind && p.id === r.matA.id);
    const b = pool.find((p) => p.kind === r.matB.kind && p.id === r.matB.id);
    if (!a || !b) {
      this.showToast('尚缺丹方所需素材！', 'warn');
      return;
    }
    this.crucibleSlots = [a, b];
    this.setData({ crucibleTab: 'forge' });
    this._refreshCrucibleView();
  },

  onExecuteFuse() {
    const [a, b] = this.crucibleSlots;
    if (!a || !b) return;
    const consume = (slot) => {
      if (slot.kind === 'spirit') {
        this.state.capturedSpirits[slot.id] = Math.max(0, (this.state.capturedSpirits[slot.id] || 0) - 1);
      } else if (slot.kind === 'equip') {
        const i = this.state.equipBag.findIndex((x) => x.uid === slot.uid);
        if (i >= 0) this.state.equipBag.splice(i, 1);
      } else {
        const i = this.state.bag.findIndex((x) => x.itemId === slot.id);
        if (i >= 0) this.state.bag.splice(i, 1);
      }
    };
    consume(a);
    consume(b);

    const res = dynamicFuse(
      { kind: a.kind === 'equip' ? 'item' : a.kind, id: a.id },
      { kind: b.kind === 'equip' ? 'item' : b.kind, id: b.id }
    );
    this.state.stats.fuse = (this.state.stats.fuse || 0) + 1;
    this.crucibleSlots = [null, null];
    sfx.ending();

    if (res.resultType === 'guardian') {
      const g = GUARDIANS[res.resultId];
      if (!this.state.unlockedGuardians.includes(res.resultId)) this.state.unlockedGuardians.push(res.resultId);
      if (!this.state.activeGuardianId) {
        this.state.activeGuardianId = res.resultId;
        if (this.world && typeof this.world.setActiveGuardian === 'function') this.world.setActiveGuardian(res.resultId);
      }
      this.showToast(`炼化成功！护驾灵兽【${g ? g.name : res.resultId}】现世！`, 'success');
    } else if (res.resultType === 'elixir') {
      this.state.elixirs[res.resultId] = (this.state.elixirs[res.resultId] || 0) + 1;
      const elx = ELIXIRS[res.resultId];
      this.showToast(`炼成稀世灵丹【${elx ? elx.name : res.resultId}】！`, 'success');
    } else if (res.item) {
      this.state.equipBag.push(res.item);
      this.showToast(`铸成异纹神兵【${res.item.name}】！`, 'success');
    }

    this.syncHUD();
    this.scheduleSave();
    this._refreshCrucibleView();
  },

  onToggleGuardian(e) {
    const id = e.currentTarget.dataset.id;
    if (!this.state.unlockedGuardians.includes(id)) return;
    this.state.activeGuardianId = this.state.activeGuardianId === id ? null : id;
    if (this.world && typeof this.world.setActiveGuardian === 'function') {
      this.world.setActiveGuardian(this.state.activeGuardianId);
    }
    sfx.uiTick();
    this.syncHUD();
    this.scheduleSave();
    this._refreshCrucibleView();
  },

  // ==================== 2. 天下舆图 ====================
  _refreshWorldMapView() {
    const curMap = MAPS_BY_ID[this.state.mapId] || MAPS_BY_ID.town;
    const selId = this.selectedWorldRegionId || curMap.regionId || 'reg_town';
    const regions = REGIONS.map((r) => ({
      ...r,
      unlocked: this.state.unlockedRegions.includes(r.id),
      isCurrent: curMap.regionId === r.id
    }));
    const sel = regions.find((r) => r.id === selId) || regions[0];
    const w = WEATHERS[this.state.regionWeathers[sel.id] || 0] || WEATHERS[0];
    const subMaps = (sel.maps || []).map((mid) => {
      const m = MAPS_BY_ID[mid];
      if (!m) return null;
      return {
        id: m.id,
        name: m.name,
        kindLabel: m.isInterior ? '室内' : m.isCave ? '密窟' : '大境',
        isCurrent: this.state.mapId === m.id
      };
    }).filter(Boolean);

    this.setData({
      worldMapView: {
        selectedRegionId: sel.id,
        regions,
        selected: { ...sel, weatherName: w.name },
        subMaps
      }
    });
  },

  onSelectWorldRegion(e) {
    this.selectedWorldRegionId = e.currentTarget.dataset.id;
    sfx.uiTick();
    this._refreshWorldMapView();
  },

  onUnlockRegion(e) {
    const id = e.currentTarget.dataset.id;
    const reg = REGIONS.find((r) => r.id === id);
    if (!reg) return;
    if (this.state.gold < reg.unlockCost) {
      this.showToast(`废土币不足 ${reg.unlockCost}！`, 'warn');
      return;
    }
    this.state.gold -= reg.unlockCost;
    if (!this.state.unlockedRegions.includes(id)) this.state.unlockedRegions.push(id);
    sfx.ending();
    this.showToast(`已打通前往【${reg.name}】的驿路！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshWorldMapView();
  },

  onTravelToMap(e) {
    const mid = e.currentTarget.dataset.id;
    this.closeModal();
    this.enterMap(mid);
  },

  // ==================== 3. 行囊与异纹神兵 ====================
  onBagTab(e) {
    this.setData({ bagTab: e.currentTarget.dataset.tab });
    this._refreshBagView();
  },

  _refreshBagView() {
    const s = this.state;
    const stats = this.getHeroStats();
    const equipped = {};
    ['weapon', 'armor', 'mech', 'relic'].forEach((slot) => {
      const eq = s.equipped[slot];
      if (eq) {
        const coords = getGearCoords(eq);
        equipped[slot] = { ...eq, col: coords[0], row: coords[1], color: (QUALITY[eq.quality] && QUALITY[eq.quality].color) || '#d49a3a' };
      } else {
        equipped[slot] = null;
      }
    });
    const equipBag = s.equipBag.map((eq) => {
      const coords = getGearCoords(eq);
      const parts = [];
      if (eq.atk) parts.push(`攻+${eq.atk}`);
      if (eq.def) parts.push(`防+${eq.def}`);
      if (eq.maxHp) parts.push(`血+${eq.maxHp}`);
      if (eq.crit) parts.push(`暴+${Math.round(eq.crit * 100)}%`);
      return {
        ...eq, col: coords[0], row: coords[1],
        color: (QUALITY[eq.quality] && QUALITY[eq.quality].color) || '#d49a3a',
        slotLabel: SLOT_NAMES[eq.slot] || '神兵',
        statLine: parts.join(' · ') || eq.desc,
        sellPrice: this.getEquipSellPrice(eq)
      };
    });
    const items = s.bag.map((b) => {
      const it = ITEMS[b.itemId];
      const q = QUALITY[b.quality] || QUALITY.common;
      const coords = getItemCoords(b.itemId);
      return {
        uid: b.uid, itemId: b.itemId, name: it.name, desc: it.desc,
        qName: q.name, color: q.color, col: coords[0], row: coords[1],
        isConsumable: Boolean(it.isConsumable),
        sellPrice: this.getSellPrice(b)
      };
    });
    const elixirs = Object.entries(s.elixirs || {})
      .filter(([, cnt]) => cnt > 0)
      .map(([id, count]) => {
        const elx = ELIXIRS[id];
        const coords = id === 'elixir_ration' ? [2, 2] : [0, 3];
        return {
          id, name: elx.name, desc: elx.desc, count,
          color: (QUALITY[elx.quality] && QUALITY[elx.quality].color) || '#5eead4',
          col: coords[0], row: coords[1]
        };
      });

    this.setData({
      bagView: {
        equipped,
        stats: { atk: stats.atk, def: stats.def, critPct: Math.round(stats.crit * 100), penPct: Math.round(stats.armorPen * 100) },
        equipBag, items, elixirs
      }
    });
  },

  onEquipFromBag(e) {
    const uid = e.currentTarget.dataset.uid;
    const idx = this.state.equipBag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const eq = this.state.equipBag.splice(idx, 1)[0];
    const prev = this.state.equipped[eq.slot];
    if (prev) this.state.equipBag.push(prev);
    this.state.equipped[eq.slot] = eq;
    sfx.pick(eq.quality);
    this.showToast(`已佩带【${eq.name}】！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshBagView();
  },

  onUnequipSlot(e) {
    const slot = e.currentTarget.dataset.slot;
    const eq = this.state.equipped[slot];
    if (!eq) return;
    this.state.equipped[slot] = null;
    this.state.equipBag.push(eq);
    sfx.uiTick();
    this.syncHUD();
    this.scheduleSave();
    this._refreshBagView();
  },

  onSellEquip(e) {
    const uid = e.currentTarget.dataset.uid;
    const idx = this.state.equipBag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const eq = this.state.equipBag.splice(idx, 1)[0];
    const price = this.getEquipSellPrice(eq);
    this.state.gold += price;
    sfx.coin();
    this.showToast(`售出【${eq.name}】得 ${price} 废土币！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshBagView();
  },

  onUseBagItem(e) {
    const uid = e.currentTarget.dataset.uid;
    const idx = this.state.bag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const entry = this.state.bag.splice(idx, 1)[0];
    const it = ITEMS[entry.itemId];
    const stats = this.getHeroStats();
    if (it && it.effect) {
      if (it.effect.hp) this.state.hp = Math.min(stats.maxHp, this.state.hp + it.effect.hp);
      if (it.effect.energy) this.state.energy = Math.min(stats.maxEnergy, this.state.energy + it.effect.energy);
      if (it.effect.food) this.state.food = Math.min(100, this.state.food + it.effect.food);
      if (it.effect.radShield) this.state.radShield += it.effect.radShield;
      if (it.effect.clearWarn) this.state.warn = 0;
    }
    sfx.pick('fine');
    this.showToast(`使用了【${it.name}】！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshBagView();
  },

  onSellBagItem(e) {
    const uid = e.currentTarget.dataset.uid;
    const idx = this.state.bag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const entry = this.state.bag.splice(idx, 1)[0];
    const price = this.getSellPrice(entry);
    this.state.gold += price;
    sfx.coin();
    this.syncHUD();
    this.scheduleSave();
    this._refreshBagView();
  },

  _sellAllTrash(mult = 1) {
    let earned = 0;
    const keep = [];
    this.state.bag.forEach((b) => {
      const it = ITEMS[b.itemId];
      if (!it || it.isConsumable || it.isStory || it.isCollection) keep.push(b);
      else earned += this.getSellPrice(b, mult);
    });
    this.state.bag = keep;
    this.state.gold += earned;
    this.state.stats.sellGold = (this.state.stats.sellGold || 0) + earned;
    if (earned > 0) sfx.coin();
    return earned;
  },

  onSellAllTrash() {
    const earned = this._sellAllTrash(1);
    this.showToast(earned > 0 ? `一键售出废品获 ${earned} 废土币！` : '行囊中暂无可售废品。', earned > 0 ? 'success' : 'info');
    this.syncHUD();
    this.scheduleSave();
    if (this.data.activeModal === 'bag') this._refreshBagView();
  },

  onUseElixir(e) {
    const id = e.currentTarget.dataset.id;
    const elx = ELIXIRS[id];
    if (!elx || !(this.state.elixirs[id] > 0)) return;
    this.state.elixirs[id] -= 1;
    const stats = this.getHeroStats();
    if (elx.effect.hp) this.state.hp = Math.min(stats.maxHp, this.state.hp + elx.effect.hp);
    if (elx.effect.energy) this.state.energy = Math.min(stats.maxEnergy, this.state.energy + elx.effect.energy);
    if (elx.effect.food) this.state.food = Math.min(100, this.state.food + elx.effect.food);
    if (elx.effect.radShield) this.state.radShield += elx.effect.radShield;
    sfx.pick('rare');
    this.showToast(`服下【${elx.name}】，元气饱满！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshBagView();
  },

  // ==================== 4. 武学奇术阁 ====================
  onSkillsTab(e) {
    this.setData({ skillsTab: e.currentTarget.dataset.tab });
    this._refreshSkillsView();
  },

  _refreshSkillsView() {
    const passive = SKILLS.map((sk) => {
      const lv = this.state.skills[sk.id] || 0;
      const nextCost = sk.cost[lv] || 99;
      return { ...sk, lv, nextCost, canUpgrade: lv < sk.maxLevel && this.state.skillPoints >= nextCost };
    });
    const combat = COMBAT_SKILLS.map((sk) => {
      const coords = SKILL_ICON_COORDS[sk.id] || [0, 0];
      return { ...sk, col: coords[0], row: coords[1], unlocked: this.state.level >= sk.unlockLv };
    });
    this.setData({ skillsView: { passive, combat } });
  },

  onUpgradePassiveSkill(e) {
    const id = Number(e.currentTarget.dataset.id);
    const sk = SKILLS[id];
    if (!sk) return;
    const lv = this.state.skills[id] || 0;
    const cost = sk.cost[lv];
    if (lv >= sk.maxLevel || this.state.skillPoints < cost) {
      this.showToast('修为点不足！', 'warn');
      return;
    }
    this.state.skillPoints -= cost;
    this.state.skills[id] = lv + 1;
    sfx.ending();
    this.showToast(`【${sk.name}】精进至 Lv.${lv + 1}！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshSkillsView();
  },

  // ==================== 5. 主线支线与残卷古董 ====================
  onQuestTab(e) {
    this.setData({ questTab: e.currentTarget.dataset.tab });
    this._refreshQuestsView();
  },

  _getSideQuestProgress(sq) {
    const st = this.state.stats || {};
    if (sq.targetType === 'pick') return st.pick || 0;
    if (sq.targetType === 'salvage_heavy') return st.salvageHeavy || 0;
    if (sq.targetType === 'battle_win') return st.battleWin || 0;
    if (sq.targetType === 'capture') return st.capture || 0;
    if (sq.targetType === 'defeat_heavy') return st.defeatHeavy || 0;
    if (sq.targetType === 'fuse') return st.fuse || 0;
    if (sq.targetType === 'collect_antique') return this.state.collections.length;
    return 0;
  },

  _refreshQuestsView() {
    const s = this.state;
    const acts = MAIN_QUESTS.map((act) => ({
      ...act,
      done: s.completedActs.includes(act.id),
      steps: act.steps.map((st) => ({ ...st, done: s.completedSteps.includes(st.id) }))
    }));
    const side = SIDE_QUESTS.map((sq) => {
      const progress = Math.min(sq.targetCount, this._getSideQuestProgress(sq));
      const claimed = s.claimedSideQuests.includes(sq.id);
      return { ...sq, progress, claimed, canClaim: !claimed && progress >= sq.targetCount };
    });
    const stories = STORY_CHAPTERS.map((ch) => ({ ...ch, unlocked: s.stories.includes(ch.id) }));
    const canEnding = s.defeatedBosses.includes('boss_tianshu') || s.gold >= 15000 || s.collections.length >= 8;

    this.setData({
      questsView: { acts, side, stories, storiesCount: s.stories.length, collectionsCount: s.collections.length, canEnding }
    });
  },

  onClaimSideQuest(e) {
    const id = e.currentTarget.dataset.id;
    const sq = SIDE_QUESTS.find((x) => x.id === id);
    if (!sq || this.state.claimedSideQuests.includes(id)) return;
    if (this._getSideQuestProgress(sq) < sq.targetCount) return;
    this.state.claimedSideQuests.push(id);
    this.state.gold += sq.rewardGold || 0;
    this.state.skillPoints += sq.rewardSp || 0;
    if (sq.rewardEquip) {
      const eq = rollEquipment(sq.rewardEquip);
      if (eq) this.state.equipBag.push(eq);
    }
    sfx.ending();
    this.showToast(`支线【${sq.name}】领赏成功！`, 'success');
    this.syncHUD();
    this.scheduleSave();
    this._refreshQuestsView();
  },

  openEndingModal() {
    const s = this.state;
    let key = 'normal';
    if (s.defeatedBosses.includes('boss_tianshu') && s.stories.length >= 5 && s.collections.length >= 8) key = 'king';
    else if (s.collections.length >= 8) key = 'collector';
    else if (s.defeatedBosses.includes('boss_tianshu') && s.stories.length >= 4) key = 'friend';
    if (!s.endingsUnlocked.includes(key)) s.endingsUnlocked.push(key);
    this.setData({ endingView: ENDINGS[key] });
    this.openModalByName('ending');
    this.scheduleSave();
  },

  // ==================== 6-9. 杂货铺 / 医馆 / 拆解坊 / 钱庄 ====================
  _refreshShopView() {
    const list = SHOP_STOCK.map((s) => {
      const it = ITEMS[s.itemId];
      const coords = getItemCoords(s.itemId);
      return { itemId: s.itemId, price: s.price, name: it.name, desc: it.desc, col: coords[0], row: coords[1] };
    });
    this.setData({ shopView: list });
  },

  onBuyShopItem(e) {
    const id = Number(e.currentTarget.dataset.id);
    const price = Number(e.currentTarget.dataset.price);
    const stats = this.getHeroStats();
    if (this.state.gold < price) { this.showToast('废土币不足！', 'warn'); return; }
    if (this.state.bag.length >= stats.bagMax) { this.showToast('行囊已满！', 'warn'); return; }
    this.state.gold -= price;
    this.state.bag.push({ uid: `buy_${Date.now()}_${Math.floor(Math.random() * 9999)}`, itemId: id, quality: 'common' });
    sfx.coin();
    this.showToast(`购得【${ITEMS[id].name}】！`, 'success');
    this.syncHUD();
    this.scheduleSave();
  },

  onInnRest(e) {
    const tier = e.currentTarget.dataset.tier;
    const stats = this.getHeroStats();
    const cost = tier === 'pro' ? 120 : 40;
    if (this.state.gold < cost) { this.showToast(`废土币不足 ${cost}！`, 'warn'); return; }
    this.state.gold -= cost;
    this.state.hp = stats.maxHp;
    this.state.energy = stats.maxEnergy;
    this.state.food = tier === 'pro' ? 100 : Math.min(100, this.state.food + 50);
    if (tier === 'pro') { this.state.warn = 0; this.state.radShield += 1; }
    this.state.day += 1;
    sfx.pick('rare');
    this.showToast(tier === 'pro' ? '元气巅峰！获得 1 层抗辐射护盾！' : '气血内息已完全恢复！', 'success');
    this.syncHUD();
    this.scheduleSave();
    this.closeModal();
  },

  _refreshDisView() {
    const rate = clamp(0.62 + (this.state.skills[3] || 0) * 0.1, 0.62, 0.95);
    const list = this.state.bag.filter((b) => ITEMS[b.itemId]?.dis).map((b) => {
      const it = ITEMS[b.itemId];
      const q = QUALITY[b.quality] || QUALITY.common;
      const coords = getItemCoords(b.itemId);
      return {
        uid: b.uid, name: it.name, qName: q.name, color: q.color,
        baseVal: this.getSellPrice(b), col: coords[0], row: coords[1]
      };
    });
    this.setData({ disView: { ratePct: Math.round(rate * 100), list } });
  },

  onDisassembleItem(e) {
    const uid = e.currentTarget.dataset.uid;
    const idx = this.state.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return;
    const entry = this.state.bag.splice(idx, 1)[0];
    const baseVal = this.getSellPrice(entry);
    const rate = clamp(0.62 + (this.state.skills[3] || 0) * 0.1, 0.62, 0.95);
    this.state.stats.dis = (this.state.stats.dis || 0) + 1;
    if (Math.random() < rate) {
      const crit = Math.random() < 0.2 + (this.state.skills[5] || 0) * 0.08;
      const gain = Math.round(baseVal * (1.8 + (this.state.skills[3] || 0) * 0.2) * (crit ? 1.45 : 1));
      this.state.gold += gain;
      sfx.disassemble(true, crit);
      this.showToast(`拆解${crit ? '大暴击' : '成功'}！+${gain} 废土币！`, 'success');
    } else {
      const salvage = Math.round(baseVal * 0.35);
      this.state.gold += salvage;
      sfx.disassemble(false);
      this.showToast(`拆解失手，回收零碎铜铁 +${salvage} 币。`, 'warn');
    }
    this.syncHUD();
    this.scheduleSave();
    this._refreshDisView();
  },

  onLoanBorrow() {
    if (this.state.debt > 0) return;
    this.state.gold += 500;
    this.state.debt = 600;
    sfx.coin();
    this.showToast('借入 500 废土币，需还 600 币！', 'info');
    this.syncHUD();
    this.scheduleSave();
  },

  onLoanRepay() {
    if (this.state.debt <= 0 || this.state.gold < this.state.debt) {
      this.showToast('废土币不足以还清欠款！', 'warn');
      return;
    }
    this.state.gold -= this.state.debt;
    this.state.debt = 0;
    this.state.reputation += 1;
    sfx.coin();
    this.showToast('欠款已清，营地声望 +1！', 'success');
    this.syncHUD();
    this.scheduleSave();
  },

  // ==================== 10-11. 墨石记录碑存档 & 设置 ====================
  _refreshSaveView() {
    const seals = { auto: '自', slot_1: '壹', slot_2: '贰', slot_3: '叁' };
    const slots = storage.listSlots().map((sl) => ({
      slotId: sl.slotId,
      label: sl.label,
      seal: seals[sl.slotId] || '碑',
      isAuto: sl.slotId === 'auto',
      exists: !sl.empty,
      summary: sl.empty ? '' : `Lv.${sl.lv} · ${sl.mapName} · 第${sl.day}天 · ${sl.gold}币`,
      timeText: formatSaveTime(sl.savedAt)
    }));
    this.setData({ saveView: { slots } });
  },

  onSaveToSlot(e) {
    const slotId = e.currentTarget.dataset.slot;
    if (this.world && this.world.hero) {
      this.state.heroX = Math.round(this.world.hero.x);
      this.state.heroY = Math.round(this.world.hero.y);
    }
    storage.saveToSlot(slotId, this.state, this.getSaveMeta());
    sfx.ending();
    this.showToast('江湖足迹已刻录至墨石记录碑！', 'success');
    this._refreshSaveView();
  },

  onLoadFromSlot(e) {
    const slotId = e.currentTarget.dataset.slot;
    const raw = storage.loadFromSlot(slotId);
    if (!raw) { this.showToast('此碑位尚无记录！', 'warn'); return; }
    this.state = migrateState(raw);
    this.crucibleSlots = [null, null];
    this.closeModal();
    if (this.world && typeof this.world.loadMap === 'function') {
      this.state.openedChests = this.state.openedChests || [];
      this.world.loadMap(this.state.mapId, this.state.heroX, this.state.heroY, {
        openedChests: this.state.openedChests
      });
      if (typeof this.world.setActiveGuardian === 'function') {
        this.world.setActiveGuardian(this.state.activeGuardianId);
      }
    }
    sfx.ending();
    this.showToast('已读取墨石记录碑存档！', 'success');
    this.syncHUD();
  },

  onDeleteSlot(e) {
    const slotId = e.currentTarget.dataset.slot;
    storage.deleteSlot(slotId);
    sfx.uiTick();
    this.showToast('已抹去该碑位存档。', 'info');
    this._refreshSaveView();
  },

  _refreshSettingsView() {
    const audioSet = sfx.getSettings ? sfx.getSettings() : { muted: false };
    this.setData({
      settingsView: { soundOn: !audioSet.muted, shakeOn: this.shakeEnabled }
    });
  },

  onToggleSound() {
    sfx.toggleMute();
    this._refreshSettingsView();
  },

  onToggleShake() {
    this.shakeEnabled = !this.shakeEnabled;
    this._saveLocalSettings();
    this._refreshSettingsView();
  },

  onReplayBoot() {
    this.saveAutoNow();
    if (typeof storage.setPrologueSeen === 'function') {
      storage.setPrologueSeen(false);
    }
    wx.reLaunch({ url: '/pages/boot/boot' });
  },

  onResetGame() {
    wx.showModal({
      title: '重开周目',
      content: '确定清空当前自动进度并从第一天墨石镇重新开始吗？（手动记录碑槽位保留）',
      confirmColor: '#c44332',
      success: (res) => {
        if (!res.confirm) return;
        this.state = createInitialState();
        this.crucibleSlots = [null, null];
        this.saveAutoNow();
        this.closeModal();
        if (this.world && typeof this.world.loadMap === 'function') {
          this.world.loadMap('town', 780, 615, { openedChests: this.state.openedChests });
        }
        this.syncHUD();
        this.showToast('墨土重启，再踏废土征途！', 'info');
      }
    });
  }
});
