import {
  ASSETS,
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
  MAPS,
  MAPS_BY_ID,
  MAIN_QUESTS,
  STORY_CHAPTERS,
  COLLECTIONS,
  SKILLS,
  WEATHERS,
  ENDINGS,
  DAILY_TASK_TPL,
  WEEKLY_TASK_TPL,
  TEAM_TASK_TPL,
  SIDE_QUESTS,
  STORY_CUTSCENES,
  WORLD_LORE_ENTRIES
} from './data.js?v=30';
import { InkWorldEngine } from './rpg_world.js?v=30';
import { sfx } from './audio.js?v=30';
import { spawnFloatText } from './fx.js?v=30';
import { storage } from './storage.js?v=30';

// ==================== 常量与辅助 ====================
const SLOT_NAMES = {
  weapon: '武器',
  armor: '护甲',
  mech: '机甲核心',
  relic: '秘宝'
};

const GENRE_META = {
  wuxia:    { label: '古武', cls: 'genre-wuxia' },
  military: { label: '军火', cls: 'genre-military' },
  scifi:    { label: '科幻墨甲', cls: 'genre-scifi' },
  mythic:   { label: '仙妖秘宝', cls: 'genre-mythic' }
};

const SKILL_BRANCHES = [
  { id: 'martial', name: '古武门派' },
  { id: 'firearm', name: '现代军火' },
  { id: 'mecha',   name: '科幻墨甲' },
  { id: 'mystic',  name: '仙妖奇术' }
];

const SHOP_STOCK = [
  { itemId: 20, price: 24 },
  { itemId: 21, price: 30 },
  { itemId: 22, price: 55 },
  { itemId: 23, price: 120 },
  { itemId: 24, price: 95 }
];

const RANK_BOTS = [
  { name: '青城剑客·顾寒', level: 12, gold: 18400, score: 26500 },
  { name: '铁火工匠·莫离', level: 10, gold: 12600, score: 19200 },
  { name: '青瘴药师·苏晚', level: 8,  gold: 8400,  score: 13800 },
  { name: '废都游侠·陆九', level: 6,  gold: 4900,  score: 8600 },
  { name: '墨石新丁·阿明', level: 3,  gold: 1350,  score: 2900 }
];

const PROLOGUE_SLIDES = [
  {
    chapter: '序章 · 一',
    title: '墨尘之夜',
    text: '二十年前那个秋夜，二十一时四十七分。天枢崩裂，万家灯火在一瞬之间尽数熄灭。高楼化作枯骨，铁炮沉入焦土，唯有一场下了二十年的墨色尘风，吹醒了地底沉睡千年的山海灵脉。'
  },
  {
    chapter: '序章 · 二',
    title: '废土五域',
    text: '活下来的人，在断壁间燃起微弱的炭火，唤作「墨石镇」。镇外千里，铁锈废都、赤焰兵工、青瘴毒泽，乃至深埋地脉的 07 号避难所——残钢与妖雾共生，断剑与孤魂同行。'
  },
  {
    chapter: '序章 · 三',
    title: '青铜墨壶',
    text: '你怀中揣着一只温凉微鸣的青铜古壶，名曰「天工」。逢妖则鸣，遇刃则啸。凡世间残魂、断铁、古剑、旧械，入此一壶，阴阳相济，皆可化作护身之灵与掌中神兵。'
  },
  {
    chapter: '序章 · 四',
    title: '故人未归',
    text: '大停电那夜，挚友阿哲留下一块停在 21:47 的旧表，从此音讯杳然。风已起，壶已鸣。你推开墨石镇的残门——有些约定不必言明，活着的人，总要去废土深处讨一个回音。'
  }
];

const $ = (id) => document.getElementById(id);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getRegionById(regionId) {
  return REGIONS.find((r) => r.id === regionId) || REGIONS[0];
}

function getMapRegion(map) {
  return getRegionById(map?.regionId || 'reg_town');
}

function expForNextLevel(lv) {
  return Math.round(90 + lv * 55 + lv * lv * 12);
}

// ==================== 存档与状态初始化 ====================
function createInitialState() {
  const starterWeapon = {
    ...EQUIPMENT.wpn_inkblade,
    uid: 'starter_wpn_inkblade',
    quality: 'common',
    affixes: []
  };

  return {
    version: 3,
    prologueSeen: false,
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
    hermitLuckBuff: 0,
    dailyFreeHealDay: 0,
    warn: 0,
    tideSec: 60,
    skillPoints: 1,
    skills: [0, 0, 0, 0, 0, 0],

    // 背包物品：每条 { uid, itemId, quality }
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
    // 炼化丹药：{ elixir_jiuzhuan: n, elixir_ration: n }
    elixirs: {},
    // 装备栏与装备库
    equipped: {
      weapon: starterWeapon,
      armor: null,
      mech: null,
      relic: null
    },
    equipBag: [],

    // 墨壶收妖与护驾
    capturedSpirits: { rat: 1 }, // { enemyId: count }
    unlockedGuardians: [],
    activeGuardianId: null,

    // 解锁域与天气
    unlockedRegions: ['reg_town'],
    regionWeathers: {
      reg_town: 0,
      reg_ruins: 4,
      reg_arsenal: 3,
      reg_swamp: 1,
      reg_vault: 2
    },

    // 剧情、古董、图鉴与任务
    completedSteps: [],
    completedActs: [],
    claimedSideQuests: [],
    stories: [],
    collections: [],
    defeatedBosses: [],
    openedChests: [],
    seenEnemies: [],
    seenCutscenes: [],
    seenLore: [],
    endingsUnlocked: [],

    // 统计与日常
    stats: {
      pick: 0,
      dis: 0,
      sellGold: 0,
      battleWin: 0,
      capture: 0,
      fuse: 0,
      salvageHeavy: 0,
      defeatHeavy: 0
    },
    dailyDone: [],
    weeklyDone: false,
    teamProgress: 0,
    teamClaimed: false
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
  if (!s.equipped.weapon) s.equipped.weapon = base.equipped.weapon;
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
  s.seenCutscenes = Array.isArray(raw.seenCutscenes) ? raw.seenCutscenes.filter(Boolean) : [];
  s.seenLore = Array.isArray(raw.seenLore) ? raw.seenLore.filter(Boolean) : [];
  s.endingsUnlocked = Array.isArray(raw.endingsUnlocked) ? raw.endingsUnlocked : [];
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  s.dailyDone = Array.isArray(raw.dailyDone) ? raw.dailyDone : [];
  if (!MAPS_BY_ID[s.mapId]) s.mapId = 'town';
  let estMaxHp = 100 + (Number(s.level) || 1) * 20;
  for (const slot of ['weapon', 'armor', 'mech', 'relic']) {
    if (s.equipped[slot]?.maxHp) estMaxHp += s.equipped[slot].maxHp;
  }
  if (!Number.isFinite(s.hp) || s.hp <= 0) {
    s.hp = Math.max(1, Math.round(estMaxHp * 0.5));
  }
  return s;
}

// ==================== 全局运行时状态 ====================
let currentUser = storage.getCurrentUser();
let state = createInitialState();
let world = null;
let battle = null;
let currentDialog = null;
let modalLocked = false;
let crucibleSlots = [null, null];
let crucibleTab = 'forge';
let crucibleFilter = 'all';
let bagTab = 'equip';
let questTab = 'main';
let collectionTab = 'antiques';
let saveModalTab = 'slots';
let prologueIndex = 0;
let battleSubMode = null; // 'skills' | 'items' | null
let battleSkillBranch = 'martial';
let settingsModalTab = 'settings';
let hazardTimer = null;
let saveDebounceTimer = null;
let sceneTransitionToken = 0;
let sceneTransitionTimer = null;
let sceneBannerTimer = null;
let lastNearestTargetKey = null;

// 游戏本地偏好设置（与 audio.js 的音频设置协同持久化）
const GAME_SETTINGS_KEY = 'motu_game_settings_v1';
function loadGameSettings() {
  try {
    const raw = localStorage.getItem(GAME_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      screenShakeEnabled: parsed.screenShakeEnabled !== false
    };
  } catch {
    return { screenShakeEnabled: true };
  }
}
let gameSettings = loadGameSettings();
function saveGameSettings(patch = {}) {
  gameSettings = { ...gameSettings, ...patch };
  try {
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(gameSettings));
  } catch { /* ignore */ }
}

function getEquippedWeaponBranch() {
  const genre = state.equipped?.weapon?.genre || 'wuxia';
  if (genre === 'military') return 'firearm';
  if (genre === 'scifi') return 'mecha';
  if (genre === 'mythic') return 'mystic';
  return 'martial';
}

// ==================== 角色属性与计算 ====================
function getHeroStats() {
  const lv = state.level || 1;
  const stats = {
    maxHp: 100 + lv * 20,
    maxEnergy: 90 + lv * 10,
    atk: 14 + lv * 4 + (state.skills[4] || 0) * 6,
    def: 4 + Math.floor(lv * 1.6),
    crit: 0.08 + (state.skills[5] || 0) * 0.08,
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
    bagMax: 16 + (state.skills[2] || 0) * 3,
    moveSpeed: 220 + (state.skills[0] || 0) * 26
  };

  for (const slot of ['weapon', 'armor', 'mech', 'relic']) {
    const eq = state.equipped[slot];
    if (!eq) continue;
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
  }

  const guard = state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null;
  if (guard?.atkBonusPct) {
    stats.atk = Math.round(stats.atk * (1 + guard.atkBonusPct));
  }

  stats.crit = Math.min(0.85, stats.crit);
  stats.armorPen = Math.min(0.85, stats.armorPen);
  stats.dmgReduce = Math.min(0.65, stats.dmgReduce);
  stats.radResist = Math.min(0.85, stats.radResist);
  return stats;
}

function getSellPrice(bagEntry, bonusMult = 1) {
  const item = ITEMS[bagEntry.itemId];
  if (!item || item.baseValue <= 0) return 0;
  const qMult = QUALITY[bagEntry.quality]?.multiplier || 1;
  return Math.max(1, Math.round(item.baseValue * qMult * bonusMult));
}

function getEquipSellPrice(eq) {
  const qMult = QUALITY[eq.quality]?.multiplier || 1;
  const statVal = (eq.atk || 0) * 6 + (eq.def || 0) * 7 + (eq.maxHp || 0) * 1.2 + (eq.maxEnergy || 0) * 2;
  return Math.max(40, Math.round((80 + statVal) * (0.7 + qMult * 0.3)));
}

function getEndingProgressPct() {
  const totalSteps = MAIN_QUESTS.reduce((acc, q) => acc + q.steps.length, 0);
  const stepScore = (state.completedSteps.length / totalSteps) * 65;
  const colScore = (state.collections.length / COLLECTIONS.length) * 20;
  const storyScore = (state.stories.length / STORY_CHAPTERS.length) * 15;
  return Math.min(100, Math.round(stepScore + colScore + storyScore));
}

// ==================== 存档读写 ====================
function getSaveMeta() {
  const curMap = MAPS_BY_ID[state.mapId] || MAPS[0];
  return {
    mapName: curMap.name,
    lv: state.level,
    gold: state.gold,
    act: Math.min(5, state.completedActs.length + 1),
    savedAt: Date.now()
  };
}

function scheduleSave() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    try {
      if (world?.hero) {
        state.heroX = Math.round(world.hero.x);
        state.heroY = Math.round(world.hero.y);
      }
      storage.writeSave(currentUser, state, getSaveMeta());
    } catch { /* ignore quota error */ }
  }, 250);
}

function saveNow() {
  try {
    if (world?.hero) {
      state.heroX = Math.round(world.hero.x);
      state.heroY = Math.round(world.hero.y);
    }
    storage.writeSave(currentUser, state, getSaveMeta());
  } catch { /* ignore */ }
}

// ==================== Toast 与浮字 ====================
function showToast(text, type = 'info') {
  const box = $('toast-container');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = text;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

function floatNearHero(text, color = '#fbbf24') {
  if (!world?.canvas) return;
  const rect = world.canvas.getBoundingClientRect();
  const zoom = world.cameraZoom || 1;
  const sx = rect.left + (world.hero.x - world.cameraX) * zoom;
  const sy = rect.top + (world.hero.y - world.cameraY) * zoom - 36;
  spawnFloatText(clamp(sx, 60, window.innerWidth - 80), clamp(sy, 90, window.innerHeight - 100), text, color);
}

// ==================== HUD 更新 ====================
function getCurrentQuestSummary() {
  for (const act of MAIN_QUESTS) {
    for (const st of act.steps) {
      if (!state.completedSteps.includes(st.id)) {
        return `【第${['一', '二', '三', '四', '五'][act.act - 1]}幕】${st.title}：${st.desc}`;
      }
    }
  }
  return '【终局已成】墨土五域自由探索 · 收集全古董与护驾冲刺墨土之王！';
}

function updateHUD() {
  const stats = getHeroStats();
  state.hp = clamp(state.hp, 0, stats.maxHp);
  state.energy = clamp(state.energy, 0, stats.maxEnergy);
  state.food = clamp(state.food, 0, 100);

  const curMap = MAPS_BY_ID[state.mapId] || MAPS[0];
  const region = getMapRegion(curMap);
  const wid = state.regionWeathers[region.id] ?? curMap.weatherPool?.[0] ?? 0;
  const weather = WEATHERS[wid] || WEATHERS[0];

  const needExp = expForNextLevel(state.level);
  const expPct = clamp((state.exp / needExp) * 100, 0, 100);

  if ($('day-badge')) $('day-badge').textContent = `第${state.day}天`;
  if ($('region-name-badge')) $('region-name-badge').textContent = region.name;
  if ($('map-name-badge')) $('map-name-badge').textContent = curMap.short || curMap.name;
  if ($('weather-badge')) {
    $('weather-badge').textContent = weather.name;
    $('weather-badge').style.color = weather.color;
  }

  if ($('hud-lv')) $('hud-lv').textContent = state.level;
  if ($('bar-exp')) $('bar-exp').style.width = `${expPct}%`;

  if ($('hud-hp')) $('hud-hp').textContent = Math.round(state.hp);
  if ($('hud-hp-max')) $('hud-hp-max').textContent = stats.maxHp;
  if ($('bar-hp')) $('bar-hp').style.width = `${clamp((state.hp / stats.maxHp) * 100, 0, 100)}%`;

  if ($('hud-energy')) $('hud-energy').textContent = Math.round(state.energy);
  if ($('hud-energy-max')) $('hud-energy-max').textContent = stats.maxEnergy;
  if ($('bar-energy')) $('bar-energy').style.width = `${clamp((state.energy / stats.maxEnergy) * 100, 0, 100)}%`;

  if ($('hud-food')) $('hud-food').textContent = Math.round(state.food);
  if ($('bar-food')) $('bar-food').style.width = `${clamp(state.food, 0, 100)}%`;

  if ($('hud-gold')) $('hud-gold').textContent = state.gold.toLocaleString();
  if ($('hud-bag')) $('hud-bag').textContent = state.bag.length;
  if ($('hud-bag-max')) $('hud-bag-max').textContent = stats.bagMax;
  if ($('hud-username')) $('hud-username').textContent = currentUser;

  if ($('hud-quest')) $('hud-quest').textContent = getCurrentQuestSummary();

  const warnBadge = $('warn-badge');
  if (warnBadge) {
    if (curMap.hasWarn && state.warn > 0) {
      warnBadge.classList.remove('hidden');
      $('hud-warn').textContent = `${Math.round(state.warn)}%`;
    } else {
      warnBadge.classList.add('hidden');
    }
  }

  const tideBadge = $('tide-badge');
  if (tideBadge) {
    if (curMap.hasTide) {
      tideBadge.classList.remove('hidden');
      $('hud-tide').textContent = `${Math.max(0, Math.ceil(state.tideSec))}s`;
    } else {
      tideBadge.classList.add('hidden');
    }
  }

  const guardBadge = $('hud-guardian-badge');
  if (guardBadge) {
    const g = state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null;
    guardBadge.textContent = g ? `护驾：${g.name}` : '护驾：未出战';
  }

  if ($('hud-ending-pct')) $('hud-ending-pct').textContent = `${getEndingProgressPct()}%`;
}

// ==================== 经验、升级与任务推进 ====================
function gainExp(amount) {
  if (!amount || amount <= 0) return;
  state.exp += amount;
  let leveled = false;
  while (state.exp >= expForNextLevel(state.level)) {
    state.exp -= expForNextLevel(state.level);
    state.level += 1;
    state.skillPoints += 1;
    leveled = true;
  }
  if (leveled) {
    const stats = getHeroStats();
    state.hp = stats.maxHp;
    state.energy = stats.maxEnergy;
    sfx.ending();
    showToast(`修为突破至 Lv.${state.level}！气血内息全满，获得 +1 修为点！`, 'success');
    floatNearHero(`升级 Lv.${state.level}!`, '#f3ce7a');
  }
}

function advanceQuestTrigger(triggerName) {
  let changed = false;
  for (const act of MAIN_QUESTS) {
    for (const step of act.steps) {
      if (step.trigger === triggerName && !state.completedSteps.includes(step.id)) {
        state.completedSteps.push(step.id);
        changed = true;
        showToast(`主线推进：【${step.title}】完成！`, 'success');
      }
    }
    const allDone = act.steps.every((st) => state.completedSteps.includes(st.id));
    if (allDone && !state.completedActs.includes(act.id)) {
      state.completedActs.push(act.id);
      if (act.reward?.exp) gainExp(act.reward.exp);
      if (act.reward?.gold) state.gold += act.reward.gold;
      if (act.reward?.unlockRegion && !state.unlockedRegions.includes(act.reward.unlockRegion)) {
        state.unlockedRegions.push(act.reward.unlockRegion);
        const reg = getRegionById(act.reward.unlockRegion);
        showToast(`${act.title} 完结！解锁新域「${reg.name}」！`, 'success');
      } else {
        showToast(`${act.title} 完结！获赏 ${act.reward?.gold || 0} 废土币！`, 'success');
      }
      sfx.ending();
    }
  }
  if (changed) {
    updateHUD();
    scheduleSave();
  }
}

function unlockStoryRelic(storyId) {
  if (storyId === undefined || storyId === null) return false;
  if (!state.stories.includes(storyId)) {
    state.stories.push(storyId);
    const ch = STORY_CHAPTERS.find((c) => c.id === storyId);
    if (ch) {
      showToast(`解锁剧情章节：${ch.title}！`, 'success');
    }
    advanceQuestTrigger(`get_story_${storyId}`);
    return true;
  }
  return false;
}

function unlockCollection(colId) {
  if (colId === undefined || colId === null) return false;
  if (!state.collections.includes(colId)) {
    state.collections.push(colId);
    const c = COLLECTIONS.find((x) => x.id === colId);
    if (c) {
      showToast(`收录战前古董：【${c.name}】！`, 'success');
      sfx.pick('legend');
    }
    return true;
  }
  return false;
}

function grantUncollectedAntique() {
  const missing = COLLECTIONS.filter((c) => !state.collections.includes(c.id));
  if (!missing.length) return null;
  const pick = missing[Math.floor(Math.random() * missing.length)];
  return unlockCollection(pick.id) ? pick : null;
}

function addEquipmentToBag(eq) {
  if (!eq) return;
  state.equipBag.unshift(eq);
  if (state.equipBag.length > 48) {
    state.equipBag.pop();
  }
}

function getSideQuestProgress(sq) {
  switch (sq.targetType) {
    case 'pick': return state.stats.pick || 0;
    case 'salvage_heavy': return state.stats.salvageHeavy || 0;
    case 'battle_win': return state.stats.battleWin || 0;
    case 'capture': return state.stats.capture || 0;
    case 'defeat_heavy': return state.stats.defeatHeavy || 0;
    case 'fuse': return state.stats.fuse || 0;
    case 'collect_antique': return state.collections.length;
    default: return 0;
  }
}

// ==================== 2.5D 世界与 21 图无缝切换 ====================
function syncWorldAppearance() {
  if (!world) return;
  const g = state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null;
  world.setGuardian(g);
  world.setHeroWeapon(state.equipped.weapon?.weaponType || 'blade');
}

function isRegionUnlocked(regionId) {
  return state.unlockedRegions.includes(regionId);
}

function tryUnlockRegion(regionId, silent = false) {
  if (isRegionUnlocked(regionId)) return true;
  const reg = getRegionById(regionId);
  if (!reg) return false;
  if (state.gold < reg.unlockCost) {
    if (!silent) {
      showToast(`前往「${reg.name}」需路引经费 ${reg.unlockCost} 废土币（当前 ${state.gold}），或推进主线解锁！`, 'warn');
    }
    return false;
  }
  state.gold -= reg.unlockCost;
  state.unlockedRegions.push(regionId);
  sfx.coin();
  showToast(`消耗 ${reg.unlockCost} 废土币，成功解锁「${reg.name}」！`, 'success');
  return true;
}

function getBgmTrackForMap(mapId) {
  const id = String(mapId || state.mapId || 'town');
  if (id === 'town') return 'town';
  if (id.startsWith('interior_')) return 'interior';
  if (id === 'cave_tianshu' || id === 'cave_shrine' || id === 'cave_thunder_altar') return 'cave_tianshu';
  if (id === 'cave_fox' || id === 'cave_fox_shrine' || id === 'cave_lotus' || id === 'cave_mire') return 'cave_fox';
  if (id.startsWith('cave_')) return 'cave';
  if (id === 'wasteland') return 'wasteland';
  if (id === 'ruins') return 'ruins';
  if (id === 'arsenal') return 'arsenal';
  if (id === 'swamp') return 'swamp';
  if (id === 'vault') return 'vault';
  return 'wasteland';
}

function isStudioSplashActive() {
  const sp = $('studio-splash');
  if (!sp) return false;
  return !sp.classList.contains('hidden') && !sp.classList.contains('splash-done') && sp.style.display !== 'none';
}

function isOpeningPrologueActive() {
  const op = $('opening-prologue');
  return Boolean(op && !op.classList.contains('hidden'));
}

function ensureSceneTransitionEls() {
  const host = document.querySelector('.rpg-stage-wrap') || document.body;
  let curtain = $('scene-ink-curtain');
  if (!curtain) {
    curtain = document.createElement('div');
    curtain.id = 'scene-ink-curtain';
    curtain.className = 'scene-ink-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    host.appendChild(curtain);
  }
  let banner = $('scene-title-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'scene-title-banner';
    banner.className = 'scene-title-banner';
    banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = '<div class="scene-banner-sub"></div><div class="scene-banner-title"></div><div class="scene-banner-rule"></div>';
    host.appendChild(banner);
  }
  return { curtain, banner };
}

function showSceneTitleBanner(mapName, regionName) {
  if (isStudioSplashActive() || isOpeningPrologueActive()) {
    return;
  }
  const { banner } = ensureSceneTransitionEls();
  const titleEl = banner.querySelector('.scene-banner-title');
  const subEl = banner.querySelector('.scene-banner-sub');
  if (titleEl) titleEl.textContent = mapName;
  if (subEl) subEl.textContent = regionName || '';

  if (sceneBannerTimer) clearTimeout(sceneBannerTimer);
  banner.classList.remove('is-visible');
  void banner.offsetWidth;
  banner.classList.add('is-visible');
  sceneBannerTimer = setTimeout(() => {
    banner.classList.remove('is-visible');
  }, 1150);
}

function applyEnterMap(target, spawnX = null, spawnY = null, showBanner = true, suppressArrivalFx = false) {
  closeDialog();
  state.mapId = target.id;
  const sx = spawnX ?? target.spawn?.x ?? target.width * 0.5;
  const sy = spawnY ?? target.spawn?.y ?? target.height * 0.5;
  state.heroX = sx;
  state.heroY = sy;

  const region = getMapRegion(target);
  if (state.regionWeathers[region.id] === undefined) {
    const pool = target.weatherPool || [0];
    state.regionWeathers[region.id] = pool[Math.floor(Math.random() * pool.length)];
  }
  const wid = target.sceneType === 'interior' ? 0 : (state.regionWeathers[region.id] ?? 0);

  state.openedChests = state.openedChests || [];
  state.defeatedBosses = state.defeatedBosses || [];
  world.loadMap(target, {
    weatherId: wid,
    spawnX: sx,
    spawnY: sy,
    openedChests: state.openedChests,
    defeatedBosses: state.defeatedBosses,
    guardian: state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null,
    heroWeaponType: state.equipped.weapon?.weaponType || 'blade'
  });

  if (target.id === 'cave_metro') advanceQuestTrigger('enter_cave_metro');
  if (target.isSafe) state.warn = Math.max(0, state.warn - 30);

  const hint = $('stage-hint-text');
  if (hint) {
    hint.textContent = target.sceneType === 'interior'
      ? `${target.name} · 与掌柜交谈或自门口返回`
      : target.sceneType === 'cave'
        ? `${target.name} · 险境深处藏有首领与珍宝，小心巡逻强敌`
        : 'WASD / 方向键行走 · E / 空格 交互 · 点击地面寻路';
  }

  const introLocked = suppressArrivalFx || isStudioSplashActive() || isOpeningPrologueActive();
  if (!introLocked) {
    if (showBanner) {
      showSceneTitleBanner(target.name, region.name);
    }
    showToast(`抵达「${target.name}」`, 'info');
    if (!battle) {
      sfx.playBgm?.(getBgmTrackForMap(target.id));
    }
    maybeTriggerMapEntryCutscene(target.id);
  }
  updateHUD();
  scheduleSave();
}

function enterMap(mapId, spawnX = null, spawnY = null, opts = {}) {
  const target = MAPS_BY_ID[mapId];
  if (!target) return;

  if (!isRegionUnlocked(target.regionId)) {
    const ok = tryUnlockRegion(target.regionId);
    if (!ok) return;
  }

  // 首次初始化加载地图直接进入；后续切图启用两段式水墨幕布过渡 + 书法地标横幅
  if (!world?.map) {
    applyEnterMap(target, spawnX, spawnY, false, Boolean(opts.suppressArrivalFx));
    return;
  }

  const token = ++sceneTransitionToken;
  if (sceneTransitionTimer) clearTimeout(sceneTransitionTimer);
  const { curtain } = ensureSceneTransitionEls();
  sfx.uiTick?.();
  curtain.classList.add('is-active');

  sceneTransitionTimer = setTimeout(() => {
    if (token !== sceneTransitionToken) return;
    applyEnterMap(target, spawnX, spawnY, true);
    requestAnimationFrame(() => {
      curtain.classList.remove('is-active');
    });
  }, 150);
}

function refreshCurrentMapLoot() {
  if (!world?.map) return;
  const curMap = world.map;
  const hasRoamingMonsters = Array.isArray(world.enemies) && world.enemies.some((en) => !en.data?.isBoss);
  if (curMap.isSafe || !hasRoamingMonsters) {
    showToast('此地清平，并无野外游荡异兽可惊动，请出城或深入险地再寻新迹。', 'info');
    return;
  }
  if (state.energy < 8) {
    showToast('内息不足（需 8 点内息），请饮纯净水或回医馆调息。', 'warn');
    return;
  }
  state.energy -= 8;
  state.day += 1;
  // 刷新本域天气
  const pool = curMap.weatherPool || [0];
  const nextW = pool[Math.floor(Math.random() * pool.length)];
  state.regionWeathers[curMap.regionId] = nextW;
  world.setWeather(nextW);

  // 惊动并重置当前荒野/秘窟中所有非首领游荡异兽，供侠客再觅战机与掉落
  let stirredCount = 0;
  for (const en of world.enemies) {
    if (en.data?.isBoss) continue;
    if (!en.alive) {
      en.alive = true;
      en.hp = en.maxHp;
      en.x = en.homeX;
      en.y = en.homeY;
      en.respawnTimer = 0;
      stirredCount += 1;
    } else {
      en.hp = en.maxHp;
      en.respawnTimer = 0;
    }
  }
  sfx.pick('fine');
  const weatherName = WEATHERS[nextW]?.name || '晴朗';
  showToast(
    stirredCount > 0
      ? `风起尘动！第 ${state.day} 日天色转为「${weatherName}」，惊动 ${stirredCount} 只游荡异兽重现踪迹！`
      : `风起尘动！第 ${state.day} 日天色转为「${weatherName}」，此地游荡异兽皆已蠢蠢欲动！`,
    'success'
  );
  updateHUD();
  scheduleSave();
}

// ==================== 拾荒与重型残骸拆解 ====================
function rollItemFromMap(map) {
  const weights = map.weight || [];
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += weights[i] || 0;
  if (sum <= 0) return ITEMS[0];
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i] || 0;
    if (r <= 0) return ITEMS[i] || ITEMS[0];
  }
  return ITEMS[0];
}

function rollQuality(bonusMult = 1) {
  const eagleBonus = 1 + (state.skills[1] || 0) * 0.15 + (state.skills[5] || 0) * 0.06;
  const hermitBonus = (state.hermitLuckBuff || 0) > 0 ? 1.15 : 1;
  const m = bonusMult * eagleBonus * hermitBonus;
  const legendRate = Math.min(0.18, QUALITY.legend.rate * m);
  const rareRate = Math.min(0.32, QUALITY.rare.rate * m);
  const fineRate = Math.min(0.42, QUALITY.fine.rate * Math.sqrt(m));
  const r = Math.random();
  if (r < legendRate) return 'legend';
  if (r < legendRate + rareRate) return 'rare';
  if (r < legendRate + rareRate + fineRate) return 'fine';
  return 'common';
}

const REGION_CHEST_ITEMS = [
  [4, 5, 13, 14, 20, 21, 22, 23],     // 0: 墨石镇域
  [5, 7, 12, 14, 15, 16, 22, 23],     // 1: 铁锈废都域
  [6, 7, 8, 9, 18, 22, 23, 24],       // 2: 赤焰兵工域
  [6, 8, 10, 17, 18, 22, 23, 24],     // 3: 青瘴毒泽域
  [8, 9, 10, 11, 19, 23, 24]          // 4: 天枢核心域
];

const REGION_MONSTER_DROPS = [
  [2, 3, 4, 13, 20, 21, 22],          // 0: 墨石镇域
  [3, 4, 5, 12, 14, 20, 22],          // 1: 铁锈废都域
  [5, 6, 7, 8, 18, 21, 22, 23],       // 2: 赤焰兵工域
  [5, 7, 10, 17, 22, 23, 24],         // 3: 青瘴毒泽域
  [6, 8, 9, 10, 11, 19, 23, 24]       // 4: 天枢核心域
];

const REGION_EQUIP_POOLS = [
  ['wpn_inkblade', 'wpn_flaregun', 'armor_ironwire', 'mech_steam_core'],
  ['wpn_qingcheng', 'wpn_shotgun', 'wpn_sniper', 'armor_ironwire', 'mech_steam_core'],
  ['wpn_gatling', 'wpn_artillery', 'wpn_pulsesword', 'mech_crimson_frame', 'armor_exo'],
  ['wpn_plasma_rifle', 'armor_exo', 'relic_fox_orb', 'mech_crimson_frame', 'wpn_pulsesword'],
  ['wpn_railgun', 'wpn_xuanyuan', 'mech_bit_array', 'mech_tianshu_exo', 'relic_thunder_seal', 'relic_tianshu']
];

const BOSS_RARE_MATS = [10, 11, 18, 19]; // 辐射稳定核、战前黑匣子、军工伺服机、避难所芯片

function getRegionTierIndex(mapOrRegionId) {
  const rid = typeof mapOrRegionId === 'string' ? mapOrRegionId : mapOrRegionId?.regionId;
  const idx = REGIONS.findIndex((r) => r.id === rid);
  return idx >= 0 ? idx : 0;
}

function getChestKey(mapId, node) {
  const idPart = node?.id || `${Math.round(node?.x || 0)}_${Math.round(node?.y || 0)}`;
  return `${mapId || 'map'}:${idPart}`;
}

