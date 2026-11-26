// ==================== 《墨土拾荒录》2.5D 水墨废土 RPG · 完整五域核心数据 ====================

export const ASSETS = {
  bg_town: 'assets/bg_town.jpg',
  bg_wasteland: 'assets/bg_wasteland.jpg',
  bg_ruins: 'assets/bg_ruins.jpg',
  bg_swamp: 'assets/bg_swamp.jpg',
  bg_interior: 'assets/bg_interior.jpg',
  bg_cave: 'assets/bg_cave.jpg',
  bg_battle: 'assets/bg_battle.jpg',
  portrait_hero: 'assets/portrait_hero.jpg',
  portrait_laohuang: 'assets/portrait_laohuang.jpg',
  portrait_yinshi: 'assets/portrait_yinshi.jpg'
};

export const QUALITY = {
  common: { key: 'common', name: '凡品', rate: 0.58, multiplier: 1,   color: '#b8b0a0' },
  fine:   { key: 'fine',   name: '良品', rate: 0.27, multiplier: 1.6, color: '#6fb98f' },
  rare:   { key: 'rare',   name: '珍品', rate: 0.12, multiplier: 3.2, color: '#a87bc7' },
  legend: { key: 'legend', name: '绝世', rate: 0.03, multiplier: 10,  color: '#d49a3a' }
};

// 墨土五域总览（5 大域 × 21 张无缝 2.5D 地图）
export const REGIONS = [
  {
    id: 'reg_town', name: '墨石镇域', subtitle: '青石古镇、武馆与城郊荒原', act: 1,
    unlockCost: 0, entryMap: 'town', worldPos: { x: 16, y: 56 },
    maps: ['town', 'interior_shop', 'interior_inn', 'interior_dojo', 'wasteland', 'cave_bunker'],
    bossId: 'boss_ratking', color: '#c89b3c'
  },
  {
    id: 'reg_ruins', name: '铁锈废都域', subtitle: '旧城商街、地铁暗道与古墓密室', act: 2,
    unlockCost: 1200, entryMap: 'ruins', worldPos: { x: 38, y: 36 },
    maps: ['ruins', 'interior_tavern', 'cave_metro', 'cave_crypt'],
    bossId: 'boss_duangang', color: '#8ca0b5'
  },
  {
    id: 'reg_arsenal', name: '赤焰兵工域', subtitle: '兵工废墟、战隼机库与B-04冷却井', act: 3,
    unlockCost: 2400, entryMap: 'arsenal', worldPos: { x: 56, y: 66 },
    maps: ['arsenal', 'interior_armory', 'cave_b04', 'cave_hangar'],
    bossId: 'boss_zhurong', color: '#c96a42'
  },
  {
    id: 'reg_swamp', name: '青瘴毒泽域', subtitle: '辐射沼泽、东岸草庐与狐仙秘境', act: 4,
    unlockCost: 3800, entryMap: 'swamp', worldPos: { x: 74, y: 38 },
    maps: ['swamp', 'interior_hermit', 'cave_mire', 'cave_fox_shrine'],
    bossId: 'boss_lotus_bane', color: '#5fb381'
  },
  {
    id: 'reg_vault', name: '天枢核心域', subtitle: '07号避难所、雷公古坛与地脉密窟', act: 5,
    unlockCost: 6800, entryMap: 'vault', worldPos: { x: 88, y: 68 },
    maps: ['vault', 'cave_thunder_altar', 'cave_tianshu'],
    bossId: 'boss_tianshu', color: '#9d7cd8'
  }
];

// 38 件完整物品（0-11 通用废品与电子件, 12-19 区域专属, 20-24 补给品, 25-29 剧情信物, 30-37 战前古董）
export const ITEMS = [
  // ---- 通用废品与高价值电子件 (0 - 11) ----
  { id: 0,  name: '塑料瓶',     seal: '塑', category: 'scrap', baseValue: 10,  dis: false, desc: '城郊随处可见的再生塑料。' },
  { id: 1,  name: '废纸箱',     seal: '纸', category: 'scrap', baseValue: 18,  dis: false, desc: '印着战前物流编码的硬纸板。' },
  { id: 2,  name: '生锈铁罐',   seal: '铁', category: 'scrap', baseValue: 26,  dis: false, desc: '战前罐头盒，铁皮可回炉或入墨壶淬刃。' },
  { id: 3,  name: '废铜线',     seal: '铜', category: 'scrap', baseValue: 48,  dis: false, desc: '高纯度铜芯线，营地硬通货。' },
  { id: 4,  name: '旧家电',     seal: '器', category: 'tech',  baseValue: 98,  dis: true,  desc: '老式显像管电器，拆开常有惊喜。' },
  { id: 5,  name: '电路板',     seal: '板', category: 'tech',  baseValue: 145, dis: true,  desc: '镀金触点尚存的主板，拆解价值极高。' },
  { id: 6,  name: '废旧显卡',   seal: '算', category: 'tech',  baseValue: 320, dis: true,  desc: '战前算力芯片遗物，可入墨壶铸造脉冲神兵。' },
  { id: 7,  name: '军用蓄电池', seal: '电', category: 'tech',  baseValue: 265, dis: true,  desc: '密封铅酸电池，残余电量仍可驱动外骨骼。' },
  { id: 8,  name: '破损无人机', seal: '机', category: 'tech',  baseValue: 430, dis: true,  desc: '侦察无人机残骸，精密陀螺仪尚存。' },
  { id: 9,  name: '光学镜片',   seal: '镜', category: 'tech',  baseValue: 370, dis: false, desc: '军工级镀膜镜片，狙击长铳核心素材。' },
  { id: 10, name: '辐射稳定核', seal: '核', category: 'rare',  baseValue: 680, dis: true,  desc: '幽蓝微光的同位素容器，收益惊人。' },
  { id: 11, name: '战前黑匣子', seal: '匣', category: 'rare',  baseValue: 950, dis: false, desc: '航空级加密数据盒，铸造轩辕墨渊剑的奇物。' },

  // ---- 区域专属特色道具 (12 - 19) ----
  { id: 12, name: '地铁通行币', seal: '币', category: 'specialty', baseValue: 185,  dis: false, desc: '【废都/地铁专属】战前黄铜乘车币，地下老鬼最爱收集。' },
  { id: 13, name: '大桥钢缆段', seal: '缆', category: 'specialty', baseValue: 245,  dis: true,  desc: '【城郊/高架专属】高强度合金钢索，可炼玄铁软丝甲。' },
  { id: 14, name: '应急信号枪', seal: '焰', category: 'specialty', baseValue: 315,  dis: false, desc: '【城郊/废都专属】未受潮的红色信号弹，可炼赤炎土铳。' },
  { id: 15, name: '破损ATM机芯',seal: '箱', category: 'specialty', baseValue: 465,  dis: true,  desc: '【铁锈废都专属】厚重防盗钱箱残骸，拆解可能暴富！' },
  { id: 16, name: '奢侈品腕表', seal: '表', category: 'specialty', baseValue: 540,  dis: false, desc: '【铁锈废都专属】橱窗遗落的瑞士机械表，品相极佳。' },
  { id: 17, name: '变异荧光菇', seal: '菌', category: 'specialty', baseValue: 295,  dis: false, desc: '【青瘴毒泽专属】散发幽绿微光的真菌，炼丹紧俏货。' },
  { id: 18, name: '军工伺服机', seal: '械', category: 'specialty', baseValue: 520,  dis: true,  desc: '【赤焰兵工专属】高精度液压伺服模块。' },
  { id: 19, name: '避难所芯片', seal: '芯', category: 'specialty', baseValue: 1100, dis: true,  desc: '【07号避难所专属】加密存储核心，价值连城。' },

  // ---- 野生/战斗可用补给品 (20 - 24) ----
  { id: 20, name: '压缩饼干',   seal: '粮', category: 'consumable', baseValue: 22,  dis: false, isConsumable: true, effect: { food: 35, hp: 15 }, desc: '使用：+35 饱食度，+15 生命。' },
  { id: 21, name: '纯净水',     seal: '水', category: 'consumable', baseValue: 28,  dis: false, isConsumable: true, effect: { energy: 30, food: 12 }, desc: '使用：+30 内息/体力，+12 饱食。' },
  { id: 22, name: '金疮药散',   seal: '药', category: 'consumable', baseValue: 50,  dis: false, isConsumable: true, effect: { hp: 65 }, desc: '废土草药与战前止血粉，使用：+65 生命值。' },
  { id: 23, name: '抗辐射药剂', seal: '盾', category: 'consumable', baseValue: 110, dis: false, isConsumable: true, effect: { radShield: 1, hp: 30, energy: 20 }, desc: '使用：获得1层抗辐射护盾，+30生命 +20内息。' },
  { id: 24, name: '烟雾弹',     seal: '烟', category: 'consumable', baseValue: 90,  dis: false, isConsumable: true, effect: { clearWarn: true }, desc: '使用：清零警戒值，战斗中可必定撤退！' },

  // ---- 剧情信物 (25 - 29) ----
  { id: 25, name: '旧手表',     seal: '信', category: 'story', baseValue: 0, dis: false, isStory: true, storyId: 0, desc: '指针停在 21:47 的机械表，刻着「Z·L」。' },
  { id: 26, name: '旧磁带',     seal: '信', category: 'story', baseValue: 0, dis: false, isStory: true, storyId: 1, desc: '受潮录音带，标签写着“撤离路线备用”。' },
  { id: 27, name: '泛黄笔记',   seal: '信', category: 'story', baseValue: 0, dis: false, isStory: true, storyId: 2, desc: '字迹潦草的生存手记，画着地铁与兵工厂草图。' },
  { id: 28, name: '生锈钥匙',   seal: '信', category: 'story', baseValue: 0, dis: false, isStory: true, storyId: 3, desc: '编号 B-04 的黄铜钥匙，开启通往毒泽的排污闸门。' },
  { id: 29, name: '旧照片',     seal: '信', category: 'story', baseValue: 0, dis: false, isStory: true, storyId: 4, desc: '背面用红笔圈出了青瘴东岸草庐的坐标。' },

  // ---- 战前古董 (30 - 37) ----
  { id: 30, name: '青铜吊坠',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 0, desc: '战前博物馆仿古工艺品。' },
  { id: 31, name: '陶瓷碎片',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 1, desc: '清代康熙青花瓷残片。' },
  { id: 32, name: '古币',       seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 2, desc: '清代光绪通宝铜钱。' },
  { id: 33, name: '老邮票册',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 3, desc: '民国时期邮票合集。' },
  { id: 34, name: '翡翠扳指',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 4, desc: '冰种阳绿翡翠。' },
  { id: 35, name: '紫檀木盒',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 5, desc: '小叶紫檀雕花首饰盒。' },
  { id: 36, name: '机械怀表',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 6, desc: '瑞士双盖鎏金怀表。' },
  { id: 37, name: '战前黑胶',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 7, desc: '《第九交响曲》交响乐母盘黑胶唱片。' }
];

// 敌人库（9 种可收服墨妖/机灵 + 5 位洞窟区域首领）
export const ENEMIES = {
  // ---- 普通可收服敌人 ----
  rat: {
    id: 'rat', name: '变异荒原鼠', spriteType: 'rat', isBoss: false, capturable: true,
    color: '#4b433b', accent: '#c95642', scale: 0.88,
    hp: 45, atk: 8, def: 1, exp: 18, gold: 25,
    spiritName: '荒原鼠魂', spiritPower: 12,
    desc: '在废土堆里啃食铁皮的硕鼠，血量低于40%可收入天工墨壶。'
  },
  dog: {
    id: 'dog', name: '红眼野犬', spriteType: 'dog', isBoss: false, capturable: true,
    color: '#3a322d', accent: '#d9483b', scale: 1.0,
    hp: 75, atk: 14, def: 3, exp: 32, gold: 48,
    spiritName: '赤瞳犬魂', spiritPower: 18,
    desc: '游荡在荒原与废弃街区的饥饿猎手，迅捷凶狠。'
  },
  raider: {
    id: 'raider', name: '铁爪帮打手', spriteType: 'raider', isBoss: false, capturable: true,
    color: '#2c292b', accent: '#b53a2e', scale: 1.06,
    hp: 115, atk: 20, def: 6, exp: 55, gold: 95,
    spiritName: '铁爪煞魂', spiritPower: 25,
    desc: '手持钢管与土制火铳的铁爪帮掠夺者。'
  },
  mutant: {
    id: 'mutant', name: '隧道畸变体', spriteType: 'mutant', isBoss: false, capturable: true,
    color: '#33423b', accent: '#6fb98f', scale: 1.1,
    hp: 140, atk: 24, def: 7, exp: 72, gold: 120,
    spiritName: '畸变墨魂', spiritPower: 30,
    desc: '长期受地下辐射侵蚀的失智游荡者。'
  },
  drone: {
    id: 'drone', name: '失控警卫机', spriteType: 'drone', isBoss: false, capturable: true,
    color: '#465058', accent: '#e08b3e', scale: 1.12,
    hp: 180, atk: 30, def: 12, exp: 105, gold: 180,
    spiritName: '警卫机灵魄', spiritPower: 38,
    desc: '兵工厂与避难所残留的战前自动防卫机械。'
  },
  flame_mech: {
    id: 'flame_mech', name: '赤焰焊工机', spriteType: 'flame_mech', isBoss: false, capturable: true,
    color: '#522922', accent: '#e86a33', scale: 1.18,
    hp: 200, atk: 33, def: 13, exp: 120, gold: 200,
    spiritName: '赤焰机灵魄', spiritPower: 44,
    desc: '手持等离子焊枪的失控工矿机兵，出没于赤焰兵工域。'
  },
  slime: {
    id: 'slime', name: '沼泽毒瘴灵', spriteType: 'slime', isBoss: false, capturable: true,
    color: '#254a36', accent: '#7ce8a4', scale: 1.14,
    hp: 220, atk: 35, def: 10, exp: 135, gold: 230,
    spiritName: '毒瘴灵魄', spiritPower: 46,
    desc: '辐射沼泽中凝聚的剧毒生物体，周身萦绕墨绿瘴气。'
  },
  mire_wisp: {
    id: 'mire_wisp', name: '青瘴灯魅', spriteType: 'mire_wisp', isBoss: false, capturable: true,
    color: '#1e4238', accent: '#8af0b8', scale: 1.12,
    hp: 235, atk: 36, def: 9, exp: 145, gold: 245,
    spiritName: '灯魅灵魄', spiritPower: 50,
    desc: '漂浮于腐木栈道上空的幽绿灵火，擅施毒雾与回血。'
  },
  guard: {
    id: 'guard', name: '避难所铁卫', spriteType: 'guard', isBoss: false, capturable: true,
    color: '#302b3d', accent: '#b48ef0', scale: 1.24,
    hp: 310, atk: 44, def: 18, exp: 220, gold: 380,
    spiritName: '天枢铁卫魄', spiritPower: 62,
    desc: '守护 07 号避难所核心的重甲自律机兵。'
  },
  raider_shield: {
    id: 'raider_shield', name: '铁爪重盾兵', spriteType: 'raider_shield', isBoss: false, capturable: true,
    color: '#332928', accent: '#c94a38', scale: 1.15,
    hp: 155, atk: 19, def: 14, exp: 78, gold: 130,
    spiritName: '铁盾煞魂', spiritPower: 34,
    desc: '举着车门焊制重盾的铁爪帮精锐，防御极高，畏惧破甲与穿甲弹。'
  },
  auto_turret: {
    id: 'auto_turret', name: '废弃自律重炮', spriteType: 'auto_turret', isBoss: false, capturable: true,
    color: '#3c454c', accent: '#e88b33', scale: 1.26,
    hp: 245, atk: 38, def: 16, exp: 165, gold: 270,
    spiritName: '重炮机灵魄', spiritPower: 54,
    desc: '战前遗留的自动防空/反装甲炮台，残余能源重启后会无差别炮击！'
  },
  heavy_mech: {
    id: 'heavy_mech', name: '赤焰重装机甲', spriteType: 'heavy_mech', isBoss: false, capturable: true,
    tier: 4, fusionCategory: 'mecha',
    color: '#4e241c', accent: '#ff6629', scale: 1.36,
    hp: 340, atk: 46, def: 20, exp: 260, gold: 440,
    spiritName: '重装机甲魄', spiritPower: 68,
    desc: '兵工厂遗留的双足工业重型机甲，击毁后有极高概率掉落机甲核心！'
  },
  bronze_spirit: {
    id: 'bronze_spirit', name: '青铜剑灵', spriteType: 'bronze_spirit', isBoss: false, capturable: true,
    tier: 2, fusionCategory: 'mythic',
    color: '#344c44', accent: '#7ce8c4', scale: 1.12,
    hp: 150, atk: 26, def: 9, exp: 88, gold: 145,
    spiritName: '青铜剑灵魄', spiritPower: 36,
    desc: '沉睡于旧城古墓中的先秦古剑器灵，剑气凌厉，可炼化绝世神剑。'
  },
  painted_phantom: {
    id: 'painted_phantom', name: '画皮幽影', spriteType: 'painted_phantom', isBoss: false, capturable: true,
    tier: 2, fusionCategory: 'mythic',
    color: '#3e2938', accent: '#e07aa8', scale: 1.08,
    hp: 165, atk: 28, def: 7, exp: 96, gold: 160,
    spiritName: '画皮幽魂', spiritPower: 38,
    desc: '墨雾中披着旧世残衣的诡魅妖灵，身法飘忽，擅摄心魄。'
  },
  corpse_king: {
    id: 'corpse_king', name: '千年尸王', spriteType: 'corpse_king', isBoss: false, capturable: true,
    tier: 3, fusionCategory: 'mythic',
    color: '#2e2b36', accent: '#98c96b', scale: 1.24,
    hp: 265, atk: 37, def: 15, exp: 185, gold: 310,
    spiritName: '尸王玄魄', spiritPower: 56,
    desc: '受墨尘地脉唤醒的古墓尸王，铜皮铁骨，力大无穷。'
  },
  fox_nine: {
    id: 'fox_nine', name: '九尾辐射狐', spriteType: 'fox_nine', isBoss: false, capturable: true,
    tier: 3, fusionCategory: 'mythic',
    color: '#4c2c42', accent: '#f088c8', scale: 1.20,
    hp: 255, atk: 40, def: 12, exp: 195, gold: 330,
    spiritName: '九尾妖狐魄', spiritPower: 58,
    desc: '青瘴秘境中吸收辐射灵气化形的九尾妖狐，擅幻术与妖火！'
  },
  mech_taotie: {
    id: 'mech_taotie', name: '机械饕餮', spriteType: 'mech_taotie', isBoss: false, capturable: true,
    tier: 4, fusionCategory: 'mecha',
    color: '#3a2c24', accent: '#f59e0b', scale: 1.38,
    hp: 360, atk: 48, def: 21, exp: 285, gold: 480,
    spiritName: '机械饕餮魄', spiritPower: 74,
    desc: '墨家凶兽机关与重型战车融合成的金属巨兽，吞噬一切金属与灵能！'
  },
  cyber_rakshasa: {
    id: 'cyber_rakshasa', name: '赛博罗刹', spriteType: 'cyber_rakshasa', isBoss: false, capturable: true,
    tier: 4, fusionCategory: 'mythic',
    color: '#2a1f3d', accent: '#f43f5e', scale: 1.28,
    hp: 330, atk: 52, def: 16, exp: 290, gold: 500,
    spiritName: '赛博罗刹魄', spiritPower: 76,
    desc: '半机械义体与上古罗刹怨魂融合的恐怖刺客，双持高频墨光刃。'
  },
  thunder_remnant: {
    id: 'thunder_remnant', name: '雷公残灵', spriteType: 'thunder_remnant', isBoss: false, capturable: true,
    tier: 4, fusionCategory: 'mythic',
    color: '#1e2c4a', accent: '#38bdf8', scale: 1.30,
    hp: 350, atk: 54, def: 18, exp: 315, gold: 540,
    spiritName: '雷公神魄', spiritPower: 80,
    desc: '天枢雷坛中凝聚的先秦雷神残魂，举手投足引动九天墨雷！'
  },

  // ---- 五大区域洞窟首领（Boss） ----
  boss_ratking: {
    id: 'boss_ratking', name: '墨尾巨鼠王', title: '掩体霸主', spriteType: 'boss_ratking',
    isBoss: true, capturable: false, dropSpiritId: 'rat', dropStoryId: 0,
    color: '#332b26', accent: '#d9483b', scale: 1.55,
    hp: 240, atk: 22, def: 5, exp: 160, gold: 280,
    specialName: '狂啃铁壁', specialEvery: 3, specialMult: 1.6,
    introLine: '“吱——！防空洞里的亮片和旧表，全都是本王的！”',
    defeatLine: '巨鼠王哀鸣倒下，角落里滚出一块指针停在 21:47 的旧手表。',
    desc: '盘踞城郊防空洞深处的变异鼠王，每 3 回合发动蓄力重咬。'
  },
  boss_duangang: {
    id: 'boss_duangang', name: '铁爪二当家·断钢', title: '地铁封锁者', spriteType: 'boss_duangang',
    isBoss: true, capturable: false, dropSpiritId: 'raider', dropStoryId: 2,
    color: '#292224', accent: '#c93b2b', scale: 1.55,
    hp: 420, atk: 34, def: 11, exp: 320, gold: 560,
    specialName: '链锯横扫', specialEvery: 3, specialMult: 1.55, enrageAt: 0.5,
    introLine: '“想过地铁二号线？先把你怀里那只青铜破壶交出来！”',
    phase2Line: '“铁爪帮从不讲规矩！尝尝老子的过载链锯！”',
    defeatLine: '断钢咳血冷笑：“那小子往兵工厂去了，祝融七号会把你们都烧成灰！”',
    desc: '铁爪帮凶悍二当家，半血狂暴后攻击大幅提升。'
  },
  boss_zhurong: {
    id: 'boss_zhurong', name: '赤焰重甲·祝融七号', title: '兵工镇守机', spriteType: 'boss_zhurong',
    isBoss: true, capturable: false, dropSpiritId: 'flame_mech', dropStoryId: 3,
    color: '#4a2018', accent: '#ff7034', scale: 1.68,
    hp: 650, atk: 45, def: 18, exp: 520, gold: 920,
    specialName: '过载喷焰', specialEvery: 3, specialMult: 1.65, inflicts: 'burn',
    introLine: '“警报：B-04 冷却井入侵检测。启动【祝融】焚毁协议。”',
    defeatLine: '重甲核心熄火，露出后方应急闸门与沾血的 B-04 黄铜钥匙。',
    desc: '战前重型炎熔机甲，每 3 回合喷射高热火焰造成灼烧。'
  },
  boss_lotus_bane: {
    id: 'boss_lotus_bane', name: '蚀骨藤灵·千年墨瘴母体', title: '菌窟主宰', spriteType: 'boss_lotus_bane',
    isBoss: true, capturable: false, dropSpiritId: 'slime', dropStoryId: 4,
    color: '#1b3b2c', accent: '#62e698', scale: 1.68,
    hp: 880, atk: 52, def: 16, exp: 780, gold: 1400,
    specialName: '毒瘴再生', specialEvery: 2, specialMult: 1.4, inflicts: 'poison', healAtHalf: 100,
    introLine: '菌窟穹顶剧烈震颤，无数青绿毒藤在浓墨般的瘴气中苏醒！',
    defeatLine: '毒藤枯萎散尽，石台中央绽放出一朵晶莹剔透的「净瘴青莲」。',
    desc: '盘踞沉没菌窟的巨型变异灵体，善施剧毒并能在半血时再生。'
  },
  boss_tianshu: {
    id: 'boss_tianshu', name: '天枢主脑·玄墨大帝', title: '地脉奇点化身', spriteType: 'boss_tianshu',
    isBoss: true, capturable: false, dropSpiritId: 'guard', isFinalBoss: true,
    color: '#221638', accent: '#c084fc', scale: 1.85,
    hp: 1250, atk: 64, def: 24, exp: 1500, gold: 3000,
    specialName: '天枢墨劫', specialEvery: 3, specialMult: 1.75, enrageAt: 0.5,
    introLine: '“旧世已朽，墨尘方为永恒。归还天工墨壶，融于天枢吧！”',
    phase2Line: '“区区凡躯，竟敢以壶逆天？！见证地脉奇点的真容！”',
    defeatLine: '“……原来，21:47 之后，人间仍有灯火未熄……”',
    desc: '吞噬地脉奇点的失控终极主脑，半血觉醒二阶段，决定墨土最终命运。'
  }
};

