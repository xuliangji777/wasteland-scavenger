import { ASSETS, QUALITY, ENEMIES, NPCS, WEATHERS } from './data.js?v=25';
import { sfx } from './audio.js?v=6';

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

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInPolys(px, py, polys) {
  for (let i = 0; i < polys.length; i++) {
    if (pointInPolygon(px, py, polys[i])) return true;
  }
  return false;
}

function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1e-6) return { x: ax, y: ay };
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
  return { x: ax + abx * t, y: ay + aby * t };
}

function closestPointInPolys(px, py, polys) {
  if (isPointInPolys(px, py, polys)) return { x: px, y: py };
  let best = { x: px, y: py };
  let bestD2 = Infinity;
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const c = closestPointOnSegment(px, py, a[0], a[1], b[0], b[1]);
      const d2 = (px - c.x) ** 2 + (py - c.y) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = c;
      }
    }
  }
  return best;
}

const SPRITE_PATHS = {
  hero: 'assets/sprites/hero.png',
  hero_walk: 'assets/sprites/hero_walk.png',
  npc_merchant: 'assets/sprites/npc_merchant.png',
  npc_hermit: 'assets/sprites/npc_hermit.png',
  shrine: 'assets/sprites/shrine.png',
  enemy_beast: 'assets/sprites/enemy_beast.png',
  enemy_mech: 'assets/sprites/enemy_mech.png',
  enemy_demon: 'assets/sprites/enemy_demon.png',
  chest: 'assets/sprites/chest.png'
};

// 默认各场景底图对应的严格可行走多边形（归一化 0..1 坐标，加载时按 map.width × map.height 缩放）
const DEFAULT_WALKABLE_NORM = {
  wasteland: [
    // 2×2 广阔荒原东西向主干道（0.05..0.95 × 0.30..0.74）
    [[0.05, 0.30], [0.95, 0.30], [0.95, 0.74], [0.05, 0.74]],
    // 中央至东域互联宽阔十字路网（严格避开四角巨型机甲/残骸高墙）
    [[0.16, 0.16], [0.88, 0.16], [0.88, 0.86], [0.16, 0.86]],
    // 南北两侧延伸支路与副本入口前坪（0.26..0.78 × 0.10..0.92）
    [[0.26, 0.10], [0.78, 0.10], [0.78, 0.92], [0.26, 0.92]]
  ],
  cave: [
    // 多段互联赛博地宫主廊道（0.06..0.94 × 0.34..0.74，避开外墙与实心岩柱）
    [[0.06, 0.34], [0.94, 0.34], [0.94, 0.74], [0.06, 0.74]],
    // 中段开阔大厅与南北侧翼通道（0.14..0.88 × 0.18..0.86）
    [[0.14, 0.18], [0.88, 0.18], [0.88, 0.86], [0.14, 0.86]],
    // 西南入口前厅（0.06..0.28 × 0.56..0.88）
    [[0.06, 0.56], [0.28, 0.56], [0.28, 0.88], [0.06, 0.88]],
    // 东北深处首领圣殿（0.68..0.94 × 0.14..0.54）
    [[0.68, 0.14], [0.94, 0.14], [0.94, 0.54], [0.68, 0.54]]
  ],
  ruins: [
    // 2×2 雨夜废都/兵工/避难所东西向主街（0.05..0.95 × 0.30..0.74）
    [[0.05, 0.30], [0.95, 0.30], [0.95, 0.74], [0.05, 0.74]],
    // 中央交汇街区与酒馆/军械库/东域前沿（避开四角倾倒摩天楼）
    [[0.15, 0.16], [0.88, 0.16], [0.88, 0.86], [0.15, 0.86]],
    // 南北向主干道与副本入口广场（0.26..0.78 × 0.10..0.92）
    [[0.26, 0.10], [0.78, 0.10], [0.78, 0.92], [0.26, 0.92]]
  ],
  swamp: [
    // 2×2 青瘴毒泽互联架空栈道与东岸高地（避开四角深潭毒崖）
    [[0.05, 0.32], [0.26, 0.24], [0.58, 0.20], [0.88, 0.20], [0.95, 0.34], [0.95, 0.72], [0.84, 0.84], [0.46, 0.86], [0.18, 0.80], [0.05, 0.70]],
    // 中央与东岸宽阔木台路网（0.16..0.88 × 0.18..0.84）
    [[0.16, 0.18], [0.88, 0.18], [0.88, 0.84], [0.16, 0.84]],
    // 南北通往沉没菌窟与狐仙秘境支路（0.28..0.76 × 0.10..0.92）
    [[0.28, 0.10], [0.76, 0.10], [0.76, 0.92], [0.28, 0.92]]
  ],
  town: [
    // 新 bg_town.jpg 太极广场与主大道兜底（若未单独配置）
    [[0.22, 0.46], [0.86, 0.46], [0.86, 0.80], [0.22, 0.80]]
  ],
  interior: [
    [[0.08, 0.41], [0.92, 0.41], [0.92, 0.95], [0.08, 0.95]]
  ]
};

export function resolveMapWalkablePolys(map) {
  if (!map) return [];
  if (Array.isArray(map.walkablePolys) && map.walkablePolys.length > 0) {
    return map.walkablePolys;
  }
  const bg = String(map.bgAsset || '');
  let key = 'ruins';
  if (map.sceneType === 'cave' || bg.includes('bg_cave')) {
    key = 'cave';
  } else if (map.sceneType === 'interior' || bg.includes('bg_interior')) {
    key = 'interior';
  } else if (map.sceneType === 'town' || bg.includes('bg_town')) {
    key = 'town';
  } else if (bg.includes('bg_wasteland') || map.id === 'wasteland') {
    key = 'wasteland';
  } else if (bg.includes('bg_swamp') || map.id === 'swamp') {
    key = 'swamp';
  } else if (bg.includes('bg_ruins')) {
    key = 'ruins';
  }
  const norm = DEFAULT_WALKABLE_NORM[key] || DEFAULT_WALKABLE_NORM.ruins;
  const w = map.width || 1560;
  const h = map.height || 1020;
  return norm.map((poly) => poly.map(([nx, ny]) => [Math.round(nx * w), Math.round(ny * h)]));
}