function rollChestEquipQuality(regionIdx, isPremium, rareBonus = 1) {
  const eagleBonus = 1 + (state.skills[1] || 0) * 0.12 + (state.skills[5] || 0) * 0.05;
  const mult = rareBonus * eagleBonus * (isPremium ? 1.35 : 1);
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

function grantItemToBagOrGold(itemId, quality, stats) {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (state.bag.length >= stats.bagMax) {
    const autoGold = Math.max(15, Math.round(item.baseValue * (QUALITY[quality]?.multiplier || 1) * 0.75));
    state.gold += autoGold;
    return { item, quality, soldGold: autoGold, label: `${item.name}(折+${autoGold}币)` };
  }
  state.bag.push({
    uid: `it_${Date.now()}_${Math.floor(Math.random() * 99999)}`,
    itemId: item.id,
    quality
  });
  return { item, quality, soldGold: 0, label: `${QUALITY[quality].name}·${item.name}` };
}

function handleSalvageNode(node) {
  const isHeavy = node.type === 'abandoned_cannon' || node.type === 'mech_wreck';
  if (!isHeavy) return false;

  const curMap = world.map;
  state.openedChests = state.openedChests || [];
  const chestKey = getChestKey(curMap?.id, node);
  if (node.opened || node.collected || state.openedChests.includes(chestKey)) return true;

  if (state.energy < 10) {
    showToast('内息不足 10 点，无法强行拆解重型军工残骸！', 'warn');
    return true;
  }
  state.energy -= 10;
  node.opened = true;
  node.collected = true;
  state.openedChests.push(chestKey);
  world.setOpenedChests?.(state.openedChests);

  state.stats.salvageHeavy = (state.stats.salvageHeavy || 0) + 1;
  state.stats.pick = (state.stats.pick || 0) + 1;

  const regionIdx = getRegionTierIndex(curMap);
  const stats = getHeroStats();
  const baseGold = 45 + regionIdx * 65 + (state.level || 1) * 12;
  const bonusGold = Math.round(baseGold * (1 + Math.random() * 0.5) * 1.5);
  state.gold += bonusGold;

  const lootLabels = [`+${bonusGold} 币`];

  // 1-2 件高价值区域军工/科技素材
  const itemPool = REGION_CHEST_ITEMS[regionIdx] || REGION_CHEST_ITEMS[0];
  const itemCount = 2;
  for (let i = 0; i < itemCount; i++) {
    const pickId = itemPool[Math.floor(Math.random() * itemPool.length)];
    const iq = rollQuality(1.5);
    const res = grantItemToBagOrGold(pickId, iq === 'common' ? 'fine' : iq, stats);
    if (res) lootLabels.push(res.label);
  }

  // 100% 必出高品质暗黑词缀装备
  const pool = Array.isArray(node.equipPool) && node.equipPool.length
    ? node.equipPool
    : (REGION_EQUIP_POOLS[regionIdx] || REGION_EQUIP_POOLS[0]);
  const baseId = pool[Math.floor(Math.random() * pool.length)];
  const eqQuality = rollChestEquipQuality(regionIdx, true, 1.4);
  const eq = rollEquipment(baseId, eqQuality);
  if (eq) {
    addEquipmentToBag(eq);
    sfx.pick(eq.quality);
    lootLabels.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
    floatNearHero(`+${eq.name}`, QUALITY[eq.quality].color);
  }

  gainExp(32 + regionIdx * 12);
  showToast(`拆解「${node.name}」满载而归：${lootLabels.join('、')}！`, 'success');
  revealRegionLore(curMap?.regionId);

  if (node.salvageElite && ENEMIES[node.salvageElite] && Math.random() < 0.35) {
    showToast(`警报！拆解惊动了休眠的「${ENEMIES[node.salvageElite].name}」！`, 'danger');
    setTimeout(() => {
      startBattle({ enemyId: node.salvageElite, data: ENEMIES[node.salvageElite], alive: true });
    }, 350);
  }

  updateHUD();
  scheduleSave();
  return true;
}

function handleLootNode(node) {
  if (!node || node.opened || node.collected) return;
  if (node.type === 'abandoned_cannon' || node.type === 'mech_wreck') {
    handleSalvageNode(node);
    return;
  }

  const curMap = world.map;
  state.openedChests = state.openedChests || [];
  const chestKey = getChestKey(curMap?.id, node);
  if (state.openedChests.includes(chestKey)) {
    node.opened = true;
    node.collected = true;
    world.setOpenedChests?.(state.openedChests);
    return;
  }

  const stats = getHeroStats();
  const wid = state.regionWeathers[curMap.regionId] ?? 0;
  const weather = WEATHERS[wid] || WEATHERS[0];

  const baseCost = Math.max(2, Math.round((6 - (state.skills[0] || 0)) * weather.energyCost));
  if (state.energy < baseCost) {
    showToast(`内息不足（需 ${baseCost} 点），请喝纯净水或回城歇脚！`, 'warn');
    return;
  }

  state.energy -= baseCost;
  state.food = Math.max(0, state.food - 2);

  // 一次性永久开启，绝不复生
  node.opened = true;
  node.collected = true;
  state.openedChests.push(chestKey);
  world.setOpenedChests?.(state.openedChests);

  state.stats.pick = (state.stats.pick || 0) + 1;
  if (curMap.hasWarn) {
    state.warn = Math.min(100, state.warn + 10);
    if (state.warn >= 100) {
      state.warn = 40;
      const raidId = curMap.regionId === 'reg_vault' ? 'guard' : curMap.regionId === 'reg_arsenal' ? 'drone' : 'raider';
      showToast('警戒值爆表！遭遇区域巡逻伏兵！', 'danger');
      sfx.alarm();
      startBattle({ enemyId: raidId, data: ENEMIES[raidId], alive: true });
    }
  }

  if (curMap.id === 'arsenal') advanceQuestTrigger('loot_arsenal');
  if (curMap.id === 'vault') advanceQuestTrigger('loot_vault');

  const regionIdx = getRegionTierIndex(curMap);
  const isPremiumChest = node.type === 'vault_box' || node.type === 'relic_spot' || curMap.sceneType === 'cave';

  // 1. 丰厚区域阶梯废土币（地窟/秘匣额外 +50%）
  const baseGold = 45 + regionIdx * 65 + (state.level || 1) * 12;
  const goldGain = Math.round(baseGold * (1 + Math.random() * 0.5) * (isPremiumChest ? 1.5 : 1));
  state.gold += goldGain;

  const lootParts = [`+${goldGain} 币`];
  let bestQuality = 'fine';

  // 2. 剧情信物 / 古董发现判定（保留主线与古董图鉴推进，并彻底杜绝随机卡死）
  let unlockedAntiqueThisChest = false;
  if (curMap?.id === 'cave_metro' && node.type === 'vault_box' && !state.stories.includes(1)) {
    unlockStoryRelic(1);
    lootParts.push('信物·旧磁带');
    bestQuality = 'legend';
  }
  const mapRoll = rollItemFromMap(curMap);
  if (mapRoll?.isStory && !state.stories.includes(mapRoll.storyId)) {
    unlockStoryRelic(mapRoll.storyId);
    lootParts.push(`信物·${mapRoll.name}`);
    bestQuality = 'legend';
  } else if (mapRoll?.isCollection) {
    const isNew = unlockCollection(mapRoll.colId);
    if (isNew) {
      unlockedAntiqueThisChest = true;
      lootParts.push(`古董·${mapRoll.name}`);
      bestQuality = 'rare';
    } else {
      const dupBonus = 160 + regionIdx * 40;
      state.gold += dupBonus;
      lootParts.push(`古董折现+${dupBonus}币`);
    }
  }
  if (node.type === 'vault_box' && !unlockedAntiqueThisChest) {
    const pityAntique = grantUncollectedAntique();
    if (pityAntique) {
      lootParts.push(`古董·${pityAntique.name}`);
      if (bestQuality !== 'legend') bestQuality = 'rare';
    }
  }
  if ((state.hermitLuckBuff || 0) > 0) {
    state.hermitLuckBuff = Math.max(0, state.hermitLuckBuff - 1);
  }

  // 3. 1–2 件区域高价值物资 / 科技件 / 灵药（优先科技/特产/补给/稀有）
  const itemPool = REGION_CHEST_ITEMS[regionIdx] || REGION_CHEST_ITEMS[0];
  const itemCount = isPremiumChest ? 2 : (Math.random() < 0.55 ? 2 : 1);
  for (let i = 0; i < itemCount; i++) {
    const pickId = itemPool[Math.floor(Math.random() * itemPool.length)];
    const iq = rollQuality(weather.rareBonus * (isPremiumChest ? 1.45 : 1.15));
    const finalQ = isPremiumChest && iq === 'common' ? 'fine' : iq;
    const res = grantItemToBagOrGold(pickId, finalQ, stats);
    if (res) {
      lootParts.push(res.label);
      if (finalQ === 'legend' || (finalQ === 'rare' && bestQuality !== 'legend')) bestQuality = finalQ;
    }
  }

  // 地窟/秘匣 30% 额外赠稀世丹药
  if (isPremiumChest && Math.random() < 0.30) {
    const elixirId = regionIdx >= 2 ? 'elixir_jiuzhuan' : 'elixir_ration';
    state.elixirs[elixirId] = (state.elixirs[elixirId] || 0) + 1;
    lootParts.push(`丹药·${ELIXIRS[elixirId]?.name || '九转青瘴丹'}`);
  }

  // 4. 品质词缀装备：地窟/秘匣 100% 必出，野外宝箱 55% 概率出
  const equipChance = isPremiumChest ? 1.0 : 0.55;
  if (Math.random() < equipChance) {
    const eqPool = Array.isArray(node.equipPool) && node.equipPool.length
      ? node.equipPool
      : (REGION_EQUIP_POOLS[regionIdx] || REGION_EQUIP_POOLS[0]);
    const baseId = eqPool[Math.floor(Math.random() * eqPool.length)];
    const eqQuality = rollChestEquipQuality(regionIdx, isPremiumChest, weather.rareBonus);
    const eq = rollEquipment(baseId, eqQuality);
    if (eq) {
      addEquipmentToBag(eq);
      lootParts.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
      bestQuality = eq.quality;
      floatNearHero(`+${eq.name}`, QUALITY[eq.quality].color);
    }
  } else {
    floatNearHero(`+${goldGain} 币`, '#f3ce7a');
  }

  sfx.pick(bestQuality);
  gainExp(18 + regionIdx * 8 + (isPremiumChest ? 12 : 0));
  showToast(`开启「${node.name || '宝箱'}」：${lootParts.join('、')}！`, bestQuality === 'legend' || bestQuality === 'rare' ? 'success' : 'info');
  if (isPremiumChest || Math.random() < 0.45) {
    revealRegionLore(curMap?.regionId);
  }

  updateHUD();
  scheduleSave();
}

// ==================== 交互分发 ====================
function handleWorldInteract(target) {
  if (!target || battle) return;

  if (target.type === 'building') {
    const b = target.building;
    if (b.action === 'enter_map' && b.targetMap) {
      enterMap(b.targetMap, b.targetSpawnX, b.targetSpawnY);
    } else if (b.action === 'disassemble') {
      openDisassemble();
    } else if (b.action === 'loan') {
      openLoan();
    } else if (b.action === 'tasks') {
      openQuests();
    } else if (b.action === 'worldmap') {
      openWorldMap();
    } else if (b.action === 'shop') {
      openShop();
    } else if (b.action === 'inn') {
      openInn();
    } else {
      showToast(`探访了「${b.name}」`, 'info');
    }
    return;
  }

  if (target.type === 'portal') {
    const p = target.portal;
    const tx = p.targetX ?? p.spawnX ?? null;
    const ty = p.targetY ?? p.spawnY ?? null;
    enterMap(p.to, tx, ty);
    return;
  }

  if (target.type === 'npc') {
    openNpcDialog(target.npcId);
    return;
  }

  if (target.type === 'save_point') {
    const stats = getHeroStats();
    const healHp = Math.round(stats.maxHp * 0.25);
    const healMp = Math.round(stats.maxEnergy * 0.25);
    state.hp = Math.min(stats.maxHp, state.hp + healHp);
    state.energy = Math.min(stats.maxEnergy, state.energy + healMp);
    sfx.ending();
    floatNearHero(`石碑润泽 +${healHp}血 +${healMp}息`, '#7ce8a4');
    showToast(`墨石记录碑泛起温润青光：气血 +${healHp}，内息 +${healMp}！`, 'success');
    updateHUD();
    scheduleSave();
    saveModalTab = 'slots';
    openSaveModal(true);
    return;
  }

  if (target.type === 'loot') {
    handleLootNode(target.node);
  }
}

// ==================== v26 轩辕剑 × 古龙 · 多幕剧情演出与残卷引擎 ====================
const CUTSCENE_PORTRAITS = {
  hero: 'assets/portrait_hero.jpg',
  laohuang: 'assets/portrait_laohuang.jpg',
  yinshi: 'assets/portrait_yinshi.jpg',
  boss: 'assets/sprites/enemy_demon.png'
};

const MAP_ENTRY_CUTSCENES = {
  town: 'entry_town',
  wasteland: 'entry_wasteland',
  ruins: 'entry_ruins',
  arsenal: 'entry_arsenal',
  swamp: 'entry_swamp',
  vault: 'entry_vault'
};

let activeCutscene = null;

function setDialogPortrait(portraitSrc, fallbackChar = '墨') {
  const img = $('dialog-portrait-img');
  const fallback = $('dialog-portrait-fallback');
  if (!img || !fallback) return;
  fallback.textContent = fallbackChar;
  if (portraitSrc) {
    img.classList.remove('hidden');
    fallback.classList.add('hidden');
    img.onerror = () => {
      img.classList.add('hidden');
      fallback.classList.remove('hidden');
    };
    img.src = portraitSrc;
  } else {
    img.classList.add('hidden');
    fallback.classList.remove('hidden');
  }
}

function applyCutsceneReward(reward) {
  if (!reward || typeof reward !== 'object') return;
  const stats = getHeroStats();
  if (reward.gold) state.gold += reward.gold;
  if (reward.reputation) state.reputation = (state.reputation || 0) + reward.reputation;
  if (reward.radShield) state.radShield = (state.radShield || 0) + reward.radShield;
  if (reward.hp) state.hp = Math.min(stats.maxHp, state.hp + reward.hp);
  if (reward.energy) state.energy = Math.min(stats.maxEnergy, state.energy + reward.energy);
  if (reward.elixir) {
    state.elixirs[reward.elixir] = (state.elixirs[reward.elixir] || 0) + 1;
  }
  if (reward.exp) gainExp(reward.exp);
  if (reward.storyId !== undefined) unlockStoryRelic(reward.storyId);
  if (reward.clue) {
    showToast(reward.clue, 'success');
  }
  sfx.pick('rare');
  updateHUD();
  scheduleSave();
}

function finishActiveCutscene(markSeen = true) {
  const ctx = activeCutscene;
  activeCutscene = null;
  if (!ctx) return;
  state.seenCutscenes = state.seenCutscenes || [];
  if (ctx.cs?.id === 'npc_story_jiubao' && !state.stories.includes(1)) {
    unlockStoryRelic(1);
  }
  if (markSeen && !state.seenCutscenes.includes(ctx.cs.id)) {
    state.seenCutscenes.push(ctx.cs.id);
    scheduleSave();
  }
  const cb = ctx.onComplete;
  if (typeof cb === 'function') {
    setTimeout(() => cb(), 30);
  }
}

function renderActiveCutsceneBeat() {
  if (!activeCutscene) return;
  const { cs, beatIdx } = activeCutscene;
  const beats = cs.beats || [];
  const beat = beats[beatIdx] || beats[beats.length - 1];
  if (!beat) {
    closeDialog(true);
    return;
  }
  const box = $('rpg-dialog-box');
  const speaker = beat.speaker || '沈砚';
  $('dialog-speaker').textContent = speaker;
  $('dialog-title').textContent = `${cs.title} · ${beat.role || '江湖纪事'} (${beatIdx + 1}/${beats.length})`;
  $('dialog-text').textContent = beat.text;
  const portraitSrc = CUTSCENE_PORTRAITS[beat.portrait] || beat.portrait || CUTSCENE_PORTRAITS.hero;
  setDialogPortrait(portraitSrc, speaker.slice(0, 1));

  const optsWrap = $('dialog-options');
  optsWrap.innerHTML = '';

  const isLastBeat = beatIdx >= beats.length - 1;
  const alreadySeen = (state.seenCutscenes || []).includes(cs.id);

  if (!isLastBeat) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'dialog-opt-btn primary';
    nextBtn.textContent = '继续 ▸';
    nextBtn.addEventListener('click', () => {
      sfx.uiTick?.();
      if (!activeCutscene) return;
      activeCutscene.beatIdx += 1;
      renderActiveCutsceneBeat();
    });
    optsWrap.appendChild(nextBtn);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'dialog-opt-btn';
    skipBtn.textContent = '跳过剧情';
    skipBtn.addEventListener('click', () => {
      if (cs.choices && cs.choices.length && !alreadySeen && activeCutscene) {
        activeCutscene.beatIdx = beats.length - 1;
        renderActiveCutsceneBeat();
      } else {
        closeDialog();
      }
    });
    optsWrap.appendChild(skipBtn);
  } else if (cs.choices && cs.choices.length && !alreadySeen) {
    cs.choices.forEach((choice, cIdx) => {
      const btn = document.createElement('button');
      btn.className = `dialog-opt-btn${cIdx === 0 ? ' primary' : ''}`;
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        state.seenCutscenes = state.seenCutscenes || [];
        if (!state.seenCutscenes.includes(cs.id)) state.seenCutscenes.push(cs.id);
        applyCutsceneReward(choice.reward);
        $('dialog-text').textContent = choice.reply || '你收好所得，继续前行。';
        optsWrap.innerHTML = '';
        const doneBtn = document.createElement('button');
        doneBtn.className = 'dialog-opt-btn primary';
        doneBtn.textContent = '踏上征途 ▸';
        doneBtn.addEventListener('click', () => closeDialog());
        optsWrap.appendChild(doneBtn);
      });
      optsWrap.appendChild(btn);
    });
  } else {
    const endBtn = document.createElement('button');
    endBtn.className = 'dialog-opt-btn primary';
    endBtn.textContent = cs.triggerBoss ? '拔剑迎战 ▸' : '继续征途 ▸';
    endBtn.addEventListener('click', () => closeDialog());
    optsWrap.appendChild(endBtn);
  }

  box?.classList.remove('hidden');
}

function playStoryCutscene(cutsceneId, opts = {}) {
  const cs = STORY_CUTSCENES[cutsceneId];
  if (!cs) {
    opts.onComplete?.();
    return false;
  }
  state.seenCutscenes = state.seenCutscenes || [];
  const alreadySeen = state.seenCutscenes.includes(cutsceneId);

  if (!opts.force && alreadySeen) {
    if (opts.isNpcStory && cs.repeatableHint) {
      if (world) world.paused = true;
      currentDialog = { isCutscene: false, id: cutsceneId };
      const firstBeat = cs.beats?.[0] || {};
      $('dialog-speaker').textContent = firstBeat.speaker || '江湖秘闻';
      $('dialog-title').textContent = `${cs.title} · 秘闻回顾`;
      $('dialog-text').textContent = cs.repeatableHint;
      setDialogPortrait(CUTSCENE_PORTRAITS[firstBeat.portrait] || CUTSCENE_PORTRAITS.laohuang, (firstBeat.speaker || '墨').slice(0, 1));
      const optsWrap = $('dialog-options');
      optsWrap.innerHTML = '';
      const replayBtn = document.createElement('button');
      replayBtn.className = 'dialog-opt-btn primary';
      replayBtn.textContent = '重温此段对话';
      replayBtn.addEventListener('click', () => playStoryCutscene(cutsceneId, { ...opts, force: true }));
      optsWrap.appendChild(replayBtn);
      const bye = document.createElement('button');
      bye.className = 'dialog-opt-btn';
      bye.textContent = '告辞';
      bye.addEventListener('click', () => closeDialog());
      optsWrap.appendChild(bye);
      $('rpg-dialog-box')?.classList.remove('hidden');
      return true;
    }
    opts.onComplete?.();
    return false;
  }

  if (world) world.paused = true;
  currentDialog = { isCutscene: true, id: cutsceneId };
  activeCutscene = { cs, beatIdx: 0, onComplete: opts.onComplete || null, isNpcStory: Boolean(opts.isNpcStory) };
  sfx.uiTick?.();
  renderActiveCutsceneBeat();
  return true;
}

function maybeTriggerMapEntryCutscene(mapId) {
  const csId = MAP_ENTRY_CUTSCENES[mapId];
  if (!csId || !STORY_CUTSCENES[csId]) return;
  state.seenCutscenes = state.seenCutscenes || [];
  if (state.seenCutscenes.includes(csId)) return;
  setTimeout(() => {
    if (battle || currentDialog || state.mapId !== mapId) return;
    if (isStudioSplashActive() || isOpeningPrologueActive()) return;
    playStoryCutscene(csId);
  }, 460);
}

function revealRegionLore(regionId) {
  const pool = WORLD_LORE_ENTRIES[regionId];
  if (!Array.isArray(pool) || !pool.length) return;
  state.seenLore = state.seenLore || [];
  const unseenIdx = pool.findIndex((_, i) => !state.seenLore.includes(`${regionId}_${i}`));
  if (unseenIdx === -1) return;
  const key = `${regionId}_${unseenIdx}`;
  state.seenLore.push(key);
  const text = pool[unseenIdx];
  floatNearHero('发现旧纪元残卷！', '#5eead4');
  setTimeout(() => {
    showToast(text, 'info');
  }, 420);
  scheduleSave();
}

// ==================== NPC 底部水墨对话框 ====================
function closeDialog(silent = false) {
  const box = $('rpg-dialog-box');
  const wasOpen = Boolean(currentDialog || activeCutscene || (box && !box.classList.contains('hidden')));
  currentDialog = null;
  box?.classList.add('hidden');
  if (wasOpen && !silent) sfx.uiTick?.();
  if (activeCutscene) {
    finishActiveCutscene(true);
  }
  if (world && !battle && !activeCutscene && $('modal-backdrop')?.classList.contains('hidden')) {
    world.paused = false;
  }
}

function openNpcDialog(npcId) {
  const npc = NPCS[npcId];
  if (!npc) return;
  currentDialog = npc;
  if (world) world.paused = true;
  sfx.uiTick?.();

  advanceQuestTrigger(`talk_${npcId}`);

  const box = $('rpg-dialog-box');
  const img = $('dialog-portrait-img');
  const fallback = $('dialog-portrait-fallback');
  $('dialog-speaker').textContent = npc.name;
  $('dialog-title').textContent = npc.title;
  $('dialog-text').textContent = npc.talk;

  if (img && fallback) {
    fallback.textContent = npc.name.slice(0, 1);
    if (npc.portrait) {
      img.classList.remove('hidden');
      fallback.classList.add('hidden');
      img.onerror = () => {
        img.classList.add('hidden');
        fallback.classList.remove('hidden');
      };
      img.src = npc.portrait;
    } else {
      img.classList.add('hidden');
      fallback.classList.remove('hidden');
    }
  }

  const optsWrap = $('dialog-options');
  optsWrap.innerHTML = '';
  (npc.options || []).forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `dialog-opt-btn${idx === 0 ? ' primary' : ''}`;
    btn.textContent = opt.text;
    btn.title = opt.desc || '';
    btn.addEventListener('click', () => handleNpcOption(npc, idx, opt));
    optsWrap.appendChild(btn);
  });

  const bye = document.createElement('button');
  bye.className = 'dialog-opt-btn';
  bye.textContent = '告辞';
  bye.addEventListener('click', closeDialog);
  optsWrap.appendChild(bye);

  box.classList.remove('hidden');
}

function handleNpcOption(npc, idx, opt) {
  if (opt.action === 'shop') { closeDialog(); openShop(); return; }
  if (opt.action === 'inn') { closeDialog(); openInn(); return; }
  if (opt.action === 'crucible') { closeDialog(); openCrucible(); return; }
  if (opt.action === 'disassemble') { closeDialog(); openDisassemble(); return; }
  if (opt.action === 'skills') { closeDialog(); openSkill(); return; }
  if (opt.action === 'story_branch') {
    playStoryCutscene(`npc_story_${npc.id}`, { isNpcStory: true });
    return;
  }

  const id = npc.id;
  if (id === 'laohuang') {
    if (idx === 1) {
      $('dialog-text').textContent = '“阿哲那块旧表停在 21:47。你出东门去城郊废土找盲眼老鬼，他知道防空洞的入口，鼠王窝里兴许就有阿哲的遗物！”';
    } else if (idx === 2) {
      const mult = state.reputation >= 2 ? 1.15 : 1.0;
      const earned = sellAllTrash(mult);
      $('dialog-text').textContent = earned > 0
        ? `“爽快！按 ${Math.round(mult * 100)}% 市价全收了，共计 ${earned} 废土币！”`
        : '“你行囊里眼下没多少可卖的废品，去城外多转转再来找我。”';
    }
  } else if (id === 'yaotong') {
    if (idx === 1) {
      $('dialog-text').textContent = '“青瘴毒泽每 60 秒便会爆发辐射潮。用金疮药散与变异荧光菇入天工墨壶，可炼成【九转青瘴丹】，连护两层抗辐射盾！”';
    } else if (idx === 2) {
      if (state.gold < 100) {
        showToast('捐赠药资需 100 废土币。', 'warn');
      } else {
        state.gold -= 100;
        state.reputation += 1;
        sfx.coin();
        $('dialog-text').textContent = `“多谢少侠慷慨解囊！墨石镇声望提升至 ${state.reputation}！”`;
      }
    }
  } else if (id === 'laogui') {
    if (idx === 0) {
      if (state.gold < 150) {
        showToast('废土密道图需 150 废土币。', 'warn');
      } else {
        state.gold -= 150;
        sfx.coin();
        const curMap = world?.map || MAPS_BY_ID[state.mapId] || MAPS[0];
        const curReg = getMapRegion(curMap);
        const regionIdx = getRegionTierIndex(curMap);
        const stats = getHeroStats();
        const mapRemaining = (world?.lootNodes || []).filter((n) => !n.opened && !n.collected).length;
        let regionRemaining = 0;
        for (const mid of (curReg?.maps || [])) {
          const m = MAPS_BY_ID[mid];
          if (!m || !Array.isArray(m.lootZones)) continue;
          for (const lz of m.lootZones) {
            if (!(state.openedChests || []).includes(getChestKey(mid, lz))) {
              regionRemaining += 1;
            }
          }
        }
        const itemPool = REGION_CHEST_ITEMS[regionIdx] || REGION_CHEST_ITEMS[0];
        const pickId = itemPool[Math.floor(Math.random() * itemPool.length)];
        const bonusRes = grantItemToBagOrGold(pickId, Math.random() < 0.35 ? 'rare' : 'fine', stats);
        state.radShield = (state.radShield || 0) + 1;
        state.hermitLuckBuff = Math.max(state.hermitLuckBuff || 0, 5);
        const bonusTxt = bonusRes?.label ? `获赠【${bonusRes.label}】、` : '';
        $('dialog-text').textContent = `“密道勘测已毕！当前「${curMap.name}」尚余 ${mapRemaining} 处未启宝箱，整片「${curReg.name}」尚余 ${regionRemaining} 处秘藏。${bonusTxt}+1 层抗辐射护盾，且接下来 5 次寻宝珍稀爆率 +15%！”`;
        showToast(`密道勘测：本图余 ${mapRemaining} 箱 / 本域余 ${regionRemaining} 箱 · 寻宝福运 +15%！`, 'success');
      }
    } else if (idx === 1) {
      $('dialog-text').textContent = '“北侧塌坡下就是战前防空洞，里头盘踞着墨尾巨鼠王。记得交锋时将荒原妖邪击至力竭，再以【天工墨壶】收摄残灵！”';
    } else if (idx === 2) {
      const stats = getHeroStats();
      const isEmergency = state.hp < stats.maxHp * 0.3;
      if (state.dailyFreeHealDay === state.day && !isEmergency) {
        $('dialog-text').textContent = '“今日热茶已尽，待明日再来，或是回墨石镇医馆歇脚吧。若真伤重垂危（气血不足三成），老鬼定会再施援手。”';
      } else {
        state.hp = Math.min(stats.maxHp, state.hp + 25);
        state.energy = Math.min(stats.maxEnergy, state.energy + 20);
        state.dailyFreeHealDay = state.day;
        $('dialog-text').textContent = '“喝口热茶暖暖身子，荒原风硬，莫要硬扛！”（+25 气血，+20 内息）';
      }
    }
  } else if (id === 'shaobing') {
    if (idx === 0) {
      if (state.gold < 200) showToast('废土币不足 200！', 'warn');
      else {
        state.gold -= 200;
        state.warn = 0;
        sfx.coin();
        $('dialog-text').textContent = '“算你识相！弟兄们，放行，警戒撤了！”';
      }
    } else if (idx === 1) {
      if (state.reputation < 3) showToast(`需营地声望 ≥ 3（当前 ${state.reputation}）`, 'warn');
      else {
        state.warn = 0;
        $('dialog-text').textContent = '“原来是墨石镇的大人物！有眼不识泰山，警戒这就清零！”';
      }
    } else if (idx === 2) {
      if (state.food < 30) showToast('饱食度不足 30！', 'warn');
      else {
        state.food -= 30;
        state.warn = Math.floor(state.warn * 0.5);
        $('dialog-text').textContent = '“嘿，压缩干粮还挺香！过去吧，别闹太大动静。”';
      }
    }
  } else if (id === 'jiubao') {
    if (idx === 1) {
      $('dialog-text').textContent = '“断钢那厮血量掉过一半就会链锯过载狂暴，带上【玄墨金钟罩】和破甲武器，准能收拾他！”';
    } else if (idx === 2) {
      if (state.gold < 60) showToast('烈酒需 60 废土币。', 'warn');
      else {
        state.gold -= 60;
        state.energy = Math.min(getHeroStats().maxEnergy, state.energy + 35);
        sfx.coin();
        $('dialog-text').textContent = '“好酒下肚，内息暴涨 +35！去地铁二号线掀了断钢的老窝！”';
      }
    }
  } else if (id === 'tiejiang') {
    if (idx === 2) {
      $('dialog-text').textContent = '“祝融七号每三回合喷射过载烈焰，备好抗辐射药剂或青莲回春诀，击败它就能拿到 B-04 黄铜钥匙！”';
    }
  } else if (id === 'yinshi') {
    if (idx === 0) {
      $('dialog-text').textContent = '“故人就在东岸隐士草庐里调试无线电。不过他心脉仍受毒瘴侵蚀，须得入北沼沉没菌窟采一朵「净瘴青莲」！”';
    } else if (idx === 1) {
      if (state.gold < 300) showToast('抗辐射秘药需 300 废土币。', 'warn');
      else {
        state.gold -= 300;
        state.radShield += 1;
        state.hp = Math.min(getHeroStats().maxHp, state.hp + 30);
        sfx.coin();
        $('dialog-text').textContent = '“服下此药，可抵御一次辐射潮侵袭（抗辐射护盾 +1，气血 +30）。”';
      }
    } else if (idx === 2) {
      if (state.food < 20) showToast('饱食度不足 20！', 'warn');
      else {
        state.food -= 20;
        state.reputation += 2;
        $('dialog-text').textContent = `“难得废土还有这般温情，老夫记下了！”（声望 +2，当前 ${state.reputation}）`;
      }
    }
  } else if (id === 'azhe') {
    if (idx === 0) {
      unlockStoryRelic(4);
      $('dialog-text').textContent = '“……21:47！我想起来了！沈砚，天枢主脑正在吞噬地脉奇点，快去 07 号避难所找林博士，我用无线电为你指引坐标！”';
    } else if (idx === 1) {
      const stats = getHeroStats();
      const isEmergency = state.hp < stats.maxHp * 0.3;
      if (state.dailyFreeHealDay === state.day && !isEmergency) {
        $('dialog-text').textContent = '“今日草庐药水用尽了，先去医馆休整或明日再来；若真拼到气血不足三成，随时回来找我应急！”';
      } else {
        state.energy = stats.maxEnergy;
        state.hp = stats.maxHp;
        state.dailyFreeHealDay = state.day;
        $('dialog-text').textContent = '“老伙计，歇会儿吧。电台调好了，气血与内息都恢复到巅峰了！”';
      }
    } else if (idx === 2) {
      $('dialog-text').textContent = '“玄墨大帝在天枢地脉密窟深处，半血后会进入二阶段觉醒。务必带上最强护驾与绝世神兵！”';
    }
  } else if (id === 'xuezhe') {
    if (idx === 0) {
      const remainingNeed = SKILLS.reduce((sum, sk) => {
        const curLv = state.skills[sk.id] || 0;
        for (let lv = curLv; lv < sk.maxLevel; lv++) {
          sum += (sk.cost?.[lv] ?? 1);
        }
        return sum;
      }, 0);
      const maxBuyable = Math.max(0, remainingNeed - (state.skillPoints || 0));
      if (maxBuyable <= 0) {
        showToast('你的修为点已足以将全部心法修至圆满，无需再购！', 'info');
        $('dialog-text').textContent = '“你的神经潜能已达圆满阈值，现有修为点足以修满全部六门心法，不必再浪费废土币了。”';
      } else if (state.gold < 400) {
        showToast('神经强化需 400 废土币。', 'warn');
      } else {
        state.gold -= 400;
        state.skillPoints += 1;
        sfx.ending();
        $('dialog-text').textContent = `“战前神经强化完成！获得 +1 修为点（当前可用 ${state.skillPoints}，距全满尚需 ${Math.max(0, maxBuyable - 1)} 点）。”`;
      }
    } else if (idx === 1) {
      $('dialog-text').textContent = '“欲成「天工墨主 · 墨土之王」，须击败玄墨大帝，且集齐 8 件古董、5 章剧情信物并拥有护驾灵兽！”';
    } else if (idx === 2) {
      const earned = sellAllTrash(1.25);
      $('dialog-text').textContent = earned > 0
        ? `“这些战前样本极有研究价值！按 125% 溢价支付你 ${earned} 废土币！”`
        : '“行囊里暂无可收购的物资。”';
    }
  } else if (id === 'jiaotou') {
    if (idx === 1) {
      $('dialog-text').textContent = '“古武破甲快剑、军火加特林与狙杀、科幻墨甲重炮浮游炮、仙妖金钟罩与镇魂收妖——四系技能随等级解锁，战斗中可随时切换！”';
    } else if (idx === 2) {
      const stats = getHeroStats();
      const isEmergency = state.hp < stats.maxHp * 0.3 || state.energy < stats.maxEnergy * 0.3;
      if (state.dailyFreeHealDay === state.day && !isEmergency) {
        $('dialog-text').textContent = '“今日导引调息已行过一次，过犹不及！明日再来，或气血/内息不足三成时再来寻我。”';
      } else {
        state.energy = stats.maxEnergy;
        state.dailyFreeHealDay = state.day;
        $('dialog-text').textContent = '“吐纳一周天，丹田充盈！内息已完全恢复！”';
      }
    }
  }

  updateHUD();
  scheduleSave();
}

