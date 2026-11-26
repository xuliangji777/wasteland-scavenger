// ==================== Web Audio 合成音效 & 国风废土程序化 BGM 引擎 ====================

// 常用音高频率表 (Hz)
const NOTE = {
  D2: 73.42,  E2: 82.41,  F2: 87.31,  G2: 98.00,  A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51
};

const AUDIO_SETTINGS_KEY = 'motu_audio_settings_v1';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // 独立音频设置（持久化至 localStorage）
    this.settings = this._loadSettings();

    // 总线节点
    this.masterGain = null;
    this.sfxMaster = null;
    this.bgmMaster = null;
    this.reverbSend = null;
    this.noiseBuffer = null;

    // BGM 状态
    this.currentTrack = 'none';
    this.pendingTrack = null;
    this.pendingJingle = false;
    this.activeSession = null;

    // 自动播放解锁监听
    this._unlockBound = false;
    this._onUserGesture = this._handleUserGesture.bind(this);
    this._bindUnlockListeners();
  }

  _loadSettings() {
    const defaults = {
      bgmMuted: false,
      sfxMuted: false,
      footstepsEnabled: true,
      bgmVolume: 0.75,
      sfxVolume: 0.85
    };
    if (typeof window === 'undefined' || !window.localStorage) return defaults;
    try {
      const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return {
        bgmMuted: typeof parsed.bgmMuted === 'boolean' ? parsed.bgmMuted : defaults.bgmMuted,
        sfxMuted: typeof parsed.sfxMuted === 'boolean' ? parsed.sfxMuted : defaults.sfxMuted,
        footstepsEnabled: typeof parsed.footstepsEnabled === 'boolean' ? parsed.footstepsEnabled : defaults.footstepsEnabled,
        bgmVolume: Number.isFinite(Number(parsed.bgmVolume))
          ? Math.max(0, Math.min(1, Number(parsed.bgmVolume)))
          : defaults.bgmVolume,
        sfxVolume: Number.isFinite(Number(parsed.sfxVolume))
          ? Math.max(0, Math.min(1, Number(parsed.sfxVolume)))
          : defaults.sfxVolume
      };
    } catch (_) {
      return defaults;
    }
  }

  _saveSettings() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (_) {}
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(partial = {}) {
    if (!partial || typeof partial !== 'object') return this.getSettings();
    if (typeof partial.bgmMuted === 'boolean') this.settings.bgmMuted = partial.bgmMuted;
    if (typeof partial.sfxMuted === 'boolean') this.settings.sfxMuted = partial.sfxMuted;
    if (typeof partial.footstepsEnabled === 'boolean') this.settings.footstepsEnabled = partial.footstepsEnabled;
    if (partial.bgmVolume !== undefined && Number.isFinite(Number(partial.bgmVolume))) {
      this.settings.bgmVolume = Math.max(0, Math.min(1, Number(partial.bgmVolume)));
    }
    if (partial.sfxVolume !== undefined && Number.isFinite(Number(partial.sfxVolume))) {
      this.settings.sfxVolume = Math.max(0, Math.min(1, Number(partial.sfxVolume)));
    }
    this._saveSettings();
    this._applyBusGains(0.08);

    // 若取消 BGM 静音且存在目标曲目，平滑恢复
    if (!this.muted && !this.settings.bgmMuted) {
      const target = (this.pendingTrack && this.pendingTrack !== 'none')
        ? this.pendingTrack
        : this.currentTrack;
      if (target && target !== 'none' && !this.activeSession && this.ctx && this.ctx.state === 'running') {
        this.pendingTrack = null;
        this._startBgmSession(target, 0.7);
      }
    }
    return this.getSettings();
  }

  _applyBusGains(rampSec = 0.06) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const bgmTarget = this.settings.bgmMuted ? 0 : this.settings.bgmVolume * 0.56;
    const sfxTarget = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;

    if (this.bgmMaster) {
      const g = this.bgmMaster.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(bgmTarget, now + rampSec);
    }
    if (this.sfxMaster) {
      const g = this.sfxMaster.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(sfxTarget, now + rampSec);
    }
  }

  // -------------------- 上下文与总线初始化 --------------------

  _bindUnlockListeners() {
    if (this._unlockBound || typeof window === 'undefined') return;
    this._unlockBound = true;
    window.addEventListener('pointerdown', this._onUserGesture, { passive: true });
    window.addEventListener('keydown', this._onUserGesture, { passive: true });
  }

  _unbindUnlockListeners() {
    if (!this._unlockBound || typeof window === 'undefined') return;
    this._unlockBound = false;
    window.removeEventListener('pointerdown', this._onUserGesture);
    window.removeEventListener('keydown', this._onUserGesture);
  }

  _handleUserGesture() {
    const ctx = this._createOrGetCtx();
    if (!ctx) return;

    const onUnlocked = () => {
      this._unbindUnlockListeners();
      if (this.muted) return;

      if (this.pendingJingle) {
        this.pendingJingle = false;
        this._renderStudioJingle(ctx);
      }

      if (this.pendingTrack && this.pendingTrack !== 'none') {
        const track = this.pendingTrack;
        this.pendingTrack = null;
        this._startBgmSession(track, 0.8);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(onUnlocked).catch(() => {});
    } else {
      onUnlocked();
    }
  }

  _createOrGetCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this._initBuses(this.ctx);
    }
    return this.ctx;
  }

  _initBuses(ctx) {
    // Master -> Destination
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1.0;
    this.masterGain.connect(ctx.destination);

    // SFX Bus
    this.sfxMaster = ctx.createGain();
    this.sfxMaster.gain.value = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;
    this.sfxMaster.connect(this.masterGain);

    // BGM Bus (适中电平，让音效清晰穿透)
    this.bgmMaster = ctx.createGain();
    this.bgmMaster.gain.value = this.settings.bgmMuted ? 0 : this.settings.bgmVolume * 0.56;
    this.bgmMaster.connect(this.masterGain);

    // 轻量国风山谷回声总线 (Stereo/Filtered Feedback Delay)
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.34;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2100;
    const wet = ctx.createGain();
    wet.gain.value = 0.36;

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1.0;

    this.reverbSend.connect(delay);
    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);
    damp.connect(wet);
    wet.connect(this.bgmMaster);

    // 预生成 2 秒白噪声缓冲（供风声、打击乐、笛声气音复用）
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  ensureCtx() {
    if (this.muted) return null;
    const ctx = this._createOrGetCtx();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    const ctx = this.ctx;
    if (ctx && this.masterGain) {
      const now = ctx.currentTime;
      const g = this.masterGain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);

      if (this.muted) {
        g.linearRampToValueAtTime(0, now + 0.08);
      } else {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        g.linearRampToValueAtTime(1.0, now + 0.35);

        // 若取消静音时有待播或当前曲目未在运行，平滑恢复
        const target = (this.pendingTrack && this.pendingTrack !== 'none')
          ? this.pendingTrack
          : this.currentTrack;
        if (target && target !== 'none' && !this.activeSession) {
          this.pendingTrack = null;
          this._startBgmSession(target, 0.8);
        }
      }
    } else if (!this.muted) {
      // 尚未创建 ctx，但用户点击了取消静音按钮本身即是手势
      this._handleUserGesture();
    }
    return this.muted;
  }

  // ==================== 原有 SFX 音效（100% 保留兼容） ====================

  playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.08, delay = 0) {
    if (this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfxMaster || ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  pick(quality = 'common') {
    const map = {
      common: [420, 520],
      fine:   [520, 660],
      rare:   [620, 820, 980],
      legend: [587, 740, 880, 1175]
    };
    const notes = map[quality] || map.common;
    notes.forEach((f, idx) => {
      this.playTone(f, 0.11, quality === 'legend' ? 'triangle' : 'sine', 0.07, idx * 0.055);
    });
  }

  coin() {
    this.playTone(987, 0.08, 'sine', 0.08, 0);
    this.playTone(1318, 0.18, 'sine', 0.08, 0.06);
  }

  disassemble(success, crit = false) {
    if (!success) {
      this.playTone(190, 0.16, 'sawtooth', 0.06, 0);
      this.playTone(140, 0.2, 'sawtooth', 0.05, 0.1);
      return;
    }
    this.playTone(440, 0.09, 'triangle', 0.08, 0);
    this.playTone(660, 0.12, 'triangle', 0.08, 0.06);
    if (crit) {
      this.playTone(880, 0.14, 'square', 0.06, 0.12);
      this.playTone(1175, 0.22, 'triangle', 0.09, 0.18);
    }
  }

  alarm() {
    this.playTone(540, 0.12, 'sawtooth', 0.06, 0);
    this.playTone(380, 0.14, 'sawtooth', 0.06, 0.13);
  }

  geiger() {
    this.playTone(1800 + Math.random() * 600, 0.025, 'square', 0.03, 0);
  }

  ending() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.playTone(f, 0.28, 'triangle', 0.09, i * 0.11));
  }

  /**
   * 地形感知脚步声（轻柔自然、左右脚微差音高，贴合轩辕剑三质感）
   * @param {'stone'|'wood'|'dirt'|'swamp'} surface
   * @param {number} stepIndex
   */
  footstep(surface = 'stone', stepIndex = 0) {
    if (this.muted || this.settings.sfxMuted || !this.settings.footstepsEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    const alt = (stepIndex % 2 === 0) ? 1.0 : 0.91;
    const pitch = alt * (0.96 + Math.random() * 0.08);

    if (surface === 'wood') {
      // 室内木板：温润中空木地板轻踏声
      const osc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(158 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(78 * pitch, now + 0.065);
      bodyGain.gain.setValueAtTime(0.0001, now);
      bodyGain.gain.linearRampToValueAtTime(0.062, now + 0.006);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
      osc.connect(bodyGain);
      bodyGain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.085);

      // 木腔共鸣轻击
      const res = ctx.createOscillator();
      const resGain = ctx.createGain();
      res.type = 'sine';
      res.frequency.setValueAtTime(340 * pitch, now);
      res.frequency.exponentialRampToValueAtTime(220 * pitch, now + 0.045);
      resGain.gain.setValueAtTime(0.022, now);
      resGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      res.connect(resGain);
      resGain.connect(dest);
      res.start(now);
      res.stop(now + 0.06);

      if (this.noiseBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(720 * pitch, now);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.024, now);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
        src.connect(lp);
        lp.connect(ng);
        ng.connect(dest);
        src.start(now, Math.random() * 1.2, 0.05);
      }
      return;
    }

    if (surface === 'dirt') {
      // 废土/沙砾/废墟：干爽细沙碎石摩擦声
      if (this.noiseBuffer) {
        const src1 = ctx.createBufferSource();
        src1.buffer = this.noiseBuffer;
        const bp1 = ctx.createBiquadFilter();
        bp1.type = 'bandpass';
        bp1.frequency.setValueAtTime(1450 * pitch, now);
        bp1.Q.value = 1.4;
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.0001, now);
        g1.gain.linearRampToValueAtTime(0.052, now + 0.008);
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.072);
        src1.connect(bp1);
        bp1.connect(g1);
        g1.connect(dest);
        src1.start(now, Math.random() * 1.2, 0.085);

        // 细碎砾石尾粒
        const src2 = ctx.createBufferSource();
        src2.buffer = this.noiseBuffer;
        const bp2 = ctx.createBiquadFilter();
        bp2.type = 'bandpass';
        bp2.frequency.setValueAtTime(2550 * pitch, now + 0.016);
        bp2.Q.value = 2.1;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.0001, now + 0.016);
        g2.gain.linearRampToValueAtTime(0.028, now + 0.024);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.068);
        src2.connect(bp2);
        bp2.connect(g2);
        g2.connect(dest);
        src2.start(now + 0.016, Math.random() * 1.2, 0.06);
      }
      // 轻落脚底沉音
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(112 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(62 * pitch, now + 0.045);
      og.gain.setValueAtTime(0.026, now);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(og);
      og.connect(dest);
      osc.start(now);
      osc.stop(now + 0.058);
      return;
    }

    if (surface === 'swamp') {
      // 沼泽泥泞：潮湿闷踏 + 水泥轻溅
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(106 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(52 * pitch, now + 0.085);
      og.gain.setValueAtTime(0.0001, now);
      og.gain.linearRampToValueAtTime(0.046, now + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
      osc.connect(og);
      og.connect(dest);
      osc.start(now);
      osc.stop(now + 0.105);

      if (this.noiseBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(920 * pitch, now);
        bp.frequency.exponentialRampToValueAtTime(320 * pitch, now + 0.095);
        bp.Q.value = 3.6;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.0001, now);
        ng.gain.linearRampToValueAtTime(0.048, now + 0.014);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.105);
        src.connect(bp);
        bp.connect(ng);
        ng.connect(dest);
        src.start(now, Math.random() * 1.2, 0.12);
      }
      return;
    }

    // 默认 'stone'（青石板/金库/洞窟）：清脆中低频石面轻叩 + 微石韵
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1080 * pitch, now);
      bp.Q.value = 1.9;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.linearRampToValueAtTime(0.048, now + 0.004);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.046);
      src.connect(bp);
      bp.connect(ng);
      ng.connect(dest);
      src.start(now, Math.random() * 1.2, 0.055);
    }

    const tap = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tap.type = 'triangle';
    tap.frequency.setValueAtTime(205 * pitch, now);
    tap.frequency.exponentialRampToValueAtTime(108 * pitch, now + 0.042);
    tapGain.gain.setValueAtTime(0.04, now);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);
    tap.connect(tapGain);
    tapGain.connect(dest);
    tap.start(now);
    tap.stop(now + 0.055);
  }

  /**
   * 细腻竹木/墨韵 UI 轻点音（悬停与确认触感）
   */
  uiTick() {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;

    // 轻巧竹木扣音
    const wood = ctx.createOscillator();
    const wg = ctx.createGain();
    wood.type = 'triangle';
    wood.frequency.setValueAtTime(760, now);
    wood.frequency.exponentialRampToValueAtTime(520, now + 0.032);
    wg.gain.setValueAtTime(0.034, now);
    wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    wood.connect(wg);
    wg.connect(dest);
    wood.start(now);
    wood.stop(now + 0.048);

    // 一抹清润玉磬高泛音
    const chime = ctx.createOscillator();
    const cg = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(NOTE.D6, now + 0.006);
    cg.gain.setValueAtTime(0.0001, now + 0.006);
    cg.gain.linearRampToValueAtTime(0.022, now + 0.012);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
    chime.connect(cg);
    cg.connect(dest);
    chime.start(now + 0.006);
    chime.stop(now + 0.105);
  }

  /**
   * 四大流派专属战斗音效（古武 / 军火 / 机甲 / 奇术）
   * @param {'martial'|'firearm'|'mecha'|'mystic'} branch
   * @param {boolean} isHeavy
   */
  playCombatSfx(branch = 'martial', isHeavy = false) {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;

    if (branch === 'firearm') {
      // 1) 现代军火：清脆枪击爆裂 + 重炮/霰弹轰鸣
      if (this.noiseBuffer) {
        const crack = ctx.createBufferSource();
        crack.buffer = this.noiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(isHeavy ? 1400 : 2100, now);
        bp.frequency.exponentialRampToValueAtTime(isHeavy ? 280 : 620, now + (isHeavy ? 0.24 : 0.11));
        bp.Q.value = 1.1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(isHeavy ? 0.24 : 0.17, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + (isHeavy ? 0.26 : 0.12));
        crack.connect(bp);
        bp.connect(g);
        g.connect(dest);
        crack.start(now, Math.random() * 0.8, isHeavy ? 0.28 : 0.14);
      }

      // 枪膛冲击低频脉冲
      const punch = ctx.createOscillator();
      const pg = ctx.createGain();
      punch.type = 'triangle';
      punch.frequency.setValueAtTime(isHeavy ? 165 : 360, now);
      punch.frequency.exponentialRampToValueAtTime(isHeavy ? 34 : 68, now + (isHeavy ? 0.28 : 0.085));
      pg.gain.setValueAtTime(isHeavy ? 0.26 : 0.14, now);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + (isHeavy ? 0.32 : 0.095));
      punch.connect(pg);
      pg.connect(dest);
      punch.start(now);
      punch.stop(now + (isHeavy ? 0.34 : 0.11));

      if (isHeavy && this.noiseBuffer) {
        // 重炮/坦克轰击低频爆炸余震
        const boom = ctx.createBufferSource();
        boom.buffer = this.noiseBuffer;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(520, now + 0.02);
        lp.frequency.exponentialRampToValueAtTime(95, now + 0.52);
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0.0001, now + 0.02);
        bg.gain.linearRampToValueAtTime(0.24, now + 0.045);
        bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.54);
        boom.connect(lp);
        lp.connect(bg);
        bg.connect(dest);
        boom.start(now + 0.02, Math.random() * 0.6, 0.58);
      }
      return;
    }

    if (branch === 'mecha') {
      // 2) 科幻机甲：下扫等离子/激光束 + 机械伺服微鸣 + 重型轨炮/导弹爆破
      const beam = ctx.createOscillator();
      const beamSub = ctx.createOscillator();
      const bp = ctx.createBiquadFilter();
      const bg = ctx.createGain();

      beam.type = 'sawtooth';
      beam.frequency.setValueAtTime(isHeavy ? 1950 : 2300, now);
      beam.frequency.exponentialRampToValueAtTime(isHeavy ? 140 : 280, now + (isHeavy ? 0.34 : 0.2));

      beamSub.type = 'sine';
      beamSub.frequency.setValueAtTime(isHeavy ? 980 : 1150, now);
      beamSub.frequency.exponentialRampToValueAtTime(isHeavy ? 72 : 150, now + (isHeavy ? 0.34 : 0.2));

      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1600, now);
      bp.frequency.exponentialRampToValueAtTime(340, now + (isHeavy ? 0.34 : 0.2));
      bp.Q.value = 2.4;

      bg.gain.setValueAtTime(0.0001, now);
      bg.gain.linearRampToValueAtTime(isHeavy ? 0.17 : 0.13, now + 0.012);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + (isHeavy ? 0.36 : 0.22));

      beam.connect(bp);
      beamSub.connect(bp);
      bp.connect(bg);
      bg.connect(dest);
      beam.start(now);
      beamSub.start(now);
      beam.stop(now + (isHeavy ? 0.38 : 0.24));
      beamSub.stop(now + (isHeavy ? 0.38 : 0.24));

      // 机械伺服短鸣
      const servo = ctx.createOscillator();
      const sg = ctx.createGain();
      servo.type = 'triangle';
      servo.frequency.setValueAtTime(190, now);
      servo.frequency.linearRampToValueAtTime(360, now + 0.08);
      sg.gain.setValueAtTime(0.055, now);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
      servo.connect(sg);
      sg.connect(dest);
      servo.start(now);
      servo.stop(now + 0.11);

      if (isHeavy) {
        // 导弹/轨炮高能爆裂共振
        const det = ctx.createOscillator();
        const dg = ctx.createGain();
        det.type = 'sine';
        det.frequency.setValueAtTime(150, now + 0.08);
        det.frequency.exponentialRampToValueAtTime(38, now + 0.44);
        dg.gain.setValueAtTime(0.0001, now + 0.08);
        dg.gain.linearRampToValueAtTime(0.22, now + 0.1);
        dg.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
        det.connect(dg);
        dg.connect(dest);
        det.start(now + 0.08);
        det.stop(now + 0.5);

        if (this.noiseBuffer) {
          const n = ctx.createBufferSource();
          n.buffer = this.noiseBuffer;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(980, now + 0.08);
          lp.frequency.exponentialRampToValueAtTime(180, now + 0.46);
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.16, now + 0.08);
          ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
          n.connect(lp);
          lp.connect(ng);
          ng.connect(dest);
          n.start(now + 0.08, Math.random() * 0.7, 0.44);
        }
      }
      return;
    }

    if (branch === 'mystic') {
      // 3) 奇术道法：空灵五声道钟/玉磬 + 霹雳电弧爆裂
      const bellNotes = isHeavy ? [NOTE.D5, NOTE.A5, NOTE.D6] : [NOTE.D5, NOTE.A5];
      bellNotes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.035);
        g.gain.setValueAtTime(0.0001, now + idx * 0.035);
        g.gain.linearRampToValueAtTime(isHeavy ? 0.095 : 0.075, now + idx * 0.035 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + (isHeavy ? 0.52 : 0.34));
        osc.connect(g);
        g.connect(dest);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + (isHeavy ? 0.55 : 0.38));
      });

      // 雷电/符箓爆裂脆响
      if (this.noiseBuffer) {
        const bursts = isHeavy ? [0.02, 0.08, 0.14] : [0.02, 0.075];
        bursts.forEach((offset, i) => {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2800 - i * 450, now + offset);
          bp.Q.value = 3.2;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(isHeavy ? 0.13 : 0.09, now + offset);
          ng.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.085);
          src.connect(bp);
          bp.connect(ng);
          ng.connect(dest);
          src.start(now + offset, Math.random() * 0.9, 0.1);
        });
      }

      if (isHeavy) {
        // 重奇术低沉天雷余韵
        const thunder = ctx.createOscillator();
        const tg = ctx.createGain();
        thunder.type = 'triangle';
        thunder.frequency.setValueAtTime(118, now + 0.04);
        thunder.frequency.exponentialRampToValueAtTime(42, now + 0.45);
        tg.gain.setValueAtTime(0.16, now + 0.04);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
        thunder.connect(tg);
        tg.connect(dest);
        thunder.start(now + 0.04);
        thunder.stop(now + 0.5);
      }
      return;
    }

    // 4) 默认 'martial'（古武刀剑）：凌厉破空斩风 + 清冽金铁剑鸣
    if (this.noiseBuffer) {
      const whoosh = ctx.createBufferSource();
      whoosh.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(3600, now);
      bp.frequency.exponentialRampToValueAtTime(780, now + (isHeavy ? 0.2 : 0.13));
      bp.Q.value = 1.6;
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.0001, now);
      wg.gain.linearRampToValueAtTime(isHeavy ? 0.16 : 0.12, now + 0.015);
      wg.gain.exponentialRampToValueAtTime(0.0001, now + (isHeavy ? 0.22 : 0.15));
      whoosh.connect(bp);
      bp.connect(wg);
      wg.connect(dest);
      whoosh.start(now, Math.random() * 0.9, isHeavy ? 0.24 : 0.17);
    }

    // 金属剑锋清鸣
    const ringFreqs = isHeavy ? [1960, 2940, 4120] : [2240, 3420];
    ringFreqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now + 0.025);
      osc.frequency.exponentialRampToValueAtTime(f * 0.96, now + (isHeavy ? 0.28 : 0.18));
      g.gain.setValueAtTime(0.0001, now + 0.025);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.065 : 0.038, now + 0.035);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (isHeavy ? 0.3 : 0.2));
      osc.connect(g);
      g.connect(dest);
      osc.start(now + 0.025);
      osc.stop(now + (isHeavy ? 0.32 : 0.22));
    });

    if (isHeavy) {
      // 重斩震地劲气
      const impact = ctx.createOscillator();
      const ig = ctx.createGain();
      impact.type = 'sine';
      impact.frequency.setValueAtTime(160, now + 0.03);
      impact.frequency.exponentialRampToValueAtTime(52, now + 0.22);
      ig.gain.setValueAtTime(0.16, now + 0.03);
      ig.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      impact.connect(ig);
      ig.connect(dest);
      impact.start(now + 0.03);
      impact.stop(now + 0.26);
    }
  }

  // ==================== 老年饼工作室开场音 (~4.8s) ====================

  playStudioJingle() {
    if (this.muted) return;
    const ctx = this._createOrGetCtx();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      this.pendingJingle = true;
      this._bindUnlockListeners();
      ctx.resume().then(() => {
        if (this.pendingJingle && !this.muted) {
          this.pendingJingle = false;
          this._renderStudioJingle(ctx);
        }
      }).catch(() => {});
      return;
    }

    this._renderStudioJingle(ctx);
  }

  _renderStudioJingle(ctx) {
    const now = ctx.currentTime + 0.04;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.85, now);
    bus.gain.setValueAtTime(0.85, now + 3.9);
    bus.gain.linearRampToValueAtTime(0, now + 4.85);
    bus.connect(this.bgmMaster);

    // 1) 温暖古筝 × 编钟五声琶音 (0.0s ~ 1.35s)
    const arp = [
      { f: NOTE.D4, t: 0.00, g: 0.18 },
      { f: NOTE.F4, t: 0.16, g: 0.17 },
      { f: NOTE.A4, t: 0.34, g: 0.19 },
      { f: NOTE.C5, t: 0.54, g: 0.17 },
      { f: NOTE.D5, t: 0.74, g: 0.21 },
      { f: NOTE.F5, t: 0.96, g: 0.18 },
      { f: NOTE.A5, t: 1.18, g: 0.20 }
    ];
    arp.forEach((n) => {
      this._voiceGuzheng(ctx, bus, n.f, now + n.t, 1.55, n.g, 0.55);
      this._voiceChime(ctx, bus, n.f * 2, now + n.t, 1.35, n.g * 0.22, 0.45);
    });

    // 2) ~1.5s 沉浑朱印太鼓落印重击 (Taiko / Ink-Stamp Thump)
    const stampTime = now + 1.50;
    this._voiceTaiko(ctx, bus, stampTime, 138, 42, 0.95, 0.52);
    // 印章木质脆响
    this._voiceWoodClick(ctx, bus, stampTime, 760, 0.11);

    // 3) 1.5s ~ 4.8s 悠长泛音余韵 (Warm Pentatonic Shimmer)
    const chord = [NOTE.D3, NOTE.A3, NOTE.D4, NOTE.F4, NOTE.A4, NOTE.E5];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = idx < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, stampTime);
      osc.detune.setValueAtTime((idx % 2 === 0 ? 1 : -1) * (3 + idx * 1.1), stampTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, stampTime);
      filter.frequency.exponentialRampToValueAtTime(520, now + 4.75);

      const peak = idx < 2 ? 0.11 : 0.065;
      g.gain.setValueAtTime(0.0001, stampTime);
      g.gain.linearRampToValueAtTime(peak, stampTime + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4.78);

      osc.connect(filter);
      filter.connect(g);
      g.connect(bus);
      if (this.reverbSend) g.connect(this.reverbSend);

      osc.start(stampTime);
      osc.stop(now + 4.85);
    });

    // 尾音一粒空灵高音古筝泛音
    this._voiceChime(ctx, bus, NOTE.D6, now + 2.35, 2.2, 0.075, 0.6);
  }

  // ==================== BGM 播放与平滑交叉淡入淡出 ====================

  playBgm(trackName) {
    const valid = ['prologue', 'town', 'wild', 'battle', 'none'];
    const target = valid.includes(trackName) ? trackName : 'none';

    if (target === 'none') {
      this.pendingTrack = null;
      this.currentTrack = 'none';
      this._fadeOutSession(this.activeSession, 0.8);
      this.activeSession = null;
      return;
    }

    // 已经在播放同一首曲目且处于运行中，避免重复重启
    if (this.currentTrack === target && this.activeSession && !this.activeSession.stopped) {
      return;
    }

    this.currentTrack = target;

    const ctx = this._createOrGetCtx();
    if (!ctx) return;

    if (this.muted) {
      // 静音状态下只记住目标曲目，取消静音后平滑恢复
      this.pendingTrack = target;
      this._fadeOutSession(this.activeSession, 0.4);
      this.activeSession = null;
      return;
    }

    if (ctx.state === 'suspended') {
      this.pendingTrack = target;
      this._bindUnlockListeners();
      ctx.resume().then(() => {
        if (this.pendingTrack === target && !this.muted) {
          this.pendingTrack = null;
          this._startBgmSession(target, 0.8);
        }
      }).catch(() => {});
      return;
    }

    this.pendingTrack = null;
    this._startBgmSession(target, 0.9);
  }

  _startBgmSession(trackName, fadeInSec = 0.8) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmMaster) return;

    // 淡出旧音轨
    if (this.activeSession) {
      this._fadeOutSession(this.activeSession, 0.9);
      this.activeSession = null;
    }

    const now = ctx.currentTime;
    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.0001, now);
    trackGain.gain.linearRampToValueAtTime(1.0, now + fadeInSec);
    trackGain.connect(this.bgmMaster);

    const session = {
      trackName,
      gain: trackGain,
      timers: [],
      nodes: [],
      stopped: false
    };

    this.activeSession = session;

    switch (trackName) {
      case 'prologue':
        this._buildPrologueTrack(ctx, session);
        break;
      case 'town':
        this._buildTownTrack(ctx, session);
        break;
      case 'wild':
        this._buildWildTrack(ctx, session);
        break;
      case 'battle':
        this._buildBattleTrack(ctx, session);
        break;
      default:
        break;
    }
  }

  _fadeOutSession(session, fadeOutSec = 0.8) {
    if (!session || session.stopped) return;
    session.stopped = true;

    // 立即停止调度器，不再产生新音符
    session.timers.forEach((id) => clearInterval(id));
    session.timers.length = 0;

    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const g = session.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.linearRampToValueAtTime(0, now + fadeOutSec);

    // 淡出结束后安全停止并断开所有持续节点
    setTimeout(() => {
      session.nodes.forEach((node) => {
        try {
          if (typeof node.stop === 'function') node.stop();
        } catch (_) {}
        try {
          if (typeof node.disconnect === 'function') node.disconnect();
        } catch (_) {}
      });
      session.nodes.length = 0;
      try { session.gain.disconnect(); } catch (_) {}
    }, Math.ceil((fadeOutSec + 0.15) * 1000));
  }

  // ==================== 音轨 1：prologue（苍凉诗意·D小调五声洞箫与稀疏古筝） ====================

  _buildPrologueTrack(ctx, session) {
    const now = ctx.currentTime;
    // 1) 苍凉低沉 D2 + A2 弦乐铺底 + 慢速滤波呼吸
    this._createPadDrone(ctx, session, [NOTE.D2, NOTE.A2, NOTE.D3], {
      type: 'triangle',
      gain: 0.13,
      filterFreq: 420,
      lfoRate: 0.09,
      lfoDepth: 150
    });

    // 2) 诗意慢板 D 小调五声 (D, F, G, A, C) 步进序列 (每步 0.85s)
    const guzhengSeq = [
      NOTE.D4, 0, NOTE.A4, 0, NOTE.F4, 0, 0, NOTE.C5,
      NOTE.A4, 0, 0, NOTE.G4, NOTE.F4, 0, NOTE.D4, 0,
      NOTE.A3, 0, NOTE.F4, 0, NOTE.G4, 0, NOTE.A4, 0,
      NOTE.C5, 0, NOTE.A4, 0, NOTE.G4, 0, NOTE.D4, 0
    ];
    const fluteSeq = [
      0, 0, 0, NOTE.A4, 0, 0, 0, 0,
      0, NOTE.F4, 0, 0, 0, 0, NOTE.D4, 0,
      0, 0, 0, NOTE.C5, 0, 0, NOTE.A4, 0,
      0, 0, NOTE.G4, 0, 0, 0, 0, 0
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.05;
      const idx = step % guzhengSeq.length;

      const gz = guzhengSeq[idx];
      if (gz) {
        this._voiceGuzheng(this.ctx, session.gain, gz, t, 2.2, 0.16, 0.65);
        // 偶尔加一粒低八度共鸣
        if (idx % 8 === 0) {
          this._voiceGuzheng(this.ctx, session.gain, gz * 0.5, t + 0.04, 2.6, 0.11, 0.45);
        }
      }

      const fl = fluteSeq[idx];
      if (fl) {
        this._voiceXiaoFlute(this.ctx, session.gain, fl, t, 2.7, 0.13);
      }

      step++;
    };

    tick();
    session.timers.push(setInterval(tick, 850));
  }

  // ==================== 音轨 2：town（轩辕剑叁风·温暖五声古筝/琵琶营地旋律） ====================

  _buildTownTrack(ctx, session) {
    // 1) 温暖明亮的 D 宫五声 (D, E, F#, A, B) 柔和底垫
    this._createPadDrone(ctx, session, [NOTE.D2, NOTE.A2, NOTE.Fs3], {
      type: 'sine',
      gain: 0.14,
      filterFreq: 680,
      lfoRate: 0.14,
      lfoDepth: 160
    });

    // 2) 温暖难忘的 32 步国风主旋律（每步 0.38s，约 79 BPM 八分音符）
    const melody = [
      NOTE.A4, 0, NOTE.B4, NOTE.D5, NOTE.E5, 0, NOTE.D5, NOTE.B4,
      NOTE.A4, 0, NOTE.Fs4, NOTE.E4, NOTE.D4, 0, 0, 0,
      NOTE.E4, 0, NOTE.Fs4, NOTE.A4, NOTE.B4, 0, NOTE.A4, NOTE.Fs4,
      NOTE.E4, 0, NOTE.D4, NOTE.E4, NOTE.Fs4, 0, 0, 0,
      NOTE.D5, 0, NOTE.E5, NOTE.Fs5, NOTE.E5, 0, NOTE.D5, NOTE.B4,
      NOTE.A4, 0, NOTE.B4, NOTE.D5, NOTE.A4, 0, 0, 0,
      NOTE.B4, 0, NOTE.A4, NOTE.Fs4, NOTE.E4, 0, NOTE.Fs4, NOTE.A4,
      NOTE.D4, 0, 0, NOTE.E4, NOTE.D4, 0, 0, 0
    ];

    // 柔和分解伴奏低音
    const bassArp = [
      NOTE.D3, NOTE.A3, NOTE.D4, NOTE.A3, NOTE.B2, NOTE.Fs3, NOTE.B3, NOTE.Fs3,
      NOTE.G2, NOTE.D3, NOTE.G3, NOTE.D3, NOTE.A2, NOTE.E3, NOTE.A3, NOTE.E3
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const mIdx = step % melody.length;
      const bIdx = Math.floor(step / 2) % bassArp.length;

      // 主旋律：温暖古筝 + 清脆琵琶泛音
      const note = melody[mIdx];
      if (note) {
        this._voiceGuzheng(this.ctx, session.gain, note, t, 1.35, 0.18, 0.48);
        if (mIdx % 4 === 0) {
          this._voicePipa(this.ctx, session.gain, note, t, 0.55, 0.09);
        }
      }

      // 每两步一粒柔和分解伴奏
      if (step % 2 === 0) {
        this._voiceGuzheng(this.ctx, session.gain, bassArp[bIdx], t, 1.1, 0.09, 0.3);
      }

      // 每 8 步一粒轻柔木鱼/编钟点缀，营造营地烟火气
      if (step % 8 === 0) {
        this._voiceWoodClick(this.ctx, session.gain, t, 640, 0.04);
      } else if (step % 16 === 12) {
        this._voiceChime(this.ctx, session.gain, NOTE.A5, t, 1.4, 0.045, 0.5);
      }

      step++;
    };

    tick();
    session.timers.push(setInterval(tick, 380));
  }

  // ==================== 音轨 3：wild（废土荒野·呼啸风声 + 孤寂五声风铃 + 科幻脉冲） ====================

  _buildWildTrack(ctx, session) {
    // 1) 废土风声（带通扫频噪声）
    this._createWindNoise(ctx, session, 0.085);

    // 2) 荒凉科幻低频铺底 (E2 + B2 微失谐)
    this._createPadDrone(ctx, session, [NOTE.E2, NOTE.B2], {
      type: 'sawtooth',
      gain: 0.075,
      filterFreq: 300,
      lfoRate: 0.07,
      lfoDepth: 140
    });

    // 3) 孤寂 E 小调五声 (E, G, A, B, D) 金属风铃 + 微妙科幻探测脉冲 (每步 0.55s)
    const chimePool = [NOTE.E5, NOTE.G5, NOTE.A5, NOTE.B5, NOTE.D6, NOTE.B4, NOTE.G4];
    const pulsePattern = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.05;
      const pIdx = step % pulsePattern.length;

      // 微妙科幻低频雷达脉冲
      if (pulsePattern[pIdx]) {
        this._voiceSciFiPulse(this.ctx, session.gain, pIdx === 0 ? NOTE.E2 * 2 : NOTE.B2, t, 0.45, 0.09);
      }

      // 稀疏孤寂五声金属风铃 / 古筝孤音
      if (step % 5 === 1 || (step % 11 === 4 && Math.random() > 0.3)) {
        const f = chimePool[(step * 3 + Math.floor(Math.random() * 2)) % chimePool.length];
        this._voiceChime(this.ctx, session.gain, f, t, 2.4, 0.085, 0.72);
      } else if (step % 13 === 7) {
        const f = [NOTE.E4, NOTE.G4, NOTE.B4, NOTE.D5][step % 4];
        this._voiceGuzheng(this.ctx, session.gain, f, t, 1.9, 0.11, 0.6);
      }

      step++;
    };

    tick();
    session.timers.push(setInterval(tick, 550));
  }

  // ==================== 音轨 4：battle（燃向国风科幻战斗·太鼓战鼓 + 科幻低音 + 急促五声主旋律） ====================

  _buildBattleTrack(ctx, session) {
    // 约 138 BPM，八分音符步进 (~217ms)
    const stepMs = 217;

    // 紧迫科幻低音律动 (D 小调五声)
    const bassLine = [
      NOTE.D2, NOTE.D2, NOTE.A2, NOTE.D2, NOTE.F2, NOTE.F2, NOTE.G2, NOTE.A2,
      NOTE.C3, NOTE.C3, NOTE.A2, NOTE.G2, NOTE.F2, NOTE.G2, NOTE.A2, NOTE.D2
    ];

    // 疾走国风五声战斗主旋律（琵琶轮指 + 锐利合成主音）
    const leadLine = [
      NOTE.D5, 0, NOTE.F5, NOTE.G5, NOTE.A5, 0, NOTE.G5, NOTE.F5,
      NOTE.D5, NOTE.C5, NOTE.A4, 0, NOTE.C5, NOTE.D5, NOTE.F5, 0,
      NOTE.G5, 0, NOTE.A5, NOTE.C6, NOTE.A5, 0, NOTE.G5, NOTE.F5,
      NOTE.D5, 0, NOTE.C5, NOTE.A4, NOTE.D5, 0, 0, 0
    ];

    // 战鼓节奏型: 2=重太鼓, 1=中鼓, 3=鼓边脆击
    const drumPattern = [
      2, 0, 3, 1, 2, 0, 1, 3,
      2, 1, 3, 0, 2, 1, 1, 3
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.03;
      const bIdx = step % bassLine.length;
      const lIdx = step % leadLine.length;
      const dIdx = step % drumPattern.length;

      // 1) 战鼓打击乐
      const drum = drumPattern[dIdx];
      if (drum === 2) {
        this._voiceTaiko(this.ctx, session.gain, t, 145, 48, 0.34, 0.36);
      } else if (drum === 1) {
        this._voiceTaiko(this.ctx, session.gain, t, 210, 92, 0.18, 0.22);
      } else if (drum === 3) {
        this._voiceWoodClick(this.ctx, session.gain, t, 1150, 0.11);
      }

      // 高频金属节奏沙锤（每奇偶步微弱推进）
      if (step % 2 === 1) {
        this._voiceHiHat(this.ctx, session.gain, t, 0.045);
      }

      // 2) 驱动科幻低音
      this._voiceSciFiBass(this.ctx, session.gain, bassLine[bIdx], t, 0.19, 0.18);

      // 3) 燃向五声主旋律（琵琶急拨 + 合成器主音）
      const lead = leadLine[lIdx];
      if (lead) {
        this._voicePipa(this.ctx, session.gain, lead, t, 0.36, 0.16);
        // 强拍叠加锐利合成主音增强张力
        if (lIdx % 4 === 0) {
          this._voiceBattleLead(this.ctx, session.gain, lead, t, 0.32, 0.085);
        }
      }

      step++;
    };

    tick();
    session.timers.push(setInterval(tick, stepMs));
  }

  // ==================== 合成器乐器原语（零依赖 Web Audio） ====================

  // 持续铺底音垫（支持 LFO 滤波呼吸）
  _createPadDrone(ctx, session, freqs, opts) {
    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(opts.filterFreq || 480, now);
    filter.Q.value = 1.2;

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(opts.gain || 0.12, now);

    // LFO 缓慢扫频
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(opts.lfoRate || 0.1, now);
    lfoGain.gain.setValueAtTime(opts.lfoDepth || 120, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    filter.connect(padGain);
    padGain.connect(session.gain);

    lfo.start(now);
    session.nodes.push(lfo, lfoGain, filter, padGain);

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = opts.type || 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.detune.setValueAtTime((idx % 2 === 0 ? -4 : 4), now);
      osc.connect(filter);
      osc.start(now);
      session.nodes.push(osc);
    });
  }

  // 废土风声（循环白噪声 + 慢速扫频带通滤波）
  _createWindNoise(ctx, session, gainVal = 0.08) {
    if (!this.noiseBuffer) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.value = 2.6;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, now);
    lfoGain.gain.setValueAtTime(220, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, now);

    src.connect(filter);
    filter.connect(g);
    g.connect(session.gain);

    src.start(now);
    lfo.start(now);
    session.nodes.push(src, lfo, lfoGain, filter, g);
  }

  // 古筝拨弦（清润亮泽、自然衰减 + 滤波器收尾）
  _voiceGuzheng(ctx, dest, freq, startTime, duration = 1.6, gainVal = 0.16, reverbAmount = 0.45) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.24, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 7, 5200), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.4, 320), startTime + duration * 0.85);
    filter.Q.value = 1.5;

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(g);
    g.connect(dest);

    if (this.reverbSend && reverbAmount > 0) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(reverbAmount, startTime);
      g.connect(send);
      send.connect(this.reverbSend);
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  }

  // 琵琶脆拨（起音锐利、颗粒感强）
  _voicePipa(ctx, dest, freq, startTime, duration = 0.45, gainVal = 0.15) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.008, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.03);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(freq * 3.2, 4200), startTime);
    filter.Q.value = 1.6;

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    if (this.reverbSend) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(0.25, startTime);
      g.connect(send);
      send.connect(this.reverbSend);
    }

    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
  }

  // 洞箫 / 竹笛（缓起音、气声质感、柔和颤音）
  _voiceXiaoFlute(ctx, dest, freq, startTime, duration = 2.4, gainVal = 0.13) {
    const osc = ctx.createOscillator();
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.985, startTime);
    osc.frequency.linearRampToValueAtTime(freq, startTime + 0.22);

    vib.type = 'sine';
    vib.frequency.setValueAtTime(5.1, startTime);
    vibGain.gain.setValueAtTime(0, startTime);
    vibGain.gain.linearRampToValueAtTime(freq * 0.012, startTime + 0.65);
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, startTime);

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.45);
    g.gain.setValueAtTime(gainVal * 0.88, startTime + duration * 0.65);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);

    if (this.reverbSend) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(0.55, startTime);
      g.connect(send);
      send.connect(this.reverbSend);
    }

    // 轻微气声
    if (this.noiseBuffer) {
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const nBp = ctx.createBiquadFilter();
      nBp.type = 'bandpass';
      nBp.frequency.setValueAtTime(freq * 2, startTime);
      nBp.Q.value = 5.0;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, startTime);
      nGain.gain.linearRampToValueAtTime(gainVal * 0.14, startTime + 0.35);
      nGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      nSrc.connect(nBp);
      nBp.connect(nGain);
      nGain.connect(dest);
      nSrc.start(startTime);
      nSrc.stop(startTime + duration + 0.05);
    }

    osc.start(startTime);
    vib.start(startTime);
    osc.stop(startTime + duration + 0.05);
    vib.stop(startTime + duration + 0.05);
  }

  // 空灵编钟 / 金属风铃
  _voiceChime(ctx, dest, freq, startTime, duration = 2.0, gainVal = 0.08, reverbAmount = 0.55) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.756, startTime); // 金属非谐波泛音

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.22, startTime);

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(g);
    osc2.connect(g2);
    g2.connect(g);
    g.connect(dest);

    if (this.reverbSend && reverbAmount > 0) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(reverbAmount, startTime);
      g.connect(send);
      send.connect(this.reverbSend);
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  }

  // 太鼓 / 朱印落印重鼓
  _voiceTaiko(ctx, dest, startTime, startFreq = 140, endFreq = 45, duration = 0.45, gainVal = 0.35) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + Math.min(0.18, duration * 0.5));

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    // 鼓皮冲击瞬态噪声
    if (this.noiseBuffer) {
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(750, startTime);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(gainVal * 0.32, startTime);
      ng.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.075);
      nSrc.connect(lp);
      lp.connect(ng);
      ng.connect(dest);
      nSrc.start(startTime);
      nSrc.stop(startTime + 0.09);
    }
  }

  // 木鱼 / 鼓边击打
  _voiceWoodClick(ctx, dest, startTime, freq = 820, gainVal = 0.08) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.62, startTime + 0.045);

    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.06);

    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.07);
  }

  // 高频金属沙锤 / 踩镲
  _voiceHiHat(ctx, dest, startTime, gainVal = 0.045) {
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6200, startTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);

    src.connect(hp);
    hp.connect(g);
    g.connect(dest);
    src.start(startTime);
    src.stop(startTime + 0.06);
  }

  // 荒野科幻脉冲
  _voiceSciFiPulse(ctx, dest, freq, startTime, duration = 0.45, gainVal = 0.09) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, startTime);
    filter.frequency.exponentialRampToValueAtTime(160, startTime + duration);
    filter.Q.value = 3.5;

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
  }

  // 战斗科幻低音贝斯
  _voiceSciFiBass(ctx, dest, freq, startTime, duration = 0.19, gainVal = 0.18) {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(640, startTime);
    filter.frequency.exponentialRampToValueAtTime(180, startTime + duration);
    filter.Q.value = 2.8;

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(g);
    g.connect(dest);

    osc.start(startTime);
    sub.start(startTime);
    osc.stop(startTime + duration + 0.03);
    sub.stop(startTime + duration + 0.03);
  }

  // 战斗锐利主音叠加
  _voiceBattleLead(ctx, dest, freq, startTime, duration = 0.3, gainVal = 0.085) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, startTime);
    filter.frequency.exponentialRampToValueAtTime(650, startTime + duration);

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
  }
}

export const sfx = new SoundEngine();
