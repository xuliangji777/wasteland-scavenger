// ==================== 微信小程序原生触觉反馈与音效控制器 ====================
// 零 Web Audio 依赖，完全适配个人微信小程序环境（wx.vibrateShort + wx.setStorageSync）

const AUDIO_SETTINGS_KEY = 'motu_audio_settings_v1';

const DEFAULT_SETTINGS = {
  muted: false,
  bgmMuted: false,
  sfxMuted: false,
  hapticsEnabled: true,
  footstepsEnabled: true,
  bgmVolume: 0.75,
  sfxVolume: 0.85
};

class MiniAudioController {
  constructor() {
    this.settings = this._loadSettings();
    this.muted = Boolean(this.settings.muted);
    this.currentTrack = 'none';
    this._lastVibrateAt = 0;
  }

  _loadSettings() {
    try {
      if (typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function') {
        const raw = wx.getStorageSync(AUDIO_SETTINGS_KEY);
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed && typeof parsed === 'object') {
            return {
              ...DEFAULT_SETTINGS,
              ...parsed
            };
          }
        }
      }
    } catch (_) {}
    return { ...DEFAULT_SETTINGS };
  }

  _saveSettings() {
    try {
      if (typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function') {
        wx.setStorageSync(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
      }
    } catch (_) {}
  }

  getSettings() {
    return { ...this.settings, muted: this.muted };
  }

  updateSettings(partial = {}) {
    if (!partial || typeof partial !== 'object') return this.getSettings();
    if (typeof partial.muted === 'boolean') {
      this.muted = partial.muted;
      this.settings.muted = partial.muted;
    }
    if (typeof partial.bgmMuted === 'boolean') this.settings.bgmMuted = partial.bgmMuted;
    if (typeof partial.sfxMuted === 'boolean') this.settings.sfxMuted = partial.sfxMuted;
    if (typeof partial.hapticsEnabled === 'boolean') this.settings.hapticsEnabled = partial.hapticsEnabled;
    if (typeof partial.footstepsEnabled === 'boolean') this.settings.footstepsEnabled = partial.footstepsEnabled;
    if (partial.bgmVolume !== undefined && Number.isFinite(Number(partial.bgmVolume))) {
      this.settings.bgmVolume = Math.max(0, Math.min(1, Number(partial.bgmVolume)));
    }
    if (partial.sfxVolume !== undefined && Number.isFinite(Number(partial.sfxVolume))) {
      this.settings.sfxVolume = Math.max(0, Math.min(1, Number(partial.sfxVolume)));
    }
    this._saveSettings();
    return this.getSettings();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.settings.muted = this.muted;
    this._saveSettings();
    if (!this.muted) this.vibrate('light');
    return this.muted;
  }

  vibrate(type = 'light', minGapMs = 35) {
    if (this.muted || this.settings.sfxMuted || !this.settings.hapticsEnabled) return;
    const now = Date.now();
    if (now - this._lastVibrateAt < minGapMs) return;
    this._lastVibrateAt = now;
    try {
      if (typeof wx !== 'undefined' && typeof wx.vibrateShort === 'function') {
        wx.vibrateShort({ type });
      }
    } catch (_) {}
  }

  // ---- 游戏音效与触觉语义映射（100% 兼容 web/js/audio.js API） ----

  uiTick() {
    this.vibrate('light', 40);
  }

  pick(quality = 'common') {
    if (quality === 'legend') {
      this.vibrate('heavy', 20);
    } else if (quality === 'rare') {
      this.vibrate('medium', 20);
    } else {
      this.vibrate('light', 40);
    }
  }

  coin() {
    this.vibrate('light', 30);
  }

  disassemble(success, crit = false) {
    if (!success) {
      this.vibrate('medium', 25);
      return;
    }
    this.vibrate(crit ? 'heavy' : 'light', 25);
  }

  alarm() {
    this.vibrate('heavy', 20);
  }

  geiger() {
    this.vibrate('light', 80);
  }

  ending() {
    this.vibrate('heavy', 20);
  }

  footstep() {
    // 行走脚步在移动端不持续震动，避免干扰手感；保留接口供世界引擎安全调用
  }

  playCombatSfx(branch = 'martial', isHeavy = false) {
    if (isHeavy || branch === 'mecha' || branch === 'firearm') {
      this.vibrate(isHeavy ? 'heavy' : 'medium', 20);
    } else {
      this.vibrate('light', 25);
    }
  }

  playBgm(track = 'none') {
    this.currentTrack = track || 'none';
  }

  stopBgm() {
    this.currentTrack = 'none';
  }

  playStudioJingle() {
    this.vibrate('light', 50);
  }
}

const sfx = new MiniAudioController();

module.exports = {
  MiniAudioController,
  sfx
};