// ==================== 《轩辕剑三》回合制战斗系统 ====================
function getEnemySpritePath(tpl) {
  const st = tpl?.spriteType || 'rat';
  if (ASSETS[st]) return ASSETS[st];
  if (['rat', 'dog', 'boss_ratking', 'slime'].includes(st)) {
    return 'assets/sprites/enemy_beast.png';
  }
  if (['drone', 'flame_mech', 'guard', 'auto_turret', 'heavy_mech', 'mech_taotie', 'boss_zhurong', 'raider', 'raider_shield', 'boss_duangang'].includes(st)) {
    return 'assets/sprites/enemy_mech.png';
  }
  return 'assets/sprites/enemy_demon.png';
}

function buildEnemySvg(tpl) {
  const src = getEnemySpritePath(tpl);
  const acc = tpl.accent || '#d49a3a';
  const isBoss = Boolean(tpl.isBoss);
  const faceRight = src.includes('enemy_beast.png') || src.includes('enemy_mech.png');
  const cls = `battle-enemy-img${isBoss ? ' is-boss' : ''}${faceRight ? ' face-right' : ''}`;
  return `<img class="${cls}" src="${src}" alt="${escapeHtml(tpl.name)}" draggable="false" style="--boss-accent:${acc}" />`;
}

function triggerClassAnim(el, cls, durationMs = 260) {
  if (!el) return;
  if (!el._animTimers) el._animTimers = {};
  if (el._animTimers[cls]) {
    clearTimeout(el._animTimers[cls]);
    delete el._animTimers[cls];
  }
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el._animTimers[cls] = setTimeout(() => {
    el.classList.remove(cls);
    delete el._animTimers[cls];
  }, durationMs);
}

function getBattleVfxContainer() {
  return $('bat-vfx-layer') || $('float-layer');
}

function getBattleTargetPos(target, container, offsetX = 0, offsetY = 0) {
  const isEnemy = target === 'enemy';
  const targetEl = isEnemy ? $('bat-enemy-visual') : $('bat-hero-portrait');
  const cRect = container.getBoundingClientRect();
  const jitterX = (Math.random() - 0.5) * 26;
  const jitterY = (Math.random() - 0.5) * 14;

  if (targetEl && cRect.width > 0 && cRect.height > 0) {
    const tRect = targetEl.getBoundingClientRect();
    if (tRect.width > 0 && tRect.height > 0) {
      return {
        x: (tRect.left + tRect.width * 0.5) - cRect.left + offsetX + jitterX,
        y: (tRect.top + tRect.height * 0.36) - cRect.top + offsetY + jitterY
      };
    }
  }
  return {
    x: (cRect.width || window.innerWidth) * (isEnemy ? 0.27 : 0.73) + offsetX + jitterX,
    y: (cRect.height || window.innerHeight) * 0.44 + offsetY + jitterY
  };
}

function triggerBattleLunge(isHero) {
  if (isHero) {
    triggerClassAnim($('bat-hero-portrait'), 'lunge-left', 440);
  } else {
    triggerClassAnim($('bat-enemy-visual'), 'lunge-right', 420);
  }
}

function triggerGuardianLunge() {
  const gv = $('bat-guardian-visual');
  if (gv) triggerClassAnim(gv, 'lunge-left', 440);
}

function renderBattleGuardianFighter() {
  const wrap = $('bat-guardian-fighter');
  const vis = $('bat-guardian-visual');
  const nameEl = $('bat-guardian-nameplate');
  if (!wrap || !vis) return;
  const guard = state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null;
  if (!guard) {
    wrap.classList.add('hidden');
    vis.dataset.guardianId = '';
    vis.innerHTML = '';
    if (nameEl) nameEl.textContent = '';
    return;
  }
  wrap.classList.remove('hidden');
  if (vis.dataset.guardianId !== guard.id) {
    const src = _getGuardianSpriteSrc(guard.id);
    // enemy_beast.png & enemy_mech.png naturally face LEFT; enemy_demon.png naturally faces RIGHT -> flip to face LEFT
    const needsFlip = src.includes('enemy_demon.png');
    vis.innerHTML = `<img class="guardian-sprite-img${needsFlip ? ' face-left' : ''}" src="${src}" alt="${escapeHtml(guard.name)}" />`;
    vis.dataset.guardianId = guard.id;
  }
  if (nameEl) nameEl.textContent = guard.name;
}

function spawnGuardianAssistVfx(guard) {
  const container = getBattleVfxContainer();
  if (!container) return;
  if (guard?.healHp && !guard?.baseDmg) {
    const { x, y } = getBattleTargetPos('hero', container, 0, 6);
    const aura = document.createElement('div');
    aura.className = 'vfx-hero-buff-aura';
    aura.style.left = `${Math.round(x)}px`;
    aura.style.top = `${Math.round(y)}px`;
    container.appendChild(aura);
    setTimeout(() => aura.remove(), 680);
    return;
  }
  const { x, y } = getBattleTargetPos('enemy', container, 0, 6);
  const fx = document.createElement('div');
  fx.className = 'vfx-guardian-slash';
  fx.style.left = `${Math.round(x)}px`;
  fx.style.top = `${Math.round(y)}px`;
  fx.innerHTML = `
    <svg viewBox="0 0 180 180" width="210" height="210" fill="none" aria-hidden="true">
      <path d="M18 148 Q78 36 164 16 Q110 86 38 160 Z" fill="rgba(94,234,212,0.52)" stroke="#f3ce7a" stroke-width="3.2"/>
      <path d="M32 140 Q88 52 156 26 Q104 84 44 148 Z" fill="rgba(243,206,122,0.42)" stroke="#ecfeff" stroke-width="2.2"/>
      <path d="M26 42 Q94 74 156 146" stroke="#5eead4" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="148" cy="34" r="4.5" fill="#fef08a"/>
      <circle cx="44" cy="146" r="3.8" fill="#5eead4"/>
    </svg>`;
  container.appendChild(fx);
  setTimeout(() => fx.remove(), 600);
}

function getBranchCinemaDuration(branch) {
  switch (branch) {
    case 'firearm': return 950;
    case 'mecha': return 1100;
    case 'mystic': return 1150;
    case 'martial':
    default: return 850;
  }
}

function spawnBattleCombatVfx(branch = 'martial', opts = {}) {
  const container = getBattleVfxContainer();
  if (!container) return { impactMs: 240, totalMs: 850 };
  const norm = branch === 'physical' ? 'martial' : branch;
  const skillId = opts.skillId || '';
  const isCrit = Boolean(opts.isCrit);
  const cRect = container.getBoundingClientRect();
  const cw = cRect.width || window.innerWidth;
  const ch = cRect.height || window.innerHeight;
  const ePos = getBattleTargetPos('enemy', container, 0, 6);
  const hPos = getBattleTargetPos('hero', container, -28, 2);

  if (norm === 'firearm') {
    const totalMs = 950;
    const isSnipe = skillId === 'sk_snipe';
    const isShotgun = skillId === 'sk_shotgun';
    const dx = hPos.x - ePos.x;
    const dy = hPos.y - ePos.y;
    const dist = Math.max(180, Math.hypot(dx, dy));
    const angleDeg = Math.atan2(ePos.y - hPos.y, ePos.x - hPos.x) * (180 / Math.PI) + 180;

    // 枪口多段火光
    const burstTimes = isSnipe ? [320] : (isShotgun ? [80, 260] : [60, 210, 360]);
    burstTimes.forEach((delay) => {
      setTimeout(() => {
        if (!battle) return;
        const muzzle = document.createElement('div');
        muzzle.className = 'vfx-firearm-muzzle';
        muzzle.style.left = `${Math.round(hPos.x - 24)}px`;
        muzzle.style.top = `${Math.round(hPos.y - 6)}px`;
        muzzle.innerHTML = `
          <svg viewBox="0 0 120 120" width="120" height="120" fill="none">
            <polygon points="60,60 22,18 52,44 10,56 48,66 16,96 58,74 72,108 74,72 108,62 74,50 86,16" fill="rgba(249,115,22,0.86)" stroke="#fef08a" stroke-width="2.4"/>
            <circle cx="60" cy="60" r="14" fill="#fff7ed"/>
          </svg>`;
        container.appendChild(muzzle);
        setTimeout(() => muzzle.remove(), 260);
      }, delay);
    });

    if (isSnipe) {
      // 猩红流光弧线狙击弹道（无僵硬直线，以灵动弧光与电弧锁定敌方）
      const midX = Math.round((hPos.x + ePos.x) * 0.5);
      const midY = Math.round((hPos.y + ePos.y) * 0.5 - 34);
      const midY2 = Math.round((hPos.y + ePos.y) * 0.5 + 22);
      const laser = document.createElement('div');
      laser.className = 'vfx-curved-beam-svg vfx-sniper-arc';
      laser.innerHTML = `
        <svg viewBox="0 0 ${Math.round(cw)} ${Math.round(ch)}" width="${Math.round(cw)}" height="${Math.round(ch)}" fill="none">
          <path class="beam-ribbon" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y)} Q ${midX} ${midY} ${Math.round(ePos.x)} ${Math.round(ePos.y)}" stroke="rgba(239,68,68,0.88)" stroke-width="6.5" stroke-linecap="round"/>
          <path class="beam-ribbon" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y)} Q ${midX} ${midY} ${Math.round(ePos.x)} ${Math.round(ePos.y)}" stroke="#fef2f2" stroke-width="2.4" stroke-linecap="round"/>
          <path class="beam-ribbon" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y + 4)} Q ${midX} ${midY2} ${Math.round(ePos.x)} ${Math.round(ePos.y)}" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" opacity="0.82"/>
        </svg>`;
      container.appendChild(laser);
      setTimeout(() => laser.remove(), 540);
    } else if (isShotgun) {
      // 炽焰霰弹流火弧扇喷射（柔韧火浪弧线，零直线）
      setTimeout(() => {
        if (!battle) return;
        const cone = document.createElement('div');
        cone.className = 'vfx-firearm-shotgun';
        cone.style.left = `${Math.round((hPos.x + ePos.x) * 0.5)}px`;
        cone.style.top = `${Math.round(ePos.y)}px`;
        cone.innerHTML = `
          <svg viewBox="0 0 340 220" width="340" height="220" fill="none">
            <defs>
              <linearGradient id="sgFire" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stop-color="#fff7ed"/>
                <stop offset="35%" stop-color="#fbbf24" stop-opacity="0.9"/>
                <stop offset="75%" stop-color="#f97316" stop-opacity="0.7"/>
                <stop offset="100%" stop-color="#dc2626" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="M326 110 Q210 42 26 26 Q72 110 26 194 Q210 178 326 110 Z" fill="url(#sgFire)" opacity="0.84"/>
            <path d="M316 110 Q208 58 34 40" stroke="#fef08a" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M316 110 Q188 86 22 84" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M316 110 Q188 134 22 136" stroke="#fbbf24" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M316 110 Q208 162 38 180" stroke="#f97316" stroke-width="2.8" stroke-linecap="round"/>
          </svg>`;
        container.appendChild(cone);
        setTimeout(() => cone.remove(), 580);
      }, 100);
    } else {
      // 急速三连弧形流火穿甲弹道
      [70, 210, 350].forEach((delay, idx) => {
        setTimeout(() => {
          if (!battle) return;
          const arcBend = (idx - 1) * 38 - 14;
          const mx = Math.round((hPos.x + ePos.x) * 0.5);
          const my = Math.round((hPos.y + ePos.y) * 0.5 + arcBend);
          const tracer = document.createElement('div');
          tracer.className = 'vfx-curved-beam-svg vfx-tracer-arc';
          tracer.innerHTML = `
            <svg viewBox="0 0 ${Math.round(cw)} ${Math.round(ch)}" width="${Math.round(cw)}" height="${Math.round(ch)}" fill="none">
              <path class="beam-ribbon" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y + (idx - 1) * 10)} Q ${mx} ${my} ${Math.round(ePos.x)} ${Math.round(ePos.y + (idx - 1) * 8)}" stroke="#f97316" stroke-width="6" stroke-linecap="round" opacity="0.82"/>
              <path class="beam-ribbon" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y + (idx - 1) * 10)} Q ${mx} ${my} ${Math.round(ePos.x)} ${Math.round(ePos.y + (idx - 1) * 8)}" stroke="#fef08a" stroke-width="2.6" stroke-linecap="round"/>
            </svg>`;
          container.appendChild(tracer);
          setTimeout(() => tracer.remove(), 380);
        }, delay);
      });
    }

    // 命中爆裂火花 + 硝烟
    const impactMs = isSnipe ? 360 : 320;
    setTimeout(() => {
      if (!battle) return;
      const imp = document.createElement('div');
      imp.className = `vfx-firearm-impact${isCrit ? ' is-crit-vfx' : ''}`;
      imp.style.left = `${Math.round(ePos.x)}px`;
      imp.style.top = `${Math.round(ePos.y)}px`;
      imp.innerHTML = `
        <svg viewBox="0 0 200 200" width="220" height="220" fill="none">
          <circle cx="100" cy="100" r="46" fill="rgba(249,115,22,0.34)" stroke="#fef08a" stroke-width="2.8" stroke-dasharray="14 8"/>
          <polygon points="100,26 114,76 168,60 124,100 172,134 116,120 100,174 84,120 28,134 76,100 32,60 86,76" fill="rgba(251,146,60,0.72)" stroke="#fff7ed" stroke-width="2"/>
          <circle cx="100" cy="100" r="18" fill="#fffbeb"/>
          <path d="M54 46 Q38 38 28 20 M148 48 Q166 38 176 22 M52 154 Q36 162 24 178 M150 152 Q166 162 178 176" stroke="#fed7aa" stroke-width="3" stroke-linecap="round"/>
        </svg>`;
      container.appendChild(imp);
      setTimeout(() => imp.remove(), 600);
    }, impactMs);
    return { impactMs, totalMs };
  }

  if (norm === 'mecha') {
    const totalMs = 1100;
    const isMissile = skillId === 'sk_bits' || skillId === 'sk_cannon';
    // Stage 1: 全息青蓝蓄能锁敌灵环 (0ms，弧月纹饰无直线)
    const charge = document.createElement('div');
    charge.className = 'vfx-mecha-charge';
    charge.style.left = `${Math.round(ePos.x)}px`;
    charge.style.top = `${Math.round(ePos.y)}px`;
    charge.innerHTML = `
      <svg viewBox="0 0 200 200" width="210" height="210" fill="none">
        <circle cx="100" cy="100" r="74" stroke="#22d3ee" stroke-width="2.8" stroke-dasharray="22 10"/>
        <circle cx="100" cy="100" r="48" stroke="#5eead4" stroke-width="2" stroke-dasharray="12 6"/>
        <path d="M38 64 Q44 42 66 38 M162 64 Q156 42 134 38 M38 136 Q44 158 66 162 M162 136 Q156 158 134 162" stroke="#67e8f9" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M84 22 Q100 14 116 22 M84 178 Q100 186 116 178 M22 84 Q14 100 22 116 M178 84 Q186 100 178 116" stroke="#ecfeff" stroke-width="2.2" stroke-linecap="round"/>
      </svg>`;
    container.appendChild(charge);
    setTimeout(() => charge.remove(), 500);

    // Stage 2: 螺旋等离子能量流光带 或 弧形追踪浮游导弹 (260ms)
    setTimeout(() => {
      if (!battle) return;
      if (isMissile) {
        const ms = document.createElement('div');
        ms.className = 'vfx-mecha-missiles';
        ms.innerHTML = `
          <svg viewBox="0 0 ${Math.round(cw)} ${Math.round(ch)}" width="${Math.round(cw)}" height="${Math.round(ch)}" fill="none">
            <path class="missile-trail" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y - 24)} Q ${Math.round(cw * 0.5)} ${Math.round(ch * 0.08)} ${Math.round(ePos.x)} ${Math.round(ePos.y)}" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round"/>
            <path class="missile-trail" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y)} Q ${Math.round(cw * 0.48)} ${Math.round(ch * 0.28)} ${Math.round(ePos.x)} ${Math.round(ePos.y + 8)}" stroke="#ecfeff" stroke-width="3.5" stroke-linecap="round"/>
            <path class="missile-trail" d="M ${Math.round(hPos.x)} ${Math.round(hPos.y + 22)} Q ${Math.round(cw * 0.52)} ${Math.round(ch * 0.64)} ${Math.round(ePos.x)} ${Math.round(ePos.y - 6)}" stroke="#5eead4" stroke-width="5" stroke-linecap="round"/>
          </svg>`;
        container.appendChild(ms);
        setTimeout(() => ms.remove(), 740);
      } else {
        const x1 = Math.round(hPos.x);
        const y1 = Math.round(hPos.y);
        const x2 = Math.round(ePos.x);
        const y2 = Math.round(ePos.y);
        const cx1 = Math.round(x1 + (x2 - x1) * 0.33);
        const cy1 = Math.round(y1 + (y2 - y1) * 0.33);
        const cx2 = Math.round(x1 + (x2 - x1) * 0.67);
        const cy2 = Math.round(y1 + (y2 - y1) * 0.67);
        const beam = document.createElement('div');
        beam.className = 'vfx-curved-beam-svg vfx-mecha-helix';
        beam.innerHTML = `
          <svg viewBox="0 0 ${Math.round(cw)} ${Math.round(ch)}" width="${Math.round(cw)}" height="${Math.round(ch)}" fill="none">
            <path class="beam-ribbon" d="M ${x1} ${y1} C ${cx1} ${cy1 - 46}, ${cx2} ${cy2 + 46}, ${x2} ${y2}" stroke="rgba(34,211,238,0.68)" stroke-width="14" stroke-linecap="round"/>
            <path class="beam-ribbon" d="M ${x1} ${y1} C ${cx1} ${cy1 - 46}, ${cx2} ${cy2 + 46}, ${x2} ${y2}" stroke="#ecfeff" stroke-width="4" stroke-linecap="round"/>
            <path class="beam-ribbon" d="M ${x1} ${y1} C ${cx1} ${cy1 + 42}, ${cx2} ${cy2 - 42}, ${x2} ${y2}" stroke="#5eead4" stroke-width="6.5" stroke-linecap="round" opacity="0.9"/>
          </svg>`;
        container.appendChild(beam);
        setTimeout(() => beam.remove(), 700);
      }
    }, 260);

    // Stage 3: EMP 电磁震荡环 (400ms)
    const impactMs = 400;
    setTimeout(() => {
      if (!battle) return;
      const emp = document.createElement('div');
      emp.className = 'vfx-mecha-emp';
      emp.style.left = `${Math.round(ePos.x)}px`;
      emp.style.top = `${Math.round(ePos.y)}px`;
      container.appendChild(emp);
      setTimeout(() => emp.remove(), 660);
    }, impactMs);
    return { impactMs, totalMs };
  }

  if (norm === 'mystic') {
    const totalMs = 1150;
    const isFireLotus = skillId === 'sk_fire';
    // Stage 1: 凌空旋转金色道家符阵 (0ms)
    const talisman = document.createElement('div');
    talisman.className = 'vfx-mystic-talisman';
    talisman.style.left = `${Math.round(ePos.x)}px`;
    talisman.style.top = `${Math.round(ePos.y)}px`;
    talisman.innerHTML = `
      <svg viewBox="0 0 180 180" width="196" height="196" fill="none">
        <polygon points="90,10 146,34 170,90 146,146 90,170 34,146 10,90 34,34" fill="rgba(212,162,74,0.14)" stroke="#f3ce7a" stroke-width="2.6" stroke-dasharray="14 6"/>
        <circle cx="90" cy="90" r="56" stroke="#5eead4" stroke-width="2.2" stroke-dasharray="10 6"/>
        <circle cx="90" cy="90" r="30" stroke="#fde68a" stroke-width="1.8"/>
        <text x="90" y="99" text-anchor="middle" fill="#fef3c7" font-family="Songti SC, serif" font-size="30" font-weight="900">${isFireLotus ? '火' : '敕'}</text>
      </svg>`;
    container.appendChild(talisman);
    setTimeout(() => talisman.remove(), 840);

    // Stage 2: 丹火红莲绽放 OR 九天青金雷柱贯地 (320ms)
    const impactMs = 420;
    setTimeout(() => {
      if (!battle) return;
      if (isFireLotus) {
        const lotus = document.createElement('div');
        lotus.className = 'vfx-mystic-lotus';
        lotus.style.left = `${Math.round(ePos.x)}px`;
        lotus.style.top = `${Math.round(ePos.y)}px`;
        lotus.innerHTML = `
          <svg viewBox="0 0 220 220" width="248" height="248" fill="none">
            <g transform="translate(110,110)">
              ${[0, 45, 90, 135, 180, 225, 270, 315].map((deg) =>
                `<path d="M0 0 Q-22 -46 0 -92 Q22 -46 0 0 Z" transform="rotate(${deg})" fill="rgba(239,68,68,0.55)" stroke="#fde047" stroke-width="2.4"/>`
              ).join('')}
              <circle cx="0" cy="0" r="24" fill="rgba(254,240,138,0.92)" stroke="#f97316" stroke-width="3"/>
            </g>
          </svg>`;
        container.appendChild(lotus);
        setTimeout(() => lotus.remove(), 800);
      } else {
        const thunder = document.createElement('div');
        thunder.className = 'vfx-mystic-thunder';
        thunder.style.left = `${Math.round(ePos.x)}px`;
        thunder.innerHTML = `
          <svg viewBox="0 0 180 420" width="200" height="100%" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="thCol" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#5eead4" stop-opacity="0"/>
                <stop offset="50%" stop-color="#fef08a" stop-opacity="0.88"/>
                <stop offset="100%" stop-color="#5eead4" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="M90 0 C56 108, 126 226, 84 420" stroke="url(#thCol)" stroke-width="34" stroke-linecap="round" opacity="0.62"/>
            <path d="M96 0 L66 105 L108 135 L58 265 L104 285 L76 420" stroke="#5eead4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M96 0 L66 105 L108 135 L58 265 L104 285 L76 420" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M84 40 L132 140 L98 188 L142 310" stroke="#fde047" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>
          </svg>`;
        container.appendChild(thunder);
        setTimeout(() => thunder.remove(), 760);
      }
    }, 320);
    return { impactMs, totalMs };
  }

  // 默认：古武 (martial, 850ms) — 双层水墨飞白新月斩 + 墨点飞溅
  const totalMs = 850;
  const arc1 = document.createElement('div');
  arc1.className = `vfx-martial-arc arc-1${isCrit ? ' is-crit-vfx' : ''}`;
  arc1.style.left = `${Math.round(ePos.x)}px`;
  arc1.style.top = `${Math.round(ePos.y)}px`;
  arc1.innerHTML = `
    <svg viewBox="0 0 200 200" width="240" height="240" fill="none">
      <path d="M18 166 Q82 42 182 18 Q122 96 42 178 Z" fill="rgba(16,13,11,0.9)" stroke="#b53a2e" stroke-width="3.6"/>
      <path d="M26 158 Q88 52 176 24 Q116 88 38 168 Z" fill="rgba(217,76,61,0.56)" stroke="#fca5a5" stroke-width="2.2"/>
      <path d="M40 144 Q98 60 168 32" stroke="#fff4e6" stroke-width="3.2" stroke-linecap="round"/>
    </svg>`;
  container.appendChild(arc1);
  setTimeout(() => arc1.remove(), 580);

  const impactMs = 210;
  setTimeout(() => {
    if (!battle) return;
    const arc2 = document.createElement('div');
    arc2.className = `vfx-martial-arc arc-2${isCrit ? ' is-crit-vfx' : ''}`;
    arc2.style.left = `${Math.round(ePos.x + 6)}px`;
    arc2.style.top = `${Math.round(ePos.y - 4)}px`;
    arc2.innerHTML = `
      <svg viewBox="0 0 200 200" width="265" height="265" fill="none">
        <path d="M24 34 Q102 74 176 168 Q94 114 14 48 Z" fill="rgba(243,206,122,0.56)" stroke="#fef08a" stroke-width="3.2"/>
        <path d="M36 44 Q104 82 166 156" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
      </svg>`;
    container.appendChild(arc2);
    setTimeout(() => arc2.remove(), 640);

    const splat = document.createElement('div');
    splat.className = 'vfx-ink-splatter';
    splat.style.left = `${Math.round(ePos.x)}px`;
    splat.style.top = `${Math.round(ePos.y)}px`;
    splat.innerHTML = `
      <svg viewBox="0 0 200 200" width="240" height="240" fill="none">
        <circle cx="152" cy="46" r="6" fill="#181412" stroke="#d94c3d" stroke-width="1.6"/>
        <circle cx="170" cy="74" r="3.5" fill="#fde047"/>
        <circle cx="44" cy="154" r="5.5" fill="#181412" stroke="#f3ce7a" stroke-width="1.4"/>
        <circle cx="32" cy="126" r="3.2" fill="#d94c3d"/>
        <circle cx="136" cy="158" r="4.8" fill="#181412"/>
        <circle cx="64" cy="42" r="3.8" fill="#f3ce7a"/>
        <path d="M48 48 Q32 40 20 22 M152 48 Q168 40 180 22 M152 152 Q168 160 180 178 M48 152 Q32 160 20 178" stroke="#f3ce7a" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
      </svg>`;
    container.appendChild(splat);
    setTimeout(() => splat.remove(), 680);
  }, impactMs);

  return { impactMs, totalMs };
}

