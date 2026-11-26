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

function getBgmTrackForMap(mapId) {
  const id = String(mapId || state.mapId || 'town');
  return id === 'town' || id.startsWith('interior_') ? 'town' : 'wild';
}

function isStudioSplashActive() {
  const sp = $('studio-splash');
  if (!sp) return false;
  return !sp.classList.contains('hidden') && !sp.classList.contains('splash-done') && sp.style.display !== 'none';
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
  if (!isStudioSplashActive() && !battle && $('opening-prologue')?.classList.contains('hidden')) {
    sfx.playBgm?.(getBgmTrackForMap(target.id));
  }
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
      showToast(`意外发现异纹神兵：【${QUALITY[bonusEq.quality].name}】${bonusEq.name}！`, 'success');
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
      $('dialog-text').textContent = '“北侧塌坡下就是战前防空洞，里头盘踞着墨尾巨鼠王。记得交锋时将荒原妖邪击至力竭，再以【天工墨壶】收摄残灵！”';
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
function getEnemySpritePath(tpl) {
  const st = tpl?.spriteType || 'rat';
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
  return `<img class="battle-enemy-img${isBoss ? ' is-boss' : ''}" src="${src}" alt="${escapeHtml(tpl.name)}" draggable="false" style="--boss-accent:${acc}" />`;
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
    triggerClassAnim($('bat-hero-portrait'), 'lunge-left', 240);
  } else {
    triggerClassAnim($('bat-enemy-visual'), 'lunge-right', 240);
  }
}

function spawnBattleSlashVfx(target = 'enemy', variant = 'physical') {
  const container = getBattleVfxContainer();
  if (!container) return;
  const { x, y } = getBattleTargetPos(target, container, 0, 8);
  const fxEl = document.createElement('div');
  fxEl.className = `bat-slash-fx slash-${variant}`;
  fxEl.style.left = `${Math.round(x)}px`;
  fxEl.style.top = `${Math.round(y)}px`;

  if (variant === 'capture') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 120 120" width="128" height="128" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="44" stroke="#c084fc" stroke-width="4" stroke-dasharray="18 10" opacity="0.92"/>
        <circle cx="60" cy="60" r="28" stroke="#e9d5ff" stroke-width="2.5" stroke-dasharray="10 8" opacity="0.85"/>
        <path d="M60 12 L68 52 L108 60 L68 68 L60 108 L52 68 L12 60 L52 52 Z" fill="rgba(192,132,252,0.32)" stroke="#f3e8ff" stroke-width="2"/>
      </svg>`;
  } else if (variant === 'mystic' || variant === 'mecha') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 140 140" width="144" height="144" fill="none" aria-hidden="true">
        <path d="M18 112 Q64 26 124 22 Q78 66 24 122 Z" fill="rgba(94,234,212,0.45)" stroke="#5eead4" stroke-width="3"/>
        <path d="M26 28 Q84 56 122 114" stroke="#99f6e4" stroke-width="4" stroke-linecap="round"/>
        <circle cx="72" cy="68" r="18" stroke="#2dd4bf" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.9"/>
      </svg>`;
  } else if (variant === 'crit') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 150 150" width="158" height="158" fill="none" aria-hidden="true">
        <path d="M16 126 Q72 34 138 16 Q88 76 28 136 Z" fill="rgba(251,191,36,0.58)" stroke="#fef08a" stroke-width="3.5"/>
        <path d="M22 28 Q82 62 134 126 Q74 88 14 40 Z" fill="rgba(249,115,22,0.42)" stroke="#fde047" stroke-width="2.5"/>
      </svg>`;
  } else if (variant === 'enemy') {
    fxEl.innerHTML = `
      <svg viewBox="0 0 130 130" width="132" height="132" fill="none" aria-hidden="true">
        <path d="M22 24 Q72 64 112 108" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
        <path d="M40 16 Q84 56 118 92" stroke="#fca5a5" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M14 44 Q58 78 96 116" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
      </svg>`;
  } else {
    fxEl.innerHTML = `
      <svg viewBox="0 0 140 140" width="140" height="140" fill="none" aria-hidden="true">
        <path d="M18 118 Q68 34 126 18 Q84 72 28 126 Z" fill="rgba(232,76,61,0.48)" stroke="#fca5a5" stroke-width="3"/>
        <path d="M30 106 Q74 44 118 30" stroke="#fef2f2" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
  }

  container.appendChild(fxEl);
  setTimeout(() => fxEl.remove(), 460);
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
  const vfxLayer = $('bat-vfx-layer');
  if (vfxLayer) vfxLayer.innerHTML = '';

  const enemyVisual = $('bat-enemy-visual');
  if (enemyVisual) {
    enemyVisual.classList.remove('hit', 'hit-flash', 'lunge-right');
    enemyVisual.innerHTML = buildEnemySvg(tpl);
  }
  const heroBatImg = $('bat-hero-portrait');
  if (heroBatImg) {
    heroBatImg.src = 'assets/sprites/hero.png';
    heroBatImg.style.objectFit = 'contain';
    heroBatImg.style.background = 'transparent';
    heroBatImg.classList.remove('hit', 'hit-flash', 'lunge-left');
  }
  $('rpg-battle-overlay').classList.remove('hidden');

  logBattle(tpl.introLine || `遭遇「${tpl.name}」！凝神戒备，准备迎战！`);
  setBattleButtonsEnabled(true);
  updateBattleUI();
  sfx.alarm();
  sfx.playBgm?.('battle');
}

function closeBattle() {
  battle = null;
  battleSubMode = null;
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
  scheduleSave();
}

