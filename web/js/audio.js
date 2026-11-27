// ==================== Web Audio Studio Synthesizer & Foley Engine (v28) ====================
// Zero external MP3 dependencies · Warm Master Bus + Spatial Delay/Reverb + 12 BGM + Bespoke Combat Foley

const NOTE = {
  C2: 65.41,  D2: 73.42,  Eb2: 77.78, E2: 82.41,  F2: 87.31,  Fs2: 92.50, G2: 98.00,  Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98
};

const AUDIO_SETTINGS_KEY = 'motu_audio_settings_v1';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.settings = this._loadSettings();

    // Master & Bus Nodes
    this.masterCompressor = null;
    this.masterGain = null;
    this.sfxMaster = null;
    this.bgmMaster = null;
    this.reverbSend = null;
    this.sfxReverbSend = null;
    this.noiseBuffer = null;

    // BGM State
    this.currentTrack = 'none';
    this.pendingTrack = null;
    this.pendingJingle = false;
    this.activeSession = null;

    // Autoplay unlock
    this._unlockBound = false;
    this._onUserGesture = this._handleUserGesture.bind(this);
    this._bindUnlockListeners();
  }

  // ==================== Settings & Persistence ====================

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

    if (!this.muted && !this.settings.bgmMuted) {
      const target = (this.pendingTrack && this.pendingTrack !== 'none')
        ? this.pendingTrack
        : this.currentTrack;
      if (target && target !== 'none' && !this.activeSession && this.ctx && this.ctx.state === 'running') {
        this.pendingTrack = null;
        this._startBgmSession(target, 0.6);
      }
    }
    return this.getSettings();
  }

  _applyBusGains(rampSec = 0.06) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const bgmTarget = this.settings.bgmMuted ? 0 : this.settings.bgmVolume * 0.58;
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

  // ==================== Context & Master Bus ====================

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
        this._startBgmSession(track, 0.6);
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
    // Master Bus: DynamicsCompressorNode -> MasterGain -> Destination (never clips, warm punch)
    this.masterCompressor = ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-14, ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(18, ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(4.0, ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.004, ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.16, ctx.currentTime);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1.0;

    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // SFX Bus
    this.sfxMaster = ctx.createGain();
    this.sfxMaster.gain.value = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;
    this.sfxMaster.connect(this.masterCompressor);

    // BGM Bus
    this.bgmMaster = ctx.createGain();
    this.bgmMaster.gain.value = this.settings.bgmMuted ? 0 : this.settings.bgmVolume * 0.58;
    this.bgmMaster.connect(this.masterCompressor);

    // Warm Spatial Echo/Reverb Send Bus (dual-tap damped feedback delay at 0.22)
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1.0;

    const delayA = ctx.createDelay(1.0);
    delayA.delayTime.value = 0.29;
    const dampA = ctx.createBiquadFilter();
    dampA.type = 'lowpass';
    dampA.frequency.value = 2300;
    const fbA = ctx.createGain();
    fbA.gain.value = 0.22;

    const delayB = ctx.createDelay(1.0);
    delayB.delayTime.value = 0.43;
    const dampB = ctx.createBiquadFilter();
    dampB.type = 'lowpass';
    dampB.frequency.value = 1850;
    const fbB = ctx.createGain();
    fbB.gain.value = 0.22;

    const wetBgm = ctx.createGain();
    wetBgm.gain.value = 0.30;

    this.reverbSend.connect(delayA);
    delayA.connect(dampA);
    dampA.connect(fbA);
    fbA.connect(delayA);
    dampA.connect(wetBgm);

    this.reverbSend.connect(delayB);
    delayB.connect(dampB);
    dampB.connect(fbB);
    fbB.connect(delayB);
    dampB.connect(wetBgm);

    wetBgm.connect(this.bgmMaster);

    // Dedicated SFX Reverb Send (subtle room tail so blades, bells, & explosions breathe)
    this.sfxReverbSend = ctx.createGain();
    this.sfxReverbSend.gain.value = 1.0;

    const sfxDelay = ctx.createDelay(1.0);
    sfxDelay.delayTime.value = 0.17;
    const sfxDamp = ctx.createBiquadFilter();
    sfxDamp.type = 'lowpass';
    sfxDamp.frequency.value = 2600;
    const sfxFb = ctx.createGain();
    sfxFb.gain.value = 0.22;
    const sfxWet = ctx.createGain();
    sfxWet.gain.value = 0.24;

    this.sfxReverbSend.connect(sfxDelay);
    sfxDelay.connect(sfxDamp);
    sfxDamp.connect(sfxFb);
    sfxFb.connect(sfxDelay);
    sfxDamp.connect(sfxWet);
    sfxWet.connect(this.sfxMaster);

    // Pre-generate 2.5s white noise buffer (shared by foley, wind, flute breath, percussion)
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 2.5);
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

  ensureAudio() {
    return this.ensureCtx();
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

        const target = (this.pendingTrack && this.pendingTrack !== 'none')
          ? this.pendingTrack
          : this.currentTrack;
        if (target && target !== 'none' && !this.activeSession) {
          this.pendingTrack = null;
          this._startBgmSession(target, 0.6);
        }
      }
    } else if (!this.muted) {
      this._handleUserGesture();
    }
    return this.muted;
  }

  // ==================== Studio Instrument Voices ====================

  /**
   * Plucked Chinese Guqin / Guzheng string with resonant lowpass decay & subtle 滑音 (slide)
   */
  pluckGuqin(freq, dur = 1.6, vol = 0.16, time = null, dest = null, reverbAmt = 0.42, slide = 0.014) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.bgmMaster || ctx.destination;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    // Triangle body + detuned sawtooth overtone for warm plucked silk string
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    const startFreq = slide ? freq * (1 - slide) : freq;
    osc1.frequency.setValueAtTime(startFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(freq, t + 0.045);

    osc2.frequency.setValueAtTime(startFreq * 2, t);
    osc2.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.045);
    osc2.detune.setValueAtTime(5.5, t);
    osc2Gain.gain.setValueAtTime(0.26, t);

    // Resonant lowpass filter pluck decay
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 7.5, 5800), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.25, 280), t + Math.max(0.18, dur * 0.8));
    filter.Q.value = 2.2;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.009);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(g);
    g.connect(out);

    const rev = out === this.sfxMaster ? this.sfxReverbSend : this.reverbSend;
    if (rev && reverbAmt > 0) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(reverbAmt, t);
      g.connect(send);
      send.connect(rev);
    }

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.06);
    osc2.stop(t + dur + 0.06);
  }

  /**
   * Haunting Chinese Bamboo Xiao Flute: sine+triangle + breathy bandpass noise + 5.2Hz LFO vibrato
   */
  playXiaoFlute(freq, dur = 2.4, vol = 0.13, time = null, dest = null, reverbAmt = 0.55) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.bgmMaster || ctx.destination;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    // Gentle upward breath pitch approach
    osc1.frequency.setValueAtTime(freq * 0.982, t);
    osc1.frequency.linearRampToValueAtTime(freq, t + 0.24);
    osc2.frequency.setValueAtTime(freq * 0.982, t);
    osc2.frequency.linearRampToValueAtTime(freq, t + 0.24);
    osc2Gain.gain.setValueAtTime(0.28, t);

    // Expressive 5.2Hz vibrato swelling in
    vib.type = 'sine';
    vib.frequency.setValueAtTime(5.2, t);
    vibGain.gain.setValueAtTime(0, t);
    vibGain.gain.linearRampToValueAtTime(freq * 0.013, t + Math.min(0.65, dur * 0.45));
    vib.connect(vibGain);
    vibGain.connect(osc1.frequency);
    vibGain.connect(osc2.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1750, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.38, dur * 0.25));
    g.gain.setValueAtTime(vol * 0.88, t + dur * 0.68);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(g);
    g.connect(out);

    const rev = out === this.sfxMaster ? this.sfxReverbSend : this.reverbSend;
    if (rev && reverbAmt > 0) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(reverbAmt, t);
      g.connect(send);
      send.connect(rev);
    }

    // Breathy bamboo air-jet noise
    if (this.noiseBuffer) {
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      nSrc.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq * 2.02, t);
      bp.Q.value = 5.5;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.linearRampToValueAtTime(vol * 0.19, t + Math.min(0.28, dur * 0.2));
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      nSrc.connect(bp);
      bp.connect(ng);
      ng.connect(out);
      nSrc.start(t, Math.random() * 0.8);
      nSrc.stop(t + dur + 0.05);
    }

    osc1.start(t);
    osc2.start(t);
    vib.start(t);
    osc1.stop(t + dur + 0.05);
    osc2.stop(t + dur + 0.05);
    vib.stop(t + dur + 0.05);
  }

  /**
   * Cinematic Blade-Runner / Mo-Jia Sci-Fi Pad: detuned analog saw+triangle chord through sweeping lowpass
   */
  playSciFiPad(freqs, dur = 3.2, vol = 0.09, time = null, dest = null, reverbAmt = 0.45) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.bgmMaster || ctx.destination;
    const list = Array.isArray(freqs) ? freqs : [freqs];

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);
    filter.frequency.exponentialRampToValueAtTime(1450, t + dur * 0.45);
    filter.frequency.exponentialRampToValueAtTime(420, t + dur);
    filter.Q.value = 1.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.65, dur * 0.28));
    g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    filter.connect(g);
    g.connect(out);

    const rev = out === this.sfxMaster ? this.sfxReverbSend : this.reverbSend;
    if (rev && reverbAmt > 0) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(reverbAmt, t);
      g.connect(send);
      send.connect(rev);
    }

    const perVoice = 1 / Math.max(1, Math.sqrt(list.length));
    list.forEach((f, i) => {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const vg = ctx.createGain();
      oscA.type = 'sawtooth';
      oscB.type = 'triangle';
      oscA.frequency.setValueAtTime(f, t);
      oscB.frequency.setValueAtTime(f, t);
      oscA.detune.setValueAtTime(-7 - (i % 2) * 3, t);
      oscB.detune.setValueAtTime(7 + (i % 2) * 3, t);
      vg.gain.setValueAtTime(perVoice * 0.55, t);

      oscA.connect(vg);
      oscB.connect(vg);
      vg.connect(filter);
      oscA.start(t);
      oscB.start(t);
      oscA.stop(t + dur + 0.08);
      oscB.stop(t + dur + 0.08);
    });
  }

  /**
   * Taiko War Drum: pitch-dropping sine punch (130Hz->42Hz) + filtered noise skin slap
   */
  playTaikoDrum(freq = 130, vol = 0.36, time = null, dest = null, dur = 0.42) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.bgmMaster || ctx.destination;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(36, freq * 0.32), t + Math.min(0.16, dur * 0.45));

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.007);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    // Drumhead skin slap transient
    this.playNoiseBurst(0.075, 'lowpass', 920, 260, 1.0, vol * 0.36, t, out);
  }

  /**
   * Ancient Bronze Temple Bell / Astrolabe Chime: inharmonic metallic partials (1.0, 2.76, 4.07)
   */
  playBronzeBell(freq = 293.66, dur = 2.6, vol = 0.14, time = null, dest = null, reverbAmt = 0.55) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.bgmMaster || ctx.destination;

    const partials = [
      { ratio: 1.00, amp: 1.00, decay: 1.00 },
      { ratio: 2.76, amp: 0.38, decay: 0.68 },
      { ratio: 4.07, amp: 0.22, decay: 0.48 }
    ];

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(1.0, t);
    bus.connect(out);

    const rev = out === this.sfxMaster ? this.sfxReverbSend : this.reverbSend;
    if (rev && reverbAmt > 0) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(reverbAmt, t);
      bus.connect(send);
      send.connect(rev);
    }

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, t);
      const pDur = Math.max(0.12, dur * p.decay);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * p.amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + pDur);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + pDur + 0.05);
    });
  }

  /**
   * Reusable Foley Noise Shaper (blades, gunshots, explosions, wind, bites)
   */
  playNoiseBurst(dur = 0.15, filterType = 'bandpass', freqStart = 1800, freqEnd = 420, q = 1.4, vol = 0.15, time = null, dest = null) {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.sfxMaster || ctx.destination;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = dur > 2.0;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(20, freqStart), t);
    if (freqEnd && freqEnd !== freqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + Math.max(0.015, dur));
    }
    filter.Q.value = q;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02, dur));

    src.connect(filter);
    filter.connect(g);
    g.connect(out);

    const offset = Math.random() * 1.2;
    src.start(t, offset);
    src.stop(t + dur + 0.04);
  }

  // ==================== Additional Musical Voices ====================

  _voicePipa(ctx, dest, freq, t, dur = 0.42, vol = 0.14) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.01, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.024);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(freq * 3.4, 4600), t);
    filter.Q.value = 1.8;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    if (this.reverbSend) {
      const s = ctx.createGain();
      s.gain.setValueAtTime(0.24, t);
      g.connect(s);
      s.connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }

  _voiceWoodClapper(ctx, dest, t, freq = 860, vol = 0.075) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.04);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.065);
  }

  _voiceHiHat(ctx, dest, t, vol = 0.045) {
    this.playNoiseBurst(0.045, 'highpass', 6400, 7200, 1.0, vol, t, dest);
  }

  _voiceSciFiBass(ctx, dest, freq, t, dur = 0.2, vol = 0.18) {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    sub.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    sub.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, t);
    filter.frequency.exponentialRampToValueAtTime(170, t + dur);
    filter.Q.value = 2.6;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.009);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(t);
    sub.start(t);
    osc.stop(t + dur + 0.03);
    sub.stop(t + dur + 0.03);
  }

  _voiceSynthArp(ctx, dest, freq, t, dur = 0.34, vol = 0.11, cutoff = 2200) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(240, cutoff * 0.2), t + dur);
    filter.Q.value = 2.8;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    if (this.reverbSend) {
      const s = ctx.createGain();
      s.gain.setValueAtTime(0.38, t);
      g.connect(s);
      s.connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }

  _voiceBossBrass(ctx, dest, freqs, t, dur = 0.72, vol = 0.14) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, t);
    filter.frequency.exponentialRampToValueAtTime(1950, t + 0.09);
    filter.frequency.exponentialRampToValueAtTime(520, t + dur);
    filter.Q.value = 1.6;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    filter.connect(g);
    g.connect(dest);
    if (this.reverbSend) {
      const s = ctx.createGain();
      s.gain.setValueAtTime(0.32, t);
      g.connect(s);
      s.connect(this.reverbSend);
    }

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.detune.setValueAtTime(idx % 2 === 0 ? -6 : 6, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  _voiceAnvilClang(ctx, dest, t, vol = 0.14) {
    this.playBronzeBell(580, 0.55, vol * 0.7, t, dest, 0.35);
    this.playNoiseBurst(0.09, 'bandpass', 3200, 1100, 2.8, vol * 0.85, t, dest);
  }

  _voiceSonarDrop(ctx, dest, freq, t, vol = 0.09) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.76, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.045);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(g);
    g.connect(dest);
    if (this.reverbSend) {
      const s = ctx.createGain();
      s.gain.setValueAtTime(0.65, t);
      g.connect(s);
      s.connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + 0.46);
  }

  _createPadDrone(ctx, session, freqs, opts = {}) {
    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(opts.filterFreq || 480, now);
    filter.Q.value = opts.q || 1.3;

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(opts.gain || 0.11, now);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(opts.lfoRate || 0.09, now);
    lfoGain.gain.setValueAtTime(opts.lfoDepth || 130, now);
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
      osc.detune.setValueAtTime(idx % 2 === 0 ? -5 : 5, now);
      osc.connect(filter);
      osc.start(now);
      session.nodes.push(osc);
    });
  }

  _createAmbientNoise(ctx, session, { gain = 0.07, filterType = 'bandpass', freq = 420, q = 2.4, lfoRate = 0.08, lfoDepth = 200 } = {}) {
    if (!this.noiseBuffer) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.value = q;

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now);

    src.connect(filter);
    filter.connect(g);
    g.connect(session.gain);

    if (lfoRate > 0 && lfoDepth > 0) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(lfoRate, now);
      lg.gain.setValueAtTime(lfoDepth, now);
      lfo.connect(lg);
      lg.connect(filter.frequency);
      lfo.start(now);
      session.nodes.push(lfo, lg);
    }

    src.start(now);
    session.nodes.push(src, filter, g);
  }

  // ==================== Track 1: Studio Signature Theme (3.8s) ====================

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
    const now = ctx.currentTime + 0.03;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.92, now);
    bus.gain.setValueAtTime(0.92, now + 3.2);
    bus.gain.linearRampToValueAtTime(0, now + 3.85);
    bus.connect(this.bgmMaster);

    // 1) Rising warm sci-fi pad (0.0s -> 3.6s)
    this.playSciFiPad([NOTE.D3, NOTE.A3, NOTE.D4, NOTE.A4], 3.6, 0.18, now, bus, 0.5);

    // 2) Deep resonant bronze temple bell + ink-stamp Taiko at 0.85s
    this.playBronzeBell(NOTE.D3, 2.7, 0.22, now + 0.85, bus, 0.6);
    this.playTaikoDrum(130, 0.36, now + 0.85, bus, 0.72);
    this._voiceWoodClapper(ctx, bus, now + 0.85, 760, 0.11);

    // 3) Ascending Guqin pentatonic flourish (1.1s -> 2.15s)
    const flourish = [
      { f: NOTE.D4, t: 1.12, v: 0.18 },
      { f: NOTE.F4, t: 1.28, v: 0.17 },
      { f: NOTE.A4, t: 1.44, v: 0.19 },
      { f: NOTE.C5, t: 1.60, v: 0.18 },
      { f: NOTE.D5, t: 1.78, v: 0.21 },
      { f: NOTE.A5, t: 2.00, v: 0.22 }
    ];
    flourish.forEach((n) => {
      this.pluckGuqin(n.f, 1.5, n.v, now + n.t, bus, 0.55, 0.016);
    });

    // 4) Shimmering cyber-harmonic resolve (2.2s -> 3.8s)
    this.playBronzeBell(NOTE.D5, 1.6, 0.11, now + 2.22, bus, 0.65);
    this.playBronzeBell(NOTE.A5, 1.5, 0.08, now + 2.38, bus, 0.65);
    this.playSciFiPad([NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.D5], 1.55, 0.12, now + 2.2, bus, 0.55);
  }

  // ==================== 12 Distinct BGM Tracks with 0.6s Crossfade ====================

  playBgm(trackName) {
    const aliasMap = { wild: 'wasteland' };
    const normalized = aliasMap[trackName] || trackName;
    const valid = [
      'studio', 'prologue', 'town', 'interior', 'wasteland', 'ruins',
      'arsenal', 'swamp', 'cave', 'vault', 'battle', 'boss', 'none'
    ];
    const target = valid.includes(normalized) ? normalized : 'none';

    if (target === 'studio') {
      this.playStudioJingle();
      return;
    }

    if (target === 'none') {
      this.pendingTrack = null;
      this.currentTrack = 'none';
      this._fadeOutSession(this.activeSession, 0.6);
      this.activeSession = null;
      return;
    }

    if (this.currentTrack === target && this.activeSession && !this.activeSession.stopped) {
      return;
    }

    this.currentTrack = target;

    const ctx = this._createOrGetCtx();
    if (!ctx) return;

    if (this.muted) {
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
          this._startBgmSession(target, 0.6);
        }
      }).catch(() => {});
      return;
    }

    this.pendingTrack = null;
    this._startBgmSession(target, 0.6);
  }

  _startBgmSession(trackName, fadeInSec = 0.6) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmMaster) return;

    if (this.activeSession) {
      this._fadeOutSession(this.activeSession, 0.6);
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
      case 'prologue':  this._buildPrologueTrack(ctx, session);  break;
      case 'town':      this._buildTownTrack(ctx, session);      break;
      case 'interior':  this._buildInteriorTrack(ctx, session);  break;
      case 'wasteland': this._buildWastelandTrack(ctx, session); break;
      case 'ruins':     this._buildRuinsTrack(ctx, session);     break;
      case 'arsenal':   this._buildArsenalTrack(ctx, session);   break;
      case 'swamp':     this._buildSwampTrack(ctx, session);     break;
      case 'cave':      this._buildCaveTrack(ctx, session);      break;
      case 'vault':     this._buildVaultTrack(ctx, session);     break;
      case 'battle':    this._buildBattleTrack(ctx, session);    break;
      case 'boss':      this._buildBossTrack(ctx, session);      break;
      default: break;
    }
  }

  _fadeOutSession(session, fadeOutSec = 0.6) {
    if (!session || session.stopped) return;
    session.stopped = true;
    session.timers.forEach((id) => clearInterval(id));
    session.timers.length = 0;

    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const g = session.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.linearRampToValueAtTime(0, now + fadeOutSec);

    setTimeout(() => {
      session.nodes.forEach((node) => {
        try { if (typeof node.stop === 'function') node.stop(); } catch (_) {}
        try { if (typeof node.disconnect === 'function') node.disconnect(); } catch (_) {}
      });
      session.nodes.length = 0;
      try { session.gain.disconnect(); } catch (_) {}
    }, Math.ceil((fadeOutSec + 0.15) * 1000));
  }

  // 2. prologue — Lonely midnight Gu Long Xiao flute solo over cold wind whisper & deep minor drone
  _buildPrologueTrack(ctx, session) {
    this._createPadDrone(ctx, session, [NOTE.D2, NOTE.A2, NOTE.D3], {
      type: 'triangle', gain: 0.12, filterFreq: 360, lfoRate: 0.08, lfoDepth: 110
    });
    this._createAmbientNoise(ctx, session, {
      gain: 0.045, filterType: 'bandpass', freq: 520, q: 3.2, lfoRate: 0.09, lfoDepth: 190
    });

    const fluteSeq = [
      NOTE.A4, 0, 0, NOTE.F4, 0, NOTE.G4, NOTE.A4, 0,
      NOTE.C5, 0, 0, NOTE.A4, 0, NOTE.G4, NOTE.F4, 0,
      NOTE.D4, 0, 0, NOTE.F4, 0, NOTE.A4, NOTE.G4, 0,
      NOTE.F4, 0, NOTE.D4, 0, 0, 0, 0, 0
    ];
    const guqinSeq = [
      NOTE.D3, 0, 0, 0, NOTE.A3, 0, 0, 0,
      NOTE.F3, 0, 0, 0, NOTE.C4, 0, 0, 0,
      NOTE.G3, 0, 0, 0, NOTE.D4, 0, 0, 0,
      NOTE.A3, 0, 0, 0, NOTE.D3, 0, 0, 0
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const idx = step % fluteSeq.length;
      if (fluteSeq[idx]) this.playXiaoFlute(fluteSeq[idx], 2.2, 0.15, t, session.gain, 0.6);
      if (guqinSeq[idx]) this.pluckGuqin(guqinSeq[idx], 2.4, 0.11, t, session.gain, 0.5, 0.018);
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 760));
  }

  // 3. town (墨石镇) — Safe, warm, brisk lively pentatonic Guzheng/Pipa + wooden clapper (梆子) + warm lantern bass
  _buildTownTrack(ctx, session) {
    this._createPadDrone(ctx, session, [NOTE.D2, NOTE.A2, NOTE.Fs3], {
      type: 'sine', gain: 0.11, filterFreq: 660, lfoRate: 0.14, lfoDepth: 140
    });

    const melody = [
      NOTE.A4, NOTE.B4, NOTE.D5, 0, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.A4,
      NOTE.Fs4, 0, NOTE.A4, NOTE.B4, NOTE.A4, 0, NOTE.Fs4, 0,
      NOTE.E4, NOTE.Fs4, NOTE.A4, 0, NOTE.B4, NOTE.A4, NOTE.Fs4, NOTE.E4,
      NOTE.D4, 0, NOTE.E4, NOTE.Fs4, NOTE.A4, 0, 0, 0,
      NOTE.D5, NOTE.E5, NOTE.Fs5, 0, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.A4,
      NOTE.B4, 0, NOTE.D5, NOTE.E5, NOTE.D5, 0, NOTE.A4, 0,
      NOTE.B4, NOTE.A4, NOTE.Fs4, 0, NOTE.E4, NOTE.Fs4, NOTE.A4, NOTE.B4,
      NOTE.D5, 0, NOTE.A4, 0, NOTE.D4, 0, 0, 0
    ];
    const bass = [
      NOTE.D3, NOTE.A3, NOTE.B2, NOTE.Fs3, NOTE.G2, NOTE.D3, NOTE.A2, NOTE.E3,
      NOTE.D3, NOTE.A3, NOTE.G2, NOTE.D3, NOTE.A2, NOTE.E3, NOTE.D3, NOTE.A2
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.03;
      const mIdx = step % melody.length;
      const bIdx = Math.floor(step / 4) % bass.length;

      if (melody[mIdx]) {
        this.pluckGuqin(melody[mIdx], 1.15, 0.16, t, session.gain, 0.42, 0.01);
        if (mIdx % 2 === 0) this._voicePipa(ctx, session.gain, melody[mIdx], t, 0.36, 0.085);
      }
      if (step % 4 === 0) {
        this.pluckGuqin(bass[bIdx], 1.4, 0.12, t, session.gain, 0.22, 0);
      }
      // Lively wooden clapper (梆子) rhythm
      if (step % 8 === 0 || step % 8 === 6) {
        this._voiceWoodClapper(ctx, session.gain, t, step % 8 === 0 ? 780 : 1040, 0.055);
      }
      if (step % 16 === 12) {
        this.playBronzeBell(NOTE.A5, 1.3, 0.04, t, session.gain, 0.45);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 310));
  }

  // 4. interior (客栈/商行/医馆内室) — Cozy, calm, slower solo Guqin tea-house ambience
  _buildInteriorTrack(ctx, session) {
    this._createPadDrone(ctx, session, [NOTE.G2, NOTE.D3], {
      type: 'sine', gain: 0.08, filterFreq: 480, lfoRate: 0.07, lfoDepth: 80
    });

    const guqinSolo = [
      NOTE.G4, 0, NOTE.A4, 0, NOTE.B4, 0, NOTE.D5, 0,
      NOTE.B4, 0, NOTE.A4, 0, NOTE.G4, 0, 0, 0,
      NOTE.E4, 0, NOTE.G4, 0, NOTE.A4, 0, NOTE.B4, 0,
      NOTE.A4, 0, NOTE.G4, 0, NOTE.E4, 0, 0, 0
    ];
    const warmAccomp = [
      NOTE.G3, 0, 0, 0, NOTE.D4, 0, 0, 0,
      NOTE.E3, 0, 0, 0, NOTE.B3, 0, 0, 0,
      NOTE.C3, 0, 0, 0, NOTE.G3, 0, 0, 0,
      NOTE.D3, 0, 0, 0, NOTE.A3, 0, 0, 0
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const idx = step % guqinSolo.length;
      if (guqinSolo[idx]) {
        this.pluckGuqin(guqinSolo[idx], 2.1, 0.14, t, session.gain, 0.5, 0.016);
      }
      if (warmAccomp[idx]) {
        this.pluckGuqin(warmAccomp[idx], 2.4, 0.095, t + 0.03, session.gain, 0.42, 0.008);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 560));
  }

  // 5. wasteland (城郊废土) — Desolate windswept sci-fi wasteland: howling wind + sparse moody low Guqin + radar pulse
  _buildWastelandTrack(ctx, session) {
    this._createAmbientNoise(ctx, session, {
      gain: 0.085, filterType: 'bandpass', freq: 390, q: 2.8, lfoRate: 0.08, lfoDepth: 230
    });
    this._createPadDrone(ctx, session, [NOTE.E2, NOTE.B2], {
      type: 'sawtooth', gain: 0.065, filterFreq: 280, lfoRate: 0.06, lfoDepth: 120
    });

    const lowGuqin = [
      NOTE.E3, 0, 0, 0, 0, NOTE.G3, 0, 0,
      NOTE.B3, 0, 0, 0, NOTE.A3, 0, 0, 0,
      NOTE.D4, 0, 0, 0, 0, NOTE.B3, 0, 0,
      NOTE.G3, 0, 0, 0, NOTE.E3, 0, 0, 0
    ];
    const radarSteps = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const gIdx = step % lowGuqin.length;
      const rIdx = step % radarSteps.length;

      if (lowGuqin[gIdx]) {
        this.pluckGuqin(lowGuqin[gIdx], 2.3, 0.14, t, session.gain, 0.58, 0.02);
      }
      if (radarSteps[rIdx]) {
        this._voiceSonarDrop(ctx, session.gain, rIdx === 0 ? NOTE.E5 : NOTE.B4, t, 0.055);
        this._voiceSciFiBass(ctx, session.gain, NOTE.E2, t, 0.55, 0.11);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 540));
  }

  // 6. ruins (铁锈废都) — Cyberpunk rain-soaked ruins: dark minor-pentatonic analog synth arpeggio + rain + metallic chimes
  _buildRuinsTrack(ctx, session) {
    // Rain texture (highpass filtered noise)
    this._createAmbientNoise(ctx, session, {
      gain: 0.042, filterType: 'highpass', freq: 2400, q: 0.7, lfoRate: 0.12, lfoDepth: 400
    });
    this._createPadDrone(ctx, session, [NOTE.A2, NOTE.E3], {
      type: 'sawtooth', gain: 0.06, filterFreq: 360, lfoRate: 0.09, lfoDepth: 150
    });

    const arp = [
      NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4,
      NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.A3,
      NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.D4, NOTE.B3,
      NOTE.E3, NOTE.G3, NOTE.B3, NOTE.D4, NOTE.E4, NOTE.D4, NOTE.B3, NOTE.G3
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.03;
      const idx = step % arp.length;
      this._voiceSynthArp(ctx, session.gain, arp[idx], t, 0.34, 0.095, 1900);

      if (idx % 8 === 0) {
        this._voiceSciFiBass(ctx, session.gain, arp[idx] * 0.5, t, 0.42, 0.14);
      }
      if (idx % 16 === 4 || idx % 16 === 13) {
        this.playBronzeBell(arp[idx] * 2, 2.2, 0.055, t, session.gain, 0.65);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 285));
  }

  // 7. arsenal (赤焰兵工) — Heavy industrial danger: rhythmic metallic anvil clangs + tense low bass pulse + brooding synth swells
  _buildArsenalTrack(ctx, session) {
    this._createPadDrone(ctx, session, [NOTE.C2, NOTE.G2], {
      type: 'sawtooth', gain: 0.075, filterFreq: 320, lfoRate: 0.11, lfoDepth: 160
    });

    const bassPulse = [
      NOTE.C2, NOTE.C2, 0, NOTE.C2, NOTE.Eb2, 0, NOTE.G2, 0,
      NOTE.C2, NOTE.C2, 0, NOTE.Bb2 * 0.5, NOTE.G2, 0, NOTE.Fs2, 0
    ];
    const anvilPattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.03;
      const idx = step % bassPulse.length;

      if (bassPulse[idx]) {
        this._voiceSciFiBass(ctx, session.gain, bassPulse[idx], t, 0.25, 0.19);
      }
      if (idx % 4 === 0) {
        this.playTaikoDrum(110, 0.28, t, session.gain, 0.32);
      }
      if (anvilPattern[idx]) {
        this._voiceAnvilClang(ctx, session.gain, t, 0.12);
      }
      if (step % 16 === 0) {
        this.playSciFiPad([NOTE.C3, NOTE.G3, NOTE.Eb4], 3.4, 0.085, t, session.gain, 0.45);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 270));
  }

  // 8. swamp (青瘴毒泽) — Eerie toxic mist: floating Xiao flute intervals + watery low drone + crystalline poison chimes
  _buildSwampTrack(ctx, session) {
    this._createPadDrone(ctx, session, [NOTE.Fs2, NOTE.C3, NOTE.G3], {
      type: 'sine', gain: 0.10, filterFreq: 380, lfoRate: 0.22, lfoDepth: 180, q: 3.0
    });
    this._createAmbientNoise(ctx, session, {
      gain: 0.035, filterType: 'bandpass', freq: 680, q: 4.5, lfoRate: 0.16, lfoDepth: 260
    });

    const fluteNotes = [
      NOTE.Fs4, 0, 0, NOTE.A4, 0, 0, NOTE.C5, 0,
      0, NOTE.B4, 0, 0, NOTE.Fs4, 0, 0, 0,
      NOTE.E4, 0, 0, NOTE.G4, 0, 0, NOTE.Cs5, 0,
      0, NOTE.A4, 0, 0, NOTE.Fs4, 0, 0, 0
    ];
    const poisonChimes = [NOTE.Fs5, NOTE.C6, NOTE.G5, NOTE.B5, NOTE.Cs5];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const idx = step % fluteNotes.length;
      if (fluteNotes[idx]) {
        this.playXiaoFlute(fluteNotes[idx], 2.3, 0.13, t, session.gain, 0.65);
      }
      if (step % 6 === 2) {
        const cf = poisonChimes[step % poisonChimes.length];
        this.playBronzeBell(cf, 1.9, 0.055, t, session.gain, 0.65);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 620));
  }

  // 9. cave (地下防空洞/魔窟) — Claustrophobic subterranean tension: deep bunker hum + echoing sonar water-drops + heartbeat sub-drum
  _buildCaveTrack(ctx, session) {
    this._createPadDrone(ctx, session, [NOTE.D2, NOTE.Ab2], {
      type: 'sine', gain: 0.12, filterFreq: 210, lfoRate: 0.06, lfoDepth: 75
    });

    const drops = [NOTE.A5, NOTE.E5, NOTE.D6, NOTE.G5, NOTE.C6];
    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const bar = step % 8;

      // Slow tense heartbeat sub-drum (lub-dub)
      if (bar === 0) {
        this.playTaikoDrum(84, 0.26, t, session.gain, 0.34);
        this.playTaikoDrum(74, 0.18, t + 0.24, session.gain, 0.30);
      }
      // Echoing subterranean sonar water-drops
      if (bar === 2 || bar === 5 || (bar === 7 && step % 16 === 15)) {
        this._voiceSonarDrop(ctx, session.gain, drops[step % drops.length], t, 0.085);
      }
      // Occasional distant ominous bronze resonance
      if (step % 16 === 8) {
        this.playBronzeBell(NOTE.D3, 3.0, 0.09, t, session.gain, 0.7);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 520));
  }

  // 10. vault (天枢核心) — Grand ancient-future destiny: lush sci-fi choir pad + bronze astrolabe arpeggio + solemn temple bell
  _buildVaultTrack(ctx, session) {
    const chords = [
      [NOTE.D3, NOTE.A3, NOTE.D4, NOTE.Fs4],
      [NOTE.B2, NOTE.Fs3, NOTE.B3, NOTE.D4],
      [NOTE.G2, NOTE.D3, NOTE.G3, NOTE.B3],
      [NOTE.A2, NOTE.E3, NOTE.A3, NOTE.Cs4]
    ];
    const astrolabe = [
      NOTE.D5, NOTE.A4, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.A4, NOTE.B4, NOTE.D5,
      NOTE.B4, NOTE.Fs4, NOTE.D5, NOTE.Cs5, NOTE.B4, NOTE.Fs4, NOTE.A4, NOTE.B4,
      NOTE.G4, NOTE.D5, NOTE.B5, NOTE.A5, NOTE.G5, NOTE.D5, NOTE.E5, NOTE.Fs5,
      NOTE.A4, NOTE.E5, NOTE.Cs5, NOTE.A5, NOTE.E5, NOTE.Cs5, NOTE.A4, NOTE.E4
    ];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.04;
      const idx = step % astrolabe.length;

      if (idx % 8 === 0) {
        const chord = chords[Math.floor(idx / 8) % chords.length];
        this.playSciFiPad(chord, 3.4, 0.14, t, session.gain, 0.55);
        this.playBronzeBell(chord[0], 3.0, 0.12, t, session.gain, 0.6);
      }
      // Shimmering astrolabe arpeggio
      this.pluckGuqin(astrolabe[idx], 1.4, 0.11, t, session.gain, 0.52, 0.008);
      if (idx % 4 === 2) {
        this.playBronzeBell(astrolabe[idx], 1.5, 0.055, t, session.gain, 0.6);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 410));
  }

  // 11. battle (普通战斗) — Energetic, urgent: driving Taiko war-drums + fast Pipa/Guqin ostinato + punchy bass
  _buildBattleTrack(ctx, session) {
    const bassLine = [
      NOTE.D2, NOTE.D2, NOTE.A2, NOTE.D2, NOTE.F2, NOTE.F2, NOTE.G2, NOTE.A2,
      NOTE.C3, NOTE.C3, NOTE.A2, NOTE.G2, NOTE.F2, NOTE.G2, NOTE.A2, NOTE.D2
    ];
    const leadLine = [
      NOTE.D5, 0, NOTE.F5, NOTE.G5, NOTE.A5, 0, NOTE.G5, NOTE.F5,
      NOTE.D5, NOTE.C5, NOTE.A4, 0, NOTE.C5, NOTE.D5, NOTE.F5, 0,
      NOTE.G5, 0, NOTE.A5, NOTE.C6, NOTE.A5, 0, NOTE.G5, NOTE.F5,
      NOTE.D5, 0, NOTE.C5, NOTE.A4, NOTE.D5, 0, NOTE.A4, 0
    ];
    const drumPat = [2, 0, 3, 1, 2, 0, 1, 3, 2, 1, 3, 0, 2, 1, 1, 3];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.03;
      const bIdx = step % bassLine.length;
      const lIdx = step % leadLine.length;
      const d = drumPat[step % drumPat.length];

      if (d === 2) this.playTaikoDrum(138, 0.36, t, session.gain, 0.34);
      else if (d === 1) this.playTaikoDrum(195, 0.22, t, session.gain, 0.2);
      else if (d === 3) this._voiceWoodClapper(ctx, session.gain, t, 1180, 0.11);

      if (step % 2 === 1) this._voiceHiHat(ctx, session.gain, t, 0.045);
      this._voiceSciFiBass(ctx, session.gain, bassLine[bIdx], t, 0.19, 0.18);

      const lead = leadLine[lIdx];
      if (lead) {
        this._voicePipa(ctx, session.gain, lead, t, 0.34, 0.16);
        if (lIdx % 4 === 0) this.pluckGuqin(lead, 0.65, 0.12, t, session.gain, 0.3, 0.012);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 208));
  }

  // 12. boss (首领 Boss 战) — Epic high-stakes climax: double-tempo war drums + dark brass/synth power chords + soaring intense melody
  _buildBossTrack(ctx, session) {
    const bassLine = [
      NOTE.D2, NOTE.D2, NOTE.D2, NOTE.F2, NOTE.G2, NOTE.G2, NOTE.A2, NOTE.D2,
      NOTE.Bb2 * 0.5, NOTE.Bb2 * 0.5, NOTE.C3, NOTE.C3, NOTE.A2, NOTE.G2, NOTE.F2, NOTE.E2
    ];
    const melody = [
      NOTE.D5, NOTE.F5, NOTE.A5, 0, NOTE.Bb5, NOTE.A5, NOTE.G5, NOTE.F5,
      NOTE.A5, 0, NOTE.G5, NOTE.F5, NOTE.E5, 0, NOTE.D5, NOTE.C5,
      NOTE.D5, NOTE.F5, NOTE.A5, NOTE.C6, NOTE.D6, 0, NOTE.C6, NOTE.A5,
      NOTE.Bb5, NOTE.A5, NOTE.G5, NOTE.F5, NOTE.A5, 0, NOTE.D5, 0
    ];
    const powerChords = [
      [NOTE.D3, NOTE.A3, NOTE.D4],
      [NOTE.G3, NOTE.D4, NOTE.G4],
      [NOTE.Bb3, NOTE.F4, NOTE.Bb4],
      [NOTE.A3, NOTE.E4, NOTE.A4]
    ];
    const drumPat = [2, 1, 3, 2, 2, 1, 3, 1, 2, 2, 3, 1, 2, 1, 2, 3];

    let step = 0;
    const tick = () => {
      if (session.stopped || !this.ctx) return;
      const t = this.ctx.currentTime + 0.025;
      const bIdx = step % bassLine.length;
      const mIdx = step % melody.length;
      const d = drumPat[step % drumPat.length];

      // Thunderous double-tempo war drums
      if (d === 2) this.playTaikoDrum(132, 0.42, t, session.gain, 0.34);
      else if (d === 1) this.playTaikoDrum(198, 0.25, t, session.gain, 0.18);
      else if (d === 3) this._voiceAnvilClang(ctx, session.gain, t, 0.09);

      this._voiceHiHat(ctx, session.gain, t, step % 2 === 0 ? 0.055 : 0.035);
      this._voiceSciFiBass(ctx, session.gain, bassLine[bIdx], t, 0.16, 0.21);

      // Dramatic dark brass/synth power chords on downbeats
      if (mIdx % 8 === 0) {
        const chord = powerChords[Math.floor(mIdx / 8) % powerChords.length];
        this._voiceBossBrass(ctx, session.gain, chord, t, 0.78, 0.15);
      }

      // Soaring intense battle lead
      const n = melody[mIdx];
      if (n) {
        this._voicePipa(ctx, session.gain, n, t, 0.3, 0.16);
        this._voiceSynthArp(ctx, session.gain, n, t, 0.28, 0.11, 3200);
      }
      step++;
    };
    tick();
    session.timers.push(setInterval(tick, 175));
  }

  // ==================== Realistic Multi-Layered Combat Foley SFX ====================

  _sfxTone(freqStart, freqEnd, dur, type = 'sine', vol = 0.12, time = null, dest = null) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const out = dest || this.sfxMaster || ctx.destination;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), t);
    if (freqEnd && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + Math.max(0.015, dur));
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.008, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }

  _gunshotLayer(t, dest, { heavy = false, punchVol = 0.26, crackVol = 0.24 } = {}) {
    // High-energy supersonic gunpowder crack
    this.playNoiseBurst(heavy ? 0.28 : 0.13, 'bandpass', heavy ? 1600 : 2800, heavy ? 220 : 520, 0.9, crackVol, t, dest);
    // Low chamber punch
    this._sfxTone(heavy ? 185 : 320, heavy ? 34 : 62, heavy ? 0.28 : 0.1, 'triangle', punchVol, t, dest);
    // Brass shell casing clink
    this.playBronzeBell(heavy ? 2450 : 3420, 0.14, 0.045, t + (heavy ? 0.14 : 0.09), dest, 0.25);
  }

  _swordSlashLayer(t, dest, { pitch = 1.0, heavy = false } = {}) {
    // 1) Crisp steel draw shimmer
    this.playNoiseBurst(0.06, 'highpass', 3800 * pitch, 6400 * pitch, 2.0, 0.09, t, dest);
    // 2) Fast air-cutting blade whoosh (2600Hz -> 420Hz)
    this.playNoiseBurst(heavy ? 0.22 : 0.16, 'bandpass', 2600 * pitch, 420 * pitch, 1.8, heavy ? 0.24 : 0.19, t + 0.02, dest);
    // 3) Sharp metallic ring
    this.playBronzeBell(1780 * pitch, heavy ? 0.34 : 0.22, heavy ? 0.09 : 0.065, t + 0.035, dest, 0.38);
    // 4) Solid impact thud
    this._sfxTone(heavy ? 165 : 135, 42, heavy ? 0.22 : 0.13, 'sine', heavy ? 0.26 : 0.17, t + 0.045, dest);
  }

  _plasmaSlashLayer(t, dest, heavy = false) {
    // Sci-fi lightsaber ignite hum + plasma sizzle slash
    this._sfxTone(190, 92, heavy ? 0.38 : 0.26, 'sawtooth', 0.15, t, dest);
    this._sfxTone(1650, 290, heavy ? 0.32 : 0.21, 'sawtooth', 0.14, t + 0.01, dest);
    this.playNoiseBurst(heavy ? 0.30 : 0.20, 'bandpass', 3800, 740, 2.4, 0.20, t + 0.015, dest);
    this.playBronzeBell(1240, 0.22, 0.055, t + 0.02, dest, 0.35);
  }

  _explosionLayer(t, dest, scale = 1.0) {
    // Sub-bass shockwave drop
    this._sfxTone(135, 28, 0.52 * scale, 'sine', 0.34 * Math.min(1.2, scale), t, dest);
    // Roaring fiery debris noise
    this.playNoiseBurst(0.62 * scale, 'lowpass', 1100, 85, 0.8, 0.30 * Math.min(1.2, scale), t, dest);
    // Crisp high-end shrapnel crackle
    this.playNoiseBurst(0.24 * scale, 'bandpass', 2400, 480, 1.3, 0.18, t + 0.02, dest);
  }

  /**
   * Weapon-matched Basic Attack SFX
   */
  playBasicAttackSfx(weaponObj = null) {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;

    const wType = String(weaponObj?.weaponType || '').toLowerCase();
    const wId = String(weaponObj?.id || '').toLowerCase();
    const genre = String(weaponObj?.genre || '').toLowerCase();

    // Plasma / Energy blade / Railgun
    if (wType === 'plasma' || wType === 'railgun' || wId.includes('plasma') || wId.includes('pulsesword')) {
      this._plasmaSlashLayer(t, dest, wType === 'railgun');
      return;
    }

    // Firearms (blunderbuss / pistol / shotgun / gatling / sniper / cannon)
    if (['blunderbuss', 'pistol', 'shotgun', 'gatling', 'sniper', 'cannon'].includes(wType) || genre === 'military') {
      if (wType === 'gatling') {
        for (let i = 0; i < 3; i++) {
          this._gunshotLayer(t + i * 0.065, dest, { heavy: false, punchVol: 0.20, crackVol: 0.19 });
        }
      } else if (wType === 'sniper') {
        this._gunshotLayer(t, dest, { heavy: true, punchVol: 0.30, crackVol: 0.28 });
        this.playNoiseBurst(0.32, 'bandpass', 1800, 320, 1.5, 0.12, t + 0.06, dest);
      } else if (wType === 'shotgun' || wType === 'cannon') {
        this._gunshotLayer(t, dest, { heavy: true, punchVol: 0.32, crackVol: 0.26 });
        this.playNoiseBurst(0.22, 'highpass', 1800, 900, 1.1, 0.12, t + 0.03, dest);
      } else {
        this._gunshotLayer(t, dest, { heavy: false });
      }
      return;
    }

    // Default blade / sword
    this._swordSlashLayer(t, dest, { pitch: 1.0, heavy: false });
  }

  /**
   * Bespoke Multi-Layered SFX for ALL 16 Skills (supports both data.js IDs and spec aliases)
   */
  playSkillSfx(skillId = '', branch = 'martial') {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    const id = String(skillId || '').toLowerCase();

    switch (id) {
      // 1. 青城破风剑诀 — twin whistling steel sword slashes
      case 'sk_slash':
      case 'sk_qingcheng': {
        this._swordSlashLayer(t, dest, { pitch: 1.12, heavy: false });
        this._swordSlashLayer(t + 0.14, dest, { pitch: 0.94, heavy: true });
        return;
      }

      // 2. 降龙墨掌劲 — rising qi hum + thunderous sub-bass dragon palm shockwave
      case 'sk_palm':
      case 'sk_xianglong': {
        this._sfxTone(180, 620, 0.18, 'sine', 0.14, t, dest);
        this.playNoiseBurst(0.18, 'bandpass', 600, 1900, 2.2, 0.12, t, dest);
        this._sfxTone(155, 32, 0.48, 'sine', 0.34, t + 0.16, dest);
        this.playTaikoDrum(130, 0.34, t + 0.16, dest, 0.45);
        this.playNoiseBurst(0.38, 'lowpass', 950, 110, 0.9, 0.26, t + 0.16, dest);
        return;
      }

      // 3. 断钢裂甲枪 — piercing spear whistle + metallic armor-cracking crunch
      case 'sk_shatter':
      case 'sk_duangang': {
        this.playNoiseBurst(0.18, 'bandpass', 3600, 1200, 3.4, 0.22, t, dest);
        this._sfxTone(1900, 620, 0.14, 'triangle', 0.12, t, dest);
        this._voiceAnvilClang(ctx, dest, t + 0.13, 0.24);
        this.playNoiseBurst(0.22, 'bandpass', 2400, 340, 1.4, 0.24, t + 0.14, dest);
        this._sfxTone(170, 42, 0.26, 'sine', 0.26, t + 0.14, dest);
        return;
      }

      // 4. 万墨归宗剑 — 5-hit cascading sword-storm whooshes + grand bronze chord
      case 'sk_storm':
      case 'sk_wanmo': {
        const pitches = [1.22, 1.08, 1.32, 0.96, 0.85];
        pitches.forEach((p, i) => {
          this._swordSlashLayer(t + i * 0.085, dest, { pitch: p, heavy: i === 4 });
        });
        this.playBronzeBell(NOTE.D4, 1.5, 0.16, t + 0.42, dest, 0.55);
        this.playBronzeBell(NOTE.A4, 1.4, 0.12, t + 0.45, dest, 0.55);
        this.playBronzeBell(NOTE.D5, 1.3, 0.10, t + 0.48, dest, 0.55);
        return;
      }

      // 5. 火神加特林 — rotary barrel spin-up + 7 rapid-fire punchy machine-gun cracks
      case 'sk_burst':
      case 'sk_gatling': {
        this._sfxTone(120, 480, 0.18, 'sawtooth', 0.09, t, dest);
        for (let i = 0; i < 7; i++) {
          this._gunshotLayer(t + 0.15 + i * 0.058, dest, { heavy: false, punchVol: 0.20, crackVol: 0.21 });
        }
        return;
      }

      // 6. 散弹墨霰 — heavy low-end shotgun boom + pellet crackle
      case 'sk_shotgun': {
        this._gunshotLayer(t, dest, { heavy: true, punchVol: 0.34, crackVol: 0.30 });
        for (let i = 0; i < 4; i++) {
          this.playNoiseBurst(0.08, 'highpass', 2200 + i * 400, 1200, 1.6, 0.12, t + 0.04 + i * 0.032, dest);
        }
        return;
      }

      // 7. 反器材狙杀 — high-tech laser lock-on beep -> thunderous supersonic rifle shot + metallic echo
      case 'sk_snipe':
      case 'sk_sniper': {
        this._sfxTone(1680, 1680, 0.06, 'sine', 0.11, t, dest);
        this._sfxTone(2240, 2240, 0.08, 'sine', 0.13, t + 0.09, dest);
        this._gunshotLayer(t + 0.20, dest, { heavy: true, punchVol: 0.34, crackVol: 0.30 });
        this.playBronzeBell(1180, 0.55, 0.09, t + 0.23, dest, 0.55);
        this.playNoiseBurst(0.42, 'bandpass', 1500, 240, 1.3, 0.15, t + 0.24, dest);
        return;
      }

      // 8. 武装战隼空袭 — descending missile whistle -> massive double-stage artillery explosion
      case 'sk_airstrike': {
        this._sfxTone(2400, 380, 0.28, 'sine', 0.14, t, dest);
        this.playNoiseBurst(0.26, 'bandpass', 2800, 620, 3.2, 0.14, t, dest);
        this._explosionLayer(t + 0.26, dest, 1.0);
        this._explosionLayer(t + 0.46, dest, 1.25);
        return;
      }

      // 9. 重炮覆盖轰炸 / 墨甲重拳 — hydraulic servo whine + seismic iron smash
      case 'sk_cannon':
      case 'sk_mecha_fist': {
        this._sfxTone(220, 680, 0.14, 'sawtooth', 0.11, t, dest);
        this._voiceAnvilClang(ctx, dest, t + 0.14, 0.20);
        this._explosionLayer(t + 0.15, dest, 1.15);
        return;
      }

      // 10. 浮游炮齐射 / 微型制导齐射 — 4 staggered rocket whooshes + chain detonations
      case 'sk_bits':
      case 'sk_missile': {
        for (let i = 0; i < 4; i++) {
          const ot = t + i * 0.09;
          this.playNoiseBurst(0.14, 'bandpass', 1800 + i * 250, 620, 2.6, 0.15, ot, dest);
          this._sfxTone(980 + i * 120, 340, 0.12, 'sawtooth', 0.09, ot, dest);
          this._explosionLayer(ot + 0.13, dest, 0.65);
        }
        return;
      }

      // 11. 量子护盾超载 / 聚能激光 — capacitor whine charge-up (450->3200Hz) -> searing plasma beam
      case 'sk_overdrive':
      case 'sk_laser': {
        this._sfxTone(450, 3200, 0.26, 'sawtooth', 0.13, t, dest);
        this._sfxTone(225, 1600, 0.26, 'sine', 0.10, t, dest);
        // Searing continuous plasma beam buzz
        this._sfxTone(1800, 740, 0.42, 'sawtooth', 0.17, t + 0.25, dest);
        this._sfxTone(900, 370, 0.42, 'square', 0.10, t + 0.25, dest);
        this.playNoiseBurst(0.42, 'bandpass', 3200, 920, 2.5, 0.20, t + 0.25, dest);
        return;
      }

      // 12. 轨道电磁炮 / 轨道电磁脉冲 — sub-bass drop + crackling electromagnetic discharge wave
      case 'sk_railgun':
      case 'sk_emp': {
        this._sfxTone(320, 2600, 0.22, 'triangle', 0.12, t, dest);
        this._sfxTone(190, 28, 0.56, 'sine', 0.36, t + 0.20, dest);
        this.playNoiseBurst(0.48, 'bandpass', 4200, 320, 2.2, 0.24, t + 0.20, dest);
        for (let i = 0; i < 4; i++) {
          this.playNoiseBurst(0.06, 'highpass', 3400, 6200, 2.4, 0.15, t + 0.24 + i * 0.075, dest);
        }
        return;
      }

      // 13a. 符箓引雷诀 — crisp paper talisman snap + crackling electric bolt + rolling thunderclap
      case 'sk_thunder': {
        this.playNoiseBurst(0.055, 'highpass', 2800, 5200, 1.5, 0.18, t, dest);
        for (let i = 0; i < 3; i++) {
          this.playNoiseBurst(0.075, 'bandpass', 3800 - i * 600, 1100, 3.2, 0.19, t + 0.07 + i * 0.06, dest);
        }
        this._sfxTone(140, 32, 0.58, 'triangle', 0.30, t + 0.16, dest);
        this.playNoiseBurst(0.62, 'lowpass', 820, 95, 0.9, 0.26, t + 0.16, dest);
        return;
      }

      // 13b. 玄墨金钟罩 — resonant bronze temple bell + shimmering protective qi ring
      case 'sk_shield': {
        this.playBronzeBell(NOTE.D4, 1.6, 0.20, t, dest, 0.55);
        this.playBronzeBell(NOTE.A4, 1.4, 0.14, t + 0.06, dest, 0.55);
        this.playSciFiPad([NOTE.D4, NOTE.A4, NOTE.D5], 0.9, 0.12, t + 0.04, dest, 0.45);
        return;
      }

      // 14. 赤焰焚墨 / 九天炼火印 — rushing flame ignition roar + crystalline lotus chime
      case 'sk_fire':
      case 'sk_alchemy_fire': {
        this.playNoiseBurst(0.55, 'bandpass', 320, 1650, 1.2, 0.26, t, dest);
        this.playNoiseBurst(0.45, 'lowpass', 920, 160, 0.8, 0.22, t + 0.08, dest);
        this.playBronzeBell(NOTE.A5, 1.1, 0.12, t + 0.12, dest, 0.55);
        this.playBronzeBell(NOTE.E6, 0.95, 0.08, t + 0.20, dest, 0.55);
        return;
      }

      // 15a. 妖灵附体 — fierce spectral beast howl + twin claw slashes
      case 'sk_beast_fury': {
        this._sfxTone(240, 520, 0.24, 'sawtooth', 0.16, t, dest);
        this._sfxTone(520, 190, 0.26, 'sawtooth', 0.15, t + 0.22, dest);
        this.playNoiseBurst(0.14, 'bandpass', 2400, 620, 1.8, 0.22, t + 0.20, dest);
        this.playNoiseBurst(0.16, 'bandpass', 2800, 540, 1.8, 0.22, t + 0.34, dest);
        return;
      }

      // 15b. 回春青莲诀 — serene healing lotus harp arpeggio + soothing flute harmonic
      case 'sk_heal': {
        [NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.D5, NOTE.A5].forEach((f, i) => {
          this.pluckGuqin(f, 0.95, 0.13, t + i * 0.065, dest, 0.5, 0.01);
        });
        this.playXiaoFlute(NOTE.A5, 0.9, 0.11, t + 0.12, dest, 0.55);
        return;
      }

      // 16. 墨壶镇魂印 / 天工摄魂阵 — resonant bronze bell + swirling eerie harmonic pull
      case 'sk_crucible':
      case 'sk_soul_bind': {
        this.playBronzeBell(NOTE.D4, 1.7, 0.20, t, dest, 0.6);
        this._sfxTone(310, 880, 0.48, 'sine', 0.13, t + 0.06, dest);
        this._sfxTone(465, 1320, 0.48, 'triangle', 0.09, t + 0.06, dest);
        this.playNoiseBurst(0.52, 'bandpass', 480, 2200, 4.2, 0.18, t + 0.05, dest);
        return;
      }

      default:
        this.playCombatSfx(branch, true);
    }
  }

  /**
   * Creature / Mech / Demon Attack Foley SFX
   */
  playEnemyAttackSfx(enemyTpl = null) {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;

    const id = String(enemyTpl?.id || '').toLowerCase();
    const sp = String(enemyTpl?.spriteType || '').toLowerCase();
    const tag = `${id} ${sp}`;

    // 1) Quadruped beasts & slimes: guttural growl + snapping jaw bite + claw tear
    if (/rat|dog|slime|ratking|beast|wolf|hound/.test(tag)) {
      // Low guttural animal growl
      const growl = ctx.createOscillator();
      const gFilt = ctx.createBiquadFilter();
      const gg = ctx.createGain();
      growl.type = 'sawtooth';
      growl.frequency.setValueAtTime(118, t);
      growl.frequency.exponentialRampToValueAtTime(64, t + 0.24);
      gFilt.type = 'bandpass';
      gFilt.frequency.setValueAtTime(360, t);
      gFilt.Q.value = 3.2;
      gg.gain.setValueAtTime(0.0001, t);
      gg.gain.linearRampToValueAtTime(0.24, t + 0.03);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      growl.connect(gFilt);
      gFilt.connect(gg);
      gg.connect(dest);
      growl.start(t);
      growl.stop(t + 0.28);

      // Sharp snapping jaw bite + claw tear
      this.playNoiseBurst(0.085, 'bandpass', 2400, 620, 1.8, 0.24, t + 0.11, dest);
      this._sfxTone(280, 75, 0.09, 'triangle', 0.22, t + 0.11, dest);
      this.playNoiseBurst(0.12, 'highpass', 1900, 900, 1.4, 0.16, t + 0.18, dest);
      return;
    }

    // 2) Mechs / Gunners / Raiders / Turrets: servo clank + heavy mechanical gunfire/cannon
    if (/mech|drone|turret|raider|guard|zhurong|duangang|taotie|rakshasa/.test(tag)) {
      // Hydraulic servo clank
      this._sfxTone(190, 420, 0.08, 'sawtooth', 0.10, t, dest);
      this._voiceAnvilClang(ctx, dest, t + 0.05, 0.16);
      // Heavy mechanical gunfire / cannon impact
      this._gunshotLayer(t + 0.10, dest, { heavy: /boss|heavy|turret|zhurong|taotie/.test(tag), punchVol: 0.28, crackVol: 0.24 });
      return;
    }

    // 3) Demons / Mutants / Fox / Spirits: eerie spectral screech + dark qi burst
    const screech = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const sg = ctx.createGain();
    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(680, t);
    screech.frequency.exponentialRampToValueAtTime(1480, t + 0.12);
    screech.frequency.exponentialRampToValueAtTime(340, t + 0.34);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(34, t);
    modGain.gain.setValueAtTime(95, t);
    mod.connect(modGain);
    modGain.connect(screech.frequency);

    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1250, t);
    filt.Q.value = 2.6;

    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.linearRampToValueAtTime(0.18, t + 0.03);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);

    screech.connect(filt);
    filt.connect(sg);
    sg.connect(dest);
    screech.start(t);
    mod.start(t);
    screech.stop(t + 0.38);
    mod.stop(t + 0.38);

    // Dark qi burst
    this._sfxTone(145, 38, 0.28, 'sine', 0.24, t + 0.12, dest);
    this.playNoiseBurst(0.24, 'bandpass', 1400, 260, 1.6, 0.20, t + 0.12, dest);
  }

  /**
   * 3-Phase Soul Capture Crucible SFX ('throw' | 'vortex' | 'success' | 'fail')
   */
  playCaptureSfx(phase = 'throw') {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;

    if (phase === 'throw') {
      // Spinning bronze gourd whoosh + crisp bell
      this.playNoiseBurst(0.24, 'bandpass', 620, 2400, 2.6, 0.18, t, dest);
      this._sfxTone(380, 920, 0.18, 'triangle', 0.10, t, dest);
      this.playBronzeBell(NOTE.A5, 0.75, 0.13, t + 0.08, dest, 0.5);
      return;
    }

    if (phase === 'vortex') {
      // Continuous ~1.0s rising swirling wind-vortex + resonant bronze bowl hum
      if (this.noiseBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(340, t);
        bp.frequency.exponentialRampToValueAtTime(2200, t + 0.95);
        bp.Q.value = 4.2;

        // Swirl LFO
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(6.5, t);
        lfo.frequency.linearRampToValueAtTime(14.0, t + 0.95);
        lg.gain.setValueAtTime(240, t);
        lfo.connect(lg);
        lg.connect(bp.frequency);

        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.0001, t);
        ng.gain.linearRampToValueAtTime(0.22, t + 0.18);
        ng.gain.setValueAtTime(0.20, t + 0.75);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.02);

        src.connect(bp);
        bp.connect(ng);
        ng.connect(dest);
        src.start(t);
        lfo.start(t);
        src.stop(t + 1.05);
        lfo.stop(t + 1.05);
      }
      // Resonant bronze bowl hum rising in tension
      this._sfxTone(196, 392, 0.98, 'sine', 0.14, t, dest);
      this._sfxTone(294, 588, 0.98, 'triangle', 0.09, t, dest);
      this.playBronzeBell(NOTE.D4, 1.05, 0.14, t, dest, 0.55);
      return;
    }

    if (phase === 'success') {
      // Satisfying magical seal SNAP + triumphant golden pentatonic chime
      this._sfxTone(220, 48, 0.16, 'sine', 0.28, t, dest);
      this.playNoiseBurst(0.09, 'highpass', 2400, 5600, 1.8, 0.18, t, dest);
      [NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.D6].forEach((f, i) => {
        this.playBronzeBell(f, 1.2, 0.13, t + 0.07 + i * 0.085, dest, 0.55);
        this.pluckGuqin(f, 0.9, 0.11, t + 0.07 + i * 0.085, dest, 0.45, 0.01);
      });
      return;
    }

    // 'fail': shattering glass/energy crack + defiant monster growl
    this.playNoiseBurst(0.22, 'highpass', 3200, 1200, 1.4, 0.24, t, dest);
    [2980, 3640, 4420].forEach((f, i) => {
      this.playBronzeBell(f, 0.26, 0.08, t + i * 0.035, dest, 0.35);
    });
    this._sfxTone(155, 62, 0.34, 'sawtooth', 0.20, t + 0.09, dest);
    this.playNoiseBurst(0.26, 'bandpass', 720, 210, 2.2, 0.18, t + 0.10, dest);
  }

  /**
   * Backwards-compatible branch combat SFX wrapper
   */
  playCombatSfx(branch = 'martial', isHeavy = false) {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;

    if (branch === 'firearm') {
      this._gunshotLayer(t, dest, { heavy: isHeavy });
      if (isHeavy) this._explosionLayer(t + 0.05, dest, 0.8);
    } else if (branch === 'mecha') {
      this._plasmaSlashLayer(t, dest, isHeavy);
      if (isHeavy) this._explosionLayer(t + 0.1, dest, 0.85);
    } else if (branch === 'mystic') {
      this.playBronzeBell(NOTE.D5, isHeavy ? 1.1 : 0.65, 0.13, t, dest, 0.5);
      this.playNoiseBurst(0.16, 'bandpass', 2600, 720, 2.4, 0.15, t + 0.03, dest);
      if (isHeavy) this._sfxTone(130, 38, 0.38, 'triangle', 0.22, t + 0.05, dest);
    } else {
      this._swordSlashLayer(t, dest, { pitch: 1.0, heavy: isHeavy });
    }
  }

  // ==================== World, UI & Backwards-Compatible SFX ====================

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
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    const map = {
      common: [NOTE.A4, NOTE.D5],
      fine:   [NOTE.D5, NOTE.Fs5],
      rare:   [NOTE.D5, NOTE.A5, NOTE.D6],
      legend: [NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.D6]
    };
    const notes = map[quality] || map.common;
    notes.forEach((f, idx) => {
      if (quality === 'legend' || quality === 'rare') {
        this.playBronzeBell(f, 0.55, 0.085, t + idx * 0.06, dest, 0.45);
      } else {
        this.pluckGuqin(f, 0.35, 0.10, t + idx * 0.055, dest, 0.3, 0.008);
      }
    });
  }

  coin() {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    this.playBronzeBell(NOTE.B5, 0.24, 0.08, t, dest, 0.3);
    this.playBronzeBell(NOTE.E6, 0.36, 0.09, t + 0.065, dest, 0.35);
  }

  disassemble(success, crit = false) {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    if (!success) {
      this._sfxTone(190, 110, 0.18, 'sawtooth', 0.09, t, dest);
      this.playNoiseBurst(0.14, 'lowpass', 620, 180, 1.2, 0.10, t + 0.04, dest);
      return;
    }
    this._voiceAnvilClang(ctx, dest, t, 0.10);
    this.pluckGuqin(NOTE.A4, 0.35, 0.10, t + 0.06, dest, 0.3, 0);
    if (crit) {
      this.playBronzeBell(NOTE.A5, 0.55, 0.11, t + 0.12, dest, 0.45);
      this.playBronzeBell(NOTE.D6, 0.65, 0.10, t + 0.19, dest, 0.5);
    }
  }

  alarm() {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    this.playTaikoDrum(135, 0.28, t, dest, 0.32);
    this._sfxTone(540, 380, 0.16, 'sawtooth', 0.09, t, dest);
    this._sfxTone(380, 290, 0.18, 'sawtooth', 0.09, t + 0.14, dest);
  }

  geiger() {
    this.playTone(1800 + Math.random() * 600, 0.025, 'square', 0.03, 0);
  }

  ending() {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    [NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.D6].forEach((f, i) => {
      this.pluckGuqin(f, 1.0, 0.12, t + i * 0.11, dest, 0.48, 0.01);
      this.playBronzeBell(f, 1.1, 0.075, t + i * 0.11, dest, 0.5);
    });
  }

  footstep(surface = 'stone', stepIndex = 0) {
    if (this.muted || this.settings.sfxMuted || !this.settings.footstepsEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    const alt = (stepIndex % 2 === 0) ? 1.0 : 0.91;
    const pitch = alt * (0.96 + Math.random() * 0.08);

    if (surface === 'wood') {
      this._sfxTone(158 * pitch, 78 * pitch, 0.072, 'triangle', 0.062, now, dest);
      this._sfxTone(340 * pitch, 220 * pitch, 0.048, 'sine', 0.022, now, dest);
      this.playNoiseBurst(0.042, 'lowpass', 720 * pitch, 420 * pitch, 1.0, 0.024, now, dest);
      return;
    }

    if (surface === 'dirt') {
      this.playNoiseBurst(0.072, 'bandpass', 1450 * pitch, 980 * pitch, 1.4, 0.052, now, dest);
      this.playNoiseBurst(0.052, 'bandpass', 2550 * pitch, 1650 * pitch, 2.1, 0.028, now + 0.016, dest);
      this._sfxTone(112 * pitch, 62 * pitch, 0.048, 'sine', 0.026, now, dest);
      return;
    }

    if (surface === 'swamp') {
      this._sfxTone(106 * pitch, 52 * pitch, 0.09, 'sine', 0.046, now, dest);
      this.playNoiseBurst(0.105, 'bandpass', 920 * pitch, 320 * pitch, 3.6, 0.048, now, dest);
      return;
    }

    // Default 'stone'
    this.playNoiseBurst(0.046, 'bandpass', 1080 * pitch, 760 * pitch, 1.9, 0.048, now, dest);
    this._sfxTone(205 * pitch, 108 * pitch, 0.046, 'triangle', 0.04, now, dest);
  }

  uiTick() {
    if (this.muted || this.settings.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const dest = this.sfxMaster || ctx.destination;
    this._sfxTone(760, 520, 0.038, 'triangle', 0.034, now, dest);
    this._sfxTone(NOTE.D6, NOTE.D6, 0.088, 'sine', 0.02, now + 0.006, dest);
  }
}

export const sfx = new SoundEngine();