function spawnBattleSlashVfx(target = 'enemy', variant = 'martial', isCrit = false) {
  const container = getBattleVfxContainer();
  if (!container) return;
  const { x, y } = getBattleTargetPos(target, container, 0, 8);
  const branch = variant === 'physical' ? 'martial' : variant;
  const fxEl = document.createElement('div');
  fxEl.className = `bat-slash-fx slash-${branch}${isCrit ? ' is-crit-vfx' : ''}`;
  fxEl.style.left = `${Math.round(x)}px`;
  fxEl.style.top = `${Math.round(y)}px`;

  if (branch === 'capture') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 120 120" width="136" height="136" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="46" stroke="#c084fc" stroke-width="4" stroke-dasharray="18 10" opacity="0.95"/>
        <circle cx="60" cy="60" r="30" stroke="#e9d5ff" stroke-width="2.5" stroke-dasharray="10 8" opacity="0.88"/>
        <path d="M60 10 L69 51 L110 60 L69 69 L60 110 L51 69 L10 60 L51 51 Z" fill="rgba(192,132,252,0.36)" stroke="#f3e8ff" stroke-width="2"/>
      </svg>`;
  } else if (branch === 'martial') {
    // 古武：黑墨飞白剑气弧 + 朱砂锋刃 + 墨点飞溅
    fxEl.innerHTML = `
      <svg viewBox="0 0 160 160" width="168" height="168" fill="none" aria-hidden="true">
        <path d="M16 132 Q66 36 144 16 Q98 78 34 142 Z" fill="rgba(18,15,13,0.88)" stroke="#b53a2e" stroke-width="3.2"/>
        <path d="M22 126 Q72 42 140 20 Q92 70 30 134 Z" fill="rgba(217,76,61,0.52)" stroke="#fca5a5" stroke-width="2"/>
        <path d="M34 114 Q80 48 134 26" stroke="#fff2e2" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="136" cy="34" r="4" fill="#181512" stroke="#d94c3d" stroke-width="1.2"/>
        <circle cx="118" cy="18" r="2.8" fill="#d94c3d"/>
        <circle cx="44" cy="138" r="3.4" fill="#181512"/>
        <circle cx="24" cy="116" r="2.2" fill="#e5bb5c"/>
      </svg>`;
  } else if (branch === 'mystic') {
    // 奇术：道家八卦符阵光环 + 紫青雷霆裂空
    fxEl.innerHTML = `
      <svg viewBox="0 0 160 160" width="168" height="168" fill="none" aria-hidden="true">
        <polygon points="80,14 126,33 146,80 126,127 80,146 34,127 14,80 34,33" fill="rgba(157,124,216,0.16)" stroke="#c084fc" stroke-width="2.6" stroke-dasharray="10 5"/>
        <circle cx="80" cy="80" r="44" stroke="#5eead4" stroke-width="2.2" stroke-dasharray="14 6" opacity="0.92"/>
        <circle cx="80" cy="80" r="22" stroke="#e9d5ff" stroke-width="1.8" opacity="0.85"/>
        <path d="M88 12 L68 58 L92 64 L54 118 L74 114 L64 148" stroke="#5eead4" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M88 12 L68 58 L92 64 L54 118 L74 114 L64 148" stroke="#f5f3ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 52 L56 68 L44 82 L134 106" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      </svg>`;
  } else if (branch === 'firearm') {
    // 现代军火：炽焰琥珀枪口爆闪 + 弧形流火弹道 + 飞溅火花弧
    fxEl.innerHTML = `
      <svg viewBox="0 0 170 150" width="176" height="156" fill="none" aria-hidden="true">
        <polygon points="78,74 96,24 104,62 154,48 112,78 156,102 106,90 94,132 80,88 38,108 66,76 34,46" fill="rgba(249,115,22,0.72)" stroke="#fef08a" stroke-width="2.2"/>
        <circle cx="92" cy="76" r="16" fill="#fff7ed" opacity="0.95"/>
        <path d="M164 36 Q92 48 12 96" stroke="#fbbf24" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M160 38 Q94 50 26 90" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M158 68 Q88 78 18 118" stroke="#f97316" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
        <path d="M146 22 Q98 30 48 60" stroke="#fde047" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
        <path d="M62 40 Q52 34 46 22 M118 116 Q128 122 138 132 M42 74 Q30 74 20 66 M126 32 Q136 28 146 18" stroke="#fed7aa" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`;
  } else if (branch === 'mecha') {
    // 科幻机甲：全息青色弧月锁敌环 + 螺旋等离子波带 + 重炮过载爆闪
    fxEl.innerHTML = `
      <svg viewBox="0 0 170 150" width="176" height="156" fill="none" aria-hidden="true">
        <circle cx="85" cy="75" r="46" stroke="#22d3ee" stroke-width="2.4" stroke-dasharray="16 8" opacity="0.92"/>
        <circle cx="85" cy="75" r="28" stroke="#5eead4" stroke-width="1.8" opacity="0.9"/>
        <path d="M34 48 Q38 32 52 30 M136 48 Q132 32 118 30 M34 102 Q38 118 52 120 M136 102 Q132 118 118 120" stroke="#5eead4" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M8 94 C54 62, 114 96, 164 56" stroke="rgba(34,211,238,0.58)" stroke-width="14" stroke-linecap="round"/>
        <path d="M12 92 C56 64, 112 94, 160 58" stroke="#67e8f9" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M16 90 C60 104, 110 54, 156 60" stroke="#ecfeff" stroke-width="2.8" stroke-linecap="round"/>
        <polygon points="85,48 93,67 112,75 93,83 85,102 77,83 58,75 77,67" fill="rgba(94,234,212,0.72)" stroke="#ffffff" stroke-width="1.6"/>
      </svg>`;
  } else if (branch === 'crit') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 150 150" width="164" height="164" fill="none" aria-hidden="true">
        <path d="M16 126 Q72 34 138 16 Q88 76 28 136 Z" fill="rgba(251,191,36,0.62)" stroke="#fef08a" stroke-width="3.5"/>
        <path d="M22 28 Q82 62 134 126 Q74 88 14 40 Z" fill="rgba(249,115,22,0.46)" stroke="#fde047" stroke-width="2.5"/>
      </svg>`;
  } else if (branch === 'enemy') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 130 130" width="136" height="136" fill="none" aria-hidden="true">
        <path d="M22 24 Q72 64 112 108" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
        <path d="M40 16 Q84 56 118 92" stroke="#fca5a5" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M14 44 Q58 78 96 116" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
      </svg>`;
  } else {
    fxEl.innerHTML = `
      <svg viewBox="0 0 140 140" width="144" height="144" fill="none" aria-hidden="true">
        <path d="M18 118 Q68 34 126 18 Q84 72 28 126 Z" fill="rgba(232,76,61,0.48)" stroke="#fca5a5" stroke-width="3"/>
        <path d="M30 106 Q74 44 118 30" stroke="#fef2f2" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
  }

  container.appendChild(fxEl);
  setTimeout(() => fxEl.remove(), branch === 'enemy' ? 640 : 540);
}

function spawnBattleDmgNum(target = 'enemy', text, styleType = 'physical', opts = {}) {
  const container = getBattleVfxContainer();
  if (!container) return;
  const { x, y } = getBattleTargetPos(target, container, opts.offsetX || 0, opts.offsetY || 0);
  const el = document.createElement('div');
  const fallbackCls = container.id === 'float-layer' ? ' float-text' : '';

  const styleMap = {
    crit:        { cls: 'is-crit',      color: '#fbbf24' },
    mystic:      { cls: 'is-mystic',    color: '#5eead4' },
    mecha:       { cls: 'is-mystic',    color: '#5eead4' },
    physical:    { cls: 'is-physical',  color: '#f0543a' },
    firearm:     { cls: 'is-physical',  color: '#f97316' },
    'enemy-hit': { cls: 'is-enemy-hit', color: '#ef4444' },
    heal:        { cls: 'is-heal',      color: '#4ade80' },
    shield:      { cls: 'is-shield',    color: '#38bdf8' },
    capture:     { cls: 'is-capture',   color: '#c084fc' }
  };
  const cfg = styleMap[styleType] || styleMap.physical;

  el.className = `bat-dmg-num ${cfg.cls}${fallbackCls}`;
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  el.style.color = cfg.color;
  if (styleType === 'crit') {
    el.style.fontSize = '1.95rem';
  }
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function setBattleButtonsEnabled(enabled) {
  ['bat-btn-atk', 'bat-btn-skills', 'bat-btn-capture', 'bat-btn-item', 'bat-btn-run'].forEach((id) => {
    const btn = $(id);
    if (btn) btn.disabled = !enabled;
  });
  if (enabled && battle) {
    const capBtn = $('bat-btn-capture');
    if (capBtn) capBtn.disabled = !battle.tpl.capturable;
  }
  $('rpg-battle-overlay')?.classList.toggle('enemy-turn', !enabled);
  const turnLbl = $('bat-turn-label');
  if (turnLbl) {
    turnLbl.textContent = enabled ? '我方回合' : '敌方回合';
    turnLbl.classList.toggle('is-enemy-turn', !enabled);
  }
}

function updateBattleUI() {
  if (!battle) return;
  const stats = getHeroStats();
  const en = battle.enemy;
  const tpl = battle.tpl;

  $('bat-enemy-name').textContent = battle.phase2 ? `${tpl.name} · 觉醒` : tpl.name;
  const badge = $('bat-enemy-badge');
  if (tpl.isBoss) {
    badge.textContent = battle.phase2 ? '二阶段 · 狂暴' : (tpl.title || '区域首领');
    badge.className = 'enemy-badge boss';
  } else {
    const hpPct = en.hp / en.maxHp;
    badge.textContent = hpPct <= 0.4 ? '残血 · 极易收妖' : '可收妖';
    badge.className = 'enemy-badge capturable';
  }

  $('bat-enemy-hpbar').style.width = `${clamp((en.hp / en.maxHp) * 100, 0, 100)}%`;
  $('bat-enemy-hp').textContent = `${Math.max(0, Math.round(en.hp))} / ${en.maxHp}`;

  const stRow = $('bat-enemy-status');
  stRow.innerHTML = '';
  for (const [k, turns] of Object.entries(battle.enemyStatus)) {
    if (turns <= 0) continue;
    const names = { burn: '灼烧', poison: '剧毒', stun: '眩晕', def_down: '破甲' };
    const chip = document.createElement('span');
    chip.className = `status-chip ${k}`;
    chip.textContent = `${names[k] || k} ${turns}T`;
    stRow.appendChild(chip);
  }

  $('bat-hero-lv').textContent = state.level;
  $('bat-hero-hpbar').style.width = `${clamp((state.hp / stats.maxHp) * 100, 0, 100)}%`;
  $('bat-hero-hp').textContent = `${Math.max(0, Math.round(state.hp))} / ${stats.maxHp}`;
  $('bat-hero-mpbar').style.width = `${clamp((state.energy / stats.maxEnergy) * 100, 0, 100)}%`;
  $('bat-hero-mp').textContent = `${Math.max(0, Math.round(state.energy))} / ${stats.maxEnergy}`;

  const shEl = $('bat-hero-shield');
  if (battle.heroShield > 0) {
    shEl.classList.remove('hidden');
    shEl.textContent = `护盾 ${Math.round(battle.heroShield)}`;
  } else {
    shEl.classList.add('hidden');
  }

  const gCard = $('bat-guardian-card');
  const guard = state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null;
  if (guard) {
    gCard.classList.remove('hidden');
    gCard.querySelector('.guardian-seal').textContent = guard.seal;
    gCard.querySelector('.guardian-name').textContent = guard.name;
    gCard.querySelector('.guardian-skill').textContent = guard.skillName;
  } else {
    gCard.classList.add('hidden');
  }
  renderBattleGuardianFighter();
}

function logBattle(msg) {
  if ($('bat-log')) $('bat-log').textContent = msg;
}

let battleAmbientRaf = 0;
let battleAmbientResizeHandler = null;

function stopBattleAmbient() {
  if (battleAmbientRaf) {
    cancelAnimationFrame(battleAmbientRaf);
    battleAmbientRaf = 0;
  }
  if (battleAmbientResizeHandler) {
    window.removeEventListener('resize', battleAmbientResizeHandler);
    battleAmbientResizeHandler = null;
  }
  const canvas = $('bat-ambient-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startBattleAmbient() {
  stopBattleAmbient();
  const canvas = $('bat-ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(320, Math.round(rect.width || window.innerWidth));
    h = Math.max(240, Math.round(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  battleAmbientResizeHandler = resize;
  window.addEventListener('resize', resize);

  // 24 drifting warm vermilion-gold battle embers
  const embers = Array.from({ length: 24 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: -(0.35 + Math.random() * 0.75),
    vy: -(0.22 + Math.random() * 0.55),
    r: 1.1 + Math.random() * 2.1,
    alpha: 0.28 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.55 ? 'ember' : 'gold'
  }));

  // 14 rising jade-cyan cable sparks near lower third
  const sparks = Array.from({ length: 14 }, () => ({
    x: Math.random() * w,
    y: h * (0.64 + Math.random() * 0.34),
    vx: (Math.random() - 0.5) * 0.28,
    vy: -(0.45 + Math.random() * 0.65),
    r: 0.9 + Math.random() * 1.6,
    alpha: 0.32 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2
  }));

  // 4 slow-drifting translucent ink-mist bands along the stone floor
  const mists = Array.from({ length: 4 }, (_, idx) => ({
    x: (idx / 4) * w,
    yRatio: 0.63 + idx * 0.065,
    rxRatio: 0.28 + (idx % 2) * 0.12,
    ry: 28 + idx * 9,
    vx: (idx % 2 === 0 ? 1 : -1) * (0.14 + idx * 0.04),
    alpha: 0.08 + (idx % 2) * 0.04,
    tint: idx % 2 === 0 ? 'rgba(94, 234, 212,' : 'rgba(20, 24, 30,'
  }));

  let t = 0;
  const tick = () => {
    if (!battle) {
      stopBattleAmbient();
      return;
    }
    t += 0.016;
    ctx.clearRect(0, 0, w, h);

    // 1. Stone-floor ink-mist bands
    for (let i = 0; i < mists.length; i++) {
      const m = mists[i];
      m.x += m.vx;
      const rx = w * m.rxRatio;
      if (m.vx > 0 && m.x - rx > w) m.x = -rx;
      if (m.vx < 0 && m.x + rx < 0) m.x = w + rx;
      const cy = h * m.yRatio + Math.sin(t * 0.5 + i) * 5;
      ctx.save();
      ctx.translate(m.x, cy);
      ctx.scale(1, m.ry / Math.max(rx, 1));
      const grad = ctx.createRadialGradient(0, 0, rx * 0.05, 0, 0, rx);
      grad.addColorStop(0, `${m.tint}${m.alpha.toFixed(3)})`);
      grad.addColorStop(0.55, `${m.tint}${(m.alpha * 0.45).toFixed(3)})`);
      grad.addColorStop(1, `${m.tint}0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Drifting vermilion-gold battle embers
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.x += p.vx + Math.sin(t * 1.4 + p.phase) * 0.25;
      p.y += p.vy;
      if (p.x < -12) p.x = w + 12;
      if (p.y < -12) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      const flicker = 0.65 + 0.35 * Math.sin(t * 3.8 + p.phase);
      const a = p.alpha * flicker;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.hue === 'ember' ? '#f97349' : '#f3ce7a';
      ctx.shadowColor = p.hue === 'ember' ? 'rgba(232, 86, 58, 0.85)' : 'rgba(229, 187, 92, 0.85)';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Rising jade-cyan cable sparks near lower third
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.x += s.vx + Math.sin(t * 2.1 + s.phase) * 0.2;
      s.y += s.vy;
      if (s.y < h * 0.42) {
        s.y = h * (0.82 + Math.random() * 0.18);
        s.x = Math.random() * w;
      }
      const fadeTop = clamp((s.y - h * 0.42) / (h * 0.22), 0, 1);
      const flicker = 0.6 + 0.4 * Math.sin(t * 5.2 + s.phase);
      ctx.save();
      ctx.globalAlpha = s.alpha * fadeTop * flicker;
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.72)';
      ctx.lineWidth = s.r * 0.8;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 3, s.y + 5.5);
      ctx.stroke();
      ctx.fillStyle = '#99f6e4';
      ctx.shadowColor = 'rgba(94, 234, 212, 0.9)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    battleAmbientRaf = requestAnimationFrame(tick);
  };

  battleAmbientRaf = requestAnimationFrame(tick);
}

function startBattle(worldEnemy, skipPreCutscene = false) {
  if (battle) return;
  const tpl = worldEnemy.data || ENEMIES[worldEnemy.enemyId] || ENEMIES.rat;
  if (!skipPreCutscene && tpl.isBoss) {
    const preId = `pre_${tpl.id}`;
    state.seenCutscenes = state.seenCutscenes || [];
    if (STORY_CUTSCENES[preId] && !state.seenCutscenes.includes(preId)) {
      closeDialog(true);
      closeModal();
      playStoryCutscene(preId, { onComplete: () => startBattle(worldEnemy, true) });
      return;
    }
  }
  closeDialog(true);
  closeModal();
  if (world) world.paused = true;

  if (!state.seenEnemies.includes(tpl.id)) {
    state.seenEnemies.push(tpl.id);
  }

  battle = {
    worldEnemy,
    tpl,
    enemy: {
      hp: tpl.hp,
      maxHp: tpl.hp,
      atk: tpl.atk,
      def: tpl.def
    },
    turn: 1,
    busy: false,
    phase2: false,
    healedHalf: false,
    captureBonus: 0,
    heroShield: 0,
    dmgReduceTurns: 0,
    overdriveTurns: 0,
    heroStatus: { burn: 0, poison: 0 },
    enemyStatus: { burn: 0, poison: 0, stun: 0, def_down: 0 }
  };

  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  const vfxLayer = $('bat-vfx-layer');
  if (vfxLayer) vfxLayer.innerHTML = '';

  const enemyCrest = $('bat-enemy-crest');
  if (enemyCrest) {
    enemyCrest.innerHTML = renderVisualThumb('spirit', tpl, 44);
    enemyCrest.classList.toggle('is-boss', !!tpl.isBoss);
  }

  const enemyVisual = $('bat-enemy-visual');
  if (enemyVisual) {
    enemyVisual.classList.remove('hit', 'hit-flash', 'lunge-right', 'is-defeated', 'is-captured', 'is-captured-done', 'capture-break-free');
    enemyVisual.innerHTML = buildEnemySvg(tpl);
  }
  renderBattleGuardianFighter();
  const heroBatImg = $('bat-hero-portrait');
  if (heroBatImg) {
    heroBatImg.src = 'assets/sprites/hero_battle.png';
    heroBatImg.style.objectFit = 'contain';
    heroBatImg.style.background = 'transparent';
    heroBatImg.classList.remove('hit', 'hit-flash', 'lunge-left');
  }
  const battleOverlay = $('rpg-battle-overlay');
  battleOverlay?.classList.remove('hidden', 'enemy-turn', 'screen-shake');

  logBattle(tpl.introLine || `遭遇「${tpl.name}」！凝神戒备，准备迎战！`);
  setBattleButtonsEnabled(true);
  updateBattleUI();
  startBattleAmbient();
  sfx.alarm();
  sfx.playBgm?.(tpl.isBoss ? 'boss' : 'battle');
}

function closeBattle(skipSave = false) {
  battle = null;
  battleSubMode = null;
  stopBattleAmbient();
  const vfxLayer = $('bat-vfx-layer');
  if (vfxLayer) vfxLayer.innerHTML = '';
  $('bat-subpanel')?.classList.add('hidden');
  $('rpg-battle-overlay')?.classList.add('hidden');
  if (world) {
    world.paused = false;
    world.setEncounterCooldown(2.0);
  }
  sfx.playBgm?.(getBgmTrackForMap(state.mapId));
  updateHUD();
  if (!skipSave) scheduleSave();
}

function triggerHitAnim(isEnemy, strong = false) {
  const el = isEnemy ? $('bat-enemy-visual') : ($('bat-hero-portrait') || document.querySelector('.hero-portrait-battle'));
  if (!el) return;
  const dur = strong ? 320 : 260;
  triggerClassAnim(el, 'hit-flash', dur);
  triggerClassAnim(el, 'hit', dur);
  if (strong && gameSettings.screenShakeEnabled) {
    triggerClassAnim($('rpg-battle-overlay'), 'screen-shake', 340);
  }
}

function calcDamageToEnemy(mult = 1, opts = {}) {
  const stats = getHeroStats();
  let atk = stats.atk;
  if (battle.overdriveTurns > 0) atk = Math.round(atk * 1.3);

  let def = battle.enemy.def;
  if (battle.enemyStatus.def_down > 0) def = Math.round(def * 0.75);
  const pen = opts.ignoreDef ? 1 : clamp(stats.armorPen + (opts.armorPen || 0), 0, 1);
  const effDef = Math.round(def * (1 - pen));

  const baseDmg = atk * mult;
  let dmg = Math.max(4, Math.round(baseDmg * (100 / (100 + effDef * 1.15))));
  if (opts.isArtillery && stats.artilleryBonus > 0) {
    dmg = Math.round(dmg * (1 + stats.artilleryBonus));
  }
  if (opts.isSkill && stats.skillBonus > 0) {
    dmg = Math.round(dmg * (1 + stats.skillBonus));
  }
  const isMechTarget = ['drone', 'flame_mech', 'guard', 'auto_turret', 'heavy_mech', 'mech_taotie', 'boss_zhurong', 'boss_tianshu'].includes(battle.tpl.spriteType);
  if (isMechTarget && stats.mechBonus > 0) {
    dmg = Math.round(dmg * (1 + stats.mechBonus));
  }

  const critRate = opts.guaranteedCrit ? 1 : clamp(stats.crit + (opts.critBonus || 0), 0, 0.95);
  const isCrit = Math.random() < critRate;
  if (isCrit) dmg = Math.round(dmg * 1.65);

  dmg += stats.bonusDmg || 0;
  return { dmg, isCrit, lifesteal: stats.lifesteal || 0 };
}

function applyGuardianTurn(logs) {
  const guard = state.activeGuardianId ? GUARDIANS[state.activeGuardianId] : null;
  if (!guard || battle.enemy.hp <= 0) return false;

  const stats = getHeroStats();
  triggerGuardianLunge();
  spawnGuardianAssistVfx(guard);

  if (guard.healHp && !guard.baseDmg) {
    state.hp = Math.min(stats.maxHp, state.hp + guard.healHp);
    if (guard.healMp) state.energy = Math.min(stats.maxEnergy, state.energy + guard.healMp);
    if (guard.effect === 'cleanse') {
      battle.heroStatus.burn = 0;
      battle.heroStatus.poison = 0;
    }
    spawnBattleDmgNum('hero', `+${guard.healHp} HP`, 'heal');
    sfx.pick?.('fine');
    logs.push(`护驾【${guard.name}】施展「${guard.skillName}」回复 ${guard.healHp} 气血！`);
    return true;
  }

  if (guard.shield) {
    battle.heroShield += guard.shield;
    spawnBattleDmgNum('hero', `护盾 +${guard.shield}`, 'shield', { offsetY: -22 });
  }

  const raw = (guard.baseDmg || 20) + (guard.perLvDmg ? state.level * guard.perLvDmg : 0);
  const dmg = guard.ignoreDef ? raw : Math.max(5, Math.round(raw - battle.enemy.def * 0.4));
  battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
  triggerHitAnim(true);
  spawnBattleDmgNum('enemy', `-${dmg}`, 'mystic', { offsetY: -24 });
  sfx.playCombatSfx?.('mystic', false);

  if (guard.effect === 'poison') battle.enemyStatus.poison = 3;
  if (guard.effect === 'armor_break' && Math.random() < 0.35) battle.enemyStatus.def_down = 2;
  if (guard.effect === 'lifesteal' && guard.healHp) {
    state.hp = Math.min(stats.maxHp, state.hp + guard.healHp);
    spawnBattleDmgNum('hero', `+${guard.healHp} HP`, 'heal');
  }
  logs.push(`护驾【${guard.name}】发动「${guard.skillName}」造成 ${dmg} 伤害！`);
  return true;
}

function handleBattleVictory(captured = false) {
  const tpl = battle.tpl;
  const wEn = battle.worldEnemy;
  if (wEn) {
    wEn.alive = false;
    wEn.respawnTimer = tpl.isBoss ? Infinity : 45;
  }

  const curMap = world?.map || MAPS_BY_ID[state.mapId] || MAPS_BY_ID.town;
  const regionIdx = getRegionTierIndex(curMap);
  const stats = getHeroStats();

  const expGain = captured ? Math.round(tpl.exp * 0.65) : tpl.exp;
  const goldGain = captured ? Math.round(tpl.gold * 0.65) : tpl.gold;
  state.gold += goldGain;
  state.stats.battleWin = (state.stats.battleWin || 0) + 1;
  if (['heavy_mech', 'auto_turret', 'mech_taotie'].includes(tpl.id)) {
    state.stats.defeatHeavy = (state.stats.defeatHeavy || 0) + 1;
  }

  const dropList = [];
  if (tpl.isBoss) {
    if (!state.defeatedBosses.includes(tpl.id)) state.defeatedBosses.push(tpl.id);
    world?.setDefeatedBosses?.(state.defeatedBosses);
    if (tpl.dropSpiritId) {
      state.capturedSpirits[tpl.dropSpiritId] = (state.capturedSpirits[tpl.dropSpiritId] || 0) + 1;
    }
    if (tpl.id === 'boss_duangang' && !state.stories.includes(1)) {
      unlockStoryRelic(1);
      dropList.push('信物·旧磁带');
    }
    if (tpl.dropStoryId !== undefined) {
      unlockStoryRelic(tpl.dropStoryId);
    }
    const bossAntique = grantUncollectedAntique();
    if (bossAntique) {
      dropList.push(`古董·${bossAntique.name}`);
    }
    advanceQuestTrigger(`defeat_${tpl.id}`);

    // 1. Boss 100% 必掉高阶暗黑词缀装备（2–3 强力词缀）
    const bossPool = {
      boss_ratking: ['wpn_inkblade', 'armor_ironwire', 'mech_steam_core'],
      boss_duangang: ['wpn_shotgun', 'wpn_qingcheng', 'wpn_sniper'],
      boss_zhurong: ['wpn_gatling', 'mech_crimson_frame', 'wpn_pulsesword'],
      boss_lotus_bane: ['relic_fox_orb', 'armor_exo', 'wpn_plasma_rifle'],
      boss_tianshu: ['wpn_xuanyuan', 'mech_tianshu_exo', 'relic_tianshu']
    }[tpl.id] || (REGION_EQUIP_POOLS[regionIdx] || ['wpn_qingcheng']);

    const isMidLateBoss = ['boss_zhurong', 'boss_lotus_bane', 'boss_tianshu'].includes(tpl.id);
    const bossQuality = tpl.isFinalBoss
      ? 'legend'
      : tpl.id === 'boss_lotus_bane'
        ? (Math.random() < 0.7 ? 'legend' : 'rare')
        : tpl.id === 'boss_zhurong'
          ? (Math.random() < 0.5 ? 'legend' : 'rare')
          : 'rare';
    const eq = rollBossTierEquipment(
      bossPool[Math.floor(Math.random() * bossPool.length)],
      bossQuality,
      bossQuality === 'legend' || isMidLateBoss
    );
    if (eq) {
      addEquipmentToBag(eq);
      dropList.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
    }

    // 2. Boss 100% 必掉 1–2 件稀有锻造材料 / 稀世丹药
    const rareMatId = BOSS_RARE_MATS[Math.floor(Math.random() * BOSS_RARE_MATS.length)];
    const matRes = grantItemToBagOrGold(rareMatId, 'rare', stats);
    if (matRes) dropList.push(matRes.label);

    if (Math.random() < 0.65) {
      state.elixirs.elixir_jiuzhuan = (state.elixirs.elixir_jiuzhuan || 0) + 1;
      dropList.push(`稀世丹药·${ELIXIRS.elixir_jiuzhuan?.name || '九转青瘴丹'}`);
    } else {
      const rareMatId2 = BOSS_RARE_MATS[Math.floor(Math.random() * BOSS_RARE_MATS.length)];
      const matRes2 = grantItemToBagOrGold(rareMatId2, 'rare', stats);
      if (matRes2) dropList.push(matRes2.label);
    }
  } else {
    // 普通怪物：~65% 概率掉落 1–2 件区域废土材料/科技件/草药/补给
    if (Math.random() < 0.65) {
      const mPool = REGION_MONSTER_DROPS[regionIdx] || REGION_MONSTER_DROPS[0];
      const count = Math.random() < 0.42 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const itemId = mPool[Math.floor(Math.random() * mPool.length)];
        const iq = rollQuality(0.95);
        const res = grantItemToBagOrGold(itemId, iq, stats);
        if (res) dropList.push(res.label);
      }
    }

    // 普通怪物：~30% 概率掉落匹配当前区域的暗黑词缀装备
    if (!captured && Math.random() < 0.30) {
      const eqPool = REGION_EQUIP_POOLS[regionIdx] || REGION_EQUIP_POOLS[0];
      const pick = eqPool[Math.floor(Math.random() * eqPool.length)];
      const eq = rollEquipment(pick, rollMonsterEquipQuality(regionIdx));
      if (eq) {
        addEquipmentToBag(eq);
        dropList.push(`【${QUALITY[eq.quality].name}】${eq.name}`);
      }
    }

    // 普通怪物：8% 保底概率掉落尚未收录的战前古董，杜绝真结局卡死
    if (Math.random() < 0.08) {
      const pityAntique = grantUncollectedAntique();
      if (pityAntique) {
        dropList.push(`古董·${pityAntique.name}`);
      }
    }
  }

  const extraMsg = dropList.length ? ` 战利品：${dropList.join('、')}！` : '';

  const enemyVisual = $('bat-enemy-visual');
  if (enemyVisual) {
    if (captured && (enemyVisual.classList.contains('is-captured') || enemyVisual.classList.contains('is-captured-done'))) {
      enemyVisual.classList.remove('hit', 'hit-flash', 'lunge-right', 'is-defeated', 'is-captured');
      enemyVisual.classList.add('is-captured-done');
    } else {
      enemyVisual.classList.remove('hit', 'hit-flash', 'lunge-right', 'is-defeated', 'is-captured', 'is-captured-done');
      enemyVisual.classList.add(captured ? 'is-captured' : 'is-defeated');
    }
  }

  setTimeout(() => sfx.ending(), 200);
  logBattle((captured ? `收妖成功！${tpl.spiritName}已入天工墨壶！` : (tpl.defeatLine || `击败「${tpl.name}」！`)) + ` 获 +${expGain} 经验、+${goldGain} 币！${extraMsg}`);
  if (tpl.isBoss && dropList.length) {
    showToast(`首领战利品：+${goldGain} 币、${dropList.join('、')}！`, 'success');
  } else if (dropList.length) {
    showToast(`战利品：${dropList.join('、')}`, 'info');
  }
  gainExp(expGain);

  const isFinal = Boolean(tpl.isFinalBoss && !captured);
  const postCutsceneId = tpl.isBoss ? `post_${tpl.id}` : null;
  setTimeout(() => {
    closeBattle();
    if (postCutsceneId && STORY_CUTSCENES[postCutsceneId] && !(state.seenCutscenes || []).includes(postCutsceneId)) {
      playStoryCutscene(postCutsceneId, {
        onComplete: () => {
          if (isFinal) openEndingModal();
        }
      });
    } else if (isFinal) {
      openEndingModal();
    }
  }, 1100);
}

function getLatestSavedSlot() {
  const slots = storage.listSlots(currentUser) || [];
  const valid = slots.filter((s) => !s.empty && s.savedAt > 0);
  if (!valid.length) return slots.find((s) => !s.empty) || null;
  valid.sort((a, b) => b.savedAt - a.savedAt);
  return valid[0];
}

function loadFromSlot(slotId, slotLabel = '存档') {
  const data = storage.loadSlot(currentUser, slotId);
  if (!data) {
    showToast('该存档槽位为空！', 'warn');
    return false;
  }
  state = migrateState(data);
  const loadedStats = getHeroStats();
  if (!Number.isFinite(state.hp) || state.hp <= 0) {
    state.hp = Math.max(1, Math.round(loadedStats.maxHp * 0.5));
  }
  closeModal(false, true);
  enterMap(state.mapId, state.heroX, state.heroY);
  sfx.ending();
  showToast(`已读取「${slotLabel}」：回到 ${MAPS_BY_ID[state.mapId]?.name || '墨石镇'}！`, 'success');
  return true;
}

function handleBattleDefeat() {
  const isBoss = Boolean(battle?.tpl?.isBoss);
  const bossName = battle?.tpl?.name || '强敌';
  const stats = getHeroStats();
  sfx.alarm();

  if (isBoss) {
    const latest = getLatestSavedSlot();
    logBattle(`败于首领【${bossName}】之手！可选择读取最近存档重战，或撤回墨石镇医馆休整。`);
    setTimeout(() => {
      closeBattle(true);
      openModal(
        `首领战败 · ${bossName}`,
        `<div class="modal-list-item">
          <div class="modal-item-desc">你在与首领「${escapeHtml(bossName)}」的激战中气血耗尽。<br/>可立即读取最近记录碑存档重新迎战，或损失 15% 废土币撤回墨石镇医馆。</div>
        </div>`,
        `
          ${latest ? `<button class="btn btn-purple" id="btn-boss-reload">读取最近存档 (${escapeHtml(latest.label)})</button>` : ''}
          <button class="btn btn-amber" id="btn-boss-retreat">撤回墨石镇医馆</button>
        `,
        { locked: true }
      );
      $('btn-boss-reload')?.addEventListener('click', () => {
        loadFromSlot(latest.slotId, latest.label);
      });
      $('btn-boss-retreat')?.addEventListener('click', () => {
        const loss = Math.min(state.gold, Math.round(state.gold * 0.15));
        state.gold -= loss;
        state.hp = Math.round(stats.maxHp * 0.6);
        state.energy = Math.round(stats.maxEnergy * 0.6);
        closeModal(false, true);
        enterMap('town', 1240, 365);
        showToast(`已撤回墨石镇医馆，损失 ${loss} 废土币。`, 'warn');
      });
    }, 650);
    return;
  }

  const loss = Math.min(state.gold, Math.round(state.gold * 0.15));
  state.gold -= loss;
  state.hp = Math.round(stats.maxHp * 0.6);
  state.energy = Math.round(stats.maxEnergy * 0.6);
  logBattle(`气血耗尽！你被商队救回墨石镇医馆，损失 ${loss} 废土币……`);
  setTimeout(() => {
    closeBattle();
    enterMap('town', 1240, 365);
  }, 1200);
}

function checkBossMidBattleEvents(logs) {
  const tpl = battle.tpl;
  const ratio = battle.enemy.hp / battle.enemy.maxHp;
  if (tpl.enrageAt && !battle.phase2 && ratio <= tpl.enrageAt && battle.enemy.hp > 0) {
    battle.phase2 = true;
    battle.enemy.atk = Math.round(battle.enemy.atk * 1.25);
    logs.push(tpl.phase2Line || `${tpl.name}进入二阶段狂暴，攻击力大增！`);
  }
  if (tpl.healAtHalf && !battle.healedHalf && ratio <= 0.5 && battle.enemy.hp > 0) {
    battle.healedHalf = true;
    battle.enemy.hp = Math.min(battle.enemy.maxHp, battle.enemy.hp + tpl.healAtHalf);
    spawnBattleDmgNum('enemy', `+${tpl.healAtHalf} HP`, 'heal');
    logs.push(`${tpl.name}触发毒瘴再生，恢复 ${tpl.healAtHalf} 点气血！`);
  }
}

function runEnemyTurn(prevLogs = []) {
  if (!battle) return;
  const logs = [...prevLogs];
  const stats = getHeroStats();

  // 敌人持续伤害结算
  if (battle.enemyStatus.burn > 0) {
    battle.enemy.hp = Math.max(0, battle.enemy.hp - 22);
    battle.enemyStatus.burn -= 1;
    spawnBattleDmgNum('enemy', '灼烧 -22', 'physical', { offsetY: -30 });
    logs.push('【灼烧】造成 22 点火焰伤害！');
  }
  if (battle.enemyStatus.poison > 0) {
    battle.enemy.hp = Math.max(0, battle.enemy.hp - 18);
    battle.enemyStatus.poison -= 1;
    spawnBattleDmgNum('enemy', '剧毒 -18', 'heal', { offsetY: -30 });
    logs.push('【剧毒】造成 18 点毒素伤害！');
  }
  if (battle.enemyStatus.def_down > 0) battle.enemyStatus.def_down -= 1;

  if (battle.enemy.hp <= 0) {
    updateBattleUI();
    handleBattleVictory(false);
    return;
  }

  checkBossMidBattleEvents(logs);

  // 护驾出击（独立节拍，让玩家清楚看到灵兽跃出协战）
  const guardianActed = applyGuardianTurn(logs);
  if (guardianActed) {
    updateBattleUI();
    logBattle(logs.slice(-2).join(' '));
  }
  if (battle.enemy.hp <= 0) {
    setTimeout(() => {
      if (battle) handleBattleVictory(false);
    }, guardianActed ? 560 : 120);
    return;
  }

  const finishEnemyStrike = () => {
    if (!battle) return;

    // 主角回息
    if (stats.mpRegen > 0) {
      state.energy = Math.min(stats.maxEnergy, state.energy + stats.mpRegen);
    }

    let enemyStruck = false;
    // 敌方行动
    if (battle.enemyStatus.stun > 0) {
      battle.enemyStatus.stun -= 1;
      spawnBattleDmgNum('enemy', '眩晕!', 'mystic', { offsetY: -18 });
      logs.push(`${battle.tpl.name}陷入【眩晕】，无法行动！`);
    } else {
      enemyStruck = true;
      const tpl = battle.tpl;
      const isSpecial = tpl.specialEvery && (battle.turn % tpl.specialEvery === 0);
      const mult = isSpecial ? (tpl.specialMult || 1.5) : 1;
      const baseEnemyDmg = battle.enemy.atk * mult;
      let rawDmg = Math.max(4, Math.round(baseEnemyDmg * (100 / (100 + stats.def * 1.15))));
      let reduce = stats.dmgReduce + (battle.dmgReduceTurns > 0 ? 0.30 : 0);
      rawDmg = Math.max(2, Math.round(rawDmg * (1 - clamp(reduce, 0, 0.78))));

      let absorbed = 0;
      if (battle.heroShield > 0) {
        absorbed = Math.min(battle.heroShield, rawDmg);
        battle.heroShield -= absorbed;
        rawDmg -= absorbed;
      }

      state.hp = Math.max(0, state.hp - rawDmg);
      triggerBattleLunge(false);
      triggerHitAnim(false, isSpecial);
      spawnBattleSlashVfx('hero', 'enemy');
      sfx.playEnemyAttackSfx?.(tpl);
      if (rawDmg > 0) {
        spawnBattleDmgNum('hero', isSpecial ? `${tpl.specialName || '重创'} -${rawDmg}` : `-${rawDmg}`, 'enemy-hit');
      } else if (absorbed > 0) {
        spawnBattleDmgNum('hero', '护盾格挡!', 'shield');
      }
      logs.push(isSpecial
        ? `${tpl.name}发动绝招【${tpl.specialName}】，造成 ${rawDmg} 点重创！`
        : `${tpl.name}发起猛攻，造成 ${rawDmg} 点伤害！`);

      if (isSpecial && tpl.inflicts) {
        battle.heroStatus[tpl.inflicts] = 2;
        logs.push(`你陷入了【${tpl.inflicts === 'burn' ? '灼烧' : '剧毒'}】状态！`);
      }
    }

    // 主角持续减益
    if (battle.heroStatus.burn > 0) {
      const d = Math.round(14 * (1 - stats.radResist));
      state.hp = Math.max(0, state.hp - d);
      battle.heroStatus.burn -= 1;
      if (d > 0) spawnBattleDmgNum('hero', `灼烧 -${d}`, 'enemy-hit', { offsetY: -28 });
    }
    if (battle.heroStatus.poison > 0) {
      const d = Math.round(14 * (1 - stats.radResist));
      state.hp = Math.max(0, state.hp - d);
      battle.heroStatus.poison -= 1;
      if (d > 0) spawnBattleDmgNum('hero', `剧毒 -${d}`, 'enemy-hit', { offsetY: -28 });
    }

    if (battle.dmgReduceTurns > 0) battle.dmgReduceTurns -= 1;
    if (battle.overdriveTurns > 0) battle.overdriveTurns -= 1;
    battle.captureBonus = 0;
    battle.turn += 1;

    updateBattleUI();
    updateHUD();
    logBattle(logs.slice(-2).join(' '));

    if (state.hp <= 0) {
      setTimeout(() => {
        if (battle) handleBattleDefeat();
      }, 420);
      return;
    }

    setTimeout(() => {
      if (!battle) return;
      battle.busy = false;
      setBattleButtonsEnabled(true);
    }, enemyStruck ? 520 : 280);
  };

  if (guardianActed) {
    setTimeout(finishEnemyStrike, 540);
  } else {
    finishEnemyStrike();
  }
}