function polyCentroid(poly) {
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < poly.length; i++) {
    sx += poly[i][0];
    sy += poly[i][1];
  }
  const n = Math.max(1, poly.length);
  return { x: sx / n, y: sy / n };
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
    this.cameraZoom = clamp(Math.min(this.viewW / 1260, this.viewH / 650), 0.60, 1.02);
    this.cameraX = 0;
    this.cameraY = 0;

    // 切图墨晕转场 (0..1)
    this._fadeAlpha = 0;

    // 背景图与透明精灵图缓存（首屏仅预加载必需核心精灵，其余按需懒加载，避免移动端首屏抢占带宽）
    this._bgCache = new Map();
    this._spriteCache = new Map();
    this._preloadSprites();

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
      stepIndex: 0,
      _lastHalfStep: 0,
      moving: false,
      targetX: null,
      targetY: null,
      weaponType: 'blade',
      _stuckFrames: 0
    };

    // 护驾灵兽跟随状态
    this.guardian = null;
    this.guardianPos = { x: 760, y: 515, phase: 0, facing: 1, moving: false };

    // 输入状态
    this.keys = { up: false, down: false, left: false, right: false };

    // 地面点击墨纹标记 & 脚步扬尘粒子
    this.clickRipples = [];
    this.footDust = [];

    // 地图动态实体与运行时碰撞缓存
    this._walkablePolys = [];
    this._activePortals = [];
    this._activeNpc = null;
    this._openedChests = new Set();
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
    this._walkablePolys = resolveMapWalkablePolys(map);
    this.weatherId = opts.weatherId ?? (map.weatherPool?.[0] ?? 0);
    if (opts.guardian !== undefined) {
      this.guardian = opts.guardian;
    }
    if (opts.heroWeaponType !== undefined) {
      this.hero.weaponType = opts.heroWeaponType;
    }

    // 先清空动态实体，避免出生点吸附时误判旧地图碰撞体
    this.lootNodes = [];
    this.savePoint = null;

    const sx = opts.spawnX ?? map.spawn?.x ?? map.width * 0.5;
    const sy = opts.spawnY ?? map.spawn?.y ?? map.height * 0.5;
    const heroPt = this._snapToWalkable(sx, sy, this.hero.r);
    this.hero.x = heroPt.x;
    this.hero.y = heroPt.y;
    this.hero.targetX = null;
    this.hero.targetY = null;
    this.hero.moving = false;
    this.hero.walkPhase = 0;
    this.hero._lastHalfStep = 0;
    this.hero._stuckFrames = 0;
    this._clearKeys();

    this.guardianPos.x = this.hero.x - 36;
    this.guardianPos.y = this.hero.y + 8;
    this.guardianPos.facing = this.hero.lastSide || 1;
    this.guardianPos.moving = false;

    // 预加载当前地图背景
    const bgPath = resolveBgPath(map.bgAsset);
    if (bgPath) this._getBgImage(bgPath);

    // 传送阵与 NPC 自动吸附到可行走区域（保证全 21 张地图 100% 可抵达且绝不落在墙上）
    this._activePortals = (map.portals || []).map((p) => {
      const pt = this._snapToWalkable(p.x, p.y, 12, { ignoreObstacles: true });
      return { ...p, x: pt.x, y: pt.y };
    });
    if (map.npc && map.npc.id) {
      const npcPt = this._snapToWalkable(map.npc.x, map.npc.y, 14);
      this._activeNpc = { ...map.npc, x: npcPt.x, y: npcPt.y };
    } else {
      this._activeNpc = null;
    }

    // 同步已开启宝箱记录（一次性永久发现，绝不复生）
    if (opts.openedChests !== undefined) {
      this._openedChests = opts.openedChests instanceof Set
        ? new Set(opts.openedChests)
        : new Set(Array.isArray(opts.openedChests) ? opts.openedChests : []);
    }

    // 搜刮点与残骸（自动吸附到可行走地面，且避开主角出生点）
    const rawLoot = Array.isArray(opts.lootNodes)
      ? opts.lootNodes
      : (map.lootZones || []).map((z) => ({
          ...z,
          opened: false,
          collected: false
        }));
    this.lootNodes = rawLoot.map((node) => {
      const pt = this._snapToWalkable(node.x, node.y, 18);
      node.x = pt.x;
      node.y = pt.y;
      if (dist(node.x, node.y, this.hero.x, this.hero.y) < 48) {
        const nudged = this._snapToWalkable(node.x + 56, node.y + 24, 18);
        node.x = nudged.x;
        node.y = nudged.y;
      }
      const isOpened = this._isNodeOpened(node, map.id);
      node.opened = isOpened;
      node.collected = isOpened;
      return node;
    });

    // 巡逻敌人与 Boss（出生点与巡逻原点均吸附至可行走地面）
    if (Array.isArray(opts.enemies)) {
      this.enemies = opts.enemies.map((e) => {
        const en = this._normalizeEnemy(e);
        const pt = this._snapToWalkable(en.x, en.y, 16);
        const hpt = this._snapToWalkable(en.homeX, en.homeY, 16);
        en.x = pt.x;
        en.y = pt.y;
        en.homeX = hpt.x;
        en.homeY = hpt.y;
        return en;
      });
    } else {
      const list = [];
      for (const sp of map.enemySpawns || []) {
        const tpl = ENEMIES[sp.enemyId];
        if (!tpl) continue;
        const en = this._createEnemyFromSpawn(sp, tpl);
        const pt = this._snapToWalkable(en.x, en.y, 16);
        en.x = pt.x;
        en.y = pt.y;
        en.homeX = pt.x;
        en.homeY = pt.y;
        list.push(en);
      }
      if (map.bossSpawn) {
        const tpl = ENEMIES[map.bossSpawn.enemyId];
        if (tpl) {
          const en = this._createEnemyFromSpawn(map.bossSpawn, tpl);
          const pt = this._snapToWalkable(en.x, en.y, 18);
          en.x = pt.x;
          en.y = pt.y;
          en.homeX = pt.x;
          en.homeY = pt.y;
          list.push(en);
        }
      }
      this.enemies = list;
    }

    this.clickRipples = [];
    this.footDust = [];
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

  /** 同步已永久开启的宝箱列表（支持 Set 或 Array） */
  setOpenedChests(openedChests) {
    this._openedChests = openedChests instanceof Set
      ? new Set(openedChests)
      : new Set(Array.isArray(openedChests) ? openedChests : []);
    const mapId = this.map?.id;
    for (const node of this.lootNodes) {
      if (this._isNodeOpened(node, mapId)) {
        node.opened = true;
        node.collected = true;
      }
    }
    this.detectNearest();
  }

  _getChestKey(node, mapId = this.map?.id) {
    const idPart = node?.id || `${Math.round(node?.x || 0)}_${Math.round(node?.y || 0)}`;
    return `${mapId || 'map'}:${idPart}`;
  }

  _isNodeOpened(node, mapId = this.map?.id) {
    if (!node) return false;
    if (node.opened || node.collected || (node.cooldown && node.cooldown > 0)) return true;
    const key = this._getChestKey(node, mapId);
    return this._openedChests.has(key) || (Boolean(node.id) && this._openedChests.has(node.id));
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
    const dpad = el.closest?.('.dpad-cross');
    const syncDpadActive = () => {
      if (!dpad) return;
      const anyPressed = this.keys.up || this.keys.down || this.keys.left || this.keys.right;
      dpad.classList.toggle('is-active', anyPressed);
    };
    const release = () => {
      this.setKey(dir, false);
      el.classList.remove('active');
      syncDpadActive();
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.cancelable) e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('active');
      this.setKey(dir, true);
      syncDpadActive();
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
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.viewW = Math.max(320, Math.floor(rect.width));
    this.viewH = Math.max(240, Math.floor(rect.height));
    this.cameraZoom = clamp(Math.min(this.viewW / 1260, this.viewH / 650), 0.60, 1.02);
    this.canvas.width = Math.floor(this.viewW * dpr);
    this.canvas.height = Math.floor(this.viewH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.map) this._snapCamera();
  }

  // ==================== 资源与初始化辅助 ====================

  _preloadBackgrounds() {
    if (this.map?.bgAsset) {
      const bgPath = resolveBgPath(this.map.bgAsset);
      if (bgPath) this._getBgImage(bgPath);
    }
  }

  _preloadSprites() {
    const essentialKeys = ['hero', 'hero_walk', 'npc_merchant', 'shrine'];
    for (const key of essentialKeys) {
      if (SPRITE_PATHS[key]) {
        this._getSprite(key, SPRITE_PATHS[key]);
      }
    }
  }

  _getSprite(key, explicitPath = null) {
    const path = explicitPath || SPRITE_PATHS[key];
    if (!path) return null;
    let entry = this._spriteCache.get(key);
    if (!entry) {
      const img = new Image();
      entry = { img, loaded: false, error: false, retried: false };
      img.onload = () => {
        entry.loaded = true;
        entry.error = false;
      };
      img.onerror = () => {
        if (!entry.retried) {
          entry.retried = true;
          const sep = path.includes('?') ? '&' : '?';
          img.src = `${path}${sep}retry=1`;
          return;
        }
        entry.error = true;
      };
      img.src = path;
      this._spriteCache.set(key, entry);
    }
    return entry;
  }

  _getNpcSpriteKey(npcRef, npc) {
    const id = npcRef?.id || npc?.id || '';
    const st = npc?.spriteType || '';
    if (
      st === 'merchant' ||
      st === 'smith' ||
      id === 'laohuang' ||
      id === 'jiubao' ||
      id === 'tiejiang' ||
      id === 'loan' ||
      id === 'shopkeeper'
    ) {
      return 'npc_merchant';
    }
    return 'npc_hermit';
  }

  _getEnemySpriteKey(spriteType) {
    if (['rat', 'dog', 'boss_ratking', 'slime'].includes(spriteType)) {
      return 'enemy_beast';
    }
    if (['drone', 'flame_mech', 'guard', 'auto_turret', 'heavy_mech', 'mech_taotie', 'boss_zhurong', 'raider', 'raider_shield', 'boss_duangang'].includes(spriteType)) {
      return 'enemy_mech';
    }
    return 'enemy_demon';
  }

  _getBgImage(path) {
    if (!path) return null;
    let entry = this._bgCache.get(path);
    if (!entry) {
      const img = new Image();
      entry = { img, loaded: false, error: false, retried: false };
      img.onload = () => {
        entry.loaded = true;
        entry.error = false;
      };
      img.onerror = () => {
        if (!entry.retried) {
          entry.retried = true;
          const sep = path.includes('?') ? '&' : '?';
          img.src = `${path}${sep}retry=1`;
          return;
        }
        entry.error = true;
      };
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
    document.querySelector('.dpad-cross')?.classList.remove('is-active');
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

    const zoom = this.cameraZoom || 1;
    const wx = clamp(sx / zoom + this.cameraX, 24, this.map.width - 24);
    const wy = clamp(sy / zoom + this.cameraY, 36, this.map.height - 24);

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
    const zoom = this.cameraZoom || 1;
    this.hero.targetX = clamp(sx / zoom + this.cameraX, 24, this.map.width - 24);
    this.hero.targetY = clamp(sy / zoom + this.cameraY, 36, this.map.height - 24);
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

  _hitsObstacle(x, y, radius, opts = {}) {
    if (!this.map) return false;
    for (const o of this.map.obstacles || []) {
      if (circleIntersectsRect(x, y, radius, o.x, o.y, o.w, o.h)) return true;
    }
    if (!opts.ignoreDynamic) {
      if (this.savePoint && dist(x, y, this.savePoint.x, this.savePoint.y) < radius + 20) {
        return true;
      }
      for (const node of this.lootNodes) {
        if (this._isNodeOpened(node)) continue;
        if (dist(x, y, node.x, node.y) < radius + 20) return true;
      }
    }
    return false;
  }

  _isWalkable(cx, cy, r = 14, opts = {}) {
    return !this._collidesAt(cx, cy, r, opts);
  }

  _collidesAt(cx, cy, r, opts = {}) {
    if (!this.map) return false;
    const polys = this._walkablePolys?.length ? this._walkablePolys : resolveMapWalkablePolys(this.map);
    if (Array.isArray(polys) && polys.length > 0) {
      if (!isPointInPolys(cx, cy, polys)) return true;
      const footR = Math.min(r * 0.5, 9);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        if (!isPointInPolys(cx + Math.cos(ang) * footR, cy + Math.sin(ang) * footR, polys)) {
          return true;
        }
      }
    } else {
      for (const b of this.map.buildings || []) {
        if (circleIntersectsRect(cx, cy, r, b.x, b.y, b.w, b.h)) return true;
      }
    }
    if (!opts.ignoreObstacles && this._hitsObstacle(cx, cy, r, opts)) {
      return true;
    }
    return false;
  }

  _snapToWalkable(x, y, margin = 12, opts = {}) {
    const map = this.map;
    if (!map) return { x, y };
    const cx = clamp(x, 28, map.width - 28);
    const cy = clamp(y, 40, map.height - 28);
    const polys = this._walkablePolys?.length ? this._walkablePolys : resolveMapWalkablePolys(map);
    const checkOpts = { ignoreDynamic: true, ignoreObstacles: Boolean(opts.ignoreObstacles) };
    if (!polys.length) return { x: cx, y: cy };
    if (!this._collidesAt(cx, cy, margin, checkOpts)) {
      return { x: cx, y: cy };
    }

    const edgePt = closestPointInPolys(cx, cy, polys);
    // 找距离最近的那个多边形质心，向内微推确保完整脚底半径落在可行走区内
    let nearestCent = polyCentroid(polys[0]);
    let bestCentD = dist(edgePt.x, edgePt.y, nearestCent.x, nearestCent.y);
    for (let i = 1; i < polys.length; i++) {
      const c = polyCentroid(polys[i]);
      const d = dist(edgePt.x, edgePt.y, c.x, c.y);
      if (d < bestCentD) {
        bestCentD = d;
        nearestCent = c;
      }
    }

    const dirX = nearestCent.x - edgePt.x;
    const dirY = nearestCent.y - edgePt.y;
    const dirLen = Math.hypot(dirX, dirY) || 1;
    const ux = dirX / dirLen;
    const uy = dirY / dirLen;

    for (const push of [16, 28, 42, 60, 84]) {
      const tx = clamp(edgePt.x + ux * push, 28, map.width - 28);
      const ty = clamp(edgePt.y + uy * push, 40, map.height - 28);
      if (!this._collidesAt(tx, ty, margin, checkOpts)) {
        return { x: Math.round(tx), y: Math.round(ty) };
      }
    }

    // 螺旋搜索避开障碍物
    const baseX = clamp(edgePt.x + ux * 20, 28, map.width - 28);
    const baseY = clamp(edgePt.y + uy * 20, 40, map.height - 28);
    for (let rad = 24; rad <= 160; rad += 24) {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12;
        const tx = clamp(baseX + Math.cos(a) * rad, 28, map.width - 28);
        const ty = clamp(baseY + Math.sin(a) * rad, 40, map.height - 28);
        if (!this._collidesAt(tx, ty, margin, checkOpts)) {
          return { x: Math.round(tx), y: Math.round(ty) };
        }
      }
    }

    // 最终回退到质心
    return { x: Math.round(nearestCent.x), y: Math.round(nearestCent.y) };
  }

  _moveWithSlide(entity, dx, dy, r) {
    const map = this.map;
    const nx = clamp(entity.x + dx, 24, map.width - 24);
    const ny = clamp(entity.y + dy, 36, map.height - 24);
    if (!this._collidesAt(nx, ny, r)) {
      entity.x = nx;
      entity.y = ny;
      return;
    }

    // 尝试轴向贴墙滑动
    let moved = false;
    if (Math.abs(dx) > 0.01 && !this._collidesAt(nx, entity.y, r)) {
      entity.x = nx;
      moved = true;
    }
    if (Math.abs(dy) > 0.01 && !this._collidesAt(entity.x, ny, r)) {
      entity.y = ny;
      moved = true;
    }
    if (moved) return;

    // 针对斜角 2.5D 多边形边界，沿偏转角尝试丝滑贴边滑行
    const stepLen = Math.hypot(dx, dy);
    const polys = this._walkablePolys?.length ? this._walkablePolys : map.walkablePolys;
    if (stepLen > 0.05 && polys?.length) {
      const baseAngle = Math.atan2(dy, dx);
      const offsets = [0.42, -0.42, 0.84, -0.84, 1.22, -1.22];
      for (const off of offsets) {
        const a = baseAngle + off;
        const tx = clamp(entity.x + Math.cos(a) * stepLen * 0.82, 24, map.width - 24);
        const ty = clamp(entity.y + Math.sin(a) * stepLen * 0.82, 36, map.height - 24);
        if (!this._collidesAt(tx, ty, r)) {
          entity.x = tx;
          entity.y = ty;
          return;
        }
      }
    }
  }

  _snapCamera() {
    if (!this.map) return;
    const zoom = this.cameraZoom || 1;
    const effW = this.viewW / zoom;
    const effH = this.viewH / zoom;
    if (this.map.width <= effW) {
      this.cameraX = (this.map.width - effW) * 0.5;
    } else {
      this.cameraX = clamp(this.hero.x - effW * 0.5, 0, this.map.width - effW);
    }
    if (this.map.height <= effH) {
      this.cameraY = (this.map.height - effH) * 0.5;
    } else {
      this.cameraY = clamp((this.hero.y - 24) - effH * 0.5, 0, this.map.height - effH);
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

    // 脚步墨尘粒子更新
    for (let i = this.footDust.length - 1; i >= 0; i--) {
      const d = this.footDust[i];
      d.age += dt;
      if (d.age >= d.maxAge) {
        this.footDust.splice(i, 1);
        continue;
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.92;
      d.vy *= 0.92;
    }

    if (!this.paused) {
      this._updateHero(dt);
      this._updateGuardian(dt);
      this._updateEnemies(dt);
    }

    // 摄像机平滑跟随
    const zoom = this.cameraZoom || 1;
    const effW = this.viewW / zoom;
    const effH = this.viewH / zoom;
    const targetCamX = this.map.width <= effW
      ? (this.map.width - effW) * 0.5
      : clamp(this.hero.x - effW * 0.5, 0, this.map.width - effW);
    const targetCamY = this.map.height <= effH
      ? (this.map.height - effH) * 0.5
      : clamp((this.hero.y - 24) - effH * 0.5, 0, this.map.height - effH);

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

        // 精确半周期落脚同步：触发地形脚步音效 + 足跟墨尘
        const halfStep = Math.floor(h.walkPhase / Math.PI);
        if (halfStep > h._lastHalfStep) {
          h._lastHalfStep = halfStep;
          h.stepIndex += 1;
          const surface = this._getSurfaceType();
          sfx.footstep?.(surface, h.stepIndex);
          this._spawnFootDust(surface, h.stepIndex);
        }
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
      if (h.walkPhase < 0.04) h.walkPhase = 0;
      h._lastHalfStep = Math.floor(h.walkPhase / Math.PI);
    }
  }

  _getSurfaceType() {
    const id = this.map?.id || '';
    if (id.startsWith('interior_') || this.map?.sceneType === 'interior') return 'wood';
    if (id === 'swamp') return 'swamp';
    if (id === 'wasteland' || id === 'ruins' || id === 'arsenal') return 'dirt';
    return 'stone';
  }

  _spawnFootDust(surface, stepIndex) {
    const h = this.hero;
    const count = 2 + (stepIndex % 2);
    const sideOffset = (stepIndex % 2 === 0 ? -4.5 : 4.5);
    const heelX = h.x - (h.dirX || 0) * 6 + sideOffset;
    const heelY = h.y - (h.dirY || 0) * 3 + 2;

    const palette = surface === 'swamp'
      ? [118, 162, 132]
      : surface === 'dirt'
        ? [194, 170, 132]
        : surface === 'wood'
          ? [210, 188, 154]
          : [216, 206, 188];

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 24;
      this.footDust.push({
        x: heelX + (Math.random() - 0.5) * 6,
        y: heelY + (Math.random() - 0.5) * 3,
        vx: -(h.dirX || 0) * (16 + Math.random() * 14) + spread,
        vy: -(h.dirY || 0) * (8 + Math.random() * 8) - (8 + Math.random() * 12),
        r: 2.1 + Math.random() * 2.1,
        age: 0,
        maxAge: 0.34 + Math.random() * 0.22,
        rgb: palette
      });
    }
    if (this.footDust.length > 36) {
      this.footDust.splice(0, this.footDust.length - 36);
    }
  }

  _spawnEntityDust(x, y, vx, vy, isHeavy = false) {
    const surface = this._getSurfaceType();
    const palette = surface === 'swamp'
      ? [118, 162, 132]
      : surface === 'dirt'
        ? [194, 170, 132]
        : [198, 188, 170];
    const count = isHeavy ? 2 : 1;
    for (let i = 0; i < count; i++) {
      this.footDust.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 4,
        vx: -vx * (10 + Math.random() * 10) + (Math.random() - 0.5) * 14,
        vy: -vy * (6 + Math.random() * 6) - (6 + Math.random() * 8),
        r: (isHeavy ? 2.4 : 1.7) + Math.random() * 1.4,
        age: 0,
        maxAge: 0.28 + Math.random() * 0.18,
        rgb: palette
      });
    }
    if (this.footDust.length > 48) {
      this.footDust.splice(0, this.footDust.length - 48);
    }
  }

  _updateGuardian(dt) {
    if (!this.guardian) return;
    const h = this.hero;
    const followDist = 46;
    const desiredX = h.x - (h.dirX || h.lastSide) * followDist;
    const desiredY = h.y - (h.dirY || 0) * (followDist * 0.55) + 4;
    const prevX = this.guardianPos.x;
    const prevY = this.guardianPos.y;
    const lerp = 1 - Math.pow(1 - 0.09, dt * 60);
    this.guardianPos.x += (desiredX - this.guardianPos.x) * lerp;
    this.guardianPos.y += (desiredY - this.guardianPos.y) * lerp;
    const dx = this.guardianPos.x - prevX;
    const dy = this.guardianPos.y - prevY;
    const moved = Math.hypot(dx, dy);
    this.guardianPos.moving = h.moving || moved > 0.35;
    if (Math.abs(dx) > 0.2) {
      this.guardianPos.facing = dx >= 0 ? 1 : -1;
    } else if (h.moving) {
      this.guardianPos.facing = h.facing === 'left' ? -1 : (h.facing === 'right' ? 1 : h.lastSide);
    }
    this.guardianPos.phase += dt * (this.guardianPos.moving ? 7.6 : 2.6);
  }

  _updateEnemies(dt) {
    for (const en of this.enemies) {
      if (!en.alive) {
        if (en.respawnTimer > 0) {
          en.respawnTimer -= dt;
          if (en.respawnTimer <= 0) {
            en.alive = true;
            en.hp = en.maxHp;
            const pt = this._snapToWalkable(en.homeX, en.homeY, 16);
            en.x = pt.x;
            en.y = pt.y;
          }
        }
        continue;
      }

      const isBoss = Boolean(en.data?.isBoss);
      en.aiTimer -= dt;
      if (en.aiPause > 0) {
        en.aiPause -= dt;
        en.phase += dt * 2.2;
      } else {
        // 巡逻移动时以 ~9.5–10.8 rad/s (p = en.phase * 1.45) 步频驱动肢体摆动
        en.phase += dt * (isBoss ? 6.5 : 7.3);

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
        const nx = clamp(en.x + en.vx * spd * dt, 24, this.map.width - 24);
        const ny = clamp(en.y + en.vy * spd * dt, 36, this.map.height - 24);

        if (this._isWalkable(nx, ny, 14)) {
          en.x = nx;
          en.y = ny;
        } else {
          this._moveWithSlide(en, en.vx * spd * dt, en.vy * spd * dt, 14);
        }

        const moved = dist(en.x, en.y, px, py);
        // 若撞墙、受阻或超出巡逻半径，立刻在可行走多边形内重新选取合法方向
        if (moved < 0.2 || dist(en.x, en.y, en.homeX, en.homeY) > en.patrolR + 18) {
          const toHome = Math.atan2(en.homeY - en.y, en.homeX - en.x);
          let found = false;
          for (let tries = 0; tries < 6; tries++) {
            const cand = tries < 2
              ? toHome + (tries === 0 ? 0 : (Math.random() - 0.5) * 1.2)
              : Math.random() * Math.PI * 2;
            const probeX = en.x + Math.cos(cand) * 26;
            const probeY = en.y + Math.sin(cand) * 26;
            if (this._isWalkable(probeX, probeY, 14)) {
              en.vx = Math.cos(cand);
              en.vy = Math.sin(cand);
              found = true;
              break;
            }
          }
          if (!found) {
            en.vx = -en.vx;
            en.vy = -en.vy;
          }
          en.aiTimer = 0.6 + Math.random() * 0.8;
        } else {
          // 踏步扬尘：随步频节拍在脚掌/机甲足底扬起淡尘
          const strideBeat = Math.floor((en.phase * 1.45) / Math.PI);
          if (en._lastStrideBeat === undefined) en._lastStrideBeat = strideBeat;
          if (strideBeat > en._lastStrideBeat) {
            en._lastStrideBeat = strideBeat;
            this._spawnEntityDust(en.x, en.y + 2, en.vx, en.vy, isBoss);
          }
        }

        if (Math.abs(en.vx) > 0.12) {
          en.facing = en.vx >= 0 ? 1 : -1;
        }
      }

      // 遇敌判定
      if (this._encounterCooldown <= 0) {
        const hitR = isBoss ? 52 : 38;
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
    const activeNpc = this._activeNpc || (this.map.npc?.id ? this.map.npc : null);
    if (activeNpc && activeNpc.id) {
      const npcRef = activeNpc;
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
    const portals = this._activePortals?.length ? this._activePortals : (this.map.portals || []);
    for (const p of portals) {
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

    // 4. 搜刮点与残骸（已永久开启的宝箱绝不再高亮交互）
    for (const node of this.lootNodes) {
      if (this._isNodeOpened(node)) continue;
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

    const portals = this._activePortals?.length ? this._activePortals : (map.portals || []);
    const activeNpc = this._activeNpc || (map.npc?.id ? map.npc : null);

    const isClear = (cx, cy) => {
      if (cx < 64 || cx > map.width - 64 || cy < 84 || cy > map.height - 64) return false;
      if (this._collidesAt(cx, cy, 22, { ignoreDynamic: true })) return false;
      if (dist(cx, cy, this.hero.x, this.hero.y) < 52) return false;
      for (const p of portals) {
        if (dist(cx, cy, p.x, p.y) < 62) return false;
      }
      if (activeNpc && dist(cx, cy, activeNpc.x, activeNpc.y) < 60) return false;
      for (const node of this.lootNodes) {
        if (dist(cx, cy, node.x, node.y) < 48) return false;
      }
      return true;
    };

    let candidates;
    if (map.id === 'town') {
      const pt = this._snapToWalkable(790, 545, 20);
      return {
        type: 'save_point',
        x: pt.x,
        y: pt.y,
        label: '墨石记录碑 · 存档'
      };
    } else {
      const sx = this.hero.x ?? map.spawn?.x ?? map.width * 0.5;
      const sy = this.hero.y ?? map.spawn?.y ?? map.height * 0.5;
      candidates = [
        [sx + 110, sy - 20],
        [sx + 110, sy + 40],
        [sx - 110, sy - 20],
        [sx + 80, sy - 75],
        [sx + 80, sy + 75],
        [sx, sy - 85],
        [sx + 135, sy - 65],
        [sx + 65, sy - 55]
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

    const fallbackPt = this._snapToWalkable(
      (this.hero.x ?? map.spawn?.x ?? 200) + 96,
      (this.hero.y ?? map.spawn?.y ?? 300) - 24,
      20
    );
    return {
      type: 'save_point',
      x: fallbackPt.x,
      y: fallbackPt.y,
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
    ctx.scale(this.cameraZoom, this.cameraZoom);
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
      if (mw > 1800) {
        const tileW = mw / 2;
        const tileH = mh / 2;
        // 2×2 无缝镜像拼接渲染（高清不拉伸：公路与地平线在中心线自然接续）
        // Top-Left (0, 0): (scaleX: 1, scaleY: 1)
        ctx.drawImage(entry.img, 0, 0, tileW, tileH);

        // Top-Right (1, 0): (scaleX: -1, scaleY: 1)
        ctx.save();
        ctx.translate(mw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(entry.img, 0, 0, tileW, tileH);
        ctx.restore();

        // Bottom-Left (0, 1): (scaleX: 1, scaleY: -1)
        ctx.save();
        ctx.translate(0, mh);
        ctx.scale(1, -1);
        ctx.drawImage(entry.img, 0, 0, tileW, tileH);
        ctx.restore();

        // Bottom-Right (1, 1): (scaleX: -1, scaleY: -1)
        ctx.save();
        ctx.translate(mw, mh);
        ctx.scale(-1, -1);
        ctx.drawImage(entry.img, 0, 0, tileW, tileH);
        ctx.restore();

        // 中心拼接带柔和水墨薄雾过渡，消除镜像接缝感
        const seamW = Math.max(90, Math.round(mw * 0.045));
        const vGrad = ctx.createLinearGradient(tileW - seamW, 0, tileW + seamW, 0);
        vGrad.addColorStop(0, 'rgba(10, 14, 18, 0)');
        vGrad.addColorStop(0.5, 'rgba(10, 14, 18, 0.22)');
        vGrad.addColorStop(1, 'rgba(10, 14, 18, 0)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(tileW - seamW, 0, seamW * 2, mh);

        const seamH = Math.max(70, Math.round(mh * 0.05));
        const hGrad = ctx.createLinearGradient(0, tileH - seamH, 0, tileH + seamH);
        hGrad.addColorStop(0, 'rgba(10, 14, 18, 0)');
        hGrad.addColorStop(0.5, 'rgba(10, 14, 18, 0.22)');
        hGrad.addColorStop(1, 'rgba(10, 14, 18, 0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, tileH - seamH, mw, seamH * 2);
      } else {
        ctx.drawImage(entry.img, 0, 0, mw, mh);
      }
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
    const portals = this._activePortals?.length ? this._activePortals : (map.portals || []);
    for (const p of portals) {
      this._drawPortalGroundRune(ctx, p, t);
    }

    // 墨石记录碑地面玉金灵阵
    if (this.savePoint) {
      this._drawSavePointGroundRune(ctx, this.savePoint, t);
    }

    // 建筑门前光晕门槛（主城叠加温暖摇曳灯笼光池）
    const isTown = map.id === 'town';
    for (const b of map.buildings || []) {
      const dx = b.doorX ?? (b.x + b.w * 0.5);
      const dy = b.doorY ?? (b.y + b.h + 18);
      const near = dist(this.hero.x, this.hero.y, dx, dy) <= 95;
      const pulse = 0.45 + 0.35 * Math.sin(t * 3.5);
      ctx.save();

      if (isTown) {
        // 温暖灯笼摇曳光池（多频微颤模拟烛火）
        const flicker = 0.82
          + 0.11 * Math.sin(t * 5.8 + dx * 0.07)
          + 0.07 * Math.sin(t * 13.4 + dy * 0.11);
        const poolR = (near ? 64 : 50) * (0.96 + flicker * 0.06);
        ctx.save();
        ctx.translate(dx, dy);
        ctx.scale(1, 0.54);
        const lanternGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, poolR);
        lanternGrad.addColorStop(0, `rgba(255, 206, 118, ${(near ? 0.34 : 0.24) * flicker})`);
        lanternGrad.addColorStop(0.55, `rgba(232, 152, 62, ${(near ? 0.16 : 0.11) * flicker})`);
        lanternGrad.addColorStop(1, 'rgba(212, 120, 42, 0)');
        ctx.fillStyle = lanternGrad;
        ctx.beginPath();
        ctx.arc(0, 0, poolR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

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

    // 脚步足跟墨尘粒子
    if (this.footDust.length > 0) {
      ctx.save();
      for (const d of this.footDust) {
        const p = d.age / d.maxAge;
        const alpha = (1 - p) * (1 - p) * 0.52;
        const rad = d.r * (0.75 + p * 0.95);
        ctx.fillStyle = `rgba(${d.rgb[0]}, ${d.rgb[1]}, ${d.rgb[2]}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, rad * 1.25, rad * 0.78, 0, 0, Math.PI * 2);
        ctx.fill();
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
    const portals = this._activePortals?.length ? this._activePortals : (map.portals || []);
    for (const p of portals) {
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

    // 4. 搜刮点与废弃重炮/机甲残骸（已开启宝箱保留淡化残影，清晰提示已搜空）
    for (const node of this.lootNodes) {
      list.push({
        sortY: node.y,
        draw: (ctx) => this._drawLootNode(ctx, node)
      });
    }

    // 5. NPC
    const activeNpc = this._activeNpc || (map.npc?.id ? map.npc : null);
    if (activeNpc && activeNpc.id) {
      const npcRef = activeNpc;
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

  // ==================== 无框浮空水墨书法名牌辅助 ====================

  _drawFloatingLabel(ctx, label, x, y, fillStyle = '#f5e9d2', font = 'bold 11.5px "Noto Serif SC", "Songti SC", serif', strokeW = 3.5) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = 'rgba(5, 7, 10, 0.92)';
    ctx.strokeText(label, x, y);
    ctx.fillStyle = fillStyle;
    ctx.fillText(label, x, y);
    ctx.restore();
  }

  // ==================== 2.5D 水墨建筑无框书法地标（零矩形框，透出手绘底图） ====================

  _drawBuilding(ctx, b) {
    const px = b.plaqueX ?? b.doorX ?? (b.x + b.w * 0.5);
    const py = b.plaqueY ?? (b.y + 40);
    const dx = b.doorX ?? (b.x + b.w * 0.5);
    const dy = b.doorY ?? (b.y + b.h + 18);
    const near = dist(this.hero.x, this.hero.y, dx, dy) <= 95;
    const label = b.name || b.sign || '建筑';

    this._drawFloatingLabel(
      ctx,
      label,
      px,
      py,
      near ? '#fff4d4' : '#ebd7ae',
      'bold 13.5px "Noto Serif SC", "Songti SC", serif',
      3.8
    );
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
    const isInterior = p.to?.startsWith('interior_');
    const color = isCave ? '#d4b8ff' : isInterior ? '#a7f3d0' : '#f5d996';
    const bob = Math.sin(this._elapsed * 2.4 + p.x * 0.02) * 2.5;
    const label = p.label || '传送阵';
    this._drawFloatingLabel(
      ctx,
      label,
      p.x,
      p.y - 34 + bob,
      color,
      'bold 12px "Noto Serif SC", "Songti SC", serif',
      3.6
    );
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
    const sprite = this._getSprite('shrine');
    const drawH = 108;

    ctx.save();
    ctx.translate(sp.x, sp.y);

    // 接地墨影
    ctx.fillStyle = 'rgba(10, 8, 6, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprite && sprite.loaded && !sprite.error && sprite.img.naturalHeight > 0) {
      const drawW = (sprite.img.naturalWidth / sprite.img.naturalHeight) * drawH;
      ctx.drawImage(sprite.img, -drawW * 0.5, -drawH + 6, drawW, drawH);
    } else {
      // 精灵图加载前回退石碑剪影
      ctx.fillStyle = '#252624';
      ctx.strokeStyle = '#c89b3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -58, 28, 56, 4);
      ctx.fill();
      ctx.stroke();
    }

    // 环绕上升的玉金墨气灵点与柔光尾晕
    for (let i = 0; i < 6; i++) {
      const phase = (t * 0.78 + i / 6) % 1;
      const angle = t * 1.65 + i * (Math.PI / 3);
      const wx = Math.cos(angle) * (24 - phase * 9);
      const wy = -8 - phase * 92;
      const flicker = 0.78 + 0.22 * Math.sin(t * 9.2 + i * 2.1);
      const alpha = Math.sin(phase * Math.PI) * 0.85 * flicker;
      const isJade = i % 2 === 0;
      const rCore = 2.4 * (1 - phase * 0.32);

      // 柔和外光晕
      const wispGlow = ctx.createRadialGradient(wx, wy, 0.5, wx, wy, rCore * 4.2);
      wispGlow.addColorStop(0, isJade
        ? `rgba(132, 244, 192, ${(alpha * 0.55).toFixed(3)})`
        : `rgba(244, 206, 118, ${(alpha * 0.55).toFixed(3)})`);
      wispGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = wispGlow;
      ctx.beginPath();
      ctx.arc(wx, wy, rCore * 4.2, 0, Math.PI * 2);
      ctx.fill();

      // 灵点核心
      ctx.fillStyle = isJade
        ? `rgba(176, 255, 218, ${alpha.toFixed(3)})`
        : `rgba(255, 232, 168, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(wx, wy, rCore, 0, Math.PI * 2);
      ctx.fill();
    }

    // 碑顶无框浮空书法名
    this._drawFloatingLabel(
      ctx,
      '墨石记录碑',
      0,
      -drawH - 6,
      '#b8f5d4',
      'bold 11.5px "Noto Serif SC", "Songti SC", serif',
      3.5
    );

    ctx.restore();
  }

  // ==================== 搜刮宝箱 & 废弃重炮 / 机甲残骸 ====================

  _drawLootNode(ctx, node) {
    const t = this._elapsed;
    const type = node.type || 'crate';
    const isHeavy = type === 'abandoned_cannon' || type === 'mech_wreck';
    const isOpened = this._isNodeOpened(node);
    const qColor = QUALITY[node.item?.quality]?.color
      || (isHeavy ? '#e88b33'
        : type === 'vault_box' || type === 'relic_spot' ? '#d49a3a'
          : type === 'mushroom' ? '#6fb98f'
            : '#c8b48a');
    const pulse = 0.55 + 0.45 * Math.sin(t * 3.4 + node.x * 0.05);
    const bob = isOpened ? 0 : Math.sin(t * 2.6 + node.x * 0.03) * 1.5;
    const sprite = this._getSprite('chest');
    const drawH = isHeavy ? 66 : 54;

    ctx.save();
    ctx.translate(node.x, node.y);

    if (isOpened) {
      // 已永久开启的宝箱：淡化残影（opacity 0.22），无光环无标签，清晰表明已搜空
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = 'rgba(12, 10, 8, 0.42)';
      ctx.beginPath();
      ctx.ellipse(0, 3, isHeavy ? 28 : 20, isHeavy ? 8 : 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (sprite && sprite.loaded && !sprite.error && sprite.img.naturalHeight > 0) {
        const drawW = (sprite.img.naturalWidth / sprite.img.naturalHeight) * drawH;
        ctx.drawImage(sprite.img, -drawW * 0.5, -drawH + 6, drawW, drawH);
      } else {
        ctx.fillStyle = '#3b2e22';
        ctx.strokeStyle = '#6c6257';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-16, -24, 32, 22, 4);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 接地阴影
    ctx.fillStyle = 'rgba(12, 10, 8, 0.46)';
    ctx.beginPath();
    ctx.ellipse(0, 3, isHeavy ? 32 : 24, isHeavy ? 10 : 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 品质色柔光底环
    ctx.save();
    ctx.scale(1, 0.46);
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, isHeavy ? 42 : 32);
    glow.addColorStop(0, `${qColor}66`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, isHeavy ? 42 : 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = qColor;
    ctx.globalAlpha = 0.42 + pulse * 0.35;
    ctx.lineWidth = isHeavy ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, isHeavy ? 32 : 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (sprite && sprite.loaded && !sprite.error && sprite.img.naturalHeight > 0) {
      const drawW = (sprite.img.naturalWidth / sprite.img.naturalHeight) * drawH;
      ctx.drawImage(sprite.img, -drawW * 0.5, -drawH + 6 + bob, drawW, drawH);
    } else {
      ctx.fillStyle = '#573d28';
      ctx.strokeStyle = qColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -24 + bob, 32, 22, 4);
      ctx.fill();
      ctx.stroke();
    }

    // 无框悬浮书法名称
    const label = node.name || node.item?.name || '物资';
    this._drawFloatingLabel(
      ctx,
      label,
      0,
      16,
      qColor,
      'bold 11px "Noto Serif SC", "Songti SC", serif',
      3.5
    );

    ctx.restore();
  }

  // ==================== NPC 手绘透明精灵渲染 ====================

  _drawNpc(ctx, npcRef) {
    const npc = this._getNpcData(npcRef.id) || {
      name: '行者',
      spriteType: 'merchant'
    };
    const t = this._elapsed;
    const breathWave = Math.sin(t * 2.4 + npcRef.x * 0.02);
    const breathScaleY = 1 + breathWave * 0.015;
    const breathScaleX = 1 - breathWave * 0.006;
    const breath = breathWave * 1.0;
    const spriteKey = this._getNpcSpriteKey(npcRef, npc);
    const sprite = this._getSprite(spriteKey);
    const drawH = 76;

    ctx.save();
    ctx.translate(npcRef.x, npcRef.y);

    // 接地墨影
    ctx.fillStyle = 'rgba(10, 8, 6, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 19, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprite && sprite.loaded && !sprite.error && sprite.img.naturalHeight > 0) {
      const drawW = (sprite.img.naturalWidth / sprite.img.naturalHeight) * drawH;
      ctx.save();
      ctx.translate(0, 5);
      ctx.scale((npcRef.facing === 'left' ? -1 : 1) * breathScaleX, breathScaleY);
      ctx.drawImage(sprite.img, -drawW * 0.5, -drawH, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = npc.robeColor || '#4c3e32';
      ctx.strokeStyle = '#c89b3c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-12, -48 + breath, 24, 46, 6);
      ctx.fill();
      ctx.stroke();
    }

    // 头顶无框浮空书法名
    this._drawFloatingLabel(
      ctx,
      npc.name,
      0,
      -drawH - 6 + breath,
      '#fae7b8',
      'bold 12px "Noto Serif SC", "Songti SC", serif',
      3.5
    );

    ctx.restore();
  }

  // ==================== 关节分体步态与摆尾精灵渲染（怪物 & 护驾灵兽共用） ====================

  _drawArticulatedSprite(ctx, spriteKey, img, drawH, t, p, moveAmt, seed = 0) {
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    const drawW = (sw / sh) * drawH;
    const strideScale = drawH / 88;
    const isIdle = moveAmt < 0.05;

    if (spriteKey === 'enemy_beast') {
      // 四足野兽/巨鼠王/啸天犬（原图朝左：前半身 0..0.50*sw，后半身 0.50*sw..sw，尾巴右上 0.62*sw..sw）
      // 1. 摆动/甩动狼尾
      const tailSrcX = sw * 0.62;
      const tailSrcW = sw * 0.38;
      const tailSrcH = sh * 0.52;
      const tailPivX = -drawW * 0.5 + drawW * 0.68;
      const tailPivY = -drawH * 0.56;
      const tailRot = Math.sin(t * (isIdle ? 4.5 : 13) + seed) * (isIdle ? 0.14 : 0.28);
      ctx.save();
      ctx.translate(tailPivX, tailPivY);
      ctx.rotate(tailRot);
      ctx.drawImage(
        img,
        tailSrcX, 0, tailSrcW, tailSrcH,
        (-drawW * 0.5 + drawW * 0.62) - tailPivX, -drawH - tailPivY,
        drawW * 0.38, drawH * 0.52
      );
      ctx.restore();

      // 2. 分体前爪 & 后爪（交替小跑/疾奔步幅，支撑脚紧贴 y = 0）
      const splitRatio = 0.56;
      const splitSrcY = sh * splitRatio;
      const lowerSrcH = sh - splitSrcY;
      const lowerDstH = drawH * (1 - splitRatio);
      const hipY = -lowerDstH;

      const fShift = Math.sin(p) * 12 * strideScale * moveAmt;
      const fRot = Math.sin(p) * 0.30 * moveAmt;
      const fLift = Math.max(0, Math.cos(p)) * 8 * strideScale * moveAmt;

      const hShift = -Math.sin(p) * 12 * strideScale * moveAmt;
      const hRot = -Math.sin(p) * 0.30 * moveAmt;
      const hLift = Math.max(0, -Math.cos(p)) * 8 * strideScale * moveAmt;

      // 后爪
      ctx.save();
      ctx.translate(drawW * 0.25 + hShift, hipY - hLift);
      ctx.rotate(hRot);
      ctx.drawImage(
        img,
        sw * 0.50, splitSrcY, sw * 0.50, lowerSrcH,
        -drawW * 0.25, -1, drawW * 0.50, lowerDstH + 1
      );
      ctx.restore();

      // 前爪
      ctx.save();
      ctx.translate(-drawW * 0.25 + fShift, hipY - fLift);
      ctx.rotate(fRot);
      ctx.drawImage(
        img,
        0, splitSrcY, sw * 0.50, lowerSrcH,
        -drawW * 0.25, -1, drawW * 0.50, lowerDstH + 1
      );
      ctx.restore();

      // 3. 躯干与咆哮兽首（避开尾部区域避免重影，轻微奔跑起伏俯仰）
      const pitch = Math.sin(p) * 0.06 * moveAmt;
      const heave = Math.abs(Math.cos(p)) * 2.2 * strideScale * moveAmt;
      ctx.save();
      ctx.translate(0, hipY - heave);
      ctx.rotate(pitch);
      ctx.drawImage(
        img,
        0, 0, sw * 0.68, sh * 0.60,
        -drawW * 0.5, -drawH * splitRatio, drawW * 0.68, drawH * 0.60
      );
      ctx.restore();
      return;
    }

    if (spriteKey === 'enemy_mech') {
      // 双足重装机甲/掠夺者（原图朝左：髋部 splitY = 0.56*sh，左右足交替重踏）
      const splitRatio = 0.56;
      const splitSrcY = sh * splitRatio;
      const lowerSrcH = sh - splitSrcY;
      const lowerDstH = drawH * (1 - splitRatio);
      const hipY = -lowerDstH;

      const lShift = Math.sin(p) * 11 * strideScale * moveAmt;
      const lRot = Math.sin(p) * 0.26 * moveAmt;
      const lLift = Math.max(0, Math.cos(p)) * 7 * strideScale * moveAmt;

      const rShift = -Math.sin(p) * 11 * strideScale * moveAmt;
      const rRot = -Math.sin(p) * 0.26 * moveAmt;
      const rLift = Math.max(0, -Math.cos(p)) * 7 * strideScale * moveAmt;

      // 先画后摆腿，再画前迈腿
      const drawLeg = (isLeft) => {
        const shift = isLeft ? lShift : rShift;
        const rot = isLeft ? lRot : rRot;
        const lift = isLeft ? lLift : rLift;
        const srcX = isLeft ? 0 : sw * 0.50;
        const pivX = isLeft ? -drawW * 0.22 : drawW * 0.22;
        const dstX = isLeft ? (-drawW * 0.5 - pivX) : (0 - pivX);
        ctx.save();
        ctx.translate(pivX + shift, hipY - lift);
        ctx.rotate(rot);
        ctx.drawImage(
          img,
          srcX, splitSrcY, sw * 0.50, lowerSrcH,
          dstX, -1, drawW * 0.50, lowerDstH + 1
        );
        ctx.restore();
      };

      if (lShift < rShift) {
        drawLeg(true);
        drawLeg(false);
      } else {
        drawLeg(false);
        drawLeg(true);
      }

      // 上半身装甲（伴随沉重脚步微晃）
      const sway = Math.sin(p) * 0.04 * moveAmt;
      const stompHeave = Math.abs(Math.sin(p)) * 1.8 * strideScale * moveAmt;
      ctx.save();
      ctx.translate(0, hipY - stompHeave);
      ctx.rotate(sway);
      ctx.drawImage(
        img,
        0, 0, sw, sh * 0.60,
        -drawW * 0.5, -drawH * splitRatio, drawW, drawH * 0.60
      );
      ctx.restore();
      return;
    }

    // 九尾狐 / 妖灵（原图朝右：后方九尾 0..0.44*sw, 0..0.72*sh；双腿 splitY = 0.64*sh；上半身 0.38*sw..sw, 0..0.66*sh）
    // 1. 飘逸九尾多频摇曳
    const tailPivX = -drawW * 0.5 + drawW * 0.40;
    const tailPivY = -drawH * 0.46;
    const tailSway = Math.sin(t * 3.8 + seed) * (isIdle ? 0.14 : 0.24)
      + Math.sin(t * 7.2 + seed * 1.7) * (isIdle ? 0.03 : 0.06);
    ctx.save();
    ctx.translate(tailPivX, tailPivY);
    ctx.rotate(tailSway);
    ctx.drawImage(
      img,
      0, 0, sw * 0.44, sh * 0.72,
      -drawW * 0.5 - tailPivX, -drawH - tailPivY,
      drawW * 0.44, drawH * 0.72
    );
    ctx.restore();

    // 2. 左右双腿交替轻盈迈步
    const splitRatio = 0.64;
    const splitSrcY = sh * splitRatio;
    const lowerSrcH = sh - splitSrcY;
    const lowerDstH = drawH * (1 - splitRatio);
    const hipY = -lowerDstH;

    const lShift = Math.sin(p) * 10 * strideScale * moveAmt;
    const lRot = Math.sin(p) * 0.24 * moveAmt;
    const lLift = Math.max(0, Math.cos(p)) * 6 * strideScale * moveAmt;

    const rShift = -Math.sin(p) * 10 * strideScale * moveAmt;
    const rRot = -Math.sin(p) * 0.24 * moveAmt;
    const rLift = Math.max(0, -Math.cos(p)) * 6 * strideScale * moveAmt;

    const drawDemonLeg = (isLeft) => {
      const shift = isLeft ? lShift : rShift;
      const rot = isLeft ? lRot : rRot;
      const lift = isLeft ? lLift : rLift;
      const srcX = isLeft ? 0 : sw * 0.50;
      const pivX = isLeft ? -drawW * 0.18 : drawW * 0.18;
      const dstX = isLeft ? (-drawW * 0.5 - pivX) : (0 - pivX);
      ctx.save();
      ctx.translate(pivX + shift, hipY - lift);
      ctx.rotate(rot);
      ctx.drawImage(
        img,
        srcX, splitSrcY, sw * 0.50, lowerSrcH,
        dstX, -1, drawW * 0.50, lowerDstH + 1
      );
      ctx.restore();
    };

    if (lShift < rShift) {
      drawDemonLeg(true);
      drawDemonLeg(false);
    } else {
      drawDemonLeg(false);
      drawDemonLeg(true);
    }

    // 3. 上半身与妖首
    const torsoSway = Math.sin(p) * 0.05 * moveAmt;
    const torsoHeave = Math.abs(Math.sin(p)) * 1.8 * strideScale * moveAmt;
    ctx.save();
    ctx.translate(0, hipY - torsoHeave);
    ctx.rotate(torsoSway);
    ctx.drawImage(
      img,
      sw * 0.38, 0, sw * 0.62, sh * 0.66,
      -drawW * 0.5 + drawW * 0.38, -drawH * splitRatio, drawW * 0.62, drawH * 0.66
    );
    ctx.restore();
  }

  // ==================== 怪物与 Boss 手绘透明精灵渲染 ====================

  _drawEnemy(ctx, en) {
    const tpl = en.data || ENEMIES.rat;
    const isBoss = Boolean(tpl.isBoss);
    const t = this._elapsed;
    const isIdle = en.aiPause > 0;
    const moveAmt = isIdle ? 0 : 1;
    const p = en.phase * 1.45;
    const idleBreathWave = Math.sin(t * 2.6 + en.homeX * 0.03);
    const idleScaleY = isIdle ? (1 + idleBreathWave * 0.015) : 1;
    const idleScaleX = isIdle ? (1 - idleBreathWave * 0.006) : 1;
    const accent = tpl.accent || '#d9483b';
    const spriteKey = this._getEnemySpriteKey(tpl.spriteType);
    const sprite = this._getSprite(spriteKey);
    const drawH = isBoss ? 102 : 76;

    // 精确朝向修正：enemy_beast 与 enemy_mech 原图朝左，enemy_demon 原图朝右
    const spriteFlip = (spriteKey === 'enemy_demon')
      ? (en.facing < 0 ? -1 : 1)
      : (en.facing > 0 ? -1 : 1);

    ctx.save();
    ctx.translate(en.x, en.y);

    // 接地墨影与气场环
    ctx.fillStyle = 'rgba(10, 8, 6, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 3, isBoss ? 34 : 24, isBoss ? 11 : 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isBoss) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 4);
      const aura = ctx.createRadialGradient(0, -drawH * 0.42, 10, 0, -drawH * 0.42, 68);
      aura.addColorStop(0, `rgba(217, 72, 59, ${0.28 + pulse * 0.16})`);
      aura.addColorStop(0.55, `rgba(212, 154, 58, ${0.18 + pulse * 0.12})`);
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -drawH * 0.42, 68, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e6b84c';
      ctx.globalAlpha = 0.55 + pulse * 0.35;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 3, 40, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = 'rgba(181, 58, 46, 0.38)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(0, 3, 26, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 透明 PNG 分体肢体/尾巴动画绘制（足底牢牢贴地 y = 0）
    ctx.save();
    ctx.translate(0, 4);
    ctx.scale(spriteFlip * idleScaleX, idleScaleY);
    if (sprite && sprite.loaded && !sprite.error && sprite.img.naturalHeight > 0) {
      this._drawArticulatedSprite(ctx, spriteKey, sprite.img, drawH, t, p, moveAmt, en.homeX * 0.07);
    } else {
      ctx.translate(0, -4);
      ctx.scale(tpl.scale || 1, tpl.scale || 1);
      this._drawEnemySilhouette(ctx, tpl.spriteType, tpl.color || '#332d29', accent, t);
    }
    ctx.restore();

    // 无框浮空书法名称（零矩形框）
    const labelY = -drawH - 10;
    const label = isBoss ? `【首领】${tpl.name}` : tpl.name;
    this._drawFloatingLabel(
      ctx,
      label,
      0,
      labelY,
      isBoss ? '#fce39c' : '#f7cbc2',
      isBoss ? 'bold 12.5px "Noto Serif SC", "Songti SC", serif' : 'bold 11px "Noto Serif SC", "Songti SC", serif',
      isBoss ? 3.8 : 3.5
    );

    // Boss 血条（或受损敌人血条）
    if (isBoss || en.hp < en.maxHp) {
      const bw = isBoss ? 78 : 48;
      const bh = isBoss ? 5 : 4;
      const pct = clamp(en.hp / Math.max(1, en.maxHp), 0, 1);
      ctx.fillStyle = 'rgba(16, 12, 10, 0.85)';
      ctx.fillRect(-bw * 0.5, labelY + 10, bw, bh);
      ctx.fillStyle = isBoss ? '#e0483b' : '#c95642';
      ctx.fillRect(-bw * 0.5, labelY + 10, bw * pct, bh);
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

  // ==================== 护驾灵兽（真实手绘透明精灵随行奔跑 + 玉金灵光） ====================

  _getGuardianSpriteKey(g) {
    const id = g?.id || '';
    if (id === 'guard_hound' || id === 'guard_miasma') return 'enemy_beast';
    if (id === 'guard_puppet' || id === 'guard_zhurong' || id === 'guard_taotie' || id === 'guard_falcon') {
      return 'enemy_mech';
    }
    return 'enemy_demon';
  }

  _drawGuardian(ctx) {
    const g = this.guardian;
    if (!g) return;
    const gx = this.guardianPos.x;
    const gy = this.guardianPos.y;
    const t = this._elapsed;
    const moving = Boolean(this.guardianPos.moving);
    const moveAmt = moving ? 1 : 0;
    const p = this.guardianPos.phase * 1.45;
    const drawH = 48;
    const spriteKey = this._getGuardianSpriteKey(g);
    const sprite = this._getSprite(spriteKey);
    const facing = this.guardianPos.facing || 1;
    const spriteFlip = (spriteKey === 'enemy_demon')
      ? (facing < 0 ? -1 : 1)
      : (facing > 0 ? -1 : 1);
    const idleWave = Math.sin(t * 2.8);
    const idleScaleY = moving ? 1 : (1 + idleWave * 0.018);
    const idleScaleX = moving ? 1 : (1 - idleWave * 0.008);

    ctx.save();
    ctx.translate(gx, gy);

    // 柔和玉金灵气地面光晕 + 接地墨影
    const pulse = 0.65 + 0.35 * Math.sin(t * 3.4);
    ctx.save();
    ctx.scale(1, 0.48);
    const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 28);
    aura.addColorStop(0, `rgba(116, 232, 176, ${(0.36 * pulse).toFixed(3)})`);
    aura.addColorStop(0.55, `rgba(218, 174, 82, ${(0.22 * pulse).toFixed(3)})`);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(10, 8, 6, 0.46)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 护驾灵兽透明精灵（真实小跑四肢/双足 + 摇尾 + 正确朝向）
    if (sprite && sprite.loaded && !sprite.error && sprite.img.naturalHeight > 0) {
      ctx.save();
      ctx.translate(0, 3);
      ctx.scale(spriteFlip * idleScaleX, idleScaleY);
      this._drawArticulatedSprite(ctx, spriteKey, sprite.img, drawH, t, p, moveAmt, 1.37);
      ctx.restore();
    } else {
      // 加载前极简灵光剪影回退
      const glow = ctx.createRadialGradient(0, -22, 2, 0, -22, 18);
      glow.addColorStop(0, 'rgba(132, 244, 192, 0.65)');
      glow.addColorStop(1, 'rgba(218, 174, 82, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -22, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ==================== 主角「沈砚」真 4 帧手绘行走精灵 + 朱砂墨巾飘动 ====================

  _drawHero(ctx) {
    const h = this.hero;
    const t = this._elapsed;
    const strideBounce = h.moving ? Math.abs(Math.sin(h.walkPhase)) * 1.5 : 0;
    const idleWave = Math.sin(t * 2.6);
    const idleBreathY = h.moving ? 1 : (1 + idleWave * 0.015);
    const idleBreathX = h.moving ? 1 : (1 - idleWave * 0.006);
    const flipX = h.facing === 'left' ? -1 : (h.facing === 'right' ? 1 : h.lastSide);
    const walkSprite = this._getSprite('hero_walk');
    const idleSprite = this._getSprite('hero');
    const drawH = 82;

    ctx.save();
    ctx.translate(h.x, h.y);

    // 脚下接地椭圆墨影
    const shadowScale = (1 - strideBounce * 0.025) * (h.moving ? 1 : (1 - idleWave * 0.025));
    ctx.fillStyle = 'rgba(10, 8, 6, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 21 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (h.moving && walkSprite && walkSprite.loaded && !walkSprite.error && walkSprite.img.naturalHeight > 0) {
      // 真 4 帧手绘行走序列（hero_walk.png: 4 帧横向等宽，朝右行走，足底紧贴 y = 0）
      const img = walkSprite.img;
      const cellW = img.naturalWidth / 4;
      const cellH = img.naturalHeight;
      const drawW = (cellW / cellH) * drawH;
      const frameIdx = Math.floor(h.walkPhase / (Math.PI * 0.55)) % 4;

      ctx.save();
      ctx.translate(0, 3 - strideBounce);
      ctx.scale(flipX, 1);

      // 背后飘动的朱砂墨巾尾带
      this._drawHeroScarfWisp(ctx, -6, -drawH * 0.72, t, h.walkPhase, 1);

      ctx.drawImage(
        img,
        frameIdx * cellW, 0, cellW, cellH,
        -drawW * 0.5, -drawH, drawW, drawH
      );
      ctx.restore();
    } else if (idleSprite && idleSprite.loaded && !idleSprite.error && idleSprite.img.naturalHeight > 0) {
      // 静止站立：hero.png 柔和呼吸，足底牢牢贴地
      const img = idleSprite.img;
      const drawW = (img.naturalWidth / img.naturalHeight) * drawH;
      ctx.save();
      ctx.translate(0, 4);
      ctx.scale(flipX * idleBreathX, idleBreathY);
      ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
      ctx.restore();
    } else {
      // 精灵加载前回退剪影
      ctx.fillStyle = '#1f1c18';
      ctx.strokeStyle = '#c89b3c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-12, -52 - strideBounce, 24, 50, 6);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawHeroScarfWisp(ctx, anchorX, anchorY, t, walkPhase, intensity) {
    const wave1 = Math.sin(t * 12.5) * 4.5 * intensity;
    const wave2 = Math.cos(walkPhase * 1.5 - 0.8) * 6.0 * intensity;
    const tailLen = (20 + Math.sin(t * 8.2) * 3.5) * intensity;

    ctx.save();
    // 主朱砂飘带
    const grad = ctx.createLinearGradient(anchorX, anchorY, anchorX - tailLen, anchorY + wave2);
    grad.addColorStop(0, `rgba(181, 58, 46, ${(0.88 * intensity).toFixed(3)})`);
    grad.addColorStop(0.6, `rgba(214, 78, 58, ${(0.62 * intensity).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(181, 58, 46, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.quadraticCurveTo(
      anchorX - tailLen * 0.52,
      anchorY + 3 + wave1,
      anchorX - tailLen,
      anchorY + 5 + wave2
    );
    ctx.stroke();

    // 细金墨副丝尾
    ctx.strokeStyle = `rgba(232, 186, 102, ${(0.42 * intensity).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY + 2);
    ctx.quadraticCurveTo(
      anchorX - tailLen * 0.45,
      anchorY + 6 - wave1 * 0.6,
      anchorX - tailLen * 0.88,
      anchorY + 8 - wave2 * 0.45
    );
    ctx.stroke();
    ctx.restore();
  }

  // ==================== 无框浮空交互提示 ====================

  _drawInteractHint(ctx, target) {
    const bob = Math.sin(this._elapsed * 4.2) * 3;
    const text = `[E] ${target.label}`;
    const y = target.y - 74 + bob;
    this._drawFloatingLabel(
      ctx,
      text,
      target.x,
      y,
      '#ffe9a8',
      'bold 12.5px "Noto Serif SC", "Songti SC", serif',
      3.8
    );
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
    const uiScale = clamp(Math.min(this.viewW / 1280, this.viewH / 600), 0.72, 1.06);
    const mw = Math.round(146 * uiScale);
    const mh = Math.round(90 * uiScale);
    const padX = Math.max(8, Math.round(14 * uiScale));
    const mx = this.viewW - mw - padX;
    const fallbackTop = Math.round(84 * uiScale);
    let safeTop = fallbackTop;
    const topRightEl = typeof document !== 'undefined'
      ? document.querySelector('.hud-top-right, .hud-right-cluster')
      : null;
    if (topRightEl && this.canvas) {
      const hudRect = topRightEl.getBoundingClientRect();
      const canvasRect = this.canvas.getBoundingClientRect();
      if (hudRect.height > 0) {
        safeTop = Math.max(12, Math.ceil(hudRect.bottom - canvasRect.top) + 8);
      }
    }
    const bottomReserve = Math.round(108 * uiScale);
    const maxBottom = this.viewH - bottomReserve;
    const my = clamp(safeTop, 8, Math.max(8, maxBottom - mh));
    return { x: mx, y: my, w: mw, h: mh };
  }

  _drawMinimap(ctx) {
    const map = this.map;
    if (!map) return;
    const mm = this._getMinimapRect();
    const sx = mm.w / map.width;
    const sy = mm.h / map.height;

    ctx.save();

    // 玄曜暗墨透底框 + 古铜极细边线
    ctx.fillStyle = 'rgba(6, 9, 13, 0.78)';
    ctx.strokeStyle = 'rgba(212, 162, 74, 0.45)';
    ctx.lineWidth = 1;
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
    const portals = this._activePortals?.length ? this._activePortals : (map.portals || []);
    for (const p of portals) {
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

    // 搜刮点（玉绿/重炮橙，已开启宝箱不再显示）
    for (const node of this.lootNodes) {
      if (this._isNodeOpened(node)) continue;
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
    const activeNpc = this._activeNpc || (map.npc?.id ? map.npc : null);
    if (activeNpc && activeNpc.id) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(mm.x + activeNpc.x * sx, mm.y + activeNpc.y * sy, 3, 0, Math.PI * 2);
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