// 「天工墨壶」炼化护驾灵兽（战斗中每回合自动协同出击）
export const GUARDIANS = {
  guard_hound: {
    id: 'guard_hound', name: '墨影啸天犬', quality: 'fine', seal: '犬',
    color: '#3d3632', accent: '#d49a3a',
    skillName: '墨影撕咬', baseDmg: 18, perLvDmg: 3, effect: 'armor_break',
    desc: '每回合自动撕咬敌人造成 18+Lv×3 物理伤害，20% 概率附加【破甲】。'
  },
  guard_puppet: {
    id: 'guard_puppet', name: '天工机关傀儡', quality: 'rare', seal: '傀',
    color: '#465058', accent: '#6da5c0',
    skillName: '墨铁护阵', baseDmg: 28, shield: 22, effect: 'shield_laser',
    desc: '每回合为主角提供 22 点墨铁护盾，并发射追踪激光造成 28 点伤害。'
  },
  guard_miasma: {
    id: 'guard_miasma', name: '青瘴蛊灵', quality: 'rare', seal: '蛊',
    color: '#254a36', accent: '#6fb98f',
    skillName: '蚀骨毒雾', baseDmg: 26, ignoreDef: true, effect: 'poison',
    desc: '每回合喷吐无视防御的 26 点毒雾伤害，并附加【剧毒】（-18 HP/回合）。'
  },
  guard_zhurong: {
    id: 'guard_zhurong', name: '玄甲祝融将', quality: 'legend', seal: '祝',
    color: '#52221a', accent: '#ff7034',
    skillName: '赤焰天罚', baseDmg: 55, atkBonusPct: 0.15, effect: 'crit_fire',
    desc: '每回合发动「赤焰天罚」造成 55 点暴击火伤，并提升主角攻击 +15%。'
  },
  guard_lotus: {
    id: 'guard_lotus', name: '净世青莲灵', quality: 'legend', seal: '莲',
    color: '#1e4a3b', accent: '#7ce8a4',
    skillName: '青莲甘露', healHp: 38, healMp: 12, effect: 'cleanse',
    desc: '每回合为主角恢复 38 生命与 12 内息，并自动净化中毒/辐射减益！'
  },
  guard_taotie: {
    id: 'guard_taotie', name: '墨甲饕餮', quality: 'legend', seal: '饕',
    color: '#422c1d', accent: '#f59e0b',
    skillName: '饕餮噬魂炮', baseDmg: 64, healHp: 24, effect: 'lifesteal',
    desc: '墨家凶兽重甲！每回合轰出 64 点噬魂伤害并为主角汲取 24 点生命！'
  },
  guard_yinglong: {
    id: 'guard_yinglong', name: '玄天应龙', quality: 'legend', seal: '龙',
    color: '#1d3252', accent: '#38bdf8',
    skillName: '九天墨雷劫', baseDmg: 72, ignoreDef: true, effect: 'armor_break',
    desc: '上古神兽降临！每回合降下无视防御的 72 点九天墨雷并破甲！'
  },
  guard_falcon: {
    id: 'guard_falcon', name: '武装战隼', quality: 'legend', seal: '隼',
    color: '#34414a', accent: '#fb923c',
    skillName: '低空机炮扫射', baseDmg: 58, shield: 18, effect: 'airstrike',
    desc: '战前无人武装战机！每回合自动执行机炮空袭造成 58 点伤害并释放干扰箔条护盾！'
  }
};

// 装备库（4 大槽位：weapon 武器 / armor 护甲 / mech 机甲核心 / relic 秘宝，融合古武/军火/科幻墨甲/神仙妖怪）
export const EQUIPMENT = {
  wpn_inkblade: {
    id: 'wpn_inkblade', name: '淬墨短刃', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', quality: 'fine', seal: '刃',
    atk: 14, crit: 0.08, desc: '【古武】墨尘淬火的轻巧侠客刃：攻击 +14，暴击 +8%。'
  },
  wpn_qingcheng: {
    id: 'wpn_qingcheng', name: '青城墨剑', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', quality: 'rare', seal: '剑',
    atk: 30, crit: 0.16, skillBonus: 0.15, desc: '【古武】青城秘传古剑：攻击 +30，暴击 +16%，武学伤害 +15%。'
  },
  wpn_flaregun: {
    id: 'wpn_flaregun', name: '赤炎土铳', slot: 'weapon', genre: 'military', weaponType: 'pistol', quality: 'fine', seal: '铳',
    atk: 24, crit: 0.10, proc: 'burn', desc: '【军火】短管火铳：攻击 +24，暴击 +10%，普攻 25% 概率附加【灼烧】。'
  },
  wpn_shotgun: {
    id: 'wpn_shotgun', name: '铁爪双管霰弹铳', slot: 'weapon', genre: 'military', weaponType: 'shotgun', quality: 'rare', seal: '霰',
    atk: 32, crit: 0.14, armorPen: 0.15, desc: '【军火】近战轰杀利器：攻击 +32，暴击 +14%，无视 15% 防御。'
  },
  wpn_sniper: {
    id: 'wpn_sniper', name: '反器材狙击长铳', slot: 'weapon', genre: 'military', weaponType: 'sniper', quality: 'rare', seal: '狙',
    atk: 40, crit: 0.20, mechBonus: 0.25, desc: '【军火】重型反器材狙击枪：攻击 +40，暴击 +20%，对机械额外 +25% 穿甲。'
  },
  wpn_gatling: {
    id: 'wpn_gatling', name: '火神加特林重机枪', slot: 'weapon', genre: 'military', weaponType: 'gatling', quality: 'legend', seal: '神',
    atk: 56, crit: 0.18, armorPen: 0.22, desc: '【军火】六管旋转重机枪！攻击 +56，暴击 +18%，倾泻钢铁弹幕无视 22% 防御！'
  },
  wpn_artillery: {
    id: 'wpn_artillery', name: '便携式重炮发射器', slot: 'weapon', genre: 'military', weaponType: 'cannon', quality: 'rare', seal: '炮',
    atk: 48, artilleryBonus: 0.25, desc: '【军火】单兵重炮：攻击 +48，重炮/空袭类技能伤害额外 +25%！'
  },
  wpn_plasma_rifle: {
    id: 'wpn_plasma_rifle', name: '幽蓝等离子脉冲步枪', slot: 'weapon', genre: 'scifi', weaponType: 'plasma', quality: 'rare', seal: '光',
    atk: 44, maxEnergy: 20, crit: 0.15, desc: '【科幻】战前高能步枪：攻击 +44，内息上限 +20，暴击 +15%。'
  },
  wpn_pulsesword: {
    id: 'wpn_pulsesword', name: '墨渊等离子光剑', slot: 'weapon', genre: 'scifi', weaponType: 'blade', quality: 'legend', seal: '脉',
    atk: 54, maxEnergy: 30, skillBonus: 0.22, desc: '【古武×科幻】古剑与能量核炼化而成的墨渊光剑：攻 +54，内息 +30，技能 +22%！'
  },
  wpn_railgun: {
    id: 'wpn_railgun', name: '朱雀烈焰电磁炮', slot: 'weapon', genre: 'scifi', weaponType: 'railgun', quality: 'legend', seal: '雀',
    atk: 66, artilleryBonus: 0.35, proc: 'burn', armorPen: 0.28, desc: '【军火×妖核】重炮与妖核跨界炼化：攻 +66，重炮 +35%，无视 28% 防御并附加灼烧！'
  },
  wpn_xuanyuan: {
    id: 'wpn_xuanyuan', name: '轩辕墨渊剑', slot: 'weapon', genre: 'mythic', weaponType: 'blade', quality: 'legend', seal: '渊',
    atk: 72, def: 14, crit: 0.24, armorPen: 0.32, desc: '【神话神兵】终极绝世神剑：攻 +72，防 +14，暴击 +24%，无视 32% 防御！'
  },
  armor_ironwire: {
    id: 'armor_ironwire', name: '玄铁软丝甲', slot: 'armor', genre: 'wuxia', quality: 'fine', seal: '甲',
    def: 12, maxHp: 45, desc: '【古武】大桥钢缆编织而成：防御 +12，最大生命 +45。'
  },
  armor_exo: {
    id: 'armor_exo', name: '墨甲外骨骼战衣', slot: 'armor', genre: 'scifi', quality: 'rare', seal: '铠',
    def: 26, maxHp: 100, dmgReduce: 0.16, desc: '【墨甲】防御 +26，最大生命 +100，战斗物理减伤 +16%。'
  },
  mech_steam_core: {
    id: 'mech_steam_core', name: '废土蒸汽机甲核', slot: 'mech', genre: 'military', quality: 'fine', seal: '核',
    atk: 12, def: 8, maxHp: 50, artilleryBonus: 0.15, desc: '【机甲】初级机甲核心：攻击 +12，防御 +8，重炮技能 +15%。'
  },
  mech_crimson_frame: {
    id: 'mech_crimson_frame', name: '赤焰重装墨甲', slot: 'mech', genre: 'scifi', quality: 'rare', seal: '机',
    atk: 26, def: 18, maxHp: 95, artilleryBonus: 0.25, desc: '【墨甲】兵工级重装机甲：攻 +26，防 +18，生命 +95，重炮 +25%。'
  },
  mech_bit_array: {
    id: 'mech_bit_array', name: '天工浮游炮阵列', slot: 'mech', genre: 'scifi', quality: 'legend', seal: '浮',
    atk: 34, crit: 0.14, maxEnergy: 25, artilleryBonus: 0.30, desc: '【科幻墨甲】悬浮浮游炮：攻 +34，暴击 +14%，内息 +25，重炮/科幻技 +30%！'
  },
  mech_tianshu_exo: {
    id: 'mech_tianshu_exo', name: '天枢量子玄甲', slot: 'mech', genre: 'scifi', quality: 'legend', seal: '枢',
    atk: 40, def: 26, maxHp: 150, artilleryBonus: 0.40, mpRegen: 6, desc: '【终极墨甲】攻 +40，防 +26，生命 +150，重炮 +40%，每回合回息 +6！'
  },
  relic_fox_orb: {
    id: 'relic_fox_orb', name: '九尾灵珠', slot: 'relic', genre: 'mythic', quality: 'rare', seal: '珠',
    maxHp: 65, maxEnergy: 35, crit: 0.12, desc: '【妖怪秘宝】九尾辐射狐内丹：生命 +65，内息 +35，暴击 +12%。'
  },
  relic_thunder_seal: {
    id: 'relic_thunder_seal', name: '雷公残印', slot: 'relic', genre: 'mythic', quality: 'legend', seal: '雷',
    atk: 24, maxEnergy: 40, skillBonus: 0.25, desc: '【仙家秘宝】雷神残印：攻击 +24，内息 +40，所有奇术与雷击伤害 +25%！'
  },
  relic_tianshu: {
    id: 'relic_tianshu', name: '天枢护心镜', slot: 'relic', genre: 'mythic', quality: 'legend', seal: '镜',
    maxHp: 120, maxEnergy: 45, mpRegen: 8, immuneTide: true,
    desc: '【天枢秘宝】生命 +120，内息 +45，每回合回息 8 点，免疫辐射潮！'
  }
};

