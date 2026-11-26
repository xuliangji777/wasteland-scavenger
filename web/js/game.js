import {
  QUALITY, ITEMS, MAPS, NPCS, STORY_CHAPTERS,
  COLLECTIONS, SKILLS, WEATHERS, ENDINGS,
  DAILY_TASK_TPL, WEEKLY_TASK_TPL, TEAM_TASK_TPL
} from './data.js';
import { sfx } from './audio.js';
import { fx, spawnFloatText, triggerScreenShake } from './fx.js';
import { storage, STORAGE_CONFIG } from './storage.js';

const RANK_KEY = 'wasteland_scavenger_rank_v2';
const TEAM_KEY = 'wasteland_scavenger_team_v2';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function weekStr() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function generateRegionWeathers() {
  const map = {};
  MAPS.forEach(m => {
    if (m.id === 0) map[m.id] = 0; // 城郊默认晴天起步
    else if (m.id === 3) map[m.id] = Math.random() < 0.5 ? 4 : 0; // 断桥多风沙
    else if (m.id === 6 || m.id === 7) map[m.id] = Math.random() < 0.55 ? 1 : 2; // 沼泽/避难所多辐射尘/酸雨
    else map[m.id] = Math.floor(Math.random() * WEATHERS.length);
  });
  return map;
}

function createInitialState() {
  return {
    gold: 80,
    debt: 0,
    reputation: 0,
    day: 1,
    tickCount: 0,

    bagMax: 10,
    bagItems: [],

    energy: 100,
    energyMax: 100,
    food: 100,
    foodMax: 100,
    radShield: 0,

    mapId: 0,
    unlockedMaps: [0],
    warnLevel: 0,
    isChasing: false,
    tideTime: 0,

    regionWeathers: generateRegionWeathers(),
    garbageList: [],
    hasHiddenEntrance: false,

    bagPrice: 150,
    gear: {
      tool: false,
      flash: false,
      gloves: false,
      mask: false,
      geiger: false,
      jammer: false
    },

    skillPoint: 1,
    skillLevels: [0, 0, 0, 0, 0, 0],

    storyItems: [],
    collectionIds: [],

    totalPick: 0,
    totalGold: 0,
    totalDis: 0,
    triggeredEndings: [],

    dailyTasks: DAILY_TASK_TPL.map(t => ({ ...t, progress: 0, done: false })),
    weeklyTask: { ...WEEKLY_TASK_TPL, progress: 0, done: false },
    lastDailyDate: todayStr(),
    lastWeeklyDate: weekStr(),

    logs: []
  };
}

class WastelandGame {
  constructor() {
    this.currentUser = storage.getCurrentUser();
    this.state = createInitialState();
    this.rankList = [];
    this.teamTask = { ...TEAM_TASK_TPL, date: todayStr(), progress: 0, claimed: false };
    this._statusTimer = null;
    this._tideTimer = null;
    this._chaseTimer = null;
    this._uid = 1;
  }

  init() {
    fx.init();
    this.loadGame();
    this.initTasksAndTeam();
    this.bindStaticEvents();
    if (this.state.garbageList.length === 0) {
      this.refreshGarbage(false);
    }
    fx.setWeather(this.getCurrentWeatherId());
    this.startLoops();
    if (this.state.logs.length === 0) {
      this.addLog('欢迎来到废土战术沙盘，点击地图节点即可穿梭各地拾荒！', 'story');
    }
    this.renderAll();
  }

  getCurrentWeatherId() {
    return this.state.regionWeathers?.[this.state.mapId] ?? 0;
  }

  // ==================== 存档与读档 ====================
  loadGame() {
    try {
      this.currentUser = storage.getCurrentUser();
      const parsed = storage.loadSave(this.currentUser);
      const base = createInitialState();
      if (parsed) {
        this.state = {
          ...base,
          ...parsed,
          gear: { ...base.gear, ...(parsed.gear || {}) },
          regionWeathers: { ...base.regionWeathers, ...(parsed.regionWeathers || {}) }
        };
      } else {
        this.state = base;
      }
      const rankRaw = localStorage.getItem(RANK_KEY);
      if (rankRaw) this.rankList = JSON.parse(rankRaw);
    } catch (e) {
      console.warn('读取存档失败，使用初始状态', e);
    }
  }

  saveGame() {
    try {
      storage.writeSave(this.currentUser, this.state);
    } catch (e) {
      console.warn('保存失败', e);
    }
  }

  initTasksAndTeam() {
    const today = todayStr();
    const week = weekStr();
    if (this.state.lastDailyDate !== today) {
      this.state.dailyTasks = DAILY_TASK_TPL.map(t => ({ ...t, progress: 0, done: false }));
      this.state.lastDailyDate = today;
    }
    if (this.state.lastWeeklyDate !== week) {
      this.state.weeklyTask = { ...WEEKLY_TASK_TPL, progress: 0, done: false };
      this.state.lastWeeklyDate = week;
    }
    try {
      const savedTeam = JSON.parse(localStorage.getItem(TEAM_KEY) || 'null');
      if (!savedTeam || savedTeam.date !== today) {
        this.teamTask = { ...TEAM_TASK_TPL, date: today, progress: 0, claimed: false };
        localStorage.setItem(TEAM_KEY, JSON.stringify(this.teamTask));
      } else {
        this.teamTask = savedTeam;
      }
    } catch {
      this.teamTask = { ...TEAM_TASK_TPL, date: today, progress: 0, claimed: false };
    }
  }

  // ==================== 循环与分区域气象 ====================
  startLoops() {
    clearInterval(this._statusTimer);
    clearInterval(this._tideTimer);

    this._statusTimer = setInterval(() => {
      const s = this.state;
      s.tickCount += 1;
      if (s.tickCount % 20 === 0) {
        s.day += 1;
        if (s.debt > 0) {
          const interest = Math.max(10, Math.floor(s.debt * 0.2));
          s.debt += interest;
          this.addLog(`第 ${s.day} 天：黑哥高利贷计息 +${interest} 金！`, 'warn');
        } else {
          this.addLog(`第 ${s.day} 天到来，废土各地气象已刷新。`);
        }
        this.shiftAllRegionWeathers();
      }

      s.food = Math.max(0, s.food - 1);
      if (s.food <= 0) {
        s.energy = Math.max(0, Number((s.energy - 2).toFixed(1)));
      } else {
        s.energy = Math.min(s.energyMax, Number((s.energy + 1.0).toFixed(1)));
      }

      if (s.warnLevel > 0 && !s.isChasing) {
        s.warnLevel = Math.max(0, s.warnLevel - 2);
      }

      this.saveGame();
      this.renderHUD();
      this.renderHazards();
    }, 3000);

    this._tideTimer = setInterval(() => {
      const map = MAPS[this.state.mapId];
      if (!map.hasTide) return;
      if (this.state.tideTime <= 1) {
        this.triggerRadiationTide();
      } else {
        this.state.tideTime -= 1;
        if (this.state.tideTime <= 10 && this.state.gear.geiger) {
          sfx.geiger();
        }
        this.renderHazards();
      }
    }, 1000);
  }

  shiftAllRegionWeathers() {
    this.state.regionWeathers = generateRegionWeathers();
    const curW = this.getCurrentWeatherId();
    fx.setWeather(curW);
    this.renderWorldMap();
    this.renderHUD();
  }

  // ==================== 工具与概率 ====================
  getPickEnergyCost() {
    const wid = this.getCurrentWeatherId();
    const weather = WEATHERS[wid];
    let weatherMult = weather.energyCost;
    if (this.state.gear.mask && (wid === 1 || wid === 2)) {
      weatherMult = 1 + (weatherMult - 1) * 0.5;
    }
    const base = 6 * weatherMult * (this.state.gear.gloves ? 0.75 : 1);
    const skillReduce = this.state.skillLevels[0];
    return Math.max(2, Math.round(base - skillReduce));
  }