function battlePlayerAttack() {
  if (!battle || battle.busy) return;
  battle.busy = true;
  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  setBattleButtonsEnabled(false);

  const stats = getHeroStats();
  const { dmg, isCrit, lifesteal } = calcDamageToEnemy(1, {});
  const branch = getEquippedWeaponBranch();
  const wType = state.equipped?.weapon?.weaponType || '';
  const isHeavy = Boolean(isCrit || wType === 'cannon' || wType === 'heavy' || wType === 'railgun');

  triggerBattleLunge(true);
  const { impactMs, totalMs } = spawnBattleCombatVfx(branch, { isCrit });
  if (typeof sfx.playBasicAttackSfx === 'function') {
    sfx.playBasicAttackSfx(state.equipped?.weapon);
  } else if (typeof sfx.playCombatSfx === 'function') {
    sfx.playCombatSfx(branch, isHeavy);
  } else {
    sfx.disassemble(true, isCrit);
  }

  const logs = [`沈砚挥兵直击，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`];
  logBattle(`沈砚运转兵锋，蓄势直击【${battle.tpl.name}】！`);

  // 命中瞬间结算顿挫与飘字
  setTimeout(() => {
    if (!battle) return;
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    triggerHitAnim(true, isHeavy);
    const dmgStyle = isCrit ? 'crit' : (branch === 'martial' ? 'physical' : branch);
    spawnBattleDmgNum('enemy', isCrit ? `暴击! -${dmg}` : `-${dmg}`, dmgStyle);

    if (lifesteal > 0) {
      const heal = Math.max(1, Math.round(dmg * lifesteal));
      state.hp = Math.min(stats.maxHp, state.hp + heal);
      spawnBattleDmgNum('hero', `+${heal} HP`, 'heal', { offsetY: -18 });
      logs.push(`吸血回复 +${heal} 气血！`);
    }
    if (stats.proc === 'burn' && Math.random() < 0.25) {
      battle.enemyStatus.burn = 2;
      logs.push('武器触发【灼烧】！');
    }

    updateBattleUI();
    logBattle(logs.join(' '));
  }, impactMs);

  setTimeout(() => {
    if (!battle) return;
    if (battle.enemy.hp <= 0) {
      handleBattleVictory(false);
      return;
    }
    runEnemyTurn(logs);
  }, totalMs);
}

function battleUseSkill(skill) {
  if (!battle || battle.busy) return;
  if (state.level < skill.unlockLv) {
    showToast(`需修为 Lv.${skill.unlockLv} 解锁【${skill.name}】`, 'warn');
    return;
  }
  if (state.energy < skill.mpCost) {
    showToast(`内息不足（需 ${skill.mpCost} 点）`, 'warn');
    return;
  }

  battle.busy = true;
  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  setBattleButtonsEnabled(false);

  const stats = getHeroStats();
  state.energy -= skill.mpCost;
  const logs = [];
  const flavorPrefix = skill.flavor ? `${skill.flavor} ` : '';

  if (skill.selfBuff) {
    const container = getBattleVfxContainer();
    if (container) {
      const { x, y } = getBattleTargetPos('hero', container, 0, 8);
      const aura = document.createElement('div');
      aura.className = 'vfx-hero-buff-aura';
      aura.style.left = `${Math.round(x)}px`;
      aura.style.top = `${Math.round(y)}px`;
      container.appendChild(aura);
      setTimeout(() => aura.remove(), 680);
    }

    if (skill.selfBuff === 'shield') {
      const sh = (skill.baseShield || 45) + state.level * (skill.perLvShield || 8);
      battle.heroShield += sh;
      battle.dmgReduceTurns = 2;
      spawnBattleDmgNum('hero', `护盾 +${sh}`, 'shield');
      sfx.playSkillSfx?.(skill.id, skill.branch || skill.category || 'mystic');
      logs.push(`${flavorPrefix}施展【${skill.name}】，获得 ${sh} 点护盾并减伤 30%！`);
    } else if (skill.selfBuff === 'overdrive') {
      const sh = skill.baseShield || 65;
      battle.heroShield += sh;
      battle.overdriveTurns = 3;
      spawnBattleDmgNum('hero', `护盾 +${sh}`, 'shield');
      spawnBattleDmgNum('hero', '狂涌 +30%', 'mystic', { offsetY: -30 });
      sfx.playSkillSfx?.(skill.id, skill.branch || skill.category || 'mecha');
      logs.push(`${flavorPrefix}启动【${skill.name}】，护盾 +${sh}，3 回合内攻击 +30%！`);
    } else if (skill.selfBuff === 'heal') {
      const heal = Math.round(stats.maxHp * (skill.healPct || 0.45));
      state.hp = Math.min(stats.maxHp, state.hp + heal);
      if (skill.cleanse) {
        battle.heroStatus.burn = 0;
        battle.heroStatus.poison = 0;
      }
      spawnBattleDmgNum('hero', `+${heal} HP`, 'heal');
      sfx.playSkillSfx?.(skill.id, skill.branch || skill.category || 'mystic');
      logs.push(`${flavorPrefix}运转【${skill.name}】，恢复 ${heal} 气血并净化负面状态！`);
    }

    updateBattleUI();
    logBattle(logs.join(' '));
    setTimeout(() => runEnemyTurn(logs), 780);
    return;
  }

  const { dmg, isCrit, lifesteal } = calcDamageToEnemy(skill.mult || 1.6, {
    critBonus: skill.critBonus,
    guaranteedCrit: skill.guaranteedCrit,
    armorPen: skill.armorPen,
    ignoreDef: skill.ignoreDef,
    isArtillery: skill.isArtillery,
    isSkill: true
  });
  const branch = skill.branch || skill.category || 'martial';
  const isHeavy = Boolean(
    (skill.mpCost || 0) >= 22 ||
    skill.isArtillery ||
    /cannon|railgun|missile|artillery/i.test(skill.id || '') ||
    (skill.mult || 1) >= 2.2
  );
  const isMysticOrMecha = branch === 'mystic' || branch === 'mecha';
  const dmgStyle = isCrit ? 'crit' : (isMysticOrMecha ? branch : (branch === 'firearm' ? 'firearm' : 'physical'));

  updateBattleUI();
  triggerBattleLunge(true);
  const { impactMs, totalMs } = spawnBattleCombatVfx(branch, { skillId: skill.id, isCrit });
  if (typeof sfx.playSkillSfx === 'function') {
    sfx.playSkillSfx(skill.id, branch);
  } else if (typeof sfx.playCombatSfx === 'function') {
    sfx.playCombatSfx(branch, isHeavy);
  } else {
    sfx.disassemble(true, true);
  }
  logBattle(`${flavorPrefix}施展绝学【${skill.name}】！`);
  logs.push(`${flavorPrefix}施展【${skill.name}】，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`);

  // 命中瞬间结算伤害与状态
  setTimeout(() => {
    if (!battle) return;
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    triggerHitAnim(true, isCrit || isHeavy);
    spawnBattleDmgNum('enemy', isCrit ? `暴击! -${dmg}` : `-${dmg}`, dmgStyle);

    if (lifesteal > 0) {
      const heal = Math.max(1, Math.round(dmg * lifesteal));
      state.hp = Math.min(stats.maxHp, state.hp + heal);
      spawnBattleDmgNum('hero', `+${heal} HP`, 'heal', { offsetY: -18 });
    }
    if (skill.debuff) battle.enemyStatus[skill.debuff] = 2;
    if (skill.stun) {
      battle.enemyStatus.stun = skill.stun;
      spawnBattleDmgNum('enemy', '眩晕!', 'mystic', { offsetY: -34 });
    }
    if (skill.captureBonus) battle.captureBonus = skill.captureBonus;

    updateBattleUI();
    logBattle(logs.join(' '));
  }, impactMs);

  setTimeout(() => {
    if (!battle) return;
    if (battle.enemy.hp <= 0) {
      handleBattleVictory(false);
      return;
    }
    runEnemyTurn(logs);
  }, totalMs);
}

function battleAttemptCapture() {
  if (!battle || battle.busy) return;
  if (!battle.tpl.capturable) {
    showToast('首领单位气场过强，无法直接收入天工墨壶！', 'warn');
    return;
  }
  battle.busy = true;
  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  setBattleButtonsEnabled(false);

  const ratio = battle.enemy.hp / battle.enemy.maxHp;
  let chance = ratio <= 0.4 ? (0.68 + (0.4 - ratio) * 0.75) : ratio <= 0.65 ? 0.30 : 0.12;
  chance = clamp(chance + (battle.captureBonus || 0), 0.1, 0.98);
  const succeeded = Math.random() < chance;
  const container = getBattleVfxContainer();

  // ===== Phase 1 — 祭壶飞出 (0ms → 420ms) =====
  triggerBattleLunge(true);
  logBattle(`沈砚挥袖祭出【天工墨壶】！青玉流光破空飞向「${battle.tpl.name}」！`);
  sfx.playCaptureSfx?.('throw');

  let crucibleEl = null;
  let baguaEl = null;
  let vortexEl = null;
  let sparksEl = null;

  const cleanupCaptureVfx = () => {
    crucibleEl?.remove();
    baguaEl?.remove();
    vortexEl?.remove();
    sparksEl?.remove();
  };

  if (container) {
    crucibleEl = document.createElement('div');
    crucibleEl.className = 'capture-crucible-throw';
    crucibleEl.innerHTML = `
      <img class="crucible-vessel-sprite" src="assets/sprites/crucible_vessel.png" alt="天工墨壶" />
      <span class="crucible-mouth-flare" aria-hidden="true"></span>`;
    container.appendChild(crucibleEl);
  }

  // ===== Phase 2 — 3D 泼墨太极地阵 + 手绘泼墨灵涡 + 金青灵火上升 (360ms → 1050ms) =====
  setTimeout(() => {
    if (!battle) { cleanupCaptureVfx(); return; }
    if (crucibleEl) crucibleEl.classList.add('is-hovering');
    logBattle(`泼墨太极大阵展开！倒悬天工墨壶倾泻灵涡，疯狂牵引【${battle.tpl.name}】妖魂！`);
    sfx.playCaptureSfx?.('vortex');

    if (container) {
      baguaEl = document.createElement('div');
      baguaEl.className = 'capture-ground-ink-wrap';
      baguaEl.innerHTML = `<img src="assets/sprites/wuxing_ink_wheel.png" alt="" class="capture-ground-ink-seal" aria-hidden="true" />`;
      container.appendChild(baguaEl);

      vortexEl = document.createElement('div');
      vortexEl.className = 'capture-vortex-beams';
      const ambientSparks = Array.from({ length: 11 }, (_, i) => {
        const sx = 24 + Math.round((i / 10) * 52);
        const sw = Math.round(Math.sin(i * 2.1) * 20);
        const sz = 5 + (i % 3) * 2;
        const sd = i * 85;
        const sc = i % 3 === 0 ? '#5eead4' : i % 3 === 1 ? '#f6d882' : '#c084fc';
        return `<span class="capture-spirit-spark" style="--sx:${sx}%;--sw:${sw}px;--sz:${sz}px;--sd:${sd}ms;--sc:${sc};"></span>`;
      }).join('');
      vortexEl.innerHTML = `
        <img src="assets/sprites/capture_ink_vortex.png" alt="" class="capture-ink-vortex-img" aria-hidden="true" />
        <div class="capture-vortex-sparks">${ambientSparks}</div>`;
      container.appendChild(vortexEl);
    }
  }, 360);

  // ===== Phase 3 — 妖魂吸入壶中 / 挣脱破阵 (920ms → 1550ms) =====
  setTimeout(() => {
    if (!battle) { cleanupCaptureVfx(); return; }
    const enemyVisual = $('bat-enemy-visual');

    if (succeeded) {
      if (crucibleEl) {
        crucibleEl.classList.remove('is-hovering');
        crucibleEl.classList.add('is-absorbing');
      }
      if (enemyVisual) {
        enemyVisual.classList.remove('hit', 'hit-flash', 'lunge-right', 'is-defeated', 'capture-break-free');
        enemyVisual.classList.add('is-captured');
      }
      if (gameSettings.screenShakeEnabled) {
        triggerClassAnim($('rpg-battle-overlay'), 'screen-shake', 340);
      }
      sfx.playCaptureSfx?.('success');

      if (container) {
        sparksEl = document.createElement('div');
        sparksEl.className = 'capture-spirit-sparks';
        const colors = ['#fde047', '#c084fc', '#5eead4', '#f3ce7a', '#e879f9'];
        sparksEl.innerHTML = Array.from({ length: 14 }, (_, i) => {
          const sx = 18 + Math.round((i / 13) * 64);
          const sw = Math.round((Math.sin(i * 1.9)) * 22);
          const sz = 7 + (i % 4) * 2;
          const sd = i * 32;
          const sc = colors[i % colors.length];
          return `<span class="capture-spark-orb" style="--sx:${sx}%;--sw:${sw}px;--sz:${sz}px;--sd:${sd}ms;--sc:${sc};"></span>`;
        }).join('');
        container.appendChild(sparksEl);
      }
      logBattle(`金紫妖魂化作流光，被强行吸入天工墨壶之中！`);
    } else {
      // 收妖失败：敌方剧烈震颤 + 朱砂冲击波震碎八卦阵
      if (enemyVisual) {
        triggerClassAnim(enemyVisual, 'capture-break-free', 540);
      }
      triggerHitAnim(true, true);
      baguaEl?.classList.add('is-shattering');
      vortexEl?.remove();
      vortexEl = null;
      if (crucibleEl) {
        crucibleEl.classList.remove('is-hovering');
        crucibleEl.classList.add('is-returning');
      }
      if (container) {
        const burst = document.createElement('div');
        burst.className = 'capture-shatter-burst';
        container.appendChild(burst);
        setTimeout(() => burst.remove(), 500);
      }
      spawnBattleDmgNum('enemy', '挣脱束缚!', 'capture');
      sfx.playCaptureSfx?.('fail');
      const logs = [`八卦大阵被震碎！${battle.tpl.name}挣脱了天工墨壶束缚！（当前血量 ${Math.round(ratio * 100)}%，压至 ≤40% 成功率极高）`];
      logBattle(logs[0]);

      setTimeout(() => {
        cleanupCaptureVfx();
        if (battle) runEnemyTurn(logs);
      }, 580);
    }
  }, 920);

  // ===== Phase 4 — 宝壶归掌 (1480ms → 1920ms，仅成功时) =====
  if (succeeded) {
    setTimeout(() => {
      if (!battle) { cleanupCaptureVfx(); return; }
      baguaEl?.classList.add('is-fading');
      vortexEl?.remove();
      vortexEl = null;
      if (crucibleEl) {
        crucibleEl.classList.remove('is-absorbing');
        crucibleEl.classList.add('is-returning');
      }
      if (container) {
        const calli = document.createElement('div');
        calli.className = 'capture-success-calligraphy';
        calli.textContent = '收入墨壶！';
        container.appendChild(calli);
        setTimeout(() => calli.remove(), 680);
      }
      sfx.pick?.('rare');
    }, 1480);

    setTimeout(() => {
      cleanupCaptureVfx();
      if (!battle) return;
      const id = battle.tpl.id;
      state.capturedSpirits[id] = (state.capturedSpirits[id] || 0) + 1;
      state.stats.capture = (state.stats.capture || 0) + 1;
      advanceQuestTrigger('capture_any');
      handleBattleVictory(true);
    }, 1920);
  }
}

function battleUseConsumable(kind, key) {
  if (!battle || battle.busy) return;
  const stats = getHeroStats();
  let effect = null;
  let label = '';

  if (kind === 'elixir') {
    if ((state.elixirs[key] || 0) <= 0) return;
    state.elixirs[key] -= 1;
    const elx = ELIXIRS[key];
    effect = elx.effect;
    label = elx.name;
  } else {
    const idx = state.bag.findIndex((b) => b.itemId === key);
    if (idx < 0) return;
    state.bag.splice(idx, 1);
    const it = ITEMS[key];
    effect = it.effect;
    label = it.name;
  }

  battle.busy = true;
  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  setBattleButtonsEnabled(false);

  if (effect?.clearWarn) {
    state.warn = 0;
    logBattle(`掷出【${label}】，烟幕弥漫，全身而退！`);
    sfx.pick('fine');
    setTimeout(() => closeBattle(), 650);
    return;
  }

  if (effect?.hp) {
    state.hp = Math.min(stats.maxHp, state.hp + effect.hp);
    spawnBattleDmgNum('hero', `+${effect.hp} HP`, 'heal');
  }
  if (effect?.energy) {
    state.energy = Math.min(stats.maxEnergy, state.energy + effect.energy);
    spawnBattleDmgNum('hero', `+${effect.energy} 内息`, 'mystic', { offsetY: effect?.hp ? -28 : 0 });
  }
  if (effect?.food) state.food = Math.min(100, state.food + effect.food);
  if (effect?.radShield) {
    state.radShield += effect.radShield;
    spawnBattleDmgNum('hero', `抗辐射护盾 +${effect.radShield}`, 'shield', { offsetY: -34 });
  }

  sfx.pick('fine');
  updateBattleUI();
  setTimeout(() => runEnemyTurn([`服下【${label}】，元气恢复！`]), 320);
}

function battleAttemptRun() {
  if (!battle || battle.busy) return;
  battle.busy = true;
  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  setBattleButtonsEnabled(false);

  const chance = clamp(0.55 + (state.skills[4] || 0) * 0.15 - (battle.tpl.isBoss ? 0.2 : 0), 0.25, 0.95);
  if (Math.random() < chance) {
    logBattle('脚踩墨影步，成功脱离战场！');
    setTimeout(() => closeBattle(), 550);
  } else {
    setTimeout(() => runEnemyTurn(['撤退路线被封锁，脱身失败！']), 320);
  }
}

const SKILL_ICON_COORDS = {
  // Row 0: 古武门派 (martial)
  sk_slash:     [0, 0],
  sk_palm:      [1, 0],
  sk_shatter:   [2, 0],
  sk_storm:     [3, 0],
  // Row 1: 现代军火 (firearm)
  sk_burst:     [0, 1],
  sk_shotgun:   [1, 1],
  sk_snipe:     [2, 1],
  sk_airstrike: [3, 1],
  // Row 2: 科幻墨甲 (mecha)
  sk_cannon:    [0, 2],
  sk_bits:      [1, 2],
  sk_overdrive: [2, 2],
  sk_railgun:   [3, 2],
  // Row 3: 仙妖奇术 (mystic)
  sk_shield:    [0, 3],
  sk_fire:      [1, 3],
  sk_heal:      [2, 3],
  sk_crucible:  [3, 3]
};

const SKILL_BRANCH_GLOW = {
  martial: 'rgba(229,184,92,0.62)',
  firearm: 'rgba(249,115,22,0.62)',
  mecha:   'rgba(56,189,248,0.65)',
  mystic:  'rgba(94,234,212,0.62)'
};

function _spriteCell(sheet, col, row, size = 44, shape = 'squircle', glowColor = '') {
  const s = Number(size) || 44;
  const xPct = (col / 3) * 100;
  const yPct = (row / 3) * 100;
  const glow = glowColor ? `--ico-glow:${glowColor};` : '';
  return `<span class="painted-ico ${shape}" style="width:${s}px;height:${s}px;background-image:url('assets/${sheet}');background-size:400% 400%;background-position:${xPct}% ${yPct}%;${glow}" aria-hidden="true"></span>`;
}

function renderSkillIcon(skill, size = 44) {
  const s = Number(size) || 44;
  const id = skill?.id || '';
  const cat = skill?.category || 'martial';
  const glow = SKILL_BRANCH_GLOW[cat] || SKILL_BRANCH_GLOW.martial;
  const [col, row] = SKILL_ICON_COORDS[id] || [0, 0];
  return `<span class="bat-skill-icon branch-${cat}" style="--sk-glow:${glow};width:${s}px;height:${s}px;">${_spriteCell('icons_skills.png', col, row, s, 'circle', glow)}</span>`;
}

function renderBattleSubpanel() {
  const panel = $('bat-subpanel');
  if (!battleSubMode || !battle) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  if (battleSubMode === 'skills') {
    const tabsHtml = SKILL_BRANCHES.map((b) =>
      `<button class="skill-branch-tab${battleSkillBranch === b.id ? ' active' : ''}" data-branch="${b.id}">${b.name}</button>`
    ).join('');

    const list = COMBAT_SKILLS.filter((s) => s.category === battleSkillBranch);
    const cardsHtml = list.map((s) => {
      const locked = state.level < s.unlockLv;
      const noMp = state.energy < s.mpCost;
      const stateCls = locked ? ' is-locked' : (noMp ? ' is-nomp' : '');
      return `
        <button class="bat-skill-btn${stateCls}" data-skill-id="${s.id}" title="${escapeHtml(s.desc)}" ${locked || noMp ? 'disabled' : ''}>
          ${renderSkillIcon(s)}
          <span class="bat-skill-name">${escapeHtml(s.name)}</span>
          <span class="bat-skill-cost">${locked ? `Lv.${s.unlockLv}` : `${s.mpCost}内息`}</span>
        </button>
      `;
    }).join('');

    panel.innerHTML = `<div class="skill-branch-tabs">${tabsHtml}</div><div class="battle-subgrid">${cardsHtml}</div>`;
    panel.querySelectorAll('.skill-branch-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx.uiTick?.();
        battleSkillBranch = btn.dataset.branch;
        renderBattleSubpanel();
      });
    });
    panel.querySelectorAll('.bat-skill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sk = COMBAT_SKILLS.find((x) => x.id === btn.dataset.skillId);
        if (sk) battleUseSkill(sk);
      });
    });
    return;
  }

  if (battleSubMode === 'items') {
    const rows = [];
    for (const [eid, cnt] of Object.entries(state.elixirs)) {
      if (cnt <= 0 || !ELIXIRS[eid]) continue;
      const e = ELIXIRS[eid];
      rows.push(`
        <button class="bat-item-btn" data-kind="elixir" data-key="${eid}" title="${escapeHtml(e.desc)}">
          <span class="bat-item-icon">${renderVisualThumb('elixir', e, 40)}</span>
          <span class="bat-skill-name">${escapeHtml(e.name)}</span>
          <span class="bat-skill-cost">×${cnt}</span>
        </button>
      `);
    }
    const counts = {};
    for (const b of state.bag) {
      const it = ITEMS[b.itemId];
      if (it?.isConsumable) counts[it.id] = (counts[it.id] || 0) + 1;
    }
    for (const [idStr, cnt] of Object.entries(counts)) {
      const it = ITEMS[Number(idStr)];
      rows.push(`
        <button class="bat-item-btn" data-kind="item" data-key="${it.id}" title="${escapeHtml(it.desc)}">
          <span class="bat-item-icon">${renderVisualThumb('item', it, 40)}</span>
          <span class="bat-skill-name">${escapeHtml(it.name)}</span>
          <span class="bat-skill-cost">×${cnt}</span>
        </button>
      `);
    }
    panel.innerHTML = rows.length
      ? `<div class="battle-subgrid">${rows.join('')}</div>`
      : '<div class="modal-item-desc">行囊中暂无可用丹药或补给品。</div>';

    panel.querySelectorAll('.bat-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.kind;
        const key = kind === 'item' ? Number(btn.dataset.key) : btn.dataset.key;
        battleUseConsumable(kind, key);
      });
    });
  }
}

// ==================== 通用古卷弹窗控制 ====================
function openModal(title, bodyHtml, footerHtml = '', opts = {}) {
  const backdrop = $('modal-backdrop');
  const wasClosed = !backdrop || backdrop.classList.contains('hidden');
  const titleEl = $('modal-title');
  const bodyEl = $('modal-body');
  const isSameModal = !wasClosed && Boolean(titleEl) && titleEl.textContent === title;
  const prevScroll = isSameModal && bodyEl ? bodyEl.scrollTop : 0;

  modalLocked = Boolean(opts.locked);
  if (world) world.paused = true;
  $('modal-box')?.classList.remove('modal-crucible-full', 'modal-worldmap-full', 'modal-armory-full');
  const closeBtn = $('modal-close');
  if (closeBtn) closeBtn.style.display = modalLocked ? 'none' : '';
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) {
    bodyEl.innerHTML = bodyHtml;
    bodyEl.scrollTop = isSameModal ? prevScroll : 0;
  }
  $('modal-footer').innerHTML = footerHtml || (modalLocked ? '' : '<button class="btn btn-secondary" id="modal-default-close">合上卷轴</button>');
  backdrop?.classList.remove('hidden');
  if (wasClosed) sfx.uiTick?.();
  $('modal-default-close')?.addEventListener('click', () => closeModal());
}

function closeModal(silent = false, force = false) {
  if (modalLocked && !force) return;
  modalLocked = false;
  const closeBtn = $('modal-close');
  if (closeBtn) closeBtn.style.display = '';
  const backdrop = $('modal-backdrop');
  const wasOpen = Boolean(backdrop && !backdrop.classList.contains('hidden'));
  $('modal-box')?.classList.remove('modal-crucible-full', 'modal-worldmap-full', 'modal-armory-full');
  backdrop?.classList.add('hidden');
  if (wasOpen && !silent) sfx.uiTick?.();
  if (world && !battle && !currentDialog) {
    world.paused = false;
  }
}

// ==================== 1. 天下舆图（5 大域 × 21 张地图 · 沉浸沙盘） ====================
const WORLDMAP_COORDS = [
  { x: 13, y: 54 }, // 0: 墨石镇域
  { x: 36, y: 28 }, // 1: 铁锈废都域
  { x: 55, y: 66 }, // 2: 赤焰兵工域
  { x: 69, y: 28 }, // 3: 青瘴毒泽域
  { x: 89, y: 46 }  // 4: 天枢核心域
];

function openWorldMap(selectedRegionId = null) {
  const curMap = MAPS_BY_ID[state.mapId] || MAPS[0];
  const activeRegId = selectedRegionId || curMap.regionId;
  const activeReg = getRegionById(activeRegId);
  const activeWeather = WEATHERS[state.regionWeathers[activeReg.id] ?? 0] || WEATHERS[0];

  const linesSvg = [];
  for (let i = 0; i < REGIONS.length - 1; i++) {
    const a = WORLDMAP_COORDS[i] || REGIONS[i].worldPos;
    const b = WORLDMAP_COORDS[i + 1] || REGIONS[i + 1].worldPos;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + (i % 2 === 0 ? -7 : 7);
    const segUnlocked = isRegionUnlocked(REGIONS[i].id) && isRegionUnlocked(REGIONS[i + 1].id);
    linesSvg.push(`
      <path d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}"
        fill="none"
        stroke="${segUnlocked ? 'rgba(94,234,212,0.42)' : 'rgba(94,234,212,0.22)'}"
        stroke-width="${segUnlocked ? '0.65' : '0.45'}"
        stroke-dasharray="2.1 1.6"
        vector-effect="non-scaling-stroke" />
      <path d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}"
        fill="none"
        stroke="${segUnlocked ? 'rgba(243,206,122,0.34)' : 'rgba(212,162,74,0.16)'}"
        stroke-width="0.28"
        vector-effect="non-scaling-stroke" />
    `);
  }

  const nodesHtml = REGIONS.map((reg, idx) => {
    const pos = WORLDMAP_COORDS[idx] || reg.worldPos;
    const unlocked = isRegionUnlocked(reg.id);
    const isCur = reg.id === curMap.regionId;
    const isSel = reg.id === activeReg.id;
    const wid = state.regionWeathers[reg.id] ?? 0;
    const w = WEATHERS[wid] || WEATHERS[0];
    return `
      <button class="map-node ${unlocked ? 'unlocked' : 'locked'}${isCur ? ' current' : ''}${isSel ? ' selected' : ''}${isCur || isSel ? ' active' : ''}"
        style="left:${pos.x}%;top:${pos.y}%;--node-accent:${reg.color};" data-region-id="${reg.id}">
        <span class="node-seal-wrap">
          ${(isCur || isSel) ? '<span class="node-pulse-ring" aria-hidden="true"></span>' : ''}
          <span class="node-disc" style="color:${reg.color};">
            ${reg.name.slice(0, 1)}
            <span class="node-weather" style="color:${w.color};">${w.short}</span>
          </span>
        </span>
        <span class="node-label">${escapeHtml(reg.name)}</span>
        ${unlocked ? (isCur ? '<span class="node-here-tag">身在此域</span>' : '') : `<span class="node-cost">锁 · ${reg.unlockCost} 币</span>`}
      </button>
    `;
  }).join('');

  const subMapsHtml = activeReg.maps.map((mid) => {
    const m = MAPS_BY_ID[mid];
    if (!m) return '';
    const isCur = m.id === state.mapId;
    const typeTag = m.sceneType === 'interior' ? '室' : m.sceneType === 'cave' ? '窟' : m.sceneType === 'town' ? '镇' : '野';
    return `
      <button class="submap-pill${isCur ? ' current' : ''}" data-map-id="${m.id}">
        <span class="submap-tag">[${typeTag}]</span>
        <span class="submap-name">${escapeHtml(m.short || m.name)}</span>
      </button>
    `;
  }).join('');

  const body = `
    <div class="worldmap-stage">
      <svg class="world-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${linesSvg.join('')}</svg>
      <div class="map-nodes-layer">${nodesHtml}</div>
    </div>
    <div class="worldmap-console">
      <div class="worldmap-console-head">
        <div class="worldmap-region-info">
          <div class="worldmap-region-title-row">
            <span class="worldmap-region-title" style="color:${activeReg.color};">${escapeHtml(activeReg.name)}</span>
            <span class="worldmap-weather-tag" style="color:${activeWeather.color};border-color:${activeWeather.color}44;">天象 · ${escapeHtml(activeWeather.name)}</span>
            <span class="worldmap-map-count">辖 ${activeReg.maps.length} 处舆图</span>
          </div>
          <div class="worldmap-region-sub">${escapeHtml(activeReg.subtitle)}</div>
        </div>
        <div class="worldmap-console-actions">
          ${isRegionUnlocked(activeReg.id)
            ? `<button class="worldmap-act-btn primary" id="btn-travel-region">直达主图</button>`
            : `<button class="worldmap-act-btn unlock" id="btn-unlock-region">解锁此域 · ${activeReg.unlockCost} 币</button>`}
        </div>
      </div>
      <div class="worldmap-submaps-strip">${subMapsHtml}</div>
    </div>
  `;

  openModal('墨土五域 · 天下舆图', body);
  $('modal-box')?.classList.add('modal-worldmap-full');

  $('modal-body').querySelectorAll('.map-node').forEach((btn) => {
    btn.addEventListener('click', () => openWorldMap(btn.dataset.regionId));
  });
  $('btn-travel-region')?.addEventListener('click', () => {
    closeModal();
    enterMap(activeReg.entryMap);
  });
  $('btn-unlock-region')?.addEventListener('click', () => {
    if (tryUnlockRegion(activeReg.id)) {
      openWorldMap(activeReg.id);
    }
  });
  $('modal-body').querySelectorAll('.submap-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mid = btn.dataset.mapId;
      if (!isRegionUnlocked(activeReg.id)) {
        if (!tryUnlockRegion(activeReg.id)) return;
      }
      closeModal();
      enterMap(mid);
    });
  });
}

// ==================== 物品 / 妖魂 / 装备真实视觉缩略图渲染 ====================
function _getSpiritSpriteSrc(spriteType) {
  if (ASSETS[spriteType]) return ASSETS[spriteType];
  if (['rat', 'dog', 'boss_ratking', 'slime'].includes(spriteType)) {
    return 'assets/sprites/enemy_beast.png';
  }
  if (['drone', 'flame_mech', 'guard', 'auto_turret', 'heavy_mech', 'mech_taotie', 'boss_zhurong', 'raider', 'raider_shield', 'boss_duangang'].includes(spriteType)) {
    return 'assets/sprites/enemy_mech.png';
  }
  return 'assets/sprites/enemy_demon.png';
}

function _getGuardianSpriteSrc(gid) {
  if (['guard_hound', 'guard_miasma'].includes(gid)) return 'assets/sprites/enemy_beast.png';
  if (['guard_puppet', 'guard_zhurong', 'guard_taotie', 'guard_falcon'].includes(gid)) return 'assets/sprites/enemy_mech.png';
  return 'assets/sprites/enemy_demon.png';
}