// 暗黑式随机装备前后缀词缀（Diablo-style Random Affixes）
export const AFFIXES = {
  prefixes: [
    { id: 'pre_leech',  name: '吸血之', stat: { lifesteal: 0.12 },       desc: '攻击回复 12% 造成伤害的生命' },
    { id: 'pre_pierce', name: '破甲之', stat: { armorPen: 0.20 },        desc: '无视目标 20% 防御' },
    { id: 'pre_crit',   name: '暴击之', stat: { crit: 0.12 },            desc: '暴击率 +12%' },
    { id: 'pre_ink',    name: '墨雷附魔·', stat: { bonusDmg: 16 },       desc: '每次攻击附加 16 点墨雷真伤' },
    { id: 'pre_ap',     name: '穿甲弹头·', stat: { atk: 10, mechBonus: 0.20 }, desc: '攻击 +10，对机械/重甲 +20% 伤害' }
  ],
  suffixes: [
    { id: 'suf_swift',  name: '·迅捷',   stat: { atk: 6, crit: 0.06 },    desc: '攻击 +6，暴击 +6%' },
    { id: 'suf_rad',    name: '·抗辐射', stat: { def: 6, radResist: 0.35 }, desc: '防御 +6，辐射与毒瘴伤害 -35%' },
    { id: 'suf_arty',   name: '·重炮增幅', stat: { artilleryBonus: 0.22 }, desc: '机甲重炮系技能伤害 +22%' },
    { id: 'suf_wall',   name: '·玄铁壁', stat: { def: 10, maxHp: 45 },    desc: '防御 +10，生命上限 +45' },
    { id: 'suf_qi',     name: '·聚息',   stat: { maxEnergy: 20, mpRegen: 4 }, desc: '内息上限 +20，每回合回息 +4' }
  ]
};

// 生成带暗黑随机词缀的装备实例（良品 1 词缀，珍品/绝世 2 词缀）
export function rollEquipment(baseId, qualityOverride = null) {
  const base = EQUIPMENT[baseId];
  if (!base) return null;
  const quality = qualityOverride || base.quality || 'common';
  const inst = { ...base, uid: `${baseId}_${Date.now()}_${Math.floor(Math.random() * 9999)}`, quality, affixes: [] };
  const rollCount = quality === 'legend' || quality === 'rare' ? 2 : quality === 'fine' ? 1 : 0;
  if (rollCount >= 1) {
    const pre = AFFIXES.prefixes[Math.floor(Math.random() * AFFIXES.prefixes.length)];
    inst.affixes.push(pre);
    inst.name = `${pre.name}${inst.name}`;
    for (const [k, v] of Object.entries(pre.stat)) inst[k] = (inst[k] || 0) + v;
  }
  if (rollCount >= 2) {
    const suf = AFFIXES.suffixes[Math.floor(Math.random() * AFFIXES.suffixes.length)];
    inst.affixes.push(suf);
    inst.name = `${inst.name}${suf.name}`;
    for (const [k, v] of Object.entries(suf.stat)) inst[k] = (inst[k] || 0) + v;
  }
  return inst;
}

// 「天工墨壶」炼制稀世丹药
export const ELIXIRS = {
  elixir_jiuzhuan: {
    id: 'elixir_jiuzhuan', name: '九转青瘴丹', quality: 'rare', seal: '丹',
    effect: { hp: 160, energy: 60, radShield: 2 },
    desc: '使用：立即恢复 160 生命 + 60 内息，并获得 2 层抗辐射护盾。'
  },
  elixir_ration: {
    id: 'elixir_ration', name: '墨家行军丸', quality: 'fine', seal: '丸',
    effect: { food: 80, energy: 50, hp: 40 },
    desc: '使用：恢复 80 饱食 + 50 内息 + 40 生命，长途探洞必备。'
  }
};

// 「天工墨壶」26 条跨界炼化配方（古武 × 军火 × 科幻墨甲 × 神仙妖怪）+ 动态任意二合一兜底
export const RECIPES = [
  // ---- 妖 + 妖 → 8 位护驾灵兽/武装战机/神兽 ----
  { id: 'rec_g1', type: 'monster_monster', matA: { kind: 'spirit', id: 'rat' },            matB: { kind: 'spirit', id: 'dog' },            resultType: 'guardian',  resultId: 'guard_hound',    name: '墨影啸天犬',   quality: 'fine',   desc: '荒原鼠魂 + 赤瞳犬魂 → 破甲输出型护驾' },
  { id: 'rec_g2', type: 'monster_monster', matA: { kind: 'spirit', id: 'raider' },         matB: { kind: 'spirit', id: 'drone' },          resultType: 'guardian',  resultId: 'guard_puppet',   name: '天工机关傀儡', quality: 'rare',   desc: '铁爪煞魂 + 警卫机灵魄 → 护盾激光型护驾' },
  { id: 'rec_g3', type: 'monster_monster', matA: { kind: 'spirit', id: 'mutant' },         matB: { kind: 'spirit', id: 'slime' },          resultType: 'guardian',  resultId: 'guard_miasma',   name: '青瘴蛊灵',     quality: 'rare',   desc: '畸变墨魂 + 毒瘴灵魄 → 无视防御剧毒护驾' },
  { id: 'rec_g4', type: 'monster_monster', matA: { kind: 'spirit', id: 'flame_mech' },     matB: { kind: 'spirit', id: 'guard' },          resultType: 'guardian',  resultId: 'guard_zhurong',  name: '玄甲祝融将',   quality: 'legend', desc: '赤焰机灵魄 + 天枢铁卫魄 → 绝世暴击火伤护驾' },
  { id: 'rec_g5', type: 'monster_monster', matA: { kind: 'spirit', id: 'mire_wisp' },      matB: { kind: 'spirit', id: 'slime' },          resultType: 'guardian',  resultId: 'guard_lotus',    name: '净世青莲灵',   quality: 'legend', desc: '灯魅灵魄 + 毒瘴灵魄 → 绝世回血净化护驾' },
  { id: 'rec_g6', type: 'monster_monster', matA: { kind: 'spirit', id: 'heavy_mech' },     matB: { kind: 'spirit', id: 'mech_taotie' },    resultType: 'guardian',  resultId: 'guard_taotie',   name: '墨甲饕餮',     quality: 'legend', desc: '重装机甲魄 + 机械饕餮魄 → 噬魂回血凶兽重甲护驾！' },
  { id: 'rec_g7', type: 'monster_monster', matA: { kind: 'spirit', id: 'fox_nine' },       matB: { kind: 'spirit', id: 'thunder_remnant' },resultType: 'guardian',  resultId: 'guard_yinglong', name: '玄天应龙',     quality: 'legend', desc: '九尾妖狐魄 + 雷公神魄 → 上古九天墨雷神兽护驾！' },
  { id: 'rec_g8', type: 'monster_monster', matA: { kind: 'spirit', id: 'drone' },          matB: { kind: 'spirit', id: 'auto_turret' },    resultType: 'guardian',  resultId: 'guard_falcon',   name: '武装战隼',     quality: 'legend', desc: '警卫机灵魄 + 重炮机灵魄 → 无人武装战机空袭护驾！' },

  // ---- 物 + 物 → 丹药 / 护甲 / 机甲核心 / 秘宝 ----
  { id: 'rec_i1', type: 'item_item',       matA: { kind: 'item', id: 22 },                 matB: { kind: 'item', id: 17 },                 resultType: 'elixir',    resultId: 'elixir_jiuzhuan',    name: '九转青瘴丹',     quality: 'rare',   desc: '金疮药散 + 变异荧光菇 → 高阶疗伤抗辐丹' },
  { id: 'rec_i2', type: 'item_item',       matA: { kind: 'item', id: 20 },                 matB: { kind: 'item', id: 21 },                 resultType: 'elixir',    resultId: 'elixir_ration',      name: '墨家行军丸',     quality: 'fine',   desc: '压缩饼干 + 纯净水 → 全能行军补给丸' },
  { id: 'rec_i3', type: 'item_item',       matA: { kind: 'item', id: 13 },                 matB: { kind: 'item', id: 3 },                  resultType: 'equipment', resultId: 'armor_ironwire',     name: '玄铁软丝甲',     quality: 'fine',   desc: '大桥钢缆段 + 废铜线 → 轻便铁丝护甲' },
  { id: 'rec_i4', type: 'item_item',       matA: { kind: 'item', id: 18 },                 matB: { kind: 'item', id: 7 },                  resultType: 'equipment', resultId: 'armor_exo',          name: '墨甲外骨骼战衣', quality: 'rare',   desc: '军工伺服机 + 军用蓄电池 → 动力重甲' },
  { id: 'rec_i5', type: 'item_item',       matA: { kind: 'item', id: 10 },                 matB: { kind: 'item', id: 19 },                 resultType: 'equipment', resultId: 'relic_tianshu',      name: '天枢护心镜',     quality: 'legend', desc: '辐射稳定核 + 避难所芯片 → 免疫辐射潮秘宝' },
  { id: 'rec_i6', type: 'item_item',       matA: { kind: 'item', id: 5 },                  matB: { kind: 'item', id: 7 },                  resultType: 'equipment', resultId: 'mech_steam_core',    name: '废土蒸汽机甲核', quality: 'fine',   desc: '电路板 + 军用蓄电池 → 初级机甲核心' },
  { id: 'rec_i7', type: 'item_item',       matA: { kind: 'item', id: 8 },                  matB: { kind: 'item', id: 18 },                 resultType: 'equipment', resultId: 'mech_bit_array',     name: '天工浮游炮阵列', quality: 'legend', desc: '破损无人机 + 军工伺服机 → 科幻浮游炮阵列！' },
  { id: 'rec_i8', type: 'item_item',       matA: { kind: 'item', id: 6 },                  matB: { kind: 'item', id: 9 },                  resultType: 'equipment', resultId: 'wpn_plasma_rifle',   name: '幽蓝等离子脉冲步枪', quality: 'rare', desc: '废旧显卡 + 光学镜片 → 高能等离子步枪！' },

  // ---- 妖 + 物 → 跨界绝世神兵 / 现代军火 / 仙妖秘宝 ----
  { id: 'rec_w1',  type: 'monster_item',   matA: { kind: 'spirit', id: 'rat' },            matB: { kind: 'item', id: 2 },                  resultType: 'equipment', resultId: 'wpn_inkblade',       name: '淬墨短刃',         quality: 'fine',   desc: '荒原鼠魂 + 生锈铁罐 → 墨尘淬火短刃' },
  { id: 'rec_w2',  type: 'monster_item',   matA: { kind: 'spirit', id: 'dog' },            matB: { kind: 'item', id: 14 },                 resultType: 'equipment', resultId: 'wpn_flaregun',       name: '赤炎土铳',         quality: 'fine',   desc: '赤瞳犬魂 + 应急信号枪 → 灼烧火铳' },
  { id: 'rec_w3',  type: 'monster_item',   matA: { kind: 'spirit', id: 'raider_shield' },  matB: { kind: 'item', id: 13 },                 resultType: 'equipment', resultId: 'wpn_shotgun',        name: '铁爪双管霰弹铳',   quality: 'rare',   desc: '铁盾煞魂 + 大桥钢缆 → 近战轰杀双管霰弹铳' },
  { id: 'rec_w4',  type: 'monster_item',   matA: { kind: 'spirit', id: 'raider' },         matB: { kind: 'item', id: 9 },                  resultType: 'equipment', resultId: 'wpn_sniper',         name: '反器材狙击长铳',   quality: 'rare',   desc: '铁爪煞魂 + 光学镜片 → 穿甲反器材狙击枪' },
  { id: 'rec_w5',  type: 'monster_item',   matA: { kind: 'spirit', id: 'bronze_spirit' },  matB: { kind: 'item', id: 3 },                  resultType: 'equipment', resultId: 'wpn_qingcheng',      name: '青城墨剑',         quality: 'rare',   desc: '青铜剑灵魄 + 废铜线 → 古武青城秘传剑' },
  { id: 'rec_w6',  type: 'monster_item',   matA: { kind: 'spirit', id: 'drone' },          matB: { kind: 'item', id: 6 },                  resultType: 'equipment', resultId: 'wpn_pulsesword',     name: '墨渊等离子光剑',   quality: 'legend', desc: '警卫机灵魄 + 废旧显卡 → 古武×科幻等离子光剑！' },
  { id: 'rec_w7',  type: 'monster_item',   matA: { kind: 'spirit', id: 'auto_turret' },    matB: { kind: 'item', id: 18 },                 resultType: 'equipment', resultId: 'wpn_gatling',        name: '火神加特林重机枪', quality: 'legend', desc: '重炮机灵魄 + 军工伺服机 → 六管旋转重机枪！' },
  { id: 'rec_w8',  type: 'monster_item',   matA: { kind: 'spirit', id: 'flame_mech' },     matB: { kind: 'item', id: 10 },                 resultType: 'equipment', resultId: 'wpn_railgun',        name: '朱雀烈焰电磁炮',   quality: 'legend', desc: '赤焰机灵魄 + 辐射稳定核 → 重炮×妖核跨界电磁炮！' },
  { id: 'rec_w9',  type: 'monster_item',   matA: { kind: 'spirit', id: 'fox_nine' },       matB: { kind: 'item', id: 17 },                 resultType: 'equipment', resultId: 'relic_fox_orb',      name: '九尾灵珠',         quality: 'rare',   desc: '九尾妖狐魄 + 变异荧光菇 → 暴击内息灵珠' },
  { id: 'rec_w10', type: 'monster_item',   matA: { kind: 'spirit', id: 'thunder_remnant' },matB: { kind: 'item', id: 19 },                 resultType: 'equipment', resultId: 'relic_thunder_seal', name: '雷公残印',         quality: 'legend', desc: '雷公神魄 + 避难所芯片 → 仙家九天雷印秘宝！' },
  { id: 'rec_w11', type: 'monster_item',   matA: { kind: 'spirit', id: 'guard' },          matB: { kind: 'item', id: 11 },                 resultType: 'equipment', resultId: 'wpn_xuanyuan',       name: '轩辕墨渊剑',       quality: 'legend', desc: '天枢铁卫魄 + 战前黑匣子 → 终极绝世神兵！' }
];

// 动态任意二合一炼化兜底（若未命中具名配方，仍按素材阶位与类别生成暗黑随机词缀装备/丹药/护驾）
export function dynamicFuse(matA, matB) {
  const match = RECIPES.find(r =>
    (r.matA.kind === matA.kind && r.matA.id === matA.id && r.matB.kind === matB.kind && r.matB.id === matB.id) ||
    (r.matA.kind === matB.kind && r.matA.id === matB.id && r.matB.kind === matA.kind && r.matB.id === matA.id)
  );
  if (match) {
    if (match.resultType === 'equipment') {
      return { resultType: 'equipment', item: rollEquipment(match.resultId, match.quality), recipe: match };
    }
    return { resultType: match.resultType, resultId: match.resultId, recipe: match };
  }
  const score = (m) => {
    if (m.kind === 'spirit') return (ENEMIES[m.id]?.spiritPower || 20) * 8;
    return ITEMS[m.id]?.baseValue || 40;
  };
  const total = score(matA) + score(matB);
  const quality = total >= 900 ? 'legend' : total >= 420 ? 'rare' : 'fine';
  if (matA.kind === 'spirit' && matB.kind === 'spirit') {
    const gKeys = Object.keys(GUARDIANS);
    const gid = gKeys[Math.min(gKeys.length - 1, Math.floor(total / 180))];
    return { resultType: 'guardian', resultId: gid, dynamic: true };
  }
  if (matA.kind === 'item' && matB.kind === 'item' && total < 220) {
    return { resultType: 'elixir', resultId: total > 120 ? 'elixir_jiuzhuan' : 'elixir_ration', dynamic: true };
  }
  const pool = Object.values(EQUIPMENT).filter(e =>
    quality === 'legend' ? e.quality === 'legend' || e.quality === 'rare' : e.quality === quality || e.quality === 'fine'
  );
  const pick = pool[Math.floor(Math.random() * pool.length)] || EQUIPMENT.wpn_inkblade;
  return { resultType: 'equipment', item: rollEquipment(pick.id, quality), dynamic: true };
}

