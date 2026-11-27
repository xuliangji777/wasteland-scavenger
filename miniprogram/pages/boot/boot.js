// 《墨土拾荒录》启动页：100% 实底 #050709 老年饼工作室 4.5s 开屏 → 严格顺序四幕古龙风序章
const PROLOGUE_SEEN_KEY = 'motu_prologue_seen';
const SPLASH_DURATION_MS = 4500;
const WORLD_PAGE_URL = '/pkg_game/pages/world/world';

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

Page({
  data: {
    phase: 'splash', // 'splash' | 'prologue'
    splashFading: false,
    prologueFading: false,
    slides: PROLOGUE_SLIDES,
    slideIndex: 0,
    currentSlide: PROLOGUE_SLIDES[0]
  },

  _splashTimer: null,
  _transitionTimer: null,
  _enteredWorld: false,

  onLoad() {
    this._startSplashTimer();
  },

  onUnload() {
    this._clearTimers();
  },

  _clearTimers() {
    if (this._splashTimer) {
      clearTimeout(this._splashTimer);
      this._splashTimer = null;
    }
    if (this._transitionTimer) {
      clearTimeout(this._transitionTimer);
      this._transitionTimer = null;
    }
  },

  _startSplashTimer() {
    this._clearTimers();
    this._splashTimer = setTimeout(() => {
      this._finishSplash();
    }, SPLASH_DURATION_MS);
  },

  onSkipSplash() {
    this._vibrateLight();
    this._finishSplash();
  },

  _finishSplash() {
    if (this.data.phase !== 'splash' || this.data.splashFading) return;
    this._clearTimers();
    this.setData({ splashFading: true });

    this._transitionTimer = setTimeout(() => {
      let seen = false;
      try {
        seen = Boolean(wx.getStorageSync(PROLOGUE_SEEN_KEY));
      } catch (_) {
        seen = false;
      }

      if (seen) {
        this._enterWorld();
      } else {
        this.setData({
          phase: 'prologue',
          splashFading: false,
          slideIndex: 0,
          currentSlide: PROLOGUE_SLIDES[0]
        });
      }
    }, 420);
  },

  onCardTap() {
    // 阻止点击卡片空白区域误触外层，保持按钮控制清晰
  },

  onNextSlide() {
    if (this.data.phase !== 'prologue' || this.data.prologueFading) return;
    this._vibrateLight();
    const nextIdx = this.data.slideIndex + 1;
    if (nextIdx < PROLOGUE_SLIDES.length) {
      this.setData({
        slideIndex: nextIdx,
        currentSlide: PROLOGUE_SLIDES[nextIdx]
      });
    } else {
      this._completePrologue();
    }
  },

  onSkipPrologue() {
    if (this.data.phase !== 'prologue' || this.data.prologueFading) return;
    this._vibrateLight();
    this._completePrologue();
  },

  _completePrologue() {
    try {
      wx.setStorageSync(PROLOGUE_SEEN_KEY, true);
    } catch (_) {}
    this.setData({ prologueFading: true });
    this._clearTimers();
    this._transitionTimer = setTimeout(() => {
      this._enterWorld();
    }, 360);
  },

  _enterWorld() {
    if (this._enteredWorld) return;
    this._enteredWorld = true;
    this._clearTimers();
    wx.redirectTo({
      url: WORLD_PAGE_URL,
      fail() {
        wx.reLaunch({ url: WORLD_PAGE_URL });
      }
    });
  },

  _vibrateLight() {
    try {
      if (typeof wx !== 'undefined' && typeof wx.vibrateShort === 'function') {
        wx.vibrateShort({ type: 'light' });
      }
    } catch (_) {}
  }
});