function _thumbImg(src, alt, size, extraStyle = '') {
  return `<img src="${src}" alt="${escapeHtml(alt)}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;flex-shrink:0;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.8));${extraStyle}">`;
}

function _thumbSvg(size, inner, extraStyle = '') {
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" style="width:${size}px;height:${size}px;display:block;flex-shrink:0;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.75));${extraStyle}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

const ITEM_ICON_COORDS = {
  // (0,0) rusted tin can
  0: [0, 0], 1: [0, 0], 2: [0, 0],
  // (1,0) sparking copper wire spool
  3: [1, 0], 13: [1, 0],
  // (2,0) cracked gold circuit board
  4: [2, 0], 5: [2, 0], 19: [2, 0],
  // (3,0) glowing cyan quantum GPU chip
  6: [3, 0], 9: [3, 0],
  // (0,1) military hazard battery
  7: [0, 1], 15: [0, 1],
  // (1,1) broken red-eye recon drone
  8: [1, 1], 18: [1, 1],
  // (2,1) glowing blue isotope core
  10: [2, 1],
  // (3,1) scarred aviation black-box
  11: [3, 1], 27: [3, 1], 35: [3, 1],
  // (0,2) red tactical flare gun
  14: [0, 2],
  // (1,2) glowing emerald mutant mushroom
  17: [1, 2],
  // (2,2) vacuum-sealed military ration bar
  20: [2, 2],
  // (3,2) cyan tactical water canteen
  21: [3, 2],
  // (0,3) porcelain healing powder gourd
  22: [0, 3],
  // (1,3) glowing green anti-rad syringe
  23: [1, 3],
  // (2,3) battered tactical smoke grenade
  24: [2, 3],
  // (3,3) holographic antique pocket watch
  12: [3, 3], 16: [3, 3], 25: [3, 3], 26: [3, 3], 28: [3, 3], 29: [3, 3],
  30: [3, 3], 31: [3, 3], 32: [3, 3], 33: [3, 3], 34: [3, 3], 36: [3, 3], 37: [3, 3]
};

const GEAR_ICON_COORDS = {
  // Weapons
  wpn_inkblade:     [0, 0], // cyan-runed dark short dao
  wpn_qingcheng:    [1, 0], // ancient bronze-jade Chinese jian
  wpn_flaregun:     [2, 0], // glowing wasteland blunderbuss/shotgun
  wpn_shotgun:      [2, 0], // glowing wasteland blunderbuss/shotgun
  wpn_pulsesword:   [3, 0], // cyan plasma energy saber
  wpn_gatling:      [0, 1], // heavy 6-barrel Gatling minigun
  wpn_artillery:    [0, 1], // heavy cannon/minigun
  wpn_sniper:       [1, 1], // futuristic sniper railgun
  wpn_plasma_rifle: [1, 1], // futuristic sniper/plasma rifle
  wpn_railgun:      [1, 1], // futuristic sniper railgun
  wpn_xuanyuan:     [2, 1], // legendary radiant Xuan-Yuan spirit greatsword
  // Armor
  armor_ironwire:   [0, 2], // carbon-fiber martial arts trenchcoat / medium armor
  armor_exo:        [2, 2], // heavy ancient-bronze Mo-Jia battle cuirass
  // Mech cores
  mech_steam_core:    [3, 2], // hydraulic exoskeleton arm gauntlet
  mech_crimson_frame: [0, 3], // molten-orange crimson mech fusion core
  mech_bit_array:     [1, 3], // purple cybernetic Taotie mech core
  mech_tianshu_exo:   [1, 3], // purple cybernetic Taotie mech core
  // Relics
  relic_fox_orb:      [2, 3], // glowing jade-bronze Mo-Jia Bagua pendant
  relic_thunder_seal: [2, 3], // glowing jade-bronze Mo-Jia Bagua pendant
  relic_tianshu:      [3, 3]  // floating cyan celestial astrolabe relic sphere
};

function _qualityGlow(quality) {
  if (quality === 'legend') return 'rgba(245,158,11,0.58)';
  if (quality === 'rare')   return 'rgba(168,123,199,0.52)';
  if (quality === 'fine')   return 'rgba(94,234,212,0.42)';
  return 'rgba(212,162,74,0.22)';
}

function renderVisualThumb(kind, idOrObj, size = 44) {
  const s = Number(size) || 44;

  // 1. 收服妖魂 & 护驾灵兽：直接使用手绘透明 PNG 立绘
  if (kind === 'spirit') {
    const en = typeof idOrObj === 'object' && idOrObj ? idOrObj : ENEMIES[idOrObj];
    const src = _getSpiritSpriteSrc(en?.spriteType || idOrObj);
    return _thumbImg(src, en?.spiritName || en?.name || '妖魂', s);
  }
  if (kind === 'guardian') {
    const g = typeof idOrObj === 'object' && idOrObj ? idOrObj : GUARDIANS[idOrObj];
    const src = _getGuardianSpriteSrc(g?.id || idOrObj);
    return _thumbImg(src, g?.name || '护驾', s);
  }
  if (kind === 'crucible') {
    return _thumbImg('assets/app_icon.png', '天工墨壶', s, 'border-radius:50%;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.85)) drop-shadow(0 0 10px rgba(229,187,92,0.42));');
  }

  // 2. 装备（武器 / 护甲 / 机甲核心 / 秘宝）：使用 4×4 手绘透明 PNG icons_gear.png
  if (kind === 'equip' || kind === 'equipment') {
    const eq = typeof idOrObj === 'object' && idOrObj ? idOrObj : EQUIPMENT[idOrObj];
    if (!eq) {
      return _spriteCell('icons_gear.png', 0, 0, s, 'squircle', 'rgba(212,162,74,0.25)');
    }
    let coords = GEAR_ICON_COORDS[eq.id];
    if (!coords) {
      if (eq.slot === 'mech') coords = eq.quality === 'legend' ? [1, 3] : [0, 3];
      else if (eq.slot === 'relic') coords = eq.quality === 'legend' ? [3, 3] : [2, 3];
      else if (eq.slot === 'armor') coords = eq.genre === 'scifi' ? [2, 2] : [3, 1];
      else if (eq.weaponType === 'gatling' || eq.weaponType === 'cannon') coords = [0, 1];
      else if (eq.weaponType === 'sniper' || eq.weaponType === 'railgun' || eq.weaponType === 'plasma') coords = [1, 1];
      else if (eq.weaponType === 'shotgun' || eq.weaponType === 'pistol') coords = [2, 0];
      else if (eq.genre === 'mythic') coords = [2, 1];
      else if (eq.genre === 'scifi') coords = [3, 0];
      else coords = [0, 0];
    }
    return _spriteCell('icons_gear.png', coords[0], coords[1], s, 'squircle', _qualityGlow(eq.quality));
  }

  // 3. 丹药：使用 4×4 手绘透明 PNG icons_items.png
  if (kind === 'elixir') {
    const elx = typeof idOrObj === 'object' && idOrObj ? idOrObj : ELIXIRS[idOrObj];
    if (elx?.id === 'elixir_ration') {
      return _spriteCell('icons_items.png', 2, 2, s, 'squircle', 'rgba(245,158,11,0.48)');
    }
    return _spriteCell('icons_items.png', 0, 3, s, 'squircle', 'rgba(94,234,212,0.52)');
  }

  // 4. 背包物品（补给品 / 剧情信物 / 古董 / 科技 / 废品）：使用 4×4 手绘透明 PNG icons_items.png
  if (kind === 'item') {
    const it = typeof idOrObj === 'object' && idOrObj ? idOrObj : ITEMS[idOrObj];
    if (!it) return _spriteCell('icons_items.png', 0, 0, s, 'squircle');
    const coords = ITEM_ICON_COORDS[it.id] || (it.isCollection || it.isStory ? [3, 3] : [0, 0]);
    const glow = it.isCollection || it.isStory
      ? 'rgba(229,184,92,0.45)'
      : it.category === 'rare'
        ? 'rgba(56,189,248,0.48)'
        : it.isConsumable
          ? 'rgba(94,234,212,0.38)'
          : 'rgba(212,162,74,0.22)';
    return _spriteCell('icons_items.png', coords[0], coords[1], s, 'squircle', glow);
  }

  // 5. 空装备槽 / 炼化炉预览图标
  if (kind === 'empty_slot') {
    const map = {
      weapon: `<line x1="13" y1="35" x2="35" y2="13" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><line x1="13" y1="27" x2="21" y2="35" stroke="#d49a3a" stroke-width="2.5" stroke-linecap="round"/>`,
      armor: `<path d="M14 12l5-2h10l5 2 3 7-4 3v14l-9 4-9-4V22l-4-3z" fill="none" stroke="#94a3b8" stroke-width="2.2"/>`,
      mech: `<polygon points="24,8 37,16 37,32 24,40 11,32 11,16" fill="none" stroke="#94a3b8" stroke-width="2.2"/><circle cx="24" cy="24" r="5" fill="none" stroke="#5eead4" stroke-width="1.8"/>`,
      relic: `<circle cx="24" cy="24" r="13" fill="none" stroke="#d49a3a" stroke-width="2.2"/><polygon points="24,14 28,24 24,34 20,24" fill="none" stroke="#c084fc" stroke-width="1.8"/>`
    };
    return _thumbSvg(s, map[idOrObj] || map.relic, 'opacity:0.42;');
  }

  // 天工未知炼化 / 炉台默认图腾
  return _thumbSvg(s, `
    <circle cx="24" cy="24" r="16" fill="#241738" stroke="#c084fc" stroke-width="2.2"/>
    <circle cx="24" cy="24" r="10" fill="none" stroke="#5eead4" stroke-width="1.6" stroke-dasharray="4 3"/>
    <circle cx="24" cy="24" r="4.5" fill="#e5bb5c"/>
  `);
}

// ==================== 2. 「天工墨壶」双槽炼化与护驾 ====================
function getCruciblePoolEntries() {
  const pool = [];
  for (const [eid, cnt] of Object.entries(state.capturedSpirits)) {
    if (cnt <= 0 || !ENEMIES[eid]) continue;
    pool.push({
      key: `spirit:${eid}`,
      kind: 'spirit',
      id: eid,
      seal: '妖',
      name: ENEMIES[eid].spiritName || ENEMIES[eid].name,
      count: cnt
    });
  }
  const itemCounts = {};
  for (const b of state.bag) {
    const it = ITEMS[b.itemId];
    if (!it || it.isStory || it.isCollection) continue;
    itemCounts[it.id] = (itemCounts[it.id] || 0) + 1;
  }
  for (const [idStr, cnt] of Object.entries(itemCounts)) {
    const it = ITEMS[Number(idStr)];
    pool.push({
      key: `item:${it.id}`,
      kind: 'item',
      id: it.id,
      seal: it.seal || '物',
      name: it.name,
      count: cnt
    });
  }
  for (const eq of state.equipBag) {
    pool.push({
      key: `equip:${eq.uid}`,
      kind: 'equip',
      id: eq.id,
      uid: eq.uid,
      seal: eq.seal || '兵',
      name: eq.name,
      count: 1,
      eq
    });
  }
  return pool;
}

function normalizeFuseInput(slotObj) {
  if (!slotObj) return null;
  if (slotObj.kind === 'equip') {
    const q = slotObj.eq?.quality || EQUIPMENT[slotObj.id]?.quality || 'common';
    const mappedId = q === 'legend'
      ? 10
      : q === 'rare'
        ? 14
        : (q === 'fine' || q === 'uncommon')
          ? 5
          : 2;
    return { kind: 'item', id: mappedId, _equipUid: slotObj.uid };
  }
  return { kind: slotObj.kind, id: slotObj.id };
}

function consumeCrucibleSlot(slotObj) {
  if (slotObj.kind === 'spirit') {
    state.capturedSpirits[slotObj.id] = Math.max(0, (state.capturedSpirits[slotObj.id] || 0) - 1);
  } else if (slotObj.kind === 'item') {
    const idx = state.bag.findIndex((b) => b.itemId === slotObj.id);
    if (idx >= 0) state.bag.splice(idx, 1);
  } else if (slotObj.kind === 'equip') {
    const idx = state.equipBag.findIndex((e) => e.uid === slotObj.uid);
    if (idx >= 0) state.equipBag.splice(idx, 1);
  }
}

function findMatchingRecipe(a, b) {
  if (!a || !b) return null;
  const ma = normalizeFuseInput(a);
  const mb = normalizeFuseInput(b);
  return RECIPES.find((r) =>
    (r.matA.kind === ma.kind && r.matA.id === ma.id && r.matB.kind === mb.kind && r.matB.id === mb.id) ||
    (r.matA.kind === mb.kind && r.matA.id === mb.id && r.matB.kind === ma.kind && r.matB.id === ma.id)
  ) || null;
}

function executeCrucibleFuse() {
  const [a, b] = crucibleSlots;
  if (!a || !b) {
    showToast('请先在左右两个炼化槽中各放入 1 件妖魂、物资或装备！', 'warn');
    return;
  }
  // 检查同一素材重复放入时的数量
  if (a.key === b.key) {
    if (a.kind === 'equip') {
      showToast('同一件装备不能放入两个槽位！', 'warn');
      return;
    }
    if (a.count < 2) {
      showToast(`素材「${a.name}」数量不足 2 个！`, 'warn');
      return;
    }
  }

  const res = dynamicFuse(normalizeFuseInput(a), normalizeFuseInput(b));
  consumeCrucibleSlot(a);
  consumeCrucibleSlot(b);
  crucibleSlots = [null, null];
  state.stats.fuse = (state.stats.fuse || 0) + 1;

  if (res.resultType === 'guardian') {
    const g = GUARDIANS[res.resultId];
    if (g) {
      if (!state.unlockedGuardians.includes(g.id)) {
        state.unlockedGuardians.push(g.id);
        if (!state.activeGuardianId) {
          state.activeGuardianId = g.id;
          syncWorldAppearance();
        }
        showToast(`墨壶神光冲天！炼成护驾灵兽【${g.name}】！`, 'success');
      } else {
        state.gold += 350;
        showToast(`重复炼成【${g.name}】，化作灵气折算 +350 废土币！`, 'info');
      }
      sfx.ending();
    }
  } else if (res.resultType === 'elixir') {
    const elx = ELIXIRS[res.resultId];
    if (elx) {
      state.elixirs[elx.id] = (state.elixirs[elx.id] || 0) + 1;
      showToast(`炼丹成功！获得【${elx.name}】×1！`, 'success');
      sfx.pick('rare');
    }
  } else if (res.resultType === 'equipment' && res.item) {
    addEquipmentToBag(res.item);
    showToast(`跨界神兵出炉！获得【${QUALITY[res.item.quality].name}】${res.item.name}！`, 'success');
    sfx.pick(res.item.quality);
  }

  gainExp(25);
  updateHUD();
  scheduleSave();
  openCrucible();
}

const WUXING_LIST = ['金', '木', '水', '火', '土'];
const WUXING_META = {
  金: { key: 'metal', color: '#f3ce7a', glow: 'rgba(243, 206, 122, 0.72)' },
  木: { key: 'wood',  color: '#5eead4', glow: 'rgba(94, 234, 212, 0.72)' },
  水: { key: 'water', color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.72)' },
  火: { key: 'fire',  color: '#f87171', glow: 'rgba(248, 113, 113, 0.72)' },
  土: { key: 'earth', color: '#d9a05b', glow: 'rgba(217, 160, 91, 0.72)' }
};

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
    if (eq.slot === 'weapon') {
      if (eq.proc === 'burn' || ['pistol', 'cannon', 'railgun'].includes(eq.weaponType)) return '火';
      return '金';
    }
    if (eq.slot === 'mech') return '金';
    return '土';
  }
  const id = Number(entry.id);
  if ([2, 3, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19].includes(id)) return '金';
  if ([1, 17, 22].includes(id)) return '木';
  if ([0, 21, 23].includes(id)) return '水';
  if ([7, 10, 14, 24].includes(id)) return '火';
  if (id === 20) return '土';
  const it = ITEMS[id];
  if (it?.category === 'tech') return '金';
  if (it?.category === 'consumable') return '水';
  return '土';
}

function getCrucibleCategory(entry) {
  if (!entry) return 'material';
  if (entry.kind === 'spirit') return 'spirit';
  if (entry.kind === 'equip') return 'equip';
  const it = ITEMS[Number(entry.id)];
  if (it?.isConsumable) return 'consumable';
  return 'material';
}

function getWuXingOmen(a, b, match) {
  if (!a && !b) return '阴阳未济 · 纳灵入阵以启玄机';
  if (a && !b) return `阴仪初动 · ${getCrucibleElement(a)}灵入坤`;
  if (!a && b) return `阳仪初动 · ${getCrucibleElement(b)}灵入乾`;
  const elA = getCrucibleElement(a);
  const elB = getCrucibleElement(b);
  const pair = [elA, elB].sort().join('');
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
    水火: '水火既济 · 阴阳化生',
    金金: '双金共鸣 · 锋芒淬刃',
    木木: '双木成林 · 生机勃发',
    水水: '双水汇渊 · 玄灵归元',
    火火: '双火炎上 · 烈焰淬魂',
    土土: '厚土载物 · 镇岳成形'
  };
  const baseOmen = omens[pair] || '阴阳合璧 · 万象化生';
  return match ? `${baseOmen} · 丹方感应` : baseOmen;
}

function openCrucible() {
  const tabsHtml = `
    <div class="crucible-tabs-bar">
      <button class="crucible-tab-btn${crucibleTab === 'forge' ? ' active' : ''}" data-ctab="forge">炼化炉台</button>
      <button class="crucible-tab-btn${crucibleTab === 'guardians' ? ' active' : ''}" data-ctab="guardians">护驾出战 <small>(${state.unlockedGuardians.length}/${Object.keys(GUARDIANS).length})</small></button>
      <button class="crucible-tab-btn${crucibleTab === 'recipes' ? ' active' : ''}" data-ctab="recipes">墨壶图谱 <small>(${RECIPES.length})</small></button>
    </div>
  `;

  let contentHtml = '';
  if (crucibleTab === 'forge') {
    const pool = getCruciblePoolEntries();
    const [a, b] = crucibleSlots;
    const match = findMatchingRecipe(a, b);
    const activeElements = new Set();
    if (a) activeElements.add(getCrucibleElement(a));
    if (b) activeElements.add(getCrucibleElement(b));

    const wuxingHtml = WUXING_LIST.map((el) => {
      const meta = WUXING_META[el];
      const lit = activeElements.has(el);
      return `<span class="wuxing-rune${lit ? ' lit' : ''}" data-el="${meta.key}" style="--wx-color:${meta.color};--wx-glow:${meta.glow};">${el}</span>`;
    }).join('<span class="wuxing-dot" aria-hidden="true">·</span>');

    const omenText = getWuXingOmen(a, b, match);
    const previewTitle = match
      ? escapeHtml(match.name)
      : (a && b)
        ? '天工未知化生'
        : '太极天枢';
    const previewColor = match
      ? (QUALITY[match.quality]?.color || '#f3ce7a')
      : (a && b)
        ? '#5eead4'
        : 'rgba(240, 232, 216, 0.72)';

    const previewVisual = match
      ? renderVisualThumb(match.resultType, match.resultId, 68)
      : (a && b)
        ? renderVisualThumb('mystery', null, 62)
        : renderVisualThumb('crucible', null, 50);

    const renderPedestal = (slotObj, glyph, label, hint) => {
      if (!slotObj) {
        return `
          <span class="crucible-empty-glyph">${glyph}</span>
          <span class="crucible-empty-hint">${hint}</span>
          <span class="crucible-pedestal-label">${label}</span>
        `;
      }
      const el = getCrucibleElement(slotObj);
      const meta = WUXING_META[el];
      const thumb = renderVisualThumb(slotObj.kind, slotObj.kind === 'equip' ? slotObj.eq : slotObj.id, 66);
      return `
        <span class="crucible-slot-wx" style="color:${meta.color};text-shadow:0 0 10px ${meta.glow};">${el}</span>
        <div class="crucible-slot-entity">${thumb}</div>
        <strong class="crucible-slot-name">${escapeHtml(slotObj.name)}</strong>
        <span class="crucible-pedestal-label">${label}</span>
      `;
    };

    const filteredPool = crucibleFilter === 'all'
      ? pool
      : pool.filter((p) => getCrucibleCategory(p) === crucibleFilter);

    const filters = [
      { id: 'all', label: '全部' },
      { id: 'spirit', label: '妖魂' },
      { id: 'material', label: '灵材' },
      { id: 'consumable', label: '丹药' },
      { id: 'equip', label: '兵甲' }
    ];
    const filterPillsHtml = filters.map((f) =>
      `<button class="crucible-filter-pill${crucibleFilter === f.id ? ' active' : ''}" data-cfilter="${f.id}">${f.label}</button>`
    ).join('');

    const poolHtml = filteredPool.length
      ? filteredPool.map((p) => {
        const isSel = (a && a.key === p.key) || (b && b.key === p.key);
        const el = getCrucibleElement(p);
        const meta = WUXING_META[el];
        const thumb = renderVisualThumb(p.kind, p.kind === 'equip' ? p.eq : p.id, 46);
        return `
          <button class="crucible-chip${isSel ? ' selected' : ''}" data-pkey="${escapeHtml(p.key)}" title="${escapeHtml(p.name)}（${el}）×${p.count}">
            <span class="chip-wx" style="color:${meta.color};text-shadow:0 0 8px ${meta.glow};">${el}</span>
            <span class="chip-count">×${p.count}</span>
            <span class="chip-thumb">${thumb}</span>
            <span class="chip-name">${escapeHtml(p.name)}</span>
          </button>`;
      }).join('')
      : '<div class="crucible-vault-empty">此匣暂无对应灵物，可切换分类或前往荒原收妖拾荒。</div>';

    contentHtml = `
      <div class="crucible-sanctuary">
        <div class="crucible-altar-triad">
          <div class="crucible-slot crucible-slot-yin${a ? ' filled' : ''}" id="crucible-slot-0" title="${a ? '点击卸下阴位灵物' : '阴位 · 坤（点击下方灵物纳灵）'}">
            ${renderPedestal(a, '阴', '阴位 · 坤', '纳灵入坤')}
          </div>

          <div class="crucible-taiji-nexus">
            <div class="wuxing-bar" aria-label="五行灵枢">${wuxingHtml}</div>
            <div class="wuxing-omen${a && b ? ' ignited' : ''}">${escapeHtml(omenText)}</div>
            <div class="crucible-result-preview${match ? ' matched' : (a && b ? ' active' : '')}" title="${match ? escapeHtml(match.desc) : '阴阳化生预览'}">
              <div class="crucible-preview-entity">${previewVisual}</div>
              <strong class="crucible-preview-title" style="color:${previewColor};">${previewTitle}</strong>
            </div>
            <div class="crucible-actions">
              <button class="crucible-act-btn clear" id="btn-crucible-clear">清空阵眼</button>
              <button class="crucible-act-btn fuse" id="btn-crucible-fuse" ${a && b ? '' : 'disabled'}>开炉炼化</button>
            </div>
          </div>

          <div class="crucible-slot crucible-slot-yang${b ? ' filled' : ''}" id="crucible-slot-1" title="${b ? '点击卸下阳位灵物' : '阳位 · 乾（点击下方灵物纳灵）'}">
            ${renderPedestal(b, '阳', '阳位 · 乾', '纳灵入乾')}
          </div>
        </div>
      </div>

      <section class="crucible-vault" aria-label="百宝灵匣">
        <div class="crucible-vault-head">
          <div class="crucible-vault-title-group">
            <span class="crucible-vault-title">百宝灵匣</span>
            <span class="crucible-vault-count">共 ${filteredPool.length} 项</span>
          </div>
          <div class="crucible-filter-bar">${filterPillsHtml}</div>
        </div>
        <div class="crucible-vault-grid">${poolHtml}</div>
      </section>
    `;
  } else if (crucibleTab === 'guardians') {
    const cards = Object.values(GUARDIANS).map((g) => {
      const unlocked = state.unlockedGuardians.includes(g.id);
      const active = state.activeGuardianId === g.id;
      return `
        <div class="modal-list-item${active ? ' done' : ''}" style="${unlocked ? '' : 'opacity:0.5;'}">
          <div style="display:flex;align-items:center;gap:10px;">
            ${renderVisualThumb('guardian', g, 48)}
            <div>
              <div class="modal-item-title">${escapeHtml(g.name)} <small style="color:${QUALITY[g.quality]?.color}">[${QUALITY[g.quality]?.name}]</small></div>
              <div class="modal-item-desc">${escapeHtml(g.desc)}</div>
            </div>
          </div>
          ${unlocked
            ? `<button class="btn btn-sm ${active ? 'btn-secondary' : 'btn-purple'}" data-guard-id="${g.id}">${active ? '休战' : '护驾出战'}</button>`
            : '<small class="modal-item-desc">未炼化</small>'}
        </div>
      `;
    }).join('');
    contentHtml = `<div class="crucible-scroll-pane">${cards}</div>`;
  } else {
    const rows = RECIPES.map((r) => {
      const nameA = r.matA.kind === 'spirit' ? (ENEMIES[r.matA.id]?.spiritName || r.matA.id) : (ITEMS[r.matA.id]?.name || r.matA.id);
      const nameB = r.matB.kind === 'spirit' ? (ENEMIES[r.matB.id]?.spiritName || r.matB.id) : (ITEMS[r.matB.id]?.name || r.matB.id);
      const hasA = r.matA.kind === 'spirit' ? (state.capturedSpirits[r.matA.id] || 0) > 0 : state.bag.some((x) => x.itemId === r.matA.id);
      const hasB = r.matB.kind === 'spirit' ? (state.capturedSpirits[r.matB.id] || 0) > 0 : state.bag.some((x) => x.itemId === r.matB.id);
      const ready = hasA && hasB;
      return `
        <div class="modal-list-item${ready ? ' done' : ''}">
          <div style="display:flex;align-items:center;gap:10px;">
            ${renderVisualThumb(r.resultType, r.resultId, 42)}
            <div>
              <div class="modal-item-title" style="color:${QUALITY[r.quality]?.color}">${escapeHtml(r.name)}</div>
              <div class="modal-item-desc">${escapeHtml(nameA)} + ${escapeHtml(nameB)} · ${escapeHtml(r.desc)}</div>
            </div>
          </div>
          ${ready ? `<button class="btn btn-purple btn-sm" data-quick-rec="${r.id}">填入炼化</button>` : '<small class="modal-item-desc">缺素材</small>'}
        </div>
      `;
    }).join('');
    contentHtml = `<div class="crucible-scroll-pane">${rows}</div>`;
  }

  openModal('天工墨壶 · 跨界炼妖铸兵', tabsHtml + contentHtml);
  $('modal-box')?.classList.add('modal-crucible-full');

  $('modal-body').querySelectorAll('[data-ctab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      crucibleTab = btn.dataset.ctab;
      openCrucible();
    });
  });

  if (crucibleTab === 'forge') {
    const pool = getCruciblePoolEntries();
    $('crucible-slot-0')?.addEventListener('click', () => { crucibleSlots[0] = null; openCrucible(); });
    $('crucible-slot-1')?.addEventListener('click', () => { crucibleSlots[1] = null; openCrucible(); });
    $('btn-crucible-clear')?.addEventListener('click', () => { crucibleSlots = [null, null]; openCrucible(); });
    $('btn-crucible-fuse')?.addEventListener('click', executeCrucibleFuse);
    $('modal-body').querySelectorAll('[data-cfilter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        crucibleFilter = btn.dataset.cfilter || 'all';
        openCrucible();
      });
    });
    $('modal-body').querySelectorAll('[data-pkey]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const entry = pool.find((p) => p.key === chip.dataset.pkey);
        if (!entry) return;
        if (!crucibleSlots[0]) crucibleSlots[0] = entry;
        else if (!crucibleSlots[1]) crucibleSlots[1] = entry;
        else crucibleSlots[1] = entry;
        openCrucible();
      });
    });
  } else if (crucibleTab === 'guardians') {
    $('modal-body').querySelectorAll('[data-guard-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.guardId;
        state.activeGuardianId = state.activeGuardianId === gid ? null : gid;
        syncWorldAppearance();
        updateHUD();
        scheduleSave();
        showToast(state.activeGuardianId ? `护驾【${GUARDIANS[gid].name}】已随行出战！` : '已收回护驾灵兽。', 'success');
        openCrucible();
      });
    });
  } else {
    $('modal-body').querySelectorAll('[data-quick-rec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = RECIPES.find((r) => r.id === btn.dataset.quickRec);
        if (!rec) return;
        const pool = getCruciblePoolEntries();
        const kA = `${rec.matA.kind}:${rec.matA.id}`;
        const kB = `${rec.matB.kind}:${rec.matB.id}`;
        crucibleSlots[0] = pool.find((p) => p.key === kA) || null;
        crucibleSlots[1] = pool.find((p) => p.key === kB) || null;
        crucibleTab = 'forge';
        openCrucible();
      });
    });
  }
}

// ==================== 3. 行囊与暗黑词缀装备 ====================
function renderEquipCard(eq, actionsHtml) {
  const q = QUALITY[eq.quality] || QUALITY.common;
  const g = GENRE_META[eq.genre] || GENRE_META.wuxia;
  const statBits = [];
  if (eq.atk) statBits.push(`攻+${eq.atk}`);
  if (eq.def) statBits.push(`防+${eq.def}`);
  if (eq.maxHp) statBits.push(`血+${eq.maxHp}`);
  if (eq.maxEnergy) statBits.push(`息+${eq.maxEnergy}`);
  if (eq.crit) statBits.push(`暴+${Math.round(eq.crit * 100)}%`);
  if (eq.armorPen) statBits.push(`穿甲+${Math.round(eq.armorPen * 100)}%`);
  if (eq.lifesteal) statBits.push(`吸血+${Math.round(eq.lifesteal * 100)}%`);
  if (eq.artilleryBonus) statBits.push(`重炮+${Math.round(eq.artilleryBonus * 100)}%`);
  if (eq.radResist) statBits.push(`抗辐+${Math.round(eq.radResist * 100)}%`);

  const affixHtml = (eq.affixes || []).map((af, idx) =>
    `<span class="affix-tag ${idx === 0 ? 'affix-prefix' : 'affix-suffix'}">${escapeHtml(af.name)}：${escapeHtml(af.desc)}</span>`
  ).join('');

  const isTechOrMil = eq.genre === 'military' || eq.genre === 'scifi';
  let conditionBadge = '';
  let conditionCls = '';
  if (q.key === 'legend') {
    conditionBadge = '<span class="cond-tag cond-legend">绝世</span>';
    conditionCls = ' cond-pristine-card';
  } else if (q.key === 'rare') {
    conditionBadge = '<span class="cond-tag cond-pristine">完好精品</span>';
    conditionCls = ' cond-pristine-card';
  } else if (isTechOrMil && q.key === 'common') {
    conditionBadge = '<span class="cond-tag cond-worn">锈损</span>';
    conditionCls = ' cond-worn-card';
  } else if (isTechOrMil && q.key === 'fine') {
    conditionBadge = '<span class="cond-tag cond-worn">战损</span>';
    conditionCls = ' cond-worn-card';
  }

  return `
    <div class="equip-card q-${q.key}${conditionCls}">
      <div style="display:flex;align-items:center;gap:10px;">
        ${renderVisualThumb('equip', eq, 44)}
        <div style="flex:1;min-width:0;">
          <div class="equip-head">
            <span class="equip-name" style="color:${q.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(eq.name)}</span>
            <span class="equip-badges">${conditionBadge}<span class="genre-tag ${g.cls}">${g.label}</span></span>
          </div>
          <div class="modal-item-desc">${escapeHtml(SLOT_NAMES[eq.slot] || eq.slot)} · ${statBits.join(' / ') || escapeHtml(eq.desc)}</div>
        </div>
      </div>
      ${affixHtml ? `<div class="affix-list">${affixHtml}</div>` : ''}
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:4px;">${actionsHtml}</div>
    </div>
  `;
}

function sellAllTrash(mult = 1) {
  let total = 0;
  const keep = [];
  for (const b of state.bag) {
    const it = ITEMS[b.itemId];
    if (!it || it.isConsumable || it.isStory || it.isCollection) {
      keep.push(b);
    } else {
      total += getSellPrice(b, mult);
    }
  }
  state.bag = keep;
  if (total > 0) {
    state.gold += total;
    state.stats.sellGold = (state.stats.sellGold || 0) + total;
    sfx.coin();
    updateHUD();
    scheduleSave();
  }
  return total;
}