// 战斗主动技能体系（16 项，跨越 4 大分支：古武门派 / 现代军火 / 科幻墨甲 / 神仙妖怪奇术）
export const COMBAT_SKILLS = [
  // ---- 1. 古武门派 (martial) ----
  {
    id: 'sk_slash', name: '青城破风剑诀', category: 'martial', seal: '剑',
    mpCost: 10, unlockLv: 1, mult: 1.55, critBonus: 0.20,
    desc: '【古武】青城快剑造成 1.55× 物理伤害，暴击率 +20%。',
    flavor: '“刃走龙蛇，墨浪随风破铁衣。”'
  },
  {
    id: 'sk_palm', name: '降龙墨掌劲', category: 'martial', seal: '掌',
    mpCost: 16, unlockLv: 3, mult: 1.85, debuff: 'def_down',
    desc: '【古武】刚猛内劲震碎护甲，造成 1.85× 伤害并降防 25%。',
    flavor: '“亢龙有悔，掌风裂石穿云！”'
  },
  {
    id: 'sk_shatter', name: '断钢裂甲枪', category: 'martial', seal: '枪',
    mpCost: 22, unlockLv: 5, mult: 2.25, armorPen: 0.50,
    desc: '【古武】枪出如龙！无视 50% 防御造成 2.25× 重击，对重甲额外 +25%。',
    flavor: '“一枪断钢梁，神鬼避其锋。”'
  },
  {
    id: 'sk_storm', name: '万墨归宗剑', category: 'martial', seal: '绝',
    mpCost: 32, unlockLv: 8, mult: 2.85, guaranteedCrit: true,
    desc: '【古武绝学】泼墨剑气造成 2.85× 高额伤害并必定暴击！',
    flavor: '“以墨为河，以剑为笔，斩尽废土魍魉！”'
  },

  // ---- 2. 现代军火 (firearm) ----
  {
    id: 'sk_burst', name: '火神加特林扫射', category: 'firearm', seal: '弹',
    mpCost: 14, unlockLv: 2, mult: 1.85, debuff: 'def_down',
    desc: '【军火】六管火神狂泻弹雨，造成 1.85× 伤害并击碎 20% 护甲。',
    flavor: '“弹幕如潮，寸铁不留！”'
  },
  {
    id: 'sk_shotgun', name: '散弹墨霰', category: 'firearm', seal: '霰',
    mpCost: 18, unlockLv: 4, mult: 2.05, debuff: 'burn',
    desc: '【军火】近距轰出灼热铁霰，造成 2.05× 伤害并附加【灼烧】。',
    flavor: '“黑火惊雷起，百步无完甲。”'
  },
  {
    id: 'sk_snipe', name: '反器材穿甲狙杀', category: 'firearm', seal: '狙',
    mpCost: 24, unlockLv: 6, mult: 2.40, armorPen: 0.65, critBonus: 0.30,
    desc: '【军火】穿甲弹头锁定弱点！无视 65% 防御造成 2.4× 伤害，暴击 +30%。',
    flavor: '“一镜锁魂，千里穿铁。”'
  },
  {
    id: 'sk_airstrike', name: '武装战隼空袭', category: 'firearm', seal: '隼',
    mpCost: 30, unlockLv: 7, mult: 2.75, isArtillery: true, debuff: 'burn',
    desc: '【军火绝技】召唤武装战隼低空投弹覆盖！造成 2.75× 爆破伤害并引燃战场！',
    flavor: '“苍穹铁翼掠过，墨土化作火海！”'
  },

  // ---- 3. 科幻墨甲 (mecha) ----
  {
    id: 'sk_cannon', name: '重炮覆盖轰炸', category: 'mecha', seal: '炮',
    mpCost: 20, unlockLv: 3, mult: 2.15, isArtillery: true,
    desc: '【墨甲】便携重炮齐射，造成 2.15× 爆破伤害（受机甲核心增幅）。',
    flavor: '“旧世重火，墨土轰鸣！”'
  },
  {
    id: 'sk_bits', name: '浮游炮齐射', category: 'mecha', seal: '浮',
    mpCost: 22, unlockLv: 4, mult: 2.20, ignoreDef: true, isArtillery: true,
    desc: '【墨甲】展开墨家浮游炮多角激光齐射，无视防御造成 2.2× 光束伤害！',
    flavor: '“墨翼凌空，光束织网！”'
  },
  {
    id: 'sk_overdrive', name: '量子护盾超载', category: 'mecha', seal: '核',
    mpCost: 18, unlockLv: 5, selfBuff: 'overdrive', baseShield: 65, atkBuffPct: 0.30, isArtillery: true,
    desc: '【墨甲】外骨骼量子护盾展开！获得 65 点护盾，3 回合内攻击力 +30%。',
    flavor: '“核心红温，战力破限！”'
  },
  {
    id: 'sk_railgun', name: '轨道电磁炮', category: 'mecha', seal: '轨',
    mpCost: 34, unlockLv: 8, mult: 3.15, ignoreDef: true, isArtillery: true,
    desc: '【墨甲终极】发射贯穿地脉的轨道电磁光束，无视防御造成 3.15× 毁灭伤害！',
    flavor: '“天工雷霆降，山岳亦成尘。”'
  },

  // ---- 4. 神仙妖怪 · 墨土奇术 (mystic) ----
  {
    id: 'sk_shield', name: '玄墨金钟罩', category: 'mystic', seal: '盾',
    mpCost: 14, unlockLv: 1, selfBuff: 'shield', baseShield: 45, perLvShield: 8, dmgReduce: 0.30,
    desc: '【奇术】展开墨家机关气盾（45+Lv×8 护盾），2 回合内减伤 30%。',
    flavor: '“青铜铭文绕身，百邪莫近。”'
  },
  {
    id: 'sk_fire', name: '赤焰焚墨', category: 'mystic', seal: '焰',
    mpCost: 18, unlockLv: 4, mult: 1.75, magic: true, debuff: 'burn',
    desc: '【奇术】引动兵工地火造成 1.75× 术法伤害，必附加【灼烧】（-22 HP/回合）。',
    flavor: '“赤焰燃残铁，焦土化红莲。”'
  },
  {
    id: 'sk_heal', name: '回春青莲诀', category: 'mystic', seal: '愈',
    mpCost: 20, unlockLv: 6, selfBuff: 'heal', healPct: 0.45, cleanse: true,
    desc: '【奇术】恢复 45% 最大生命值，并清除【中毒】【灼烧】【辐射】状态。',
    flavor: '“毒瘴深处生青莲，一缕清风起沉疴。”'
  },
  {
    id: 'sk_crucible', name: '墨壶镇魂印', category: 'mystic', seal: '壶',
    mpCost: 26, unlockLv: 7, mult: 2.10, ignoreDef: true, stun: 1, captureBonus: 0.20,
    desc: '【奇术】无视防御造成 2.1× 伤害并眩晕目标 1 回合，本回合【收妖】成功率 +20%！',
    flavor: '“壶中日月转，万妖伏青铜。”'
  }
];

// 核心 NPC 库（9 位：5 位核心人物 + 4 位可步入室内掌柜/挚友）
export const NPCS = {
  laohuang: {
    id: 'laohuang', name: '商人老黄', title: '墨石镇杂货东家 · 百事通',
    portrait: 'assets/portrait_laohuang.jpg',
    spriteType: 'merchant', robeColor: '#5b4636', accentColor: '#c89b3c',
    talk: '“沈砚，城郊防空洞昨夜传出无线电杂音，还有人捡到一块停在 21:47 的破表……像极了当年跟你一道的阿哲。”',
    options: [
      { text: '进入商铺买卖物资（老黄杂货柜台）', desc: '打开杂货铺交易界面', action: 'shop' },
      { text: '打听同伴「阿哲」的下落', desc: '获取剧情线索与方向提示' },
      { text: '请求高价收购（声望≥2享+15%溢价）', desc: '立即按当前市价溢价变卖背包物资' }
    ]
  },
  yaotong: {
    id: 'yaotong', name: '回春药童', title: '墨石镇回春医馆坐堂',
    portrait: 'assets/portrait_hero.jpg',
    spriteType: 'healer', robeColor: '#365445', accentColor: '#7ce8a4',
    talk: '“少侠风尘仆仆，快请进屋歇脚。炉上刚熬好安神汤，敷上金疮散便能元气复原。”',
    options: [
      { text: '歇脚疗伤（打开回春医馆）', desc: '恢复生命、内息与饱食度', action: 'inn' },
      { text: '讨教青瘴毒泽草药之理', desc: '了解抗辐射护盾与炼丹诀窍' },
      { text: '捐赠药资套近乎（+1 声望）', desc: '提升墨石镇声望' }
    ]
  },
  laogui: {
    id: 'laogui', name: '盲眼老鬼', title: '城郊与地铁向导',
    portrait: 'assets/portrait_yinshi.jpg',
    spriteType: 'guide', robeColor: '#3a3f42', accentColor: '#d49a3a',
    talk: '“城郊北边塌坡下藏着战前防空洞，东边则是铁锈废都与地铁二号线。没盏明灯和熟人引路，莫乱闯！”',
    options: [
      { text: '花 150 金买废土密道图', desc: '立即刷新并强化当前地图搜刮点品质！' },
      { text: '打听防空洞与阿哲踪迹', desc: '推进城郊寻踪线索' },
      { text: '讨一碗热茶（+25生命 +20内息）', desc: '老鬼看你顺眼，分你半壶热茶' }
    ]
  },
  shaobing: {
    id: 'shaobing', name: '铁爪哨兵·阿豹', title: '铁爪帮外围头目',
    portrait: 'assets/portrait_hero.jpg',
    spriteType: 'raider_npc', robeColor: '#3b2c2a', accentColor: '#b53a2e',
    talk: '“想穿过这片铁锈废都去地铁二号线？要么留下买路财，要么去西边酒馆找规矩！”',
    options: [
      { text: '给 200 金币买路（清零警戒）', desc: '花钱消灾，安全探索' },
      { text: '亮出营地声望震慑（需声望≥3）', desc: '免费清零警戒并获赠情报' },
      { text: '塞一份干粮溜进去（-30饱食，警戒减半）', desc: '用口粮打发哨兵' }
    ]
  },
  jiubao: {
    id: 'jiubao', name: '黑市酒保·三娘', title: '废都黑市酒馆掌柜',
    portrait: 'assets/portrait_laohuang.jpg',
    spriteType: 'merchant', robeColor: '#4a2c2a', accentColor: '#d49a3a',
    talk: '“废都里什么都能换——烟雾弹、金疮散，还有地铁二号线塌方口的暗门机关。喝一杯再走？”',
    options: [
      { text: '黑市交易（买卖补给与赃物）', desc: '打开商铺界面', action: 'shop' },
      { text: '打听地铁二号线断钢的情报', desc: '了解第二幕首领弱点' },
      { text: '买一杯烈酒壮胆（+35 内息）', desc: '提振内息再探地铁' }
    ]
  },
  tiejiang: {
    id: 'tiejiang', name: '军工老铁匠', title: '赤焰兵工遗民',
    portrait: 'assets/portrait_laohuang.jpg',
    spriteType: 'smith', robeColor: '#523024', accentColor: '#e86a33',
    talk: '“好一只先秦青铜墨壶！借我这战前军械库的余火，保管能把妖魂与铁料炼成绝世神兵！”',
    options: [
      { text: '借用炉台开启「天工墨壶」炼化', desc: '打开墨壶炼化界面', action: 'crucible' },
      { text: '拆解军工残骸（打开拆解坊）', desc: '高暴击拆解电器与伺服机', action: 'disassemble' },
      { text: '打听 B-04 冷却井与祝融七号', desc: '了解第三幕首领机制' }
    ]
  },
  yinshi: {
    id: 'yinshi', name: '废土隐士·药翁', title: '青瘴毒泽守望者',
    portrait: 'assets/portrait_yinshi.jpg',
    spriteType: 'hermit', robeColor: '#2c3d34', accentColor: '#6fb98f',
    talk: '“十余载毒瘴翻涌，唯有心怀执念者方能涉足此地。你寻的那位故人，老夫当年确实救过，他就在东岸草庐里。”',
    options: [
      { text: '追问同伴阿哲的近况', desc: '获得东岸草庐与净瘴青莲指引' },
      { text: '以 300 金求购抗辐射秘药', desc: '获得 1 层抗辐射护盾与 +30 生命' },
      { text: '分享食物与故事（-20饱食，+2声望）', desc: '大幅提升隐士好感' }
    ]
  },
  azhe: {
    id: 'azhe', name: '陆哲（阿哲）', title: '失散挚友 · 前07号信使',
    portrait: 'assets/portrait_hero.jpg',
    spriteType: 'ally', robeColor: '#3b4a54', accentColor: '#c89b3c',
    talk: '“21:47……我记得漫天黑雪，还有 07 号大厅里那个像墨水一样翻涌的太阳。沈砚，把天工墨壶带回主控核心，只有你能终结天枢！”',
    options: [
      { text: '将「旧手表」与线索交予阿哲', desc: '触发重逢羁绊对话与主线推进' },
      { text: '请阿哲调试无线电（恢复满内息）', desc: '与老友篝火夜谈，元气满满' },
      { text: '询问 07 号避难所与玄墨大帝', desc: '获取最终决战情报' }
    ]
  },
  xuezhe: {
    id: 'xuezhe', name: '黑市学者·林博士', title: '07号避难所前研究员',
    portrait: 'assets/portrait_laohuang.jpg',
    spriteType: 'scholar', robeColor: '#36324a', accentColor: '#9d7cd8',
    talk: '“天工墨壶正是天枢核心最早的原型稳定器。若你能击溃玄墨大帝，墨土的命运便交由你定夺。”',
    options: [
      { text: '用 400 金兑换 1 点修为点', desc: '战前神经强化（升级武学/生存技）' },
      { text: '询问「墨土之王」隐藏结局条件', desc: '了解终极完美结局要求' },
      { text: '出售黑匣子情报（高价变卖背包）', desc: '学者溢价 +25% 收购背包物资' }
    ]
  },
  jiaotou: {
    id: 'jiaotou', name: '青城武馆教头', title: '墨石武馆宗师',
    portrait: 'assets/portrait_yinshi.jpg',
    spriteType: 'master', robeColor: '#2d3a46', accentColor: '#d49a3a',
    talk: '“废土之上，唯有古武内劲配以新世军火方能立于不败。想学青城剑诀与降龙掌劲，还是来切磋一番？”',
    options: [
      { text: '研习古武修为（打开技能修为阁）', desc: '消耗修为点升级六大被动修为', action: 'skills' },
      { text: '请教四系流派搭配心得', desc: '了解古武/军火/墨甲/奇术克制之道' },
      { text: '打坐吐纳恢复内息（免费回满内息）', desc: '在武馆蒲团调息片刻' }
    ]
  }
};