function triggerHitAnim(isEnemy, strong = false) {
  const el = isEnemy ? $('bat-enemy-visual') : ($('bat-hero-portrait') || document.querySelector('.hero-portrait-battle'));
  if (!el) return;
  const dur = strong ? 320 : 260;
  triggerClassAnim(el, 'hit-flash', dur);
  triggerClassAnim(el, 'hit', dur);
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
    spawnBattleDmgNum('hero', `+${guard.healHp} HP`, 'heal');
    logs.push(`护驾【${guard.name}】施展「${guard.skillName}」回复 ${guard.healHp} 气血！`);
    return;
  }

  if (guard.shield) {
    battle.heroShield += guard.shield;
    spawnBattleDmgNum('hero', `护盾 +${guard.shield}`, 'shield', { offsetY: -22 });
  }

  const raw = (guard.baseDmg || 20) + (guard.perLvDmg ? state.level * guard.perLvDmg : 0);
  const dmg = guard.ignoreDef ? raw : Math.max(5, Math.round(raw - battle.enemy.def * 0.4));
  battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
  triggerHitAnim(true);
  spawnBattleSlashVfx('enemy', 'mystic');
  spawnBattleDmgNum('enemy', `-${dmg}`, 'mystic', { offsetY: -24 });

  if (guard.effect === 'poison') battle.enemyStatus.poison = 3;
  if (guard.effect === 'armor_break' && Math.random() < 0.35) battle.enemyStatus.def_down = 2;
  if (guard.effect === 'lifesteal' && guard.healHp) {
    state.hp = Math.min(stats.maxHp, state.hp + guard.healHp);
    spawnBattleDmgNum('hero', `+${guard.healHp} HP`, 'heal');
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
    spawnBattleDmgNum('enemy', '眩晕!', 'mystic', { offsetY: -18 });
    logs.push(`${battle.tpl.name}陷入【眩晕】，无法行动！`);
  } else {
    const tpl = battle.tpl;
    const isSpecial = tpl.specialEvery && (battle.turn % tpl.specialEvery === 0);
    const mult = isSpecial ? (tpl.specialMult || 1.5) : 1;
    let rawDmg = Math.max(3, Math.round(battle.enemy.atk * mult - stats.def * 0.65));
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
  triggerBattleLunge(true);
  triggerHitAnim(true, isCrit);
  spawnBattleSlashVfx('enemy', isCrit ? 'crit' : 'physical');
  spawnBattleDmgNum('enemy', isCrit ? `暴击! -${dmg}` : `-${dmg}`, isCrit ? 'crit' : 'physical');
  sfx.disassemble(true, isCrit);

  const logs = [`沈砚挥兵直击，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`];
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
  const flavorPrefix = skill.flavor ? `${skill.flavor} ` : '';

  if (skill.selfBuff === 'shield') {
    const sh = (skill.baseShield || 45) + state.level * (skill.perLvShield || 8);
    battle.heroShield += sh;
    battle.dmgReduceTurns = 2;
    spawnBattleDmgNum('hero', `护盾 +${sh}`, 'shield');
    sfx.pick('rare');
    logs.push(`${flavorPrefix}施展【${skill.name}】，获得 ${sh} 点护盾并减伤 30%！`);
  } else if (skill.selfBuff === 'overdrive') {
    const sh = skill.baseShield || 65;
    battle.heroShield += sh;
    battle.overdriveTurns = 3;
    spawnBattleDmgNum('hero', `护盾 +${sh}`, 'shield');
    spawnBattleDmgNum('hero', '狂涌 +30%', 'mystic', { offsetY: -30 });
    sfx.pick('legend');
    logs.push(`${flavorPrefix}启动【${skill.name}】，护盾 +${sh}，3 回合内攻击 +30%！`);
  } else if (skill.selfBuff === 'heal') {
    const heal = Math.round(stats.maxHp * (skill.healPct || 0.45));
    state.hp = Math.min(stats.maxHp, state.hp + heal);
    if (skill.cleanse) {
      battle.heroStatus.burn = 0;
      battle.heroStatus.poison = 0;
    }
    spawnBattleDmgNum('hero', `+${heal} HP`, 'heal');
    sfx.pick('fine');
    logs.push(`${flavorPrefix}运转【${skill.name}】，恢复 ${heal} 气血并净化负面状态！`);
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
    const isMysticOrMecha = skill.category === 'mystic' || skill.category === 'mecha';
    const dmgStyle = isCrit ? 'crit' : (isMysticOrMecha ? skill.category : (skill.category === 'firearm' ? 'firearm' : 'physical'));
    const slashVariant = isCrit ? 'crit' : (isMysticOrMecha ? skill.category : 'physical');

    triggerBattleLunge(true);
    triggerHitAnim(true, isCrit || (skill.mult || 1) >= 2.2);
    spawnBattleSlashVfx('enemy', slashVariant);
    spawnBattleDmgNum('enemy', isCrit ? `暴击! -${dmg}` : `-${dmg}`, dmgStyle);
    sfx.disassemble(true, true);
    logs.push(`${flavorPrefix}施展【${skill.name}】，造成 ${dmg} 点${isCrit ? '暴击' : ''}伤害！`);

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

  spawnBattleSlashVfx('enemy', 'capture');

  if (Math.random() < chance) {
    const id = battle.tpl.id;
    state.capturedSpirits[id] = (state.capturedSpirits[id] || 0) + 1;
    state.stats.capture = (state.stats.capture || 0) + 1;
    triggerHitAnim(true, true);
    spawnBattleDmgNum('enemy', '收妖成功!', 'capture');
    advanceQuestTrigger('capture_any');
    handleBattleVictory(true);
  } else {
    spawnBattleDmgNum('enemy', '收妖! 挣脱', 'capture');
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

// ==================== 物品 / 妖魂 / 装备真实视觉缩略图渲染 ====================
function _getSpiritSpriteSrc(spriteType) {
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

  // 2. 装备（武器 / 护甲 / 机甲核心 / 秘宝）
  if (kind === 'equip' || kind === 'equipment') {
    const eq = typeof idOrObj === 'object' && idOrObj ? idOrObj : EQUIPMENT[idOrObj];
    if (!eq) {
      return _thumbImg('assets/sprites/chest.png', '装备', s);
    }

    // 机甲核心
    if (eq.slot === 'mech') {
      if (eq.id === 'mech_crimson_frame' || eq.id === 'mech_tianshu_exo') {
        const glow = eq.id === 'mech_tianshu_exo'
          ? 'filter:drop-shadow(0 0 7px rgba(56,189,248,0.65)) drop-shadow(0 3px 6px rgba(0,0,0,0.8));'
          : 'filter:drop-shadow(0 0 7px rgba(249,115,22,0.55)) drop-shadow(0 3px 6px rgba(0,0,0,0.8));';
        return _thumbImg('assets/sprites/enemy_mech.png', eq.name, s, glow);
      }
      if (eq.id === 'mech_bit_array') {
        return _thumbSvg(s, `
          <circle cx="24" cy="24" r="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2.2"/>
          <circle cx="24" cy="24" r="4.5" fill="#7dd3fc"/>
          <polygon points="24,4 28,12 20,12" fill="#d49a3a" stroke="#f3ce7a" stroke-width="1"/>
          <polygon points="44,24 36,28 36,20" fill="#d49a3a" stroke="#f3ce7a" stroke-width="1"/>
          <polygon points="24,44 20,36 28,36" fill="#d49a3a" stroke="#f3ce7a" stroke-width="1"/>
          <polygon points="4,24 12,20 12,28" fill="#d49a3a" stroke="#f3ce7a" stroke-width="1"/>
          <circle cx="24" cy="8" r="1.8" fill="#38bdf8"/>
          <circle cx="40" cy="24" r="1.8" fill="#38bdf8"/>
          <circle cx="24" cy="40" r="1.8" fill="#38bdf8"/>
          <circle cx="8" cy="24" r="1.8" fill="#38bdf8"/>
        `);
      }
      return _thumbSvg(s, `
        <polygon points="24,5 39,14 39,34 24,43 9,34 9,14" fill="#2b2623" stroke="#d49a3a" stroke-width="2.4"/>
        <polygon points="24,11 33,17 33,31 24,37 15,31 15,17" fill="#1a2630" stroke="#5eead4" stroke-width="1.6"/>
        <circle cx="24" cy="24" r="5.5" fill="#38bdf8"/>
        <circle cx="24" cy="24" r="2.5" fill="#e0f2fe"/>
        <path d="M24 5v6M39 14l-6 3M39 34l-6-3M24 43v-6M9 34l6-3M9 14l6 3" stroke="#e5bb5c" stroke-width="1.5"/>
      `);
    }

    // 秘宝
    if (eq.slot === 'relic') {
      if (eq.id === 'relic_tianshu') {
        return _thumbImg('assets/app_icon.png', eq.name, s, 'border-radius:50%;border:1.5px solid rgba(229,187,92,0.75);');
      }
      if (eq.id === 'relic_fox_orb') {
        return _thumbSvg(s, `
          <circle cx="24" cy="24" r="16" fill="#3b1736" stroke="#e5bb5c" stroke-width="2"/>
          <circle cx="24" cy="24" r="11" fill="#ec4899" opacity="0.75"/>
          <circle cx="20" cy="20" r="4.5" fill="#fbcfe8" opacity="0.85"/>
          <path d="M10 31c4 5 24 5 28 0" fill="none" stroke="#f3ce7a" stroke-width="2" stroke-linecap="round"/>
          <path d="M13 13c5-5 17-5 22 0" fill="none" stroke="#f472b6" stroke-width="1.6" stroke-linecap="round"/>
        `);
      }
      return _thumbSvg(s, `
        <rect x="11" y="7" width="26" height="34" rx="4" fill="#2c241b" stroke="#e5bb5c" stroke-width="2.2"/>
        <rect x="15" y="11" width="18" height="26" rx="2" fill="#1c273d" stroke="#d49a3a" stroke-width="1.2"/>
        <polygon points="26,12 18,25 24,25 21,36 31,22 25,22" fill="#38bdf8" stroke="#bae6fd" stroke-width="0.8"/>
      `);
    }

    // 护甲
    if (eq.slot === 'armor') {
      if (eq.genre === 'scifi') {
        return _thumbSvg(s, `
          <path d="M12 10l6-3h12l6 3 4 9-6 4v16l-10 4-10-4V23l-6-4z" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <path d="M18 12h12l2 10-8 5-8-5z" fill="#334155" stroke="#7dd3fc" stroke-width="1.2"/>
          <circle cx="24" cy="20" r="3.5" fill="#5eead4"/>
          <path d="M16 32h16M18 36h12" stroke="#d49a3a" stroke-width="1.8" stroke-linecap="round"/>
        `);
      }
      return _thumbSvg(s, `
        <path d="M13 10l5-3h12l5 3 4 8-5 4v16l-10 4-10-4V22l-5-4z" fill="#3a3026" stroke="#d49a3a" stroke-width="2"/>
        <path d="M15 18h18M15 24h18M16 30h16M18 35h12" stroke="#c89b3c" stroke-width="1.8"/>
        <path d="M24 11v28" stroke="#78716c" stroke-width="1.6"/>
        <circle cx="24" cy="21" r="3" fill="#e5bb5c"/>
      `);
    }

    // 武器：重炮 / 电磁炮 / 加特林 / 等离子步枪 / 狙击 / 霰弹 / 手铳 / 光剑 / 古剑
    const wt = eq.weaponType || 'blade';
    if (wt === 'cannon') {
      return _thumbSvg(s, `
        <rect x="6" y="17" width="30" height="12" rx="3" fill="#475569" stroke="#d49a3a" stroke-width="2"/>
        <rect x="34" y="15" width="8" height="16" rx="2" fill="#b45309" stroke="#f3ce7a" stroke-width="1.6"/>
        <circle cx="14" cy="23" r="3" fill="#f97316"/>
        <path d="M12 29l-4 10h8l2-10M24 29l4 10h6l-4-10" fill="#334155" stroke="#94a3b8" stroke-width="1.4"/>
        <circle cx="40" cy="23" r="2.5" fill="#fde047"/>
      `);
    }
    if (wt === 'railgun') {
      return _thumbSvg(s, `
        <rect x="5" y="15" width="35" height="5" rx="1.5" fill="#334155" stroke="#38bdf8" stroke-width="1.5"/>
        <rect x="5" y="25" width="35" height="5" rx="1.5" fill="#334155" stroke="#38bdf8" stroke-width="1.5"/>
        <rect x="7" y="20" width="24" height="5" fill="#f97316"/>
        <path d="M31 22.5h12" stroke="#fde047" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="8" y="29" width="9" height="9" rx="2" fill="#475569" stroke="#d49a3a" stroke-width="1.4"/>
        <circle cx="18" cy="22.5" r="2.2" fill="#fef08a"/>
      `);
    }
    if (wt === 'gatling') {
      return _thumbSvg(s, `
        <rect x="18" y="15" width="24" height="3.2" rx="1" fill="#94a3b8" stroke="#1e293b" stroke-width="0.8"/>
        <rect x="18" y="20" width="24" height="3.2" rx="1" fill="#cbd5e1" stroke="#1e293b" stroke-width="0.8"/>
        <rect x="18" y="25" width="24" height="3.2" rx="1" fill="#94a3b8" stroke="#1e293b" stroke-width="0.8"/>
        <rect x="33" y="14" width="4" height="15" rx="1" fill="#d49a3a"/>
        <rect x="7" y="14" width="13" height="15" rx="3" fill="#475569" stroke="#e5bb5c" stroke-width="1.8"/>
        <rect x="10" y="29" width="8" height="10" rx="2" fill="#b45309" stroke="#f3ce7a" stroke-width="1.3"/>
      `);
    }
    if (wt === 'plasma') {
      return _thumbSvg(s, `
        <path d="M6 21h28l6-2v6l-6-1H22l-3 11h-6l2-9H6z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
        <rect x="16" y="16" width="12" height="4" rx="1.5" fill="#0ea5e9"/>
        <rect x="24" y="20" width="11" height="3" rx="1" fill="#7dd3fc"/>
        <circle cx="13" cy="22" r="2" fill="#5eead4"/>
      `);
    }
    if (wt === 'sniper') {
      return _thumbSvg(s, `
        <path d="M5 25l6-4h28v3H21l-4 9h-5l2-7H5z" fill="#3f3f46" stroke="#d49a3a" stroke-width="1.6"/>
        <rect x="14" y="14" width="14" height="4" rx="1.5" fill="#18181b" stroke="#f59e0b" stroke-width="1.3"/>
        <line x1="18" y1="18" x2="18" y2="21" stroke="#d49a3a" stroke-width="1.5"/>
        <line x1="24" y1="18" x2="24" y2="21" stroke="#d49a3a" stroke-width="1.5"/>
        <rect x="38" y="20" width="5" height="5" rx="1" fill="#a1a1aa"/>
      `);
    }
    if (wt === 'shotgun') {
      return _thumbSvg(s, `
        <path d="M5 29l9-7h26v4H23l-3 4H12l-5 4z" fill="#7c2d12" stroke="#d49a3a" stroke-width="1.6"/>
        <rect x="16" y="18" width="25" height="4" rx="1" fill="#64748b" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="20" y="22" width="12" height="3.5" rx="1" fill="#b45309"/>
      `);
    }
    if (wt === 'pistol') {
      return _thumbSvg(s, `
        <path d="M10 17h24l3 4-3 3H21l-4 12h-7l4-12h-4z" fill="#475569" stroke="#e5bb5c" stroke-width="1.8"/>
        <rect x="13" y="19" width="18" height="3" fill="#f97316"/>
        <circle cx="37" cy="21" r="2.5" fill="#fde047"/>
      `);
    }
    if (eq.genre === 'scifi') {
      return _thumbSvg(s, `
        <line x1="12" y1="36" x2="38" y2="10" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" opacity="0.45"/>
        <line x1="12" y1="36" x2="38" y2="10" stroke="#e0f2fe" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="11" y1="29" x2="19" y2="37" stroke="#c084fc" stroke-width="3.2" stroke-linecap="round"/>
        <line x1="7" y1="41" x2="14" y2="34" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
      `);
    }
    if (eq.genre === 'mythic') {
      return _thumbSvg(s, `
        <polygon points="40,8 34,18 17,35 13,31 30,14" fill="#fde047" stroke="#f59e0b" stroke-width="1.6"/>
        <line x1="16" y1="32" x2="36" y2="12" stroke="#fef9c3" stroke-width="1.6"/>
        <path d="M11 26l11 11" stroke="#d49a3a" stroke-width="3.4" stroke-linecap="round"/>
        <line x1="7" y1="41" x2="15" y2="33" stroke="#7c2d12" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="16.5" cy="31.5" r="2.5" fill="#5eead4"/>
      `);
    }
    // 古武刀剑
    return _thumbSvg(s, `
      <polygon points="39,9 34,19 18,35 14,31 30,15" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/>
      <line x1="17" y1="32" x2="36" y2="13" stroke="#f8fafc" stroke-width="1.4"/>
      <line x1="12" y1="27" x2="21" y2="36" stroke="#d49a3a" stroke-width="3.2" stroke-linecap="round"/>
      <line x1="7" y1="41" x2="15" y2="33" stroke="#573b26" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M8 40c-2 3 2 5 4 3" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
    `);
  }

  // 3. 丹药
  if (kind === 'elixir') {
    const elx = typeof idOrObj === 'object' && idOrObj ? idOrObj : ELIXIRS[idOrObj];
    if (elx?.id === 'elixir_jiuzhuan') {
      return _thumbSvg(s, `
        <circle cx="24" cy="28" r="12" fill="#065f46" stroke="#6ee7b7" stroke-width="2"/>
        <circle cx="24" cy="15" r="6" fill="#047857" stroke="#6ee7b7" stroke-width="1.8"/>
        <rect x="21" y="7" width="6" height="4" rx="1" fill="#d49a3a"/>
        <circle cx="20" cy="26" r="3" fill="#a7f3d0" opacity="0.8"/>
        <path d="M17 20h14" stroke="#f3ce7a" stroke-width="2"/>
      `);
    }
    return _thumbSvg(s, `
      <circle cx="24" cy="25" r="14" fill="#78350f" stroke="#f3ce7a" stroke-width="2.2"/>
      <circle cx="24" cy="25" r="9.5" fill="#f59e0b"/>
      <circle cx="20" cy="21" r="3.5" fill="#fef3c7" opacity="0.85"/>
      <path d="M14 25h20" stroke="#fde68a" stroke-width="1.2" opacity="0.7"/>
    `);
  }

  // 4. 背包物品（补给品 / 剧情信物 / 古董 / 科技 / 废品）
  if (kind === 'item') {
    const it = typeof idOrObj === 'object' && idOrObj ? idOrObj : ITEMS[idOrObj];
    if (!it) return _thumbImg('assets/sprites/chest.png', '物资', s);

    if (it.isStory) {
      return _thumbImg('assets/app_icon.png', it.name, s, 'border-radius:8px;border:1.5px solid rgba(229,187,92,0.7);');
    }
    if (it.isCollection) {
      return _thumbSvg(s, `
        <ellipse cx="24" cy="27" rx="13" ry="12" fill="#2b2114" stroke="#e5bb5c" stroke-width="2.2"/>
        <path d="M18 15l2-6h8l2 6" fill="#92400e" stroke="#f3ce7a" stroke-width="1.8"/>
        <circle cx="24" cy="27" r="5" fill="#34d399" stroke="#fde68a" stroke-width="1.4"/>
        <path d="M13 27h6M29 27h6" stroke="#d49a3a" stroke-width="1.8"/>
      `);
    }

    // 5 种核心补给品专属多色插画
    if (it.id === 20) { // 压缩饼干
      return _thumbSvg(s, `
        <rect x="8" y="11" width="32" height="26" rx="4" fill="#d99b43" stroke="#f3ce7a" stroke-width="2"/>
        <rect x="12" y="15" width="24" height="18" rx="2" fill="#b4752a"/>
        <rect x="8" y="21" width="32" height="6" fill="#991b1b" opacity="0.88"/>
        <circle cx="16" cy="18" r="1.3" fill="#fde68a"/><circle cx="24" cy="18" r="1.3" fill="#fde68a"/><circle cx="32" cy="18" r="1.3" fill="#fde68a"/>
        <circle cx="16" cy="30" r="1.3" fill="#fde68a"/><circle cx="24" cy="30" r="1.3" fill="#fde68a"/><circle cx="32" cy="30" r="1.3" fill="#fde68a"/>
      `);
    }
    if (it.id === 21) { // 纯净水
      return _thumbSvg(s, `
        <rect x="19" y="6" width="10" height="5" rx="1.5" fill="#cbd5e1" stroke="#38bdf8" stroke-width="1.2"/>
        <path d="M15 15c0-3 4-4 9-4s9 1 9 4v21a5 5 0 0 1-5 5h-8a5 5 0 0 1-5-5z" fill="#0369a1" stroke="#7dd3fc" stroke-width="2"/>
        <path d="M16 25q4-3 8 0t8 0v10a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="#38bdf8" opacity="0.85"/>
        <line x1="19" y1="16" x2="19" y2="33" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      `);
    }
    if (it.id === 22) { // 金疮药散
      return _thumbSvg(s, `
        <rect x="18" y="7" width="12" height="5" rx="1.5" fill="#92400e" stroke="#f3ce7a" stroke-width="1.2"/>
        <rect x="12" y="13" width="24" height="27" rx="6" fill="#ecfdf5" stroke="#6ee7b7" stroke-width="2"/>
        <rect x="21.5" y="19" width="5" height="15" rx="1" fill="#dc2626"/>
        <rect x="16.5" y="24" width="15" height="5" rx="1" fill="#dc2626"/>
      `);
    }
    if (it.id === 23) { // 抗辐射药剂
      return _thumbSvg(s, `
        <path d="M24 7l14 6v11c0 9-6 14-14 17-8-3-14-8-14-17V13z" fill="#14532d" stroke="#a3e635" stroke-width="2"/>
        <circle cx="24" cy="23" r="6.5" fill="#84cc16" opacity="0.85"/>
        <circle cx="24" cy="23" r="2.4" fill="#fef08a"/>
        <path d="M24 14v3M16 27l2.5-1.5M32 27l-2.5-1.5" stroke="#ecfccb" stroke-width="1.8" stroke-linecap="round"/>
      `);
    }
    if (it.id === 24) { // 烟雾弹
      return _thumbSvg(s, `
        <rect x="15" y="15" width="18" height="24" rx="4" fill="#3f6212" stroke="#a3e635" stroke-width="1.8"/>
        <rect x="19" y="10" width="10" height="5" rx="1" fill="#94a3b8"/>
        <rect x="15" y="23" width="18" height="5" fill="#e5bb5c" opacity="0.85"/>
        <circle cx="31" cy="11" r="4" fill="#e2e8f0" opacity="0.75"/>
        <circle cx="36" cy="8" r="3" fill="#f8fafc" opacity="0.65"/>
      `);
    }

    // 宝箱/残骸容器类直接用 chest.png
    if (it.id === 1 || it.id === 11 || it.id === 15) {
      return _thumbImg('assets/sprites/chest.png', it.name, s);
    }
    // 辐射稳定核 / 避难所芯片
    if (it.id === 10 || it.id === 19) {
      return _thumbSvg(s, `
        <rect x="10" y="10" width="28" height="28" rx="6" fill="#1e1b4b" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="24" cy="24" r="7" fill="#0ea5e9"/>
        <circle cx="24" cy="24" r="3.2" fill="#e0f2fe"/>
        <path d="M24 5v5M24 38v5M5 24h5M38 24h5" stroke="#c084fc" stroke-width="2" stroke-linecap="round"/>
      `);
    }
    // 变异荧光菇
    if (it.id === 17) {
      return _thumbSvg(s, `
        <path d="M10 25c0-10 6-15 14-15s14 5 14 15z" fill="#10b981" stroke="#6ee7b7" stroke-width="2"/>
        <rect x="20" y="25" width="8" height="14" rx="3" fill="#d1fae5" stroke="#34d399" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="2.2" fill="#fef08a"/><circle cx="28" cy="16" r="2.5" fill="#a7f3d0"/><circle cx="25" cy="22" r="1.6" fill="#fef08a"/>
      `);
    }
    // 应急信号枪
    if (it.id === 14) {
      return _thumbSvg(s, `
        <path d="M10 17h24l3 4-3 3H21l-4 12h-7l4-12h-4z" fill="#991b1b" stroke="#f3ce7a" stroke-width="1.8"/>
        <circle cx="37" cy="21" r="3" fill="#fb923c"/>
      `);
    }
    // 通行币 / 腕表
    if (it.id === 12 || it.id === 16) {
      return _thumbSvg(s, `
        <circle cx="24" cy="24" r="14" fill="#78350f" stroke="#f3ce7a" stroke-width="2.4"/>
        <circle cx="24" cy="24" r="9.5" fill="#d97706" stroke="#fde68a" stroke-width="1.3"/>
        <path d="M24 18v6l4 3" fill="none" stroke="#fef9c3" stroke-width="2.2" stroke-linecap="round"/>
      `);
    }
    // 科技电子件（电路板/显卡/电池/无人机/光学镜片/伺服机）
    if (it.category === 'tech' || it.id === 18) {
      return _thumbSvg(s, `
        <rect x="8" y="10" width="32" height="28" rx="4" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
        <rect x="16" y="17" width="16" height="14" rx="2" fill="#1e293b" stroke="#e5bb5c" stroke-width="1.6"/>
        <circle cx="24" cy="24" r="3.2" fill="#38bdf8"/>
        <path d="M12 15h4M32 15h4M12 33h6M30 33h6" stroke="#f3ce7a" stroke-width="1.8" stroke-linecap="round"/>
      `);
    }
    // 其余通用废品/铜线/铁罐/钢缆
    return _thumbSvg(s, `
      <rect x="11" y="12" width="26" height="25" rx="5" fill="#44403c" stroke="#d49a3a" stroke-width="2"/>
      <ellipse cx="24" cy="14" rx="12" ry="3.5" fill="#78716c" stroke="#e5bb5c" stroke-width="1.4"/>
      <path d="M12 22h24M12 29h24" stroke="#b45309" stroke-width="2.2"/>
      <circle cx="24" cy="25.5" r="3" fill="#f59e0b"/>
    `);
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
      ? `${renderVisualThumb(match.resultType, match.resultId, 76)}
         <strong style="font-family:var(--font-serif);color:${QUALITY[match.quality]?.color || '#e5bb5c'};font-size:13px;letter-spacing:1.5px;text-shadow:0 2px 10px #000;line-height:1.2;max-width:128px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(match.name)}</strong>`
      : (a && b)
        ? `${renderVisualThumb('mystery', null, 68)}
           <strong style="font-family:var(--font-serif);color:#c4a6f5;font-size:13px;letter-spacing:1.5px;text-shadow:0 2px 10px #000;line-height:1.2;">天工未知炼化</strong>`
        : `${renderVisualThumb('crucible', null, 58)}
           <small style="font-family:var(--font-serif);color:rgba(240,232,216,0.72);font-size:12px;letter-spacing:2px;text-shadow:0 2px 8px #000;">待启炼化</small>`;

    const recipeHintHtml = match
      ? `<div class="modal-item-desc" style="text-align:center;color:#e5bb5c;font-family:var(--font-serif);letter-spacing:1px;text-shadow:0 2px 8px #000;">已感应丹方 · ${escapeHtml(match.desc)}</div>`
      : (a && b)
        ? `<div class="modal-item-desc" style="text-align:center;color:#c4a6f5;font-family:var(--font-serif);letter-spacing:1px;text-shadow:0 2px 8px #000;">阴阳化生 · 万物皆可入壶（凝炼灵韵异纹神兵 / 丹药 / 护驾）</div>`
        : '';

    const renderSlotInner = (slotObj, emptyTitle) => {
      if (!slotObj) {
        return `<span style="font-family:var(--font-serif);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--bronze-bright);text-shadow:0 2px 10px #000;">${emptyTitle}</span>
                <small style="font-family:var(--font-serif);opacity:0.68;font-size:11px;letter-spacing:1px;text-shadow:0 2px 8px #000;">点击下方素材纳灵</small>`;
      }
      const thumb = renderVisualThumb(slotObj.kind, slotObj.kind === 'equip' ? slotObj.eq : slotObj.id, 76);
      return `${thumb}
              <strong style="font-family:var(--font-serif);font-size:13px;letter-spacing:1.5px;color:#f5ecd8;text-shadow:0 2px 10px #000;line-height:1.2;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(slotObj.name)}</strong>`;
    };

    const slotMistStyle = (filled) =>
      `width:132px;height:126px;padding:4px;border:none;border-radius:0;box-shadow:none;background:${
        filled
          ? 'radial-gradient(ellipse at 50% 62%, rgba(157,124,216,0.34), rgba(94,234,212,0.12) 45%, transparent 74%)'
          : 'radial-gradient(ellipse at 50% 65%, rgba(212,162,74,0.16), rgba(94,234,212,0.05) 45%, transparent 72%)'
      };`;

    const poolHtml = pool.length
      ? pool.map((p) => {
        const isSel = (a && a.key === p.key) || (b && b.key === p.key);
        const thumb = renderVisualThumb(p.kind, p.kind === 'equip' ? p.eq : p.id, 52);
        return `
          <button class="crucible-chip${isSel ? ' selected' : ''}" data-pkey="${escapeHtml(p.key)}" title="${escapeHtml(p.name)} ×${p.count}"
            style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:90px;min-height:88px;padding:6px 4px;clip-path:none;border:none;border-radius:10px;box-shadow:none;position:relative;text-align:center;background:${
              isSel
                ? 'radial-gradient(circle at 50% 45%, rgba(157,124,216,0.38), rgba(94,234,212,0.12) 52%, transparent 76%)'
                : 'radial-gradient(circle at 50% 48%, rgba(212,162,74,0.08), transparent 72%)'
            };">
            ${thumb}
            <span style="font-family:var(--font-serif);font-size:12px;letter-spacing:1px;line-height:1.2;color:${isSel ? '#f3ce7a' : '#ede4d2'};text-shadow:0 2px 8px #000;max-width:82px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.name)}</span>
            <span style="position:absolute;top:2px;right:6px;font-size:11px;font-weight:800;color:#f3ce7a;text-shadow:0 1px 6px #000;">×${p.count}</span>
          </button>`;
      }).join('')
      : '<div class="modal-item-desc">暂无可用妖魂或物资，去野外战斗收妖或拾荒吧！</div>';

    contentHtml = `
      <div class="crucible-workbench" style="border:none;padding:8px 4px 12px;gap:10px;background:radial-gradient(ellipse at 50% 34%, rgba(94,234,212,0.14), rgba(157,124,216,0.14) 38%, transparent 74%);">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;margin-bottom:-4px;">
          <img src="assets/app_icon.png" alt="天工墨壶" style="width:94px;height:94px;object-fit:contain;display:block;-webkit-mask-image:radial-gradient(circle, #000 54%, transparent 74%);mask-image:radial-gradient(circle, #000 54%, transparent 74%);filter:drop-shadow(0 0 18px rgba(94,234,212,0.52)) drop-shadow(0 0 28px rgba(157,124,216,0.42));">
          <div style="font-family:var(--font-serif);font-size:12px;letter-spacing:4px;color:rgba(243,206,122,0.88);text-shadow:0 2px 10px #000;">天工墨壶 · 纳灵炼化坛</div>
        </div>
        <div class="crucible-slots" style="gap:10px;">
          <div class="crucible-slot${a ? ' filled' : ''}" id="crucible-slot-0" title="${a ? '点击卸下' : '槽位一'}" style="${slotMistStyle(!!a)}">
            ${renderSlotInner(a, '阵眼一')}
          </div>
          <div class="crucible-plus" style="font-family:var(--font-serif);font-size:20px;opacity:0.85;">＋</div>
          <div class="crucible-slot${b ? ' filled' : ''}" id="crucible-slot-1" title="${b ? '点击卸下' : '槽位二'}" style="${slotMistStyle(!!b)}">
            ${renderSlotInner(b, '阵眼二')}
          </div>
          <div class="crucible-arrow" style="font-family:var(--font-serif);font-size:20px;opacity:0.85;">⟶</div>
          <div class="crucible-result-preview" title="${match ? escapeHtml(match.desc) : '炼化产物预览'}" style="width:138px;height:126px;padding:4px;border:none;border-radius:0;box-shadow:none;background:radial-gradient(ellipse at 50% 60%, rgba(94,234,212,0.24), rgba(212,162,74,0.08) 46%, transparent 74%);">${previewHtml}</div>
        </div>
        ${recipeHintHtml}
        <div style="display:flex;justify-content:center;gap:12px;margin-top:2px;">
          <button class="btn btn-secondary btn-sm" id="btn-crucible-clear">清空阵眼</button>
          <button class="btn btn-purple" id="btn-crucible-fuse" ${a && b ? '' : 'disabled'}>开炉炼化</button>
        </div>
      </div>
      <div class="modal-item-title" style="font-family:var(--font-serif);letter-spacing:2px;">可选素材（妖魂 / 物资 / 闲置装备）</div>
      <div class="crucible-pool" style="max-height:215px;gap:10px;justify-content:flex-start;">${poolHtml}</div>
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
      <div style="display:flex;align-items:center;gap:10px;">
        ${renderVisualThumb('equip', eq, 44)}
        <div style="flex:1;min-width:0;">
          <div class="equip-head">
            <span class="equip-name" style="color:${q.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(eq.name)}</span>
            <span class="genre-tag ${g.cls}">${g.label}</span>
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
        return `
          <div class="equip-slot-card" style="align-items:center;text-align:center;">
            <div class="equip-slot-label">${SLOT_NAMES[slot]}</div>
            ${renderVisualThumb('empty_slot', slot, 42)}
            <div class="modal-item-desc">空槽位</div>
          </div>`;
      }
      const q = QUALITY[eq.quality] || QUALITY.common;
      return `
        <div class="equip-slot-card q-${q.key}" style="align-items:center;text-align:center;">
          <div class="equip-slot-label">${SLOT_NAMES[slot]} · 已装备</div>
          ${renderVisualThumb('equip', eq, 48)}
          <div class="equip-name" style="color:${q.color};font-size:12px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(eq.name)}">${escapeHtml(eq.name)}</div>
          <button class="btn btn-secondary btn-sm" data-unequip="${slot}" style="margin-top:auto;">卸下</button>
        </div>
      `;
    }).join('');

    const bagList = state.equipBag.length
      ? state.equipBag.map((eq) => renderEquipCard(eq, `
          <button class="btn btn-amber btn-sm" data-equip-uid="${eq.uid}">装备</button>
          <button class="btn btn-secondary btn-sm" data-sell-eq="${eq.uid}">卖 ${getEquipSellPrice(eq)}币</button>
        `)).join('')
      : '<div class="modal-item-desc">装备库暂无闲置神兵，探索废墟、拆解重炮或墨壶炼化即可获得灵韵异纹神兵！</div>';

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
            <div style="display:flex;align-items:center;gap:10px;">
              ${renderVisualThumb('item', it, 44)}
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
            <div style="display:flex;align-items:center;gap:10px;">
              ${renderVisualThumb('elixir', e, 44)}
              <div>
                <div class="modal-item-title">${escapeHtml(e.name)} ×${cnt}</div>
                <div class="modal-item-desc">${escapeHtml(e.desc)}</div>
              </div>
            </div>
            <button class="btn btn-green btn-sm" data-use-elx="${eid}">服用</button>
          </div>
        `;
      }).join('');
    bodyHtml = elxRows || '<div class="modal-item-desc">暂无天工墨壶炼制的稀世丹药，可用金疮药散+荧光菇或饼干+纯净水炼制！</div>';
  }

  openModal('行囊与异纹神兵', tabsHtml + bodyHtml, footerHtml);

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
          ${cs.flavor ? `<div class="modal-item-desc" style="color:#e5bb5c;font-family:var(--font-serif);font-style:italic;margin:2px 0;">${escapeHtml(cs.flavor)}</div>` : ''}
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
        <div style="display:flex;align-items:center;gap:10px;">
          ${renderVisualThumb('item', it, 44)}
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
      <div class="modal-item-title" style="margin-top:6px;">行迹密卷 · 镌刻与拓印</div>
      <textarea id="json-backup-text" class="textarea-field" placeholder="点击「拓印当前行迹」生成密卷铭文，或粘贴密卷铭文后点击「还原行迹」"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" id="btn-json-export">拓印当前行迹</button>
        <button class="btn btn-purple btn-sm" id="btn-json-import">还原覆盖当前行者</button>
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

function openHelpModal() {
  openModal(
    '墨土江湖指南',
    `
      <div class="modal-list-item"><div class="modal-item-desc"><strong>移动与交互</strong>：桌面使用 WASD/方向键或点击地面寻路，E/空格键交互；手机端使用左下角四向十字键与右下角主交互键。</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>五域 21 图</strong>：点击「天下舆图」可纵览五大区域与全部 21 张无缝地图（城镇/室内/荒原/秘境洞窟）。</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>收妖与天工墨壶</strong>：战斗中将荒原妖邪血量压至 ≤40%，点击「收妖」收入墨壶；在「天工墨壶」中放入任意 2 件妖魂/物资，阴阳化生即可炼成护驾灵兽、稀世丹药与异纹神兵！</div></div>
      <div class="modal-list-item"><div class="modal-item-desc"><strong>四大流派</strong>：古武门派、现代军火、科幻墨甲、仙妖奇术 16 项主动技能随等级自动解锁。</div></div>
    `
  );
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
    sfx.playBgm?.(getBgmTrackForMap(state.mapId));
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
      renderPrologueSlide(true);
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

  // 开屏动画音效与 BGM 平滑衔接
  const splashActive = isStudioSplashActive();
  if (!state.prologueSeen) {
    openOpeningPrologue(splashActive);
  }
  if (splashActive) {
    sfx.playStudioJingle?.();
    let handedOff = false;
    const handoffPostSplashBgm = () => {
      if (handedOff) return;
      handedOff = true;
      const prologueOpen = $('opening-prologue') && !$('opening-prologue').classList.contains('hidden');
      sfx.playBgm?.(prologueOpen ? 'prologue' : getBgmTrackForMap(state.mapId));
    };
    $('btn-skip-splash')?.addEventListener('click', handoffPostSplashBgm, { once: true });
    const splashEl = $('studio-splash');
    if (splashEl) {
      const obs = new MutationObserver(() => {
        if (!isStudioSplashActive()) {
          obs.disconnect();
          handoffPostSplashBgm();
        }
      });
      obs.observe(splashEl, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    setTimeout(handoffPostSplashBgm, 5400);
  } else if (state.prologueSeen) {
    sfx.playBgm?.(getBgmTrackForMap(state.mapId));
  }
}

window.addEventListener('DOMContentLoaded', init);