function openBagModal() {
  const stats = getHeroStats();
  const elixirCount = Object.values(state.elixirs || {}).reduce((s, n) => s + (n > 0 ? n : 0), 0);
  const tabsHtml = `
    <div class="armory-tabs-bar">
      <button class="armory-tab-btn${bagTab === 'equip' ? ' active' : ''}" data-btab="equip">神兵整备 <small>(${state.equipBag.length})</small></button>
      <button class="armory-tab-btn${bagTab === 'items' ? ' active' : ''}" data-btab="items">行囊百宝 <small>(${state.bag.length}/${stats.bagMax})</small></button>
      <button class="armory-tab-btn${bagTab === 'elixirs' ? ' active' : ''}" data-btab="elixirs">丹药匣${elixirCount > 0 ? ` <small>(${elixirCount})</small>` : ''}</button>
    </div>
  `;

  const renderPedestal = (slot) => {
    const eq = state.equipped[slot];
    if (!eq) {
      return `
        <div class="armory-pedestal empty">
          <div class="armory-pedestal-art">${renderVisualThumb('empty_slot', slot, 48)}</div>
          <div class="armory-pedestal-meta">
            <span class="armory-slot-tag">${SLOT_NAMES[slot]}</span>
            <span class="armory-pedestal-name empty">虚位以待</span>
          </div>
        </div>
      `;
    }
    const q = QUALITY[eq.quality] || QUALITY.common;
    return `
      <div class="armory-pedestal filled q-${q.key}">
        <div class="armory-pedestal-art">${renderVisualThumb('equip', eq, 54)}</div>
        <div class="armory-pedestal-meta">
          <span class="armory-slot-tag">${SLOT_NAMES[slot]}</span>
          <span class="armory-pedestal-name" style="color:${q.color};" title="${escapeHtml(eq.name)}">${escapeHtml(eq.name)}</span>
          <button class="armory-unequip-btn" data-unequip="${slot}">卸下</button>
        </div>
      </div>
    `;
  };

  let bodyHtml = '';

  if (bagTab === 'equip') {
    const bagList = state.equipBag.length
      ? `<div class="armory-equip-grid">${state.equipBag.map((eq) => renderEquipCard(eq, `
          <button class="btn btn-amber btn-sm" data-equip-uid="${eq.uid}">装备</button>
          <button class="btn btn-secondary btn-sm" data-sell-eq="${eq.uid}">卖 ${getEquipSellPrice(eq)}币</button>
        `)).join('')}</div>`
      : '<div class="armory-empty-prompt">神兵匣暂无闲置灵器，探索废墟、拆解重炮或于天工墨壶炼化即可铸得异纹神兵。</div>';

    bodyHtml = `
      <div class="armory-sanctuary">
        <div class="armory-stage">
          <div class="armory-col armory-col-left">
            ${renderPedestal('weapon')}
            ${renderPedestal('armor')}
          </div>
          <div class="armory-center-pedestal">
            <div class="armory-hero-wrap">
              <img class="armory-hero-sprite" src="assets/sprites/hero.png" alt="墨土行者" />
            </div>
            <div class="armory-stats-plaque">
              <span>攻 <strong>${stats.atk}</strong></span>
              <i class="armory-stat-sep">·</i>
              <span>防 <strong>${stats.def}</strong></span>
              <i class="armory-stat-sep">·</i>
              <span>暴 <strong>${Math.round(stats.crit * 100)}%</strong></span>
              <i class="armory-stat-sep">·</i>
              <span>穿 <strong>${Math.round(stats.armorPen * 100)}%</strong></span>
              <i class="armory-stat-sep">·</i>
              <span>吸 <strong>${Math.round(stats.lifesteal * 100)}%</strong></span>
            </div>
          </div>
          <div class="armory-col armory-col-right">
            ${renderPedestal('mech')}
            ${renderPedestal('relic')}
          </div>
        </div>
      </div>
      <div class="armory-vault">
        <div class="armory-vault-head">
          <div class="armory-vault-title-group">
            <span class="armory-vault-title">神兵装备库</span>
            <span class="armory-vault-count">${state.equipBag.length} 件待整备</span>
          </div>
        </div>
        <div class="armory-vault-scroll">${bagList}</div>
      </div>
    `;
  } else if (bagTab === 'items') {
    const grouped = [];
    const groupMap = new Map();
    for (const b of state.bag) {
      const gKey = `${b.itemId}_${b.quality}`;
      let entry = groupMap.get(gKey);
      if (!entry) {
        entry = { firstUid: b.uid, itemId: b.itemId, quality: b.quality, count: 0, price: getSellPrice(b) };
        groupMap.set(gKey, entry);
        grouped.push(entry);
      }
      entry.count += 1;
    }

    const cards = grouped.length
      ? `<div class="armory-item-grid">${grouped.map((g) => {
        const it = ITEMS[g.itemId];
        if (!it) return '';
        const q = QUALITY[g.quality] || QUALITY.common;
        return `
          <div class="armory-grid-tile q-${q.key}" title="${escapeHtml(it.desc)}">
            <div class="armory-tile-icon-wrap">
              ${renderVisualThumb('item', it, 54)}
              <span class="armory-tile-count">×${g.count}</span>
              <span class="armory-tile-qual" style="color:${q.color};border-color:${q.color}55;">${q.name}</span>
            </div>
            <div class="armory-tile-name" style="color:${q.color};">${escapeHtml(it.name)}</div>
            <div class="armory-tile-actions">
              ${it.isConsumable ? `<button class="btn btn-green btn-sm" data-use-uid="${g.firstUid}">使用</button>` : ''}
              ${g.price > 0 ? `<button class="btn btn-amber btn-sm" data-sell-uid="${g.firstUid}">售 ${g.price}币</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}</div>`
      : '<div class="armory-empty-prompt">行囊百宝匣空空如也，快去墨土五域拾荒探险吧！</div>';

    bodyHtml = `
      <div class="armory-vault armory-vault-expanded">
        <div class="armory-vault-head">
          <div class="armory-vault-title-group">
            <span class="armory-vault-title">行囊百宝匣</span>
            <span class="armory-vault-count">载重 ${state.bag.length} / ${stats.bagMax}</span>
          </div>
          <button class="armory-sell-all-btn" id="btn-sell-all">一键变卖废品</button>
        </div>
        <div class="armory-vault-scroll">${cards}</div>
      </div>
    `;
  } else {
    const elxCards = Object.entries(state.elixirs)
      .filter(([, cnt]) => cnt > 0)
      .map(([eid, cnt]) => {
        const e = ELIXIRS[eid];
        return `
          <div class="armory-item-card q-rare">
            <div class="armory-item-main">
              ${renderVisualThumb('elixir', e, 44)}
              <div class="armory-item-text">
                <div class="armory-item-name" style="color:#f3ce7a;">${escapeHtml(e.name)} <span class="armory-elx-cnt">×${cnt}</span></div>
                <div class="armory-item-desc">${escapeHtml(e.desc)}</div>
              </div>
            </div>
            <div class="armory-item-actions">
              <button class="btn btn-green btn-sm" data-use-elx="${eid}">服用</button>
            </div>
          </div>
        `;
      }).join('');

    bodyHtml = `
      <div class="armory-vault armory-vault-expanded">
        <div class="armory-vault-head">
          <div class="armory-vault-title-group">
            <span class="armory-vault-title">墨壶丹药匣</span>
            <span class="armory-vault-count">共藏 ${elixirCount} 枚灵丹</span>
          </div>
        </div>
        <div class="armory-vault-scroll">
          ${elxCards ? `<div class="armory-items-grid">${elxCards}</div>` : '<div class="armory-empty-prompt">暂无天工墨壶炼制的稀世丹药，可用金疮药散 + 荧光菇或饼干 + 纯净水炼制！</div>'}
        </div>
      </div>
    `;
  }

  openModal('行囊与异纹神兵', tabsHtml + bodyHtml);
  $('modal-box')?.classList.add('modal-armory-full');

  $('modal-body').querySelectorAll('[data-btab]').forEach((btn) => {
    btn.addEventListener('click', () => { bagTab = btn.dataset.btab; openBagModal(); });
  });
  $('modal-body').querySelectorAll('[data-unequip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = btn.dataset.unequip;
      if (state.equipped[slot]) {
        addEquipmentToBag(state.equipped[slot]);
        state.equipped[slot] = null;
        syncWorldAppearance();
        updateHUD();
        scheduleSave();
        openBagModal();
      }
    });
  });
  $('modal-body').querySelectorAll('[data-equip-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = state.equipBag.findIndex((e) => e.uid === btn.dataset.equipUid);
      if (idx < 0) return;
      const [eq] = state.equipBag.splice(idx, 1);
      if (state.equipped[eq.slot]) addEquipmentToBag(state.equipped[eq.slot]);
      state.equipped[eq.slot] = eq;
      syncWorldAppearance();
      sfx.pick(eq.quality);
      showToast(`已装备【${eq.name}】！`, 'success');
      updateHUD();
      scheduleSave();
      openBagModal();
    });
  });
  $('modal-body').querySelectorAll('[data-sell-eq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = state.equipBag.findIndex((e) => e.uid === btn.dataset.sellEq);
      if (idx < 0) return;
      const [eq] = state.equipBag.splice(idx, 1);
      const p = getEquipSellPrice(eq);
      state.gold += p;
      sfx.coin();
      showToast(`售出【${eq.name}】，获得 ${p} 废土币！`, 'info');
      updateHUD();
      scheduleSave();
      openBagModal();
    });
  });
  $('modal-body').querySelectorAll('[data-use-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = state.bag.findIndex((b) => b.uid === btn.dataset.useUid);
      if (idx < 0) return;
      const [entry] = state.bag.splice(idx, 1);
      applyItemEffectOutsideBattle(ITEMS[entry.itemId]);
      openBagModal();
    });
  });
  $('modal-body').querySelectorAll('[data-sell-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = state.bag.findIndex((b) => b.uid === btn.dataset.sellUid);
      if (idx < 0) return;
      const [entry] = state.bag.splice(idx, 1);
      const p = getSellPrice(entry);
      state.gold += p;
      state.stats.sellGold = (state.stats.sellGold || 0) + p;
      sfx.coin();
      updateHUD();
      scheduleSave();
      openBagModal();
    });
  });
  $('modal-body').querySelectorAll('[data-use-elx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const eid = btn.dataset.useElx;
      if ((state.elixirs[eid] || 0) <= 0) return;
      state.elixirs[eid] -= 1;
      applyItemEffectOutsideBattle(ELIXIRS[eid]);
      openBagModal();
    });
  });
  $('btn-sell-all')?.addEventListener('click', () => {
    const earned = sellAllTrash(1);
    showToast(earned > 0 ? `一键变卖废品，获得 ${earned} 废土币！` : '行囊中没有可一键变卖的普通物资。', earned > 0 ? 'success' : 'info');
    openBagModal();
  });
}

function applyItemEffectOutsideBattle(item) {
  if (!item?.effect) return;
  const stats = getHeroStats();
  const ef = item.effect;
  if (ef.hp) state.hp = Math.min(stats.maxHp, state.hp + ef.hp);
  if (ef.energy) state.energy = Math.min(stats.maxEnergy, state.energy + ef.energy);
  if (ef.food) state.food = Math.min(100, state.food + ef.food);
  if (ef.radShield) state.radShield += ef.radShield;
  if (ef.clearWarn) state.warn = 0;
  sfx.pick('fine');
  showToast(`已使用【${item.name}】！`, 'success');
  updateHUD();
  scheduleSave();
}

// ==================== 4. 武学奇术阁（视觉 RPG 绝学徽章殿堂） ====================
const PASSIVE_ICON_MAP = [
  { sheet: 'icons_skills.png', col: 0, row: 0, glow: 'rgba(229,184,92,0.52)' },  // 0: 墨影步
  { sheet: 'icons_skills.png', col: 2, row: 1, glow: 'rgba(249,115,22,0.52)' },  // 1: 鹰眼术
  { sheet: 'icons_gear.png',   col: 3, row: 1, glow: 'rgba(212,162,74,0.48)' },  // 2: 行囊诀
  { sheet: 'icons_items.png',  col: 2, row: 0, glow: 'rgba(56,189,248,0.50)' },  // 3: 巧手拆解
  { sheet: 'icons_skills.png', col: 3, row: 0, glow: 'rgba(229,184,92,0.60)' },  // 4: 破风斩
  { sheet: 'icons_gear.png',   col: 3, row: 3, glow: 'rgba(94,234,212,0.58)' }   // 5: 天运诀
];

let skillHallBranch = 'all';

function openSkill() {
  const passiveHtml = SKILLS.map((sk) => {
    const lv = state.skills[sk.id] || 0;
    const isMax = lv >= sk.maxLevel;
    const cost = sk.cost[lv] || 99;
    const ico = PASSIVE_ICON_MAP[sk.id] || PASSIVE_ICON_MAP[0];
    return `
      <div class="skill-passive-card${isMax ? ' is-max' : ''}">
        <div class="skill-passive-ico">
          ${_spriteCell(ico.sheet, ico.col, ico.row, 50, 'squircle', ico.glow)}
        </div>
        <div class="skill-passive-info">
          <div class="skill-passive-top">
            <span class="skill-passive-name">${escapeHtml(sk.name)}</span>
            <span class="skill-passive-lv">Lv.${lv}/${sk.maxLevel}</span>
          </div>
          <div class="skill-passive-desc">${escapeHtml(sk.desc)}</div>
        </div>
        <button class="skill-up-btn${isMax ? ' maxed' : ''}" data-up-skill="${sk.id}" ${isMax || state.skillPoints < cost ? 'disabled' : ''}>
          ${isMax ? '已圆满' : `升级 · ${cost}点`}
        </button>
      </div>
    `;
  }).join('');

  const branchTabsHtml = `
    <div class="skill-hall-tabs">
      <button class="skill-hall-tab${skillHallBranch === 'all' ? ' active' : ''}" data-sh-branch="all">四系全览</button>
      ${SKILL_BRANCHES.map((b) =>
        `<button class="skill-hall-tab branch-${b.id}${skillHallBranch === b.id ? ' active' : ''}" data-sh-branch="${b.id}">${b.name}</button>`
      ).join('')}
    </div>
  `;

  const visibleBranches = skillHallBranch === 'all'
    ? SKILL_BRANCHES
    : SKILL_BRANCHES.filter((b) => b.id === skillHallBranch);

  const branchesHtml = visibleBranches.map((branch) => {
    const list = COMBAT_SKILLS.filter((cs) => cs.category === branch.id);
    const cards = list.map((cs) => {
      const unlocked = state.level >= cs.unlockLv;
      return `
        <div class="skill-medallion-card branch-${branch.id}${unlocked ? ' unlocked' : ' locked'}" title="${escapeHtml(cs.desc)}">
          <div class="skill-medallion-art">
            ${renderSkillIcon(cs, 54)}
          </div>
          <div class="skill-medallion-body">
            <div class="skill-medallion-head">
              <span class="skill-medallion-name">${escapeHtml(cs.name)}</span>
              <span class="skill-medallion-badge${unlocked ? ' ok' : ''}">${cs.mpCost}内息 · ${unlocked ? '已领悟' : `Lv.${cs.unlockLv}`}</span>
            </div>
            ${cs.flavor ? `<div class="skill-medallion-flavor">${escapeHtml(cs.flavor)}</div>` : ''}
            <div class="skill-medallion-desc">${escapeHtml(cs.desc)}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="skill-branch-section branch-${branch.id}">
        <div class="skill-branch-header">
          <span class="skill-branch-dot"></span>
          <span class="skill-branch-title">${branch.name}</span>
          <span class="skill-branch-count">${list.filter((s) => state.level >= s.unlockLv).length} / ${list.length} 已领悟</span>
        </div>
        <div class="skill-medallion-grid">${cards}</div>
      </div>
    `;
  }).join('');

  openModal(
    `武学奇术阁 · 修为点 ${state.skillPoints}`,
    `
      <div class="skill-hall">
        <div class="skill-section-head">
          <span class="skill-section-title">六大废土修为</span>
          <span class="skill-section-sub">消耗修为点永久精进</span>
        </div>
        <div class="skill-passive-grid">${passiveHtml}</div>

        <div class="skill-section-head skill-section-combat">
          <span class="skill-section-title">十六项四系绝学</span>
          ${branchTabsHtml}
        </div>
        <div class="skill-branches-wrap">${branchesHtml}</div>
      </div>
    `
  );

  $('modal-body').querySelectorAll('[data-sh-branch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.uiTick?.();
      skillHallBranch = btn.dataset.shBranch;
      openSkill();
    });
  });

  $('modal-body').querySelectorAll('[data-up-skill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.upSkill);
      const sk = SKILLS[id];
      const lv = state.skills[id] || 0;
      const cost = sk.cost[lv];
      if (lv >= sk.maxLevel || state.skillPoints < cost) return;
      state.skillPoints -= cost;
      state.skills[id] = lv + 1;
      sfx.ending();
      showToast(`【${sk.name}】提升至 Lv.${lv + 1}！`, 'success');
      updateHUD();
      scheduleSave();
      openSkill();
    });
  });
}

// ==================== 5. 主线支线与悬赏任务 ====================
function openQuests() {
  const tabsHtml = `
    <div class="modal-tabs">
      <button class="modal-tab-btn${questTab === 'main' ? ' active' : ''}" data-qtab="main">五幕主线</button>
      <button class="modal-tab-btn${questTab === 'side' ? ' active' : ''}" data-qtab="side">八大支线</button>
      <button class="modal-tab-btn${questTab === 'daily' ? ' active' : ''}" data-qtab="daily">悬赏与周常</button>
    </div>
  `;

  let bodyHtml = '';
  if (questTab === 'main') {
    bodyHtml = MAIN_QUESTS.map((act) => {
      const done = state.completedActs.includes(act.id);
      const stepsHtml = act.steps.map((st) => {
        const sDone = state.completedSteps.includes(st.id);
        return `<div class="modal-item-desc" style="color:${sDone ? '#86efac' : '#b8b0a0'};">${sDone ? '✓' : '○'} <strong>${escapeHtml(st.title)}</strong>：${escapeHtml(st.desc)}</div>`;
      }).join('');
      return `
        <div class="modal-list-item${done ? ' done' : ''}" style="flex-direction:column;align-items:flex-start;">
          <div class="modal-item-title">${escapeHtml(act.title)} ${done ? '【已完结】' : ''}</div>
          ${stepsHtml}
        </div>
      `;
    }).join('');
  } else if (questTab === 'side') {
    bodyHtml = SIDE_QUESTS.map((sq) => {
      const prog = getSideQuestProgress(sq);
      const claimed = state.claimedSideQuests.includes(sq.id);
      const canClaim = !claimed && prog >= sq.targetCount;
      return `
        <div class="modal-list-item${claimed ? ' done' : ''}">
          <div>
            <div class="modal-item-title">${escapeHtml(sq.name)} (${Math.min(prog, sq.targetCount)}/${sq.targetCount})</div>
            <div class="modal-item-desc">${escapeHtml(sq.desc)}</div>
          </div>
          ${claimed
            ? '<small style="color:#86efac;">已领奖</small>'
            : `<button class="btn btn-amber btn-sm" data-claim-sq="${sq.id}" ${canClaim ? '' : 'disabled'}>领赏</button>`}
        </div>
      `;
    }).join('');
  } else {
    const dailies = DAILY_TASK_TPL.map((dt) => {
      const cur = dt.type === 'pick' ? state.stats.pick : dt.type === 'dis' ? state.stats.dis : state.stats.sellGold;
      const done = state.dailyDone.includes(dt.id);
      const ready = !done && cur >= dt.target;
      return `
        <div class="modal-list-item${done ? ' done' : ''}">
          <div>
            <div class="modal-item-title">${escapeHtml(dt.name)} (${Math.min(cur, dt.target)}/${dt.target})</div>
            <div class="modal-item-desc">奖励：${dt.reward} 废土币 + ${dt.sp} 修为点</div>
          </div>
          <button class="btn btn-amber btn-sm" data-claim-daily="${dt.id}" ${ready ? '' : 'disabled'}>${done ? '已领' : '领取'}</button>
        </div>
      `;
    }).join('');

    const wCur = state.stats.pick || 0;
    const wReady = !state.weeklyDone && wCur >= WEEKLY_TASK_TPL.target;
    const tReady = !state.teamClaimed && state.teamProgress >= TEAM_TASK_TPL.target;
    bodyHtml = `
      ${dailies}
      <div class="modal-list-item${state.weeklyDone ? ' done' : ''}">
        <div>
          <div class="modal-item-title">${escapeHtml(WEEKLY_TASK_TPL.name)} (${Math.min(wCur, WEEKLY_TASK_TPL.target)}/${WEEKLY_TASK_TPL.target})</div>
          <div class="modal-item-desc">奖励：${WEEKLY_TASK_TPL.reward} 废土币 + ${WEEKLY_TASK_TPL.sp} 修为点</div>
        </div>
        <button class="btn btn-amber btn-sm" id="btn-claim-weekly" ${wReady ? '' : 'disabled'}>${state.weeklyDone ? '已领' : '领取'}</button>
      </div>
      <div class="modal-list-item${state.teamClaimed ? ' done' : ''}">
        <div>
          <div class="modal-item-title">小队电台：${escapeHtml(TEAM_TASK_TPL.name)} (${state.teamProgress}/${TEAM_TASK_TPL.target})</div>
          <div class="modal-item-desc">${escapeHtml(TEAM_TASK_TPL.desc)}</div>
        </div>
        ${state.teamClaimed
          ? '<small style="color:#86efac;">已开启</small>'
          : tReady
            ? '<button class="btn btn-purple btn-sm" id="btn-claim-team">开启空投箱</button>'
            : '<button class="btn btn-primary btn-sm" id="btn-ping-team">发信号 (+2)</button>'}
      </div>
    `;
  }

  openModal('五幕主线 · 支线悬赏录', tabsHtml + bodyHtml);

  $('modal-body').querySelectorAll('[data-qtab]').forEach((btn) => {
    btn.addEventListener('click', () => { questTab = btn.dataset.qtab; openQuests(); });
  });
  $('modal-body').querySelectorAll('[data-claim-sq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sq = SIDE_QUESTS.find((x) => x.id === btn.dataset.claimSq);
      if (!sq || state.claimedSideQuests.includes(sq.id)) return;
      state.claimedSideQuests.push(sq.id);
      state.gold += sq.rewardGold;
      state.skillPoints += sq.rewardSp;
      if (sq.rewardEquip) {
        const eq = rollEquipment(sq.rewardEquip, 'rare');
        if (eq) addEquipmentToBag(eq);
      }
      sfx.ending();
      showToast(`支线【${sq.name}】领赏成功！获 ${sq.rewardGold} 币 + ${sq.rewardSp} 修为点及词缀装备！`, 'success');
      updateHUD();
      scheduleSave();
      openQuests();
    });
  });
  $('modal-body').querySelectorAll('[data-claim-daily]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.claimDaily);
      const dt = DAILY_TASK_TPL.find((x) => x.id === id);
      if (!dt || state.dailyDone.includes(id)) return;
      state.dailyDone.push(id);
      state.gold += dt.reward;
      state.skillPoints += dt.sp;
      sfx.coin();
      showToast(`日常【${dt.name}】领赏成功！`, 'success');
      updateHUD();
      scheduleSave();
      openQuests();
    });
  });
  $('btn-claim-weekly')?.addEventListener('click', () => {
    state.weeklyDone = true;
    state.gold += WEEKLY_TASK_TPL.reward;
    state.skillPoints += WEEKLY_TASK_TPL.sp;
    sfx.ending();
    showToast('周常任务领赏成功！', 'success');
    updateHUD();
    scheduleSave();
    openQuests();
  });
  $('btn-ping-team')?.addEventListener('click', () => {
    state.teamProgress = Math.min(TEAM_TASK_TPL.target, state.teamProgress + 2);
    sfx.pick('fine');
    scheduleSave();
    openQuests();
  });
  $('btn-claim-team')?.addEventListener('click', () => {
    state.teamClaimed = true;
    state.gold += 600;
    const eq = rollEquipment('wpn_plasma_rifle', 'rare');
    if (eq) addEquipmentToBag(eq);
    sfx.ending();
    showToast('开启战前空投箱！获得 600 币与稀有词缀装备！', 'success');
    updateHUD();
    scheduleSave();
    openQuests();
  });
}

// ==================== 6. 古董志怪与剧情图鉴 ====================
function openCollection() {
  const tabsHtml = `
    <div class="modal-tabs">
      <button class="modal-tab-btn${collectionTab === 'antiques' ? ' active' : ''}" data-ct="antiques">战前古董 (${state.collections.length}/${COLLECTIONS.length})</button>
      <button class="modal-tab-btn${collectionTab === 'stories' ? ' active' : ''}" data-ct="stories">剧情信物 (${state.stories.length}/${STORY_CHAPTERS.length})</button>
      <button class="modal-tab-btn${collectionTab === 'bestiary' ? ' active' : ''}" data-ct="bestiary">墨土志怪 (${state.seenEnemies.length}/${Object.keys(ENEMIES).length})</button>
    </div>
  `;

  let bodyHtml = '';
  if (collectionTab === 'antiques') {
    bodyHtml = `<div class="col-grid">${COLLECTIONS.map((c) => {
      const ok = state.collections.includes(c.id);
      return `
        <div class="col-card ${ok ? 'unlocked' : 'locked'}">
          <div class="modal-item-title">${ok ? escapeHtml(c.name) : '？？？'} <small>${ok ? escapeHtml(c.era) : '未寻获'}</small></div>
          <div class="modal-item-desc">${ok ? escapeHtml(c.desc) : '探索各大废墟与古墓密室有概率发掘。'}</div>
        </div>
      `;
    }).join('')}</div>`;
  } else if (collectionTab === 'stories') {
    bodyHtml = STORY_CHAPTERS.map((ch) => {
      const ok = state.stories.includes(ch.id);
      return `
        <div class="col-card ${ok ? 'unlocked' : 'locked'}">
          <div class="modal-item-title">${escapeHtml(ch.title)} · 信物【${escapeHtml(ch.relic)}】</div>
          <div class="modal-item-desc">${ok ? escapeHtml(ch.text) : '尚未寻得此信物，继续推进五幕主线以揭开 21:47 的真相。'}</div>
        </div>
      `;
    }).join('');
  } else {
    bodyHtml = `<div class="col-grid">${Object.values(ENEMIES).map((en) => {
      const seen = state.seenEnemies.includes(en.id);
      const capCnt = state.capturedSpirits[en.id] || 0;
      return `
        <div class="col-card ${seen ? 'unlocked' : 'locked'}">
          <div class="modal-item-title">${seen ? escapeHtml(en.name) : '未知墨妖'} ${en.isBoss ? '<small style="color:#fde68a;">[首领]</small>' : ''}</div>
          <div class="modal-item-desc">${seen ? `HP ${en.hp} · ATK ${en.atk} · DEF ${en.def}${en.capturable ? ` · 已收魂 ×${capCnt}` : ''}<br/>${escapeHtml(en.desc)}` : '尚未在野外遭遇。'}</div>
        </div>
      `;
    }).join('')}</div>`;
  }

  openModal('古董志怪 · 墨土博物志', tabsHtml + bodyHtml);
  $('modal-body').querySelectorAll('[data-ct]').forEach((btn) => {
    btn.addEventListener('click', () => { collectionTab = btn.dataset.ct; openCollection(); });
  });
}

// ==================== 7. 英雄榜与结局检查 ====================
function openRank() {
  const myScore = state.gold + state.level * 600 + state.collections.length * 1200 + state.defeatedBosses.length * 1500;
  const rows = [
    ...RANK_BOTS,
    { name: `${currentUser}（你）`, level: state.level, gold: state.gold, score: myScore, isSelf: true }
  ].sort((a, b) => b.score - a.score);

  const listHtml = rows.map((r, idx) => `
    <div class="modal-list-item${r.isSelf ? ' done' : ''}">
      <div class="modal-item-title">#${idx + 1} ${escapeHtml(r.name)} · Lv.${r.level}</div>
      <div class="modal-item-desc">综合声望分：<strong>${r.score.toLocaleString()}</strong> · 资产 ${r.gold.toLocaleString()} 币</div>
    </div>
  `).join('');

  const canEnding = state.gold >= 15000 || state.defeatedBosses.includes('boss_tianshu') || state.collections.length >= COLLECTIONS.length;
  openModal(
    '墨土英雄榜',
    listHtml,
    `${canEnding ? '<button class="btn btn-purple" id="btn-trigger-ending">见证墨土终局</button>' : ''}<button class="btn btn-secondary" id="modal-default-close">合上卷轴</button>`
  );
  $('btn-trigger-ending')?.addEventListener('click', openEndingModal);
}

function openEndingModal() {
  advanceQuestTrigger('trigger_ending');
  let ending = ENDINGS.normal;
  const hasBoss = state.defeatedBosses.includes('boss_tianshu');
  const allCol = state.collections.length >= COLLECTIONS.length;
  const allStory = state.stories.length >= STORY_CHAPTERS.length;

  if (hasBoss && allCol && allStory && state.unlockedGuardians.length > 0) {
    ending = ENDINGS.king;
  } else if (hasBoss && allStory) {
    ending = ENDINGS.friend;
  } else if (allCol) {
    ending = ENDINGS.collector;
  }

  if (!state.endingsUnlocked.includes(ending.id)) {
    state.endingsUnlocked.push(ending.id);
  }
  sfx.ending();
  saveNow();

  openModal(
    `${ending.badge} · ${ending.title}`,
    `<div class="modal-list-item done" style="flex-direction:column;align-items:flex-start;gap:8px;">
      <div class="modal-item-title" style="font-size:16px;color:#f3ce7a;">${escapeHtml(ending.title)}</div>
      <div class="modal-item-desc" style="font-size:13px;color:#e8dec8;line-height:1.75;">${escapeHtml(ending.content)}</div>
      <div class="modal-item-desc">已达成结局数：${state.endingsUnlocked.length} / 4 · 天命完成度 ${getEndingProgressPct()}%</div>
    </div>`,
    '<button class="btn btn-amber" id="modal-default-close">继续漫游墨土五域</button>'
  );
}

// ==================== 8. 城镇服务：杂货铺 / 医馆 / 拆解坊 / 钱庄 ====================
function openShop() {
  const stats = getHeroStats();
  const bagFull = state.bag.length >= stats.bagMax;
  const rows = SHOP_STOCK.map((s) => {
    const it = ITEMS[s.itemId];
    const noGold = state.gold < s.price;
    const isDisabled = noGold || bagFull;
    const btnLabel = bagFull ? '行囊已满' : noGold ? `缺币 (${s.price}币)` : `买 ${s.price}币`;
    return `
      <div class="modal-list-item">
        <div style="display:flex;align-items:center;gap:10px;">
          ${renderVisualThumb('item', it, 44)}
          <div>
            <div class="modal-item-title">${escapeHtml(it.name)}</div>
            <div class="modal-item-desc">${escapeHtml(it.desc)}</div>
          </div>
        </div>
        <button class="btn btn-amber btn-sm" data-buy-id="${s.itemId}" data-buy-price="${s.price}" ${isDisabled ? 'disabled' : ''}>${btnLabel}</button>
      </div>
    `;
  }).join('');

  openModal(
    `杂货铺交易 · 持有 ${state.gold} 废土币`,
    rows,
    '<button class="btn btn-green" id="shop-sell-all">一键售出废品</button><button class="btn btn-secondary" id="modal-default-close">离开柜台</button>'
  );

  $('modal-body').querySelectorAll('[data-buy-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.buyId);
      const price = Number(btn.dataset.buyPrice);
      const stats = getHeroStats();
      if (state.gold < price) { showToast('废土币不足！', 'warn'); return; }
      if (state.bag.length >= stats.bagMax) { showToast('行囊已满！', 'warn'); return; }
      state.gold -= price;
      state.bag.push({ uid: `buy_${Date.now()}_${Math.random()}`, itemId: id, quality: 'common' });
      sfx.coin();
      showToast(`购得【${ITEMS[id].name}】！`, 'success');
      updateHUD();
      scheduleSave();
      openShop();
    });
  });

  $('shop-sell-all')?.addEventListener('click', () => {
    const earned = sellAllTrash(1);
    showToast(earned > 0 ? `售出废品获 ${earned} 废土币！` : '暂无可售废品。', earned > 0 ? 'success' : 'info');
    openShop();
  });
}

function openInn() {
  const stats = getHeroStats();
  openModal(
    '回春医馆 · 歇脚疗伤',
    `
      <div class="modal-list-item">
        <div>
          <div class="modal-item-title">草药安神汤（40 废土币）</div>
          <div class="modal-item-desc">立即回满气血 (${stats.maxHp}) 与内息 (${stats.maxEnergy})，饱食 +50。</div>
        </div>
        <button class="btn btn-green btn-sm" id="inn-rest-basic" ${state.gold < 40 ? 'disabled' : ''}>${state.gold < 40 ? '缺币 (40币)' : '歇脚 40币'}</button>
      </div>
      <div class="modal-list-item">
        <div>
          <div class="modal-item-title">秘制药浴 + 抗辐针（120 废土币）</div>
          <div class="modal-item-desc">全状态回满（含饱食 100），清零警戒，并获 1 层抗辐射护盾！</div>
        </div>
        <button class="btn btn-amber btn-sm" id="inn-rest-pro" ${state.gold < 120 ? 'disabled' : ''}>${state.gold < 120 ? '缺币 (120币)' : '药浴 120币'}</button>
      </div>
    `
  );

  $('inn-rest-basic')?.addEventListener('click', () => {
    if (state.gold < 40) { showToast('废土币不足 40！', 'warn'); return; }
    state.gold -= 40;
    state.hp = stats.maxHp;
    state.energy = stats.maxEnergy;
    state.food = Math.min(100, state.food + 50);
    state.day += 1;
    sfx.pick('fine');
    showToast('气血内息已完全恢复！', 'success');
    updateHUD();
    scheduleSave();
    closeModal();
  });

  $('inn-rest-pro')?.addEventListener('click', () => {
    if (state.gold < 120) { showToast('废土币不足 120！', 'warn'); return; }
    state.gold -= 120;
    state.hp = stats.maxHp;
    state.energy = stats.maxEnergy;
    state.food = 100;
    state.warn = 0;
    state.radShield += 1;
    state.day += 1;
    sfx.pick('rare');
    showToast('元气巅峰！获得 1 层抗辐射护盾！', 'success');
    updateHUD();
    scheduleSave();
    closeModal();
  });
}

