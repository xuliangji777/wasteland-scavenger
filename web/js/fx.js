// ==================== Canvas 大气天气与粒子特效引擎 ====================
class FxEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.ambient = [];
    this.bursts = [];
    this.weatherId = 0;
    this.running = false;
  }

  init() {
    this.canvas = document.getElementById('fx-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.seedAmbient();
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(() => this.loop());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setWeather(weatherId) {
    this.weatherId = weatherId;
    this.seedAmbient();
  }

  seedAmbient() {
    this.ambient = [];
    const count = this.weatherId === 2 ? 75 : 45;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    for (let i = 0; i < count; i++) {
      this.ambient.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: this.weatherId === 2 ? 1.2 : (1 + Math.random() * 2.2),
        vx: this.weatherId === 1 ? (0.8 + Math.random() * 1.4) : (-0.3 + Math.random() * 0.6),
        vy: this.weatherId === 2 ? (5 + Math.random() * 4) : (-0.4 + Math.random() * 0.7),
        alpha: 0.18 + Math.random() * 0.45
      });
    }
  }

  burst(x, y, color = '#fbbf24', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.6 + Math.random() * 3.8;
      this.bursts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 2.5,
        color,
        life: 1
      });
    }
  }

  loop() {
    if (!this.ctx || !this.canvas) return;
    const { width: w, height: h } = this.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // 环境天气粒子
    const colorMap = {
      0: 'rgba(226, 232, 240, ',
      1: 'rgba(163, 230, 53, ',
      2: 'rgba(56, 189, 248, ',
      3: 'rgba(251, 146, 60, ',
      4: 'rgba(203, 213, 225, '
    };
    const prefix = colorMap[this.weatherId] || colorMap[0];

    for (const p of this.ambient) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > w + 10) p.x = -10;
      if (p.x < -10) p.x = w + 10;
      if (p.y > h + 10) p.y = -10;
      if (p.y < -10) p.y = h + 10;

      ctx.fillStyle = `${prefix}${p.alpha})`;
      if (this.weatherId === 2) {
        ctx.fillRect(p.x, p.y, 1.4, 11);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 拾取/暴击爆发粒子
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.08;
      b.life -= 0.032;
      if (b.life <= 0) {
        this.bursts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = b.life;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(() => this.loop());
  }
}

export const fx = new FxEngine();

export function spawnFloatText(x, y, text, color = '#fbbf24') {
  const layer = document.getElementById('float-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'float-text';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.textContent = text;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

export function triggerScreenShake() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  shell.classList.remove('screen-shake');
  void shell.offsetWidth;
  shell.classList.add('screen-shake');
}