// ==================== 16 张无缝 2.5D 地图定义 ====================
export const MAPS = [
  // ---------- 1. 主城「墨石镇」 ----------
  {
    id: 'town', index: 0, regionId: 'reg_town', sceneType: 'town',
    name: '墨石镇', short: '墨石镇', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['wasteland'],
    width: 1600, height: 1000,
    bgAsset: 'bg_town.jpg', bgTint: null,
    spawn: { x: 800, y: 515 },
    palette: { ground: '#c7b89c', road: '#a7967a', shadow: 'rgba(28,25,22,0.34)', accent: '#c89b3c', mist: 'rgba(232,222,200,0.12)' },
    weatherPool: [0],
    desc: '废土中仅存的青石古镇。老黄杂货铺与回春医馆可直接步入内室，亦可于拆解坊、钱庄、悬赏榜整备后自东门踏入荒原。',
    weight: new Array(38).fill(0),
    buildings: [
      {
        id: 'shop', name: '老黄杂货铺', sign: '杂货',
        x: 190, y: 170, w: 260, h: 145, roofH: 78,
        doorX: 320, doorY: 335, action: 'enter_map', targetMap: 'interior_shop', targetSpawnX: 500, targetSpawnY: 565,
        style: 'timber_shop', desc: '步入杂货铺内室，与老黄交易物资或听取阿哲线索。'
      },
      {
        id: 'disassemble', name: '巧匠拆解坊', sign: '拆解',
        x: 650, y: 155, w: 260, h: 145, roofH: 82,
        doorX: 780, doorY: 320, action: 'disassemble',
        style: 'forge', desc: '拆解旧家电、主板与军工残骸，博取高额暴击收益。'
      },
      {
        id: 'inn', name: '回春医馆', sign: '医馆',
        x: 1110, y: 170, w: 260, h: 145, roofH: 76,
        doorX: 1240, doorY: 335, action: 'enter_map', targetMap: 'interior_inn', targetSpawnX: 500, targetSpawnY: 565,
        style: 'clinic', desc: '步入回春医馆内室歇脚疗伤，恢复生命、内息与饱食。'
      },
      {
        id: 'loan', name: '黑哥钱庄', sign: '钱庄',
        x: 210, y: 625, w: 250, h: 140, roofH: 76,
        doorX: 335, doorY: 785, action: 'loan',
        style: 'pawnshop', desc: '周转废土币、偿还债务与筹措出征资金。'
      },
      {
        id: 'bounty', name: '镇口悬赏榜', sign: '悬赏',
        x: 715, y: 665, w: 170, h: 90, roofH: 52,
        doorX: 800, doorY: 775, action: 'tasks',
        style: 'board', desc: '查看每日/周常悬赏、小队任务与墨土排行。'
      },
      {
        id: 'gate', name: '镇门驿站', sign: '驿站',
        x: 1325, y: 415, w: 165, h: 165, roofH: 96,
        doorX: 1305, doorY: 500, action: 'worldmap',
        style: 'gatehouse', desc: '打开墨土五域舆图，解锁并传送至各大野外险境。'
      }
    ],
    obstacles: [
      { id: 'town_well', type: 'stone_well', x: 760, y: 425, w: 80, h: 56, label: '古石井' },
      { id: 'town_tree_nw', type: 'ink_tree', x: 95, y: 245, w: 58, h: 48, label: '枯槐' },
      { id: 'town_tree_sw', type: 'ink_tree', x: 105, y: 745, w: 62, h: 50, label: '老松' },
      { id: 'town_crates_se', type: 'crate_stack', x: 1120, y: 705, w: 110, h: 68, label: '商队货箱' }
    ],
    portals: [
      { id: 'town_to_wasteland', x: 1535, y: 500, r: 44, to: 'wasteland',     spawnX: 175, spawnY: 560, label: '出东门 · 前往城郊废土' },
      { id: 'town_to_dojo',      x: 1030, y: 760, r: 42, to: 'interior_dojo', spawnX: 500, spawnY: 565, label: '步入 墨石武馆' }
    ],
    npc: { id: 'laohuang', x: 495, y: 365, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 2. 室内：老黄杂货铺内室 ----------
  {
    id: 'interior_shop', index: 1, regionId: 'reg_town', sceneType: 'interior',
    name: '老黄杂货铺·内室', short: '杂货内室', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['town'],
    width: 1000, height: 700,
    bgAsset: 'bg_interior.jpg', bgTint: null,
    spawn: { x: 500, y: 565 },
    palette: { ground: '#8c7256', road: '#6f5840', shadow: 'rgba(20,14,10,0.42)', accent: '#c89b3c', mist: 'rgba(232,210,170,0.08)' },
    weatherPool: [0],
    desc: '木柜林立、暖灯微晃的杂货铺内室。柜台后立着精明的商人老黄，角落放着一台战前留声机。',
    weight: new Array(38).fill(0),
    buildings: [],
    obstacles: [
      { id: 'shop_counter', type: 'wood_counter', x: 260, y: 220, w: 480, h: 72, label: '杂货柜台' },
      { id: 'shop_shelf_l', type: 'crate_stack',  x: 90,  y: 340, w: 95,  h: 150, label: '货架' },
      { id: 'shop_shelf_r', type: 'crate_stack',  x: 815, y: 340, w: 95,  h: 150, label: '旧物柜' }
    ],
    portals: [
      { id: 'shop_exit', x: 500, y: 640, r: 44, to: 'town', spawnX: 320, spawnY: 365, label: '走出老黄杂货铺' }
    ],
    npc: { id: 'laohuang', x: 500, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 3. 室内：回春医馆内室 ----------
  {
    id: 'interior_inn', index: 2, regionId: 'reg_town', sceneType: 'interior',
    name: '回春医馆·内室', short: '医馆内室', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['town'],
    width: 1000, height: 700,
    bgAsset: 'bg_interior.jpg', bgTint: 'rgba(140, 185, 145, 0.16)',
    spawn: { x: 500, y: 565 },
    palette: { ground: '#7f7864', road: '#635e4d', shadow: 'rgba(18,22,16,0.38)', accent: '#6fb98f', mist: 'rgba(180,220,185,0.10)' },
    weatherPool: [0],
    desc: '百草柜飘散着苦涩药香，药炉文火不熄。可向回春药童求医歇脚，迅速回复生命与内息。',
    weight: new Array(38).fill(0),
    buildings: [],
    obstacles: [
      { id: 'inn_counter', type: 'wood_counter', x: 270, y: 220, w: 460, h: 72, label: '药房柜台' },
      { id: 'inn_bed_l',   type: 'crate_stack',  x: 95,  y: 350, w: 110, h: 145, label: '竹榻病床' },
      { id: 'inn_stove_r', type: 'stone_well',   x: 795, y: 365, w: 95,  h: 95,  label: '煎药丹炉' }
    ],
    portals: [
      { id: 'inn_exit', x: 500, y: 640, r: 44, to: 'town', spawnX: 1240, spawnY: 365, label: '走出回春医馆' }
    ],
    npc: { id: 'yaotong', x: 500, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 4. 野外：城郊废土 ----------
  {
    id: 'wasteland', index: 3, regionId: 'reg_town', sceneType: 'wild',
    name: '城郊废土', short: '城郊废土', isSafe: false, unlockCost: 0,
    worldPos: { x: 26, y: 56 }, links: ['town', 'cave_bunker', 'ruins'],
    width: 1800, height: 1100,
    bgAsset: 'bg_wasteland.jpg', bgTint: null,
    spawn: { x: 175, y: 560 },
    palette: { ground: '#7e6e58', road: '#5f5242', shadow: 'rgba(24,20,16,0.38)', accent: '#c89b3c', mist: 'rgba(204,184,150,0.14)' },
    weatherPool: [0, 3, 4],
    desc: '浓淡墨色笼罩的城郊荒原，北侧塌坡隐藏着战前防空洞铁门，东行可抵铁锈废都。',
    weight: [28, 22, 18, 12, 6, 3, 1, 0, 0, 0, 0, 0, 0, 5, 4, 0, 0, 0, 0, 0, 6, 5, 3, 0, 1, 5, 2, 0, 0, 0, 3, 2, 1, 0, 0, 0, 0, 0],
    buildings: [],
    obstacles: [
      { id: 'wl_wreck_1', type: 'car_wreck', x: 380,  y: 260, w: 145, h: 74, label: '生锈卡车' },
      { id: 'wl_wall_1',  type: 'ruin_wall', x: 640,  y: 205, w: 165, h: 64, label: '残垣断壁' },
      { id: 'wl_tree_1',  type: 'ink_tree',  x: 1190, y: 255, w: 72,  h: 56, label: '焦枯老树' },
      { id: 'wl_wreck_2', type: 'car_wreck', x: 520,  y: 740, w: 155, h: 78, label: '倾覆公交' },
      { id: 'wl_rock_1',  type: 'boulder',   x: 1020, y: 690, w: 130, h: 86, label: '风化岩堆' },
      { id: 'wl_wall_2',  type: 'ruin_wall', x: 1380, y: 770, w: 170, h: 66, label: '塌陷砖墙' }
    ],
    portals: [
      { id: 'wl_to_town',   x: 90,   y: 560, r: 44, to: 'town',        spawnX: 1435, spawnY: 500, label: '返回 墨石镇' },
      { id: 'wl_to_bunker', x: 930,  y: 145, r: 46, to: 'cave_bunker', spawnX: 185,  spawnY: 700, label: '潜入 城郊废弃防空洞' },
      { id: 'wl_to_ruins',  x: 1705, y: 540, r: 44, to: 'ruins',       spawnX: 175,  spawnY: 560, label: '前往 铁锈废都街区' }
    ],
    npc: { id: 'laogui', x: 640, y: 425, facing: 'down' },
    enemySpawns: [
      { enemyId: 'rat', x: 470,  y: 500, patrolR: 110, speed: 78 },
      { enemyId: 'rat', x: 960,  y: 380, patrolR: 120, speed: 82 },
      { enemyId: 'dog', x: 1320, y: 560, patrolR: 135, speed: 95 },
      { enemyId: 'rat', x: 840,  y: 840, patrolR: 115, speed: 80 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'wl_loot_1', x: 310,  y: 390, r: 34, name: '路边废品堆', type: 'scrap_pile', respawnSec: 18 },
      { id: 'wl_loot_2', x: 560,  y: 235, r: 34, name: '破损报亭',   type: 'crate',      respawnSec: 20 },
      { id: 'wl_loot_3', x: 970,  y: 530, r: 34, name: '旧车后备箱', type: 'car_loot',   respawnSec: 22 },
      { id: 'wl_loot_4', x: 1360, y: 340, r: 34, name: '断桥钢索堆', type: 'scrap_pile', respawnSec: 22 },
      { id: 'wl_loot_5', x: 410,  y: 860, r: 34, name: '倾覆货柜',   type: 'crate',      respawnSec: 24 },
      { id: 'wl_loot_6', x: 1230, y: 840, r: 34, name: '战前邮筒',     type: 'relic_spot', respawnSec: 26 },
      { id: 'wl_cannon', x: 1520, y: 310, r: 40, name: '废弃防空重炮', type: 'abandoned_cannon', salvageElite: 'auto_turret', equipPool: ['wpn_flaregun', 'mech_steam_core'], respawnSec: 45 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 5. 洞窟：城郊废弃防空洞 ----------
  {
    id: 'cave_bunker', index: 4, regionId: 'reg_town', sceneType: 'cave',
    name: '城郊废弃防空洞', short: '防空洞', isSafe: false, unlockCost: 0,
    worldPos: { x: 26, y: 46 }, links: ['wasteland'],
    width: 1200, height: 850,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(40, 32, 24, 0.22)',
    spawn: { x: 185, y: 700 },
    palette: { ground: '#383028', road: '#2b241d', shadow: 'rgba(10,8,6,0.52)', accent: '#d49a3a', mist: 'rgba(90,78,62,0.16)' },
    weatherPool: [0],
    desc: '潮湿阴暗的战前人防掩体，深处盘踞着「墨尾巨鼠王」，藏有阿哲遗落的旧手表与高爆率宝箱。',
    weight: [14, 14, 16, 14, 10, 8, 4, 2, 0, 0, 0, 0, 0, 8, 6, 0, 0, 0, 0, 0, 6, 5, 5, 1, 2, 12, 4, 0, 0, 0, 5, 4, 3, 1, 0, 0, 0, 0],
    buildings: [],
    obstacles: [
      { id: 'cb_rock_1', type: 'boulder',   x: 370, y: 240, w: 120, h: 95, label: '塌方石柱' },
      { id: 'cb_rock_2', type: 'boulder',   x: 690, y: 500, w: 135, h: 95, label: '人防混凝土墩' },
      { id: 'cb_crate',  type: 'crate_stack', x: 240, y: 460, w: 90, h: 70, label: '废弃弹药箱' }
    ],
    portals: [
      { id: 'bunker_exit', x: 120, y: 760, r: 44, to: 'wasteland', spawnX: 930, spawnY: 215, label: '离开防空洞 · 返回城郊' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'rat', x: 460, y: 590, patrolR: 95, speed: 82 },
      { enemyId: 'dog', x: 650, y: 310, patrolR: 105, speed: 92 }
    ],
    bossSpawn: { enemyId: 'boss_ratking', x: 970, y: 300, patrolR: 55, speed: 60 },
    lootZones: [
      { id: 'cb_loot_1', x: 290, y: 195, r: 34, name: '掩体遗珍箱', type: 'vault_box',  respawnSec: 30 },
      { id: 'cb_loot_2', x: 750, y: 180, r: 34, name: '应急补给柜', type: 'crate',      respawnSec: 28 },
      { id: 'cb_loot_3', x: 990, y: 655, r: 34, name: '鼠王藏宝窝', type: 'relic_spot', respawnSec: 32 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 6. 野外：铁锈废都街区 ----------
  {
    id: 'ruins', index: 5, regionId: 'reg_ruins', sceneType: 'wild',
    name: '铁锈废都街区', short: '铁锈废都', isSafe: false, unlockCost: 1200,
    worldPos: { x: 38, y: 36 }, links: ['wasteland', 'interior_tavern', 'cave_metro', 'arsenal', 'town'],
    width: 1800, height: 1100,
    bgAsset: 'bg_ruins.jpg', bgTint: null,
    spawn: { x: 175, y: 560 },
    palette: { ground: '#4a525c', road: '#343a42', shadow: 'rgba(15,18,24,0.44)', accent: '#8ca0b5', mist: 'rgba(130,148,168,0.16)' },
    weatherPool: [0, 2, 4],
    desc: '坍塌商街与铁爪帮关卡交错，西侧设有可步入的黑市酒馆，北侧通向地铁二号线幽暗隧道。',
    weight: [6, 8, 10, 12, 14, 14, 8, 6, 4, 4, 0, 0, 12, 4, 6, 12, 10, 0, 4, 0, 4, 4, 4, 2, 3, 1, 6, 5, 2, 0, 2, 2, 3, 3, 2, 2, 2, 1],
    buildings: [
      {
        id: 'tavern', name: '废都黑市酒馆', sign: '酒馆',
        x: 250, y: 170, w: 245, h: 135, roofH: 76,
        doorX: 372, doorY: 325, action: 'enter_map', targetMap: 'interior_tavern', targetSpawnX: 500, targetSpawnY: 565,
        style: 'timber_shop', desc: '步入废都黑市酒馆，采购烟雾弹与打探地铁密道。'
      }
    ],
    obstacles: [
      { id: 'ru_girder',    type: 'steel_beam', x: 640,  y: 245, w: 180, h: 72,  label: '锈蚀钢架' },
      { id: 'ru_factory',   type: 'ruin_block', x: 1200, y: 180, w: 230, h: 130, label: '坍塌百货' },
      { id: 'ru_barricade', type: 'barricade',  x: 540,  y: 640, w: 150, h: 64,  label: '铁爪帮路障' },
      { id: 'ru_pillar',    type: 'ruin_wall',  x: 1030, y: 690, w: 180, h: 86,  label: '高架桥墩' },
      { id: 'ru_crane',     type: 'steel_beam', x: 1410, y: 760, w: 160, h: 82,  label: '倒塌广告牌' }
    ],
    portals: [
      { id: 'ruins_to_wl',      x: 90,   y: 560, r: 44, to: 'wasteland',  spawnX: 1620, spawnY: 540, label: '返回 城郊废土' },
      { id: 'ruins_to_metro',   x: 960,  y: 145, r: 46, to: 'cave_metro', spawnX: 175,  spawnY: 455, label: '潜入 地铁二号线隧道' },
      { id: 'ruins_to_crypt',   x: 740,  y: 965, r: 44, to: 'cave_crypt', spawnX: 175,  spawnY: 430, label: '探入 旧城古墓密室（妖灵）' },
      { id: 'ruins_to_arsenal', x: 1705, y: 540, r: 44, to: 'arsenal',    spawnX: 175,  spawnY: 560, label: '前往 赤焰兵工废墟' },
      { id: 'ruins_to_town',    x: 180,  y: 985, r: 42, to: 'town',       spawnX: 1265, spawnY: 500, label: '驿站捷径 · 返回墨石镇' }
    ],
    npc: { id: 'shaobing', x: 865, y: 475, facing: 'left' },
    enemySpawns: [
      { enemyId: 'dog',           x: 450,  y: 480, patrolR: 115, speed: 96 },
      { enemyId: 'raider',        x: 790,  y: 650, patrolR: 130, speed: 92 },
      { enemyId: 'raider_shield', x: 1160, y: 430, patrolR: 120, speed: 84 },
      { enemyId: 'auto_turret',   x: 1460, y: 590, patrolR: 55,  speed: 42 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'ru_loot_1', x: 310,  y: 410, r: 34, name: '地铁口闸机', type: 'tech_cache', respawnSec: 20 },
      { id: 'ru_loot_2', x: 565,  y: 230, r: 34, name: '破损ATM机',  type: 'vault_box',  respawnSec: 24 },
      { id: 'ru_loot_3', x: 1095, y: 255, r: 34, name: '钟表行橱窗', type: 'relic_spot', respawnSec: 24 },
      { id: 'ru_loot_4', x: 1495, y: 260, r: 34, name: '铁爪帮赃箱', type: 'crate',      respawnSec: 25 },
      { id: 'ru_loot_5', x: 430,  y: 810, r: 34, name: '废弃配电室', type: 'tech_cache', respawnSec: 22 },
      { id: 'ru_loot_6', x: 925,  y: 840, r: 34, name: '地下通道铁箱', type: 'crate',    respawnSec: 25 },
      { id: 'ru_loot_7', x: 1310, y: 880, r: 34, name: '废弃反装甲炮', type: 'abandoned_cannon', salvageElite: 'auto_turret', equipPool: ['wpn_shotgun', 'wpn_sniper', 'mech_steam_core'], respawnSec: 45 }
    ],
    hasWarn: true, hasTide: false, hasChem: false
  },

  // ---------- 7. 室内：废都黑市酒馆 ----------
  {
    id: 'interior_tavern', index: 6, regionId: 'reg_ruins', sceneType: 'interior',
    name: '废都黑市酒馆', short: '黑市酒馆', isSafe: true, unlockCost: 0,
    worldPos: { x: 38, y: 36 }, links: ['ruins'],
    width: 1000, height: 700,
    bgAsset: 'bg_interior.jpg', bgTint: 'rgba(55, 38, 32, 0.34)',
    spawn: { x: 500, y: 565 },
    palette: { ground: '#594238', road: '#423028', shadow: 'rgba(14,10,8,0.48)', accent: '#d49a3a', mist: 'rgba(160,120,95,0.12)' },
    weatherPool: [0],
    desc: '烟雾缭绕的拾荒客酒馆，酒保三娘暗中收购古董与腕表，也知晓地铁二号线的秘密。',
    weight: new Array(38).fill(0),
    buildings: [],
    obstacles: [
      { id: 'tav_bar',   type: 'wood_counter', x: 250, y: 215, w: 500, h: 72, label: '黑市吧台' },
      { id: 'tav_tbl_l', type: 'crate_stack',  x: 130, y: 390, w: 105, h: 95, label: '酒客方桌' },
      { id: 'tav_tbl_r', type: 'crate_stack',  x: 765, y: 390, w: 105, h: 95, label: '赌局木桌' }
    ],
    portals: [
      { id: 'tavern_exit', x: 500, y: 640, r: 44, to: 'ruins', spawnX: 372, spawnY: 365, label: '走出黑市酒馆' }
    ],
    npc: { id: 'jiubao', x: 500, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 8. 洞窟：地铁二号线幽暗隧道 ----------
  {
    id: 'cave_metro', index: 7, regionId: 'reg_ruins', sceneType: 'cave',
    name: '地铁二号线幽暗隧道', short: '地铁隧道', isSafe: false, unlockCost: 0,
    worldPos: { x: 38, y: 26 }, links: ['ruins'],
    width: 1300, height: 900,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(26, 38, 52, 0.36)',
    spawn: { x: 175, y: 455 },
    palette: { ground: '#242e38', road: '#1a222a', shadow: 'rgba(8,12,18,0.56)', accent: '#6da5c0', mist: 'rgba(90,125,155,0.16)' },
    weatherPool: [0],
    desc: '铁轨歪斜、应急灯闪烁的地下月台，阿哲曾在此宿营。隧道尽头由铁爪帮二当家「断钢」把守。',
    weight: [4, 6, 8, 10, 12, 14, 8, 6, 4, 4, 0, 0, 16, 0, 4, 8, 6, 0, 4, 0, 4, 4, 5, 2, 4, 0, 6, 12, 4, 0, 2, 3, 4, 4, 2, 2, 2, 2],
    buildings: [],
    obstacles: [
      { id: 'cm_train_1', type: 'car_wreck', x: 380, y: 210, w: 210, h: 90, label: '脱轨地铁车厢' },
      { id: 'cm_pillar',  type: 'ruin_wall', x: 640, y: 580, w: 180, h: 85, label: '塌陷月台柱' },
      { id: 'cm_barric',  type: 'barricade', x: 860, y: 260, w: 110, h: 70, label: '铁爪帮沙袋' }
    ],
    portals: [
      { id: 'metro_exit', x: 95, y: 455, r: 44, to: 'ruins', spawnX: 960, spawnY: 215, label: '爬出地铁口 · 返回废都' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'mutant', x: 470, y: 520, patrolR: 110, speed: 88 },
      { enemyId: 'raider', x: 750, y: 390, patrolR: 110, speed: 94 }
    ],
    bossSpawn: { enemyId: 'boss_duangang', x: 1090, y: 455, patrolR: 60, speed: 68 },
    lootZones: [
      { id: 'cm_loot_1', x: 300, y: 690, r: 34, name: '售票机残骸', type: 'tech_cache', respawnSec: 26 },
      { id: 'cm_loot_2', x: 670, y: 200, r: 34, name: '阿哲篝火营地', type: 'relic_spot', respawnSec: 30 },
      { id: 'cm_loot_3', x: 940, y: 725, r: 34, name: '铁爪帮军资箱', type: 'vault_box', respawnSec: 30 }
    ],
    hasWarn: true, hasTide: false, hasChem: false
  },

  // ---------- 9. 野外：赤焰兵工废墟 ----------
  {
    id: 'arsenal', index: 8, regionId: 'reg_arsenal', sceneType: 'wild',
    name: '赤焰兵工废墟', short: '赤焰兵工', isSafe: false, unlockCost: 2400,
    worldPos: { x: 56, y: 66 }, links: ['ruins', 'interior_armory', 'cave_b04', 'swamp', 'town'],
    width: 1800, height: 1100,
    bgAsset: 'bg_ruins.jpg', bgTint: 'rgba(128, 42, 22, 0.28)',
    spawn: { x: 175, y: 560 },
    palette: { ground: '#593b32', road: '#3e2922', shadow: 'rgba(24,10,8,0.46)', accent: '#e07a42', mist: 'rgba(205,105,65,0.16)' },
    weatherPool: [3, 4, 2],
    desc: '余烬未熄的战前重工业兵工厂，失控警卫机与赤焰焊工机巡弋其间。东侧军械库可步入借炉炼化，南侧通往 B-04 冷却井。',
    weight: [3, 4, 6, 10, 12, 14, 10, 10, 8, 8, 3, 1, 0, 4, 4, 2, 2, 0, 16, 0, 3, 3, 4, 4, 3, 0, 1, 3, 5, 1, 1, 2, 2, 2, 3, 2, 2, 2],
    buildings: [
      {
        id: 'armory', name: '战前军械库', sign: '军械',
        x: 1240, y: 170, w: 245, h: 135, roofH: 78,
        doorX: 1362, doorY: 325, action: 'enter_map', targetMap: 'interior_armory', targetSpawnX: 500, targetSpawnY: 565,
        style: 'forge', desc: '步入军械库内室，找军工老铁匠开启天工墨壶高阶炼化。'
      }
    ],
    obstacles: [
      { id: 'ar_furnace_1', type: 'ruin_block', x: 350,  y: 195, w: 210, h: 120, label: '高炉残骸' },
      { id: 'ar_girder_1',  type: 'steel_beam', x: 770,  y: 235, w: 190, h: 74,  label: '焦黑龙门架' },
      { id: 'ar_tank_1',    type: 'barricade',  x: 520,  y: 660, w: 165, h: 78,  label: '报废装甲车' },
      { id: 'ar_pipe_1',    type: 'steel_beam', x: 1120, y: 690, w: 190, h: 80,  label: '蒸汽管道群' },
      { id: 'ar_wall_se',   type: 'ruin_wall',  x: 1460, y: 775, w: 160, h: 75,  label: '弹药库断墙' }
    ],
    portals: [
      { id: 'ar_to_ruins',  x: 90,   y: 560, r: 44, to: 'ruins',       spawnX: 1620, spawnY: 540, label: '返回 铁锈废都街区' },
      { id: 'ar_to_hangar', x: 960,  y: 145, r: 46, to: 'cave_hangar', spawnX: 175,  spawnY: 455, label: '潜入 战前战隼机库（机甲/军火）' },
      { id: 'ar_to_b04',    x: 940,  y: 975, r: 46, to: 'cave_b04',    spawnX: 200,  spawnY: 185, label: '潜入 B-04 地下冷却井' },
      { id: 'ar_to_swamp',  x: 1705, y: 540, r: 44, to: 'swamp',       spawnX: 175,  spawnY: 580, label: '前往 青瘴辐射沼泽' },
      { id: 'ar_to_town',   x: 185,  y: 985, r: 42, to: 'town',        spawnX: 1265, spawnY: 500, label: '驿站捷径 · 返回墨石镇' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'raider_shield', x: 470,  y: 480, patrolR: 120, speed: 86 },
      { enemyId: 'auto_turret',   x: 840,  y: 495, patrolR: 55,  speed: 44 },
      { enemyId: 'flame_mech',    x: 1180, y: 475, patrolR: 130, speed: 96 },
      { enemyId: 'heavy_mech',    x: 1450, y: 605, patrolR: 115, speed: 84 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'ar_loot_1', x: 300,  y: 380, r: 34, name: '军工伺服机箱', type: 'tech_cache', respawnSec: 22 },
      { id: 'ar_loot_2', x: 645,  y: 230, r: 34, name: '蓄电池组',     type: 'tech_cache', respawnSec: 24 },
      { id: 'ar_loot_3', x: 1070, y: 245, r: 34, name: '兵工质检柜',   type: 'vault_box',  respawnSec: 25 },
      { id: 'ar_loot_4', x: 1560, y: 270, r: 34, name: '狙击镜片箱',   type: 'relic_spot', respawnSec: 26 },
      { id: 'ar_loot_5', x: 400,  y: 830, r: 40, name: '坠毁重装机甲残骸', type: 'mech_wreck', salvageElite: 'heavy_mech', equipPool: ['mech_crimson_frame', 'wpn_pulsesword', 'armor_exo'], respawnSec: 50 },
      { id: 'ar_loot_6', x: 760,  y: 845, r: 34, name: '冷却阀工具箱', type: 'crate',      respawnSec: 24 },
      { id: 'ar_loot_7', x: 1340, y: 880, r: 34, name: '战前黑匣残片', type: 'vault_box',  respawnSec: 28 }
    ],
    hasWarn: true, hasTide: false, hasChem: true
  },

  // ---------- 10. 室内：战前军械库内室 ----------
  {
    id: 'interior_armory', index: 9, regionId: 'reg_arsenal', sceneType: 'interior',
    name: '战前军械库·内室', short: '军械库', isSafe: true, unlockCost: 0,
    worldPos: { x: 56, y: 66 }, links: ['arsenal'],
    width: 1000, height: 700,
    bgAsset: 'bg_interior.jpg', bgTint: 'rgba(90, 34, 24, 0.28)',
    spawn: { x: 500, y: 565 },
    palette: { ground: '#5c3c32', road: '#442c24', shadow: 'rgba(18,8,6,0.48)', accent: '#e86a33', mist: 'rgba(200,90,50,0.12)' },
    weatherPool: [0],
    desc: '炉火通红的地下军械库，老铁匠守着最后一座战前锻造台，助少侠以天工墨壶铸造神兵。',
    weight: new Array(38).fill(0),
    buildings: [],
    obstacles: [
      { id: 'arm_anvil',  type: 'wood_counter', x: 260, y: 215, w: 480, h: 72, label: '军工锻造台' },
      { id: 'arm_rack_l', type: 'crate_stack',  x: 100, y: 360, w: 100, h: 145, label: '兵器架' },
      { id: 'arm_rack_r', type: 'crate_stack',  x: 800, y: 360, w: 100, h: 145, label: '钢材堆' }
    ],
    portals: [
      { id: 'armory_exit', x: 500, y: 640, r: 44, to: 'arsenal', spawnX: 1362, spawnY: 365, label: '走出战前军械库' }
    ],
    npc: { id: 'tiejiang', x: 500, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 11. 洞窟：B-04 地下冷却井 ----------
  {
    id: 'cave_b04', index: 10, regionId: 'reg_arsenal', sceneType: 'cave',
    name: 'B-04 地下冷却井', short: 'B-04冷却井', isSafe: false, unlockCost: 0,
    worldPos: { x: 56, y: 76 }, links: ['arsenal'],
    width: 1300, height: 900,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(110, 36, 20, 0.34)',
    spawn: { x: 200, y: 185 },
    palette: { ground: '#3e231c', road: '#2d1812', shadow: 'rgba(16,6,4,0.56)', accent: '#ff7034', mist: 'rgba(220,90,45,0.18)' },
    weatherPool: [3],
    desc: '炽热蒸汽弥漫的地下排污与冷却通道，重型机甲「祝融七号」镇守在 B-04 闸门之前。',
    weight: [2, 2, 4, 8, 10, 14, 12, 12, 10, 8, 6, 2, 0, 0, 0, 0, 0, 0, 18, 2, 2, 2, 5, 5, 3, 0, 0, 2, 12, 2, 1, 2, 2, 2, 3, 3, 3, 2],
    buildings: [],
    obstacles: [
      { id: 'b04_pipe_1', type: 'steel_beam', x: 420, y: 240, w: 180, h: 85, label: '高压冷却管' },
      { id: 'b04_core_1', type: 'boulder',    x: 680, y: 550, w: 145, h: 95, label: '熔渣冷凝堆' },
      { id: 'b04_wall_1', type: 'ruin_wall',  x: 240, y: 540, w: 150, h: 75, label: '隔热防爆墙' }
    ],
    portals: [
      { id: 'b04_exit', x: 180, y: 105, r: 44, to: 'arsenal', spawnX: 940, spawnY: 905, label: '返回 赤焰兵工废墟' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'drone',      x: 470, y: 455, patrolR: 115, speed: 102 },
      { enemyId: 'flame_mech', x: 760, y: 360, patrolR: 115, speed: 96 }
    ],
    bossSpawn: { enemyId: 'boss_zhurong', x: 1080, y: 480, patrolR: 60, speed: 66 },
    lootZones: [
      { id: 'b04_loot_1', x: 240, y: 745, r: 34, name: '应急冷却箱', type: 'tech_cache', respawnSec: 28 },
      { id: 'b04_loot_2', x: 740, y: 175, r: 34, name: '战前军工密箱', type: 'vault_box', respawnSec: 30 },
      { id: 'b04_loot_3', x: 960, y: 740, r: 34, name: 'B-04 闸门日志', type: 'relic_spot', respawnSec: 32 }
    ],
    hasWarn: false, hasTide: false, hasChem: true
  },

  // ---------- 12. 野外：青瘴辐射沼泽 ----------
  {
    id: 'swamp', index: 11, regionId: 'reg_swamp', sceneType: 'wild',
    name: '青瘴辐射沼泽', short: '青瘴毒泽', isSafe: false, unlockCost: 3800,
    worldPos: { x: 74, y: 38 }, links: ['arsenal', 'interior_hermit', 'cave_mire', 'vault', 'town'],
    width: 1800, height: 1100,
    bgAsset: 'bg_swamp.jpg', bgTint: null,
    spawn: { x: 175, y: 580 },
    palette: { ground: '#2d3f35', road: '#4a4236', shadow: 'rgba(12,24,18,0.48)', accent: '#5fb381', mist: 'rgba(95,179,129,0.18)' },
    weatherPool: [1, 2, 0],
    desc: '青绿毒瘴翻涌的禁区，每60秒爆发辐射潮。东岸亮着温暖灯火的隐士草庐可步入，北沼藏有沉没菌窟。',
    weight: [2, 2, 4, 6, 6, 8, 8, 6, 6, 6, 10, 4, 0, 0, 0, 0, 0, 16, 2, 0, 2, 3, 4, 6, 3, 0, 0, 2, 4, 6, 2, 2, 2, 2, 3, 3, 3, 2],
    buildings: [
      {
        id: 'hermit_hut', name: '隐士草庐', sign: '草庐',
        x: 1260, y: 185, w: 230, h: 130, roofH: 74,
        doorX: 1375, doorY: 335, action: 'enter_map', targetMap: 'interior_hermit', targetSpawnX: 500, targetSpawnY: 565,
        style: 'clinic', desc: '步入东岸隐士草庐，寻找正在调试无线电台的阿哲！'
      }
    ],
    obstacles: [
      { id: 'sw_pool_1',    type: 'toxic_pool', x: 380,  y: 200, w: 220, h: 130, label: '辐射泥潭' },
      { id: 'sw_cypress_1', type: 'dead_tree',  x: 960,  y: 205, w: 86,  h: 72,  label: '枯死沼柏' },
      { id: 'sw_pool_3',    type: 'toxic_pool', x: 460,  y: 745, w: 250, h: 135, label: '发光毒沼' },
      { id: 'sw_cypress_2', type: 'dead_tree',  x: 980,  y: 690, w: 94,  h: 76,  label: '盘根枯木' },
      { id: 'sw_sluice',    type: 'ruin_wall',  x: 1350, y: 760, w: 185, h: 80,  label: '排污古闸' }
    ],
    portals: [
      { id: 'swamp_to_ar',    x: 90,   y: 580, r: 44, to: 'arsenal',         spawnX: 1620, spawnY: 540, label: '返回 赤焰兵工废墟' },
      { id: 'swamp_to_mire',  x: 765,  y: 140, r: 46, to: 'cave_mire',       spawnX: 200,  spawnY: 730, label: '潜入 毒泽沉没菌窟' },
      { id: 'swamp_to_fox',   x: 1120, y: 975, r: 46, to: 'cave_fox_shrine', spawnX: 175,  spawnY: 430, label: '步入 青瘴狐仙秘境（九尾狐）' },
      { id: 'swamp_to_vault', x: 1705, y: 540, r: 44, to: 'vault',           spawnX: 175,  spawnY: 560, label: '前往 07号避难所主控区' },
      { id: 'swamp_to_town',  x: 205,  y: 985, r: 42, to: 'town',            spawnX: 1265, spawnY: 500, label: '渡口捷径 · 返回墨石镇' }
    ],
    npc: { id: 'yinshi', x: 925, y: 400, facing: 'down' },
    enemySpawns: [
      { enemyId: 'mutant',    x: 495,  y: 525, patrolR: 125, speed: 88 },
      { enemyId: 'slime',     x: 840,  y: 600, patrolR: 120, speed: 82 },
      { enemyId: 'mire_wisp', x: 1230, y: 500, patrolR: 135, speed: 94 },
      { enemyId: 'slime',     x: 1470, y: 620, patrolR: 125, speed: 86 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'sw_loot_1', x: 290,  y: 380, r: 34, name: '荧光菌丛',     type: 'mushroom',   respawnSec: 20 },
      { id: 'sw_loot_2', x: 645,  y: 265, r: 34, name: '搁浅补给筏',   type: 'crate',      respawnSec: 24 },
      { id: 'sw_loot_3', x: 1120, y: 265, r: 34, name: '隐士药篓',     type: 'relic_spot', respawnSec: 24 },
      { id: 'sw_loot_4', x: 1560, y: 310, r: 34, name: '辐射稳定罐',   type: 'tech_cache', respawnSec: 26 },
      { id: 'sw_loot_5', x: 350,  y: 830, r: 34, name: '幽绿菌床',     type: 'mushroom',   respawnSec: 22 },
      { id: 'sw_loot_6', x: 835,  y: 855, r: 34, name: '沉没医疗箱',   type: 'crate',      respawnSec: 25 },
      { id: 'sw_loot_7', x: 1265, y: 865, r: 34, name: '东岸无线电箱', type: 'relic_spot', respawnSec: 28 }
    ],
    hasWarn: false, hasTide: true, hasChem: false
  },

  // ---------- 13. 室内：隐士草庐内室 ----------
  {
    id: 'interior_hermit', index: 12, regionId: 'reg_swamp', sceneType: 'interior',
    name: '隐士草庐·内室', short: '隐士草庐', isSafe: true, unlockCost: 0,
    worldPos: { x: 74, y: 38 }, links: ['swamp'],
    width: 1000, height: 700,
    bgAsset: 'bg_interior.jpg', bgTint: 'rgba(28, 74, 52, 0.28)',
    spawn: { x: 500, y: 565 },
    palette: { ground: '#425246', road: '#303d33', shadow: 'rgba(10,20,14,0.44)', accent: '#6fb98f', mist: 'rgba(120,195,155,0.12)' },
    weatherPool: [0],
    desc: '竹帘药架间摆着一台发出沙沙电流声的短波电台，失散多年的挚友阿哲正静坐灯下。',
    weight: new Array(38).fill(0),
    buildings: [],
    obstacles: [
      { id: 'hm_table',  type: 'wood_counter', x: 270, y: 215, w: 460, h: 72, label: '无线电药案' },
      { id: 'hm_herb_l', type: 'crate_stack',  x: 105, y: 360, w: 100, h: 145, label: '晾药竹架' },
      { id: 'hm_herb_r', type: 'crate_stack',  x: 795, y: 360, w: 100, h: 145, label: '旧书木柜' }
    ],
    portals: [
      { id: 'hermit_exit', x: 500, y: 640, r: 44, to: 'swamp', spawnX: 1375, spawnY: 375, label: '走出隐士草庐' }
    ],
    npc: { id: 'azhe', x: 500, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 14. 洞窟：毒泽沉没菌窟 ----------
  {
    id: 'cave_mire', index: 13, regionId: 'reg_swamp', sceneType: 'cave',
    name: '毒泽沉没菌窟', short: '沉没菌窟', isSafe: false, unlockCost: 0,
    worldPos: { x: 74, y: 28 }, links: ['swamp'],
    width: 1300, height: 900,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(22, 78, 48, 0.42)',
    spawn: { x: 200, y: 730 },
    palette: { ground: '#1a3629', road: '#13281e', shadow: 'rgba(6,18,12,0.58)', accent: '#62e698', mist: 'rgba(85,205,135,0.20)' },
    weatherPool: [1],
    desc: '发光巨型菌盖倒垂的地下溶洞，深处盘踞着「千年墨瘴母体」，唯有击溃它方能采得「净瘴青莲」。',
    weight: [1, 1, 2, 4, 6, 8, 8, 8, 8, 6, 12, 6, 0, 0, 0, 0, 0, 22, 2, 2, 2, 2, 5, 8, 3, 0, 0, 0, 4, 12, 2, 2, 3, 3, 4, 4, 3, 3],
    buildings: [],
    obstacles: [
      { id: 'mr_pool_1', type: 'toxic_pool', x: 400, y: 240, w: 190, h: 110, label: '幽绿菌池' },
      { id: 'mr_root_1', type: 'dead_tree',  x: 680, y: 540, w: 130, h: 95,  label: '巨型毒藤根' },
      { id: 'mr_rock_1', type: 'boulder',    x: 240, y: 450, w: 120, h: 85,  label: '荧光钟乳石' }
    ],
    portals: [
      { id: 'mire_exit', x: 165, y: 805, r: 44, to: 'swamp', spawnX: 765, spawnY: 210, label: '离开沉没菌窟 · 返回毒泽' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'slime',     x: 470, y: 560, patrolR: 110, speed: 86 },
      { enemyId: 'mire_wisp', x: 755, y: 345, patrolR: 120, speed: 94 }
    ],
    bossSpawn: { enemyId: 'boss_lotus_bane', x: 1070, y: 440, patrolR: 60, speed: 64 },
    lootZones: [
      { id: 'mr_loot_1', x: 265, y: 205, r: 34, name: '千年荧光菌簇', type: 'mushroom',   respawnSec: 26 },
      { id: 'mr_loot_2', x: 760, y: 175, r: 34, name: '战前科考箱',   type: 'vault_box',  respawnSec: 30 },
      { id: 'mr_loot_3', x: 960, y: 730, r: 34, name: '青莲祭坛遗珍', type: 'relic_spot', respawnSec: 32 }
    ],
    hasWarn: false, hasTide: true, hasChem: false
  },

  // ---------- 15. 野外：07号避难所主控区 ----------
  {
    id: 'vault', index: 14, regionId: 'reg_vault', sceneType: 'wild',
    name: '07号避难所主控区', short: '07避难所', isSafe: false, unlockCost: 6800,
    worldPos: { x: 88, y: 68 }, links: ['swamp', 'cave_tianshu', 'town'],
    width: 1800, height: 1100,
    bgAsset: 'bg_ruins.jpg', bgTint: 'rgba(28, 16, 54, 0.52)',
    spawn: { x: 175, y: 560 },
    palette: { ground: '#251e34', road: '#342a48', shadow: 'rgba(10,6,20,0.54)', accent: '#9d7cd8', mist: 'rgba(157,124,216,0.16)' },
    weatherPool: [1, 2],
    desc: '深埋地底的战前终极穹顶，林博士驻守于此。主反应堆东侧通道直通最终地宫「天枢地脉密窟」。',
    weight: [1, 1, 2, 4, 6, 8, 10, 8, 10, 8, 12, 10, 0, 0, 0, 0, 0, 0, 6, 14, 2, 2, 4, 6, 3, 0, 0, 1, 2, 5, 1, 2, 2, 2, 3, 4, 4, 5],
    buildings: [],
    obstacles: [
      { id: 'vt_bulkhead_1', type: 'vault_pillar', x: 360,  y: 185, w: 180, h: 105, label: '合金隔断墙' },
      { id: 'vt_server_1',   type: 'server_rack',  x: 780,  y: 205, w: 195, h: 95,  label: '记忆矩阵机柜' },
      { id: 'vt_reactor',    type: 'reactor_core', x: 1210, y: 445, w: 150, h: 145, label: '主反应堆核心' },
      { id: 'vt_bulkhead_2', type: 'vault_pillar', x: 430,  y: 755, w: 195, h: 100, label: '防爆舱壁' },
      { id: 'vt_server_2',   type: 'server_rack',  x: 920,  y: 775, w: 205, h: 95,  label: '冷冻休眠舱' },
      { id: 'vt_gate_core',  type: 'vault_pillar', x: 1510, y: 215, w: 145, h: 120, label: '主控密库门' }
    ],
    portals: [
      { id: 'vault_to_swamp',   x: 90,   y: 560, r: 44, to: 'swamp',              spawnX: 1620, spawnY: 540, label: '返回 青瘴辐射沼泽' },
      { id: 'vault_to_thunder', x: 1265, y: 145, r: 46, to: 'cave_thunder_altar', spawnX: 175,  spawnY: 450, label: '踏入 天枢雷公古坛（雷神/罗刹）' },
      { id: 'vault_to_tianshu', x: 1705, y: 540, r: 46, to: 'cave_tianshu',       spawnX: 175,  spawnY: 450, label: '步入 天枢地脉密窟（终局）' },
      { id: 'vault_to_town',    x: 200,  y: 985, r: 42, to: 'town',               spawnX: 1265, spawnY: 500, label: '应急电梯 · 返回墨石镇' }
    ],
    npc: { id: 'xuezhe', x: 710, y: 420, facing: 'down' },
    enemySpawns: [
      { enemyId: 'drone', x: 520,  y: 520, patrolR: 125, speed: 102 },
      { enemyId: 'guard', x: 960,  y: 490, patrolR: 135, speed: 90 },
      { enemyId: 'drone', x: 1430, y: 380, patrolR: 130, speed: 104 },
      { enemyId: 'guard', x: 1440, y: 740, patrolR: 135, speed: 92 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'vt_loot_1', x: 310,  y: 370, r: 34, name: '安保器材柜', type: 'tech_cache', respawnSec: 24 },
      { id: 'vt_loot_2', x: 640,  y: 235, r: 34, name: '加密数据终端', type: 'vault_box', respawnSec: 26 },
      { id: 'vt_loot_3', x: 1090, y: 250, r: 34, name: '黑匣子保管箱', type: 'vault_box', respawnSec: 28 },
      { id: 'vt_loot_4', x: 1600, y: 740, r: 34, name: '07号芯片矩阵', type: 'vault_box', respawnSec: 30 },
      { id: 'vt_loot_5', x: 365,  y: 895, r: 34, name: '战前医疗舱',   type: 'crate',     respawnSec: 24 },
      { id: 'vt_loot_6', x: 825,  y: 910, r: 34, name: '典藏古物柜',     type: 'relic_spot', respawnSec: 28 },
      { id: 'vt_loot_7', x: 1280, y: 880, r: 40, name: '天枢自律重炮残骸', type: 'mech_wreck', salvageElite: 'heavy_mech', equipPool: ['mech_tianshu_exo', 'wpn_xuanyuan', 'relic_tianshu'], respawnSec: 55 }
    ],
    hasWarn: true, hasTide: true, hasChem: true
  },

  // ---------- 16. 终局地宫：天枢地脉密窟 ----------
  {
    id: 'cave_tianshu', index: 15, regionId: 'reg_vault', sceneType: 'cave',
    name: '天枢地脉密窟', short: '天枢密窟', isSafe: false, unlockCost: 0,
    worldPos: { x: 92, y: 74 }, links: ['vault'],
    width: 1350, height: 900,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(42, 18, 74, 0.48)',
    spawn: { x: 175, y: 450 },
    palette: { ground: '#211536', road: '#170e26', shadow: 'rgba(8,4,16,0.62)', accent: '#c084fc', mist: 'rgba(170,120,245,0.20)' },
    weatherPool: [1],
    desc: '先秦墨家青铜巨柱与战前量子奇点融为一体的终极圣殿。击败「天枢主脑·玄墨大帝」以决定墨土终局！',
    weight: [0, 0, 0, 2, 4, 6, 10, 10, 12, 10, 16, 14, 0, 0, 0, 0, 0, 0, 8, 18, 2, 2, 6, 8, 4, 0, 0, 0, 0, 4, 2, 2, 3, 3, 4, 5, 5, 6],
    buildings: [],
    obstacles: [
      { id: 'ts_pillar_1', type: 'vault_pillar', x: 430, y: 205, w: 120, h: 110, label: '墨家青铜巨柱' },
      { id: 'ts_pillar_2', type: 'vault_pillar', x: 430, y: 585, w: 120, h: 110, label: '墨家青铜巨柱' },
      { id: 'ts_pillar_3', type: 'vault_pillar', x: 760, y: 205, w: 120, h: 110, label: '天枢量子柱' },
      { id: 'ts_pillar_4', type: 'vault_pillar', x: 760, y: 585, w: 120, h: 110, label: '天枢量子柱' }
    ],
    portals: [
      { id: 'tianshu_exit', x: 95, y: 450, r: 44, to: 'vault', spawnX: 1615, spawnY: 540, label: '撤出天枢密窟 · 返回07号避难所' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'guard', x: 615, y: 450, patrolR: 115, speed: 92 }
    ],
    bossSpawn: { enemyId: 'boss_tianshu', x: 1105, y: 450, patrolR: 55, speed: 68 },
    lootZones: [
      { id: 'ts_loot_1', x: 605, y: 175, r: 34, name: '先秦墨家古匣', type: 'relic_spot', respawnSec: 32 },
      { id: 'ts_loot_2', x: 605, y: 735, r: 34, name: '天枢核心晶片箱', type: 'vault_box', respawnSec: 32 },
      { id: 'ts_loot_3', x: 955, y: 185, r: 34, name: '旧世典藏密匣', type: 'relic_spot', respawnSec: 34 }
    ],
    hasWarn: true, hasTide: true, hasChem: false
  },

  // ---------- 17. 室内：墨石武馆（古武门派演武堂） ----------
  {
    id: 'interior_dojo', index: 16, regionId: 'reg_town', sceneType: 'interior',
    name: '墨石武馆·演武堂', short: '墨石武馆', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['town'],
    width: 1000, height: 700,
    bgAsset: 'bg_interior.jpg', bgTint: 'rgba(130, 96, 48, 0.18)',
    spawn: { x: 500, y: 565 },
    palette: { ground: '#826b4e', road: '#66523b', shadow: 'rgba(20,14,8,0.42)', accent: '#d49a3a', mist: 'rgba(235,205,155,0.10)' },
    weatherPool: [0],
    desc: '青城旧脉在墨石镇设立的古武演武堂，兵器架寒光凛凛，教头传授古武剑诀与调息心法。',
    weight: new Array(38).fill(0),
    buildings: [],
    obstacles: [
      { id: 'dj_altar',  type: 'wood_counter', x: 280, y: 215, w: 440, h: 70, label: '武馆讲武台' },
      { id: 'dj_rack_l', type: 'crate_stack',  x: 105, y: 360, w: 100, h: 140, label: '刀剑兵器架' },
      { id: 'dj_rack_r', type: 'crate_stack',  x: 795, y: 360, w: 100, h: 140, label: '练功木人桩' }
    ],
    portals: [
      { id: 'dojo_exit', x: 500, y: 640, r: 44, to: 'town', spawnX: 1030, spawnY: 710, label: '走出墨石武馆' }
    ],
    npc: { id: 'jiaotou', x: 500, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 18. 洞窟：旧城古墓密室（青铜剑灵 / 画皮 / 千年尸王） ----------
  {
    id: 'cave_crypt', index: 17, regionId: 'reg_ruins', sceneType: 'cave',
    name: '旧城古墓密室', short: '古墓密室', isSafe: false, unlockCost: 0,
    worldPos: { x: 38, y: 44 }, links: ['ruins'],
    width: 1250, height: 850,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(24, 58, 62, 0.38)',
    spawn: { x: 175, y: 430 },
    palette: { ground: '#223438', road: '#192629', shadow: 'rgba(6,16,18,0.58)', accent: '#7ce8c4', mist: 'rgba(95,185,175,0.18)' },
    weatherPool: [2],
    desc: '旧城地基下坍塌露出的先秦古墓！游荡着青铜剑灵、画皮幽影与千年尸王，盛产古董与古武神兵。',
    weight: [0, 0, 2, 4, 4, 4, 2, 2, 2, 4, 2, 2, 10, 4, 2, 4, 8, 4, 0, 0, 3, 3, 6, 3, 4, 0, 2, 4, 2, 0, 8, 8, 8, 6, 5, 5, 4, 4],
    buildings: [],
    obstacles: [
      { id: 'cr_tomb_1', type: 'boulder',    x: 420, y: 220, w: 150, h: 95, label: '青铜石棺' },
      { id: 'cr_tomb_2', type: 'ruin_wall',  x: 740, y: 530, w: 165, h: 90, label: '古墓镇魂碑' }
    ],
    portals: [
      { id: 'crypt_exit', x: 95, y: 430, r: 44, to: 'ruins', spawnX: 740, spawnY: 905, label: '离开古墓 · 返回铁锈废都' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'bronze_spirit',   x: 495, y: 540, patrolR: 115, speed: 92 },
      { enemyId: 'painted_phantom', x: 760, y: 310, patrolR: 120, speed: 98 },
      { enemyId: 'corpse_king',     x: 1030, y: 430, patrolR: 105, speed: 84 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'cr_loot_1', x: 310, y: 690, r: 34, name: '先秦陪葬青铜匣', type: 'relic_spot', respawnSec: 28 },
      { id: 'cr_loot_2', x: 765, y: 175, r: 34, name: '古剑石台',       type: 'relic_spot', equipPool: ['wpn_qingcheng', 'wpn_inkblade'], respawnSec: 36 },
      { id: 'cr_loot_3', x: 1090, y: 690, r: 34, name: '尸王玄棺密宝',  type: 'vault_box',  respawnSec: 34 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 19. 洞窟：战前战隼机库（重炮 / 机甲 / 机械饕餮） ----------
  {
    id: 'cave_hangar', index: 18, regionId: 'reg_arsenal', sceneType: 'cave',
    name: '战前战隼机库', short: '战隼机库', isSafe: false, unlockCost: 0,
    worldPos: { x: 56, y: 58 }, links: ['arsenal'],
    width: 1300, height: 900,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(78, 32, 28, 0.36)',
    spawn: { x: 175, y: 455 },
    palette: { ground: '#382a2a', road: '#291e1e', shadow: 'rgba(14,8,8,0.56)', accent: '#fb923c', mist: 'rgba(210,120,75,0.16)' },
    weatherPool: [3],
    desc: '深埋兵工厂北侧的秘密航空与机甲机库，停放着报废武装战隼与失控机械饕餮，可拆出加特林与浮游炮！',
    weight: [0, 0, 2, 6, 8, 12, 14, 14, 14, 12, 8, 6, 0, 6, 6, 0, 0, 0, 20, 6, 2, 2, 4, 4, 4, 0, 0, 0, 4, 0, 1, 1, 2, 2, 2, 2, 3, 3],
    buildings: [],
    obstacles: [
      { id: 'hg_jet_1',   type: 'steel_beam', x: 420, y: 210, w: 205, h: 95, label: '报废战隼机身' },
      { id: 'hg_crane_1', type: 'ruin_wall',  x: 720, y: 575, w: 190, h: 88, label: '机甲整备龙门' }
    ],
    portals: [
      { id: 'hangar_exit', x: 95, y: 455, r: 44, to: 'arsenal', spawnX: 960, spawnY: 215, label: '离开机库 · 返回赤焰兵工' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'auto_turret', x: 470,  y: 550, patrolR: 60,  speed: 44 },
      { enemyId: 'heavy_mech',  x: 760,  y: 350, patrolR: 115, speed: 86 },
      { enemyId: 'mech_taotie', x: 1065, y: 455, patrolR: 120, speed: 90 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'hg_loot_1', x: 300,  y: 720, r: 40, name: '机库重炮武器架', type: 'abandoned_cannon', salvageElite: 'auto_turret', equipPool: ['wpn_gatling', 'wpn_artillery', 'wpn_plasma_rifle'], respawnSec: 45 },
      { id: 'hg_loot_2', x: 765,  y: 175, r: 34, name: '战隼航电核心',   type: 'tech_cache', respawnSec: 28 },
      { id: 'hg_loot_3', x: 1085, y: 720, r: 40, name: '墨甲浮游炮实验台', type: 'mech_wreck', salvageElite: 'mech_taotie', equipPool: ['mech_bit_array', 'mech_crimson_frame'], respawnSec: 50 }
    ],
    hasWarn: true, hasTide: false, hasChem: true
  },

  // ---------- 20. 洞窟：青瘴狐仙秘境（九尾辐射狐 / 妖灵秘宝） ----------
  {
    id: 'cave_fox_shrine', index: 19, regionId: 'reg_swamp', sceneType: 'cave',
    name: '青瘴狐仙秘境', short: '狐仙秘境', isSafe: false, unlockCost: 0,
    worldPos: { x: 74, y: 48 }, links: ['swamp'],
    width: 1250, height: 850,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(66, 28, 72, 0.36)',
    spawn: { x: 175, y: 430 },
    palette: { ground: '#2e1e36', road: '#221528', shadow: 'rgba(14,6,18,0.56)', accent: '#f088c8', mist: 'rgba(220,120,195,0.20)' },
    weatherPool: [1],
    desc: '毒泽南岸雾霭掩映的古老狐仙洞天，九尾辐射狐与画皮幽影盘踞其中，藏有九尾灵珠与稀世丹药。',
    weight: [0, 0, 0, 2, 4, 4, 4, 4, 4, 6, 12, 6, 0, 0, 0, 0, 6, 24, 0, 2, 2, 2, 6, 8, 4, 0, 0, 0, 2, 8, 4, 4, 4, 4, 6, 6, 5, 5],
    buildings: [],
    obstacles: [
      { id: 'fx_shrine_1', type: 'dead_tree',  x: 440, y: 215, w: 125, h: 90, label: '千年妖藤古木' },
      { id: 'fx_pool_1',   type: 'toxic_pool', x: 740, y: 540, w: 185, h: 105, label: '幻雾灵泉' }
    ],
    portals: [
      { id: 'fox_exit', x: 95, y: 430, r: 44, to: 'swamp', spawnX: 1120, spawnY: 905, label: '离开狐仙秘境 · 返回毒泽' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'painted_phantom', x: 485,  y: 530, patrolR: 115, speed: 96 },
      { enemyId: 'mire_wisp',       x: 760,  y: 320, patrolR: 115, speed: 94 },
      { enemyId: 'fox_nine',        x: 1040, y: 430, patrolR: 120, speed: 100 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'fx_loot_1', x: 300,  y: 690, r: 34, name: '幻光荧光菌床', type: 'mushroom',   respawnSec: 24 },
      { id: 'fx_loot_2', x: 760,  y: 170, r: 34, name: '狐仙供奉玉匣', type: 'relic_spot', equipPool: ['relic_fox_orb', 'wpn_qingcheng'], respawnSec: 38 },
      { id: 'fx_loot_3', x: 1075, y: 690, r: 34, name: '灵泉丹鼎',     type: 'vault_box',  respawnSec: 32 }
    ],
    hasWarn: false, hasTide: true, hasChem: false
  },

  // ---------- 21. 洞窟：天枢雷公古坛（赛博罗刹 / 雷公残灵 / 机械饕餮） ----------
  {
    id: 'cave_thunder_altar', index: 20, regionId: 'reg_vault', sceneType: 'cave',
    name: '天枢雷公古坛', short: '雷公古坛', isSafe: false, unlockCost: 0,
    worldPos: { x: 88, y: 58 }, links: ['vault'],
    width: 1300, height: 900,
    bgAsset: 'bg_cave.jpg', bgTint: 'rgba(22, 42, 86, 0.44)',
    spawn: { x: 175, y: 450 },
    palette: { ground: '#1a243d', road: '#12192b', shadow: 'rgba(6,10,22,0.60)', accent: '#38bdf8', mist: 'rgba(85,180,245,0.20)' },
    weatherPool: [1, 2],
    desc: '07 号避难所深处融合先秦雷坛与量子磁场的禁地！赛博罗刹与雷公残灵镇守终极电磁炮与雷公残印！',
    weight: [0, 0, 0, 0, 2, 4, 8, 8, 10, 10, 16, 14, 0, 0, 0, 0, 0, 0, 10, 20, 2, 2, 6, 8, 4, 0, 0, 0, 0, 2, 2, 2, 3, 3, 4, 5, 5, 6],
    buildings: [],
    obstacles: [
      { id: 'th_coil_1', type: 'vault_pillar', x: 430, y: 215, w: 130, h: 105, label: '墨雷特斯拉柱' },
      { id: 'th_coil_2', type: 'vault_pillar', x: 750, y: 575, w: 130, h: 105, label: '墨雷特斯拉柱' }
    ],
    portals: [
      { id: 'thunder_exit', x: 95, y: 450, r: 44, to: 'vault', spawnX: 1265, spawnY: 215, label: '离开雷公古坛 · 返回07号避难所' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'cyber_rakshasa',  x: 495,  y: 550, patrolR: 125, speed: 104 },
      { enemyId: 'mech_taotie',     x: 775,  y: 335, patrolR: 115, speed: 92 },
      { enemyId: 'thunder_remnant', x: 1080, y: 450, patrolR: 120, speed: 98 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'th_loot_1', x: 300,  y: 730, r: 40, name: '轨道电磁炮实验架', type: 'mech_wreck', salvageElite: 'cyber_rakshasa', equipPool: ['wpn_railgun', 'mech_tianshu_exo'], respawnSec: 52 },
      { id: 'th_loot_2', x: 765,  y: 175, r: 34, name: '雷公神龛玉匣',     type: 'relic_spot', equipPool: ['relic_thunder_seal', 'wpn_pulsesword'], respawnSec: 45 },
      { id: 'th_loot_3', x: 1085, y: 730, r: 34, name: '天枢量子秘库',     type: 'vault_box',  respawnSec: 36 }
    ],
    hasWarn: true, hasTide: true, hasChem: false
  }
];

export const MAPS_BY_ID = Object.fromEntries(MAPS.map(m => [m.id, m]));

// 五幕主线剧情链（20 个具体推进步骤）
export const MAIN_QUESTS = [
  {
    id: 'act_1', act: 1, title: '第一幕：停摆的 21:47 · 墨壶初醒', regionId: 'reg_town',
    reward: { exp: 180, gold: 350, unlockRegion: 'reg_ruins' },
    steps: [
      { id: 'q1_1', title: '老黄的旧讯', targetMap: 'interior_shop', trigger: 'talk_laohuang', desc: '步入墨石镇「老黄杂货铺内室」与商人老黄交谈。' },
      { id: 'q1_2', title: '城郊寻踪',   targetMap: 'wasteland',     trigger: 'talk_laogui',   desc: '前往「城郊废土」向盲眼老鬼打听防空洞入口。' },
      { id: 'q1_3', title: '初试墨壶',   targetMap: 'cave_bunker',   trigger: 'capture_any',   desc: '在防空洞战斗中将敌人血量压至 ≤40% 并用「天工墨壶」收妖 1 次。' },
      { id: 'q1_4', title: '鼠王拦路',   targetMap: 'cave_bunker',   trigger: 'defeat_boss_ratking', desc: '击败「墨尾巨鼠王」，夺回信物「旧手表」。' }
    ]
  },
  {
    id: 'act_2', act: 2, title: '第二幕：断带回声 · 废都暗涌', regionId: 'reg_ruins',
    reward: { exp: 360, gold: 750, unlockRegion: 'reg_arsenal' },
    steps: [
      { id: 'q2_1', title: '磁带杂音', targetMap: 'ruins',           trigger: 'get_story_1',  desc: '前往「铁锈废都」搜得「旧磁带」，听取阿哲撤离留言。' },
      { id: 'q2_2', title: '过关斩卡', targetMap: 'interior_tavern', trigger: 'talk_jiubao',  desc: '步入「废都黑市酒馆」向三娘打探地铁二号线暗门。' },
      { id: 'q2_3', title: '幽暗铁轨', targetMap: 'cave_metro',      trigger: 'enter_cave_metro', desc: '潜入「地铁二号线隧道」调查阿哲篝火营地。' },
      { id: 'q2_4', title: '断钢之阻', targetMap: 'cave_metro',      trigger: 'defeat_boss_duangang', desc: '击败「铁爪二当家·断钢」，夺回「泛黄笔记」。' }
    ]
  },
  {
    id: 'act_3', act: 3, title: '第三幕：赤焰余烬 · B-04 密道', regionId: 'reg_arsenal',
    reward: { exp: 620, gold: 1400, unlockRegion: 'reg_swamp' },
    steps: [
      { id: 'q3_1', title: '军械遗民',   targetMap: 'interior_armory', trigger: 'talk_tiejiang', desc: '步入「战前军械库内室」拜访军工老铁匠。' },
      { id: 'q3_2', title: '赤焰试炼',   targetMap: 'arsenal',         trigger: 'loot_arsenal',  desc: '在赤焰兵工废墟搜寻物资并突破机兵防线。' },
      { id: 'q3_3', title: '冷却井死斗', targetMap: 'cave_b04',        trigger: 'defeat_boss_zhurong', desc: '潜入「B-04 地下冷却井」击败「赤焰重甲·祝融七号」。' },
      { id: 'q3_4', title: '血迹与钥匙', targetMap: 'cave_b04',        trigger: 'get_story_3',   desc: '拾得「生锈钥匙（B-04）」，揭开天枢计划冰山一角。' }
    ]
  },
  {
    id: 'act_4', act: 4, title: '第四幕：毒瘴灯火 · 故人重逢', regionId: 'reg_swamp',
    reward: { exp: 980, gold: 2200, unlockRegion: 'reg_vault' },
    steps: [
      { id: 'q4_1', title: '涉泽寻医', targetMap: 'swamp',           trigger: 'talk_yinshi', desc: '穿越辐射沼泽，寻访「废土隐士·药翁」。' },
      { id: 'q4_2', title: '草庐灯火', targetMap: 'interior_hermit', trigger: 'talk_azhe',   desc: '步入「隐士草庐内室」，与失忆的挚友阿哲重逢。' },
      { id: 'q4_3', title: '菌窟采莲', targetMap: 'cave_mire',       trigger: 'defeat_boss_lotus_bane', desc: '潜入「毒泽沉没菌窟」击败「千年墨瘴母体」采得净瘴青莲。' },
      { id: 'q4_4', title: '旧梦重续', targetMap: 'interior_hermit', trigger: 'get_story_4', desc: '唤醒阿哲记忆，获知 07 号避难所与天枢主脑的真相。' }
    ]
  },
  {
    id: 'act_5', act: 5, title: '第五幕：天枢终局 · 墨土新生', regionId: 'reg_vault',
    reward: { exp: 2000, gold: 5000 },
    steps: [
      { id: 'q5_1', title: '重返 07 号', targetMap: 'vault',        trigger: 'talk_xuezhe', desc: '进入「07号避难所主控区」与林博士会合。' },
      { id: 'q5_2', title: '尘封档案',   targetMap: 'vault',        trigger: 'loot_vault',  desc: '突破自律铁卫防线，收集避难所核心档案。' },
      { id: 'q5_3', title: '地脉决战',   targetMap: 'cave_tianshu', trigger: 'defeat_boss_tianshu', desc: '步入「天枢地脉密窟」，直面最终首领「天枢主脑·玄墨大帝」。' },
      { id: 'q5_4', title: '墨壶抉择',   targetMap: 'cave_tianshu', trigger: 'trigger_ending', desc: '以天工墨壶收束地脉奇点，见证墨土四大结局！' }
    ]
  }
];

export const STORY_CHAPTERS = [
  { id: 0, relic: '旧手表',   title: '第一章：停摆的 21:47',   text: '表壳内侧刻着阿哲的名字缩写「Z·L」。大停电爆发的那晚，正是 21:47，你们在城郊分头撤离，约定三天后在老站台汇合——但他再也没有出现。' },
  { id: 1, relic: '旧磁带',   title: '第二章：滋啦作响的留言', text: '你借老黄的收录机放出了磁带里的杂音：“……别来居民楼，铁爪帮封锁了北侧，我往地铁二号线转移了，如果有谁听到……”磁带在这里被撕断了。' },
  { id: 2, relic: '泛黄笔记', title: '第三章：隧道深处的足迹', text: '笔记里画着地铁通风井的草图：“物资快见底了，遇到一个懂机械的老鬼，他说军工厂地下还有未启封的应急通道，我决定去赌一把。”' },
  { id: 3, relic: '生锈钥匙', title: '第四章：B-04 闸门之后',  text: '这把黄铜钥匙属于兵工厂通往辐射沼泽的排污闸门。门后没有尸体，只有几道被拖拽的血迹和半个空药瓶——有人在辐射潮前把他拖出了通道。' },
  { id: 4, relic: '旧照片',   title: '第五章：沼泽彼岸的灯火', text: '照片背面用红笔标着一个清晰的营地坐标，旁边写着隐士的字迹：“失忆的年轻人已醒，在东岸草庐修无线电，等一个戴旧表的人。”' }
];

export const COLLECTIONS = [
  { id: 0, name: '青铜吊坠', era: '战前仿古', desc: '战前博物馆复刻青铜器，表面氧化层保存完好。' },
  { id: 1, name: '陶瓷碎片', era: '清代康熙', desc: '青花瓷残片，釉色青翠，底款清晰可辨。' },
  { id: 2, name: '古币',     era: '清代光绪', desc: '光绪通宝方孔铜钱，废土藏家眼中的吉祥物。' },
  { id: 3, name: '老邮票册', era: '民国时期', desc: '牛皮纸封套的邮票合集，在干燥废墟中幸存。' },
  { id: 4, name: '翡翠扳指', era: '近代珍品', desc: '冰种阳绿翡翠，透光如水，价值连城。' },
  { id: 5, name: '紫檀木盒', era: '明清工艺', desc: '小叶紫檀雕龙首饰盒，榫卯严丝合缝。' },
  { id: 6, name: '机械怀表', era: '20世纪初', desc: '瑞士双盖鎏金怀表，轻晃仍能听见游丝滴答。' },
  { id: 7, name: '战前黑胶', era: '大停电前', desc: '《第九交响曲》母盘黑胶，代表旧世界最后的浪漫。' }
];

// 6 项大地图被动修为（与 COMBAT_SKILLS 互补）
export const SKILLS = [
  { id: 0, name: '墨影步',   seal: '步', maxLevel: 3, cost: [1, 2, 3], desc: '移动速度加快，每次拾荒内息消耗 -1/-2/-3' },
  { id: 1, name: '鹰眼术',   seal: '眼', maxLevel: 3, cost: [1, 2, 3], desc: '珍品/绝世爆率 +15%/Lv，密室发现率 +4%/Lv' },
  { id: 2, name: '行囊诀',   seal: '囊', maxLevel: 3, cost: [1, 2, 3], desc: '行囊容量上限永久 +3 / +6 / +9 格' },
  { id: 3, name: '巧手拆解', seal: '巧', maxLevel: 3, cost: [1, 2, 3], desc: '拆解成功率 +10%/Lv，拆解收益 +20%/Lv' },
  { id: 4, name: '破风斩',   seal: '斩', maxLevel: 3, cost: [1, 2, 3], desc: '战斗攻击力 +6/Lv，逃脱成功率 +15%/Lv' },
  { id: 5, name: '天运诀',   seal: '运', maxLevel: 3, cost: [1, 2, 3], desc: '战斗/拆解暴击率 +8%/Lv，拾取品质运气提升' }
];

export const WEATHERS = [
  { id: 0, name: '晴朗微风',   short: '晴', particleType: 'leaf', rareBonus: 1.0,  energyCost: 1.0,  color: '#d49a3a', desc: '云淡风轻，内息消耗正常。' },
  { id: 1, name: '墨色辐射尘', short: '尘', particleType: 'rad',  rareBonus: 1.65, energyCost: 1.35, color: '#6fb98f', desc: '毒尘漫卷！内息消耗+35%，珍稀爆率大幅提升！' },
  { id: 2, name: '酸雨夜幕',   short: '雨', particleType: 'rain', rareBonus: 1.35, energyCost: 1.25, color: '#6da5c0', desc: '墨雨倾盆，内息消耗+25%，电子残骸更易显露。' },
  { id: 3, name: '灼热焦土',   short: '热', particleType: 'heat', rareBonus: 1.2,  energyCost: 1.2,  color: '#c96a42', desc: '热浪滚滚，内息消耗+20%，行旅注意补水。' },
  { id: 4, name: '狂风卷沙',   short: '风', particleType: 'sand', rareBonus: 1.4,  energyCost: 1.3,  color: '#b8b0a0', desc: '狂风吹开掩埋层！珍稀率+40%，内息消耗+30%。' }
];

export const ENDINGS = {
  normal: {
    id: 'normal', badge: '结局 I · 常规结局', title: '庇护之地',
    content: '你攒够了 15,000 废土币，在墨石镇外的青石高地筑起了竹篱与铁丝网交织的避风寨。炉火常暖，商队往来不绝。只是每当墨夜降临，怀中那只沉默的青铜墨壶偶尔微微发烫，那个停在 21:47 的名字，仍会化作一声落在茶烟里的长叹。'
  },
  friend: {
    id: 'friend', badge: '结局 II · 羁绊结局', title: '同伴重逢',
    content: '天枢主脑化作漫天散去的淡墨微光，笼罩墨土十余年的黑云终于裂开一线晨曦。你与阿哲并肩走出 07 号避难所，回到青瘴东岸亮着暖黄灯火的草庐。阿哲把修好的旧手表推回你掌心——指针重新滴答转动：“老伙计，这一次，不走散了。”'
  },
  collector: {
    id: 'collector', badge: '结局 III · 传奇结局', title: '末世收藏家',
    content: '青铜吊坠、康熙青花、光绪古币直至《第九交响曲》母盘黑胶——八件跨越浩劫的旧世遗珍在你手中全数重现天日！当黑胶唱针落下、交响乐穿过墨石镇的青石巷陌，你在镇中立起「墨土博物阁」，让旧世界最后的浪漫在废土上薪火相传。'
  },
  king: {
    id: 'king', badge: '隐藏结局 · 至高传说', title: '天工墨主 · 墨土之王',
    content: '你以「天工墨壶」吸纳失控的地脉奇点，重续墨家古法，化暴戾墨尘为滋养大地的甘霖。东岸无线电台传遍五域，阿哲替你守着通讯塔，林博士重启了旧世学堂。你集齐八方遗珍、收服万千墨灵、找回失散挚友——人们提起你的名字，只尊称一句：「天工墨主 · 墨土之王」。'
  }
};

export const DAILY_TASK_TPL = [
  { id: 0, name: '墨土行脚', target: 12,  reward: 120, sp: 1, type: 'pick' },
  { id: 1, name: '巧匠拆解', target: 4,   reward: 180, sp: 1, type: 'dis' },
  { id: 2, name: '以物易金', target: 600, reward: 220, sp: 1, type: 'sell' }
];

export const WEEKLY_TASK_TPL = {
  name: '周常：荒原行者', target: 120, reward: 1200, sp: 5, type: 'pick'
};

export const TEAM_TASK_TPL = {
  name: '搜寻失落补给箱',
  desc: '哨兵报告有一批战前空投箱坠落在废土深处，发送无线电信号即可加速定位！',
  target: 10
};

// 八大跨五域支线任务（长线 RPG 探索、重炮拆解、机甲狩猎、收妖试炼）
export const SIDE_QUESTS = [
  {
    id: 'sq_radio', name: '老黄的旧无线电', regionId: 'reg_town', npcId: 'laohuang',
    targetType: 'pick', targetCount: 8, rewardGold: 320, rewardSp: 1, rewardEquip: 'wpn_inkblade',
    desc: '替商人老黄在城郊废土搜集 8 份废旧物资以拼装无线电零件，获赠随机词缀【淬墨短刃】！'
  },
  {
    id: 'sq_cannon', name: '拆解废弃防空重炮', regionId: 'reg_town', npcId: 'laogui',
    targetType: 'salvage_heavy', targetCount: 1, rewardGold: 480, rewardSp: 1, rewardEquip: 'mech_steam_core',
    desc: '前往城郊废土或铁锈废都调查并拆解 1 座「废弃重炮/机甲残骸」，获赠【废土蒸汽机甲核】！'
  },
  {
    id: 'sq_watch', name: '三娘的黑市悬赏', regionId: 'reg_ruins', npcId: 'jiubao',
    targetType: 'battle_win', targetCount: 5, rewardGold: 680, rewardSp: 1, rewardEquip: 'wpn_shotgun',
    desc: '在铁锈废都击退 5 组游荡敌人，黑市酒保三娘将以随机词缀【铁爪双管霰弹铳】相赠！'
  },
  {
    id: 'sq_crucible', name: '天工墨壶收妖试炼', regionId: 'reg_ruins', npcId: 'laohuang',
    targetType: 'capture', targetCount: 3, rewardGold: 750, rewardSp: 2, rewardEquip: 'armor_ironwire',
    desc: '在战斗中累计以「天工墨壶」收服 3 只妖魂/机灵，领悟更深层的炼化诀窍。'
  },
  {
    id: 'sq_mech_hunt', name: '狩猎赤焰重装机甲', regionId: 'reg_arsenal', npcId: 'tiejiang',
    targetType: 'defeat_heavy', targetCount: 2, rewardGold: 1200, rewardSp: 2, rewardEquip: 'mech_crimson_frame',
    desc: '在赤焰兵工废墟击毁 2 台「赤焰重装机甲 / 自律重炮」，老铁匠将为你锻造【赤焰动力外骨骼】！'
  },
  {
    id: 'sq_forge_master', name: '墨壶炼化宗师', regionId: 'reg_arsenal', npcId: 'tiejiang',
    targetType: 'fuse', targetCount: 3, rewardGold: 1100, rewardSp: 2, rewardEquip: 'wpn_pulsesword',
    desc: '在天工墨壶中成功完成 3 次炼化（护驾/丹药/神兵），获赠【天工脉冲剑】！'
  },
  {
    id: 'sq_mire_sample', name: '药翁的毒瘴标本', regionId: 'reg_swamp', npcId: 'yinshi',
    targetType: 'pick', targetCount: 20, rewardGold: 1500, rewardSp: 2, rewardEquip: 'armor_exo',
    desc: '协助青瘴隐士在辐射沼泽采集样本（累计搜刮 20 次），获赠随机词缀【外骨骼墨甲】！'
  },
  {
    id: 'sq_antique_master', name: '林博士的旧世遗珍', regionId: 'reg_vault', npcId: 'xuezhe',
    targetType: 'collect_antique', targetCount: 4, rewardGold: 2400, rewardSp: 3, rewardEquip: 'mech_tianshu_exo',
    desc: '寻获至少 4 件战前古董交由林博士鉴赏，解锁绝世词缀【天枢玄甲核心】！'
  }
];
