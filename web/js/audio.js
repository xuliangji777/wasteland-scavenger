// ==================== Web Audio 合成音效引擎 ====================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.08, delay = 0) {
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
    gain.connect(ctx.destination);
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
}

export const sfx = new SoundEngine();