  randomByWeight(weightArr) {
    const sum = weightArr.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < weightArr.length; i++) {
      r -= weightArr[i];
      if (r <= 0) return ITEMS[i];
    }
    return ITEMS[0];
  }

  randomQuality() {
    const eagleBonus = 1 + this.state.skillLevels[1] * 0.15;
    const luckBonus = 1 + this.state.skillLevels[5] * 0.1;
    const weatherBonus = WEATHERS[this.getCurrentWeatherId()].rareBonus;
    const mult = eagleBonus * luckBonus * weatherBonus;
    const r = Math.random();

    let threshold = QUALITY.legend.rate * mult;
    if (r < threshold) return 'legend';
    threshold += QUALITY.rare.rate * mult;
    if (r < threshold) return 'rare';
    threshold += QUALITY.fine.rate * mult;
    if (r < threshold) return 'fine';
    return 'common';
  }

  createGarbageItem(map) {
    const base = this.randomByWeight(map.weight);
    const quality = (base.isStory || base.isCollection) ? 'rare' : this.randomQuality();
    const value = base.baseValue > 0 ? Math.floor(base.baseValue * QUALITY[quality].multiplier) : 0;
    this._uid += 1;
    return {
      ...base,
      quality,
      qualityText: QUALITY[quality].name,
      value,
      uid: `${Date.now()}_${this._uid}`
    };
  }

  refreshGarbage(withToast = true) {
    const map = MAPS[this.state.mapId];
    const list = [];
    for (let i = 0; i < 6; i++) {
      list.push(this.createGarbageItem(map));
    }
    const baseHidden = this.state.mapId === 2 ? 0.12 : 0.06;
    const flashBonus = this.state.gear.flash ? (this.state.mapId === 2 ? 0.18 : 0.10) : 0;
    const eagleBonus = this.state.skillLevels[1] * 0.04;
    const geigerBonus = this.state.gear.geiger ? 0.05 : 0;
    this.state.garbageList = list;
    this.state.hasHiddenEntrance = Math.random() < (baseHidden + flashBonus + eagleBonus + geigerBonus);

    if (withToast) this.toast('已搜寻新的废土堆', 'good');
    this.saveGame();
    this.renderGarbage();
    this.renderBanners();
    this.renderCornerHints();
  }

  // ==================== 核心拾取逻辑 ====================
  pickItem(index, evt) {
    const item = this.state.garbageList[index];
    if (!item) return;

    const cost = this.getPickEnergyCost();
    if (this.state.energy < cost) {
      sfx.alarm();
      return this.toast(`体力不足（需要 ${cost} 点），请使用饮料或等待恢复！`, 'warn');
    }
    if (this.state.food <= 0) {
      sfx.alarm();
      return this.toast('饥肠辘辘，请先吃点压缩饼干！', 'warn');
    }

    const isSpecialArchive = item.isStory || item.isCollection;
    if (!isSpecialArchive && this.state.bagItems.length >= this.state.bagMax) {
      sfx.alarm();
      return this.toast('背包已满！请点击地图左上角「变卖站」或拆解物资', 'warn');
    }

    this.state.energy = Math.max(0, Number((this.state.energy - cost).toFixed(1)));
    this.state.totalPick += 1;
    this.addTaskProgress('pick', 1);

    const map = MAPS[this.state.mapId];
    if (map.hasChem && Math.random() < 0.12) {
      const chemDmg = this.state.gear.gloves ? 5 : 10;
      this.state.energy = Math.max(0, Number((this.state.energy - chemDmg).toFixed(1)));
      this.toast(`☣️ 化学品溅射！额外损失 ${chemDmg} 体力`, 'warn');
      this.addLog(`在${map.name}被泄漏化学品灼伤，损失 ${chemDmg} 体力。`, 'warn');
    }

    if (map.hasWarn && !this.state.isChasing) {
      const jammerMult = this.state.gear.jammer ? 0.65 : 1;
      const gain = (7 + Math.random() * 6) * jammerMult;
      this.state.warnLevel = Math.min(100, Math.round(this.state.warnLevel + gain));
      if (this.state.warnLevel >= 100) this.startChase();
    }

    sfx.pick(item.quality);
    if (evt) {
      const rect = evt.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      fx.burst(cx, cy, QUALITY[item.quality].color, item.quality === 'legend' ? 28 : 14);
      spawnFloatText(cx, cy - 10, `+1 ${item.name}`, QUALITY[item.quality].color);
    }

    if (item.isStory) {
      if (!this.state.storyItems.includes(item.storyId)) {
        this.state.storyItems.push(item.storyId);
        const chap = STORY_CHAPTERS[item.storyId];
        this.addLog(`✨ 发现信物【${item.name}】：解锁《${chap.title}》`, 'story');
        this.showInfoModal(
          `✨ 发现同伴信物：${item.name}`,
          `<div class="npc-box">
            <div class="npc-avatar">${item.icon}</div>
            <div>
              <div class="modal-item-title">${chap.title}</div>
              <div class="npc-talk">${chap.text}</div>
            </div>
          </div>
          <p style="color:#8b98a9;font-size:12px;">信物收集进度：${this.state.storyItems.length} / 5</p>`
        );
      } else {
        this.state.gold += 80;
        this.state.totalGold += 80;
        this.toast(`重复信物【${item.name}】折算 +80 金币`);
      }
    } else if (item.isCollection) {
      if (!this.state.collectionIds.includes(item.colId)) {
        this.state.collectionIds.push(item.colId);
        const col = COLLECTIONS[item.colId];
        this.addLog(`💎 收录战前古董【${col.name}】(${col.era})`, 'legend');
        this.showInfoModal(
          `💎 发现战前古董！`,
          `<div class="npc-box">
            <div class="npc-avatar">${item.icon}</div>
            <div>
              <div class="modal-item-title">${col.name} · <small>${col.era}</small></div>
              <div class="npc-talk">${col.desc}</div>
            </div>
          </div>
          <p style="color:#fbbf24;font-size:12.5px;">已自动录入《战前古董图鉴》(${this.state.collectionIds.length} / ${COLLECTIONS.length})</p>`
        );
      } else {
        this.state.gold += 160;
        this.state.totalGold += 160;
        this.toast(`重复古董【${item.name}】转手卖出 +160 金币`);
      }
    } else {
      this.state.bagItems.push(item);
      if (item.quality === 'legend') {
        this.addLog(`🌟 欧皇降临！在${map.short}拾获传说级【${item.name}】(估值 ${item.value} 金)`, 'legend');
      } else if (item.quality === 'rare') {
        this.addLog(`💜 在${map.short}拾获稀有【${item.name}】(估值 ${item.value} 金)`, 'good');
      }
    }

    this.state.garbageList.splice(index, 1, this.createGarbageItem(map));

    if (!this.state.isChasing && Math.random() < 0.11) {
      this.triggerRandomEvent();
    }

    this.checkUnlocksAndEndings();
    this.saveGame();
    this.renderAll();
  }

  // ==================== 背包操作 ====================
  useBagItem(uid) {
    const idx = this.state.bagItems.findIndex(it => it.uid === uid);
    if (idx === -1) return;
    const item = this.state.bagItems[idx];
    if (!item.isConsumable || !item.effect) return;

    const eff = item.effect;
    if (eff.food) this.state.food = Math.min(this.state.foodMax, this.state.food + eff.food);
    if (eff.energy) this.state.energy = Math.min(this.state.energyMax, this.state.energy + eff.energy);
    if (eff.radShield) this.state.radShield += eff.radShield;
    if (eff.clearWarn) {
      this.state.warnLevel = 0;
      this.state.isChasing = false;
      clearTimeout(this._chaseTimer);
    }

    this.state.bagItems.splice(idx, 1);
    sfx.pick('fine');
    this.toast(`使用了 ${item.icon} ${item.name}`, 'good');
    this.addLog(`使用【${item.name}】恢复状态。`, 'good');
    this.saveGame();
    this.renderAll();
  }

  sellSingleItem(uid) {
    const idx = this.state.bagItems.findIndex(it => it.uid === uid);
    if (idx === -1) return;
    const item = this.state.bagItems[idx];
    this.state.bagItems.splice(idx, 1);
    this.processGoldIncome(item.value, `卖出【${item.name}】`);
    this.checkUnlocksAndEndings();
    this.saveGame();
    this.renderAll();
  }

  sellAll(bonusMultiplier = 1) {
    if (this.state.bagItems.length === 0) {
      return this.toast('背包里没有可出售的物资', 'warn');
    }
    const rawEarn = this.state.bagItems.reduce((sum, it) => sum + it.value, 0);
    const earn = Math.floor(rawEarn * bonusMultiplier);
    this.state.bagItems = [];
    this.processGoldIncome(earn, bonusMultiplier > 1 ? `溢价变卖全部物资` : `变卖全部物资`);
    this.checkUnlocksAndEndings();
    this.saveGame();
    this.renderAll();
  }

  processGoldIncome(earn, label) {
    this.state.gold += earn;
    this.state.totalGold += earn;
    this.addTaskProgress('sell', earn);

    let actual = earn;
    if (this.state.debt > 0) {
      const repay = Math.min(this.state.debt, earn);
      this.state.debt -= repay;
      this.state.gold -= repay;
      actual -= repay;
      this.addLog(`${label} +${earn} 金，自动偿还高利贷 ${repay} 金。`);
    } else {
      this.addLog(`${label}，入账 +${earn} 金币。`, 'good');
    }
    sfx.coin();
    this.toast(`💰 到账 +${actual} 金币`, 'good');
  }

  // ==================== 地图切换与气象总览 ====================
  changeMap(mapId) {
    const m = MAPS[mapId];
    if (!m) return;
    if (!this.state.unlockedMaps.includes(mapId)) {
      if (this.state.gold >= m.unlockCost) {
        this.state.unlockedMaps.push(mapId);
        sfx.ending();
        this.toast(`🗺️ 已解锁并前往【${m.name}】！`, 'legend');
      } else {
        sfx.alarm();
        return this.toast(`【${m.name}】尚未解锁，需要持有 ${m.unlockCost} 金币`, 'warn');
      }
    }

    this.state.mapId = mapId;
    this.state.warnLevel = 0;
    this.state.isChasing = false;
    clearTimeout(this._chaseTimer);
    this.state.tideTime = m.hasTide ? 60 : 0;

    const wid = this.getCurrentWeatherId();
    fx.setWeather(wid);
    this.refreshGarbage(false);
    this.addLog(`抵达【${m.name}】 · 当前气象：${WEATHERS[wid].name}`);
    this.saveGame();
    this.renderAll();
    this.switchTab('scavenge');
  }

  openWeatherOverview() {
    const body = `
      <div class="modal-item-desc">废土各区域拥有独立气象，辐射尘/强风沙/酸雨会显著提升稀有爆率！</div>
      ${MAPS.map(m => {
        const unlocked = this.state.unlockedMaps.includes(m.id);
        const wid = this.state.regionWeathers[m.id] ?? 0;
        const w = WEATHERS[wid];
        const isHere = this.state.mapId === m.id;
        return `<div class="modal-list-item ${isHere ? 'done' : ''}">
          <div>
            <div class="modal-item-title">${m.icon} ${m.name} · <span style="color:${w.color};">${w.name}</span></div>
            <div class="modal-item-desc">稀有爆率：<strong>${w.rareBonus}×</strong> · 体力消耗：<strong>${w.energyCost}×</strong></div>
          </div>
          <button class="btn ${isHere ? 'btn-secondary' : 'btn-primary'} btn-sm" ${!unlocked || isHere ? 'disabled' : ''} data-goto-map="${m.id}">
            ${isHere ? '当前位置' : unlocked ? '前往' : `🔒${m.unlockCost}金`}
          </button>
        </div>`;
      }).join('')}
    `;
    this.openModal('🌤️ 废土各地实时气象', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.querySelectorAll('[data-goto-map]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal();
        this.changeMap(Number(btn.dataset.gotoMap));
      });
    });
  }

  // ==================== 追捕与辐射潮 ====================
  startChase() {
    this.state.isChasing = true;
    this.state.warnLevel = 100;
    sfx.alarm();
    triggerScreenShake();
    this.addLog('🚨 警戒值满！掠夺者小队发起了追捕！', 'warn');
    this.renderHazards();

    clearTimeout(this._chaseTimer);
    this._chaseTimer = setTimeout(() => {
      const escapeRate = Math.min(0.9, 0.35 + this.state.skillLevels[4] * 0.15);
      if (Math.random() < escapeRate) {
        this.state.isChasing = false;
        this.state.warnLevel = 25;
        this.toast('💨 身手敏捷！成功甩掉了掠夺者！', 'good');
        this.addLog('成功甩掉掠夺者追捕，惊险脱身。', 'good');
      } else {
        const lossRatio = Math.max(0.15, 0.45 - this.state.skillLevels[4] * 0.1);
        const dropCount = Math.ceil(this.state.bagItems.length * lossRatio);
        let lostVal = 0;
        for (let i = 0; i < dropCount && this.state.bagItems.length > 0; i++) {
          lostVal += this.state.bagItems.pop().value;
        }
        this.state.isChasing = false;
        this.state.warnLevel = 0;
        sfx.alarm();
        triggerScreenShake();
        this.addLog(`被掠夺者追上！丢失 ${dropCount} 件物资（价值 ${lostVal} 金）。`, 'warn');
        this.showInfoModal(
          '🚨 被掠夺者拦住了！',
          `<p>你在撤退时被铁爪帮截住，被迫丢下 <strong>${dropCount} 件物资</strong>（总值 ${lostVal} 金）才脱身。</p>`
        );
      }
      this.saveGame();
      this.renderAll();
    }, 2200);
  }

  triggerRadiationTide() {
    this.state.tideTime = 60;
    if (this.state.radShield > 0) {
      this.state.radShield -= 1;
      this.toast('🧪 抗辐射药剂生效！完美抵御了本次辐射潮', 'good');
      this.addLog('抗辐射药剂中和了辐射潮毒素，背包物资安然无恙！', 'good');
      this.refreshGarbage(false);
      this.saveGame();
      this.renderAll();
      return;
    }

    const maskMult = this.state.gear.mask ? 0.65 : 1;
    const skillMult = Math.max(0.5, 1 - this.state.skillLevels[4] * 0.1);
    const ratio = 0.4 * maskMult * skillMult;
    const dropCount = Math.floor(this.state.bagItems.length * ratio);
    let lostVal = 0;
    for (let i = 0; i < dropCount && this.state.bagItems.length > 0; i++) {
      lostVal += this.state.bagItems.pop().value;
    }
    sfx.alarm();
    triggerScreenShake();
    this.refreshGarbage(false);
    this.addLog(`☢️ 辐射潮席卷！损失 ${dropCount} 件物资（价值 ${lostVal} 金）。`, 'warn');
    this.toast(`☢️ 辐射潮爆发！损失 ${dropCount} 件物资`, 'warn');
    this.saveGame();
    this.renderAll();
  }

  enterHidden() {
    this.state.hasHiddenEntrance = false;
    const luckRate = 0.58 + this.state.skillLevels[5] * 0.06;
    if (Math.random() < luckRate) {
      const bonus = Math.floor((240 + Math.random() * 760) * (1 + this.state.skillLevels[5] * 0.1));
      this.state.gold += bonus;
      this.state.totalGold += bonus;
      sfx.coin();
      this.addLog(`🚪 探索隐秘密室大获全胜，发现战前补给箱 +${bonus} 金！`, 'legend');
      this.showInfoModal('🏆 发现战前密室宝藏！', `<p>保险箱里的战前物资当场变卖获得 <strong style="color:#fbbf24;">+${bonus} 金币</strong>！</p>`);
    } else {
      const dmg = Math.floor(15 + Math.random() * 20);
      this.state.energy = Math.max(0, Number((this.state.energy - dmg).toFixed(1)));
      sfx.alarm();
      triggerScreenShake();
      this.addLog(`⚠️ 密室触发捕兽夹陷阱，损失 ${dmg} 点体力！`, 'warn');
      this.showInfoModal('⚠️ 密室陷阱！', `<p>刚踏入密室就触发了绊线机关，损失了 <strong style="color:#ef4444;">${dmg} 点体力</strong>。</p>`);
    }
    this.checkUnlocksAndEndings();
    this.saveGame();
    this.renderAll();
  }

  // ==================== 拆解工作台 ====================
  openDisassemble() {
    const disGarbage = this.state.garbageList.filter(it => it.dis).map(it => ({ ...it, src: 'ground' }));
    const disBag = this.state.bagItems.filter(it => it.dis).map(it => ({ ...it, src: 'bag' }));
    const allDis = [...disBag, ...disGarbage];

    const baseRate = this.state.gear.tool ? 0.75 : 0.35;
    const rate = Math.min(0.95, baseRate + this.state.skillLevels[3] * 0.1);
    const crit = 0.10 + this.state.skillLevels[5] * 0.08;
    const yieldMult = 2.2 + this.state.skillLevels[3] * 0.45;

    let body = `<div class="modal-list-item">
      <div>
        <div class="modal-item-title">工坊参数</div>
        <div class="modal-item-desc">成功率：<strong>${Math.round(rate * 100)}%</strong> · 暴击(×3)：<strong>${Math.round(crit * 100)}%</strong> · 倍率：<strong>${yieldMult.toFixed(1)}×</strong></div>
      </div>
    </div>`;

    if (allDis.length === 0) {
      body += `<div class="empty-tip">当前背包和搜寻区都没有可拆解的精密电器/机械。</div>`;
    } else {
      body += allDis.map(it => {
        const est = Math.floor(it.value * yieldMult);
        return `<div class="modal-list-item">
          <div>
            <div class="modal-item-title">${it.icon} ${it.name} <small style="color:${QUALITY[it.quality].color}">[${it.qualityText}]</small></div>
            <div class="modal-item-desc">来源：${it.src === 'bag' ? '🎒 背包' : '🔍 搜寻区'} · 预计收益：+${est} 金</div>
          </div>
          <button class="btn btn-amber btn-sm" data-dis-src="${it.src}" data-dis-uid="${it.uid}">拆解</button>
        </div>`;
      }).join('');
    }

    this.openModal('🔧 废土拆解工坊', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.querySelectorAll('[data-dis-uid]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.doDisassemble(btn.dataset.disSrc, btn.dataset.disUid, rate, crit, yieldMult);
      });
    });
  }

  doDisassemble(src, uid, rate, crit, yieldMult) {
    let item = null;
    if (src === 'bag') {
      const idx = this.state.bagItems.findIndex(it => it.uid === uid);
      if (idx === -1) return;
      item = this.state.bagItems.splice(idx, 1)[0];
    } else {
      const idx = this.state.garbageList.findIndex(it => it.uid === uid);
      if (idx === -1) return;
      item = this.state.garbageList[idx];
      this.state.garbageList.splice(idx, 1, this.createGarbageItem(MAPS[this.state.mapId]));
    }

    if (Math.random() < rate) {
      let gain = Math.floor(item.value * yieldMult);
      const isCrit = Math.random() < crit;
      if (isCrit) gain *= 3;
      this.state.gold += gain;
      this.state.totalGold += gain;
      this.state.totalDis += 1;
      this.addTaskProgress('dis', 1);
      sfx.disassemble(true, isCrit);
      this.toast(isCrit ? `💥 拆解暴击！+${gain} 金` : `🔧 拆解成功 +${gain} 金`, isCrit ? 'legend' : 'good');
      this.addLog(`拆解【${item.name}】${isCrit ? '触发3倍暴击！' : '成功'}获得 +${gain} 金。`, isCrit ? 'legend' : 'good');
    } else {
      sfx.disassemble(false, false);
      this.toast(`拆解【${item.name}】失败，零件损坏`, 'warn');
      this.addLog(`拆解【${item.name}】手滑损坏。`, 'warn');
    }

    this.checkUnlocksAndEndings();
    this.saveGame();
    this.renderAll();
    this.openDisassemble();
  }

  // ==================== 商店、技能、NPC、档案、借贷、任务、排行 ====================
  openShop() {
    const g = this.state.gear;
    const gearItems = [
      { key: 'bag',    name: '🎒 背包扩容 (+4格)', price: this.state.bagPrice, owned: false, desc: '永久扩展背包容量上限。' },
      { key: 'tool',   name: '🔧 精钢拆解钳',      price: 400,  owned: g.tool,   desc: '拆解基础成功率提升至 75%。' },
      { key: 'flash',  name: '🔦 军用强光手电',    price: 600,  owned: g.flash,  desc: '大幅提升隐秘密室发现率（地铁翻倍）。' },
      { key: 'gloves', name: '🧤 工业防护手套',    price: 500,  owned: g.gloves, desc: '拾荒体力消耗 -25%，化学品灼伤减半。' },
      { key: 'mask',   name: '😷 防毒面具',        price: 850,  owned: g.mask,   desc: '减免辐射尘/酸雨惩罚，辐射潮损失 -35%。' },
      { key: 'geiger', name: '📟 盖革计数器',      price: 950,  owned: g.geiger, desc: '辐射潮预警蜂鸣，古董与密室率 +5%。' },
      { key: 'jammer', name: '📡 干扰诱饵',        price: 1100, owned: g.jammer, desc: '掠夺者警戒值增长速度 -35%。' }
    ];
    const supplyItems = [
      { key: 'bread',  name: '🍪 压缩饼干 (+35饱食)', price: 20,  desc: '立即补充 35 点饱食度。' },
      { key: 'water',  name: '💧 纯净水 (+25体力 +12饱食)', price: 28, desc: '解渴又恢复体力。' },
      { key: 'energy', name: '⚡ 功能饮料 (+55体力)', price: 45,  desc: '立即恢复 55 点体力。' },
      { key: 'rad',    name: '🧪 抗辐射药剂 (免疫1次辐射潮)', price: 110, desc: '高危辐射区必备保命药。' }
    ];

    const renderRow = (it) => `
      <div class="modal-list-item ${it.owned ? 'done' : ''}">
        <div>
          <div class="modal-item-title">${it.name}</div>
          <div class="modal-item-desc">${it.desc}</div>
        </div>
        <button class="btn ${it.owned ? 'btn-secondary' : 'btn-amber'} btn-sm" ${it.owned ? 'disabled' : ''} data-buy="${it.key}">
          ${it.owned ? '已拥有' : `${it.price} 金`}
        </button>
      </div>`;

    const body = `
      <div class="modal-item-desc">当前废土币：<strong style="color:#fbbf24;">${this.state.gold} 金</strong></div>
      <div class="modal-item-title">🧰 永久装备与扩容</div>
      ${gearItems.map(renderRow).join('')}
      <div class="modal-item-title" style="margin-top:8px;">🥫 即时补给品</div>
      ${supplyItems.map(renderRow).join('')}
    `;
    this.openModal('🛒 营地杂货铺', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => this.buyShopItem(btn.dataset.buy));
    });
  }

  buyShopItem(key) {
    const s = this.state;
    const spend = (cost) => {
      if (s.gold < cost) { sfx.alarm(); this.toast('金币不足！', 'warn'); return false; }
      s.gold -= cost; sfx.coin(); return true;
    };
    if (key === 'bag') {
      if (!spend(s.bagPrice)) return;
      s.bagMax += 4; s.bagPrice = Math.floor(s.bagPrice * 1.65);
      this.toast('🎒 背包容量 +4 格！', 'good');
    } else if (['tool', 'flash', 'gloves', 'mask', 'geiger', 'jammer'].includes(key)) {
      const prices = { tool: 400, flash: 600, gloves: 500, mask: 850, geiger: 950, jammer: 1100 };
      if (s.gear[key] || !spend(prices[key])) return;
      s.gear[key] = true; this.toast('装备购买成功！', 'good');
    } else if (key === 'bread' && spend(20)) {
      s.food = Math.min(s.foodMax, s.food + 35); this.toast('🍪 饱食度 +35', 'good');
    } else if (key === 'water' && spend(28)) {
      s.energy = Math.min(s.energyMax, s.energy + 25); s.food = Math.min(s.foodMax, s.food + 12);
      this.toast('💧 体力 +25，饱食 +12', 'good');
    } else if (key === 'energy' && spend(45)) {
      s.energy = Math.min(s.energyMax, s.energy + 55); this.toast('⚡ 体力 +55', 'good');
    } else if (key === 'rad' && spend(110)) {
      s.radShield += 1; this.toast('🧪 获得抗辐射护盾 +1', 'good');
    }
    this.saveGame(); this.renderAll(); this.openShop();
  }

  openSkill() {
    const body = `
      <div class="modal-item-desc">当前可用技能点：<strong style="color:#38bdf8;font-size:15px;">${this.state.skillPoint}</strong></div>
      ${SKILLS.map((sk, i) => {
        const lv = this.state.skillLevels[i];
        const isMax = lv >= sk.maxLevel;
        const cost = isMax ? 0 : sk.cost[lv];
        return `<div class="modal-list-item ${isMax ? 'done' : ''}">
          <div>
            <div class="modal-item-title">${sk.icon} ${sk.name} <small style="color:#fbbf24;">Lv.${lv}/${sk.maxLevel}</small></div>
            <div class="modal-item-desc">${sk.desc}</div>
          </div>
          <button class="btn ${isMax ? 'btn-secondary' : 'btn-primary'} btn-sm" ${isMax ? 'disabled' : ''} data-skill-id="${i}">
            ${isMax ? '已满级' : `升级 (${cost}点)`}
          </button>
        </div>`;
      }).join('')}
    `;
    this.openModal('⚡ 生存技能树', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.querySelectorAll('[data-skill-id]').forEach(btn => {
      btn.addEventListener('click', () => this.levelSkill(Number(btn.dataset.skillId)));
    });
  }

  levelSkill(id) {
    const sk = SKILLS[id];
    const lv = this.state.skillLevels[id];
    if (lv >= sk.maxLevel) return;
    const cost = sk.cost[lv];
    if (this.state.skillPoint < cost) { sfx.alarm(); return this.toast('技能点不足！', 'warn'); }
    this.state.skillPoint -= cost;
    this.state.skillLevels[id] += 1;
    if (id === 2) this.state.bagMax += 3;
    sfx.pick('rare');
    this.toast(`⚡ ${sk.name} 升至 Lv.${this.state.skillLevels[id]}！`, 'good');
    this.saveGame(); this.renderAll(); this.openSkill();
  }

  openNpc() {
    const npc = NPCS[MAPS[this.state.mapId].npc];
    const body = `
      <div class="npc-box">
        <div class="npc-avatar">${npc.avatar}</div>
        <div>
          <div class="modal-item-title">${npc.name} <small style="color:#8b98a9;">· ${npc.title}</small></div>
          <div class="npc-talk">${npc.talk}</div>
        </div>
      </div>
      ${npc.options.map((opt, idx) => `
        <button class="option-btn" data-npc-opt="${idx}">
          <strong>${opt.text}</strong>
          <small>${opt.desc}</small>
        </button>
      `).join('')}
    `;
    this.openModal(`💬 拜访 · ${npc.name}`, body, `<button class="btn btn-secondary" data-close="1">离开</button>`);
    document.querySelectorAll('[data-npc-opt]').forEach(btn => {
      btn.addEventListener('click', () => this.handleNpcOption(npc.id, Number(btn.dataset.npcOpt)));
    });
  }

  handleNpcOption(npcId, idx) {
    const s = this.state;
    this.closeModal();
    if (npcId === 'laohuang') {
      if (idx === 0) this.showInfoModal('🧔 商人老黄', '<p>“阿哲当年往地铁二号线撤了，后来有人在军工厂和辐射沼泽见过他留下的信物。”</p>');
      else if (idx === 1) this.sellAll(s.reputation >= 2 ? 1.15 : 1.0);
      else if (idx === 2) {
        if (s.food < 15) return this.toast('饱食度不足 15', 'warn');
        s.food -= 15; s.reputation += 1; this.toast('营地声望 +1', 'good');
      }
    } else if (npcId === 'shaobing') {
      if (idx === 0) {
        if (s.gold < 200) return this.toast('金币不足 200', 'warn');
        s.gold -= 200; s.warnLevel = 0; sfx.coin(); this.toast('警戒清零', 'good');
      } else if (idx === 1) {
        if (s.reputation < 3) return this.toast('声望不足 3', 'warn');
        s.warnLevel = 0; s.gold += 80; this.toast('震慑成功！警戒清零 +80金', 'good');
      } else if (idx === 2) {
        if (s.food < 30) return this.toast('饱食度不足 30', 'warn');
        s.food -= 30; s.warnLevel = Math.floor(s.warnLevel * 0.5); this.toast('警戒值减半', 'good');
      }
    } else if (npcId === 'laogui') {
      if (idx === 0) {
        if (s.gold < 150) return this.toast('金币不足 150', 'warn');
        s.gold -= 150; s.hasHiddenEntrance = true; sfx.coin(); this.toast('发现隐秘密室入口！', 'legend');
      } else if (idx === 1) {
        this.showInfoModal('🔦 隧道拾荒老鬼', '<p>“有个年轻人带着块停摆的手表从这儿经过，往断桥和军工厂方向去了。”</p>');
      } else if (idx === 2) {
        s.energy = Math.min(s.energyMax, s.energy + 20); this.toast('体力 +20', 'good');
      }
    } else if (npcId === 'yinshi') {
      if (idx === 0) this.showInfoModal('🧙‍♂️ 废土隐士', '<p>“集齐 5 件信物，你就能知道东岸营地的准确坐标。”</p>');
      else if (idx === 1) {
        if (s.gold < 300) return this.toast('金币不足 300', 'warn');
        s.gold -= 300; s.radShield += 1; s.energy = Math.min(s.energyMax, s.energy + 20);
        this.toast('抗辐射护盾 +1，体力 +20', 'good');
      } else if (idx === 2) {
        if (s.food < 20) return this.toast('饱食度不足 20', 'warn');
        s.food -= 20; s.reputation += 2; this.toast('营地声望 +2', 'good');
      }
    } else if (npcId === 'xuezhe') {
      if (idx === 0) {
        if (s.gold < 400) return this.toast('金币不足 400', 'warn');
        s.gold -= 400; s.skillPoint += 1; sfx.pick('legend'); this.toast('技能点 +1', 'legend');
      } else if (idx === 1) {
        this.showInfoModal('🥼 林博士', '<p>“解锁全部 8 个区域、集齐 8 件古董、5 件信物并拾荒 500 次即可成就【废土之王】！”</p>');
      } else if (idx === 2) this.sellAll(1.25);
    }
    this.saveGame(); this.renderAll();
  }

  openStory() {
    const body = `
      <div class="modal-item-desc">已收集信物：<strong>${this.state.storyItems.length} / 5</strong></div>
      ${STORY_CHAPTERS.map(ch => {
        const unlocked = this.state.storyItems.includes(ch.id);
        return `<div class="modal-list-item ${unlocked ? 'done' : ''}" style="flex-direction:column;align-items:flex-start;">
          <div class="modal-item-title">${unlocked ? `📜 ${ch.title} (${ch.relic})` : `🔒 未解锁 (${ch.relic})`}</div>
          <div class="modal-item-desc" style="color:${unlocked ? '#e2e8f0' : '#64748b'};line-height:1.6;">
            ${unlocked ? ch.text : '在废土各处搜寻对应信物即可解锁。'}
          </div>
        </div>`;
      }).join('')}
    `;
    this.openModal('📜 剧情档案 · 寻找阿哲', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
  }

  openCollection() {
    const body = `
      <div class="modal-item-desc">已收录古董：<strong>${this.state.collectionIds.length} / ${COLLECTIONS.length}</strong></div>
      <div class="col-grid">
        ${COLLECTIONS.map(col => {
          const unlocked = this.state.collectionIds.includes(col.id);
          return `<div class="col-card ${unlocked ? 'unlocked' : 'locked'}">
            <div class="modal-item-title">${unlocked ? col.name : '❓ 未知古董'}</div>
            <div class="modal-item-desc">${unlocked ? `${col.era} · ${col.desc}` : '尚未发掘'}</div>
          </div>`;
        }).join('')}
      </div>
    `;
    this.openModal('📖 战前古董图鉴', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
  }

  openLoan() {
    const body = `
      <div class="npc-box">
        <div class="npc-avatar">🕶️</div>
        <div>
          <div class="modal-item-title">债主黑哥</div>
          <div class="npc-talk">“借 500 记 600 账，每天计息 20%，变卖物资会自动扣还。”</div>
        </div>
      </div>
      <div class="modal-list-item">
        <div>
          <div class="modal-item-title">当前负债：<span style="color:${this.state.debt > 0 ? '#ef4444' : '#4cd964'};">${this.state.debt} 金</span></div>
          <div class="modal-item-desc">持有金币：${this.state.gold}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-amber btn-sm" id="btn-borrow">借 500 金</button>
          <button class="btn btn-green btn-sm" id="btn-repay" ${this.state.debt <= 0 ? 'disabled' : ''}>还款</button>
        </div>
      </div>
    `;
    this.openModal('💰 黑哥地下钱庄', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.getElementById('btn-borrow')?.addEventListener('click', () => {
      this.state.gold += 500; this.state.debt += 600; sfx.coin();
      this.toast('到账 +500 金，负债 +600 金', 'warn');
      this.checkUnlocksAndEndings(); this.saveGame(); this.renderAll(); this.openLoan();
    });
    document.getElementById('btn-repay')?.addEventListener('click', () => {
      const repay = Math.min(this.state.debt, this.state.gold);
      if (repay <= 0) return this.toast('金币不足', 'warn');
      this.state.gold -= repay; this.state.debt -= repay; sfx.coin();
      this.toast(`还款 ${repay} 金`, 'good');
      this.saveGame(); this.renderAll(); this.openLoan();
    });
  }

  addTaskProgress(type, val) {
    this.state.dailyTasks.forEach(t => { if (t.type === type && !t.done) t.progress = Math.min(t.target, t.progress + val); });
    const wk = this.state.weeklyTask;
    if (wk.type === type && !wk.done) wk.progress = Math.min(wk.target, wk.progress + val);
  }

  openDaily() {
    const wk = this.state.weeklyTask;
    const body = `
      <div class="modal-item-title">📅 每日任务</div>
      ${this.state.dailyTasks.map(t => `
        <div class="modal-list-item ${t.done ? 'done' : ''}">
          <div>
            <div class="modal-item-title">${t.name} (${t.progress}/${t.target})</div>
            <div class="modal-item-desc">奖励：${t.reward} 金 + ${t.sp} 技能点</div>
          </div>
          ${t.done ? '<span style="color:#4cd964;font-weight:700;">✅ 已领</span>'
            : `<button class="btn btn-amber btn-sm" ${t.progress < t.target ? 'disabled' : ''} data-claim-daily="${t.id}">领取</button>`}
        </div>
      `).join('')}
      <div class="modal-item-title" style="margin-top:8px;">📆 周常任务</div>
      <div class="modal-list-item ${wk.done ? 'done' : ''}">
        <div>
          <div class="modal-item-title">${wk.name} (${wk.progress}/${wk.target})</div>
          <div class="modal-item-desc">奖励：${wk.reward} 金 + ${wk.sp} 技能点</div>
        </div>
        ${wk.done ? '<span style="color:#4cd964;font-weight:700;">✅ 已领</span>'
          : `<button class="btn btn-amber btn-sm" ${wk.progress < wk.target ? 'disabled' : ''} id="btn-claim-weekly">领取</button>`}
      </div>
    `;
    this.openModal('📅 每日与周常任务', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.querySelectorAll('[data-claim-daily]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = this.state.dailyTasks.find(x => x.id === Number(btn.dataset.claimDaily));
        if (!t || t.done || t.progress < t.target) return;
        t.done = true; this.state.gold += t.reward; this.state.totalGold += t.reward; this.state.skillPoint += t.sp;
        sfx.coin(); this.toast(`领取 +${t.reward} 金 +${t.sp} 技能点`, 'good');
        this.checkUnlocksAndEndings(); this.saveGame(); this.renderAll(); this.openDaily();
      });
    });
    document.getElementById('btn-claim-weekly')?.addEventListener('click', () => {
      if (wk.done || wk.progress < wk.target) return;
      wk.done = true; this.state.gold += wk.reward; this.state.totalGold += wk.reward; this.state.skillPoint += wk.sp;
      sfx.ending(); this.toast(`周常奖励 +${wk.reward} 金 +${wk.sp} 技能点`, 'legend');
      this.checkUnlocksAndEndings(); this.saveGame(); this.renderAll(); this.openDaily();
    });
  }

  openTeam() {
    const tt = this.teamTask;
    const pct = Math.min(100, Math.round((tt.progress / tt.target) * 100));
    const body = `
      <div class="modal-list-item" style="flex-direction:column;align-items:stretch;">
        <div class="modal-item-title" style="color:#fbbf24;">📡 ${tt.name}</div>
        <div class="modal-item-desc">${tt.desc}</div>
        <div style="margin-top:8px;font-size:12.5px;">信号校准：<strong>${tt.progress} / ${tt.target}</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="btn-team-signal" ${tt.progress >= tt.target ? 'disabled' : ''}>📶 发送求助信号 (+2)</button>
        <button class="btn btn-amber" id="btn-team-claim" ${tt.progress < tt.target || tt.claimed ? 'disabled' : ''}>
          ${tt.claimed ? '✅ 今日已领' : '🎁 领取空投'}
        </button>
      </div>
    `;
    this.openModal('🤝 每日协作悬赏', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
    document.getElementById('btn-team-signal')?.addEventListener('click', () => {
      if (tt.progress >= tt.target) return;
      tt.progress = Math.min(tt.target, tt.progress + 2);
      localStorage.setItem(TEAM_KEY, JSON.stringify(tt));
      sfx.pick('fine'); this.toast('盟友响应信号 +2', 'good'); this.openTeam();
    });
    document.getElementById('btn-team-claim')?.addEventListener('click', () => {
      if (tt.claimed || tt.progress < tt.target) return;
      tt.claimed = true; localStorage.setItem(TEAM_KEY, JSON.stringify(tt));
      const rarePool = ITEMS.filter(it => it.baseValue >= 140 && !it.isConsumable);
      const picked = rarePool[Math.floor(Math.random() * rarePool.length)];
      this._uid += 1;
      this.state.garbageList[0] = {
        ...picked, quality: 'rare', qualityText: '稀有',
        value: Math.floor(picked.baseValue * QUALITY.rare.multiplier), uid: `team_${this._uid}`
      };
      sfx.ending(); this.toast(`🎁 空投【${picked.name}】已投放至搜寻区！`, 'legend');
      this.renderGarbage(); this.openTeam();
    });
  }

  openRank() {
    const body = this.rankList.length === 0
      ? `<div class="empty-tip">暂无通关记录，达成任意结局即可载入废土殿堂！</div>`
      : this.rankList.map((r, i) => `
          <div class="modal-list-item">
            <div>
              <div class="modal-item-title">第 ${i + 1} 名 · ${r.ending}</div>
              <div class="modal-item-desc">存活 ${r.day || 1} 天 · 拾荒 ${r.picks || 0} 次</div>
            </div>
            <strong style="color:#fbbf24;">${r.gold} 金</strong>
          </div>
        `).join('');
    this.openModal('🏆 本地战绩排行榜', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);
  }

  // ==================== 随机事件 ====================
  triggerRandomEvent() {
    const s = this.state;
    const events = [
      {
        title: '🚛 补给车倾覆',
        content: '一辆战前补给车翻倒在路边，车厢里似乎有高价值电子件！',
        options: [{
          label: '趁热搜刮车厢',
          action: () => {
            const pool = ITEMS.filter(it => it.baseValue >= 140 && !it.isConsumable);
            const it = pool[Math.floor(Math.random() * pool.length)];
            this._uid += 1;
            s.garbageList[0] = { ...it, quality: 'rare', qualityText: '稀有', value: Math.floor(it.baseValue * 3.2), uid: `evt_${this._uid}` };
            this.toast(`在车厢发现稀有【${it.name}】！`, 'legend');
          }
        }]
      },
      {
        title: '🧙 神秘游商赌局',
        content: '“100 金币开一次盲盒，赢了翻几倍，输了算交学费。”',
        options: [
          {
            label: '押 100 金赌一把！',
            action: () => {
              if (s.gold < 100) return this.toast('金币不足 100', 'warn');
              s.gold -= 100;
              if (Math.random() < 0.55 + s.skillLevels[5] * 0.05) {
                const win = 260 + Math.floor(Math.random() * 440);
                s.gold += win; s.totalGold += win; sfx.coin();
                this.toast(`🎲 净赚 +${win - 100} 金币`, 'legend');
              } else this.toast('🎲 100 金打水漂', 'warn');
            }
          },
          { label: '转身离开', action: () => {} }
        ]
      },
      {
        title: '💸 遗落的战术腰包',
        content: '你踢到一个塞着 320 废土币和营地徽章的腰包。',
        options: [
          { label: '装进自己口袋 (+320金)', action: () => { s.gold += 320; s.totalGold += 320; sfx.coin(); this.toast('+320 金'); } },
          { label: '上交失物招领 (+2声望 +80金)', action: () => { s.reputation += 2; s.gold += 80; sfx.coin(); this.toast('声望 +2，获酬 +80 金', 'good'); } }
        ]
      },
      {
        title: '🔥 旅人篝火',
        content: '友善的拾荒者邀请你烤火歇脚。',
        options: [{
          label: '烤火歇息 (+25体力，警戒-15%)',
          action: () => { s.energy = Math.min(s.energyMax, s.energy + 25); s.warnLevel = Math.max(0, s.warnLevel - 15); this.toast('体力 +25', 'good'); }
        }]
      }
    ];
    const evt = events[Math.floor(Math.random() * events.length)];
    const body = `<p style="line-height:1.65;color:#e2e8f0;">${evt.content}</p>${evt.options.map((o, i) => `<button class="option-btn" data-evt-idx="${i}"><strong>${o.label}</strong></button>`).join('')}`;
    this.openModal(evt.title, body, '');
    document.querySelectorAll('[data-evt-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = evt.options[Number(btn.dataset.evtIdx)];
        this.closeModal(); opt.action(); this.checkUnlocksAndEndings(); this.saveGame(); this.renderAll();
      });
    });
  }

  // ==================== 解锁与结局 ====================
  checkUnlocksAndEndings() {
    const s = this.state;
    MAPS.forEach(m => {
      if (!s.unlockedMaps.includes(m.id) && s.gold >= m.unlockCost) {
        s.unlockedMaps.push(m.id);
        sfx.ending();
        this.addLog(`🗺️ 解锁新区域：【${m.name}】！`, 'legend');
        this.toast(`🗺️ 新区域【${m.name}】已开放！`, 'legend');
      }
    });

    const allCol = s.collectionIds.length >= COLLECTIONS.length;
    const allStory = s.storyItems.length >= 5;
    const allMap = s.unlockedMaps.length >= MAPS.length;

    if (allCol && allStory && allMap && s.totalPick >= 500 && !s.triggeredEndings.includes('king')) return this.triggerEnding('king');
    if (allStory && !s.triggeredEndings.includes('friend')) return this.triggerEnding('friend');
    if (allCol && !s.triggeredEndings.includes('collector')) return this.triggerEnding('collector');
    if (s.gold >= 15000 && !s.triggeredEndings.includes('normal')) return this.triggerEnding('normal');
  }

  getEndingProgress() {
    const s = this.state;
    let p = 0;
    p += Math.min(25, (s.gold / 15000) * 25);
    p += Math.min(25, (s.storyItems.length / 5) * 25);
    p += Math.min(25, (s.collectionIds.length / COLLECTIONS.length) * 25);
    p += Math.min(25, (s.unlockedMaps.length / MAPS.length) * 25);
    return Math.min(100, Math.floor(p));
  }

  triggerEnding(type) {
    const end = ENDINGS[type];
    if (!end) return;
    if (!this.state.triggeredEndings.includes(type)) this.state.triggeredEndings.push(type);
    this.rankList.push({ gold: this.state.gold, ending: end.title, day: this.state.day, picks: this.state.totalPick, time: Date.now() });
    this.rankList.sort((a, b) => b.gold - a.gold);
    this.rankList = this.rankList.slice(0, 10);
    localStorage.setItem(RANK_KEY, JSON.stringify(this.rankList));
    sfx.ending(); this.saveGame();
    const body = `<div style="text-align:center;padding:8px 4px;"><div class="brand-badge" style="display:inline-block;margin-bottom:10px;">${end.badge}</div><h2 style="font-size:24px;color:#fbbf24;margin-bottom:12px;">${end.title}</h2><p style="line-height:1.8;color:#e2e8f0;margin-bottom:16px;">${end.content}</p></div>`;
    const footer = `<button class="btn btn-secondary" id="btn-continue-play">继续探索</button><button class="btn btn-amber" id="btn-ending-restart">开启新周目</button>`;
    this.openModal('🏆 废土传奇 · 结局达成', body, footer);
    document.getElementById('btn-continue-play')?.addEventListener('click', () => this.closeModal());
    document.getElementById('btn-ending-restart')?.addEventListener('click', () => this.restartGame(true));
  }

  restartGame(skipConfirm = false) {
    if (!skipConfirm && !window.confirm('确定要清空当前账号进度并重新开始吗？')) return;
    clearInterval(this._statusTimer); clearInterval(this._tideTimer); clearTimeout(this._chaseTimer);
    storage.clearSave(this.currentUser);
    this.state = createInitialState();
    this.closeModal(); this.refreshGarbage(false); fx.setWeather(0); this.startLoops();
    this.addLog('新周目已开启！', 'story'); this.renderAll(); this.toast('游戏已重置', 'good');
  }

  // ==================== 本地账号登录与存档导出/导入 ====================
  openAccountModal() {
    const accounts = storage.getAccounts();
    const body = `
      <div class="modal-list-item">
        <div>
          <div class="modal-item-title">当前幸存者：<strong style="color:#38bdf8;">${this.currentUser}</strong></div>
          <div class="modal-item-desc">存储模式：<strong>${STORAGE_CONFIG.mode === 'local' ? '本地浏览器存档 (已预留线上接口)' : '线上云端同步'}</strong> · 预留端口：<code>${STORAGE_CONFIG.apiBaseUrl}</code></div>
        </div>
        <button class="btn btn-green btn-sm" id="btn-manual-save">💾 立即保存</button>
      </div>

      <div class="modal-item-title" style="margin-top:4px;">👤 登录 / 新建本地幸存者账号</div>
      <div style="display:flex;gap:8px;">
        <input id="inp-username" class="input-field" placeholder="输入幸存者代号（如：阿强）" maxlength="16" />
        <button class="btn btn-primary" id="btn-login-switch" style="white-space:nowrap;">登录 / 创建</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${accounts.map(a => `
          <button class="btn btn-sm ${a.username === this.currentUser ? 'btn-amber' : 'btn-secondary'}" data-switch-user="${a.username}">
            ${a.username === this.currentUser ? '● ' : ''}${a.username}
          </button>
        `).join('')}
      </div>

      <div class="modal-item-title" style="margin-top:6px;">📦 存档备份与迁移（换设备防丢档）</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="btn-export-copy">📋 复制存档 JSON</button>
        <button class="btn btn-secondary btn-sm" id="btn-export-file">⬇️ 下载 .json 文件</button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
          ⬆️ 上传 .json 恢复
          <input type="file" id="inp-import-file" accept=".json,application/json" style="display:none;" />
        </label>
      </div>
      <textarea id="txt-import-save" class="textarea-field" placeholder="或者将导出的存档 JSON 粘贴到此处，点击下方导入恢复..."></textarea>
      <button class="btn btn-amber btn-sm" id="btn-import-paste" style="align-self:flex-start;">📥 从文本框导入存档</button>
    `;

    this.openModal('👤 幸存者账号与存档管理', body, `<button class="btn btn-secondary" data-close="1">关闭</button>`);

    document.getElementById('btn-manual-save')?.addEventListener('click', () => {
      this.saveGame();
      sfx.pick('fine');
      this.toast(`已保存【${this.currentUser}】的进度`, 'good');
    });

    document.getElementById('btn-login-switch')?.addEventListener('click', () => {
      const name = document.getElementById('inp-username')?.value || '';
      this.switchAccount(name);
    });

    document.querySelectorAll('[data-switch-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.switchUser;
        if (target !== this.currentUser) this.switchAccount(target);
      });
    });

    document.getElementById('btn-export-copy')?.addEventListener('click', async () => {
      const jsonStr = JSON.stringify(this.state);
      try {
        await navigator.clipboard.writeText(jsonStr);
        this.toast('📋 存档已复制到剪贴板！', 'good');
      } catch {
        document.getElementById('txt-import-save').value = jsonStr;
        this.toast('已填入下方文本框，请手动全选复制');
      }
    });

    document.getElementById('btn-export-file')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `末世拾荒_${this.currentUser}_第${this.state.day}天.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast('⬇️ 存档文件已下载', 'good');
    });

    document.getElementById('inp-import-file')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => this.importSaveString(String(reader.result || ''));
      reader.readAsText(file);
    });

    document.getElementById('btn-import-paste')?.addEventListener('click', () => {
      const raw = document.getElementById('txt-import-save')?.value || '';
      this.importSaveString(raw);
    });
  }

  switchAccount(username) {
    try {
      this.saveGame();
      const res = storage.loginOrCreate(username);
      this.currentUser = res.username;
      this.loadGame();
      if (this.state.garbageList.length === 0) this.refreshGarbage(false);
      fx.setWeather(this.getCurrentWeatherId());
      this.renderAll();
      this.openAccountModal();
      this.toast(res.isNew ? `✨ 已创建并登录新账号【${res.username}】` : `👤 已切换至【${res.username}】`, 'good');
    } catch (err) {
      this.toast(err.message || '切换失败', 'warn');
    }
  }

  importSaveString(raw) {
    try {
      const parsed = JSON.parse(raw.trim());
      if (typeof parsed.gold !== 'number' || !Array.isArray(parsed.unlockedMaps)) {
        throw new Error('存档格式不正确');
      }
      const base = createInitialState();
      this.state = {
        ...base,
        ...parsed,
        gear: { ...base.gear, ...(parsed.gear || {}) },
        regionWeathers: { ...base.regionWeathers, ...(parsed.regionWeathers || {}) }
      };
      this.saveGame();
      fx.setWeather(this.getCurrentWeatherId());
      this.renderAll();
      this.closeModal();
      sfx.ending();
      this.toast('📥 存档恢复成功！', 'legend');
    } catch (e) {
      sfx.alarm();
      this.toast(`导入失败：${e.message || '无效的 JSON'}`, 'warn');
    }
  }

  // ==================== 渲染全景地图与界面 ====================
  renderAll() {
    this.renderHUD();
    this.renderWorldMap();
    this.renderSceneHeader();
    this.renderHazards();
    this.renderBanners();
    this.renderGarbage();
    this.renderCornerHints();
    this.renderGear();
    this.renderBag();
    this.renderLogs();
  }

  renderHUD() {
    const s = this.state;
    const weather = WEATHERS[this.getCurrentWeatherId()];
    const userEl = document.getElementById('hud-username');
    if (userEl) userEl.textContent = this.currentUser;
    document.getElementById('day-badge').textContent = `第 ${s.day} 天`;
    document.getElementById('weather-badge').textContent = weather.name;
    document.getElementById('weather-badge').title = weather.desc;

    document.getElementById('hud-gold').textContent = s.gold;
    document.getElementById('hud-debt').textContent = s.debt;
    document.getElementById('hud-debt-wrap').className = s.debt > 0 ? 'stat-sub has-debt' : 'stat-sub';

    document.getElementById('hud-bag').textContent = s.bagItems.length;
    document.getElementById('hud-bag-max').textContent = s.bagMax;
    document.getElementById('bar-bag').style.width = `${Math.min(100, (s.bagItems.length / s.bagMax) * 100)}%`;

    document.getElementById('hud-energy').textContent = Math.floor(s.energy);
    document.getElementById('hud-energy-max').textContent = s.energyMax;
    document.getElementById('bar-energy').style.width = `${Math.min(100, (s.energy / s.energyMax) * 100)}%`;

    document.getElementById('hud-food').textContent = s.food;
    document.getElementById('hud-food-max').textContent = s.foodMax;
    document.getElementById('bar-food').style.width = `${Math.min(100, (s.food / s.foodMax) * 100)}%`;

    document.getElementById('hud-quest').textContent =
      s.storyItems.length >= 5
        ? '已集齐 5 件信物！寻找同伴「阿哲」的使命已达成'
        : `在废土中寻找失散同伴「阿哲」的线索 (${s.storyItems.length}/5)`;

    const pct = this.getEndingProgress();
    document.getElementById('hud-ending-pct').textContent = `${pct}%`;
    document.getElementById('bar-ending').style.width = `${pct}%`;
    document.getElementById('pick-cost-hint').textContent = `⚡ -${this.getPickEnergyCost()} / 次`;
  }

  renderWorldMap() {
    const s = this.state;
    const routesLayer = document.getElementById('map-routes-layer');
    const nodesLayer = document.getElementById('map-nodes-layer');
    if (!routesLayer || !nodesLayer) return;

    // 绘制区域连接航线 (SVG viewBox: 1000 x 520)
    const drawn = new Set();
    let linesHtml = '';
    MAPS.forEach(m => {
      m.links.forEach(targetId => {
        const key = m.id < targetId ? `${m.id}-${targetId}` : `${targetId}-${m.id}`;
        if (drawn.has(key)) return;
        drawn.add(key);
        const t = MAPS[targetId];
        const bothUnlocked = s.unlockedMaps.includes(m.id) && s.unlockedMaps.includes(t.id);
        const isCurrentEdge = s.mapId === m.id || s.mapId === t.id;
        const x1 = m.x * 10, y1 = m.y * 5.2;
        const x2 = t.x * 10, y2 = t.y * 5.2;
        const stroke = isCurrentEdge && bothUnlocked
          ? 'rgba(251, 191, 36, 0.72)'
          : bothUnlocked
            ? 'rgba(56, 189, 248, 0.42)'
            : 'rgba(148, 163, 184, 0.16)';
        linesHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${isCurrentEdge && bothUnlocked ? 3 : 2}" stroke-dasharray="${bothUnlocked ? 'none' : '6 6'}" />`;
      });
    });
    routesLayer.innerHTML = linesHtml;

    // 绘制 8 个区域节点（附带各区域独立天气气泡）
    nodesLayer.innerHTML = MAPS.map(m => {
      const unlocked = s.unlockedMaps.includes(m.id);
      const active = s.mapId === m.id;
      const wid = s.regionWeathers[m.id] ?? 0;
      const w = WEATHERS[wid];
      return `
        <button class="map-node ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}"
                style="left:${m.x}%;top:${m.y}%;"
                data-map-id="${m.id}"
                title="${m.name} | 天气：${w.name} (${w.desc})">
          <div class="node-disc">
            <span>${m.icon}</span>
            <span class="node-weather" style="color:${w.color};">${w.short}</span>
          </div>
          <span class="node-label">${m.short}</span>
          ${unlocked ? '' : `<span class="node-cost">🔒 ${m.unlockCost}金</span>`}
        </button>
      `;
    }).join('');

    nodesLayer.querySelectorAll('[data-map-id]').forEach(btn => {
      btn.addEventListener('click', () => this.changeMap(Number(btn.dataset.mapId)));
    });
  }

  renderSceneHeader() {
    const cur = MAPS[this.state.mapId];
    document.getElementById('scene-icon').textContent = cur.icon;
    document.getElementById('map-title').textContent = cur.name;
    document.getElementById('map-desc').textContent = cur.desc;

    const tags = [];
    if (!cur.hasWarn && !cur.hasTide && !cur.hasChem) {
      tags.push('<span class="hazard-tag safe">✅ 安全区</span>');
    } else {
      if (cur.hasWarn) tags.push('<span class="hazard-tag">🚨 掠夺者警戒</span>');
      if (cur.hasChem) tags.push('<span class="hazard-tag">☣️ 化学品灼伤</span>');
      if (cur.hasTide) tags.push('<span class="hazard-tag">☢️ 60s 辐射潮</span>');
    }
    document.getElementById('map-hazards').innerHTML = tags.join('');
    document.getElementById('scavenge-scene').className = `card scavenge-card theme-${cur.theme}`;
  }

  renderHazards() {
    const map = MAPS[this.state.mapId];
    const meters = document.getElementById('hazard-meters');
    const warnBox = document.getElementById('warn-meter');
    const tideBox = document.getElementById('tide-meter');
    const vignette = document.getElementById('alert-vignette');
    const chaseBanner = document.getElementById('chase-banner');

    meters.classList.toggle('hidden', !map.hasWarn && !map.hasTide);
    warnBox.classList.toggle('hidden', !map.hasWarn);
    tideBox.classList.toggle('hidden', !map.hasTide);

    if (map.hasWarn) {
      document.getElementById('hud-warn').textContent = `${this.state.warnLevel}%`;
      document.getElementById('bar-warn').style.width = `${this.state.warnLevel}%`;
    }
    if (map.hasTide) {
      document.getElementById('hud-tide').textContent = `${this.state.tideTime}s`;
      document.getElementById('bar-tide').style.width = `${(this.state.tideTime / 60) * 100}%`;
    }

    chaseBanner.classList.toggle('hidden', !this.state.isChasing);
    if (this.state.isChasing) vignette.className = 'alert-vignette';
    else if (map.hasTide && this.state.tideTime <= 10) vignette.className = 'alert-vignette tide-alert';
    else vignette.className = 'alert-vignette hidden';
  }

  renderBanners() {
    document.getElementById('btn-hidden-entrance').classList.toggle('hidden', !this.state.hasHiddenEntrance);
  }

  renderGarbage() {
    const grid = document.getElementById('garbage-grid');
    grid.innerHTML = this.state.garbageList.map((it, idx) => {
      let specialTag = '';
      if (it.isStory) specialTag = '<span class="gar-special-tag">信物</span>';
      else if (it.isCollection) specialTag = '<span class="gar-special-tag">古董</span>';
      else if (it.isConsumable) specialTag = '<span class="gar-special-tag">补给</span>';
      else if (it.dis) specialTag = '<span class="gar-special-tag">可拆解</span>';

      return `
        <div class="gar-card quality-${it.quality}" data-pick-idx="${idx}" title="${it.desc}">
          ${specialTag}
          <span class="gar-qtag">${it.qualityText}</span>
          <div class="gar-icon">${it.icon}</div>
          <div class="gar-name">${it.name}</div>
          <div class="gar-meta">${it.value > 0 ? `💰 ${it.value} 金` : '✨ 剧情/收藏'}</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-pick-idx]').forEach(card => {
      card.addEventListener('click', (e) => this.pickItem(Number(card.dataset.pickIdx), e));
    });
  }

  renderCornerHints() {
    const s = this.state;
    const bagVal = s.bagItems.reduce((sum, it) => sum + it.value, 0);
    const disCount = s.bagItems.filter(it => it.dis).length + s.garbageList.filter(it => it.dis).length;
    const done = s.dailyTasks.filter(t => t.done).length;

    document.getElementById('sell-preview-val').textContent = `+${bagVal} 金`;
    document.getElementById('dis-count-hint').textContent = `${disCount} 可拆`;
    document.getElementById('sp-badge').textContent = `点数: ${s.skillPoint}`;
    document.getElementById('hud-daily-done').textContent = `${done}/3`;
    document.getElementById('npc-name-hint').textContent = NPCS[MAPS[s.mapId].npc].name;
    document.getElementById('story-count-hint').textContent = `${s.storyItems.length}/5 信物`;
    document.getElementById('col-count-hint').textContent = `${s.collectionIds.length}/${COLLECTIONS.length} 收录`;
  }

  renderGear() {
    const s = this.state;
    document.getElementById('rep-badge').textContent = `声望: ${s.reputation}`;
    const list = [
      { icon: '🔧', label: '拆解钳',   owned: s.gear.tool },
      { icon: '🔦', label: '强光手电', owned: s.gear.flash },
      { icon: '🧤', label: '防护手套', owned: s.gear.gloves },
      { icon: '😷', label: '防毒面具', owned: s.gear.mask },
      { icon: '📟', label: '盖革计',   owned: s.gear.geiger },
      { icon: '📡', label: '干扰诱饵', owned: s.gear.jammer }
    ];
    let html = list.map(g => `<div class="gear-chip ${g.owned ? 'owned' : ''}">${g.icon} ${g.label}${g.owned ? ' ✓' : ''}</div>`).join('');
    if (s.radShield > 0) html += `<div class="gear-chip owned" style="grid-column:span 2;">🧪 抗辐射护盾：${s.radShield} 层</div>`;
    document.getElementById('gear-list').innerHTML = html;
  }

  renderBag() {
    const s = this.state;
    const totalVal = s.bagItems.reduce((sum, it) => sum + it.value, 0);
    document.getElementById('bag-value-hint').textContent = `总估值: ${totalVal} 金`;
    const listEl = document.getElementById('bag-list');
    if (s.bagItems.length === 0) {
      listEl.innerHTML = `<div class="empty-tip">背包空空如也，点击下方物资开始拾荒！</div>`;
      return;
    }
    listEl.innerHTML = s.bagItems.map(it => `
      <div class="bag-row">
        <div class="bag-row-info">
          <span>${it.icon}</span>
          <span class="bag-row-name" style="color:${QUALITY[it.quality].color};">${it.name}</span>
          <small style="color:#8b98a9;">${it.value}金</small>
        </div>
        <div class="bag-row-actions">
          ${it.isConsumable ? `<button class="btn btn-green btn-sm" data-use-uid="${it.uid}">使用</button>` : ''}
          <button class="btn btn-secondary btn-sm" data-sell-uid="${it.uid}">卖</button>
        </div>
      </div>
    `).join('');
    listEl.querySelectorAll('[data-use-uid]').forEach(btn => btn.addEventListener('click', () => this.useBagItem(btn.dataset.useUid)));
    listEl.querySelectorAll('[data-sell-uid]').forEach(btn => btn.addEventListener('click', () => this.sellSingleItem(btn.dataset.sellUid)));
  }

  addLog(msg, type = 'normal') {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    this.state.logs.unshift({ time: t, msg, type });
    if (this.state.logs.length > 40) this.state.logs.pop();
    this.renderLogs();
  }

  renderLogs() {
    const el = document.getElementById('log-list');
    if (el) el.innerHTML = this.state.logs.map(l => `<div class="log-entry ${l.type}"><span class="log-time">${l.time}</span>${l.msg}</div>`).join('');
  }

  toast(msg, type = 'normal') {
    const box = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  openModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    const footerEl = document.getElementById('modal-footer');
    footerEl.innerHTML = footerHtml;
    footerEl.classList.toggle('hidden', !footerHtml);
    document.getElementById('modal-backdrop').classList.remove('hidden');
    footerEl.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => this.closeModal()));
  }

  showInfoModal(title, bodyHtml) {
    this.openModal(title, bodyHtml, `<button class="btn btn-primary" data-close="1">知道了</button>`);
  }

  closeModal() {
    document.getElementById('modal-backdrop').classList.add('hidden');
  }

  openHelp() {
    const body = `
      <div class="modal-list-item" style="flex-direction:column;align-items:flex-start;">
        <div class="modal-item-title">🗺️ 全景沙盘与独立气象</div>
        <div class="modal-item-desc" style="color:#cbd5e1;">8 张相连的废土区域各有专属特产与独立天气！观察节点右上角的天气图标（如 ☢️辐射尘、🌪️强风沙），趁高爆率天气前往搜刮！</div>
      </div>
      <div class="modal-list-item" style="flex-direction:column;align-items:flex-start;">
        <div class="modal-item-title">🏆 四大结局路线</div>
        <div class="modal-item-desc" style="color:#cbd5e1;">1. 庇护之地（15,000金） · 2. 同伴重逢（5件信物） · 3. 末世收藏家（8件古董） · 4. 废土之王（全地图+全古董+全信物+500次拾荒）</div>
      </div>
    `;
    this.openModal('❔ 废土生存指南', body, `<button class="btn btn-primary" data-close="1">开始探索</button>`);
  }

  bindStaticEvents() {
    document.getElementById('btn-account').addEventListener('click', () => this.openAccountModal());
    document.getElementById('btn-refresh').addEventListener('click', () => this.refreshGarbage(true));
    document.getElementById('btn-weather-refresh').addEventListener('click', () => this.openWeatherOverview());
    document.getElementById('btn-hidden-entrance').addEventListener('click', () => this.enterHidden());
    document.getElementById('btn-sound').addEventListener('click', (e) => {
      const muted = sfx.toggleMute();
      e.currentTarget.textContent = muted ? '🔇' : '🔊';
      this.toast(muted ? '音效已静音' : '音效已开启');
    });
    document.getElementById('btn-help').addEventListener('click', () => this.openHelp());
    document.getElementById('btn-reset').addEventListener('click', () => this.restartGame(false));
    document.getElementById('btn-clear-log').addEventListener('click', () => { this.state.logs = []; this.renderLogs(); });
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'modal-backdrop') this.closeModal(); });
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.action;
        if (typeof this[act] === 'function') this[act]();
      });
    });

    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `tab-${tabName}`);
    });
  }
}

const game = new WastelandGame();
window.__GAME__ = game;
window.addEventListener('DOMContentLoaded', () => game.init());
