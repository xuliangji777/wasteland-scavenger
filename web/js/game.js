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
  SIDE_QUESTS
} from './data.js';
import { InkWorldEngine } from './rpg_world.js';
import { sfx } from './audio.js';
import { spawnFloatText } from './fx.js';
import { storage } from './storage.js?v=4';

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
    title: '天枢灾变',
    text: '二十年前，「天枢核心」失控引发大停电，旧世界的高楼与现代炮火在墨色尘暴中崩塌。辐射异变唤醒了古老灵脉，山海妖魔、自律机甲与失控重炮从此横行荒原。'
  },
  {
    chapter: '序章 · 二',
    title: '墨土五域',
    text: '幸存者在残垣间筑起主城「墨石镇」。镇外五域险象环生——铁锈废都、赤焰兵工、青瘴毒泽与深埋地底的 07 号避难所，处处藏着战前神兵与洞穴秘宝。'
  },
  {
    chapter: '序章 · 三',
    title: '天工墨壶',
    text: '你身怀家传奇物「天工墨壶」——可于险境战斗中收摄妖魔与机械残灵，将古武绝学、现代枪炮、科幻墨甲与妖丹跨界炼化，铸出绝世神兵与护驾灵兽。'
  },
  {
    chapter: '序章 · 四',
    title: '故人寻踪',
    text: '大停电当夜 21:47，挚友「阿哲」在撤离途中音讯全无，只留下一丝指向废土深处的线索。如今你已抵达墨石镇广场——先去「老黄杂货铺」打听消息，踏上墨土传奇！'
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
    heroX: 800,
    heroY: 515,
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

    // 背包物品：每条 { uid, itemId, quality }
    bag: [
      { uid: 'init_1', itemId: 20, quality: 'common' },
      { uid: 'init_2', itemId: 20, quality: 'common' },
      { uid: 'init_3', itemId: 21, quality: 'common' },
      { uid: 'init_4', itemId: 22, quality: 'common' },
      { uid: 'init_5', itemId: 22, quality: 'common' }
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
    capturedSpirits: {}, // { enemyId: count }
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
    seenEnemies: [],
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
  s.seenEnemies = Array.isArray(raw.seenEnemies) ? raw.seenEnemies : [];
  s.endingsUnlocked = Array.isArray(raw.endingsUnlocked) ? raw.endingsUnlocked : [];
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  s.dailyDone = Array.isArray(raw.dailyDone) ? raw.dailyDone : [];
  if (!MAPS_BY_ID[s.mapId]) s.mapId = 'town';
  return s;
}

// ==================== 全局运行时状态 ====================
let currentUser = storage.getCurrentUser();
let state = createInitialState();
let world = null;
let battle = null;
let currentDialog = null;
let crucibleSlots = [null, null];
let crucibleTab = 'forge';
let bagTab = 'equip';
let questTab = 'main';
let collectionTab = 'antiques';
let saveModalTab = 'slots';
let prologueIndex = 0;
let battleSubMode = null; // 'skills' | 'items' | null
let battleSkillBranch = 'martial';
let hazardTimer = null;
let saveDebounceTimer = null;

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
    bagMax: 10 + (state.skills[2] || 0) * 3,
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
  const sx = rect.left + (world.hero.x - world.cameraX);
  const sy = rect.top + (world.hero.y - world.cameraY) - 36;
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

function enterMap(mapId, spawnX = null, spawnY = null) {
  const target = MAPS_BY_ID[mapId];
  if (!target) return;

  if (!isRegionUnlocked(target.regionId)) {
    const ok = tryUnlockRegion(target.regionId);
    if (!ok) return;
  }

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

  world.loadMap(target, {
    weatherId: wid,
    spawnX: sx,
    spawnY: sy,
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

  showToast(`抵达「${target.name}」`, 'info');
  updateHUD();
  scheduleSave();
}

function refreshCurrentMapLoot() {
  if (!world?.map) return;
  const curMap = world.map;
  if (curMap.isSafe || !curMap.lootZones?.length) {
    showToast('当前安全区域没有可刷新的野外废墟，请出城探索！', 'info');
    return;
  }
  if (state.energy < 8) {
    showToast('内息不足（需 8 点内息），请使用纯净水或回医馆歇脚！', 'warn');
    return;
  }
  state.energy -= 8;
  state.day += 1;
  // 刷新本域天气
  const pool = curMap.weatherPool || [0];
  const nextW = pool[Math.floor(Math.random() * pool.length)];
  state.regionWeathers[curMap.regionId] = nextW;
  world.setWeather(nextW);

  // 刷新所有搜刮点与敌人
  for (const node of world.lootNodes) {
    node.collected = false;
    node.respawnAt = 0;
  }
  for (const en of world.enemies) {
    if (!en.alive) {
      en.alive = true;
      en.hp = en.maxHp;
      en.x = en.homeX;
      en.y = en.homeY;
    }
  }
  sfx.pick('fine');
  showToast(`已搜寻新迹！第 ${state.day} 天，天气转为「${WEATHERS[nextW].name}」，区域物资已刷新！`, 'success');
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
  const m = bonusMult * eagleBonus;
  const legendRate = Math.min(0.18, QUALITY.legend.rate * m);
  const rareRate = Math.min(0.32, QUALITY.rare.rate * m);
  const fineRate = Math.min(0.42, QUALITY.fine.rate * Math.sqrt(m));
  const r = Math.random();
  if (r < legendRate) return 'legend';
  if (r < legendRate + rareRate) return 'rare';
  if (r < legendRate + rareRate + fineRate) return 'fine';
  return 'common';
}

function handleSalvageNode(node) {
  const isHeavy = node.type === 'abandoned_cannon' || node.type === 'mech_wreck';
  if (!isHeavy) return false;

  if (state.energy < 10) {
    showToast('内息不足 10 点，无法强行拆解重型军工残骸！', 'warn');
    return true;
  }
  state.energy -= 10;
  node.collected = true;
  setTimeout(() => { node.collected = false; }, (node.respawnSec || 45) * 1000);

  state.stats.salvageHeavy = (state.stats.salvageHeavy || 0) + 1;
  state.stats.pick = (state.stats.pick || 0) + 1;

  // 35% 概率惊动精英守卫，但仍先给丰厚战利品
  const pool = Array.isArray(node.equipPool) && node.equipPool.length ? node.equipPool : ['wpn_flaregun', 'mech_steam_core'];
  const baseId = pool[Math.floor(Math.random() * pool.length)];
  const q = rollQuality(2.0);
  const eq = rollEquipment(baseId, q === 'common' ? 'fine' : q);
  if (eq) {
    addEquipmentToBag(eq);
    sfx.pick(eq.quality);
    showToast(`拆解「${node.name}」成功！获得【${QUALITY[eq.quality].name}】${eq.name}！`, 'success');
    floatNearHero(`+${eq.name}`, QUALITY[eq.quality].color);
  }
  const bonusGold = 80 + Math.floor(Math.random() * 120);
  state.gold += bonusGold;
  gainExp(28);

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
  if (!node || node.collected) return;
  if (node.type === 'abandoned_cannon' || node.type === 'mech_wreck') {
    handleSalvageNode(node);
    return;
  }

  const curMap = world.map;
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
  node.collected = true;
  setTimeout(() => { node.collected = false; }, (node.respawnSec || 22) * 1000);

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

  // 若节点自带装备池（如古剑石台、狐仙供奉玉匣、雷公神龛玉匣），45% 概率出暗黑词缀装备
  if (Array.isArray(node.equipPool) && node.equipPool.length && Math.random() < 0.45) {
    const baseId = node.equipPool[Math.floor(Math.random() * node.equipPool.length)];
    const eq = rollEquipment(baseId, rollQuality(1.6 * weather.rareBonus));
    if (eq) {
      addEquipmentToBag(eq);
      sfx.pick(eq.quality);
      showToast(`在「${node.name}」发现神兵：【${QUALITY[eq.quality].name}】${eq.name}！`, 'success');
      floatNearHero(`+${eq.name}`, QUALITY[eq.quality].color);
      gainExp(20);
      updateHUD();
      scheduleSave();
      return;
    }
  }

  const item = rollItemFromMap(curMap);
  const quality = rollQuality(weather.rareBonus);

  if (item.isStory) {
    unlockStoryRelic(item.storyId);
    sfx.pick('legend');
    floatNearHero(`信物 · ${item.name}`, '#f3ce7a');
    gainExp(25);
  } else if (item.isCollection) {
    const isNew = unlockCollection(item.colId);
    if (!isNew) {
      const bonus = 180;
      state.gold += bonus;
      showToast(`重复发现古董「${item.name}」，折算废土币 +${bonus}！`, 'info');
      sfx.coin();
    } else {
      floatNearHero(`古董 · ${item.name}`, '#f3ce7a');
    }
    gainExp(18);
  } else {
    if (state.bag.length >= stats.bagMax) {
      const autoGold = Math.round(item.baseValue * (QUALITY[quality]?.multiplier || 1) * 0.7);
      state.gold += autoGold;
      showToast(`行囊已满！「${item.name}」就地折卖 +${autoGold} 币`, 'warn');
      sfx.coin();
    } else {
      state.bag.push({
        uid: `it_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
        itemId: item.id,
        quality
      });
      sfx.pick(quality);
      showToast(`搜得【${QUALITY[quality].name}】${item.name}`, quality === 'legend' || quality === 'rare' ? 'success' : 'info');
      floatNearHero(`+${item.name}`, QUALITY[quality].color);
    }
    gainExp(10);
  }

  // 12% 额外掉落暗黑词缀装备
  if (Math.random() < 0.12) {
    const tierPool = curMap.regionId === 'reg_vault'
      ? ['wpn_railgun', 'wpn_xuanyuan', 'mech_tianshu_exo', 'relic_thunder_seal']
      : curMap.regionId === 'reg_swamp'
        ? ['relic_fox_orb', 'armor_exo', 'wpn_plasma_rifle']
        : curMap.regionId === 'reg_arsenal'
          ? ['wpn_gatling', 'wpn_artillery', 'mech_crimson_frame', 'wpn_pulsesword']
          : curMap.regionId === 'reg_ruins'
            ? ['wpn_shotgun', 'wpn_sniper', 'wpn_qingcheng', 'armor_ironwire']
            : ['wpn_inkblade', 'wpn_flaregun', 'armor_ironwire', 'mech_steam_core'];
    const pickId = tierPool[Math.floor(Math.random() * tierPool.length)];
    const bonusEq = rollEquipment(pickId, rollQuality(1.1));
    if (bonusEq) {
      addEquipmentToBag(bonusEq);
      showToast(`意外发现暗黑词缀装备：【${QUALITY[bonusEq.quality].name}】${bonusEq.name}！`, 'success');
    }
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

// ==================== NPC 底部水墨对话框 ====================
function closeDialog() {
  currentDialog = null;
  $('rpg-dialog-box')?.classList.add('hidden');
  if (world && !battle && $('modal-backdrop')?.classList.contains('hidden')) {
    world.paused = false;
  }
}

function openNpcDialog(npcId) {
  const npc = NPCS[npcId];
  if (!npc) return;
  currentDialog = npc;
  if (world) world.paused = true;

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
        for (const n of world.lootNodes) n.collected = false;
        $('dialog-text').textContent = '“拿去吧，这片荒原的暗格与废炮位置都标好了，物资已为你重新探明！”';
      }
    } else if (idx === 1) {
      $('dialog-text').textContent = '“北侧塌坡下就是战前防空洞，里头盘踞着墨尾巨鼠王。记得战斗中把小怪打残后用【天工墨壶】收妖！”';
    } else if (idx === 2) {
      const stats = getHeroStats();
      state.hp = Math.min(stats.maxHp, state.hp + 25);
      state.energy = Math.min(stats.maxEnergy, state.energy + 20);
      $('dialog-text').textContent = '“喝口热茶暖暖身子，荒原风硬，莫要硬扛！”（+25 气血，+20 内息）';
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
      state.energy = stats.maxEnergy;
      state.hp = stats.maxHp;
      $('dialog-text').textContent = '“老伙计，歇会儿吧。电台调好了，气血与内息都恢复到巅峰了！”';
    } else if (idx === 2) {
      $('dialog-text').textContent = '“玄墨大帝在天枢地脉密窟深处，半血后会进入二阶段觉醒。务必带上最强护驾与绝世神兵！”';
    }
  } else if (id === 'xuezhe') {
    if (idx === 0) {
      if (state.gold < 400) showToast('神经强化需 400 废土币。', 'warn');
      else {
        state.gold -= 400;
        state.skillPoints += 1;
        sfx.ending();
        $('dialog-text').textContent = `“战前神经强化完成！获得 +1 修为点（当前可用 ${state.skillPoints}）。”`;
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
      state.energy = getHeroStats().maxEnergy;
      $('dialog-text').textContent = '“吐纳一周天，丹田充盈！内息已完全恢复！”';
    }
  }

  updateHUD();
  scheduleSave();
}

// ==================== 《轩辕剑三》回合制战斗系统 ====================
function buildEnemySvg(tpl) {
  const col = tpl.color || '#332c28';
  const acc = tpl.accent || '#d49a3a';
  const seal = (tpl.name || '妖').slice(0, 1);
  const isMech = ['drone', 'flame_mech', 'guard', 'auto_turret', 'heavy_mech', 'mech_taotie', 'boss_zhurong', 'boss_tianshu'].includes(tpl.spriteType);
  const isBeast = ['rat', 'dog', 'fox_nine', 'boss_ratking'].includes(tpl.spriteType);
  const isSpirit = ['slime', 'mire_wisp', 'bronze_spirit', 'painted_phantom', 'thunder_remnant', 'boss_lotus_bane'].includes(tpl.spriteType);

  let bodyPath = '';
  if (isMech) {
    bodyPath = `
      <rect x="46" y="42" width="68" height="58" rx="8" fill="${col}" stroke="${acc}" stroke-width="2.5"/>
      <polygon points="34,54 46,44 46,84 30,78" fill="${col}" stroke="${acc}" stroke-width="2"/>
      <polygon points="126,54 114,44 114,84 130,78" fill="${col}" stroke="${acc}" stroke-width="2"/>
      <rect x="58" y="24" width="44" height="22" rx="5" fill="${col}" stroke="${acc}" stroke-width="2"/>
      <rect x="64" y="31" width="32" height="7" rx="3" fill="${acc}"/>
      <rect x="54" y="100" width="18" height="28" rx="4" fill="${col}" stroke="${acc}" stroke-width="2"/>
      <rect x="88" y="100" width="18" height="28" rx="4" fill="${col}" stroke="${acc}" stroke-width="2"/>
    `;
  } else if (isBeast) {
    bodyPath = `
      <path d="M36,105 Q42,58 76,52 Q112,48 124,78 Q134,104 112,118 L48,118 Z" fill="${col}" stroke="${acc}" stroke-width="2.5"/>
      <polygon points="48,60 40,34 62,48" fill="${col}" stroke="${acc}" stroke-width="2"/>
      <polygon points="94,54 108,30 112,56" fill="${col}" stroke="${acc}" stroke-width="2"/>
      <circle cx="66" cy="70" r="5" fill="${acc}"/>
      <circle cx="94" cy="70" r="5" fill="${acc}"/>
      <path d="M122,86 Q146,66 138,44" fill="none" stroke="${acc}" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (isSpirit) {
    bodyPath = `
      <path d="M80,22 C112,26 128,58 118,92 C110,114 96,126 80,124 C64,126 50,114 42,92 C32,58 48,26 80,22 Z" fill="${col}" stroke="${acc}" stroke-width="2.5"/>
      <path d="M32,82 Q80,108 128,82" fill="none" stroke="${acc}" stroke-width="2" stroke-dasharray="5 4" opacity="0.8"/>
      <ellipse cx="66" cy="64" rx="6" ry="4" fill="${acc}"/>
      <ellipse cx="94" cy="64" rx="6" ry="4" fill="${acc}"/>
    `;
  } else {
    bodyPath = `
      <circle cx="80" cy="36" r="18" fill="${col}" stroke="${acc}" stroke-width="2.5"/>
      <path d="M44,122 L54,58 L106,58 L116,122 Z" fill="${col}" stroke="${acc}" stroke-width="2.5"/>
      <line x1="28" y1="92" x2="132" y2="42" stroke="${acc}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="74" cy="34" r="3" fill="${acc}"/>
      <circle cx="86" cy="34" r="3" fill="${acc}"/>
    `;
  }

  const bossRing = tpl.isBoss
    ? `<circle cx="80" cy="76" r="64" fill="none" stroke="${acc}" stroke-width="2" stroke-dasharray="10 6" opacity="0.65"/>`
    : '';

  return `
    <svg viewBox="0 0 160 144" width="160" height="144" aria-label="${escapeHtml(tpl.name)}">
      <defs>
        <radialGradient id="inkAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${acc}" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="80" cy="76" r="66" fill="url(#inkAura)"/>
      ${bossRing}
      ${bodyPath}
      <g transform="translate(120, 14)">
        <rect x="0" y="0" width="26" height="26" rx="4" fill="#98291f" stroke="#e5bb5c" stroke-width="1.5"/>
        <text x="13" y="18" text-anchor="middle" fill="#fff3de" font-size="14" font-weight="900" font-family="serif">${escapeHtml(seal)}</text>
      </g>
    </svg>
  `;
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
}

function logBattle(msg) {
  if ($('bat-log')) $('bat-log').textContent = msg;
}

function startBattle(worldEnemy) {
  if (battle) return;
  const tpl = worldEnemy.data || ENEMIES[worldEnemy.enemyId] || ENEMIES.rat;
  closeDialog();
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
  $('bat-enemy-visual').innerHTML = buildEnemySvg(tpl);
  $('rpg-battle-overlay').classList.remove('hidden');

  logBattle(tpl.introLine || `遭遇「${tpl.name}」！凝神戒备，准备迎战！`);
  setBattleButtonsEnabled(true);
  updateBattleUI();
  sfx.alarm();
}

function closeBattle() {
  battle = null;
  battleSubMode = null;
  $('bat-subpanel')?.classList.add('hidden');
  $('rpg-battle-overlay')?.classList.add('hidden');
  if (world) {
    world.paused = false;
    world.setEncounterCooldown(2.0);
  }
  updateHUD();
  scheduleSave();
}

function triggerHitAnim(isEnemy) {
  const el = isEnemy ? $('bat-enemy-visual') : document.querySelector('.hero-portrait-battle');
  if (!el) return;
  el.classList.remove('hit');
  void el.offsetWidth;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 200);
}

function calcDamageToEnemy(mult = 1, opts = {}) {
  const stats = getHeroStats();
  let atk = stats.atk;
  if (battle.overdriveTurns > 0) atk = Math.round(atk * 1.3);

  let def = battle.enemy.def;
  if (battle.enemyStatus.def_down > 0) def = Math.round(def * 0.75);
  const pen = opts.ignoreDef ? 1 : clamp(stats.armorPen + (opts.armorPen || 0), 0, 1);
  const effDef = Math.round(def * (1 - pen));

  let dmg = Math.max(4, Math.round(atk * mult - effDef * 0.75));
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
  if (!guard || battle.enemy.hp <= 0) return;

  const stats = getHeroStats();
  if (guard.healHp) {
    state.hp = Math.min(stats.maxHp, state.hp + guard.healHp);
    if (guard.healMp) state.energy = Math.min(stats.maxEnergy, state.energy + guard.healMp);
    if (guard.effect === 'cleanse') {
      battle.heroStatus.burn = 0;
      battle.heroStatus.poison = 0;
    }
    logs.push(`护驾【${guard.name}】施展「${guard.skillName}」回复 ${guard.healHp} 气血！`);
    return;
  }

  if (guard.shield) {
    battle.heroShield += guard.shield;
  }

  const raw = (guard.baseDmg || 20) + (guard.perLvDmg ? state.level * guard.perLvDmg : 0);
  const dmg = guard.ignoreDef ? raw : Math.max(5, Math.round(raw - battle.enemy.def * 0.4));
  battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
  triggerHitAnim(true);

  if (guard.effect === 'poison') battle.enemyStatus.poison = 3;
  if (guard.effect === 'armor_break' && Math.random() < 0.35) battle.enemyStatus.def_down = 2;
  if (guard.effect === 'lifesteal' && guard.healHp) {
    state.hp = Math.min(stats.maxHp, state.hp + guard.healHp);
  }
  logs.push(`护驾【${guard.name}】发动「${guard.skillName}」造成 ${dmg} 伤害！`);
}

function handleBattleVictory(captured = false) {
  const tpl = battle.tpl;
  const wEn = battle.worldEnemy;
  if (wEn) {
    wEn.alive = false;
    wEn.respawnTimer = tpl.isBoss ? 120 : 35;
  }

  const expGain = captured ? Math.round(tpl.exp * 0.65) : tpl.exp;
  const goldGain = captured ? Math.round(tpl.gold * 0.65) : tpl.gold;
  state.gold += goldGain;
  state.stats.battleWin = (state.stats.battleWin || 0) + 1;
  if (['heavy_mech', 'auto_turret', 'mech_taotie'].includes(tpl.id)) {
    state.stats.defeatHeavy = (state.stats.defeatHeavy || 0) + 1;
  }

  let extraMsg = '';
  if (tpl.isBoss) {
    if (!state.defeatedBosses.includes(tpl.id)) state.defeatedBosses.push(tpl.id);
    if (tpl.dropSpiritId) {
      state.capturedSpirits[tpl.dropSpiritId] = (state.capturedSpirits[tpl.dropSpiritId] || 0) + 1;
    }
    if (tpl.dropStoryId !== undefined) {
      unlockStoryRelic(tpl.dropStoryId);
    }
    advanceQuestTrigger(`defeat_${tpl.id}`);

    // Boss 必掉一件高阶暗黑词缀装备
    const bossPool = {
      boss_ratking: ['wpn_inkblade', 'armor_ironwire'],
      boss_duangang: ['wpn_shotgun', 'wpn_qingcheng'],
      boss_zhurong: ['wpn_gatling', 'mech_crimson_frame', 'wpn_pulsesword'],
      boss_lotus_bane: ['relic_fox_orb', 'armor_exo', 'wpn_plasma_rifle'],
      boss_tianshu: ['wpn_xuanyuan', 'mech_tianshu_exo', 'relic_tianshu']
    }[tpl.id] || ['wpn_qingcheng'];
    const eq = rollEquipment(bossPool[Math.floor(Math.random() * bossPool.length)], tpl.isFinalBoss ? 'legend' : 'rare');
    if (eq) {
      addEquipmentToBag(eq);
      extraMsg = ` 掉落【${QUALITY[eq.quality].name}】${eq.name}！`;
    }
  } else if (!captured && Math.random() < 0.25) {
    const eqKeys = Object.keys(EQUIPMENT);
    const pick = eqKeys[Math.floor(Math.random() * eqKeys.length)];
    const eq = rollEquipment(pick, rollQuality(1.1));
    if (eq) {
      addEquipmentToBag(eq);
      extraMsg = ` 掉落【${QUALITY[eq.quality].name}】${eq.name}！`;
    }
  }

  sfx.ending();
  logBattle((captured ? `收妖成功！${tpl.spiritName}已入天工墨壶！` : (tpl.defeatLine || `击败「${tpl.name}」！`)) + ` 获 +${expGain} 经验、+${goldGain} 币！${extraMsg}`);
  gainExp(expGain);

  const isFinal = Boolean(tpl.isFinalBoss && !captured);
  setTimeout(() => {
    closeBattle();
    if (isFinal) {
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
  closeModal();
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
      closeBattle();
      openModal(
        `首领战败 · ${bossName}`,
        `<div class="modal-list-item">
          <div class="modal-item-desc">你在与首领「${escapeHtml(bossName)}」的激战中气血耗尽。<br/>可立即读取最近记录碑存档重新迎战，或损失 15% 废土币撤回墨石镇医馆。</div>
        </div>`,
        `
          ${latest ? `<button class="btn btn-purple" id="btn-boss-reload">读取最近存档 (${escapeHtml(latest.label)})</button>` : ''}
          <button class="btn btn-amber" id="btn-boss-retreat">撤回墨石镇医馆</button>
        `
      );
      $('btn-boss-reload')?.addEventListener('click', () => {
        loadFromSlot(latest.slotId, latest.label);
      });
      $('btn-boss-retreat')?.addEventListener('click', () => {
        const loss = Math.min(state.gold, Math.round(state.gold * 0.15));
        state.gold -= loss;
        state.hp = Math.round(stats.maxHp * 0.6);
        state.energy = Math.round(stats.maxEnergy * 0.6);
        closeModal();
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
    logs.push('【灼烧】造成 22 点火焰伤害！');
  }
  if (battle.enemyStatus.poison > 0) {
    battle.enemy.hp = Math.max(0, battle.enemy.hp - 18);
    battle.enemyStatus.poison -= 1;
    logs.push('【剧毒】造成 18 点毒素伤害！');
  }
  if (battle.enemyStatus.def_down > 0) battle.enemyStatus.def_down -= 1;

  if (battle.enemy.hp <= 0) {
    updateBattleUI();
    handleBattleVictory(false);
    return;
  }

  checkBossMidBattleEvents(logs);

  // 护驾出击
  applyGuardianTurn(logs);
  if (battle.enemy.hp <= 0) {
    updateBattleUI();
    handleBattleVictory(false);
    return;
  }

  // 主角回息
  if (stats.mpRegen > 0) {
    state.energy = Math.min(stats.maxEnergy, state.energy + stats.mpRegen);
  }

  // 敌方行动
  if (battle.enemyStatus.stun > 0) {
    battle.enemyStatus.stun -= 1;
    logs.push(`${battle.tpl.name}陷入【眩晕】，无法行动！`);
  } else {
    const tpl = battle.tpl;
    const isSpecial = tpl.specialEvery && (battle.turn % tpl.specialEvery === 0);
    const mult = isSpecial ? (tpl.specialMult || 1.5) : 1;
    let rawDmg = Math.max(3, Math.round(battle.enemy.atk * mult - stats.def * 0.65));
    let reduce = stats.dmgReduce + (battle.dmgReduceTurns > 0 ? 0.30 : 0);
    rawDmg = Math.max(2, Math.round(rawDmg * (1 - clamp(reduce, 0, 0.78))));

    if (battle.heroShield > 0) {
      const absorbed = Math.min(battle.heroShield, rawDmg);
      battle.heroShield -= absorbed;
      rawDmg -= absorbed;
    }

    state.hp = Math.max(0, state.hp - rawDmg);
    triggerHitAnim(false);
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
  }
  if (battle.heroStatus.poison > 0) {
    const d = Math.round(14 * (1 - stats.radResist));
    state.hp = Math.max(0, state.hp - d);
    battle.heroStatus.poison -= 1;
  }

  if (battle.dmgReduceTurns > 0) battle.dmgReduceTurns -= 1;
  if (battle.overdriveTurns > 0) battle.overdriveTurns -= 1;
  battle.captureBonus = 0;
  battle.turn += 1;

  updateBattleUI();
  updateHUD();

  if (state.hp <= 0) {
    handleBattleDefeat();
    return;
  }

  logBattle(logs.slice(-2).join(' '));
  battle.busy = false;
  setBattleButtonsEnabled(true);
}

function battlePlayerAttack() {
  if (!battle || battle.busy) return;
  battle.busy = true;
  battleSubMode = null;
  $('bat-subpanel').classList.add('hidden');
  setBattleButtonsEnabled(false);

  const stats = getHeroStats();
  const { dmg, isCrit, lifesteal } = calcDamageToEnemy(1, {});
  battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
  triggerHitAnim(true);
  sfx.disassemble(true, isCrit);

  const logs = [`沈砚挥兵直击，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`];
  if (lifesteal > 0) {
    const heal = Math.max(1, Math.round(dmg * lifesteal));
    state.hp = Math.min(stats.maxHp, state.hp + heal);
    logs.push(`吸血回复 +${heal} 气血！`);
  }
  if (stats.proc === 'burn' && Math.random() < 0.25) {
    battle.enemyStatus.burn = 2;
    logs.push('武器触发【灼烧】！');
  }

  updateBattleUI();
  if (battle.enemy.hp <= 0) {
    handleBattleVictory(false);
    return;
  }
  setTimeout(() => runEnemyTurn(logs), 320);
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

  if (skill.selfBuff === 'shield') {
    const sh = (skill.baseShield || 45) + state.level * (skill.perLvShield || 8);
    battle.heroShield += sh;
    battle.dmgReduceTurns = 2;
    sfx.pick('rare');
    logs.push(`施展【${skill.name}】，获得 ${sh} 点护盾并减伤 30%！`);
  } else if (skill.selfBuff === 'overdrive') {
    battle.heroShield += skill.baseShield || 65;
    battle.overdriveTurns = 3;
    sfx.pick('legend');
    logs.push(`启动【${skill.name}】，护盾 +${skill.baseShield || 65}，3 回合内攻击 +30%！`);
  } else if (skill.selfBuff === 'heal') {
    const heal = Math.round(stats.maxHp * (skill.healPct || 0.45));
    state.hp = Math.min(stats.maxHp, state.hp + heal);
    if (skill.cleanse) {
      battle.heroStatus.burn = 0;
      battle.heroStatus.poison = 0;
    }
    sfx.pick('fine');
    logs.push(`运转【${skill.name}】，恢复 ${heal} 气血并净化负面状态！`);
  } else {
    const { dmg, isCrit, lifesteal } = calcDamageToEnemy(skill.mult || 1.6, {
      critBonus: skill.critBonus,
      guaranteedCrit: skill.guaranteedCrit,
      armorPen: skill.armorPen,
      ignoreDef: skill.ignoreDef,
      isArtillery: skill.isArtillery,
      isSkill: true
    });
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    triggerHitAnim(true);
    sfx.disassemble(true, true);
    logs.push(`施展【${skill.name}】，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`);

    if (lifesteal > 0) {
      state.hp = Math.min(stats.maxHp, state.hp + Math.max(1, Math.round(dmg * lifesteal)));
    }
    if (skill.debuff) battle.enemyStatus[skill.debuff] = 2;
    if (skill.stun) battle.enemyStatus.stun = skill.stun;
    if (skill.captureBonus) battle.captureBonus = skill.captureBonus;
  }

  updateBattleUI();
  if (battle.enemy.hp <= 0) {
    handleBattleVictory(false);
    return;
  }
  setTimeout(() => runEnemyTurn(logs), 360);
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

  if (Math.random() < chance) {
    const id = battle.tpl.id;
    state.capturedSpirits[id] = (state.capturedSpirits[id] || 0) + 1;
    state.stats.capture = (state.stats.capture || 0) + 1;
    advanceQuestTrigger('capture_any');
    handleBattleVictory(true);
  } else {
    sfx.disassemble(false);
    const logs = [`天工墨壶青光一闪，${battle.tpl.name}挣脱了束缚！（当前血量 ${Math.round(ratio * 100)}%，压至 ≤40% 成功率极高）`];
    setTimeout(() => runEnemyTurn(logs), 360);
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

  if (effect?.hp) state.hp = Math.min(stats.maxHp, state.hp + effect.hp);
  if (effect?.energy) state.energy = Math.min(stats.maxEnergy, state.energy + effect.energy);
  if (effect?.food) state.food = Math.min(100, state.food + effect.food);
  if (effect?.radShield) state.radShield += effect.radShield;

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
      return `
        <button class="bat-skill-btn" data-skill-id="${s.id}" ${locked || noMp ? 'disabled' : ''}>
          <div class="bat-skill-head">
            <span>【${s.seal}】${escapeHtml(s.name)}</span>
            <span class="bat-skill-cost">${locked ? `Lv.${s.unlockLv}解锁` : `${s.mpCost}内息`}</span>
          </div>
          <div class="bat-skill-desc">${escapeHtml(s.desc)}</div>
        </button>
      `;
    }).join('');

    panel.innerHTML = `<div class="skill-branch-tabs">${tabsHtml}</div><div class="battle-subgrid">${cardsHtml}</div>`;
    panel.querySelectorAll('.skill-branch-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
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
        <button class="bat-item-btn" data-kind="elixir" data-key="${eid}">
          <div class="bat-skill-head"><span>【${e.seal}】${escapeHtml(e.name)}</span><span class="bat-skill-cost">×${cnt}</span></div>
          <div class="bat-skill-desc">${escapeHtml(e.desc)}</div>
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
        <button class="bat-item-btn" data-kind="item" data-key="${it.id}">
          <div class="bat-skill-head"><span>【${it.seal}】${escapeHtml(it.name)}</span><span class="bat-skill-cost">×${cnt}</span></div>
          <div class="bat-skill-desc">${escapeHtml(it.desc)}</div>
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
function openModal(title, bodyHtml, footerHtml = '') {
  if (world) world.paused = true;
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHtml;
  $('modal-footer').innerHTML = footerHtml || '<button class="btn btn-secondary" id="modal-default-close">合上卷轴</button>';
  $('modal-backdrop').classList.remove('hidden');
  $('modal-default-close')?.addEventListener('click', closeModal);
}

function closeModal() {
  $('modal-backdrop')?.classList.add('hidden');
  if (world && !battle && !currentDialog) {
    world.paused = false;
  }
}

// ==================== 1. 天下舆图（5 大域 × 21 张地图） ====================
function openWorldMap(selectedRegionId = null) {
  const curMap = MAPS_BY_ID[state.mapId] || MAPS[0];
  const activeRegId = selectedRegionId || curMap.regionId;
  const activeReg = getRegionById(activeRegId);

  const linesSvg = [];
  for (let i = 0; i < REGIONS.length - 1; i++) {
    const a = REGIONS[i].worldPos;
    const b = REGIONS[i + 1].worldPos;
    linesSvg.push(`<line x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" stroke="rgba(200,155,60,0.45)" stroke-width="2" stroke-dasharray="6 5"/>`);
  }

  const nodesHtml = REGIONS.map((reg) => {
    const unlocked = isRegionUnlocked(reg.id);
    const isCur = reg.id === curMap.regionId;
    const wid = state.regionWeathers[reg.id] ?? 0;
    const w = WEATHERS[wid] || WEATHERS[0];
    return `
      <button class="map-node ${unlocked ? 'unlocked' : 'locked'}${isCur ? ' active' : ''}"
        style="left:${reg.worldPos.x}%;top:${reg.worldPos.y}%;" data-region-id="${reg.id}">
        <span class="node-disc" style="color:${reg.color};">
          ${reg.name.slice(0, 1)}
          <span class="node-weather" style="color:${w.color};">${w.short}</span>
        </span>
        <span class="node-label">${escapeHtml(reg.name)}</span>
        ${unlocked ? '' : `<span class="node-cost">${reg.unlockCost} 币解锁</span>`}
      </button>
    `;
  }).join('');

  const subMapsHtml = activeReg.maps.map((mid) => {
    const m = MAPS_BY_ID[mid];
    if (!m) return '';
    const isCur = m.id === state.mapId;
    const typeTag = m.sceneType === 'interior' ? '室' : m.sceneType === 'cave' ? '窟' : m.sceneType === 'town' ? '镇' : '野';
    return `<button class="submap-pill${isCur ? ' current' : ''}" data-map-id="${m.id}">[${typeTag}] ${escapeHtml(m.short || m.name)}</button>`;
  }).join('');

  const body = `
    <div class="world-map-board">
      <svg class="world-map-svg">${linesSvg.join('')}</svg>
      <div class="map-nodes-layer">${nodesHtml}</div>
    </div>
    <div class="modal-list-item">
      <div>
        <div class="modal-item-title">${escapeHtml(activeReg.name)} · ${escapeHtml(activeReg.subtitle)}</div>
        <div class="modal-item-desc">当前天气：${escapeHtml((WEATHERS[state.regionWeathers[activeReg.id] ?? 0] || WEATHERS[0]).name)} · 下辖 ${activeReg.maps.length} 张无缝 2.5D 地图</div>
      </div>
      ${isRegionUnlocked(activeReg.id)
        ? `<button class="btn btn-amber btn-sm" id="btn-travel-region">直达主图</button>`
        : `<button class="btn btn-vermilion btn-sm" id="btn-unlock-region">花费 ${activeReg.unlockCost} 币解锁</button>`}
    </div>
    <div class="region-submaps-bar">${subMapsHtml}</div>
  `;

  openModal('墨土五域 · 天下舆图（21 张无缝地图）', body);

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
    return { kind: 'item', id: 10, _equipUid: slotObj.uid };
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

function openCrucible() {
  const tabsHtml = `
    <div class="modal-tabs">
      <button class="modal-tab-btn${crucibleTab === 'forge' ? ' active' : ''}" data-ctab="forge">炼化炉台</button>
      <button class="modal-tab-btn${crucibleTab === 'guardians' ? ' active' : ''}" data-ctab="guardians">护驾出战 (${state.unlockedGuardians.length}/${Object.keys(GUARDIANS).length})</button>
      <button class="modal-tab-btn${crucibleTab === 'recipes' ? ' active' : ''}" data-ctab="recipes">墨壶图谱 (${RECIPES.length})</button>
    </div>
  `;

  let contentHtml = '';
  if (crucibleTab === 'forge') {
    const pool = getCruciblePoolEntries();
    const [a, b] = crucibleSlots;
    const match = findMatchingRecipe(a, b);
    const previewHtml = match
      ? `<strong style="color:${QUALITY[match.quality]?.color || '#e5bb5c'}">${escapeHtml(match.name)}</strong><small class="modal-item-desc">${escapeHtml(match.desc)}</small>`
      : (a && b)
        ? `<strong style="color:#c4a6f5">天工未知炼化</strong><small class="modal-item-desc">任意二合一：产出带暗黑词缀的神兵/丹药/护驾</small>`
        : `<small class="modal-item-desc">点击下方素材填入双槽</small>`;

    const poolHtml = pool.length
      ? pool.map((p) => {
        const isSel = (a && a.key === p.key) || (b && b.key === p.key);
        return `<button class="crucible-chip${isSel ? ' selected' : ''}" data-pkey="${escapeHtml(p.key)}"><span class="item-seal-badge" style="width:20px;height:20px;font-size:11px;">${escapeHtml(p.seal)}</span>${escapeHtml(p.name)} ×${p.count}</button>`;
      }).join('')
      : '<div class="modal-item-desc">暂无可用妖魂或物资，去野外战斗收妖或拾荒吧！</div>';

    contentHtml = `
      <div class="crucible-workbench">
        <div class="crucible-slots">
          <div class="crucible-slot${a ? ' filled' : ''}" id="crucible-slot-0">
            ${a ? `<strong>${escapeHtml(a.name)}</strong><small>点击卸下</small>` : '<small>槽位一 · 妖魂/物资</small>'}
          </div>
          <div class="crucible-plus">+</div>
          <div class="crucible-slot${b ? ' filled' : ''}" id="crucible-slot-1">
            ${b ? `<strong>${escapeHtml(b.name)}</strong><small>点击卸下</small>` : '<small>槽位二 · 妖魂/物资</small>'}
          </div>
          <div class="crucible-arrow">→</div>
          <div class="crucible-result-preview">${previewHtml}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-secondary btn-sm" id="btn-crucible-clear">清空槽位</button>
          <button class="btn btn-purple" id="btn-crucible-fuse" ${a && b ? '' : 'disabled'}>启动天工墨壶炼化</button>
        </div>
      </div>
      <div class="modal-item-title">可选素材（妖魂 / 物资 / 闲置装备）</div>
      <div class="crucible-pool">${poolHtml}</div>
    `;
  } else if (crucibleTab === 'guardians') {
    const cards = Object.values(GUARDIANS).map((g) => {
      const unlocked = state.unlockedGuardians.includes(g.id);
      const active = state.activeGuardianId === g.id;
      return `
        <div class="modal-list-item${active ? ' done' : ''}" style="${unlocked ? '' : 'opacity:0.5;'}">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="item-seal-badge" style="border-color:${g.accent};color:${g.accent};">${escapeHtml(g.seal)}</span>
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
    contentHtml = `<div style="display:flex;flex-direction:column;gap:8px;">${cards}</div>`;
  } else {
    const rows = RECIPES.map((r) => {
      const nameA = r.matA.kind === 'spirit' ? (ENEMIES[r.matA.id]?.spiritName || r.matA.id) : (ITEMS[r.matA.id]?.name || r.matA.id);
      const nameB = r.matB.kind === 'spirit' ? (ENEMIES[r.matB.id]?.spiritName || r.matB.id) : (ITEMS[r.matB.id]?.name || r.matB.id);
      const hasA = r.matA.kind === 'spirit' ? (state.capturedSpirits[r.matA.id] || 0) > 0 : state.bag.some((x) => x.itemId === r.matA.id);
      const hasB = r.matB.kind === 'spirit' ? (state.capturedSpirits[r.matB.id] || 0) > 0 : state.bag.some((x) => x.itemId === r.matB.id);
      const ready = hasA && hasB;
      return `
        <div class="modal-list-item${ready ? ' done' : ''}">
          <div>
            <div class="modal-item-title" style="color:${QUALITY[r.quality]?.color}">${escapeHtml(r.name)}</div>
            <div class="modal-item-desc">${escapeHtml(nameA)} + ${escapeHtml(nameB)} · ${escapeHtml(r.desc)}</div>
          </div>
          ${ready ? `<button class="btn btn-purple btn-sm" data-quick-rec="${r.id}">填入炼化</button>` : '<small class="modal-item-desc">缺素材</small>'}
        </div>
      `;
    }).join('');
    contentHtml = `<div style="display:flex;flex-direction:column;gap:7px;">${rows}</div>`;
  }

  openModal('天工墨壶 · 跨界炼妖铸兵', tabsHtml + contentHtml);

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

  return `
    <div class="equip-card q-${q.key}">
      <div class="equip-head">
        <span class="equip-name" style="color:${q.color};">【${escapeHtml(eq.seal || '装')}】${escapeHtml(eq.name)}</span>
        <span class="genre-tag ${g.cls}">${g.label}</span>
      </div>
      <div class="modal-item-desc">${escapeHtml(SLOT_NAMES[eq.slot] || eq.slot)} · ${statBits.join(' / ') || escapeHtml(eq.desc)}</div>
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
  const tabsHtml = `
    <div class="modal-tabs">
      <button class="modal-tab-btn${bagTab === 'equip' ? ' active' : ''}" data-btab="equip">四槽装备 (${state.equipBag.length})</button>
      <button class="modal-tab-btn${bagTab === 'items' ? ' active' : ''}" data-btab="items">行囊物资 (${state.bag.length}/${stats.bagMax})</button>
      <button class="modal-tab-btn${bagTab === 'elixirs' ? ' active' : ''}" data-btab="elixirs">丹药补给</button>
    </div>
  `;

  let bodyHtml = '';
  let footerHtml = '<button class="btn btn-secondary" id="modal-default-close">合上卷轴</button>';

  if (bagTab === 'equip') {
    const slotsHtml = ['weapon', 'armor', 'mech', 'relic'].map((slot) => {
      const eq = state.equipped[slot];
      if (!eq) {
        return `<div class="equip-slot-card"><div class="equip-slot-label">${SLOT_NAMES[slot]}</div><div class="modal-item-desc">空槽位</div></div>`;
      }
      const q = QUALITY[eq.quality] || QUALITY.common;
      return `
        <div class="equip-slot-card q-${q.key}">
          <div class="equip-slot-label">${SLOT_NAMES[slot]} · 已装备</div>
          <div class="equip-name" style="color:${q.color};">${escapeHtml(eq.name)}</div>
          <button class="btn btn-secondary btn-sm" data-unequip="${slot}" style="margin-top:auto;">卸下</button>
        </div>
      `;
    }).join('');

    const bagList = state.equipBag.length
      ? state.equipBag.map((eq) => renderEquipCard(eq, `
          <button class="btn btn-amber btn-sm" data-equip-uid="${eq.uid}">装备</button>
          <button class="btn btn-secondary btn-sm" data-sell-eq="${eq.uid}">卖 ${getEquipSellPrice(eq)}币</button>
        `)).join('')
      : '<div class="modal-item-desc">装备库暂无闲置神兵，探索废墟、拆解重炮或墨壶炼化即可获得暗黑词缀装备！</div>';

    bodyHtml = `
      <div class="modal-item-desc">当前战力面板：攻击 <strong>${stats.atk}</strong> · 防御 <strong>${stats.def}</strong> · 暴击 <strong>${Math.round(stats.crit * 100)}%</strong> · 穿甲 <strong>${Math.round(stats.armorPen * 100)}%</strong> · 吸血 <strong>${Math.round(stats.lifesteal * 100)}%</strong></div>
      <div class="equip-slot-grid">${slotsHtml}</div>
      <div class="modal-item-title">装备库</div>
      <div class="modal-grid-2">${bagList}</div>
    `;
  } else if (bagTab === 'items') {
    const rows = state.bag.length
      ? state.bag.map((b) => {
        const it = ITEMS[b.itemId];
        const q = QUALITY[b.quality] || QUALITY.common;
        const price = getSellPrice(b);
        return `
          <div class="modal-list-item">
            <div style="display:flex;align-items:center;gap:9px;">
              <span class="item-seal-badge" style="border-color:${q.color};color:${q.color};">${escapeHtml(it.seal)}</span>
              <div>
                <div class="modal-item-title" style="color:${q.color};">[${q.name}] ${escapeHtml(it.name)}</div>
                <div class="modal-item-desc">${escapeHtml(it.desc)}</div>
              </div>
            </div>
            <div style="display:flex;gap:6px;">
              ${it.isConsumable ? `<button class="btn btn-green btn-sm" data-use-uid="${b.uid}">使用</button>` : ''}
              ${price > 0 ? `<button class="btn btn-amber btn-sm" data-sell-uid="${b.uid}">卖 ${price}币</button>` : ''}
            </div>
          </div>
        `;
      }).join('')
      : '<div class="modal-item-desc">行囊空空如也，快去城郊废土探索吧！</div>';
    bodyHtml = `<div style="display:flex;flex-direction:column;gap:7px;">${rows}</div>`;
    footerHtml = '<button class="btn btn-amber" id="btn-sell-all">一键变卖废品物资</button>' + footerHtml;
  } else {
    const elxRows = Object.entries(state.elixirs)
      .filter(([, cnt]) => cnt > 0)
      .map(([eid, cnt]) => {
        const e = ELIXIRS[eid];
        return `
          <div class="modal-list-item">
            <div>
              <div class="modal-item-title">【${e.seal}】${escapeHtml(e.name)} ×${cnt}</div>
              <div class="modal-item-desc">${escapeHtml(e.desc)}</div>
            </div>
            <button class="btn btn-green btn-sm" data-use-elx="${eid}">服用</button>
          </div>
        `;
      }).join('');
    bodyHtml = elxRows || '<div class="modal-item-desc">暂无天工墨壶炼制的稀世丹药，可用金疮药散+荧光菇或饼干+纯净水炼制！</div>';
  }

  openModal('行囊与暗黑词缀装备', tabsHtml + bodyHtml, footerHtml);

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

// ==================== 4. 武学奇术（6 大被动 + 16 项主动预览） ====================
function openSkill() {
  const passiveHtml = SKILLS.map((sk) => {
    const lv = state.skills[sk.id] || 0;
    const isMax = lv >= sk.maxLevel;
    const cost = sk.cost[lv] || 99;
    return `
      <div class="modal-list-item${isMax ? ' done' : ''}">
        <div style="display:flex;align-items:center;gap:9px;">
          <span class="item-seal-badge">${escapeHtml(sk.seal)}</span>
          <div>
            <div class="modal-item-title">${escapeHtml(sk.name)} <small>Lv.${lv}/${sk.maxLevel}</small></div>
            <div class="modal-item-desc">${escapeHtml(sk.desc)}</div>
          </div>
        </div>
        <button class="btn btn-amber btn-sm" data-up-skill="${sk.id}" ${isMax || state.skillPoints < cost ? 'disabled' : ''}>
          ${isMax ? '已圆满' : `升级 (${cost}点)`}
        </button>
      </div>
    `;
  }).join('');

  const combatHtml = COMBAT_SKILLS.map((cs) => {
    const unlocked = state.level >= cs.unlockLv;
    return `
      <div class="modal-list-item${unlocked ? ' done' : ''}" style="${unlocked ? '' : 'opacity:0.55;'}">
        <div>
          <div class="modal-item-title">【${cs.seal}】${escapeHtml(cs.name)} <small>(${cs.mpCost}内息 · Lv.${cs.unlockLv})</small></div>
          <div class="modal-item-desc">${escapeHtml(cs.desc)}</div>
        </div>
      </div>
    `;
  }).join('');

  openModal(
    `武学奇术阁 · 可用修为点：${state.skillPoints}`,
    `<div class="modal-item-title">六大废土修为（消耗修为点永久提升）</div>
     <div class="modal-grid-2">${passiveHtml}</div>
     <div class="modal-item-title" style="margin-top:6px;">十六项四系战斗绝学（随等级自动领悟）</div>
     <div class="modal-grid-2">${combatHtml}</div>`
  );

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
  const rows = SHOP_STOCK.map((s) => {
    const it = ITEMS[s.itemId];
    return `
      <div class="modal-list-item">
        <div style="display:flex;align-items:center;gap:9px;">
          <span class="item-seal-badge">${escapeHtml(it.seal)}</span>
          <div>
            <div class="modal-item-title">${escapeHtml(it.name)}</div>
            <div class="modal-item-desc">${escapeHtml(it.desc)}</div>
          </div>
        </div>
        <button class="btn btn-amber btn-sm" data-buy-id="${s.itemId}" data-buy-price="${s.price}">买 ${s.price}币</button>
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
        <button class="btn btn-green btn-sm" id="inn-rest-basic">歇脚 40币</button>
      </div>
      <div class="modal-list-item">
        <div>
          <div class="modal-item-title">秘制药浴 + 抗辐针（120 废土币）</div>
          <div class="modal-item-desc">全状态回满（含饱食 100），清零警戒，并获 1 层抗辐射护盾！</div>
        </div>
        <button class="btn btn-amber btn-sm" id="inn-rest-pro">药浴 120币</button>
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
          <div>
            <div class="modal-item-title" style="color:${q.color};">[${q.name}] ${escapeHtml(it.name)}</div>
            <div class="modal-item-desc">原价 ${baseVal} 币 · 拆解成功率 ${Math.round(baseRate * 100)}%（成功 1.8×~2.8× 暴击收益）</div>
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
      <button class="modal-tab-btn${saveModalTab === 'account' ? ' active' : ''}" data-stab="account">账号切换 &amp; JSON 备份</button>
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
      <div class="modal-item-title" style="margin-top:6px;">JSON 存档备份 / 导入</div>
      <textarea id="json-backup-text" class="textarea-field" placeholder="点击「导出当前存档」生成 JSON，或粘贴存档 JSON 后点击「导入覆盖」"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" id="btn-json-export">导出当前存档</button>
        <button class="btn btn-purple btn-sm" id="btn-json-import">导入覆盖当前账号</button>
      </div>
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
      showToast('已导出当前存档 JSON，可复制保存！', 'success');
    });

    $('btn-json-import')?.addEventListener('click', () => {
      const raw = $('json-backup-text')?.value?.trim();
      if (!raw) { showToast('请先粘贴存档 JSON！', 'warn'); return; }
      try {
        const parsed = JSON.parse(raw);
        state = migrateState(parsed);
        saveNow();
        closeModal();
        enterMap(state.mapId, state.heroX, state.heroY);
        showToast('存档 JSON 导入成功！', 'success');
      } catch {
        showToast('JSON 格式有误，导入失败！', 'danger');
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

function openHelpModal() {
  openModal(
    '墨土江湖指南',
    `
      <div class="modal-list-item"><div class="modal-item-desc"><strong>移动与交互</strong>：桌面使用 WASD/方向键或点击地面寻路，E/空格键交互；手机端使用左下角四向十字键与右下角主交互键。</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>五域 21 图</strong>：点击「天下舆图」可纵览五大区域与全部 21 张无缝地图（城镇/室内/荒原/秘境洞窟）。</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>收妖与天工墨壶</strong>：战斗中将普通怪物血量压至 ≤40%，点击「收妖」收入墨壶；在「天工墨壶」中放入任意 2 件妖魂/物资即可跨界炼化护驾灵兽、稀世丹药与暗黑词缀神兵！</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>四大流派</strong>：古武门派、现代军火、科幻墨甲、仙妖奇术 16 项主动技能随等级自动解锁。</div></div>
    `
  );
}

// ==================== 10. 开篇四幕水墨序章过场 ====================
function renderPrologueSlide() {
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

function openOpeningPrologue() {
  const overlay = $('opening-prologue');
  if (!overlay) return;
  prologueIndex = 0;
  if (world) world.paused = true;
  renderPrologueSlide();
  overlay.classList.remove('hidden');
}

function finishOpeningPrologue() {
  const overlay = $('opening-prologue');
  overlay?.classList.add('hidden');
  state.prologueSeen = true;
  saveNow();
  if (world && !battle && !currentDialog && $('modal-backdrop')?.classList.contains('hidden')) {
    world.paused = false;
  }
}

// ==================== 周期危机：辐射潮 ====================
function startHazardLoop() {
  if (hazardTimer) clearInterval(hazardTimer);
  hazardTimer = setInterval(() => {
    if (!world?.map || battle) return;
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

// ==================== 全局初始化与事件绑定 ====================
function init() {
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
        btn.disabled = false;
        lbl.textContent = target.label || '交互';
      } else {
        btn.disabled = true;
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
  $('btn-sound')?.addEventListener('click', () => {
    const muted = sfx.toggleMute();
    $('btn-sound').textContent = muted ? '🔇' : '🔊';
  });
  $('btn-help')?.addEventListener('click', openHelpModal);
  $('btn-reset')?.addEventListener('click', () => {
    if (!confirm('确定要重开本账号周目吗？当前进度将被清空！')) return;
    storage.clearSave(currentUser);
    state = createInitialState();
    enterMap('town', 800, 515);
    showToast('已重开新周目，欢迎回到墨石镇！', 'info');
  });

  // 对话框与弹窗关闭
  $('dialog-close-btn')?.addEventListener('click', closeDialog);
  $('modal-close')?.addEventListener('click', closeModal);
  $('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === $('modal-backdrop')) closeModal();
  });

  // 战斗指令按钮
  $('bat-btn-atk')?.addEventListener('click', battlePlayerAttack);
  $('bat-btn-skills')?.addEventListener('click', () => {
    if (!battle || battle.busy) return;
    battleSubMode = battleSubMode === 'skills' ? null : 'skills';
    renderBattleSubpanel();
  });
  $('bat-btn-capture')?.addEventListener('click', battleAttemptCapture);
  $('bat-btn-item')?.addEventListener('click', () => {
    if (!battle || battle.busy) return;
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
      renderPrologueSlide();
    } else {
      finishOpeningPrologue();
    }
  });
  $('btn-prologue-skip')?.addEventListener('click', () => {
    finishOpeningPrologue();
  });

  // 注册 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 加载初始地图并启动世界循环
  enterMap(state.mapId, state.heroX, state.heroY);
  world.start();
  startHazardLoop();
  updateHUD();

  // 新手首次进入时在开屏动画之后呈现四幕水墨序章
  if (!state.prologueSeen) {
    openOpeningPrologue();
  }
}

window.addEventListener('DOMContentLoaded', init);