function openDisassemble() {
  const candidates = state.bag.filter((b) => ITEMS[b.itemId]?.dis);
  const baseRate = clamp(0.62 + (state.skills[3] || 0) * 0.10, 0.62, 0.95);
  const rows = candidates.length
    ? candidates.map((b) => {
      const it = ITEMS[b.itemId];
      const q = QUALITY[b.quality] || QUALITY.common;
      const baseVal = getSellPrice(b);
      return `
        <div class="modal-list-item">
          <div style="display:flex;align-items:center;gap:10px;">
            ${renderVisualThumb('item', it, 44)}
            <div>
              <div class="modal-item-title" style="color:${q.color};">[${q.name}] ${escapeHtml(it.name)}</div>
              <div class="modal-item-desc">原价 ${baseVal} 币 · 拆解成功率 ${Math.round(baseRate * 100)}%（成功 1.8×~2.8× 暴击收益）</div>
            </div>
          </div>
          <button class="btn btn-amber btn-sm" data-dis-uid="${b.uid}">拆解</button>
        </div>
      `;
    }).join('')
    : '<div class="modal-item-desc">行囊中没有可拆解的电子件/军工残骸（旧家电、电路板、显卡、伺服机等可拆解）。</div>';

  openModal('巧匠拆解坊', rows);

  $('modal-body').querySelectorAll('[data-dis-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = state.bag.findIndex((b) => b.uid === btn.dataset.disUid);
      if (idx < 0) return;
      const [entry] = state.bag.splice(idx, 1);
      const baseVal = getSellPrice(entry);
      state.stats.dis = (state.stats.dis || 0) + 1;

      if (Math.random() < baseRate) {
        const crit = Math.random() < (0.2 + (state.skills[5] || 0) * 0.08);
        const mult = (1.8 + (state.skills[3] || 0) * 0.2) * (crit ? 1.45 : 1);
        const gain = Math.round(baseVal * mult);
        state.gold += gain;
        sfx.disassemble(true, crit);
        showToast(`拆解${crit ? '大暴击' : '成功'}！获利 ${gain} 废土币！`, 'success');
      } else {
        const salvage = Math.round(baseVal * 0.35);
        state.gold += salvage;
        sfx.disassemble(false);
        showToast(`拆解失手，仅回收零碎铜铁 +${salvage} 废土币。`, 'warn');
      }
      updateHUD();
      scheduleSave();
      openDisassemble();
    });
  });
}

function openLoan() {
  openModal(
    '黑哥钱庄 · 废土周转',
    `
      <div class="modal-list-item">
        <div>
          <div class="modal-item-title">当前欠款：${state.debt} 废土币</div>
          <div class="modal-item-desc">应急借贷 500 废土币（需偿还 600 废土币），限单笔在贷。</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-amber btn-sm" id="loan-borrow" ${state.debt > 0 ? 'disabled' : ''}>借 500币</button>
          <button class="btn btn-green btn-sm" id="loan-repay" ${state.debt <= 0 || state.gold < state.debt ? 'disabled' : ''}>全额还清</button>
        </div>
      </div>
    `
  );
  $('loan-borrow')?.addEventListener('click', () => {
    state.gold += 500;
    state.debt = 600;
    sfx.coin();
    showToast('已借入 500 废土币，请记得及时偿还！', 'info');
    updateHUD();
    scheduleSave();
    openLoan();
  });
  $('loan-repay')?.addEventListener('click', () => {
    if (state.gold < state.debt) return;
    state.gold -= state.debt;
    state.debt = 0;
    state.reputation += 1;
    sfx.coin();
    showToast('欠款已清，营地声望 +1！', 'success');
    updateHUD();
    scheduleSave();
    openLoan();
  });
}

// ==================== 9. 存档石碑与账号管理（多槽位 + JSON 备份） ====================
function formatSaveTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openSaveModal(atShrine = false) {
  const tabsHtml = `
    <div class="modal-tabs">
      <button class="modal-tab-btn${saveModalTab === 'slots' ? ' active' : ''}" data-stab="slots">多档位存/读档 (槽位 1~3 + 自动档)</button>
      <button class="modal-tab-btn${saveModalTab === 'account' ? ' active' : ''}" data-stab="account">行者名录 · 密卷拓印</button>
    </div>
  `;

  let bodyHtml = '';
  if (saveModalTab === 'slots') {
    const banner = atShrine
      ? `<div class="modal-list-item done"><div class="modal-item-title" style="color:#86efac;">墨石记录碑 · 可写入手工存档（已润泽回复 25% 气血与内息）</div></div>`
      : `<div class="modal-item-desc">当前幸存者：<strong>${escapeHtml(currentUser)}</strong> · 支持 3 个手工档位与 1 个自动档，随时读档或覆写。</div>`;

    const slots = storage.listSlots(currentUser);
    const slotRows = slots.map((s) => {
      const isAuto = s.slotId === 'auto';
      const detail = s.empty
        ? '空槽位 · 尚未镌刻记录'
        : `【第${['一', '二', '三', '四', '五'][clamp((s.act || 1) - 1, 0, 4)]}幕】${escapeHtml(s.mapName)} · Lv.${s.lv} · ${Number(s.gold).toLocaleString()} 币 · ${formatSaveTime(s.savedAt)}`;
      return `
        <div class="modal-list-item${!s.empty ? ' done' : ''}">
          <div>
            <div class="modal-item-title">${escapeHtml(s.label)} ${isAuto ? '<small style="color:#d49a3a;">[实时自动]</small>' : ''}</div>
            <div class="modal-item-desc">${detail}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            ${!isAuto ? `<button class="btn btn-amber btn-sm" data-slot-save="${s.slotId}">存档</button>` : ''}
            <button class="btn btn-primary btn-sm" data-slot-load="${s.slotId}" data-slot-label="${escapeHtml(s.label)}" ${s.empty ? 'disabled' : ''}>读档</button>
            ${!isAuto ? `<button class="btn btn-vermilion btn-sm" data-slot-del="${s.slotId}" ${s.empty ? 'disabled' : ''}>删除</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    bodyHtml = `${banner}<div style="display:flex;flex-direction:column;gap:8px;">${slotRows}</div>`;
  } else {
    const accounts = storage.getAccounts();
    const listHtml = accounts.map((a) => `
      <div class="modal-list-item${a.username === currentUser ? ' done' : ''}">
        <div class="modal-item-title">${escapeHtml(a.username)} ${a.username === currentUser ? '(当前)' : ''}</div>
        <div style="display:flex;gap:6px;">
          ${a.username !== currentUser ? `<button class="btn btn-primary btn-sm" data-switch-user="${escapeHtml(a.username)}">切换</button>` : ''}
          ${accounts.length > 1 ? `<button class="btn btn-vermilion btn-sm" data-del-user="${escapeHtml(a.username)}">删除</button>` : ''}
        </div>
      </div>
    `).join('');

    bodyHtml = `
      <div style="display:flex;gap:8px;">
        <input id="acc-new-name" class="input-field" placeholder="输入新幸存者代号（≤16字）" maxlength="16" />
        <button class="btn btn-amber" id="acc-create-btn" style="white-space:nowrap;">登录/新建</button>
      </div>
      <div class="modal-item-title">已有存档账号</div>
      ${listHtml}
      <details style="margin-top:8px;">
        <summary class="modal-item-title" style="cursor:pointer;user-select:none;">高级存档迁移码（镌刻与拓印）</summary>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <textarea id="json-backup-text" class="textarea-field" placeholder="点击「拓印当前行迹」生成密卷铭文，或粘贴密卷铭文后点击「还原行迹」"></textarea>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" id="btn-json-export">拓印当前行迹</button>
            <button class="btn btn-purple btn-sm" id="btn-json-import">还原覆盖当前行者</button>
          </div>
        </div>
      </details>
    `;
  }

  openModal(atShrine ? '墨石记录碑 · 多档位存/读档' : '存档石碑与账号管理', tabsHtml + bodyHtml);

  $('modal-body').querySelectorAll('[data-stab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      saveModalTab = btn.dataset.stab;
      openSaveModal(atShrine);
    });
  });

  if (saveModalTab === 'slots') {
    $('modal-body').querySelectorAll('[data-slot-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (world?.hero) {
          state.heroX = Math.round(world.hero.x);
          state.heroY = Math.round(world.hero.y);
        }
        storage.writeSlot(currentUser, btn.dataset.slotSave, state, getSaveMeta());
        sfx.ending();
        showToast('已将当前墨土行迹镌刻入记录槽位！', 'success');
        openSaveModal(atShrine);
      });
    });
    $('modal-body').querySelectorAll('[data-slot-load]').forEach((btn) => {
      btn.addEventListener('click', () => {
        loadFromSlot(btn.dataset.slotLoad, btn.dataset.slotLabel);
      });
    });
    $('modal-body').querySelectorAll('[data-slot-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        storage.deleteSlot(currentUser, btn.dataset.slotDel);
        showToast('已抹除该记录槽位。', 'info');
        openSaveModal(atShrine);
      });
    });
  } else {
    $('acc-create-btn')?.addEventListener('click', () => {
      const val = $('acc-new-name').value.trim();
      if (!val) { showToast('请输入有效代号！', 'warn'); return; }
      try {
        saveNow();
        storage.loginOrCreate(val);
        switchUserProfile(val);
        closeModal();
        showToast(`已切换至幸存者「${val}」！`, 'success');
      } catch (err) {
        showToast(err.message || '创建失败', 'danger');
      }
    });

    $('modal-body').querySelectorAll('[data-switch-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveNow();
        const uname = btn.dataset.switchUser;
        storage.loginOrCreate(uname);
        switchUserProfile(uname);
        closeModal();
        showToast(`已切换至「${uname}」`, 'success');
      });
    });

    $('modal-body').querySelectorAll('[data-del-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uname = btn.dataset.delUser;
        const next = storage.deleteAccount(uname);
        switchUserProfile(next);
        openSaveModal(atShrine);
      });
    });

    $('btn-json-export')?.addEventListener('click', () => {
      saveNow();
      const box = $('json-backup-text');
      if (box) {
        box.value = JSON.stringify(state);
        box.select();
      }
      showToast('已拓印当前行迹密卷，可复制留存！', 'success');
    });

    $('btn-json-import')?.addEventListener('click', () => {
      const raw = $('json-backup-text')?.value?.trim();
      if (!raw) { showToast('请先粘贴行迹密卷铭文！', 'warn'); return; }
      try {
        const parsed = JSON.parse(raw);
        state = migrateState(parsed);
        saveNow();
        closeModal();
        enterMap(state.mapId, state.heroX, state.heroY);
        showToast('行迹密卷还原成功！', 'success');
      } catch {
        showToast('密卷铭文残缺有误，还原失败！', 'danger');
      }
    });
  }
}

function openAccountModal() {
  saveModalTab = 'slots';
  openSaveModal(false);
}

function switchUserProfile(username) {
  currentUser = username;
  const loaded = storage.loadSave(username);
  state = migrateState(loaded);
  enterMap(state.mapId, state.heroX, state.heroY);
}

function replayStudioSplashAndPrologue() {
  closeModal(true);
  const splashEl = $('studio-splash');
  if (!splashEl) {
    openOpeningPrologue(false);
    return;
  }
  if (world) world.paused = true;
  splashEl.style.display = '';
  splashEl.classList.remove('hidden', 'splash-done', 'splash-fading');
  // 重新触发 SVG 与印章入场动画
  const stage = splashEl.querySelector('.splash-stage');
  if (stage) {
    const clone = stage.cloneNode(true);
    stage.replaceWith(clone);
  }
  sfx.playStudioJingle?.();

  let finished = false;
  let fadeTimer = null;
  let doneTimer = null;
  const finishReplaySplash = () => {
    if (finished) return;
    finished = true;
    if (fadeTimer) clearTimeout(fadeTimer);
    if (doneTimer) clearTimeout(doneTimer);
    splashEl.classList.add('splash-fading');
    setTimeout(() => {
      splashEl.classList.add('splash-done');
      openOpeningPrologue(false);
    }, 600);
  };

  const skipBtn = $('btn-skip-splash');
  const onSkip = (e) => {
    e?.stopPropagation?.();
    sfx.uiTick?.();
    finishReplaySplash();
  };
  skipBtn?.addEventListener('click', onSkip, { once: true });
  splashEl.addEventListener('click', onSkip, { once: true });
  fadeTimer = setTimeout(finishReplaySplash, 4400);
}

function getMergedAudioSettings() {
  const raw = typeof sfx.getSettings === 'function' ? (sfx.getSettings() || {}) : {};
  return {
    bgmMuted: Boolean(raw.bgmMuted),
    sfxMuted: Boolean(raw.sfxMuted),
    footstepsEnabled: raw.footstepsEnabled !== false,
    bgmVolume: typeof raw.bgmVolume === 'number' ? raw.bgmVolume : 0.65,
    sfxVolume: typeof raw.sfxVolume === 'number' ? raw.sfxVolume : 0.8
  };
}

function openHelpModal(tab = null) {
  if (tab) settingsModalTab = tab;
  const audioCfg = getMergedAudioSettings();
  const bgmPct = Math.round(clamp(audioCfg.bgmVolume, 0, 1) * 100);
  const sfxPct = Math.round(clamp(audioCfg.sfxVolume, 0, 1) * 100);

  const tabsHtml = `
    <div class="modal-tabs">
      <button class="modal-tab-btn${settingsModalTab === 'settings' ? ' active' : ''}" data-stab="settings">游戏设置</button>
      <button class="modal-tab-btn${settingsModalTab === 'guide' ? ' active' : ''}" data-stab="guide">江湖指南</button>
    </div>
  `;

  let bodyHtml = '';
  if (settingsModalTab === 'settings') {
    bodyHtml = `
      <div class="settings-panel">
        <div class="settings-row">
          <div class="settings-label-col">
            <div class="settings-title">背景音乐 (BGM)</div>
            <div class="settings-sub">城镇古筝笛韵、荒原风沙与战鼓配乐</div>
          </div>
          <div class="settings-ctrl-col">
            <label class="settings-switch">
              <input type="checkbox" id="set-bgm-enabled" ${audioCfg.bgmMuted ? '' : 'checked'} />
              <span class="settings-switch-track"></span>
            </label>
          </div>
        </div>
        <div class="settings-slider-row">
          <span class="settings-slider-label">音乐音量</span>
          <input type="range" id="set-bgm-vol" class="settings-range" min="0" max="100" value="${bgmPct}" />
          <span class="settings-slider-val" id="set-bgm-vol-val">${bgmPct}%</span>
        </div>

        <div class="settings-row">
          <div class="settings-label-col">
            <div class="settings-title">战斗与交互音效 (SFX)</div>
            <div class="settings-sub">古武剑气、军火枪炮、机甲激光、奇术雷鸣与界面清音</div>
          </div>
          <div class="settings-ctrl-col">
            <label class="settings-switch">
              <input type="checkbox" id="set-sfx-enabled" ${audioCfg.sfxMuted ? '' : 'checked'} />
              <span class="settings-switch-track"></span>
            </label>
          </div>
        </div>
        <div class="settings-slider-row">
          <span class="settings-slider-label">音效音量</span>
          <input type="range" id="set-sfx-vol" class="settings-range" min="0" max="100" value="${sfxPct}" />
          <span class="settings-slider-val" id="set-sfx-vol-val">${sfxPct}%</span>
        </div>

        <div class="settings-row">
          <div class="settings-label-col">
            <div class="settings-title">行走脚步声</div>
            <div class="settings-sub">探索城镇石板与野外废土时的轻缓步履回响</div>
          </div>
          <div class="settings-ctrl-col">
            <label class="settings-switch">
              <input type="checkbox" id="set-footsteps" ${audioCfg.footstepsEnabled ? 'checked' : ''} />
              <span class="settings-switch-track"></span>
            </label>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-label-col">
            <div class="settings-title">战斗震屏特效</div>
            <div class="settings-sub">暴击、重炮轰击与首领绝招时的画面震颤反馈</div>
          </div>
          <div class="settings-ctrl-col">
            <label class="settings-switch">
              <input type="checkbox" id="set-screenshake" ${gameSettings.screenShakeEnabled ? 'checked' : ''} />
              <span class="settings-switch-track"></span>
            </label>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn btn-amber" id="btn-replay-intro">重播「老年饼工作室」片头与序章</button>
        </div>
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="modal-list-item"><div class="modal-item-desc"><strong>移动与交互</strong>：桌面使用 WASD/方向键或点击地面寻路，E/空格键交互，Esc 关闭卷轴/对话；手机端使用左下角四向十字键与右下角主交互键。</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>五域 21 图</strong>：点击「天下舆图」可纵览五大区域与全部 21 张无缝地图（城镇/室内/荒原/秘境洞窟）。</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>收妖与天工墨壶</strong>：战斗中将荒原妖邪血量压至 ≤40%，点击「收妖」收入墨壶；在「天工墨壶」中放入任意 2 件妖魂/物资，阴阳化生即可炼成护驾灵兽、稀世丹药与异纹神兵！</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>四大流派</strong>：古武门派、现代军火、科幻墨甲、仙妖奇术 16 项主动技能随等级自动解锁，各有专属战斗视效与音效。</div></div>
    `;
  }

  openModal('游戏设置 · 江湖指南', tabsHtml + bodyHtml);

  document.querySelectorAll('.modal-tab-btn[data-stab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.uiTick?.();
      settingsModalTab = btn.dataset.stab;
      openHelpModal();
    });
  });

  if (settingsModalTab === 'settings') {
    $('set-bgm-enabled')?.addEventListener('change', (e) => {
      sfx.updateSettings?.({ bgmMuted: !e.target.checked });
      sfx.uiTick?.();
    });
    $('set-bgm-vol')?.addEventListener('input', (e) => {
      const pct = Number(e.target.value) || 0;
      if ($('set-bgm-vol-val')) $('set-bgm-vol-val').textContent = `${pct}%`;
      sfx.updateSettings?.({ bgmVolume: pct / 100 });
    });
    $('set-sfx-enabled')?.addEventListener('change', (e) => {
      sfx.updateSettings?.({ sfxMuted: !e.target.checked });
      if (e.target.checked) sfx.uiTick?.();
    });
    $('set-sfx-vol')?.addEventListener('input', (e) => {
      const pct = Number(e.target.value) || 0;
      if ($('set-sfx-vol-val')) $('set-sfx-vol-val').textContent = `${pct}%`;
      sfx.updateSettings?.({ sfxVolume: pct / 100 });
    });
    $('set-footsteps')?.addEventListener('change', (e) => {
      sfx.updateSettings?.({ footstepsEnabled: Boolean(e.target.checked) });
      sfx.uiTick?.();
    });
    $('set-screenshake')?.addEventListener('change', (e) => {
      saveGameSettings({ screenShakeEnabled: Boolean(e.target.checked) });
      sfx.uiTick?.();
    });
    $('btn-replay-intro')?.addEventListener('click', () => {
      sfx.uiTick?.();
      replayStudioSplashAndPrologue();
    });
  }
}

// ==================== 10. 开篇四幕水墨序章过场 ====================
let prologueFadeTimer = null;

function applyPrologueSlideContent() {
  const slide = PROLOGUE_SLIDES[prologueIndex] || PROLOGUE_SLIDES[0];
  const chEl = $('prologue-chapter');
  const titleEl = $('prologue-title');
  const textEl = $('prologue-text');
  const dotsEl = $('prologue-dots');
  const nextBtn = $('btn-prologue-next');

  if (chEl) chEl.textContent = slide.chapter;
  if (titleEl) titleEl.textContent = slide.title;
  if (textEl) {
    textEl.textContent = slide.text;
    textEl.style.animation = 'none';
    void textEl.offsetWidth;
    textEl.style.animation = '';
  }
  if (dotsEl) {
    dotsEl.innerHTML = PROLOGUE_SLIDES.map((_, i) =>
      `<span class="prologue-dot${i === prologueIndex ? ' active' : ''}"></span>`
    ).join('');
  }
  if (nextBtn) {
    nextBtn.textContent = prologueIndex >= PROLOGUE_SLIDES.length - 1 ? '踏入墨石镇 ▸' : '下一页 ▸';
  }
}

function renderPrologueSlide(withFade = false) {
  const card = document.querySelector('#opening-prologue .prologue-scroll-card');
  if (!withFade || !card) {
    applyPrologueSlideContent();
    return;
  }
  if (prologueFadeTimer) clearTimeout(prologueFadeTimer);
  card.style.transition = 'opacity 0.22s ease';
  card.classList.remove('slide-fade-in');
  card.classList.add('slide-fade-out');
  card.style.opacity = '0';
  prologueFadeTimer = setTimeout(() => {
    applyPrologueSlideContent();
    card.classList.remove('slide-fade-out');
    card.classList.add('slide-fade-in');
    card.style.opacity = '1';
  }, 200);
}

function openOpeningPrologue(deferBgm = false) {
  const overlay = $('opening-prologue');
  if (!overlay) return;
  prologueIndex = 0;
  if (world) world.paused = true;
  renderPrologueSlide(false);
  overlay.classList.remove('hidden');
  if (!deferBgm) {
    sfx.playBgm?.('prologue');
  }
}

function finishOpeningPrologue() {
  const overlay = $('opening-prologue');
  overlay?.classList.add('hidden');
  state.prologueSeen = true;
  saveNow();
  if (world && !battle && !currentDialog && $('modal-backdrop')?.classList.contains('hidden')) {
    world.paused = false;
  }
  if (!battle) {
    const curMap = MAPS_BY_ID[state.mapId] || MAPS[0];
    const region = getMapRegion(curMap);
    sfx.playBgm?.(getBgmTrackForMap(curMap.id));
    showSceneTitleBanner(curMap.name, region.name);
    showToast(`抵达「${curMap.name}」`, 'info');
    maybeTriggerMapEntryCutscene(curMap.id);
  }
}

// ==================== 周期危机：辐射潮 ====================
function startHazardLoop() {
  if (hazardTimer) clearInterval(hazardTimer);
  hazardTimer = setInterval(() => {
    if (!world?.map || battle || world.paused) return;
    const curMap = world.map;
    if (!curMap.hasTide) return;
    state.tideSec -= 1;
    if (state.tideSec <= 0) {
      state.tideSec = 60;
      const stats = getHeroStats();
      if (stats.immuneTide) {
        showToast('【天枢护心镜】发光护体，完美免疫本次辐射潮！', 'success');
      } else if (state.radShield > 0) {
        state.radShield -= 1;
        showToast(`抗辐射护盾抵挡了辐射潮！（剩余护盾 ${state.radShield}）`, 'info');
      } else {
        const dmg = Math.max(8, Math.round(28 * (1 - stats.radResist)));
        state.hp = Math.max(1, state.hp - dmg);
        sfx.geiger();
        showToast(`辐射潮席卷！气血 -${dmg}（抗辐减伤已生效）`, 'danger');
        floatNearHero(`辐射 -${dmg}`, '#6fb98f');
      }
      scheduleSave();
    }
    updateHUD();
  }, 1000);
}

// ==================== 王者荣耀横屏人体工学多端 UI 缩放系统 (v23) ====================
function apply1080pUiScale() {
  const vw = Math.max(320, window.innerWidth || 1280);
  const vh = Math.max(240, window.innerHeight || 720);
  const uiScale = Math.max(0.72, Math.min(1.06, Math.min(vw / 1280, vh / 600)));
  const battleWheelScale = Math.max(0.76, Math.min(1.06, Math.min(vw / 1180, vh / 540)));
  const root = document.documentElement;
  root.style.setProperty('--ui-scale', uiScale.toFixed(3));
  root.style.setProperty('--wheel-scale', battleWheelScale.toFixed(3));
  if (vh <= 520) {
    root.setAttribute('data-density', 'compact');
  } else {
    root.removeAttribute('data-density');
  }
}

// ==================== 全局初始化与事件绑定 ====================
function init() {
  // 应用 1080P 参考标准 UI 缩放并监听视口变化
  apply1080pUiScale();
  window.addEventListener('resize', apply1080pUiScale);
  window.addEventListener('orientationchange', () => {
    apply1080pUiScale();
    setTimeout(apply1080pUiScale, 120);
  });

  // 加载存档
  const saved = storage.loadSave(currentUser);
  state = migrateState(saved);

  // 初始化 2.5D 世界引擎
  const canvas = $('rpg-canvas');
  world = new InkWorldEngine(canvas, {
    getMoveSpeed: () => getHeroStats().moveSpeed,
    getNpcData: (npcId) => NPCS[npcId] || null,
    onNearestChange: (target) => {
      const btn = $('btn-interact');
      const lbl = $('interact-label');
      if (!btn || !lbl) return;
      if (target) {
        const nextKey = `${target.type || ''}:${target.id || target.label || ''}`;
        const isNewTarget = nextKey !== lastNearestTargetKey;
        lastNearestTargetKey = nextKey;
        btn.disabled = false;
        lbl.textContent = target.label || '交互';
        if (isNewTarget) {
          btn.classList.remove('interact-pulse');
          void btn.offsetWidth;
          btn.classList.add('interact-pulse');
        }
      } else {
        lastNearestTargetKey = null;
        btn.disabled = true;
        btn.classList.remove('interact-pulse');
        lbl.textContent = '探索周围';
      }
    },
    onInteract: handleWorldInteract,
    onEncounter: (en) => startBattle(en)
  });

  // 绑定移动端四向 D-Pad
  world.bindDpadButton($('btn-move-up'), 'up');
  world.bindDpadButton($('btn-move-down'), 'down');
  world.bindDpadButton($('btn-move-left'), 'left');
  world.bindDpadButton($('btn-move-right'), 'right');

  // 舞台按钮
  $('btn-interact')?.addEventListener('click', () => world.triggerInteract());
  $('btn-refresh-loot')?.addEventListener('click', refreshCurrentMapLoot);

  // 顶部系统按钮
  $('btn-account')?.addEventListener('click', openAccountModal);
  const btnSound = $('btn-sound');
  if (btnSound) {
    const initMuted = Boolean(sfx.muted);
    btnSound.classList.toggle('is-muted', initMuted);
    btnSound.setAttribute('aria-pressed', String(initMuted));
    btnSound.addEventListener('click', () => {
      const muted = sfx.toggleMute();
      btnSound.classList.toggle('is-muted', muted);
      btnSound.setAttribute('aria-pressed', String(muted));
      if (!muted) sfx.uiTick?.();
    });
  }
  $('btn-help')?.addEventListener('click', () => openHelpModal('settings'));
  $('btn-reset')?.addEventListener('click', () => {
    if (!confirm('确定要重开本账号周目吗？当前进度将被清空！')) return;
    storage.clearSave(currentUser);
    state = createInitialState();
    enterMap('town', 800, 515);
    showToast('已重开新周目，欢迎回到墨石镇！', 'info');
  });

  // 对话框与弹窗关闭
  $('dialog-close-btn')?.addEventListener('click', () => closeDialog());
  $('modal-close')?.addEventListener('click', () => closeModal());
  $('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === $('modal-backdrop')) closeModal();
  });

  // Escape 键关闭弹窗 / 对话框 / 战斗子面板
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('modal-backdrop') && !$('modal-backdrop').classList.contains('hidden')) {
      e.preventDefault();
      closeModal();
    } else if ($('rpg-dialog-box') && !$('rpg-dialog-box').classList.contains('hidden')) {
      e.preventDefault();
      closeDialog();
    } else if (battle && battleSubMode) {
      e.preventDefault();
      battleSubMode = null;
      renderBattleSubpanel();
      sfx.uiTick?.();
    }
  });

  // 战斗指令按钮
  $('bat-btn-atk')?.addEventListener('click', battlePlayerAttack);
  $('bat-btn-skills')?.addEventListener('click', () => {
    if (!battle || battle.busy) return;
    sfx.uiTick?.();
    battleSubMode = battleSubMode === 'skills' ? null : 'skills';
    renderBattleSubpanel();
  });
  $('bat-btn-capture')?.addEventListener('click', battleAttemptCapture);
  $('bat-btn-item')?.addEventListener('click', () => {
    if (!battle || battle.busy) return;
    sfx.uiTick?.();
    battleSubMode = battleSubMode === 'items' ? null : 'items';
    renderBattleSubpanel();
  });
  $('bat-btn-run')?.addEventListener('click', battleAttemptRun);

  // 底部功能坞
  const dockActions = {
    openWorldMap: () => openWorldMap(),
    openCrucible: () => openCrucible(),
    openBagModal: () => openBagModal(),
    openSkill: () => openSkill(),
    openQuests: () => openQuests(),
    openCollection: () => openCollection(),
    openRank: () => openRank()
  };
  document.querySelectorAll('.dock-tab[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.uiTick?.();
      if (battle) {
        showToast('战斗中无法打开卷轴面板！', 'warn');
        return;
      }
      const fn = dockActions[btn.dataset.action];
      if (fn) fn();
    });
  });

  // 序章按钮
  $('btn-prologue-next')?.addEventListener('click', () => {
    sfx.pick('common');
    if (prologueIndex < PROLOGUE_SLIDES.length - 1) {
      prologueIndex += 1;
      renderPrologueSlide(true);
    } else {
      finishOpeningPrologue();
    }
  });
  $('btn-prologue-skip')?.addEventListener('click', () => {
    finishOpeningPrologue();
  });

  // 移动端竖屏横置提示关闭按钮（允许用户自由选择继续竖屏游玩）
  $('btn-dismiss-rotate')?.addEventListener('click', () => {
    const hint = $('rotate-hint');
    if (hint) {
      hint.classList.add('dismissed');
      hint.setAttribute('aria-hidden', 'true');
    }
    sfx.uiTick?.();
  });

  // 微信内置浏览器 Web Audio 自动解锁（iOS / Android WeixinJSBridgeReady）
  const unlockWeChatAudio = () => {
    try {
      sfx.ensureAudio?.();
      sfx.ensureCtx?.();
      sfx._handleUserGesture?.();
    } catch (_) {}
  };
  document.addEventListener('WeixinJSBridgeReady', unlockWeChatAudio, false);
  if (typeof window.WeixinJSBridge !== 'undefined' && typeof window.WeixinJSBridge.invoke === 'function') {
    try {
      window.WeixinJSBridge.invoke('getNetworkType', {}, unlockWeChatAudio);
    } catch (_) {
      unlockWeChatAudio();
    }
  }

  // 注册 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 严格顺序启动门禁：开屏期间保持暂停、序章隐藏、禁止地图抵达横幅/Toast 透字
  const splashActive = isStudioSplashActive();
  const suppressInitialArrival = splashActive || !state.prologueSeen;
  if (suppressInitialArrival) {
    world.paused = true;
    $('opening-prologue')?.classList.add('hidden');
  }

  // 加载初始地图并启动世界循环
  enterMap(state.mapId, state.heroX, state.heroY, { suppressArrivalFx: suppressInitialArrival });
  world.start();
  startHazardLoop();
  updateHUD();

  const enterLiveWorld = () => {
    if (world && !battle && !currentDialog && $('modal-backdrop')?.classList.contains('hidden')) {
      world.paused = false;
    }
    const curMap = MAPS_BY_ID[state.mapId] || MAPS[0];
    const region = getMapRegion(curMap);
    if (!battle) {
      sfx.playBgm?.(getBgmTrackForMap(curMap.id));
    }
    showSceneTitleBanner(curMap.name, region.name);
    showToast(`抵达「${curMap.name}」`, 'info');
    maybeTriggerMapEntryCutscene(curMap.id);
  };

  // 开屏动画 -> 序章 -> 正式入镇严格串行衔接
  if (splashActive) {
    sfx.playStudioJingle?.();
    let handedOff = false;
    const runPostSplashHandoff = () => {
      if (handedOff) return;
      handedOff = true;
      if (!state.prologueSeen) {
        openOpeningPrologue(false);
      } else {
        enterLiveWorld();
      }
    };
    const splashEl = $('studio-splash');
    if (splashEl) {
      const obs = new MutationObserver(() => {
        if (!isStudioSplashActive()) {
          obs.disconnect();
          runPostSplashHandoff();
        }
      });
      obs.observe(splashEl, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    setTimeout(runPostSplashHandoff, 6500);
  } else if (!state.prologueSeen) {
    openOpeningPrologue(false);
  } else {
    enterLiveWorld();
  }
}

window.addEventListener('DOMContentLoaded', init);
