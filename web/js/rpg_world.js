import { ASSETS, QUALITY, ENEMIES, NPCS, WEATHERS } from './data.js';

// ==================== 工具函数 ====================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function resolveBgPath(bgAsset) {
  if (!bgAsset) return null;
  if (bgAsset.startsWith('assets/') || bgAsset.startsWith('/') || bgAsset.startsWith('http')) {
    return bgAsset;
  }
  return `assets/${bgAsset}`;
}

function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
  const nearestX = clamp(cx, rx, rx + rw);
  const nearestY = clamp(cy, ry, ry + rh);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return (dx * dx + dy * dy) < (r * r);
}

// ==================== 2.5D 水墨俯斜视角世界引擎 ====================
export class InkWorldEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} callbacks
   *   - getMoveSpeed?: () => number (px/sec, or legacy <25 px/frame)
   *   - getNpcData?: (npcId: string) => Object
   *   - onNearestChange?: (target: Object|null) => void
   *   - onInteract?: (target: Object) => void
   *   - onEncounter?: (enemy: Object) => void
   *   - onCameraMove?: (cameraX: number, cameraY: number) => void
   */
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cb = callbacks;

    this.map = null;
    this.weatherId = 0;
    this.paused = false;
    this.rafId = null;
    this._lastTime = 0;
    this._elapsed = 0;

    // 视图尺寸与摄像机
    this.viewW = 960;
    this.viewH = 540;
    this.cameraX = 0;
    this.cameraY = 0;

    // 切图墨晕转场 (0..1)
    this._fadeAlpha = 0;

    // 背景图缓存
    this._bgCache = new Map();
    this._preloadBackgrounds();

    // 主角状态（接地坐标 x, y）
    this.hero = {
      x: 800,
      y: 515,
      r: 16,
      dirX: 0,
      dirY: 1,
      facing: 'down', // 'down' | 'up' | 'left' | 'right'
      lastSide: 1,    // 1 右, -1 左
      walkPhase: 0,
      moving: false,
      targetX: null,
      targetY: null,
      weaponType: 'blade',
      _stuckFrames: 0
    };

    // 护驾灵兽跟随状态
    this.guardian = null;
    this.guardianPos = { x: 760, y: 515, phase: 0 };

    // 输入状态
    this.keys = { up: false, down: false, left: false, right: false };

    // 地面点击墨纹标记
    this.clickRipples = [];

    // 地图动态实体
    this.lootNodes = [];
    this.enemies = [];
    this.savePoint = null;
    this.particles = [];
    this.nearestTarget = null;
    this._encounterCooldown = 0;

    this._onResize = () => this.resize();
    this._onOrientationChange = () => {
      this.resize();
      setTimeout(() => this.resize(), 120);
    };
    this._onKeyDown = (e) => this._handleKeyDown(e);
    this._onKeyUp = (e) => this._handleKeyUp(e);
    this._onBlur = () => this._clearKeys();
    this._activeCanvasPointerId = null;
    this._onPointerDown = (e) => this._handlePointerDown(e);
    this._onPointerMove = (e) => this._handlePointerMove(e);
    this._onPointerUp = (e) => this._handlePointerUp(e);

    // 阻止 Android WebView 触摸画布时触发页面滚动/缩放
    this.canvas.style.touchAction = 'none';

    this.resize();
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onOrientationChange);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    this.canvas.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    this.canvas.addEventListener('pointermove', this._onPointerMove, { passive: false });
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
  }

  // ==================== 公共 API ====================

  /**
   * 加载 2.5D 地图
   * @param {Object} map - MAPS 中的地图配置
   * @param {Object} [opts]
   *   - weatherId?: number
   *   - lootNodes?: Array
   *   - enemies?: Array
   *   - spawnX?: number
   *   - spawnY?: number
   *   - guardian?: Object|null
   *   - heroWeaponType?: string
   */
  loadMap(map, opts = {}) {
    if (!map) return;
    this.map = map;
    this.weatherId = opts.weatherId ?? (map.weatherPool?.[0] ?? 0);
    if (opts.guardian !== undefined) {
      this.guardian = opts.guardian;
    }
    if (opts.heroWeaponType !== undefined) {
      this.hero.weaponType = opts.heroWeaponType;
    }

    const sx = opts.spawnX ?? map.spawn?.x ?? map.width * 0.5;
    const sy = opts.spawnY ?? map.spawn?.y ?? map.height * 0.5;
    this.hero.x = clamp(sx, 28, map.width - 28);
    this.hero.y = clamp(sy, 40, map.height - 28);
    this.hero.targetX = null;
    this.hero.targetY = null;
    this.hero.moving = false;
    this.hero._stuckFrames = 0;
    this._clearKeys();

    this.guardianPos.x = this.hero.x - 36;
    this.guardianPos.y = this.hero.y + 8;

    // 预加载当前地图背景
    const bgPath = resolveBgPath(map.bgAsset);
    if (bgPath) this._getBgImage(bgPath);

    // 搜刮点与残骸
    if (Array.isArray(opts.lootNodes)) {
      this.lootNodes = opts.lootNodes;
    } else {
      this.lootNodes = (map.lootZones || []).map((z) => ({
        ...z,
        collected: false,
        respawnAt: 0
      }));
    }

    // 巡逻敌人与 Boss
    if (Array.isArray(opts.enemies)) {
      this.enemies = opts.enemies.map((e) => this._normalizeEnemy(e));
    } else {
      const list = [];
      for (const sp of map.enemySpawns || []) {
        const tpl = ENEMIES[sp.enemyId];
        if (!tpl) continue;
        list.push(this._createEnemyFromSpawn(sp, tpl));
      }
      if (map.bossSpawn) {
        const tpl = ENEMIES[map.bossSpawn.enemyId];
        if (tpl) list.push(this._createEnemyFromSpawn(map.bossSpawn, tpl));
      }
      this.enemies = list;
    }

    this.clickRipples = [];
    this.savePoint = this._computeSavePoint(map);
    this.nearestTarget = null;
    this.cb.onNearestChange?.(null);
    this._encounterCooldown = 0.8;
    this._fadeAlpha = 1;

    // 立即定位摄像机
    this._snapCamera();
    this.seedWeatherParticles();
    this.detectNearest();
  }

  /** 切换当前地图天气 */
  setWeather(wid) {
    this.weatherId = wid ?? 0;
    this.seedWeatherParticles();
  }

  /** 设置当前出战护驾灵兽（传 null 取消） */
  setGuardian(guardian) {
    this.guardian = guardian || null;
    if (this.guardian) {
      this.guardianPos.x = this.hero.x - this.hero.lastSide * 38;
      this.guardianPos.y = this.hero.y + 6;
    }
  }

  /** 可选：设置主角外观武器类型 */
  setHeroWeapon(weaponType) {
    this.hero.weaponType = weaponType || 'blade';
  }

  /** 供移动端虚拟十字键调用：dir 为 'up' | 'down' | 'left' | 'right' */
  setKey(dir, pressed) {
    if (!(dir in this.keys)) return;
    this.keys[dir] = Boolean(pressed);
    if (pressed) {
      this.hero.targetX = null;
      this.hero.targetY = null;
    }
  }

  /**
   * 便捷绑定移动端多点触控 D-Pad 按钮（防滚动、支持双键斜向按住、失焦自动释放）
   * @param {HTMLElement} el
   * @param {'up'|'down'|'left'|'right'} dir
   */
  bindDpadButton(el, dir) {
    if (!el || !(dir in this.keys)) return;
    el.style.touchAction = 'none';
    const release = () => {
      this.setKey(dir, false);
      el.classList.remove('active');
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.cancelable) e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('active');
      this.setKey(dir, true);
    }, { passive: false });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
  }

  /** 设置遇敌冷却（秒），如战斗撤退后防止立刻再次撞怪 */
  setEncounterCooldown(seconds = 1.6) {
    this._encounterCooldown = Math.max(0, seconds);
  }

  /** 手动触发当前最近目标交互 */
  triggerInteract() {
    if (this.paused || !this.nearestTarget) return false;
    this.cb.onInteract?.(this.nearestTarget);
    return true;
  }

  /** 启动主循环 */
  start() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this._lastTime) / 1000));
      this._lastTime = now;
      this._elapsed += dt;
      this.update(dt);
      this.draw();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  /** 停止主循环 */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** 适配画布 DPR 与父容器尺寸 */
  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = Math.max(320, Math.floor(rect.width));
    this.viewH = Math.max(240, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.viewW * dpr);
    this.canvas.height = Math.floor(this.viewH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.map) this._snapCamera();
  }

  // ==================== 资源与初始化辅助 ====================

  _preloadBackgrounds() {
    for (const [key, path] of Object.entries(ASSETS)) {
      if (key.startsWith('bg_')) {
        this._getBgImage(path);
      }
    }
  }

  _getBgImage(path) {
    if (!path) return null;
    let entry = this._bgCache.get(path);
    if (!entry) {
      const img = new Image();
      entry = { img, loaded: false, error: false };
      img.onload = () => { entry.loaded = true; };
      img.onerror = () => { entry.error = true; };
      img.src = path;
      this._bgCache.set(path, entry);
    }
    return entry;
  }

  _createEnemyFromSpawn(sp, tpl) {
    const angle = Math.random() * Math.PI * 2;
    return {
      id: `${sp.enemyId}_${Math.round(sp.x)}_${Math.round(sp.y)}`,
      enemyId: sp.enemyId,
      data: tpl,
      x: sp.x,
      y: sp.y,
      homeX: sp.x,
      homeY: sp.y,
      patrolR: sp.patrolR ?? 100,
      speed: sp.speed ?? 80,
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      facing: Math.cos(angle) >= 0 ? 1 : -1,
      aiTimer: 1 + Math.random() * 2,
      aiPause: 0,
      phase: Math.random() * Math.PI * 2,
      hp: tpl.hp,
      maxHp: tpl.hp,
      alive: true,
      respawnTimer: 0
    };
  }

  _normalizeEnemy(e) {
    const tpl = e.data || ENEMIES[e.enemyId] || ENEMIES.rat;
    const x = e.x ?? 400;
    const y = e.y ?? 400;
    const angle = Math.random() * Math.PI * 2;
    return {
      ...e,
      data: tpl,
      x,
      y,
      homeX: e.homeX ?? x,
      homeY: e.homeY ?? y,
      patrolR: e.patrolR ?? 105,
      speed: e.speed ?? 82,
      vx: e.vx ?? Math.cos(angle),
      vy: e.vy ?? Math.sin(angle),
      facing: e.facing ?? 1,
      aiTimer: e.aiTimer ?? (1 + Math.random() * 2),
      aiPause: e.aiPause ?? 0,
      phase: e.phase ?? Math.random() * Math.PI * 2,
      hp: e.hp ?? tpl.hp,
      maxHp: e.maxHp ?? tpl.hp,
      alive: e.alive !== false,
      respawnTimer: e.respawnTimer ?? 0
    };
  }

  // ==================== 输入处理 ====================

  _clearKeys() {
    this.keys.up = false;
    this.keys.down = false;
    this.keys.left = false;
    this.keys.right = false;
  }

  _handleKeyDown(e) {
    if (this.paused) return;
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      this.setKey('up', true);
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      this.setKey('down', true);
    } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      this.setKey('left', true);
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      this.setKey('right', true);
    } else if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter') {
      if (this.nearestTarget) {
        e.preventDefault();
        this.cb.onInteract?.(this.nearestTarget);
      }
    }
  }

  _handleKeyUp(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') this.keys.up = false;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') this.keys.down = false;
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.keys.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.keys.right = false;
  }

  _handlePointerDown(e) {
    if (e.cancelable) e.preventDefault();
    if (this.paused || !this.map) return;
    if (this._activeCanvasPointerId !== null && this._activeCanvasPointerId !== e.pointerId) return;

    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // 忽略点击在右上角小地图区域内
    const mm = this._getMinimapRect();
    if (sx >= mm.x && sx <= mm.x + mm.w && sy >= mm.y && sy <= mm.y + mm.h) {
      return;
    }

    const wx = clamp(sx + this.cameraX, 24, this.map.width - 24);
    const wy = clamp(sy + this.cameraY, 36, this.map.height - 24);

    // 若点击位置就在当前最近可交互目标附近，且主角已足够近，则直接交互
    if (this.nearestTarget && dist(wx, wy, this.nearestTarget.x, this.nearestTarget.y) <= 48) {
      if (dist(this.hero.x, this.hero.y, this.nearestTarget.x, this.nearestTarget.y) <= 74) {
        this.cb.onInteract?.(this.nearestTarget);
        return;
      }
    }

    this._activeCanvasPointerId = e.pointerId;
    this.canvas.setPointerCapture?.(e.pointerId);
    this.hero.targetX = wx;
    this.hero.targetY = wy;
    this.hero._stuckFrames = 0;

    // 生成地面水墨涟漪标记
    this.clickRipples.push({ x: wx, y: wy, age: 0, maxAge: 0.72 });
    if (this.clickRipples.length > 6) this.clickRipples.shift();
  }

  _handlePointerMove(e) {
    if (this._activeCanvasPointerId !== e.pointerId || this.paused || !this.map) return;
    if (e.cancelable) e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.hero.targetX = clamp(sx + this.cameraX, 24, this.map.width - 24);
    this.hero.targetY = clamp(sy + this.cameraY, 36, this.map.height - 24);
    this.hero._stuckFrames = 0;
  }

  _handlePointerUp(e) {
    if (this._activeCanvasPointerId === e.pointerId) {
      this._activeCanvasPointerId = null;
    }
  }

  // ==================== 物理更新与碰撞 ====================

  _getHeroSpeedPxPerSec() {
    if (typeof this.cb.getMoveSpeed === 'function') {
      const val = Number(this.cb.getMoveSpeed());
      if (Number.isFinite(val) && val > 0) {
        return val < 25 ? val * 60 : val;
      }
    }
    return 220;
  }

  _collidesAt(cx, cy, r) {
    if (!this.map) return false;
    for (const b of this.map.buildings || []) {
      if (circleIntersectsRect(cx, cy, r, b.x, b.y, b.w, b.h)) return true;
    }
    for (const o of this.map.obstacles || []) {
      if (circleIntersectsRect(cx, cy, r, o.x, o.y, o.w, o.h)) return true;
    }
    return false;
  }

  _moveWithSlide(entity, dx, dy, r) {
    const map = this.map;
    let nx = clamp(entity.x + dx, 24, map.width - 24);
    if (!this._collidesAt(nx, entity.y, r)) {
      entity.x = nx;
    }
    let ny = clamp(entity.y + dy, 36, map.height - 24);
    if (!this._collidesAt(entity.x, ny, r)) {
      entity.y = ny;
    }
  }

  _snapCamera() {
    if (!this.map) return;
    if (this.map.width <= this.viewW) {
      this.cameraX = (this.map.width - this.viewW) * 0.5;
    } else {
      this.cameraX = clamp(this.hero.x - this.viewW * 0.5, 0, this.map.width - this.viewW);
    }
    if (this.map.height <= this.viewH) {
      this.cameraY = (this.map.height - this.viewH) * 0.5;
    } else {
      this.cameraY = clamp((this.hero.y - 24) - this.viewH * 0.5, 0, this.map.height - this.viewH);
    }
  }

  update(dt) {
    if (!this.map) return;

    // 切图墨晕渐隐 (220ms)
    if (this._fadeAlpha > 0) {
      this._fadeAlpha = Math.max(0, this._fadeAlpha - dt / 0.22);
    }

    if (this._encounterCooldown > 0) {
      this._encounterCooldown = Math.max(0, this._encounterCooldown - dt);
    }

    // 地面点击涟漪更新
    for (let i = this.clickRipples.length - 1; i >= 0; i--) {
      this.clickRipples[i].age += dt;
      if (this.clickRipples[i].age >= this.clickRipples[i].maxAge) {
        this.clickRipples.splice(i, 1);
      }
    }

    if (!this.paused) {
      this._updateHero(dt);
      this._updateGuardian(dt);
      this._updateEnemies(dt);
    }

    // 摄像机平滑跟随
    const targetCamX = this.map.width <= this.viewW
      ? (this.map.width - this.viewW) * 0.5
      : clamp(this.hero.x - this.viewW * 0.5, 0, this.map.width - this.viewW);
    const targetCamY = this.map.height <= this.viewH
      ? (this.map.height - this.viewH) * 0.5
      : clamp((this.hero.y - 24) - this.viewH * 0.5, 0, this.map.height - this.viewH);

    const lerpFactor = 1 - Math.pow(1 - 0.12, dt * 60);
    this.cameraX += (targetCamX - this.cameraX) * lerpFactor;
    this.cameraY += (targetCamY - this.cameraY) * lerpFactor;
    this.cb.onCameraMove?.(this.cameraX, this.cameraY);

    this.detectNearest();
    this._updateWeatherParticles(dt);
  }

  _updateHero(dt) {
    const h = this.hero;
    let ix = 0;
    let iy = 0;
    if (this.keys.left) ix -= 1;
    if (this.keys.right) ix += 1;
    if (this.keys.up) iy -= 1;
    if (this.keys.down) iy += 1;

    if (ix !== 0 || iy !== 0) {
      const len = Math.hypot(ix, iy);
      ix /= len;
      iy /= len;
    } else if (h.targetX !== null && h.targetY !== null) {
      const dx = h.targetX - h.x;
      const dy = h.targetY - h.y;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        ix = dx / d;
        iy = dy / d;
      } else {
        h.targetX = null;
        h.targetY = null;
      }
    }

    if (ix !== 0 || iy !== 0) {
      const speed = this._getHeroSpeedPxPerSec();
      const prevX = h.x;
      const prevY = h.y;

      this._moveWithSlide(h, ix * speed * dt, iy * speed * dt, h.r);

      const moved = Math.hypot(h.x - prevX, h.y - prevY);
      h.moving = moved > 0.25;
      h.dirX = ix;
      h.dirY = iy;
      if (Math.abs(ix) >= Math.abs(iy)) {
        h.facing = ix > 0 ? 'right' : 'left';
        h.lastSide = ix > 0 ? 1 : -1;
      } else {
        h.facing = iy > 0 ? 'down' : 'up';
      }

      if (h.moving) {
        h.walkPhase += dt * 11.5;
        h._stuckFrames = 0;
      } else if (h.targetX !== null) {
        h._stuckFrames += 1;
        if (h._stuckFrames > 14) {
          h.targetX = null;
          h.targetY = null;
          h._stuckFrames = 0;
        }
      }
    } else {
      h.moving = false;
      h.walkPhase *= 0.84;
    }
  }

  _updateGuardian(dt) {
    if (!this.guardian) return;
    const h = this.hero;
    const followDist = 42;
    const desiredX = h.x - (h.dirX || h.lastSide) * followDist;
    const desiredY = h.y - (h.dirY || 0) * (followDist * 0.65) - 6;
    const lerp = 1 - Math.pow(1 - 0.08, dt * 60);
    this.guardianPos.x += (desiredX - this.guardianPos.x) * lerp;
    this.guardianPos.y += (desiredY - this.guardianPos.y) * lerp;
    this.guardianPos.phase += dt * 3.8;
  }

  _updateEnemies(dt) {
    for (const en of this.enemies) {
      if (!en.alive) {
        if (en.respawnTimer > 0) {
          en.respawnTimer -= dt;
          if (en.respawnTimer <= 0) {
            en.alive = true;
            en.hp = en.maxHp;
            en.x = en.homeX;
            en.y = en.homeY;
          }
        }
        continue;
      }

      en.phase += dt * 4.5;
      en.aiTimer -= dt;
      if (en.aiPause > 0) {
        en.aiPause -= dt;
      } else {
        if (en.aiTimer <= 0) {
          en.aiTimer = 1.4 + Math.random() * 2.2;
          if (Math.random() < 0.25) {
            en.aiPause = 0.5 + Math.random() * 0.7;
          } else {
            const toHomeDist = dist(en.x, en.y, en.homeX, en.homeY);
            let angle;
            if (toHomeDist > en.patrolR * 0.82) {
              angle = Math.atan2(en.homeY - en.y, en.homeX - en.x) + (Math.random() - 0.5) * 0.8;
            } else {
              angle = Math.random() * Math.PI * 2;
            }
            en.vx = Math.cos(angle);
            en.vy = Math.sin(angle);
          }
        }

        const spd = en.speed > 20 ? en.speed * 0.78 : en.speed * 45;
        const px = en.x;
        const py = en.y;
        this._moveWithSlide(en, en.vx * spd * dt, en.vy * spd * dt, 16);

        // 若撞墙或越界，反向
        if (dist(en.x, en.y, px, py) < 0.2 || dist(en.x, en.y, en.homeX, en.homeY) > en.patrolR + 18) {
          en.vx = -en.vx;
          en.vy = -en.vy;
          en.aiTimer = 0.5;
        }
        if (Math.abs(en.vx) > 0.12) {
          en.facing = en.vx >= 0 ? 1 : -1;
        }
      }

      // 遇敌判定
      if (this._encounterCooldown <= 0) {
        const hitR = en.data?.isBoss ? 52 : 38;
        if (dist(en.x, en.y, this.hero.x, this.hero.y) < hitR) {
          this._clearKeys();
          this.hero.targetX = null;
          this.hero.targetY = null;
          this._encounterCooldown = 1.6;
          this.cb.onEncounter?.(en);
          break;
        }
      }
    }
  }

  // ==================== 最近可交互目标检测 ====================

  detectNearest() {
    if (!this.map) return;
    let best = null;
    let bestDist = 72;
    const hx = this.hero.x;
    const hy = this.hero.y;

    // 1. 墨石记录碑（存档点）
    if (this.savePoint) {
      const sp = this.savePoint;
      const d = dist(hx, hy, sp.x, sp.y);
      if (d < bestDist) {
        bestDist = d;
        best = {
          type: 'save_point',
          x: sp.x,
          y: sp.y,
          label: sp.label
        };
      }
    }

    // 2. 建筑门前
    for (const b of this.map.buildings || []) {
      const dx = b.doorX ?? (b.x + b.w * 0.5);
      const dy = b.doorY ?? (b.y + b.h + 18);
      const d = dist(hx, hy, dx, dy);
      if (d < bestDist) {
        bestDist = d;
        best = {
          type: 'building',
          building: b,
          action: b.action,
          x: dx,
          y: dy,
          label: b.action === 'enter_map' ? `步入 ${b.name}` : `进入 ${b.name}`
        };
      }
    }

    // 2. NPC
    if (this.map.npc && this.map.npc.id) {
      const npcRef = this.map.npc;
      const npcData = this._getNpcData(npcRef.id);
      const d = dist(hx, hy, npcRef.x, npcRef.y);
      if (d < bestDist) {
        bestDist = d;
        best = {
          type: 'npc',
          npcId: npcRef.id,
          npc: npcData,
          x: npcRef.x,
          y: npcRef.y,
          label: `交谈 · ${npcData?.name || '行者'}`
        };
      }
    }

    // 3. 传送阵
    for (const p of this.map.portals || []) {
      const pr = Math.max(bestDist, (p.r || 42) + 24);
      const d = dist(hx, hy, p.x, p.y);
      if (d < Math.min(bestDist, pr)) {
        bestDist = d;
        best = {
          type: 'portal',
          portal: p,
          x: p.x,
          y: p.y,
          label: p.label || '传送'
        };
      }
    }

    // 4. 搜刮点与残骸
    for (const node of this.lootNodes) {
      if (node.collected) continue;
      const d = dist(hx, hy, node.x, node.y);
      if (d < bestDist) {
        bestDist = d;
        const isHeavy = node.type === 'abandoned_cannon' || node.type === 'mech_wreck';
        const title = node.name || node.item?.name || '物资';
        best = {
          type: 'loot',
          node,
          x: node.x,
          y: node.y,
          label: isHeavy ? `拆解 · ${title}` : `搜寻 · ${title}`
        };
      }
    }

    const prev = this.nearestTarget;
    const changed = !prev !== !best ||
      (prev && best && (prev.type !== best.type || prev.x !== best.x || prev.y !== best.y || prev.label !== best.label));
    this.nearestTarget = best;
    if (changed) {
      this.cb.onNearestChange?.(best);
    }
  }

  _getNpcData(npcId) {
    if (typeof this.cb.getNpcData === 'function') {
      const custom = this.cb.getNpcData(npcId);
      if (custom) return custom;
    }
    return NPCS[npcId] || null;
  }

  /**
   * 自动在主城、野外与洞窟/首领地图生成不重叠的「墨石记录碑」存档点
   */
  _computeSavePoint(map) {
    if (!map) return null;
    if (map.sceneType === 'interior') return null;

    const isClear = (cx, cy) => {
      if (cx < 64 || cx > map.width - 64 || cy < 84 || cy > map.height - 64) return false;
      if (this._collidesAt(cx, cy, 28)) return false;
      for (const p of map.portals || []) {
        if (dist(cx, cy, p.x, p.y) < 62) return false;
      }
      if (map.npc && dist(cx, cy, map.npc.x, map.npc.y) < 60) return false;
      return true;
    };

    let candidates;
    if (map.id === 'town') {
      candidates = [
        [780, 540],
        [720, 540],
        [860, 540]
      ];
    } else {
      const sx = map.spawn?.x ?? map.width * 0.5;
      const sy = map.spawn?.y ?? map.height * 0.5;
      candidates = [
        [sx + 110, sy - 20],
        [sx + 110, sy + 40],
        [sx - 110, sy - 20],
        [sx + 80, sy - 75],
        [sx + 80, sy + 75],
        [sx, sy - 85]
      ];
    }

    for (const [rawX, rawY] of candidates) {
      const cx = clamp(rawX, 64, map.width - 64);
      const cy = clamp(rawY, 84, map.height - 64);
      if (isClear(cx, cy)) {
        return {
          type: 'save_point',
          x: cx,
          y: cy,
          label: '墨石记录碑 · 存档'
        };
      }
    }

    const fallbackX = clamp((map.spawn?.x ?? 200) + 96, 64, map.width - 64);
    const fallbackY = clamp((map.spawn?.y ?? 300) - 16, 84, map.height - 64);
    return {
      type: 'save_point',
      x: fallbackX,
      y: fallbackY,
      label: '墨石记录碑 · 存档'
    };
  }

  // ==================== 天气粒子系统 ====================

  seedWeatherParticles() {
    this.particles = [];
    if (!this.map) return;
    const scene = this.map.sceneType;
    const pType = scene === 'interior'
      ? 'mote'
      : scene === 'cave'
        ? 'cave_mote'
        : (WEATHERS[this.weatherId]?.particleType || 'leaf');

    const countMap = { rain: 85, sand: 68, rad: 56, heat: 36, leaf: 30, mote: 24, cave_mote: 34 };
    const count = countMap[pType] || 32;
    const w = this.viewW || 960;
    const h = this.viewH || 540;

    for (let i = 0; i < count; i++) {
      this.particles.push(this._makeParticle(pType, w, h, true));
    }
  }

  _makeParticle(pType, w, h, randomPos) {
    const x = randomPos ? Math.random() * w : (pType === 'sand' ? w + 10 : Math.random() * w);
    const y = randomPos ? Math.random() * h : (pType === 'heat' ? h + 10 : -10);
    if (pType === 'rain') {
      return { type: pType, x, y, vx: -110 - Math.random() * 45, vy: 430 + Math.random() * 160, len: 12 + Math.random() * 10, r: 1.2, a: 0.28 + Math.random() * 0.35 };
    }
    if (pType === 'sand') {
      return { type: pType, x, y, vx: -220 - Math.random() * 140, vy: 28 + Math.random() * 35, r: 1.4 + Math.random() * 2.2, a: 0.25 + Math.random() * 0.4 };
    }
    if (pType === 'rad') {
      return { type: pType, x, y, vx: -22 + Math.random() * 44, vy: -12 + Math.random() * 32, r: 1.6 + Math.random() * 2.8, a: 0.25 + Math.random() * 0.45, phase: Math.random() * 6.28 };
    }
    if (pType === 'heat') {
      return { type: pType, x, y, vx: -12 + Math.random() * 24, vy: -48 - Math.random() * 40, r: 1.5 + Math.random() * 2.4, a: 0.22 + Math.random() * 0.42, phase: Math.random() * 6.28 };
    }
    if (pType === 'leaf') {
      return { type: pType, x, y, vx: -28 - Math.random() * 24, vy: 22 + Math.random() * 24, r: 2.8 + Math.random() * 2.2, a: 0.35 + Math.random() * 0.4, phase: Math.random() * 6.28 };
    }
    // mote / cave_mote
    return { type: pType, x, y, vx: -8 + Math.random() * 16, vy: -10 + Math.random() * 20, r: 1.2 + Math.random() * 2.1, a: 0.18 + Math.random() * 0.36, phase: Math.random() * 6.28 };
  }

  _updateWeatherParticles(dt) {
    const w = this.viewW;
    const h = this.viewH;
    for (const p of this.particles) {
      if (p.phase !== undefined) {
        p.phase += dt * 2.4;
        p.x += (p.vx + Math.sin(p.phase) * 16) * dt;
      } else {
        p.x += p.vx * dt;
      }
      p.y += p.vy * dt;

      if (p.x < -20) p.x = w + 16;
      if (p.x > w + 20) p.x = -16;
      if (p.y > h + 20) {
        p.y = -12;
        p.x = Math.random() * w;
      } else if (p.y < -20) {
        p.y = h + 12;
        p.x = Math.random() * w;
      }
    }
  }

  // ==================== 主渲染管线（四层 Y-Depth 排序） ====================

  draw() {
    if (!this.map) return;
    const ctx = this.ctx;
    const w = this.viewW;
    const h = this.viewH;

    // 宣纸焦墨外框底色（室内小图居中时可见）
    ctx.fillStyle = '#181512';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // ---------- 第一层：手绘地图底图 + 色罩 + 地面光纹与点击涟漪 ----------
    this._drawMapBackground(ctx);
    this._drawGroundLayer(ctx);

    // ---------- 第二层：统一 Y-Depth 排序实体层 ----------
    const renderables = this._collectRenderables();
    renderables.sort((a, b) => a.sortY - b.sortY);
    for (const item of renderables) {
      item.draw(ctx);
    }

    // ---------- 第四层（世界坐标）：最近可交互宣纸浮动提示 ----------
    if (this.nearestTarget) {
      this._drawInteractHint(ctx, this.nearestTarget);
    }

    ctx.restore();

    // ---------- 第三层（屏幕坐标）：天气粒子 + 水墨暗角 + 小地图 + 转场 ----------
    this._drawWeatherParticles(ctx);
    this._drawInkVignette(ctx, w, h);
    this._drawMinimap(ctx);

    if (this._fadeAlpha > 0) {
      ctx.fillStyle = `rgba(20, 17, 14, ${this._fadeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _drawMapBackground(ctx) {
    const map = this.map;
    const mw = map.width;
    const mh = map.height;
    const bgPath = resolveBgPath(map.bgAsset);
    const entry = bgPath ? this._getBgImage(bgPath) : null;

    if (entry && entry.loaded && !entry.error) {
      ctx.drawImage(entry.img, 0, 0, mw, mh);
    } else {
      // 加载中或回退宣纸墨地底纹
      const pal = map.palette || {};
      const grad = ctx.createLinearGradient(0, 0, 0, mh);
      grad.addColorStop(0, pal.ground || '#7e6e58');
      grad.addColorStop(1, pal.road || '#5a4e3e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, mw, mh);
    }

    // 区域氛围色罩 (bgTint)
    if (map.bgTint) {
      ctx.fillStyle = map.bgTint;
      ctx.fillRect(0, 0, mw, mh);
    }

    // 淡雅墨线地图边界框
    ctx.strokeStyle = 'rgba(200, 155, 60, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, mw - 8, mh - 8);
  }

  _drawGroundLayer(ctx) {
    const map = this.map;
    const t = this._elapsed;

    // 传送阵地面罗盘/八卦水墨光纹
    for (const p of map.portals || []) {
      this._drawPortalGroundRune(ctx, p, t);
    }

    // 墨石记录碑地面玉金灵阵
    if (this.savePoint) {
      this._drawSavePointGroundRune(ctx, this.savePoint, t);
    }

    // 建筑门前光晕门槛
    for (const b of map.buildings || []) {
      const dx = b.doorX ?? (b.x + b.w * 0.5);
      const dy = b.doorY ?? (b.y + b.h + 18);
      const near = dist(this.hero.x, this.hero.y, dx, dy) <= 95;
      const pulse = 0.45 + 0.35 * Math.sin(t * 3.5);
      ctx.save();
      ctx.fillStyle = near
        ? `rgba(212, 154, 58, ${0.28 + pulse * 0.22})`
        : `rgba(200, 155, 60, ${0.12 + pulse * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(dx, dy, near ? 30 : 22, near ? 12 : 9, 0, 0, Math.PI * 2);
      ctx.fill();
      if (near) {
        ctx.strokeStyle = `rgba(235, 195, 110, ${0.55 + pulse * 0.35})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 地面点击行走水墨涟漪
    for (const rp of this.clickRipples) {
      const p = rp.age / rp.maxAge;
      const alpha = (1 - p) * 0.7;
      ctx.save();
      ctx.strokeStyle = `rgba(232, 222, 200, ${alpha})`;
      ctx.lineWidth = 2 * (1 - p * 0.5);
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, 8 + p * 26, 4 + p * 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(181, 58, 46, ${alpha * 0.85})`;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, 3 + p * 12, 1.5 + p * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _collectRenderables() {
    const map = this.map;
    const list = [];

    // 1. 建筑
    for (const b of map.buildings || []) {
      list.push({
        sortY: b.y + b.h,
        draw: (ctx) => this._drawBuilding(ctx, b)
      });
    }

    // 2. 障碍物
    for (const o of map.obstacles || []) {
      list.push({
        sortY: o.y + o.h,
        draw: (ctx) => this._drawObstacle(ctx, o)
      });
    }

    // 3. 传送门石柱/牌坊
    for (const p of map.portals || []) {
      list.push({
        sortY: p.y,
        draw: (ctx) => this._drawPortalArch(ctx, p)
      });
    }

    // 3.5 墨石记录碑（存档点）
    if (this.savePoint) {
      const sp = this.savePoint;
      list.push({
        sortY: sp.y,
        draw: (ctx) => this._drawSavePoint(ctx, sp)
      });
    }

    // 4. 搜刮点与废弃重炮/机甲残骸
    for (const node of this.lootNodes) {
      if (node.collected) continue;
      list.push({
        sortY: node.y,
        draw: (ctx) => this._drawLootNode(ctx, node)
      });
    }

    // 5. NPC
    if (map.npc && map.npc.id) {
      const npcRef = map.npc;
      list.push({
        sortY: npcRef.y,
        draw: (ctx) => this._drawNpc(ctx, npcRef)
      });
    }

    // 6. 巡逻怪物与 Boss
    for (const en of this.enemies) {
      if (!en.alive) continue;
      list.push({
        sortY: en.y,
        draw: (ctx) => this._drawEnemy(ctx, en)
      });
    }

    // 7. 护驾灵兽
    if (this.guardian) {
      list.push({
        sortY: this.guardianPos.y,
        draw: (ctx) => this._drawGuardian(ctx)
      });
    }

    // 8. 主角（沈砚）
    list.push({
      sortY: this.hero.y,
      draw: (ctx) => this._drawHero(ctx)
    });

    return list;
  }

  // ==================== 2.5D 水墨建筑绘制 ====================

  _drawBuilding(ctx, b) {
    const { x, y, w, h } = b;
    const roofH = b.roofH || 74;
    const t = this._elapsed;

    ctx.save();

    // 建筑接地浓墨投影
    ctx.fillStyle = 'rgba(16, 13, 10, 0.42)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h + 4, w * 0.54, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 墙体立面（按建筑风格微调宣纸/灰砖/红木色调）
    const wallPalette = {
      timber_shop: { wall: '#4d3b2c', trim: '#c89b3c', roof: '#24211e', lantern: '#d9483b' },
      forge:       { wall: '#3e332d', trim: '#d97736', roof: '#1e1b19', lantern: '#e86a33' },
      clinic:      { wall: '#434b42', trim: '#6fb98f', roof: '#212924', lantern: '#e6b84c' },
      pawnshop:    { wall: '#3c3130', trim: '#b53a2e', roof: '#201a1a', lantern: '#c93b2b' },
      board:       { wall: '#574330', trim: '#d49a3a', roof: '#29221c', lantern: '#e08b3e' },
      gatehouse:   { wall: '#4a4640', trim: '#c89b3c', roof: '#1d1c1a', lantern: '#d9483b' }
    };
    const pal = wallPalette[b.style] || wallPalette.timber_shop;

    // 墙身主体
    ctx.fillStyle = pal.wall;
    ctx.strokeStyle = '#181411';
    ctx.lineWidth = 2.5;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // 墙面水墨砖木肌理与木柱
    ctx.fillStyle = 'rgba(20, 16, 12, 0.26)';
    ctx.fillRect(x, y, w, 14); // 屋檐下阴影带
    ctx.fillStyle = '#261e18';
    ctx.fillRect(x + 8, y + 6, 10, h - 6);
    ctx.fillRect(x + w - 18, y + 6, 10, h - 6);

    // 暖光木格窗
    if (b.style !== 'board') {
      const winW = Math.min(44, w * 0.2);
      const winH = Math.min(36, h * 0.3);
      const winY = y + h * 0.34;
      const drawWin = (wx) => {
        ctx.fillStyle = 'rgba(240, 186, 98, 0.72)';
        ctx.fillRect(wx, winY, winW, winH);
        ctx.strokeStyle = '#241b14';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, winY, winW, winH);
        ctx.beginPath();
        ctx.moveTo(wx + winW * 0.5, winY);
        ctx.lineTo(wx + winW * 0.5, winY + winH);
        ctx.moveTo(wx, winY + winH * 0.5);
        ctx.lineTo(wx + winW, winY + winH * 0.5);
        ctx.stroke();
      };
      if (w >= 200) {
        drawWin(x + 28);
        drawWin(x + w - 28 - winW);
      }
    } else {
      // 悬赏榜木板告示纸
      ctx.fillStyle = '#e4d6bc';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 22 + i * 44, y + 22, 32, 42);
        ctx.strokeStyle = '#5c4b37';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 22 + i * 44, y + 22, 32, 42);
      }
    }

    // 门洞（朝向 doorX / doorY）
    const doorW = Math.min(54, w * 0.26);
    const doorH = Math.min(62, h * 0.52);
    const doorCx = clamp(b.doorX ?? (x + w * 0.5), x + 36, x + w - 36);
    ctx.fillStyle = '#17120e';
    ctx.beginPath();
    ctx.roundRect(doorCx - doorW * 0.5, y + h - doorH, doorW, doorH, [8, 8, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 门内暖光溢出
    const nearDoor = dist(this.hero.x, this.hero.y, b.doorX ?? doorCx, b.doorY ?? (y + h + 16)) <= 90;
    const doorGrad = ctx.createLinearGradient(0, y + h - doorH, 0, y + h);
    doorGrad.addColorStop(0, nearDoor ? 'rgba(240, 185, 92, 0.55)' : 'rgba(220, 155, 70, 0.22)');
    doorGrad.addColorStop(1, 'rgba(20, 14, 10, 0.1)');
    ctx.fillStyle = doorGrad;
    ctx.fillRect(doorCx - doorW * 0.5 + 3, y + h - doorH + 3, doorW - 6, doorH - 3);

    // 2.5D 飞檐黛瓦屋顶（向 -Y 延伸 roofH）
    ctx.fillStyle = pal.roof;
    ctx.strokeStyle = '#12100e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 8);
    ctx.quadraticCurveTo(x - 6, y - roofH * 0.45, x + 24, y - roofH);
    ctx.lineTo(x + w - 24, y - roofH);
    ctx.quadraticCurveTo(x + w + 6, y - roofH * 0.45, x + w + 18, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 屋脊鎏金装饰线与瓦楞暗纹
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y - roofH + 2);
    ctx.lineTo(x + w - 20, y - roofH + 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232, 222, 200, 0.12)';
    ctx.lineWidth = 1;
    const ribCount = Math.max(4, Math.floor(w / 26));
    for (let i = 1; i < ribCount; i++) {
      const rx = x + (w / ribCount) * i;
      ctx.beginPath();
      ctx.moveTo(rx, y - roofH + 6);
      ctx.lineTo(rx, y + 4);
      ctx.stroke();
    }

    // 屋檐悬挂摇曳红/琥珀灯笼
    const sway = Math.sin(t * 2.4 + x * 0.02) * 3;
    const drawLantern = (lx, ly) => {
      ctx.save();
      ctx.strokeStyle = '#1c1814';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 10);
      ctx.lineTo(lx + sway, ly);
      ctx.stroke();

      // 暖光晕
      const glow = ctx.createRadialGradient(lx + sway, ly + 8, 2, lx + sway, ly + 8, 24);
      glow.addColorStop(0, 'rgba(245, 130, 62, 0.55)');
      glow.addColorStop(1, 'rgba(245, 130, 62, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx + sway, ly + 8, 24, 0, Math.PI * 2);
      ctx.fill();

      // 灯笼主体
      ctx.fillStyle = pal.lantern;
      ctx.strokeStyle = '#e6b84c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(lx + sway, ly + 8, 6.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    drawLantern(x + 6, y + 14);
    drawLantern(x + w - 6, y + 14);

    // 竖排木质匾额招牌 (b.sign || b.name)
    const signText = b.sign || b.name;
    const chars = [...signText].slice(0, 4);
    const px = x + w - 34;
    const py = y + 18;
    const ph = Math.max(48, chars.length * 16 + 14);
    ctx.fillStyle = '#231a14';
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(px, py, 24, ph, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f2deb4';
    ctx.font = 'bold 12px "Noto Serif SC", "Songti SC", serif';
    ctx.textAlign = 'center';
    chars.forEach((ch, idx) => {
      ctx.fillText(ch, px + 12, py + 17 + idx * 16);
    });

    // 屋顶横匾建筑全名
    ctx.font = 'bold 12px "Noto Serif SC", "Songti SC", sans-serif';
    const nameW = ctx.measureText(b.name).width + 20;
    const nx = x + w * 0.5 - nameW * 0.5;
    const ny = y - roofH * 0.58;
    ctx.fillStyle = 'rgba(24, 20, 16, 0.88)';
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(nx, ny, nameW, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f5e8ce';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, x + w * 0.5, ny + 15);

    ctx.restore();
  }

  // ==================== 2.5D 水墨障碍物（手绘底图透出 · 仅极淡墨影/灵光） ====================

  _drawObstacle(ctx, o) {
    const { x, y, w, h, type } = o;
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    ctx.save();

    if (type === 'toxic_pool') {
      // 毒潭仅叠一层柔和半透青瘴微光，不遮挡手绘底图
      const pulse = 0.65 + 0.35 * Math.sin(this._elapsed * 2.6 + x);
      const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, w * 0.5);
      grad.addColorStop(0, `rgba(110, 226, 152, ${0.22 * pulse})`);
      grad.addColorStop(1, 'rgba(34, 88, 58, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.48, h * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'reactor_core') {
      // 反应堆仅叠一层柔和玄紫能量光晕
      const pulse = 0.6 + 0.4 * Math.sin(this._elapsed * 3.8);
      const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, w * 0.48);
      glow.addColorStop(0, `rgba(192, 132, 252, ${0.28 * pulse})`);
      glow.addColorStop(1, 'rgba(157, 124, 216, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.48, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 其余障碍物为纯碰撞体，仅保留极淡半透接地墨影提示边界
      ctx.fillStyle = 'rgba(12, 11, 10, 0.12)';
      ctx.beginPath();
      ctx.ellipse(cx, y + h - 4, w * 0.46, Math.max(8, h * 0.24), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ==================== 传送阵（地面罗盘 + 石门牌坊） ====================

  _drawPortalGroundRune(ctx, p, t) {
    const r = p.r || 42;
    const isCave = p.to?.startsWith('cave_');
    const isInterior = p.to?.startsWith('interior_');
    const color = isCave ? '#9d7cd8' : isInterior ? '#6fb98f' : '#d49a3a';

    ctx.save();
    ctx.translate(p.x, p.y);

    // 旋转八卦/罗盘光环
    ctx.scale(1, 0.52);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3.2);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(t * 0.7);
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 内圈微光
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawPortalArch(ctx, p) {
    const isCave = p.to?.startsWith('cave_');
    const color = isCave ? '#b48ef0' : '#d49a3a';
    ctx.save();
    ctx.translate(p.x, p.y);

    // 两侧青石门柱
    ctx.fillStyle = '#2d2824';
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = 1.8;
    ctx.fillRect(-28, -48, 9, 46);
    ctx.strokeRect(-28, -48, 9, 46);
    ctx.fillRect(19, -48, 9, 46);
    ctx.strokeRect(19, -48, 9, 46);

    // 横额门楣
    ctx.fillStyle = '#231d19';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-34, -56, 68, 12, 3);
    ctx.fill();
    ctx.stroke();

    // 悬浮宣纸目的地标签
    const label = p.label || '传送阵';
    ctx.font = 'bold 11px "Noto Serif SC", sans-serif';
    const tw = ctx.measureText(label).width + 16;
    ctx.fillStyle = 'rgba(22, 18, 15, 0.86)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-tw * 0.5, -80, tw, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3e7cf';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -66);

    ctx.restore();
  }

  // ==================== 墨石记录碑（存档点石碑 · 无 Emoji） ====================

  _drawSavePointGroundRune(ctx, sp, t) {
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.8);
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.scale(1, 0.5);

    // 玉金脉动灵光
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
    aura.addColorStop(0, `rgba(94, 214, 160, ${0.38 * pulse})`);
    aura.addColorStop(0.6, `rgba(212, 168, 72, ${0.2 * pulse})`);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    // 旋转玉金双环
    ctx.strokeStyle = `rgba(116, 232, 176, ${0.55 + 0.3 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(-t * 0.65);
    ctx.strokeStyle = `rgba(218, 174, 82, ${0.5 + 0.3 * pulse})`;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  _drawSavePoint(ctx, sp) {
    const t = this._elapsed;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3.1);

    ctx.save();
    ctx.translate(sp.x, sp.y);

    // 接地墨影
    ctx.fillStyle = 'rgba(12, 10, 8, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 雕花青石底座
    ctx.fillStyle = '#33302c';
    ctx.strokeStyle = '#151311';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -10, 36, 12, 3);
    ctx.fill();
    ctx.stroke();

    // 水墨石碑主体（微收腰古碑轮廓）
    ctx.fillStyle = '#252624';
    ctx.strokeStyle = '#121110';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-13, -10);
    ctx.lineTo(-11, -54);
    ctx.quadraticCurveTo(0, -64, 11, -54);
    ctx.lineTo(13, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 碑面玉金嵌边
    ctx.strokeStyle = `rgba(200, 165, 82, ${0.65 + 0.3 * pulse})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-8, -50, 16, 36, 3);
    ctx.stroke();

    // 碑文发光篆印（「墨」「记」）
    ctx.fillStyle = `rgba(116, 236, 180, ${0.72 + 0.28 * pulse})`;
    ctx.font = 'bold 11px "Noto Serif SC", "Songti SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('墨', 0, -35);
    ctx.fillStyle = `rgba(236, 200, 110, ${0.75 + 0.25 * pulse})`;
    ctx.fillText('记', 0, -21);

    // 环绕上升的玉金墨气灵点
    for (let i = 0; i < 4; i++) {
      const phase = (t * 0.9 + i * 0.25) % 1;
      const angle = t * 1.8 + i * Math.PI * 0.5;
      const wx = Math.cos(angle) * (16 - phase * 6);
      const wy = -8 - phase * 54;
      const alpha = Math.sin(phase * Math.PI) * 0.85;
      ctx.fillStyle = i % 2 === 0
        ? `rgba(116, 236, 180, ${alpha})`
        : `rgba(232, 194, 102, ${alpha})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 2.2 * (1 - phase * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }

    // 碑顶淡雅名牌
    ctx.font = 'bold 10.5px "Noto Serif SC", sans-serif';
    const label = '墨石记录碑';
    const tw = ctx.measureText(label).width + 14;
    ctx.fillStyle = 'rgba(20, 24, 22, 0.86)';
    ctx.strokeStyle = 'rgba(116, 232, 176, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-tw * 0.5, -80, tw, 18, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d6f8e5';
    ctx.fillText(label, 0, -67);

    ctx.restore();
  }

  // ==================== 搜刮宝箱 & 废弃重炮 / 机甲残骸 ====================

  _drawLootNode(ctx, node) {
    const t = this._elapsed;
    const type = node.type || 'crate';
    const qColor = QUALITY[node.item?.quality]?.color
      || (type === 'abandoned_cannon' || type === 'mech_wreck' ? '#e88b33'
        : type === 'vault_box' || type === 'relic_spot' ? '#d49a3a'
          : type === 'mushroom' ? '#6fb98f'
            : '#c8b48a');

    ctx.save();
    ctx.translate(node.x, node.y);

    // 接地阴影
    ctx.fillStyle = 'rgba(14, 12, 10, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 2, type === 'abandoned_cannon' || type === 'mech_wreck' ? 30 : 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 闪烁微光环
    const pulse = 0.55 + 0.45 * Math.sin(t * 3.6 + node.x * 0.05);
    const glow = ctx.createRadialGradient(0, -12, 3, 0, -12, type === 'abandoned_cannon' || type === 'mech_wreck' ? 38 : 24);
    glow.addColorStop(0, `${qColor}55`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -12, type === 'abandoned_cannon' || type === 'mech_wreck' ? 38 : 24, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'abandoned_cannon') {
      // 废弃防空/反装甲重炮
      ctx.fillStyle = '#383d40';
      ctx.strokeStyle = '#151718';
      ctx.lineWidth = 2;
      // 底座沙袋与履带台
      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 16, 5);
      ctx.fill();
      ctx.stroke();
      // 旋转炮塔
      ctx.fillStyle = '#4a5054';
      ctx.beginPath();
      ctx.arc(0, -20, 14, Math.PI, 0);
      ctx.lineTo(14, -12);
      ctx.lineTo(-14, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 长管双联重炮筒
      ctx.strokeStyle = '#262a2d';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(4, -22);
      ctx.lineTo(30, -38);
      ctx.stroke();
      ctx.strokeStyle = '#e88b33';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, -38, 3 + pulse * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'mech_wreck') {
      // 坠毁重装机甲残骸
      ctx.fillStyle = '#472d26';
      ctx.strokeStyle = '#18110e';
      ctx.lineWidth = 2.2;
      // 倒伏装甲胸腔
      ctx.beginPath();
      ctx.moveTo(-24, -4);
      ctx.lineTo(-18, -32);
      ctx.lineTo(16, -36);
      ctx.lineTo(26, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 残损肩甲与发光反应核
      ctx.fillStyle = '#2d2624';
      ctx.fillRect(-14, -24, 16, 12);
      ctx.fillStyle = `rgba(255, 118, 52, ${0.55 + pulse * 0.45})`;
      ctx.beginPath();
      ctx.arc(6, -18, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'mushroom') {
      // 变异荧光菌丛
      ctx.fillStyle = '#234434';
      ctx.fillRect(-3, -18, 6, 18);
      ctx.fillStyle = '#6fb98f';
      ctx.strokeStyle = '#182b21';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -18, 13, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 菌盖微光斑点
      ctx.fillStyle = '#b9f5d0';
      ctx.beginPath();
      ctx.arc(-5, -22, 2.2, 0, Math.PI * 2);
      ctx.arc(4, -24, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 古箱 / 宝箱 / 电子终端
      const bob = Math.sin(t * 3 + node.x) * 1.5;
      ctx.fillStyle = type === 'tech_cache' ? '#36434d' : '#573d28';
      ctx.strokeStyle = '#1a1410';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -20 + bob, 28, 20, 3);
      ctx.fill();
      ctx.stroke();
      // 金铜锁扣与箱盖线
      ctx.strokeStyle = qColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-14, -12 + bob);
      ctx.lineTo(14, -12 + bob);
      ctx.stroke();
      ctx.fillStyle = qColor;
      ctx.fillRect(-3, -15 + bob, 6, 6);
    }

    // 悬浮名称（细小清晰）
    const label = node.name || node.item?.name || '物资';
    ctx.font = 'bold 10.5px "Noto Serif SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(18, 15, 12, 0.78)';
    const tw = ctx.measureText(label).width + 10;
    ctx.fillRect(-tw * 0.5, 6, tw, 15);
    ctx.fillStyle = qColor;
    ctx.fillText(label, 0, 17);

    ctx.restore();
  }

  // ==================== NPC 水墨绘制（无 Emoji） ====================

  _drawNpc(ctx, npcRef) {
    const npc = this._getNpcData(npcRef.id) || {
      name: '行者',
      spriteType: 'merchant',
      robeColor: '#4c3e32',
      accentColor: '#c89b3c'
    };
    const t = this._elapsed;
    const breath = Math.sin(t * 2.6) * 1.5;
    const robe = npc.robeColor || '#4c3e32';
    const accent = npc.accentColor || '#c89b3c';

    ctx.save();
    ctx.translate(npcRef.x, npcRef.y);

    // 接地墨影
    ctx.fillStyle = 'rgba(14, 12, 10, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 长袍/服饰主体
    ctx.fillStyle = robe;
    ctx.strokeStyle = '#171411';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -2);
    ctx.lineTo(-10, -34 + breath);
    ctx.lineTo(10, -34 + breath);
    ctx.lineTo(13, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 领口/腰带滚边
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, -18 + breath);
    ctx.lineTo(11, -18 + breath);
    ctx.moveTo(-5, -34 + breath);
    ctx.lineTo(0, -24 + breath);
    ctx.lineTo(5, -34 + breath);
    ctx.stroke();

    // 头部
    ctx.fillStyle = '#e8d8be';
    ctx.strokeStyle = '#1c1814';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -42 + breath, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 按 spriteType 绘制专属头饰/器物
    if (npc.spriteType === 'hermit' || npc.spriteType === 'guide') {
      // 道冠/竹笠
      ctx.fillStyle = '#2d2a24';
      ctx.beginPath();
      ctx.moveTo(-15, -46 + breath);
      ctx.lineTo(0, -56 + breath);
      ctx.lineTo(15, -46 + breath);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (npc.spriteType === 'smith') {
      // 铁匠护额与锻锤剪影
      ctx.fillStyle = '#b53a2e';
      ctx.fillRect(-8, -48 + breath, 16, 3.5);
      ctx.strokeStyle = '#6c7278';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, -10);
      ctx.lineTo(16, -34);
      ctx.stroke();
    } else if (npc.spriteType === 'master') {
      // 宗师发髻与背剑
      ctx.fillStyle = '#24201d';
      ctx.beginPath();
      ctx.arc(0, -51 + breath, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c89b3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -46);
      ctx.lineTo(12, -16);
      ctx.stroke();
    } else {
      // 墨发/布帽
      ctx.fillStyle = '#26211d';
      ctx.beginPath();
      ctx.arc(0, -44 + breath, 8.2, Math.PI, 0);
      ctx.fill();
    }

    // 头顶宣纸名牌
    ctx.font = 'bold 11px "Noto Serif SC", sans-serif';
    const nw = ctx.measureText(npc.name).width + 16;
    ctx.fillStyle = 'rgba(232, 222, 200, 0.92)';
    ctx.strokeStyle = '#2c251e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-nw * 0.5, -76 + breath, nw, 19, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1c1916';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, 0, -63 + breath);

    ctx.restore();
  }

  // ==================== 怪物与 Boss 水墨绘制（无 Emoji） ====================

  _drawEnemy(ctx, en) {
    const tpl = en.data || ENEMIES.rat;
    const scale = tpl.scale || 1;
    const isBoss = Boolean(tpl.isBoss);
    const t = this._elapsed;
    const bob = Math.abs(Math.sin(en.phase)) * (isBoss ? 5 : 3.5);
    const color = tpl.color || '#332d29';
    const accent = tpl.accent || '#d9483b';

    ctx.save();
    ctx.translate(en.x, en.y);

    // 接地墨影与气场环
    ctx.fillStyle = 'rgba(12, 10, 8, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 18 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isBoss) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 4);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.5 + pulse * 0.4;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 2, 28 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = 'rgba(181, 58, 46, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 2, 20 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 实体缩放与朝向翻转
    ctx.save();
    ctx.translate(0, -bob);
    ctx.scale(en.facing * scale, scale);
    this._drawEnemySilhouette(ctx, tpl.spriteType, color, accent, t);
    ctx.restore();

    // 名称与血条
    const labelY = -52 * scale - bob;
    const label = isBoss ? `【首领】${tpl.name}` : tpl.name;
    ctx.font = isBoss ? 'bold 12px "Noto Serif SC", sans-serif' : 'bold 10.5px "Noto Serif SC", sans-serif';
    const tw = ctx.measureText(label).width + 14;
    ctx.fillStyle = isBoss ? 'rgba(42, 14, 14, 0.9)' : 'rgba(22, 18, 16, 0.82)';
    ctx.strokeStyle = isBoss ? '#e6b84c' : 'rgba(181, 58, 46, 0.7)';
    ctx.lineWidth = isBoss ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(-tw * 0.5, labelY - 14, tw, 18, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isBoss ? '#f8e3b0' : '#f2c4bc';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, labelY - 1);

    // Boss 血条（或受损敌人血条）
    if (isBoss || en.hp < en.maxHp) {
      const bw = isBoss ? 72 : 44;
      const bh = isBoss ? 6 : 4;
      const pct = clamp(en.hp / Math.max(1, en.maxHp), 0, 1);
      ctx.fillStyle = '#1a1412';
      ctx.fillRect(-bw * 0.5, labelY + 7, bw, bh);
      ctx.fillStyle = isBoss ? '#d9483b' : '#c95642';
      ctx.fillRect(-bw * 0.5, labelY + 7, bw * pct, bh);
    }

    ctx.restore();
  }

  _drawEnemySilhouette(ctx, spriteType, color, accent, t) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = 2;

    if (spriteType === 'rat' || spriteType === 'dog' || spriteType === 'boss_ratking') {
      // 四足野兽/巨鼠王
      ctx.beginPath();
      ctx.ellipse(0, -16, 17, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 头部与尖耳
      ctx.beginPath();
      ctx.arc(14, -22, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, -28);
      ctx.lineTo(13, -37);
      ctx.lineTo(17, -28);
      ctx.fill();
      // 长尾
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -16);
      ctx.quadraticCurveTo(-28, -24 + Math.sin(t * 6) * 5, -32, -12);
      ctx.stroke();
      // 点睛
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(17, -23, 2.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (spriteType === 'auto_turret' || spriteType === 'drone') {
      // 自动炮台 / 悬浮警卫机
      const hover = spriteType === 'drone' ? Math.sin(t * 5) * 4 - 14 : 0;
      ctx.translate(0, hover);
      ctx.beginPath();
      ctx.roundRect(-16, -28, 32, 22, 6);
      ctx.fill();
      ctx.stroke();
      // 炮管
      ctx.fillStyle = '#1e2226';
      ctx.fillRect(10, -22, 16, 6);
      // 发光核心眼
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(2, -17, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (spriteType === 'heavy_mech' || spriteType === 'flame_mech' || spriteType === 'mech_taotie' || spriteType === 'boss_zhurong' || spriteType === 'guard') {
      // 重装机甲 / 饕餮 / 祝融七号 / 避难所铁卫
      ctx.beginPath();
      ctx.moveTo(-16, -2);
      ctx.lineTo(-19, -36);
      ctx.lineTo(-8, -46);
      ctx.lineTo(8, -46);
      ctx.lineTo(19, -36);
      ctx.lineTo(16, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 宽厚肩甲
      ctx.fillStyle = '#241e1c';
      ctx.fillRect(-23, -40, 10, 16);
      ctx.fillRect(13, -40, 10, 16);
      // 能量核心与目镜
      ctx.fillStyle = accent;
      ctx.fillRect(-7, -38, 14, 4);
      ctx.beginPath();
      ctx.arc(0, -24, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (spriteType === 'fox_nine') {
      // 九尾辐射狐：多条扇形妖尾 + 优雅狐影
      for (let i = -2; i <= 2; i++) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-8, -16);
        ctx.quadraticCurveTo(-24, -28 + i * 7 + Math.sin(t * 4 + i) * 3, -30, -34 + i * 9);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(2, -18, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(13, -27, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(16, -28, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (spriteType === 'slime' || spriteType === 'mire_wisp' || spriteType === 'boss_lotus_bane') {
      // 毒瘴灵 / 灯魅 / 千年墨瘴母体
      const pulse = Math.sin(t * 4) * 3;
      ctx.beginPath();
      ctx.moveTo(-18, -2);
      ctx.quadraticCurveTo(-20, -34 - pulse, 0, -40 - pulse);
      ctx.quadraticCurveTo(20, -34 - pulse, 18, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(-5, -20, 3, 0, Math.PI * 2);
      ctx.arc(6, -20, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (spriteType === 'bronze_spirit' || spriteType === 'painted_phantom' || spriteType === 'thunder_remnant' || spriteType === 'boss_tianshu') {
      // 悬浮仙妖 / 剑灵 / 雷公 / 玄墨大帝
      const floatY = Math.sin(t * 3.8) * 5;
      ctx.translate(0, floatY);
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(16, -24);
      ctx.lineTo(8, -4);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-16, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 背后灵环
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -32, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, -32, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 人形掠夺者 / 重盾兵 / 断钢 / 尸王 / 赛博罗刹 / 畸变体
      ctx.beginPath();
      ctx.moveTo(-12, -2);
      ctx.lineTo(-10, -34);
      ctx.lineTo(10, -34);
      ctx.lineTo(12, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 头颅
      ctx.beginPath();
      ctx.arc(0, -41, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 武器或重盾
      if (spriteType === 'raider_shield') {
        ctx.fillStyle = '#3b4248';
        ctx.strokeStyle = accent;
        ctx.fillRect(8, -34, 10, 28);
        ctx.strokeRect(8, -34, 10, 28);
      } else {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(10, -24);
        ctx.lineTo(24, -40);
        ctx.stroke();
      }
      // 凶光双目
      ctx.fillStyle = accent;
      ctx.fillRect(1, -43, 5, 2.5);
    }
  }

  // ==================== 护驾灵兽（跟随主角） ====================

  _drawGuardian(ctx) {
    const g = this.guardian;
    if (!g) return;
    const gx = this.guardianPos.x;
    const gy = this.guardianPos.y;
    const bob = Math.sin(this.guardianPos.phase) * 5;
    const accent = g.accent || '#d49a3a';
    const bodyColor = g.color || '#2e2924';

    ctx.save();
    ctx.translate(gx, gy);

    // 地面淡光影
    ctx.fillStyle = `${accent}33`;
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 浮空灵体与墨气尾迹
    ctx.translate(0, -24 + bob);
    const halo = ctx.createRadialGradient(0, 0, 3, 0, 0, 20);
    halo.addColorStop(0, `${accent}66`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // 灵兽核心身形
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 篆书印记
    ctx.fillStyle = '#fff5e0';
    ctx.font = 'bold 10.5px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.seal || '灵', 0, 3.8);

    ctx.restore();
  }

  // ==================== 主角「沈砚」多部件水墨绘制（8 向朝向） ====================

  _drawHero(ctx) {
    const h = this.hero;
    const stride = h.moving ? Math.sin(h.walkPhase) * 6 : 0;
    const breath = h.moving ? Math.abs(Math.cos(h.walkPhase)) * 2.2 : Math.sin(this._elapsed * 2.8) * 1.2;
    const facingUp = h.facing === 'up';
    const flipX = h.facing === 'left' ? -1 : (h.facing === 'right' ? 1 : h.lastSide);

    ctx.save();
    ctx.translate(h.x, h.y);

    // 1. 脚下椭圆墨影
    ctx.fillStyle = 'rgba(12, 10, 8, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 17, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.scale(flipX, 1);

    // 2. 背后/侧挂神兵剪影（青城剑/火铳/电磁炮）
    ctx.save();
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    if (h.weaponType === 'sniper' || h.weaponType === 'railgun' || h.weaponType === 'plasma') {
      ctx.moveTo(-14, -48 - breath);
      ctx.lineTo(14, -14 - breath);
    } else {
      ctx.moveTo(-13, -46 - breath);
      ctx.lineTo(11, -16 - breath);
    }
    ctx.stroke();
    // 剑柄/枪口微光
    ctx.fillStyle = '#e8dec8';
    ctx.beginPath();
    ctx.arc(-13, -46 - breath, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 迈步双足
    ctx.strokeStyle = '#dfd4be';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.lineTo(-4 + stride, -1);
    ctx.moveTo(4, -16);
    ctx.lineTo(4 - stride, -1);
    ctx.stroke();

    // 4. 青灰焦墨长披风与鎏金古铜滚边
    ctx.fillStyle = '#1f1c18';
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 1.6;
    const cloakSway = h.moving ? -stride * 0.45 : Math.sin(this._elapsed * 2.2) * 1.5;
    ctx.beginPath();
    ctx.moveTo(-12 + cloakSway, -13 - breath * 0.4);
    ctx.lineTo(-9, -43 - breath);
    ctx.lineTo(9, -43 - breath);
    ctx.lineTo(12, -14 - breath * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 正面内衬领口（背对时隐藏）
    if (!facingUp) {
      ctx.fillStyle = '#36322d';
      ctx.beginPath();
      ctx.moveTo(-4, -42 - breath);
      ctx.lineTo(0, -28 - breath);
      ctx.lineTo(5, -42 - breath);
      ctx.closePath();
      ctx.fill();
    }

    // 5. 随风飘动的朱砂围巾飘带
    const scarfWave = Math.sin(this._elapsed * 5.2 + h.walkPhase) * 4;
    ctx.strokeStyle = '#b53a2e';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(facingUp ? 0 : 4, -41 - breath);
    ctx.quadraticCurveTo(-11, -37 - breath + scarfWave * 0.5, -22, -29 - breath + scarfWave);
    ctx.stroke();

    // 6. 头颅与竹笠斗笠
    if (!facingUp) {
      ctx.fillStyle = '#e8dec8';
      ctx.beginPath();
      ctx.arc(1, -48 - breath, 6.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 竹笠
    ctx.fillStyle = '#3a3226';
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-17, -50 - breath);
    ctx.quadraticCurveTo(0, -56 - breath, 17, -50 - breath);
    ctx.lineTo(0, -64 - breath);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  // ==================== 交互浮动提示（宣纸朱印风格） ====================

  _drawInteractHint(ctx, target) {
    const bob = Math.sin(this._elapsed * 4.2) * 3;
    const text = `[E] ${target.label}`;
    const y = target.y - 68 + bob;

    ctx.save();
    ctx.font = 'bold 12px "Noto Serif SC", sans-serif';
    const w = ctx.measureText(text).width + 22;
    const x = target.x - w * 0.5;

    ctx.fillStyle = 'rgba(232, 222, 200, 0.95)';
    ctx.strokeStyle = '#b53a2e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(x, y - 14, w, 24, 4);
    ctx.fill();
    ctx.stroke();

    // 底部小三角指向目标
    ctx.fillStyle = '#b53a2e';
    ctx.beginPath();
    ctx.moveTo(target.x - 5, y + 10);
    ctx.lineTo(target.x + 5, y + 10);
    ctx.lineTo(target.x, y + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1c1916';
    ctx.textAlign = 'center';
    ctx.fillText(text, target.x, y + 2);
    ctx.restore();
  }

  // ==================== 天气粒子与水墨暗角 ====================

  _drawWeatherParticles(ctx) {
    const accent = this.map?.palette?.accent || '#d49a3a';
    ctx.save();
    for (const p of this.particles) {
      if (p.type === 'rain') {
        ctx.strokeStyle = `rgba(145, 192, 218, ${p.a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3.5, p.y + p.len);
        ctx.stroke();
      } else if (p.type === 'sand') {
        ctx.fillStyle = `rgba(205, 192, 165, ${p.a})`;
        ctx.fillRect(p.x, p.y, p.r * 2.4, p.r * 0.9);
      } else if (p.type === 'rad') {
        ctx.fillStyle = `rgba(111, 215, 152, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'heat') {
        ctx.fillStyle = `rgba(232, 118, 66, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase || 0);
        ctx.fillStyle = `rgba(218, 184, 126, ${p.a})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.4, p.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // 室内微尘 / 洞窟灵尘
        ctx.fillStyle = p.type === 'cave_mote' ? accent : '#f0dfc0';
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  _drawInkVignette(ctx, w, h) {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.36, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(14, 11, 8, 0.42)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ==================== 右上角半透明水墨小地图 ====================

  _getMinimapRect() {
    const compact = this.viewW < 640;
    const w = compact ? 112 : 156;
    const h = compact ? 74 : 102;
    return { x: this.viewW - w - 12, y: 12, w, h };
  }

  _drawMinimap(ctx) {
    const map = this.map;
    if (!map) return;
    const mm = this._getMinimapRect();
    const sx = mm.w / map.width;
    const sy = mm.h / map.height;

    ctx.save();

    // 宣纸暗墨底框
    ctx.fillStyle = 'rgba(22, 18, 15, 0.74)';
    ctx.strokeStyle = 'rgba(200, 155, 60, 0.68)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(mm.x, mm.y, mm.w, mm.h, 5);
    ctx.fill();
    ctx.stroke();

    // 障碍物（淡墨）
    ctx.fillStyle = 'rgba(130, 120, 106, 0.35)';
    for (const o of map.obstacles || []) {
      ctx.fillRect(mm.x + o.x * sx, mm.y + o.y * sy, Math.max(2, o.w * sx), Math.max(2, o.h * sy));
    }

    // 建筑（鎏金古铜）
    ctx.fillStyle = 'rgba(200, 155, 60, 0.68)';
    for (const b of map.buildings || []) {
      ctx.fillRect(mm.x + b.x * sx, mm.y + b.y * sy, Math.max(4, b.w * sx), Math.max(3, b.h * sy));
    }

    // 传送阵（青蓝菱形）
    for (const p of map.portals || []) {
      const px = mm.x + p.x * sx;
      const py = mm.y + p.y * sy;
      ctx.fillStyle = p.to?.startsWith('cave_') ? '#c084fc' : '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(px, py - 3.5);
      ctx.lineTo(px + 3.5, py);
      ctx.lineTo(px, py + 3.5);
      ctx.lineTo(px - 3.5, py);
      ctx.closePath();
      ctx.fill();
    }

    // 搜刮点（玉绿/重炮橙）
    for (const node of this.lootNodes) {
      if (node.collected) continue;
      const isHeavy = node.type === 'abandoned_cannon' || node.type === 'mech_wreck';
      ctx.fillStyle = isHeavy ? '#f59e0b' : '#6fb98f';
      ctx.beginPath();
      ctx.arc(mm.x + node.x * sx, mm.y + node.y * sy, isHeavy ? 2.8 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 墨石记录碑（亮玉色光点）
    if (this.savePoint) {
      const spx = mm.x + this.savePoint.x * sx;
      const spy = mm.y + this.savePoint.y * sy;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(spx, spy, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(spx, spy, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // NPC（暖黄）
    if (map.npc && map.npc.id) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(mm.x + map.npc.x * sx, mm.y + map.npc.y * sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 敌人与 Boss（朱砂红）
    for (const en of this.enemies) {
      if (!en.alive) continue;
      const isBoss = Boolean(en.data?.isBoss);
      ctx.fillStyle = isBoss ? '#ff4d4f' : '#e05a47';
      ctx.beginPath();
      ctx.arc(mm.x + en.x * sx, mm.y + en.y * sy, isBoss ? 4 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 主角位置（宣纸白边朱砂点）
    const hx = mm.x + this.hero.x * sx;
    const hy = mm.y + this.hero.y * sy;
    ctx.fillStyle = '#fff6e5';
    ctx.beginPath();
    ctx.arc(hx, hy, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b53a2e';
    ctx.beginPath();
    ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // 小地图底角地名
    ctx.fillStyle = 'rgba(232, 222, 200, 0.85)';
    ctx.font = 'bold 10px "Noto Serif SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(map.short || map.name, mm.x + mm.w - 5, mm.y + mm.h - 4);

    ctx.restore();
  }
}
