// ==================== 《墨土拾荒录》2.5D 水墨废土 RPG · 完整五域核心数据 ====================

export const ASSETS = {
  bg_town: 'assets/bg_town.webp',
  bg_wasteland: 'assets/bg_wasteland.webp',
  bg_ruins: 'assets/bg_ruins.webp',
  bg_swamp: 'assets/bg_swamp.webp',
  bg_interior: 'assets/bg_interior.webp',
  bg_cave: 'assets/bg_cave.webp',
  bg_battle: 'assets/bg_battle.webp',
  portrait_hero: 'assets/portrait_hero.jpg',
  portrait_laohuang: 'assets/portrait_laohuang.jpg',
  portrait_yinshi: 'assets/portrait_yinshi.jpg',
  sprite_hero: 'assets/sprites/hero.png',
  sprite_npc_merchant: 'assets/sprites/npc_merchant.png',
  sprite_npc_hermit: 'assets/sprites/npc_hermit.png',
  sprite_shrine: 'assets/sprites/shrine.png',
  sprite_enemy_beast: 'assets/sprites/enemy_beast.png',
  sprite_enemy_mech: 'assets/sprites/enemy_mech.png',
  sprite_enemy_demon: 'assets/sprites/enemy_demon.png',
  sprite_chest: 'assets/sprites/chest.png',
  boss_rat_king: 'assets/sprites/boss_rat_king.webp',
  boss_ratking: 'assets/sprites/boss_rat_king.webp',
  boss_duangang: 'assets/sprites/boss_duangang.webp',
  boss_zhurong: 'assets/sprites/boss_zhurong.webp',
  boss_lotus_bane: 'assets/sprites/boss_lotus_bane.webp',
  boss_tianshu: 'assets/sprites/boss_tianshu.webp',
  bg_sky_citadel: 'assets/bg_sky_citadel.webp'
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
  },
  {
    id: 'reg_citadel', name: '天穹白玉京域', subtitle: '苍穹浮空净土、量子军械廊与太一裁决殿', act: 6,
    unlockCost: 12000, entryMap: 'sky_citadel', worldPos: { x: 86, y: 24 },
    maps: ['sky_citadel'],
    bossId: 'boss_archon_mech', color: '#38e8ff'
  }
];

export const WORLD_REGIONS = REGIONS;

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
  { id: 37, name: '战前黑胶',   seal: '古', category: 'antique', baseValue: 0, dis: false, isCollection: true, colId: 7, desc: '《第九交响曲》交响乐母盘黑胶唱片。' },

  // ---- 墨家机关符箓 · 战斗/探索消耗符 (38 - 45) ----
  { id: 38, name: '非攻护体符', seal: '护', category: 'talisman', baseValue: 140, dis: false, isConsumable: true, isTalisman: true, effect: { shield: 95, dmgReduce: 0.25 }, desc: '【墨家符箓】展开青铜墨盾 +95 点护盾，2 回合内减伤 25%。' },
  { id: 39, name: '雷枢破甲符', seal: '雷', category: 'talisman', baseValue: 165, dis: false, isConsumable: true, isTalisman: true, effect: { dmg: 120, debuff: 'def_down' }, desc: '【墨家符箓】引九霄墨雷造成 120 点无视闪避雷伤，并击碎敌方 30% 护甲。' },
  { id: 40, name: '天工镇魂符', seal: '镇', category: 'talisman', baseValue: 210, dis: false, isConsumable: true, isTalisman: true, effect: { dmg: 95, captureBonus: 0.35 }, desc: '【墨家符箓】净魂镇妖造成 95 点真实伤害，本回合墨壶【收妖】成功率 +35%！' },
  { id: 41, name: '量子跃迁符', seal: '跃', category: 'talisman', baseValue: 280, dis: false, isConsumable: true, isTalisman: true, effect: { hp: 150, energy: 70, cleanse: true }, desc: '【墨家符箓】相位重构：瞬间恢复 150 生命 + 70 内息，并净化全部异常状态！' },
  { id: 42, name: '玄墨聚气符', seal: '聚', category: 'talisman', baseValue: 155, dis: false, isConsumable: true, isTalisman: true, effect: { energy: 90, atkBuff: 0.22 }, desc: '【墨家符箓】回复 90 点内息，并使接下来 3 回合攻击力提升 22%。' },
  { id: 43, name: '朱雀焚天符', seal: '焚', category: 'talisman', baseValue: 240, dis: false, isConsumable: true, isTalisman: true, effect: { dmg: 160, debuff: 'burn' }, desc: '【墨家符箓】唤起朱雀业火造成 160 点烈焰伤害，并附加高额【灼烧】。' },
  { id: 44, name: '青莲净瘴符', seal: '莲', category: 'talisman', baseValue: 195, dis: false, isConsumable: true, isTalisman: true, effect: { hp: 110, radShield: 2, cleanse: true }, desc: '【墨家符箓】恢复 110 生命、净化毒瘴辐射，并赋予 2 层抗辐射护盾。' },
  { id: 45, name: '太虚遁影符', seal: '遁', category: 'talisman', baseValue: 180, dis: false, isConsumable: true, isTalisman: true, effect: { clearWarn: true, dodgeBuff: 0.35 }, desc: '【墨家符箓】清零警戒值，战斗中必定撤退或获得 2 回合 +35% 闪避！' },

  // ---- 高阶科幻材料 & 天穹珍奇道具 (46 - 61) ----
  { id: 46, name: '量子晶格',     seal: '晶', category: 'scifi',      baseValue: 1450, dis: true,  desc: '【天穹材料】高维稳定晶格矩阵，铸造量子白玉级神兵的核心基材。' },
  { id: 47, name: '白玉灵芯',     seal: '玉', category: 'scifi',      baseValue: 1850, dis: true,  desc: '【天穹材料】白玉京能源塔提纯的温润灵能芯片，兼具灵气与量子算力。' },
  { id: 48, name: '纳米修复凝胶', seal: '胶', category: 'consumable', baseValue: 260,  dis: false, isConsumable: true, effect: { hp: 190, radShield: 1 }, desc: '军工级纳米医用凝胶，使用：恢复 190 生命值并附加 1 层抗辐射护盾。' },
  { id: 49, name: '暗物质碎屑',   seal: '暗', category: 'rare',       baseValue: 2200, dis: true,  desc: '【绝密奇物】收容于磁约束瓶中的微克暗物质，价值连城。' },
  { id: 50, name: '超导墨丝',     seal: '丝', category: 'scifi',      baseValue: 1280, dis: false, desc: '【天穹材料】零电阻先秦墨纹超导纤维，编织太虚圣铠的必备织物。' },
  { id: 51, name: '太虚能量电池', seal: '能', category: 'consumable', baseValue: 320,  dis: false, isConsumable: true, effect: { energy: 120 }, desc: '高密度固态太虚电池，使用：立即恢复 120 点内息/能量。' },
  { id: 52, name: '战前全息芯片', seal: '全', category: 'tech',       baseValue: 1360, dis: true,  desc: '【旧世遗珍】封存着旧纪元战术推演库的全息储存片，拆解收益极高。' },
  { id: 53, name: '天穹通行密匙', seal: '匙', category: 'specialty',  baseValue: 1600, dis: false, desc: '【白玉京专属】镌刻执政官印徽的量子通行密匙，白玉京高阶身份凭证。' },
  { id: 54, name: '白玉京信用晶币', seal: '晶', category: 'specialty', baseValue: 1500, dis: false, desc: '【白玉京专属】穹顶净土通行的蓝白光学信用币，在废土黑市价值不菲。' },
  { id: 55, name: '反重力悬浮环', seal: '浮', category: 'scifi',      baseValue: 1750, dis: true,  desc: '【天穹材料】浮空廊道核心稳压环，可炼化太虚浮游剑匣。' },
  { id: 56, name: '墨家微缩轴承', seal: '轴', category: 'tech',       baseValue: 620,  dis: true,  desc: '【机关精件】精密至微米级的青铜合金轴承，机括武器进阶核心。' },
  { id: 57, name: '太一逻辑残片', seal: '太', category: 'rare',       baseValue: 2600, dis: true,  desc: '【白玉京专属】从裁决主神阵列剥离的高阶逻辑模块，蕴含惊人算力。' },
  { id: 58, name: '高能聚变微核', seal: '聚', category: 'scifi',      baseValue: 2400, dis: true,  desc: '【天穹材料】掌心大小的冷聚变核心，足以驱动顶级量子外骨骼。' },
  { id: 59, name: '穹顶净化液',   seal: '净', category: 'consumable', baseValue: 480,  dis: false, isConsumable: true, effect: { hp: 240, energy: 90, food: 65, cleanse: true }, desc: '白玉京特供全效恢复液，使用：+240生命 +90内息 +65饱食并净化全部异常！' },
  { id: 60, name: '先秦星枢竹简', seal: '简', category: 'rare',       baseValue: 1950, dis: false, desc: '【秘传典籍】以星辰钛丝串联的墨家天穹星图残简，珍稀无比。' },
  { id: 61, name: '量子全息星图', seal: '图', category: 'rare',       baseValue: 2800, dis: false, desc: '【终极奇物】实时投影苍穹九域坐标的立体星图仪，收藏价值无双。' }
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
    hp: 520, atk: 36, def: 12, exp: 320, gold: 560,
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
    hp: 980, atk: 88, def: 18, exp: 520, gold: 920,
    specialName: '过载喷焰', specialEvery: 3, specialMult: 1.65, inflicts: 'burn',
    introLine: '“警报：B-04 冷却井入侵检测。启动【祝融】焚毁协议。”',
    defeatLine: '重甲核心熄火，露出后方应急闸门与沾血的 B-04 黄铜钥匙。',
    desc: '战前重型炎熔机甲，每 3 回合喷射高热火焰造成灼烧。'
  },
  boss_lotus_bane: {
    id: 'boss_lotus_bane', name: '蚀骨藤灵·千年墨瘴母体', title: '菌窟主宰', spriteType: 'boss_lotus_bane',
    isBoss: true, capturable: false, dropSpiritId: 'slime', dropStoryId: 4,
    color: '#1b3b2c', accent: '#62e698', scale: 1.68,
    hp: 1550, atk: 122, def: 22, exp: 780, gold: 1400,
    specialName: '毒瘴再生', specialEvery: 2, specialMult: 1.4, inflicts: 'poison', healAtHalf: 100,
    introLine: '菌窟穹顶剧烈震颤，无数青绿毒藤在浓墨般的瘴气中苏醒！',
    defeatLine: '毒藤枯萎散尽，石台中央绽放出一朵晶莹剔透的「净瘴青莲」。',
    desc: '盘踞沉没菌窟的巨型变异灵体，善施剧毒并能在半血时再生。'
  },
  boss_tianshu: {
    id: 'boss_tianshu', name: '天枢主脑·玄墨大帝', title: '地脉奇点化身', spriteType: 'boss_tianshu',
    isBoss: true, capturable: false, dropSpiritId: 'guard', isFinalBoss: true,
    color: '#221638', accent: '#c084fc', scale: 1.85,
    hp: 2600, atk: 165, def: 28, exp: 1500, gold: 3000,
    specialName: '天枢墨劫', specialEvery: 3, specialMult: 1.75, enrageAt: 0.5,
    introLine: '“旧世已朽，墨尘方为永恒。归还天工墨壶，融于天枢吧！”',
    phase2Line: '“区区凡躯，竟敢以壶逆天？！见证地脉奇点的真容！”',
    defeatLine: '“……原来，21:47 之后，人间仍有灯火未熄……”',
    desc: '吞噬地脉奇点的失控终极主脑，半血觉醒二阶段，决定墨土最终命运。'
  },

  // ---- 天穹白玉京高阶科幻机兵 & 终局裁决主神 ----
  citadel_enforcer: {
    id: 'citadel_enforcer', name: '穹顶律法卫', spriteType: 'guard', isBoss: false, capturable: true,
    tier: 5, fusionCategory: 'mecha',
    color: '#243b55', accent: '#38e8ff', scale: 1.24,
    hp: 460, atk: 68, def: 26, exp: 420, gold: 760,
    spiritName: '穹顶律法魄', spiritPower: 92,
    desc: '驻守天穹白玉京长廊的高阶自律执法机兵，手持离子长戟与光学盾。'
  },
  quantum_sentinel: {
    id: 'quantum_sentinel', name: '太虚量子机兵', spriteType: 'drone', isBoss: false, capturable: true,
    tier: 5, fusionCategory: 'mecha',
    color: '#1e3a5f', accent: '#7dd3fc', scale: 1.26,
    hp: 510, atk: 76, def: 24, exp: 480, gold: 860,
    spiritName: '太虚量子魄', spiritPower: 98,
    desc: '搭载相位跃迁引擎的浮空量子卫士，能发射高能粒子束穿透重甲。'
  },
  jade_arbiter: {
    id: 'jade_arbiter', name: '白玉京裁决机甲', spriteType: 'heavy_mech', isBoss: false, capturable: true,
    tier: 5, fusionCategory: 'mecha',
    color: '#2d3f54', accent: '#f5d061', scale: 1.38,
    hp: 640, atk: 84, def: 32, exp: 580, gold: 1050,
    spiritName: '白玉裁决魄', spiritPower: 110,
    desc: '白玉京内廷精锐双足重装圣甲，双肩搭载浮游剑阵与电磁炮。'
  },
  boss_archon_mech: {
    id: 'boss_archon_mech', name: '天穹裁决主神·太一', title: '白玉京终极仲裁机', spriteType: 'boss_tianshu',
    isBoss: true, capturable: false, dropSpiritId: 'jade_arbiter', isCitadelBoss: true,
    color: '#1b2b4a', accent: '#38e8ff', scale: 1.92,
    hp: 3800, atk: 195, def: 38, exp: 2600, gold: 5200,
    specialName: '太一量子天罚', specialEvery: 3, specialMult: 1.85, enrageAt: 0.5,
    introLine: '“检测到地表未经授权的墨壶共振体。白玉京最高仲裁协议【太一】——启动！”',
    phase2Line: '“地表尘埃岂可染指苍穹净土？展开太虚十二翼，抹除异常变量！”',
    defeatLine: '“仲裁矩阵……过载停机……白玉京穹顶闸门已向地表开放，愿旧世与新土重归一体。”',
    desc: '镇守天穹白玉京最高圣殿的终极量子裁决主神，半血展开太虚光翼，掉落绝世天穹神装！'
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

// 装备库（67 件：26 武器 / 16 护甲 / 12 机甲核心 / 13 秘宝，完整融合古武/军火/科幻墨甲/仙妖/白玉京量子）
export const EQUIPMENT = {
  // ==================== 武器 · 墨剑系 (weaponStyle: 'sword', 9 件) ====================
  wpn_pipe: {
    id: 'wpn_pipe', name: '无锋墨铁剑', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'common', seal: '剑', visualTier: 1, visualColor: '#8c969e', minRegion: 0, dropTier: 1,
    atk: 9, crit: 0.04, desc: '【古武·入门】墨家弟子初入废土的宽背墨铁重剑：攻击 +9，暴击 +4%。'
  },
  wpn_bronze_feigong: {
    id: 'wpn_bronze_feigong', name: '青铜非攻剑', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'fine', seal: '非', visualTier: 1, visualColor: '#5fa88a', minRegion: 0, dropTier: 1,
    atk: 17, def: 4, crit: 0.08, desc: '【墨家古剑】铭刻非攻云雷纹的青铜古剑：攻击 +17，防御 +4，暴击 +8%。'
  },
  wpn_qingcheng: {
    id: 'wpn_qingcheng', name: '青城墨剑', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'rare', seal: '剑', visualTier: 2, visualColor: '#4da6ff', minRegion: 1, dropTier: 2,
    atk: 30, crit: 0.16, skillBonus: 0.15, desc: '【古武】青城秘传古剑：攻击 +30，暴击 +16%，武学伤害 +15%。'
  },
  wpn_xuanmo_mech_sword: {
    id: 'wpn_xuanmo_mech_sword', name: '玄墨机括剑', slot: 'weapon', genre: 'scifi', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'rare', seal: '括', visualTier: 3, visualColor: '#7c8cf8', minRegion: 2, dropTier: 3,
    atk: 38, crit: 0.15, armorPen: 0.16, desc: '【墨家机关】剑脊内置高频机括齿轮的玄铁重剑：攻 +38，暴击 +15%，穿甲 +16%。'
  },
  wpn_xingshu_water: {
    id: 'wpn_xingshu_water', name: '星枢断水剑', slot: 'weapon', genre: 'mythic', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'rare', seal: '星', visualTier: 3, visualColor: '#38bdf8', minRegion: 3, dropTier: 4,
    atk: 46, crit: 0.18, maxEnergy: 20, skillBonus: 0.18, desc: '【古武×星枢】挥剑如星河断水：攻击 +46，暴击 +18%，内息 +20，技能 +18%。'
  },
  wpn_pulsesword: {
    id: 'wpn_pulsesword', name: '墨渊等离子光剑', slot: 'weapon', genre: 'scifi', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'legend', seal: '脉', visualTier: 4, visualColor: '#60a5fa', minRegion: 4, dropTier: 5,
    atk: 54, maxEnergy: 30, skillBonus: 0.22, desc: '【古武×科幻】古剑与能量核炼化而成的墨渊光剑：攻 +54，内息 +30，技能 +22%！'
  },
  wpn_quantum_arc: {
    id: 'wpn_quantum_arc', name: '量子弧光剑', slot: 'weapon', genre: 'scifi', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'legend', seal: '弧', visualTier: 4, visualColor: '#38e8ff', minRegion: 4, dropTier: 5,
    atk: 64, crit: 0.22, armorPen: 0.26, maxEnergy: 25, desc: '【量子剑器】白玉京实验室流出的高能弧光剑：攻 +64，暴击 +22%，穿甲 +26%。'
  },
  wpn_xuanyuan: {
    id: 'wpn_xuanyuan', name: '轩辕墨渊剑', slot: 'weapon', genre: 'mythic', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'legend', seal: '渊', visualTier: 5, visualColor: '#f5b041', minRegion: 4, dropTier: 6,
    atk: 72, def: 14, crit: 0.24, armorPen: 0.32, desc: '【神话神兵】终极绝世神剑：攻 +72，防 +14，暴击 +24%，无视 32% 防御！'
  },
  wpn_baiyujing_taixu: {
    id: 'wpn_baiyujing_taixu', name: '白玉京·太虚粒子剑', slot: 'weapon', genre: 'scifi', weaponType: 'blade', weaponStyle: 'sword',
    quality: 'legend', seal: '虚', visualTier: 5, visualColor: '#7ef9ff', minRegion: 5, dropTier: 6,
    atk: 88, crit: 0.28, armorPen: 0.36, maxEnergy: 40, skillBonus: 0.30, desc: '【白玉京至宝】凝聚太虚粒子流的天穹圣剑：攻 +88，暴击 +28%，穿甲 +36%，技能 +30%！'
  },

  // ==================== 武器 · 重刃系 (weaponStyle: 'blade', 6 件) ====================
  wpn_rust_cleaver: {
    id: 'wpn_rust_cleaver', name: '铁锈斩骨刀', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', weaponStyle: 'blade',
    quality: 'common', seal: '刀', visualTier: 1, visualColor: '#9c7862', minRegion: 0, dropTier: 1,
    atk: 12, crit: 0.05, desc: '【废土重刃】厚背锯齿铁刀，劈砍有力：攻击 +12，暴击 +5%。'
  },
  wpn_inkblade: {
    id: 'wpn_inkblade', name: '淬墨短刃', slot: 'weapon', genre: 'wuxia', weaponType: 'blade', weaponStyle: 'blade',
    quality: 'fine', seal: '刃', visualTier: 1, visualColor: '#6fb98f', minRegion: 0, dropTier: 1,
    atk: 14, crit: 0.08, desc: '【古武】墨尘淬火的轻巧侠客刃：攻击 +14，暴击 +8%。'
  },
  wpn_chainsaw_blade: {
    id: 'wpn_chainsaw_blade', name: '断钢链锯重刃', slot: 'weapon', genre: 'military', weaponType: 'blade', weaponStyle: 'blade',
    quality: 'fine', seal: '锯', visualTier: 2, visualColor: '#d96b43', minRegion: 1, dropTier: 2,
    atk: 26, crit: 0.12, armorPen: 0.14, desc: '【废都凶刃】铁爪帮仿制的高速链锯大刀：攻 +26，暴击 +12%，穿甲 +14%。'
  },
  wpn_zhurong_dao: {
    id: 'wpn_zhurong_dao', name: '祝融熔炎大刀', slot: 'weapon', genre: 'military', weaponType: 'blade', weaponStyle: 'blade',
    quality: 'rare', seal: '熔', visualTier: 3, visualColor: '#ff7034', minRegion: 2, dropTier: 3,
    atk: 42, crit: 0.14, proc: 'burn', desc: '【赤焰兵工】刃口流淌赤红熔炎的重型战刀：攻 +42，暴击 +14%，普攻附加【灼烧】。'
  },
  wpn_cyber_nodachi: {
    id: 'wpn_cyber_nodachi', name: '赛博高频墨太刀', slot: 'weapon', genre: 'scifi', weaponType: 'blade', weaponStyle: 'blade',
    quality: 'rare', seal: '刹', visualTier: 4, visualColor: '#f43f5e', minRegion: 3, dropTier: 4,
    atk: 52, crit: 0.22, armorPen: 0.22, desc: '【赛博义刃】超高频震荡纳米长刀，断铁如泥：攻 +52，暴击 +22%，穿甲 +22%。'
  },
  wpn_taotie_greataxe: {
    id: 'wpn_taotie_greataxe', name: '饕餮噬钢巨斧', slot: 'weapon', genre: 'mythic', weaponType: 'blade', weaponStyle: 'blade',
    quality: 'legend', seal: '饕', visualTier: 5, visualColor: '#f59e0b', minRegion: 5, dropTier: 6,
    atk: 82, def: 12, crit: 0.20, armorPen: 0.34, lifesteal: 0.10, desc: '【凶兽重刃】吞噬金属与血气的绝世巨斧：攻 +82，防 +12，穿甲 +34%，吸血 +10%！'
  },

  // ==================== 武器 · 枪炮系 (weaponStyle: 'gun', 8 件) ====================
  wpn_flaregun: {
    id: 'wpn_flaregun', name: '赤炎土铳', slot: 'weapon', genre: 'military', weaponType: 'pistol', weaponStyle: 'gun',
    quality: 'fine', seal: '铳', visualTier: 1, visualColor: '#e07a3d', minRegion: 0, dropTier: 1,
    atk: 24, crit: 0.10, proc: 'burn', desc: '【军火】短管火铳：攻击 +24，暴击 +10%，普攻 25% 概率附加【灼烧】。'
  },
  wpn_shotgun: {
    id: 'wpn_shotgun', name: '铁爪双管霰弹铳', slot: 'weapon', genre: 'military', weaponType: 'shotgun', weaponStyle: 'gun',
    quality: 'rare', seal: '霰', visualTier: 2, visualColor: '#c95c3f', minRegion: 1, dropTier: 2,
    atk: 32, crit: 0.14, armorPen: 0.15, desc: '【军火】近战轰杀利器：攻击 +32，暴击 +14%，无视 15% 防御。'
  },
  wpn_sniper: {
    id: 'wpn_sniper', name: '反器材狙击长铳', slot: 'weapon', genre: 'military', weaponType: 'sniper', weaponStyle: 'gun',
    quality: 'rare', seal: '狙', visualTier: 3, visualColor: '#6b94b8', minRegion: 2, dropTier: 3,
    atk: 40, crit: 0.20, mechBonus: 0.25, desc: '【军火】重型反器材狙击枪：攻击 +40，暴击 +20%，对机械额外 +25% 穿甲。'
  },
  wpn_plasma_rifle: {
    id: 'wpn_plasma_rifle', name: '幽蓝等离子脉冲步枪', slot: 'weapon', genre: 'scifi', weaponType: 'plasma', weaponStyle: 'gun',
    quality: 'rare', seal: '光', visualTier: 3, visualColor: '#38bdf8', minRegion: 3, dropTier: 4,
    atk: 44, maxEnergy: 20, crit: 0.15, desc: '【科幻】战前高能步枪：攻击 +44，内息上限 +20，暴击 +15%。'
  },
  wpn_artillery: {
    id: 'wpn_artillery', name: '便携式重炮发射器', slot: 'weapon', genre: 'military', weaponType: 'cannon', weaponStyle: 'gun',
    quality: 'rare', seal: '炮', visualTier: 3, visualColor: '#e08b3e', minRegion: 2, dropTier: 3,
    atk: 48, artilleryBonus: 0.25, desc: '【军火】单兵重炮：攻击 +48，重炮/空袭类技能伤害额外 +25%！'
  },
  wpn_gatling: {
    id: 'wpn_gatling', name: '火神加特林重机枪', slot: 'weapon', genre: 'military', weaponType: 'gatling', weaponStyle: 'gun',
    quality: 'legend', seal: '神', visualTier: 4, visualColor: '#fb923c', minRegion: 3, dropTier: 5,
    atk: 56, crit: 0.18, armorPen: 0.22, desc: '【军火】六管旋转重机枪！攻击 +56，暴击 +18%，倾泻钢铁弹幕无视 22% 防御！'
  },
  wpn_railgun: {
    id: 'wpn_railgun', name: '朱雀烈焰电磁炮', slot: 'weapon', genre: 'scifi', weaponType: 'railgun', weaponStyle: 'gun',
    quality: 'legend', seal: '雀', visualTier: 4, visualColor: '#f97316', minRegion: 4, dropTier: 5,
    atk: 66, artilleryBonus: 0.35, proc: 'burn', armorPen: 0.28, desc: '【军火×妖核】重炮与妖核跨界炼化：攻 +66，重炮 +35%，无视 28% 防御并附加灼烧！'
  },
  wpn_citadel_gauss: {
    id: 'wpn_citadel_gauss', name: '白玉京·太一磁轨粒子炮', slot: 'weapon', genre: 'scifi', weaponType: 'railgun', weaponStyle: 'gun',
    quality: 'legend', seal: '轨', visualTier: 5, visualColor: '#38e8ff', minRegion: 5, dropTier: 6,
    atk: 86, crit: 0.24, armorPen: 0.38, artilleryBonus: 0.40, desc: '【白玉京军械】双轨量子电磁主炮：攻 +86，暴击 +24%，穿甲 +38%，重炮 +40%！'
  },

  // ==================== 武器 · 机关戟/法杖系 (weaponStyle: 'staff', 3 件) ====================
  wpn_mojia_staff: {
    id: 'wpn_mojia_staff', name: '墨家非攻机关棍', slot: 'weapon', genre: 'wuxia', weaponType: 'staff', weaponStyle: 'staff',
    quality: 'fine', seal: '棍', visualTier: 1, visualColor: '#a68b5b', minRegion: 0, dropTier: 1,
    atk: 19, def: 6, maxEnergy: 15, desc: '【墨家机关】可伸缩青铜机括长棍：攻击 +19，防御 +6，内息 +15。'
  },
  wpn_thunder_halberd: {
    id: 'wpn_thunder_halberd', name: '雷枢玄墨机关戟', slot: 'weapon', genre: 'mythic', weaponType: 'staff', weaponStyle: 'staff',
    quality: 'rare', seal: '戟', visualTier: 3, visualColor: '#60a5fa', minRegion: 2, dropTier: 4,
    atk: 45, crit: 0.16, maxEnergy: 25, skillBonus: 0.20, desc: '【机关×雷法】戟尖缠绕墨雷电弧：攻 +45，暴击 +16%，内息 +25，奇术 +20%。'
  },
  wpn_tianshu_scepter: {
    id: 'wpn_tianshu_scepter', name: '天穹量子权杖', slot: 'weapon', genre: 'scifi', weaponType: 'staff', weaponStyle: 'staff',
    quality: 'legend', seal: '杖', visualTier: 5, visualColor: '#c084fc', minRegion: 5, dropTier: 6,
    atk: 80, maxEnergy: 60, mpRegen: 10, skillBonus: 0.35, desc: '【白玉京秘杖】执政官级能量权杖：攻 +80，内息 +60，回息 +10，奇术/技能 +35%！'
  },

  // ==================== 护甲 (slot: 'armor', 16 件) ====================
  armor_scavenger_cloth: {
    id: 'armor_scavenger_cloth', name: '拾荒布衣', slot: 'armor', genre: 'wuxia', helmStyle: 'hat',
    quality: 'common', seal: '衣', visualTier: 1, visualColor: '#9e917d', minRegion: 0, dropTier: 1,
    def: 5, maxHp: 20, desc: '【废土常服】粗麻缝制的防风斗笠与布衫：防御 +5，最大生命 +20。'
  },
  armor_wasteland_leather: {
    id: 'armor_wasteland_leather', name: '荒原革甲', slot: 'armor', genre: 'wuxia', helmStyle: 'hat',
    quality: 'common', seal: '革', visualTier: 1, visualColor: '#8f6b4e', minRegion: 0, dropTier: 1,
    def: 9, maxHp: 32, desc: '【废土轻甲】变异兽皮鞣制的耐磨革甲：防御 +9，最大生命 +32。'
  },
  armor_ironwire: {
    id: 'armor_ironwire', name: '玄铁软丝甲', slot: 'armor', genre: 'wuxia', helmStyle: 'hat',
    quality: 'fine', seal: '甲', visualTier: 1, visualColor: '#6f8794', minRegion: 0, dropTier: 1,
    def: 12, maxHp: 45, desc: '【古武】大桥钢缆编织而成：防御 +12，最大生命 +45。'
  },
  armor_mo_light: {
    id: 'armor_mo_light', name: '墨铁轻甲', slot: 'armor', genre: 'wuxia', helmStyle: 'hat',
    quality: 'fine', seal: '墨', visualTier: 2, visualColor: '#4b5563', minRegion: 1, dropTier: 2,
    def: 16, maxHp: 62, dodgeRate: 0.05, desc: '【墨家甲胄】轻便贴身的玄墨鱼鳞甲：防御 +16，生命 +62，闪避 +5%。'
  },
  armor_raider_plate: {
    id: 'armor_raider_plate', name: '铁爪铆钉重甲', slot: 'armor', genre: 'military', helmStyle: 'visor',
    quality: 'fine', seal: '铆', visualTier: 2, visualColor: '#a84a3b', minRegion: 1, dropTier: 2,
    def: 20, maxHp: 78, dmgReduce: 0.08, desc: '【废都重甲】车门钢板铆接的防弹护甲：防御 +20，生命 +78，减伤 +8%。'
  },
  armor_feigong_mech: {
    id: 'armor_feigong_mech', name: '非攻机关甲', slot: 'armor', genre: 'scifi', helmStyle: 'visor',
    quality: 'rare', seal: '机', visualTier: 2, visualColor: '#5fa88a', minRegion: 1, dropTier: 3,
    def: 23, maxHp: 90, startShield: 30, desc: '【墨家机关】开战自动展开 30 点墨盾：防御 +23，生命 +90，护盾 +30。'
  },
  armor_arsenal_hazmat: {
    id: 'armor_arsenal_hazmat', name: '兵工防化耐热服', slot: 'armor', genre: 'military', helmStyle: 'visor',
    quality: 'rare', seal: '热', visualTier: 3, visualColor: '#e08b3e', minRegion: 2, dropTier: 3,
    def: 24, maxHp: 96, radResist: 0.30, dmgReduce: 0.12, desc: '【赤焰兵工】抵御高温灼烧与辐射尘：防御 +24，生命 +96，抗辐 +30%，减伤 +12%。'
  },
  armor_xuanmo_robe: {
    id: 'armor_xuanmo_robe', name: '玄墨天工袍', slot: 'armor', genre: 'wuxia', helmStyle: 'crown',
    quality: 'rare', seal: '袍', visualTier: 3, visualColor: '#7c6bc4', minRegion: 2, dropTier: 3,
    def: 22, maxHp: 88, maxEnergy: 30, mpRegen: 5, desc: '【墨家宗师】绣满星枢墨纹的宗师道袍：防 +22，生命 +88，内息 +30，回息 +5。'
  },
  armor_exo: {
    id: 'armor_exo', name: '墨甲外骨骼战衣', slot: 'armor', genre: 'scifi', helmStyle: 'visor',
    quality: 'rare', seal: '铠', visualTier: 3, visualColor: '#60a5fa', minRegion: 2, dropTier: 3,
    def: 26, maxHp: 100, dmgReduce: 0.16, desc: '【墨甲】防御 +26，最大生命 +100，战斗物理减伤 +16%。'
  },
  armor_miasma_cloak: {
    id: 'armor_miasma_cloak', name: '青瘴净莲斗篷', slot: 'armor', genre: 'mythic', helmStyle: 'hat',
    quality: 'rare', seal: '莲', visualTier: 3, visualColor: '#62e698', minRegion: 3, dropTier: 4,
    def: 28, maxHp: 118, radResist: 0.45, dodgeRate: 0.08, desc: '【毒泽秘衣】青莲药汁浸染的避瘴斗篷：防 +28，生命 +118，抗辐 +45%，闪避 +8%。'
  },
  armor_fox_silk: {
    id: 'armor_fox_silk', name: '青丘灵丝道袍', slot: 'armor', genre: 'mythic', helmStyle: 'crown',
    quality: 'rare', seal: '狐', visualTier: 4, visualColor: '#f088c8', minRegion: 3, dropTier: 4,
    def: 30, maxHp: 125, maxEnergy: 38, crit: 0.10, desc: '【妖灵宝衣】九尾灵丝织就的流光法袍：防 +30，生命 +125，内息 +38，暴击 +10%。'
  },
  armor_nano_stealth: {
    id: 'armor_nano_stealth', name: '纳米隐纹甲', slot: 'armor', genre: 'scifi', helmStyle: 'visor',
    quality: 'rare', seal: '隐', visualTier: 4, visualColor: '#38bdf8', minRegion: 4, dropTier: 5,
    def: 36, maxHp: 150, dodgeRate: 0.14, crit: 0.12, desc: '【战前特工】自适应光学迷彩纳米战甲：防 +36，生命 +150，闪避 +14%，暴击 +12%。'
  },
  armor_tianshu_aegis: {
    id: 'armor_tianshu_aegis', name: '天枢地脉圣铠', slot: 'armor', genre: 'mythic', helmStyle: 'crown',
    quality: 'legend', seal: '枢', visualTier: 4, visualColor: '#c084fc', minRegion: 4, dropTier: 5,
    def: 42, maxHp: 185, dmgReduce: 0.20, startShield: 55, desc: '【天枢重甲】地脉灵能驱动的紫金圣铠：防 +42，生命 +185，减伤 +20%，开局护盾 +55！'
  },
  armor_quantum_jade: {
    id: 'armor_quantum_jade', name: '量子白玉战甲', slot: 'armor', genre: 'scifi', helmStyle: 'quantum',
    quality: 'legend', seal: '玉', visualTier: 5, visualColor: '#38e8ff', minRegion: 5, dropTier: 6,
    def: 50, maxHp: 220, dmgReduce: 0.24, maxEnergy: 35, desc: '【白玉京精锐】白玉陶瓷复合材料与量子力场甲：防 +50，生命 +220，减伤 +24%，内息 +35！'
  },
  armor_archon_mantle: {
    id: 'armor_archon_mantle', name: '执政官星环法袍', slot: 'armor', genre: 'scifi', helmStyle: 'crown',
    quality: 'legend', seal: '环', visualTier: 5, visualColor: '#f5d061', minRegion: 5, dropTier: 6,
    def: 46, maxHp: 210, maxEnergy: 55, mpRegen: 10, skillBonus: 0.22, desc: '【白玉京礼装】背负全息星环的执政官长袍：防 +46，生命 +210，内息 +55，技能 +22%！'
  },
  armor_sky_taixu_plate: {
    id: 'armor_sky_taixu_plate', name: '天穹太虚圣铠', slot: 'armor', genre: 'scifi', helmStyle: 'quantum',
    quality: 'legend', seal: '穹', visualTier: 5, visualColor: '#7ef9ff', minRegion: 5, dropTier: 6,
    def: 58, maxHp: 265, dmgReduce: 0.28, startShield: 90, immuneTide: true, desc: '【终极圣铠】天穹白玉京至高防御圣甲：防 +58，生命 +265，减伤 +28%，开局护盾 +90，免疫辐射潮！'
  },

  // ==================== 机甲核心 (slot: 'mech', 12 件) ====================
  mech_crossbow_box: {
    id: 'mech_crossbow_box', name: '墨家连弩匣', slot: 'mech', genre: 'wuxia',
    quality: 'common', seal: '弩', visualTier: 1, visualColor: '#a68b5b', minRegion: 0, dropTier: 1,
    atk: 8, crit: 0.06, desc: '【墨家机关】挂于臂侧的青铜连发机弩匣：攻击 +8，暴击 +6%。'
  },
  mech_steam_core: {
    id: 'mech_steam_core', name: '废土蒸汽机甲核', slot: 'mech', genre: 'military',
    quality: 'fine', seal: '核', visualTier: 1, visualColor: '#c97b42', minRegion: 0, dropTier: 1,
    atk: 12, def: 8, maxHp: 50, artilleryBonus: 0.15, desc: '【机甲】初级机甲核心：攻击 +12，防御 +8，重炮技能 +15%。'
  },
  mech_ranger_optic: {
    id: 'mech_ranger_optic', name: '游侠光学瞄具', slot: 'mech', genre: 'military',
    quality: 'fine', seal: '瞄', visualTier: 2, visualColor: '#6fb98f', minRegion: 1, dropTier: 2,
    atk: 16, crit: 0.14, armorPen: 0.12, desc: '【军工配件】夜视测距目镜模块：攻击 +16，暴击 +14%，穿甲 +12%。'
  },
  mech_metro_thruster: {
    id: 'mech_metro_thruster', name: '磁轨推进器', slot: 'mech', genre: 'scifi',
    quality: 'fine', seal: '推', visualTier: 2, visualColor: '#60a5fa', minRegion: 1, dropTier: 2,
    atk: 18, def: 10, dodgeRate: 0.10, desc: '【废都改装】背部磁悬浮瞬步推进翼：攻击 +18，防御 +10，闪避 +10%。'
  },
  mech_feigong_shield: {
    id: 'mech_feigong_shield', name: '非攻护盾发生器', slot: 'mech', genre: 'scifi',
    quality: 'rare', seal: '盾', visualTier: 3, visualColor: '#38bdf8', minRegion: 2, dropTier: 3,
    def: 20, maxHp: 90, startShield: 60, dmgReduce: 0.10, desc: '【墨家防御】肩载量子墨盾发生器：防 +20，生命 +90，开局护盾 +60，减伤 +10%。'
  },
  mech_crimson_frame: {
    id: 'mech_crimson_frame', name: '赤焰重装墨甲', slot: 'mech', genre: 'scifi',
    quality: 'rare', seal: '机', visualTier: 3, visualColor: '#ff7034', minRegion: 2, dropTier: 3,
    atk: 26, def: 18, maxHp: 95, artilleryBonus: 0.25, desc: '【墨甲】兵工级重装机甲：攻 +26，防 +18，生命 +95，重炮 +25%。'
  },
  mech_bio_filter: {
    id: 'mech_bio_filter', name: '青瘴生化过滤核', slot: 'mech', genre: 'scifi',
    quality: 'rare', seal: '滤', visualTier: 3, visualColor: '#62e698', minRegion: 3, dropTier: 4,
    def: 22, maxHp: 110, radResist: 0.50, mpRegen: 6, desc: '【毒泽生态】循环净化外呼吸核心：防 +22，生命 +110，抗辐 +50%，回息 +6。'
  },
  mech_arc_capacitor: {
    id: 'mech_arc_capacitor', name: '雷枢电弧电容核', slot: 'mech', genre: 'scifi',
    quality: 'rare', seal: '弧', visualTier: 4, visualColor: '#818cf8', minRegion: 4, dropTier: 4,
    atk: 32, crit: 0.16, maxEnergy: 35, skillBonus: 0.20, desc: '【高压雷核】高频特斯拉过载电容：攻 +32，暴击 +16%，内息 +35，技能 +20%。'
  },
  mech_bit_array: {
    id: 'mech_bit_array', name: '天工浮游炮阵列', slot: 'mech', genre: 'scifi',
    quality: 'legend', seal: '浮', visualTier: 4, visualColor: '#fb923c', minRegion: 3, dropTier: 5,
    atk: 34, crit: 0.14, maxEnergy: 25, artilleryBonus: 0.30, desc: '【科幻墨甲】悬浮浮游炮：攻 +34，暴击 +14%，内息 +25，重炮/科幻技 +30%！'
  },
  mech_tianshu_exo: {
    id: 'mech_tianshu_exo', name: '天枢量子玄甲', slot: 'mech', genre: 'scifi',
    quality: 'legend', seal: '枢', visualTier: 5, visualColor: '#c084fc', minRegion: 4, dropTier: 5,
    atk: 40, def: 26, maxHp: 150, artilleryBonus: 0.40, mpRegen: 6, desc: '【终极墨甲】攻 +40，防 +26，生命 +150，重炮 +40%，每回合回息 +6！'
  },
  mech_taixu_swordbox: {
    id: 'mech_taixu_swordbox', name: '太虚浮游剑匣', slot: 'mech', genre: 'scifi',
    quality: 'legend', seal: '匣', visualTier: 5, visualColor: '#38e8ff', minRegion: 5, dropTier: 6,
    atk: 52, crit: 0.22, armorPen: 0.25, doubleHit: 0.18, desc: '【白玉京剑匣】十二口量子飞剑自动齐射：攻 +52，暴击 +22%，穿甲 +25%，连击 +18%！'
  },
  mech_quantum_singularity: {
    id: 'mech_quantum_singularity', name: '量子奇点引擎', slot: 'mech', genre: 'scifi',
    quality: 'legend', seal: '奇', visualTier: 5, visualColor: '#7ef9ff', minRegion: 5, dropTier: 6,
    atk: 58, def: 32, maxHp: 190, maxEnergy: 50, mpRegen: 12, artilleryBonus: 0.45, desc: '【白玉京终极核心】微型奇点驱动炉：攻 +58，防 +32，生命 +190，回息 +12，重炮 +45%！'
  },

  // ==================== 秘宝 (slot: 'relic', 13 件) ====================
  relic_feigong_charm: {
    id: 'relic_feigong_charm', name: '非攻护体符印', slot: 'relic', genre: 'wuxia',
    quality: 'common', seal: '符', visualTier: 1, visualColor: '#b8a074', minRegion: 0, dropTier: 1,
    def: 6, maxHp: 35, startShield: 20, desc: '【墨家信物】护佑游侠的青铜符印：防御 +6，生命 +35，开局护盾 +20。'
  },
  relic_mo_compass: {
    id: 'relic_mo_compass', name: '墨子司南盘', slot: 'relic', genre: 'wuxia',
    quality: 'fine', seal: '南', visualTier: 1, visualColor: '#c89b3c', minRegion: 0, dropTier: 1,
    maxEnergy: 20, magicFind: 0.18, goldFind: 0.20, desc: '【寻宝秘器】指引废土宝藏的磁石罗盘：内息 +20，掉宝率 +18%，金币 +20%。'
  },
  relic_leishu_seal: {
    id: 'relic_leishu_seal', name: '雷枢破甲符印', slot: 'relic', genre: 'mythic',
    quality: 'fine', seal: '破', visualTier: 2, visualColor: '#60a5fa', minRegion: 1, dropTier: 2,
    atk: 14, armorPen: 0.16, crit: 0.08, desc: '【雷法秘宝】蕴含一丝破甲雷纹的玉符：攻击 +14，穿甲 +16%，暴击 +8%。'
  },
  relic_bronze_mirror: {
    id: 'relic_bronze_mirror', name: '先秦青铜护心佩', slot: 'relic', genre: 'mythic',
    quality: 'fine', seal: '佩', visualTier: 2, visualColor: '#5fa88a', minRegion: 1, dropTier: 2,
    def: 12, maxHp: 60, dmgReduce: 0.10, desc: '【古墓遗珍】铭刻镇邪铭文的青铜圆镜：防御 +12，生命 +60，减伤 +10%。'
  },
  relic_zhurong_ember: {
    id: 'relic_zhurong_ember', name: '祝融火种炉', slot: 'relic', genre: 'mythic',
    quality: 'rare', seal: '火', visualTier: 3, visualColor: '#ff7034', minRegion: 2, dropTier: 3,
    atk: 20, maxHp: 75, proc: 'burn', skillBonus: 0.16, desc: '【赤焰秘宝】永不熄灭的兵工火种香炉：攻 +20，生命 +75，技能 +16%，攻击附灼烧。'
  },
  relic_fox_orb: {
    id: 'relic_fox_orb', name: '九尾灵珠', slot: 'relic', genre: 'mythic',
    quality: 'rare', seal: '珠', visualTier: 3, visualColor: '#f088c8', minRegion: 3, dropTier: 4,
    maxHp: 65, maxEnergy: 35, crit: 0.12, desc: '【妖怪秘宝】九尾辐射狐内丹：生命 +65，内息 +35，暴击 +12%。'
  },
  relic_qingqiu_jade: {
    id: 'relic_qingqiu_jade', name: '青丘灵狐佩', slot: 'relic', genre: 'mythic',
    quality: 'rare', seal: '狐', visualTier: 3, visualColor: '#ec4899', minRegion: 3, dropTier: 4,
    maxHp: 85, dodgeRate: 0.12, lifesteal: 0.08, captureBonus: 0.15, desc: '【青丘秘宝】灵狐化形留下的暖玉佩：生命 +85，闪避 +12%，吸血 +8%，收妖 +15%。'
  },
  relic_tiangong_soul: {
    id: 'relic_tiangong_soul', name: '天工镇魂印', slot: 'relic', genre: 'mythic',
    quality: 'rare', seal: '魂', visualTier: 4, visualColor: '#a87bc7', minRegion: 4, dropTier: 4,
    atk: 22, maxEnergy: 38, captureBonus: 0.25, mpRegen: 6, desc: '【墨壶至宝】专司镇压妖魂的青铜大印：攻 +22，内息 +38，回息 +6，收妖 +25%！'
  },
  relic_mozi_ruler: {
    id: 'relic_mozi_ruler', name: '墨子矩尺', slot: 'relic', genre: 'wuxia',
    quality: 'legend', seal: '矩', visualTier: 4, visualColor: '#f5b041', minRegion: 4, dropTier: 5,
    atk: 28, def: 18, crit: 0.18, skillBonus: 0.22, desc: '【墨家圣物】量天测地的先秦墨子金矩尺：攻 +28，防 +18，暴击 +18%，技能 +22%！'
  },
  relic_thunder_seal: {
    id: 'relic_thunder_seal', name: '雷公残印', slot: 'relic', genre: 'mythic',
    quality: 'legend', seal: '雷', visualTier: 4, visualColor: '#38bdf8', minRegion: 4, dropTier: 5,
    atk: 24, maxEnergy: 40, skillBonus: 0.25, desc: '【仙家秘宝】雷神残印：攻击 +24，内息 +40，所有奇术与雷击伤害 +25%！'
  },
  relic_tianshu: {
    id: 'relic_tianshu', name: '天枢护心镜', slot: 'relic', genre: 'mythic',
    quality: 'legend', seal: '镜', visualTier: 5, visualColor: '#c084fc', minRegion: 4, dropTier: 6,
    maxHp: 120, maxEnergy: 45, mpRegen: 8, immuneTide: true, desc: '【天枢秘宝】生命 +120，内息 +45，每回合回息 8 点，免疫辐射潮！'
  },
  relic_citadel_edict: {
    id: 'relic_citadel_edict', name: '白玉京执政令', slot: 'relic', genre: 'scifi',
    quality: 'legend', seal: '令', visualTier: 5, visualColor: '#f5d061', minRegion: 5, dropTier: 6,
    atk: 34, def: 22, maxHp: 140, magicFind: 0.35, goldFind: 0.40, desc: '【白玉京至宝】执政官全权量子玉令：攻 +34，防 +22，生命 +140，掉宝 +35%，金币 +40%！'
  },
  relic_quantum_core: {
    id: 'relic_quantum_core', name: '量子奇点核', slot: 'relic', genre: 'scifi',
    quality: 'legend', seal: '奇', visualTier: 5, visualColor: '#38e8ff', minRegion: 5, dropTier: 6,
    atk: 42, maxHp: 160, maxEnergy: 60, crit: 0.20, armorPen: 0.25, mpRegen: 10, desc: '【终极秘宝】悬浮于掌心的微型宇宙奇点：攻 +42，生命 +160，内息 +60，暴击 +20%，穿甲 +25%！'
  }
};

// ==================== 暗黑式随机词缀引擎（18 前缀 × 12 后缀 × 8 绝世特效） ====================
export const AFFIX_PREFIXES = [
  { id: 'pre_leech',  name: '吸血·', stat: { lifesteal: 0.12 },           desc: '攻击回复 12% 造成伤害的生命' },
  { id: 'pre_pierce', name: '穿甲·', stat: { armorPen: 0.20 },            desc: '无视目标 20% 防御' },
  { id: 'pre_crit',   name: '暴烈·', stat: { critRate: 0.12, crit: 0.12 }, desc: '暴击率 +12%' },
  { id: 'pre_swift',  name: '迅捷·', stat: { doubleHit: 0.16 },           desc: '普攻 16% 概率触发二连击' },
  { id: 'pre_shock',  name: '嗜雷·', stat: { shockOnHit: 0.22 },          desc: '攻击 22% 概率附加【感电】增伤' },
  { id: 'pre_burn',   name: '灼魂·', stat: { burnOnHit: 0.25 },           desc: '攻击 25% 概率附加【灼烧】' },
  { id: 'pre_poison', name: '淬毒·', stat: { poisonOnHit: 0.25 },         desc: '攻击 25% 概率附加【剧毒】' },
  { id: 'pre_hp',     name: '护心·', stat: { maxHpPct: 0.16 },            desc: '最大生命值 +16%' },
  { id: 'pre_qi',     name: '聚气·', stat: { mpRegen: 6 },                desc: '每回合额外回复 6 点内息' },
  { id: 'pre_mf',     name: '寻宝·', stat: { magicFind: 0.25 },           desc: '稀有与绝世装备掉率 +25%' },
  { id: 'pre_gold',   name: '贪婪·', stat: { goldFind: 0.30 },            desc: '战斗与搜刮废土币获取 +30%' },
  { id: 'pre_shield', name: '墨盾·', stat: { startShield: 45 },           desc: '进入战斗立即获得 45 点墨铁护盾' },
  { id: 'pre_wall',   name: '铁壁·', stat: { defPct: 0.18 },              desc: '总防御力 +18%' },
  { id: 'pre_sharp',  name: '锋锐·', stat: { atkPct: 0.15 },              desc: '总攻击力 +15%' },
  { id: 'pre_save',   name: '省气·', stat: { mpCostReduce: 0.18 },        desc: '所有技能内息消耗 -18%' },
  { id: 'pre_seal',   name: '镇妖·', stat: { captureBonus: 0.18 },        desc: '天工墨壶收妖成功率 +18%' },
  { id: 'pre_rad',    name: '抗辐·', stat: { radResist: 0.35 },           desc: '辐射与毒瘴伤害 -35%' },
  { id: 'pre_dodge',  name: '灵动·', stat: { dodgeRate: 0.12 },           desc: '战斗闪避率 +12%' }
];

export const AFFIX_SUFFIXES = [
  { id: 'suf_pojun',     name: '·破军', stat: { atk: 14 },                               desc: '攻击力 +14' },
  { id: 'suf_feigong',   name: '·非攻', stat: { def: 10, startShield: 35 },              desc: '防御 +10，开局护盾 +35' },
  { id: 'suf_tiangong',  name: '·天工', stat: { mpRegen: 5, mpCostReduce: 0.12 },        desc: '每回合回息 +5，技能耗蓝 -12%' },
  { id: 'suf_quantum',   name: '·量子', stat: { critRate: 0.10, crit: 0.10, armorPen: 0.15 }, desc: '暴击 +10%，无视 15% 防御' },
  { id: 'suf_jihun',     name: '·汲魂', stat: { lifesteal: 0.10 },                       desc: '攻击吸血 +10%' },
  { id: 'suf_zhanyao',   name: '·斩妖', stat: { bossDmgPct: 0.22 },                      desc: '对首领与精英伤害 +22%' },
  { id: 'suf_buqu',      name: '·不屈', stat: { cheatDeath: 1 },                         desc: '每场战斗可免疫 1 次致命伤害并保留 25% 生命' },
  { id: 'suf_lianzhu',   name: '·连珠', stat: { doubleHit: 0.14 },                       desc: '连击触发概率 +14%' },
  { id: 'suf_jingji',    name: '·荆棘', stat: { thorns: 0.20 },                          desc: '反弹所受近战伤害的 20%' },
  { id: 'suf_hongyun',   name: '·鸿运', stat: { magicFind: 0.20, goldFind: 0.25 },       desc: '掉宝率 +20%，废土币获取 +25%' },
  { id: 'suf_cangqiong', name: '·苍穹', stat: { maxHpPct: 0.14, atkPct: 0.12 },          desc: '最大生命 +14%，总攻击 +12%' },
  { id: 'suf_taixu',     name: '·太虚', stat: { bonusDmgPct: 0.18 },                     desc: '所有攻击额外附加 18% 太虚真伤' }
];

export const LEGEND_EFFECTS = [
  { id: 'leg_feigong_aegis',         name: '【绝世·非攻天盾】', stat: { startShield: 80, dmgReduce: 0.12 },    desc: '开战自动展开 80 点太虚墨盾，且常驻减伤 +12%。' },
  { id: 'leg_taixu_echo',            name: '【绝世·太虚回响】', stat: { doubleHit: 0.24, bonusDmgPct: 0.15 }, desc: '24% 概率触发太虚重影连斩，并附加 15% 真伤。' },
  { id: 'leg_quantum_collapse',      name: '【绝世·量子坍缩】', stat: { armorPen: 0.30, critRate: 0.14, crit: 0.14 }, desc: '暴击时引发量子坍缩，穿甲 +30%，暴击率 +14%。' },
  { id: 'leg_mo_crucible_resonance', name: '【绝世·墨壶共鸣】', stat: { captureBonus: 0.25, mpRegen: 8 },     desc: '与天工墨壶共鸣：收妖成功率 +25%，每回合回息 +8。' },
  { id: 'leg_zhurong_nova',          name: '【绝世·祝融星爆】', stat: { burnOnHit: 0.40, atkPct: 0.16 },      desc: '40% 概率引爆祝融星火灼烧敌阵，总攻击 +16%。' },
  { id: 'leg_baiyujing_grace',       name: '【绝世·白玉京庇佑】', stat: { maxHpPct: 0.20, radResist: 0.50 },  desc: '穹顶净土之力加身：最大生命 +20%，辐射抗性 +50%。' },
  { id: 'leg_thunder_judgment',      name: '【绝世·九霄雷裁】', stat: { shockOnHit: 0.35, bossDmgPct: 0.25 }, desc: '引九霄墨雷裁决强敌：35% 感电，对首领伤害 +25%。' },
  { id: 'leg_undying_ink',           name: '【绝世·玄墨不灭】', stat: { cheatDeath: 1, lifesteal: 0.12 },     desc: '濒死触发玄墨重生（1 次/战），并附带 12% 吸血。' }
];

export const AFFIXES = {
  prefixes: AFFIX_PREFIXES,
  suffixes: AFFIX_SUFFIXES,
  legendEffects: LEGEND_EFFECTS
};

// 生成带暗黑随机词缀的装备实例（良品 1 词缀，珍品 2 词缀，绝世 2 词缀 + 1 绝世特效）
export function rollEquipment(baseId, qualityOverride = null) {
  const base = EQUIPMENT[baseId];
  if (!base) return null;
  const quality = qualityOverride || base.quality || 'common';
  const inst = { ...base, uid: `${baseId}_${Date.now()}_${Math.floor(Math.random() * 9999)}`, quality, affixes: [] };
  const rollCount = quality === 'legend' || quality === 'rare' ? 2 : quality === 'fine' ? 1 : 0;
  if (rollCount >= 1) {
    const pre = AFFIX_PREFIXES[Math.floor(Math.random() * AFFIX_PREFIXES.length)];
    inst.affixes.push(pre);
    inst.name = `${pre.name}${inst.name}`;
    for (const [k, v] of Object.entries(pre.stat)) inst[k] = (inst[k] || 0) + v;
  }
  if (rollCount >= 2) {
    const suf = AFFIX_SUFFIXES[Math.floor(Math.random() * AFFIX_SUFFIXES.length)];
    inst.affixes.push(suf);
    inst.name = `${inst.name}${suf.name}`;
    for (const [k, v] of Object.entries(suf.stat)) inst[k] = (inst[k] || 0) + v;
  }
  if (quality === 'legend' && LEGEND_EFFECTS.length > 0) {
    const leg = LEGEND_EFFECTS[Math.floor(Math.random() * LEGEND_EFFECTS.length)];
    inst.legendEffect = leg;
    inst.affixes.push(leg);
    for (const [k, v] of Object.entries(leg.stat)) inst[k] = (inst[k] || 0) + v;
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
      { text: '请求高价收购（声望≥2享+15%溢价）', desc: '立即按当前市价溢价变卖背包物资' },
      { text: '打探江湖秘闻 · 推进主线', desc: '与老黄深谈停电之夜与墨壶往事（含抉择奖励）', action: 'story_branch' }
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
      { text: '讨一碗热茶（+25生命 +20内息）', desc: '老鬼看你顺眼，分你半壶热茶' },
      { text: '打探江湖秘闻 · 推进主线', desc: '听盲眼老鬼讲述墨甲残骸与防空洞秘辛（含抉择奖励）', action: 'story_branch' }
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
      { text: '买一杯烈酒壮胆（+35 内息）', desc: '提振内息再探地铁' },
      { text: '打探江湖秘闻 · 推进主线', desc: '与三娘对饮，套问废都黑市与阿哲密讯（含抉择奖励）', action: 'story_branch' }
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
      { text: '打听 B-04 冷却井与祝融七号', desc: '了解第三幕首领机制' },
      { text: '打探江湖秘闻 · 推进主线', desc: '请教兵工秘方与天工墨壶锻造真传（含抉择奖励）', action: 'story_branch' }
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
      { text: '分享食物与故事（-20饱食，+2声望）', desc: '大幅提升隐士好感' },
      { text: '打探江湖秘闻 · 推进主线', desc: '向药翁追问「天枢计划」与墨壶渊源（含抉择奖励）', action: 'story_branch' }
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
  },
  npc_archon: {
    id: 'npc_archon', name: '白玉京执政官·公输明', title: '天穹穹顶最高执政官',
    portrait: 'assets/portrait_yinshi.jpg',
    spriteType: 'scholar', robeColor: '#e2e8f0', accentColor: '#38e8ff',
    talk: '“三百年来，你是第一个手持先秦天工墨壶、自废土踏入白玉京的旅人。穹顶之上虽无辐射尘，却已被『太一』裁决矩阵锁死太久……”',
    options: [
      { text: '倾听白玉京与地表分离的真相', desc: '了解 21:47 大停电背后的天穹净土密史', action: 'story_branch' },
      { text: '请求穹顶医疗舱全面净化恢复', desc: '立即回复满生命与满内息', action: 'inn' },
      { text: '询问裁决主神·太一的弱点', desc: '获取终极首领战斗情报' }
    ]
  },
  npc_quantum_smith: {
    id: 'npc_quantum_smith', name: '天工量子军械师', title: '白玉京首席神兵锻造官',
    portrait: 'assets/portrait_laohuang.jpg',
    spriteType: 'smith', robeColor: '#1e3a5f', accentColor: '#f5d061',
    talk: '“先秦墨家机括与量子晶格本就是一体两面！把你在废土收集的妖魂与白玉灵芯交给我，为你铸出冠绝苍穹的太虚粒子神兵！”',
    options: [
      { text: '开启量子「天工墨壶」熔炉', desc: '使用墨壶炼化高阶神兵与护驾', action: 'crucible' },
      { text: '白玉京量子军械交易', desc: '买卖高阶符箓、补给与稀有物资', action: 'shop' },
      { text: '高阶量子拆解台', desc: '拆解量子晶格与战前核心获取暴击收益', action: 'disassemble' }
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
    bgAsset: 'bg_town.webp', bgTint: null,
    spawn: { x: 780, y: 615 },
    palette: { ground: '#c7b89c', road: '#a7967a', shadow: 'rgba(28,25,22,0.34)', accent: '#c89b3c', mist: 'rgba(232,222,200,0.12)' },
    weatherPool: [0],
    desc: '废土中仅存的新中式废土古城。老黄杂货铺、回春医馆与墨石武馆可直接步入内室，亦可于墨甲拆解坊、钱庄、悬赏榜整备后出城踏入荒原。',
    weight: new Array(38).fill(0),
    walkablePolys: [
      // 严格贴合新 bg_town.webp 龟裂柏油十字大道与中心广场（绝不可踩上任何建筑/屋檐/墙体）
      [[370, 395], [460, 355], [760, 485], [960, 485], [1160, 595], [1400, 740], [1340, 860], [1080, 720], [920, 680], [720, 710], [490, 830], [380, 740], [540, 620], [510, 540], [370, 455]]
    ],
    buildings: [
      {
        id: 'shop', name: '老黄杂货铺', sign: '杂货',
        x: 220, y: 450, w: 280, h: 170,
        doorX: 485, doorY: 605, plaqueX: 380, plaqueY: 520,
        action: 'enter_map', targetMap: 'interior_shop', targetSpawnX: 600, targetSpawnY: 565,
        style: 'timber_shop', desc: '步入杂货铺内室，与老黄交易物资或听取阿哲线索。'
      },
      {
        id: 'loan', name: '黑哥钱庄', sign: '钱庄',
        x: 390, y: 240, w: 260, h: 185,
        doorX: 550, doorY: 425, plaqueX: 530, plaqueY: 290,
        action: 'loan',
        style: 'pawnshop', desc: '周转废土币、偿还债务与筹措出征资金。'
      },
      {
        id: 'inn', name: '回春医馆', sign: '医馆',
        x: 660, y: 280, w: 260, h: 205,
        doorX: 790, doorY: 488, plaqueX: 790, plaqueY: 365,
        action: 'enter_map', targetMap: 'interior_inn', targetSpawnX: 600, targetSpawnY: 565,
        style: 'clinic', desc: '步入回春医馆内室歇脚疗伤，恢复生命、内息与饱食。'
      },
      {
        id: 'disassemble', name: '墨甲拆解坊', sign: '拆解',
        x: 920, y: 310, w: 260, h: 255,
        doorX: 1045, doorY: 575, plaqueX: 1045, plaqueY: 385,
        action: 'disassemble',
        style: 'forge', desc: '在墨甲机库拆解旧家电、主板与军工残骸，博取高额暴击收益。'
      },
      {
        id: 'dojo', name: '墨石武馆', sign: '武馆',
        x: 1180, y: 500, w: 260, h: 210,
        doorX: 1255, doorY: 690, plaqueX: 1290, plaqueY: 570,
        action: 'enter_map', targetMap: 'interior_dojo', targetSpawnX: 600, targetSpawnY: 565,
        style: 'dojo', desc: '步入墨石武馆演武堂，向教头研习古武修为与心法。'
      },
      {
        id: 'gate', name: '出城驿站', sign: '驿站',
        x: 1320, y: 710, w: 120, h: 110,
        doorX: 1345, doorY: 795, plaqueX: 1355, plaqueY: 745,
        action: 'worldmap',
        style: 'gatehouse', desc: '打开墨土五域舆图，解锁并传送至各大野外险境。'
      },
      {
        id: 'bounty', name: '镇口悬赏榜', sign: '悬赏',
        x: 410, y: 380, w: 40, h: 40,
        doorX: 430, doorY: 410, plaqueX: 430, plaqueY: 375,
        action: 'tasks',
        style: 'board', desc: '查看每日/周常悬赏、小队任务与墨土排行。'
      }
    ],
    obstacles: [],
    portals: [
      { id: 'town_to_wasteland', x: 465, y: 765, r: 42, to: 'wasteland', spawnX: 240, spawnY: 570, label: '出城大道 · 前往城郊废土' }
    ],
    npc: { id: 'laohuang', x: 560, y: 590, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 2. 室内：老黄杂货铺内室 ----------
  {
    id: 'interior_shop', index: 1, regionId: 'reg_town', sceneType: 'interior',
    name: '老黄杂货铺·内室', short: '杂货内室', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['town'],
    width: 1200, height: 700,
    bgAsset: 'bg_interior.webp', bgTint: null,
    spawn: { x: 600, y: 565 },
    palette: { ground: '#8c7256', road: '#6f5840', shadow: 'rgba(20,14,10,0.42)', accent: '#c89b3c', mist: 'rgba(232,210,170,0.08)' },
    weatherPool: [0],
    desc: '木柜林立、暖灯微晃的杂货铺内室。柜台后立着精明的商人老黄，角落放着一台战前留声机。',
    weight: new Array(38).fill(0),
    buildings: [],
    walkablePolys: [[[96, 290], [1104, 290], [1104, 665], [96, 665]]],
    obstacles: [
      { id: 'shop_counter', type: 'wood_counter', x: 312, y: 220, w: 576, h: 72, label: '杂货柜台' },
      { id: 'shop_shelf_l', type: 'crate_stack',  x: 108,  y: 340, w: 114,  h: 150, label: '货架' },
      { id: 'shop_shelf_r', type: 'crate_stack',  x: 978, y: 340, w: 114,  h: 150, label: '旧物柜' }
    ],
    portals: [
      { id: 'shop_exit', x: 600, y: 640, r: 44, to: 'town', spawnX: 545, spawnY: 605, label: '走出老黄杂货铺' }
    ],
    npc: { id: 'laohuang', x: 600, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 3. 室内：回春医馆内室 ----------
  {
    id: 'interior_inn', index: 2, regionId: 'reg_town', sceneType: 'interior',
    name: '回春医馆·内室', short: '医馆内室', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['town'],
    width: 1200, height: 700,
    bgAsset: 'bg_interior.webp', bgTint: 'rgba(140, 185, 145, 0.16)',
    spawn: { x: 600, y: 565 },
    palette: { ground: '#7f7864', road: '#635e4d', shadow: 'rgba(18,22,16,0.38)', accent: '#6fb98f', mist: 'rgba(180,220,185,0.10)' },
    weatherPool: [0],
    desc: '百草柜飘散着苦涩药香，药炉文火不熄。可向回春药童求医歇脚，迅速回复生命与内息。',
    weight: new Array(38).fill(0),
    buildings: [],
    walkablePolys: [[[96, 290], [1104, 290], [1104, 665], [96, 665]]],
    obstacles: [
      { id: 'inn_counter', type: 'wood_counter', x: 324, y: 220, w: 552, h: 72, label: '药房柜台' },
      { id: 'inn_bed_l',   type: 'crate_stack',  x: 114,  y: 350, w: 132, h: 145, label: '竹榻病床' },
      { id: 'inn_stove_r', type: 'stone_well',   x: 954, y: 365, w: 114,  h: 95,  label: '煎药丹炉' }
    ],
    portals: [
      { id: 'inn_exit', x: 600, y: 640, r: 44, to: 'town', spawnX: 790, spawnY: 520, label: '走出回春医馆' }
    ],
    npc: { id: 'yaotong', x: 600, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 4. 野外：城郊废土 ----------
  {
    id: 'wasteland', index: 3, regionId: 'reg_town', sceneType: 'wild',
    name: '城郊废土', short: '城郊废土', isSafe: false, unlockCost: 0,
    worldPos: { x: 26, y: 56 }, links: ['town', 'cave_bunker', 'ruins'],
    width: 3120, height: 1040,
    bgAsset: 'bg_wasteland.webp', bgTint: null,
    spawn: { x: 240, y: 570 },
    palette: { ground: '#7e6e58', road: '#5f5242', shadow: 'rgba(24,20,16,0.38)', accent: '#c89b3c', mist: 'rgba(204,184,150,0.14)' },
    weatherPool: [0, 3, 4],
    desc: '浓淡墨色笼罩的辽阔城郊荒原，东北深处塌坡隐藏着战前防空洞铁门，向东长途跋涉可抵铁锈废都。',
    weight: [28, 22, 18, 12, 6, 3, 1, 0, 0, 0, 0, 0, 0, 5, 4, 0, 0, 0, 0, 0, 6, 5, 3, 0, 1, 5, 2, 0, 0, 0, 3, 2, 1, 0, 0, 0, 0, 0],
    buildings: [],
    obstacles: [
      { id: 'wl_wreck_1', type: 'car_wreck', x: 720,  y: 430, w: 110, h: 35, label: '生锈卡车' },
      { id: 'wl_wall_1',  type: 'ruin_wall', x: 1360, y: 463, w: 100, h: 32, label: '残垣断壁' },
      { id: 'wl_rock_1',  type: 'boulder',   x: 1760, y: 647, w: 100, h: 35, label: '风化岩堆' },
      { id: 'wl_wall_2',  type: 'ruin_wall', x: 2340, y: 450, w: 100, h: 33, label: '塌陷砖墙' }
    ],
    portals: [
      { id: 'wl_to_town',   x: 135,  y: 570, r: 44, to: 'town',        spawnX: 525,  spawnY: 750,  label: '返回 墨石镇' },
      { id: 'wl_to_bunker', x: 2060, y: 403, r: 46, to: 'cave_bunker', spawnX: 338,  spawnY: 883, label: '潜入 城郊废弃防空洞' },
      { id: 'wl_to_ruins',  x: 2985, y: 570, r: 44, to: 'ruins',       spawnX: 240,  spawnY: 587,  label: '前往 铁锈废都街区' }
    ],
    npc: { id: 'laogui', x: 960, y: 493, facing: 'down' },
    enemySpawns: [
      { enemyId: 'rat', x: 640,  y: 607,  patrolR: 120, speed: 78 },
      { enemyId: 'rat', x: 1180, y: 467,  patrolR: 130, speed: 82 },
      { enemyId: 'dog', x: 1560, y: 573,  patrolR: 135, speed: 95 },
      { enemyId: 'rat', x: 1140, y: 673, patrolR: 125, speed: 80 },
      { enemyId: 'dog', x: 2040, y: 547,  patrolR: 135, speed: 94 },
      { enemyId: 'dog', x: 2240, y: 653,  patrolR: 130, speed: 96 },
      { enemyId: 'rat', x: 2680, y: 570,  patrolR: 120, speed: 86 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'wl_loot_1', x: 420,  y: 480,  r: 34, name: '路边废品堆',     type: 'scrap_pile', respawnSec: 18 },
      { id: 'wl_loot_2', x: 980,  y: 393,  r: 34, name: '破损报亭',       type: 'crate',      respawnSec: 20 },
      { id: 'wl_loot_3', x: 1220, y: 417,  r: 34, name: '旧车后备箱',     type: 'car_loot',   respawnSec: 22 },
      { id: 'wl_loot_4', x: 1060, y: 730, r: 34, name: '断桥钢索堆',     type: 'scrap_pile', respawnSec: 22 },
      { id: 'wl_loot_5', x: 520,  y: 650,  r: 34, name: '倾覆货柜',       type: 'crate',      respawnSec: 24 },
      { id: 'wl_loot_6', x: 1560, y: 657,  r: 34, name: '战前邮筒',       type: 'relic_spot', respawnSec: 26 },
      { id: 'wl_loot_7', x: 1880, y: 423,  r: 34, name: '东北边陲补给箱', type: 'crate',      respawnSec: 26 },
      { id: 'wl_loot_8', x: 2060, y: 730, r: 34, name: '荒原隐秘铁匣',   type: 'relic_spot', respawnSec: 28 },
      { id: 'wl_loot_9', x: 2580, y: 477,  r: 34, name: '东境哨卡弹药箱', type: 'tech_cache', respawnSec: 28 },
      { id: 'wl_cannon', x: 2580, y: 650,  r: 40, name: '废弃防空重炮',   type: 'abandoned_cannon', salvageElite: 'auto_turret', equipPool: ['wpn_flaregun', 'mech_steam_core'], respawnSec: 45 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 5. 洞窟：城郊废弃防空洞 ----------
  {
    id: 'cave_bunker', index: 4, regionId: 'reg_town', sceneType: 'cave',
    name: '城郊废弃防空洞', short: '防空洞', isSafe: false, unlockCost: 0,
    worldPos: { x: 26, y: 46 }, links: ['wasteland'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(40, 32, 24, 0.22)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#383028', road: '#2b241d', shadow: 'rgba(10,8,6,0.52)', accent: '#d49a3a', mist: 'rgba(90,78,62,0.16)' },
    weatherPool: [0],
    desc: '纵深幽长的战前人防掩体，东北深处盘踞着「墨尾巨鼠王」，藏有阿哲遗落的旧手表与高爆率宝箱。',
    weight: [14, 14, 16, 14, 10, 8, 4, 2, 0, 0, 0, 0, 0, 8, 6, 0, 0, 0, 0, 0, 6, 5, 5, 1, 2, 12, 4, 0, 0, 0, 5, 4, 3, 1, 0, 0, 0, 0],
    buildings: [],
    obstacles: [
      { id: 'cb_rock_1', type: 'boulder',     x: 581,  y: 634, w: 84, h: 55, label: '塌方石柱' },
      { id: 'cb_rock_2', type: 'boulder',     x: 1050, y: 840, w: 90, h: 57, label: '人防混凝土墩' },
      { id: 'cb_crate',  type: 'crate_stack', x: 1388, y: 304, w: 84, h: 55, label: '废弃弹药箱' }
    ],
    portals: [
      { id: 'bunker_exit', x: 234, y: 917, r: 44, to: 'wasteland', spawnX: 2060, spawnY: 443, label: '离开防空洞 · 返回城郊' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'rat', x: 619,  y: 823, patrolR: 110, speed: 82 },
      { enemyId: 'dog', x: 938, y: 703, patrolR: 120, speed: 92 },
      { enemyId: 'rat', x: 1200, y: 583, patrolR: 120, speed: 86 },
      { enemyId: 'dog', x: 1463, y: 446, patrolR: 115, speed: 94 }
    ],
    bossSpawn: { enemyId: 'boss_ratking', x: 1716, y: 360, patrolR: 70, speed: 62 },
    lootZones: [
      { id: 'cb_loot_1', x: 431,  y: 724,  r: 34, name: '掩体遗珍箱',   type: 'vault_box',  respawnSec: 30 },
      { id: 'cb_loot_2', x: 788,  y: 1007, r: 34, name: '应急补给柜',   type: 'crate',      respawnSec: 28 },
      { id: 'cb_loot_3', x: 1069, y: 441,  r: 34, name: '防空配电铁匣', type: 'tech_cache', respawnSec: 30 },
      { id: 'cb_loot_4', x: 1331, y: 733,  r: 34, name: '地下战备箱',   type: 'crate',      respawnSec: 30 },
      { id: 'cb_loot_5', x: 1584, y: 261,  r: 34, name: '鼠王藏宝窝',   type: 'relic_spot', respawnSec: 32 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 6. 野外：铁锈废都街区 ----------
  {
    id: 'ruins', index: 5, regionId: 'reg_ruins', sceneType: 'wild',
    name: '铁锈废都街区', short: '铁锈废都', isSafe: false, unlockCost: 1200,
    worldPos: { x: 38, y: 36 }, links: ['wasteland', 'interior_tavern', 'cave_metro', 'arsenal', 'town'],
    width: 3120, height: 1040,
    bgAsset: 'bg_ruins.webp', bgTint: null,
    spawn: { x: 240, y: 587 },
    palette: { ground: '#4a525c', road: '#343a42', shadow: 'rgba(15,18,24,0.44)', accent: '#8ca0b5', mist: 'rgba(130,148,168,0.16)' },
    weatherPool: [0, 2, 4],
    desc: '坍塌商街与铁爪帮关卡纵横交错，西侧设有可步入的黑市酒馆，东北深处通向地铁二号线幽暗隧道。',
    weight: [6, 8, 10, 12, 14, 14, 8, 6, 4, 4, 0, 0, 12, 4, 6, 12, 10, 0, 4, 0, 4, 4, 4, 2, 3, 1, 6, 5, 2, 0, 2, 2, 3, 3, 2, 2, 2, 1],
    buildings: [
      {
        id: 'tavern', name: '废都黑市酒馆', sign: '酒馆',
        x: 590, y: 333, w: 220, h: 80, roofH: 45,
        doorX: 700, doorY: 433, action: 'enter_map', targetMap: 'interior_tavern', targetSpawnX: 600, targetSpawnY: 565,
        style: 'timber_shop', desc: '步入废都黑市酒馆，采购烟雾弹与打探地铁密道。'
      }
    ],
    obstacles: [
      { id: 'ru_barricade', type: 'barricade',  x: 840,  y: 693, w: 110, h: 35, label: '铁爪帮路障' },
      { id: 'ru_girder',    type: 'steel_beam', x: 1420, y: 487,  w: 100, h: 33, label: '锈蚀钢架' },
      { id: 'ru_pillar',    type: 'ruin_wall',  x: 1860, y: 493,  w: 100, h: 33, label: '高架桥墩' },
      { id: 'ru_crane',     type: 'steel_beam', x: 2260, y: 687, w: 110, h: 35, label: '倒塌广告牌' }
    ],
    portals: [
      { id: 'ruins_to_wl',      x: 135,  y: 587,  r: 44, to: 'wasteland',  spawnX: 2860, spawnY: 570,  label: '返回 城郊废土' },
      { id: 'ruins_to_metro',   x: 2460, y: 443,  r: 46, to: 'cave_metro', spawnX: 338,  spawnY: 883, label: '潜入 地铁二号线隧道' },
      { id: 'ruins_to_crypt',   x: 1980, y: 760, r: 44, to: 'cave_crypt', spawnX: 338,  spawnY: 883, label: '探入 旧城古墓密室（妖灵）' },
      { id: 'ruins_to_arsenal', x: 2985, y: 587,  r: 44, to: 'arsenal',    spawnX: 240,  spawnY: 587,  label: '前往 赤焰兵工废墟' },
      { id: 'ruins_to_town',    x: 1060, y: 757, r: 42, to: 'town',       spawnX: 780,  spawnY: 615,  label: '驿站捷径 · 返回墨石镇' }
    ],
    npc: { id: 'shaobing', x: 960, y: 507, facing: 'left' },
    enemySpawns: [
      { enemyId: 'dog',           x: 680,  y: 587,  patrolR: 120, speed: 96 },
      { enemyId: 'raider',        x: 1240, y: 640,  patrolR: 130, speed: 92 },
      { enemyId: 'raider_shield', x: 1660, y: 573,  patrolR: 125, speed: 84 },
      { enemyId: 'auto_turret',   x: 2140, y: 587,  patrolR: 65,  speed: 44 },
      { enemyId: 'raider',        x: 1420, y: 693, patrolR: 125, speed: 92 },
      { enemyId: 'raider_shield', x: 2520, y: 547,  patrolR: 125, speed: 86 },
      { enemyId: 'auto_turret',   x: 2740, y: 640,  patrolR: 65,  speed: 44 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'ru_loot_1',  x: 420,  y: 460,  r: 34, name: '地铁口闸机',   type: 'tech_cache', respawnSec: 20 },
      { id: 'ru_loot_2',  x: 1040, y: 443,  r: 34, name: '破损ATM机',    type: 'vault_box',  respawnSec: 24 },
      { id: 'ru_loot_3',  x: 1560, y: 503,  r: 34, name: '钟表行橱窗',   type: 'relic_spot', respawnSec: 24 },
      { id: 'ru_loot_4',  x: 2040, y: 450,  r: 34, name: '铁爪帮赃箱',   type: 'crate',      respawnSec: 25 },
      { id: 'ru_loot_5',  x: 460,  y: 703, r: 34, name: '废弃配电室',   type: 'tech_cache', respawnSec: 22 },
      { id: 'ru_loot_6',  x: 1320, y: 757, r: 34, name: '地下通道铁箱', type: 'crate',      respawnSec: 25 },
      { id: 'ru_loot_8',  x: 1740, y: 740, r: 34, name: '旧商街金库箱', type: 'vault_box',  respawnSec: 28 },
      { id: 'ru_loot_9',  x: 2820, y: 483,  r: 34, name: '东街岗亭密匣', type: 'relic_spot', respawnSec: 28 },
      { id: 'ru_loot_10', x: 2820, y: 687, r: 34, name: '战前通讯机柜', type: 'tech_cache', respawnSec: 28 },
      { id: 'ru_loot_7',  x: 2560, y: 713, r: 40, name: '废弃反装甲炮', type: 'abandoned_cannon', salvageElite: 'auto_turret', equipPool: ['wpn_shotgun', 'wpn_sniper', 'mech_steam_core'], respawnSec: 45 }
    ],
    hasWarn: true, hasTide: false, hasChem: false
  },

  // ---------- 7. 室内：废都黑市酒馆 ----------
  {
    id: 'interior_tavern', index: 6, regionId: 'reg_ruins', sceneType: 'interior',
    name: '废都黑市酒馆', short: '黑市酒馆', isSafe: true, unlockCost: 0,
    worldPos: { x: 38, y: 36 }, links: ['ruins'],
    width: 1200, height: 700,
    bgAsset: 'bg_interior.webp', bgTint: 'rgba(55, 38, 32, 0.34)',
    spawn: { x: 600, y: 565 },
    palette: { ground: '#594238', road: '#423028', shadow: 'rgba(14,10,8,0.48)', accent: '#d49a3a', mist: 'rgba(160,120,95,0.12)' },
    weatherPool: [0],
    desc: '烟雾缭绕的拾荒客酒馆，酒保三娘暗中收购古董与腕表，也知晓地铁二号线的秘密。',
    weight: new Array(38).fill(0),
    buildings: [],
    walkablePolys: [[[96, 290], [1104, 290], [1104, 665], [96, 665]]],
    obstacles: [
      { id: 'tav_bar',   type: 'wood_counter', x: 300, y: 215, w: 600, h: 72, label: '黑市吧台' },
      { id: 'tav_tbl_l', type: 'crate_stack',  x: 156, y: 390, w: 126, h: 95, label: '酒客方桌' },
      { id: 'tav_tbl_r', type: 'crate_stack',  x: 918, y: 390, w: 126, h: 95, label: '赌局木桌' }
    ],
    portals: [
      { id: 'tavern_exit', x: 600, y: 640, r: 44, to: 'ruins', spawnX: 700, spawnY: 463, label: '走出黑市酒馆' }
    ],
    npc: { id: 'jiubao', x: 600, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 8. 洞窟：地铁二号线幽暗隧道 ----------
  {
    id: 'cave_metro', index: 7, regionId: 'reg_ruins', sceneType: 'cave',
    name: '地铁二号线幽暗隧道', short: '地铁隧道', isSafe: false, unlockCost: 0,
    worldPos: { x: 38, y: 26 }, links: ['ruins'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(26, 38, 52, 0.36)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#242e38', road: '#1a222a', shadow: 'rgba(8,12,18,0.56)', accent: '#6da5c0', mist: 'rgba(90,125,155,0.16)' },
    weatherPool: [0],
    desc: '铁轨歪斜、应急灯闪烁的纵深地下月台，阿哲曾在此宿营。东北尽头由铁爪帮二当家「断钢」把守。',
    weight: [4, 6, 8, 10, 12, 14, 8, 6, 4, 4, 0, 0, 16, 0, 4, 8, 6, 0, 4, 0, 4, 4, 5, 2, 4, 0, 6, 12, 4, 0, 2, 3, 4, 4, 2, 2, 2, 2],
    buildings: [],
    obstacles: [
      { id: 'cm_train_1', type: 'car_wreck', x: 581,  y: 634, w: 90, h: 55, label: '脱轨地铁车厢' },
      { id: 'cm_pillar',  type: 'ruin_wall', x: 1050, y: 840, w: 90, h: 57, label: '塌陷月台柱' },
      { id: 'cm_barric',  type: 'barricade', x: 1388, y: 304, w: 84, h: 55, label: '铁爪帮沙袋' }
    ],
    portals: [
      { id: 'metro_exit', x: 234, y: 917, r: 44, to: 'ruins', spawnX: 2460, spawnY: 483, label: '爬出地铁口 · 返回废都' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'mutant',        x: 619,  y: 823, patrolR: 110, speed: 88 },
      { enemyId: 'raider',        x: 938, y: 703, patrolR: 120, speed: 94 },
      { enemyId: 'raider_shield', x: 1200, y: 583, patrolR: 120, speed: 86 },
      { enemyId: 'raider',        x: 1463, y: 446, patrolR: 115, speed: 94 }
    ],
    bossSpawn: { enemyId: 'boss_duangang', x: 1716, y: 360, patrolR: 70, speed: 68 },
    lootZones: [
      { id: 'cm_loot_1', x: 431,  y: 724,  r: 34, name: '售票机残骸',   type: 'tech_cache', respawnSec: 26 },
      { id: 'cm_loot_2', x: 788,  y: 1007, r: 34, name: '阿哲篝火营地', type: 'relic_spot', respawnSec: 30 },
      { id: 'cm_loot_3', x: 1069, y: 441,  r: 34, name: '铁爪帮军资箱', type: 'vault_box',  respawnSec: 30 },
      { id: 'cm_loot_4', x: 1331, y: 733,  r: 34, name: '变电站工具柜', type: 'tech_cache', respawnSec: 30 },
      { id: 'cm_loot_5', x: 1584, y: 261,  r: 34, name: '月台藏赃密匣', type: 'vault_box',  respawnSec: 32 }
    ],
    hasWarn: true, hasTide: false, hasChem: false
  },

  // ---------- 9. 野外：赤焰兵工废墟 ----------
  {
    id: 'arsenal', index: 8, regionId: 'reg_arsenal', sceneType: 'wild',
    name: '赤焰兵工废墟', short: '赤焰兵工', isSafe: false, unlockCost: 2400,
    worldPos: { x: 56, y: 66 }, links: ['ruins', 'interior_armory', 'cave_b04', 'swamp', 'town'],
    width: 3120, height: 1040,
    bgAsset: 'bg_ruins.webp', bgTint: 'rgba(128, 42, 22, 0.28)',
    spawn: { x: 240, y: 587 },
    palette: { ground: '#593b32', road: '#3e2922', shadow: 'rgba(24,10,8,0.46)', accent: '#e07a42', mist: 'rgba(205,105,65,0.16)' },
    weatherPool: [3, 4, 2],
    desc: '余烬未熄的庞大战前重工业兵工厂，失控警卫机与赤焰焊工机巡弋其间。中北侧军械库可步入借炉炼化，东南通往 B-04 冷却井。',
    weight: [3, 4, 6, 10, 12, 14, 10, 10, 8, 8, 3, 1, 0, 4, 4, 2, 2, 0, 16, 0, 3, 3, 4, 4, 3, 0, 1, 3, 5, 1, 1, 2, 2, 2, 3, 2, 2, 2],
    buildings: [
      {
        id: 'armory', name: '战前军械库', sign: '军械',
        x: 2260, y: 333, w: 220, h: 80, roofH: 45,
        doorX: 2370, doorY: 433, action: 'enter_map', targetMap: 'interior_armory', targetSpawnX: 600, targetSpawnY: 565,
        style: 'forge', desc: '步入军械库内室，找军工老铁匠开启天工墨壶高阶炼化。'
      }
    ],
    obstacles: [
      { id: 'ar_tank_1',   type: 'barricade',  x: 840,  y: 693, w: 110, h: 35, label: '报废装甲车' },
      { id: 'ar_girder_1', type: 'steel_beam', x: 1420, y: 487,  w: 100, h: 33, label: '焦黑龙门架' },
      { id: 'ar_pipe_1',   type: 'steel_beam', x: 1860, y: 493,  w: 100, h: 33, label: '蒸汽管道群' },
      { id: 'ar_wall_se',  type: 'ruin_wall',  x: 2260, y: 687, w: 110, h: 35, label: '弹药库断墙' }
    ],
    portals: [
      { id: 'ar_to_ruins',  x: 135,  y: 587,  r: 44, to: 'ruins',       spawnX: 2860, spawnY: 587,  label: '返回 铁锈废都街区' },
      { id: 'ar_to_hangar', x: 2680, y: 460,  r: 46, to: 'cave_hangar', spawnX: 338,  spawnY: 883, label: '潜入 战前战隼机库（机甲/军火）' },
      { id: 'ar_to_b04',    x: 1980, y: 760, r: 46, to: 'cave_b04',    spawnX: 338,  spawnY: 883, label: '潜入 B-04 地下冷却井' },
      { id: 'ar_to_swamp',  x: 2985, y: 587,  r: 44, to: 'swamp',       spawnX: 240,  spawnY: 603,  label: '前往 青瘴辐射沼泽' },
      { id: 'ar_to_town',   x: 1060, y: 757, r: 42, to: 'town',        spawnX: 780,  spawnY: 615,  label: '驿站捷径 · 返回墨石镇' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'raider_shield', x: 680,  y: 587,  patrolR: 120, speed: 86 },
      { enemyId: 'auto_turret',   x: 1240, y: 640,  patrolR: 65,  speed: 44 },
      { enemyId: 'flame_mech',    x: 1660, y: 573,  patrolR: 125, speed: 96 },
      { enemyId: 'heavy_mech',    x: 2140, y: 587,  patrolR: 125, speed: 84 },
      { enemyId: 'flame_mech',    x: 1420, y: 693, patrolR: 125, speed: 94 },
      { enemyId: 'auto_turret',   x: 2520, y: 547,  patrolR: 65,  speed: 44 },
      { enemyId: 'heavy_mech',    x: 2740, y: 640,  patrolR: 120, speed: 86 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'ar_loot_1',  x: 420,  y: 460,  r: 34, name: '军工伺服机箱',     type: 'tech_cache', respawnSec: 22 },
      { id: 'ar_loot_2',  x: 1040, y: 443,  r: 34, name: '蓄电池组',         type: 'tech_cache', respawnSec: 24 },
      { id: 'ar_loot_3',  x: 1560, y: 503,  r: 34, name: '兵工质检柜',       type: 'vault_box',  respawnSec: 25 },
      { id: 'ar_loot_4',  x: 2040, y: 450,  r: 34, name: '狙击镜片箱',       type: 'relic_spot', respawnSec: 26 },
      { id: 'ar_loot_5',  x: 460,  y: 703, r: 40, name: '坠毁重装机甲残骸', type: 'mech_wreck', salvageElite: 'heavy_mech', equipPool: ['mech_crimson_frame', 'wpn_pulsesword', 'armor_exo'], respawnSec: 50 },
      { id: 'ar_loot_6',  x: 1320, y: 757, r: 34, name: '冷却阀工具箱',     type: 'crate',      respawnSec: 24 },
      { id: 'ar_loot_7',  x: 2560, y: 713, r: 34, name: '战前黑匣残片',     type: 'vault_box',  respawnSec: 28 },
      { id: 'ar_loot_8',  x: 1740, y: 740, r: 34, name: '热熔炉备件箱',     type: 'tech_cache', respawnSec: 28 },
      { id: 'ar_loot_9',  x: 2820, y: 483,  r: 34, name: '东厂军械箱',       type: 'vault_box',  respawnSec: 28 },
      { id: 'ar_loot_10', x: 2820, y: 687, r: 34, name: '特种合金原料箱',   type: 'crate',      respawnSec: 26 }
    ],
    hasWarn: true, hasTide: false, hasChem: true
  },

  // ---------- 10. 室内：战前军械库内室 ----------
  {
    id: 'interior_armory', index: 9, regionId: 'reg_arsenal', sceneType: 'interior',
    name: '战前军械库·内室', short: '军械库', isSafe: true, unlockCost: 0,
    worldPos: { x: 56, y: 66 }, links: ['arsenal'],
    width: 1200, height: 700,
    bgAsset: 'bg_interior.webp', bgTint: 'rgba(90, 34, 24, 0.28)',
    spawn: { x: 600, y: 565 },
    palette: { ground: '#5c3c32', road: '#442c24', shadow: 'rgba(18,8,6,0.48)', accent: '#e86a33', mist: 'rgba(200,90,50,0.12)' },
    weatherPool: [0],
    desc: '炉火通红的地下军械库，老铁匠守着最后一座战前锻造台，助少侠以天工墨壶铸造神兵。',
    weight: new Array(38).fill(0),
    buildings: [],
    walkablePolys: [[[96, 290], [1104, 290], [1104, 665], [96, 665]]],
    obstacles: [
      { id: 'arm_anvil',  type: 'wood_counter', x: 312, y: 215, w: 576, h: 72, label: '军工锻造台' },
      { id: 'arm_rack_l', type: 'crate_stack',  x: 120, y: 360, w: 120, h: 145, label: '兵器架' },
      { id: 'arm_rack_r', type: 'crate_stack',  x: 960, y: 360, w: 120, h: 145, label: '钢材堆' }
    ],
    portals: [
      { id: 'armory_exit', x: 600, y: 640, r: 44, to: 'arsenal', spawnX: 2370, spawnY: 463, label: '走出战前军械库' }
    ],
    npc: { id: 'tiejiang', x: 600, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 11. 洞窟：B-04 地下冷却井 ----------
  {
    id: 'cave_b04', index: 10, regionId: 'reg_arsenal', sceneType: 'cave',
    name: 'B-04 地下冷却井', short: 'B-04冷却井', isSafe: false, unlockCost: 0,
    worldPos: { x: 56, y: 76 }, links: ['arsenal'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(110, 36, 20, 0.34)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#3e231c', road: '#2d1812', shadow: 'rgba(16,6,4,0.56)', accent: '#ff7034', mist: 'rgba(220,90,45,0.18)' },
    weatherPool: [3],
    desc: '炽热蒸汽弥漫的纵深地下排污与冷却通道，重型机甲「祝融七号」镇守在东北深处 B-04 闸门之前。',
    weight: [2, 2, 4, 8, 10, 14, 12, 12, 10, 8, 6, 2, 0, 0, 0, 0, 0, 0, 18, 2, 2, 2, 5, 5, 3, 0, 0, 2, 12, 2, 1, 2, 2, 2, 3, 3, 3, 2],
    buildings: [],
    obstacles: [
      { id: 'b04_pipe_1', type: 'steel_beam', x: 581,  y: 634, w: 90, h: 55, label: '高压冷却管' },
      { id: 'b04_core_1', type: 'boulder',    x: 1050, y: 840, w: 90, h: 57, label: '熔渣冷凝堆' },
      { id: 'b04_wall_1', type: 'ruin_wall',  x: 1388, y: 304, w: 84, h: 55, label: '隔热防爆墙' }
    ],
    portals: [
      { id: 'b04_exit', x: 234, y: 917, r: 44, to: 'arsenal', spawnX: 1980, spawnY: 720, label: '返回 赤焰兵工废墟' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'drone',      x: 619,  y: 823, patrolR: 110, speed: 102 },
      { enemyId: 'flame_mech', x: 938, y: 703, patrolR: 120, speed: 96 },
      { enemyId: 'heavy_mech', x: 1200, y: 583, patrolR: 120, speed: 86 },
      { enemyId: 'flame_mech', x: 1463, y: 446, patrolR: 115, speed: 96 }
    ],
    bossSpawn: { enemyId: 'boss_zhurong', x: 1716, y: 360, patrolR: 70, speed: 66 },
    lootZones: [
      { id: 'b04_loot_1', x: 431,  y: 724,  r: 34, name: '应急冷却箱',     type: 'tech_cache', respawnSec: 28 },
      { id: 'b04_loot_2', x: 788,  y: 1007, r: 34, name: '战前军工密箱',   type: 'vault_box',  respawnSec: 30 },
      { id: 'b04_loot_3', x: 1069, y: 441,  r: 34, name: '高温电容柜',     type: 'tech_cache', respawnSec: 30 },
      { id: 'b04_loot_4', x: 1331, y: 733,  r: 34, name: '熔炉检修箱',     type: 'crate',      respawnSec: 30 },
      { id: 'b04_loot_5', x: 1584, y: 261,  r: 34, name: 'B-04 闸门日志',  type: 'relic_spot', respawnSec: 32 }
    ],
    hasWarn: false, hasTide: false, hasChem: true
  },

  // ---------- 12. 野外：青瘴辐射沼泽 ----------
  {
    id: 'swamp', index: 11, regionId: 'reg_swamp', sceneType: 'wild',
    name: '青瘴辐射沼泽', short: '青瘴毒泽', isSafe: false, unlockCost: 3800,
    worldPos: { x: 74, y: 38 }, links: ['arsenal', 'interior_hermit', 'cave_mire', 'vault', 'town'],
    width: 3120, height: 1040,
    bgAsset: 'bg_swamp.webp', bgTint: null,
    spawn: { x: 240, y: 603 },
    palette: { ground: '#2d3f35', road: '#4a4236', shadow: 'rgba(12,24,18,0.48)', accent: '#5fb381', mist: 'rgba(95,179,129,0.18)' },
    weatherPool: [1, 2, 0],
    desc: '青绿毒瘴翻涌的广袤禁区，每60秒爆发辐射潮。中东岸亮着温暖灯火的隐士草庐可步入，东北深沼藏有沉没菌窟。',
    weight: [2, 2, 4, 6, 6, 8, 8, 6, 6, 6, 10, 4, 0, 0, 0, 0, 0, 16, 2, 0, 2, 3, 4, 6, 3, 0, 0, 2, 4, 6, 2, 2, 2, 2, 3, 3, 3, 2],
    buildings: [
      {
        id: 'hermit_hut', name: '隐士草庐', sign: '草庐',
        x: 2180, y: 333, w: 220, h: 80, roofH: 45,
        doorX: 2290, doorY: 433, action: 'enter_map', targetMap: 'interior_hermit', targetSpawnX: 600, targetSpawnY: 565,
        style: 'clinic', desc: '步入东岸隐士草庐，寻找正在调试无线电台的阿哲！'
      }
    ],
    obstacles: [
      { id: 'sw_pool_1',    type: 'toxic_pool', x: 560,  y: 497,  w: 110, h: 37, label: '辐射泥潭' },
      { id: 'sw_cypress_1', type: 'dead_tree',  x: 1280, y: 493,  w: 76,  h: 37, label: '枯死沼柏' },
      { id: 'sw_pool_3',    type: 'toxic_pool', x: 1020, y: 703, w: 115, h: 37, label: '发光毒沼' },
      { id: 'sw_cypress_2', type: 'dead_tree',  x: 1760, y: 687, w: 80,  h: 37, label: '盘根枯木' }
    ],
    portals: [
      { id: 'swamp_to_ar',    x: 135,  y: 603,  r: 44, to: 'arsenal',         spawnX: 2860, spawnY: 587,  label: '返回 赤焰兵工废墟' },
      { id: 'swamp_to_mire',  x: 2660, y: 473,  r: 46, to: 'cave_mire',       spawnX: 338,  spawnY: 883, label: '潜入 毒泽沉没菌窟' },
      { id: 'swamp_to_fox',   x: 2260, y: 760, r: 46, to: 'cave_fox_shrine', spawnX: 338,  spawnY: 883, label: '步入 青瘴狐仙秘境（九尾狐）' },
      { id: 'swamp_to_vault', x: 2985, y: 603,  r: 44, to: 'vault',           spawnX: 240,  spawnY: 587,  label: '前往 07号避难所主控区' },
      { id: 'swamp_to_town',  x: 820,  y: 763, r: 42, to: 'town',            spawnX: 780,  spawnY: 615,  label: '渡口捷径 · 返回墨石镇' }
    ],
    npc: { id: 'yinshi', x: 1080, y: 520, facing: 'down' },
    enemySpawns: [
      { enemyId: 'mutant',    x: 680,  y: 613,  patrolR: 120, speed: 88 },
      { enemyId: 'slime',     x: 1340, y: 653,  patrolR: 125, speed: 82 },
      { enemyId: 'mire_wisp', x: 1760, y: 560,  patrolR: 125, speed: 94 },
      { enemyId: 'slime',     x: 2220, y: 613,  patrolR: 125, speed: 86 },
      { enemyId: 'mutant',    x: 1560, y: 680, patrolR: 125, speed: 88 },
      { enemyId: 'mire_wisp', x: 2520, y: 573,  patrolR: 125, speed: 94 },
      { enemyId: 'slime',     x: 2740, y: 653,  patrolR: 120, speed: 86 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'sw_loot_1',  x: 420,  y: 477,  r: 34, name: '荧光菌丛',     type: 'mushroom',   respawnSec: 20 },
      { id: 'sw_loot_2',  x: 840,  y: 433,  r: 34, name: '搁浅补给筏',   type: 'crate',      respawnSec: 24 },
      { id: 'sw_loot_3',  x: 1460, y: 493,  r: 34, name: '隐士药篓',     type: 'relic_spot', respawnSec: 24 },
      { id: 'sw_loot_4',  x: 1960, y: 460,  r: 34, name: '辐射稳定罐',   type: 'tech_cache', respawnSec: 26 },
      { id: 'sw_loot_5',  x: 460,  y: 727, r: 34, name: '幽绿菌床',     type: 'mushroom',   respawnSec: 22 },
      { id: 'sw_loot_6',  x: 1220, y: 757, r: 34, name: '沉没医疗箱',   type: 'crate',      respawnSec: 25 },
      { id: 'sw_loot_7',  x: 2560, y: 730, r: 34, name: '东岸无线电箱', type: 'relic_spot', respawnSec: 28 },
      { id: 'sw_loot_8',  x: 1880, y: 753, r: 34, name: '毒泽沉木密匣', type: 'vault_box',  respawnSec: 28 },
      { id: 'sw_loot_9',  x: 2820, y: 497,  r: 34, name: '枯木灵芝丛',   type: 'mushroom',   respawnSec: 26 },
      { id: 'sw_loot_10', x: 2820, y: 703, r: 34, name: '避难所前哨箱', type: 'tech_cache', respawnSec: 28 }
    ],
    hasWarn: false, hasTide: true, hasChem: false
  },

  // ---------- 13. 室内：隐士草庐内室 ----------
  {
    id: 'interior_hermit', index: 12, regionId: 'reg_swamp', sceneType: 'interior',
    name: '隐士草庐·内室', short: '隐士草庐', isSafe: true, unlockCost: 0,
    worldPos: { x: 74, y: 38 }, links: ['swamp'],
    width: 1200, height: 700,
    bgAsset: 'bg_interior.webp', bgTint: 'rgba(28, 74, 52, 0.28)',
    spawn: { x: 600, y: 565 },
    palette: { ground: '#425246', road: '#303d33', shadow: 'rgba(10,20,14,0.44)', accent: '#6fb98f', mist: 'rgba(120,195,155,0.12)' },
    weatherPool: [0],
    desc: '竹帘药架间摆着一台发出沙沙电流声的短波电台，失散多年的挚友阿哲正静坐灯下。',
    weight: new Array(38).fill(0),
    buildings: [],
    walkablePolys: [[[96, 290], [1104, 290], [1104, 665], [96, 665]]],
    obstacles: [
      { id: 'hm_table',  type: 'wood_counter', x: 324, y: 215, w: 552, h: 72, label: '无线电药案' },
      { id: 'hm_herb_l', type: 'crate_stack',  x: 126, y: 360, w: 120, h: 145, label: '晾药竹架' },
      { id: 'hm_herb_r', type: 'crate_stack',  x: 954, y: 360, w: 120, h: 145, label: '旧书木柜' }
    ],
    portals: [
      { id: 'hermit_exit', x: 600, y: 640, r: 44, to: 'swamp', spawnX: 2290, spawnY: 463, label: '走出隐士草庐' }
    ],
    npc: { id: 'azhe', x: 600, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 14. 洞窟：毒泽沉没菌窟 ----------
  {
    id: 'cave_mire', index: 13, regionId: 'reg_swamp', sceneType: 'cave',
    name: '毒泽沉没菌窟', short: '沉没菌窟', isSafe: false, unlockCost: 0,
    worldPos: { x: 74, y: 28 }, links: ['swamp'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(22, 78, 48, 0.42)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#1a3629', road: '#13281e', shadow: 'rgba(6,18,12,0.58)', accent: '#62e698', mist: 'rgba(85,205,135,0.20)' },
    weatherPool: [1],
    desc: '发光巨型菌盖倒垂的纵深地下溶洞，东北深处盘踞着「千年墨瘴母体」，唯有击溃它方能采得「净瘴青莲」。',
    weight: [1, 1, 2, 4, 6, 8, 8, 8, 8, 6, 12, 6, 0, 0, 0, 0, 0, 22, 2, 2, 2, 2, 5, 8, 3, 0, 0, 0, 4, 12, 2, 2, 3, 3, 4, 4, 3, 3],
    buildings: [],
    obstacles: [
      { id: 'mr_pool_1', type: 'toxic_pool', x: 581,  y: 634, w: 90, h: 55, label: '幽绿菌池' },
      { id: 'mr_root_1', type: 'dead_tree',  x: 1050, y: 840, w: 90, h: 57, label: '巨型毒藤根' },
      { id: 'mr_rock_1', type: 'boulder',    x: 1388, y: 304, w: 84, h: 55, label: '荧光钟乳石' }
    ],
    portals: [
      { id: 'mire_exit', x: 234, y: 917, r: 44, to: 'swamp', spawnX: 2660, spawnY: 513, label: '离开沉没菌窟 · 返回毒泽' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'slime',     x: 619,  y: 823, patrolR: 110, speed: 86 },
      { enemyId: 'mire_wisp', x: 938, y: 703, patrolR: 120, speed: 94 },
      { enemyId: 'mutant',    x: 1200, y: 583, patrolR: 120, speed: 88 },
      { enemyId: 'mire_wisp', x: 1463, y: 446, patrolR: 115, speed: 94 }
    ],
    bossSpawn: { enemyId: 'boss_lotus_bane', x: 1716, y: 360, patrolR: 70, speed: 64 },
    lootZones: [
      { id: 'mr_loot_1', x: 431,  y: 724,  r: 34, name: '千年荧光菌簇', type: 'mushroom',   respawnSec: 26 },
      { id: 'mr_loot_2', x: 788,  y: 1007, r: 34, name: '青莲祭坛遗珍', type: 'relic_spot', respawnSec: 32 },
      { id: 'mr_loot_3', x: 1069, y: 441,  r: 34, name: '战前科考箱',   type: 'vault_box',  respawnSec: 30 },
      { id: 'mr_loot_4', x: 1331, y: 733,  r: 34, name: '幽潭菌孢匣',   type: 'mushroom',   respawnSec: 28 },
      { id: 'mr_loot_5', x: 1584, y: 261,  r: 34, name: '母体巢穴密宝', type: 'vault_box',  respawnSec: 32 }
    ],
    hasWarn: false, hasTide: true, hasChem: false
  },

  // ---------- 15. 野外：07号避难所主控区 ----------
  {
    id: 'vault', index: 14, regionId: 'reg_vault', sceneType: 'wild',
    name: '07号避难所主控区', short: '07避难所', isSafe: false, unlockCost: 6800,
    worldPos: { x: 88, y: 68 }, links: ['swamp', 'cave_tianshu', 'town'],
    width: 3120, height: 1040,
    bgAsset: 'bg_ruins.webp', bgTint: 'rgba(28, 16, 54, 0.52)',
    spawn: { x: 240, y: 587 },
    palette: { ground: '#251e34', road: '#342a48', shadow: 'rgba(10,6,20,0.54)', accent: '#9d7cd8', mist: 'rgba(157,124,216,0.16)' },
    weatherPool: [1, 2],
    desc: '深埋地底的宏大战前终极穹顶，林博士驻守于西中段通道。东境尽头直通最终地宫「天枢地脉密窟」。',
    weight: [1, 1, 2, 4, 6, 8, 10, 8, 10, 8, 12, 10, 0, 0, 0, 0, 0, 0, 6, 14, 2, 2, 4, 6, 3, 0, 0, 1, 2, 5, 1, 2, 2, 2, 3, 4, 4, 5],
    buildings: [],
    obstacles: [
      { id: 'vt_bulkhead_2', type: 'vault_pillar', x: 840,  y: 693, w: 110, h: 35, label: '防爆舱壁' },
      { id: 'vt_server_1',   type: 'server_rack',  x: 1420, y: 487,  w: 100, h: 33, label: '记忆矩阵机柜' },
      { id: 'vt_reactor',    type: 'reactor_core', x: 1860, y: 580,  w: 110, h: 53, label: '主反应堆核心' },
      { id: 'vt_gate_core',  type: 'vault_pillar', x: 2260, y: 687, w: 110, h: 35, label: '主控密库门' }
    ],
    portals: [
      { id: 'vault_to_swamp',   x: 135,  y: 587,  r: 44, to: 'swamp',              spawnX: 2860, spawnY: 603,  label: '返回 青瘴辐射沼泽' },
      { id: 'vault_to_thunder', x: 2460, y: 443,  r: 46, to: 'cave_thunder_altar', spawnX: 338,  spawnY: 883, label: '踏入 天枢雷公古坛（雷神/罗刹）' },
      { id: 'vault_to_tianshu', x: 2985, y: 587,  r: 46, to: 'cave_tianshu',       spawnX: 338,  spawnY: 883, label: '步入 天枢地脉密窟（终局）' },
      { id: 'vault_to_town',    x: 1060, y: 757, r: 42, to: 'town',               spawnX: 780,  spawnY: 615,  label: '应急电梯 · 返回墨石镇' }
    ],
    npc: { id: 'xuezhe', x: 960, y: 507, facing: 'down' },
    enemySpawns: [
      { enemyId: 'drone', x: 680,  y: 587,  patrolR: 120, speed: 102 },
      { enemyId: 'guard', x: 1240, y: 640,  patrolR: 130, speed: 90 },
      { enemyId: 'drone', x: 1660, y: 573,  patrolR: 125, speed: 104 },
      { enemyId: 'guard', x: 2140, y: 587,  patrolR: 125, speed: 92 },
      { enemyId: 'drone', x: 1420, y: 693, patrolR: 125, speed: 102 },
      { enemyId: 'guard', x: 2520, y: 547,  patrolR: 125, speed: 92 },
      { enemyId: 'drone', x: 2740, y: 640,  patrolR: 120, speed: 104 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'vt_loot_1',  x: 420,  y: 460,  r: 34, name: '安保器材柜',       type: 'tech_cache', respawnSec: 24 },
      { id: 'vt_loot_2',  x: 1040, y: 443,  r: 34, name: '加密数据终端',     type: 'vault_box',  respawnSec: 26 },
      { id: 'vt_loot_3',  x: 1560, y: 503,  r: 34, name: '黑匣子保管箱',     type: 'vault_box',  respawnSec: 28 },
      { id: 'vt_loot_4',  x: 2040, y: 450,  r: 34, name: '07号芯片矩阵',     type: 'vault_box',  respawnSec: 30 },
      { id: 'vt_loot_5',  x: 460,  y: 703, r: 34, name: '战前医疗舱',       type: 'crate',      respawnSec: 24 },
      { id: 'vt_loot_6',  x: 1320, y: 757, r: 34, name: '典藏古物柜',       type: 'relic_spot', respawnSec: 28 },
      { id: 'vt_loot_8',  x: 1740, y: 740, r: 34, name: '休眠舱遗留箱',     type: 'vault_box',  respawnSec: 30 },
      { id: 'vt_loot_9',  x: 2820, y: 483,  r: 34, name: '东翼量子终端',     type: 'tech_cache', respawnSec: 30 },
      { id: 'vt_loot_10', x: 2820, y: 687, r: 34, name: '先秦密档保险匣',   type: 'relic_spot', respawnSec: 32 },
      { id: 'vt_loot_7',  x: 2560, y: 713, r: 40, name: '天枢自律重炮残骸', type: 'mech_wreck', salvageElite: 'heavy_mech', equipPool: ['mech_tianshu_exo', 'wpn_xuanyuan', 'relic_tianshu'], respawnSec: 55 }
    ],
    hasWarn: true, hasTide: true, hasChem: true
  },

  // ---------- 16. 终局地宫：天枢地脉密窟 ----------
  {
    id: 'cave_tianshu', index: 15, regionId: 'reg_vault', sceneType: 'cave',
    name: '天枢地脉密窟', short: '天枢密窟', isSafe: false, unlockCost: 0,
    worldPos: { x: 92, y: 74 }, links: ['vault', 'sky_citadel'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(42, 18, 74, 0.48)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#211536', road: '#170e26', shadow: 'rgba(8,4,16,0.62)', accent: '#c084fc', mist: 'rgba(170,120,245,0.20)' },
    weatherPool: [1],
    desc: '先秦墨家青铜巨柱与战前量子奇点融为一体的宏伟终极圣殿。深入东北殿堂击败「天枢主脑·玄墨大帝」后，更可乘量子天梯直抵「天穹白玉京」！',
    weight: [0, 0, 0, 2, 4, 6, 10, 10, 12, 10, 16, 14, 0, 0, 0, 0, 0, 0, 8, 18, 2, 2, 6, 8, 4, 0, 0, 0, 0, 4, 2, 2, 3, 3, 4, 5, 5, 6],
    buildings: [],
    obstacles: [
      { id: 'ts_pillar_1', type: 'vault_pillar', x: 619,  y: 630,  w: 75, h: 58, label: '墨家青铜巨柱' },
      { id: 'ts_pillar_2', type: 'vault_pillar', x: 713,  y: 926, w: 75, h: 58, label: '墨家青铜巨柱' },
      { id: 'ts_pillar_3', type: 'vault_pillar', x: 1256, y: 356,  w: 75, h: 58, label: '天枢量子柱' },
      { id: 'ts_pillar_4', type: 'vault_pillar', x: 1369, y: 621,  w: 75, h: 58, label: '天枢量子柱' }
    ],
    portals: [
      { id: 'tianshu_exit', x: 234, y: 917, r: 44, to: 'vault', spawnX: 2860, spawnY: 587, label: '撤出天枢密窟 · 返回07号避难所' },
      { id: 'tianshu_to_citadel', x: 1790, y: 318, r: 46, to: 'sky_citadel', spawnX: 260, spawnY: 620, label: '乘量子天梯 · 升往天穹白玉京' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'guard', x: 900,  y: 737, patrolR: 115, speed: 92 },
      { enemyId: 'drone', x: 1181, y: 566, patrolR: 120, speed: 104 },
      { enemyId: 'guard', x: 1463, y: 446, patrolR: 115, speed: 94 }
    ],
    bossSpawn: { enemyId: 'boss_tianshu', x: 1716, y: 360, patrolR: 70, speed: 68 },
    lootZones: [
      { id: 'ts_loot_1', x: 431,  y: 724,  r: 34, name: '先秦墨家古匣',   type: 'relic_spot', respawnSec: 32 },
      { id: 'ts_loot_2', x: 788,  y: 1007, r: 34, name: '天枢核心晶片箱', type: 'vault_box',  respawnSec: 32 },
      { id: 'ts_loot_3', x: 1069, y: 441,  r: 34, name: '旧世典藏密匣',   type: 'relic_spot', respawnSec: 34 },
      { id: 'ts_loot_4', x: 1331, y: 733,  r: 34, name: '量子奇点秘柜',   type: 'vault_box',  respawnSec: 34 },
      { id: 'ts_loot_5', x: 1584, y: 261,  r: 34, name: '玄墨殿堂宝匣',   type: 'relic_spot', respawnSec: 36 }
    ],
    hasWarn: true, hasTide: true, hasChem: false
  },

  // ---------- 17. 室内：墨石武馆（古武门派演武堂） ----------
  {
    id: 'interior_dojo', index: 16, regionId: 'reg_town', sceneType: 'interior',
    name: '墨石武馆·演武堂', short: '墨石武馆', isSafe: true, unlockCost: 0,
    worldPos: { x: 16, y: 56 }, links: ['town'],
    width: 1200, height: 700,
    bgAsset: 'bg_interior.webp', bgTint: 'rgba(130, 96, 48, 0.18)',
    spawn: { x: 600, y: 565 },
    palette: { ground: '#826b4e', road: '#66523b', shadow: 'rgba(20,14,8,0.42)', accent: '#d49a3a', mist: 'rgba(235,205,155,0.10)' },
    weatherPool: [0],
    desc: '青城旧脉在墨石镇设立的古武演武堂，兵器架寒光凛凛，教头传授古武剑诀与调息心法。',
    weight: new Array(38).fill(0),
    buildings: [],
    walkablePolys: [[[96, 290], [1104, 290], [1104, 665], [96, 665]]],
    obstacles: [
      { id: 'dj_altar',  type: 'wood_counter', x: 336, y: 215, w: 528, h: 70, label: '武馆讲武台' },
      { id: 'dj_rack_l', type: 'crate_stack',  x: 126, y: 360, w: 120, h: 140, label: '刀剑兵器架' },
      { id: 'dj_rack_r', type: 'crate_stack',  x: 954, y: 360, w: 120, h: 140, label: '练功木人桩' }
    ],
    portals: [
      { id: 'dojo_exit', x: 600, y: 640, r: 44, to: 'town', spawnX: 1190, spawnY: 695, label: '走出墨石武馆' }
    ],
    npc: { id: 'jiaotou', x: 600, y: 325, facing: 'down' },
    enemySpawns: [], bossSpawn: null, lootZones: [],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 18. 洞窟：旧城古墓密室（青铜剑灵 / 画皮 / 千年尸王） ----------
  {
    id: 'cave_crypt', index: 17, regionId: 'reg_ruins', sceneType: 'cave',
    name: '旧城古墓密室', short: '古墓密室', isSafe: false, unlockCost: 0,
    worldPos: { x: 38, y: 44 }, links: ['ruins'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(24, 58, 62, 0.38)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#223438', road: '#192629', shadow: 'rgba(6,16,18,0.58)', accent: '#7ce8c4', mist: 'rgba(95,185,175,0.18)' },
    weatherPool: [2],
    desc: '旧城地基下坍塌露出的纵深先秦古墓！游荡着青铜剑灵、画皮幽影与千年尸王，盛产古董与古武神兵。',
    weight: [0, 0, 2, 4, 4, 4, 2, 2, 2, 4, 2, 2, 10, 4, 2, 4, 8, 4, 0, 0, 3, 3, 6, 3, 4, 0, 2, 4, 2, 0, 8, 8, 8, 6, 5, 5, 4, 4],
    buildings: [],
    obstacles: [
      { id: 'cr_tomb_1', type: 'boulder',   x: 581,  y: 634, w: 84, h: 55, label: '青铜石棺' },
      { id: 'cr_tomb_2', type: 'ruin_wall', x: 1050, y: 840, w: 90, h: 57, label: '古墓镇魂碑' }
    ],
    portals: [
      { id: 'crypt_exit', x: 234, y: 917, r: 44, to: 'ruins', spawnX: 1980, spawnY: 720, label: '离开古墓 · 返回铁锈废都' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'bronze_spirit',   x: 619,  y: 823, patrolR: 110, speed: 92 },
      { enemyId: 'painted_phantom', x: 938, y: 703, patrolR: 120, speed: 98 },
      { enemyId: 'bronze_spirit',   x: 1200, y: 583, patrolR: 120, speed: 94 },
      { enemyId: 'painted_phantom', x: 1463, y: 446, patrolR: 115, speed: 98 },
      { enemyId: 'corpse_king',     x: 1716, y: 360, patrolR: 90,  speed: 84 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'cr_loot_1', x: 431,  y: 724,  r: 34, name: '先秦陪葬青铜匣', type: 'relic_spot', respawnSec: 28 },
      { id: 'cr_loot_2', x: 788,  y: 1007, r: 34, name: '古剑石台',       type: 'relic_spot', equipPool: ['wpn_qingcheng', 'wpn_inkblade'], respawnSec: 36 },
      { id: 'cr_loot_3', x: 1069, y: 441,  r: 34, name: '青铜礼器柜',     type: 'relic_spot', respawnSec: 32 },
      { id: 'cr_loot_4', x: 1331, y: 733,  r: 34, name: '墓道陪葬密箱',   type: 'vault_box',  respawnSec: 34 },
      { id: 'cr_loot_5', x: 1584, y: 261,  r: 34, name: '尸王玄棺密宝',   type: 'vault_box',  respawnSec: 34 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
  },

  // ---------- 19. 洞窟：战前战隼机库（重炮 / 机甲 / 机械饕餮） ----------
  {
    id: 'cave_hangar', index: 18, regionId: 'reg_arsenal', sceneType: 'cave',
    name: '战前战隼机库', short: '战隼机库', isSafe: false, unlockCost: 0,
    worldPos: { x: 56, y: 58 }, links: ['arsenal'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(78, 32, 28, 0.36)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#382a2a', road: '#291e1e', shadow: 'rgba(14,8,8,0.56)', accent: '#fb923c', mist: 'rgba(210,120,75,0.16)' },
    weatherPool: [3],
    desc: '深埋兵工厂东北侧的庞大秘密航空与机甲机库，停放着报废武装战隼与失控机械饕餮，可拆出加特林与浮游炮！',
    weight: [0, 0, 2, 6, 8, 12, 14, 14, 14, 12, 8, 6, 0, 6, 6, 0, 0, 0, 20, 6, 2, 2, 4, 4, 4, 0, 0, 0, 4, 0, 1, 1, 2, 2, 2, 2, 3, 3],
    buildings: [],
    obstacles: [
      { id: 'hg_jet_1',   type: 'steel_beam', x: 581,  y: 634, w: 90, h: 55, label: '报废战隼机身' },
      { id: 'hg_crane_1', type: 'ruin_wall',  x: 1050, y: 840, w: 90, h: 57, label: '机甲整备龙门' }
    ],
    portals: [
      { id: 'hangar_exit', x: 234, y: 917, r: 44, to: 'arsenal', spawnX: 2680, spawnY: 500, label: '离开机库 · 返回赤焰兵工' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'auto_turret', x: 619,  y: 823, patrolR: 65,  speed: 44 },
      { enemyId: 'heavy_mech',  x: 938, y: 703, patrolR: 120, speed: 86 },
      { enemyId: 'flame_mech',  x: 1200, y: 583, patrolR: 120, speed: 94 },
      { enemyId: 'heavy_mech',  x: 1463, y: 446, patrolR: 115, speed: 86 },
      { enemyId: 'mech_taotie', x: 1716, y: 360, patrolR: 90,  speed: 90 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'hg_loot_1', x: 431,  y: 724,  r: 40, name: '机库重炮武器架',   type: 'abandoned_cannon', salvageElite: 'auto_turret', equipPool: ['wpn_gatling', 'wpn_artillery', 'wpn_plasma_rifle'], respawnSec: 45 },
      { id: 'hg_loot_2', x: 788,  y: 1007, r: 40, name: '墨甲浮游炮实验台', type: 'mech_wreck', salvageElite: 'mech_taotie', equipPool: ['mech_bit_array', 'mech_crimson_frame'], respawnSec: 50 },
      { id: 'hg_loot_3', x: 1069, y: 441,  r: 34, name: '战隼航电核心',     type: 'tech_cache', respawnSec: 28 },
      { id: 'hg_loot_4', x: 1331, y: 733,  r: 34, name: '整备间军械箱',     type: 'vault_box',  respawnSec: 32 },
      { id: 'hg_loot_5', x: 1584, y: 261,  r: 34, name: '饕餮机甲核心柜',   type: 'tech_cache', respawnSec: 34 }
    ],
    hasWarn: true, hasTide: false, hasChem: true
  },

  // ---------- 20. 洞窟：青瘴狐仙秘境（九尾辐射狐 / 妖灵秘宝） ----------
  {
    id: 'cave_fox_shrine', index: 19, regionId: 'reg_swamp', sceneType: 'cave',
    name: '青瘴狐仙秘境', short: '狐仙秘境', isSafe: false, unlockCost: 0,
    worldPos: { x: 74, y: 48 }, links: ['swamp'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(66, 28, 72, 0.36)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#2e1e36', road: '#221528', shadow: 'rgba(14,6,18,0.56)', accent: '#f088c8', mist: 'rgba(220,120,195,0.20)' },
    weatherPool: [1],
    desc: '毒泽南岸雾霭掩映的纵深狐仙洞天，九尾辐射狐与画皮幽影盘踞东北深处，藏有九尾灵珠与稀世丹药。',
    weight: [0, 0, 0, 2, 4, 4, 4, 4, 4, 6, 12, 6, 0, 0, 0, 0, 6, 24, 0, 2, 2, 2, 6, 8, 4, 0, 0, 0, 2, 8, 4, 4, 4, 4, 6, 6, 5, 5],
    buildings: [],
    obstacles: [
      { id: 'fx_shrine_1', type: 'dead_tree',  x: 581,  y: 634, w: 84, h: 55, label: '千年妖藤古木' },
      { id: 'fx_pool_1',   type: 'toxic_pool', x: 1050, y: 840, w: 90, h: 57, label: '幻雾灵泉' }
    ],
    portals: [
      { id: 'fox_exit', x: 234, y: 917, r: 44, to: 'swamp', spawnX: 2260, spawnY: 720, label: '离开狐仙秘境 · 返回毒泽' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'painted_phantom', x: 619,  y: 823, patrolR: 110, speed: 96 },
      { enemyId: 'mire_wisp',       x: 938, y: 703, patrolR: 120, speed: 94 },
      { enemyId: 'painted_phantom', x: 1200, y: 583, patrolR: 120, speed: 96 },
      { enemyId: 'mire_wisp',       x: 1463, y: 446, patrolR: 115, speed: 94 },
      { enemyId: 'fox_nine',        x: 1716, y: 360, patrolR: 90,  speed: 100 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'fx_loot_1', x: 431,  y: 724,  r: 34, name: '幻光荧光菌床', type: 'mushroom',   respawnSec: 24 },
      { id: 'fx_loot_2', x: 788,  y: 1007, r: 34, name: '灵泉丹鼎',     type: 'vault_box',  respawnSec: 32 },
      { id: 'fx_loot_3', x: 1069, y: 441,  r: 34, name: '狐仙供奉玉匣', type: 'relic_spot', equipPool: ['relic_fox_orb', 'wpn_qingcheng'], respawnSec: 38 },
      { id: 'fx_loot_4', x: 1331, y: 733,  r: 34, name: '妖藤灵药箱',   type: 'mushroom',   respawnSec: 28 },
      { id: 'fx_loot_5', x: 1584, y: 261,  r: 34, name: '九尾秘藏玉盒', type: 'relic_spot', respawnSec: 36 }
    ],
    hasWarn: false, hasTide: true, hasChem: false
  },

  // ---------- 21. 洞窟：天枢雷公古坛（赛博罗刹 / 雷公残灵 / 机械饕餮） ----------
  {
    id: 'cave_thunder_altar', index: 20, regionId: 'reg_vault', sceneType: 'cave',
    name: '天枢雷公古坛', short: '雷公古坛', isSafe: false, unlockCost: 0,
    worldPos: { x: 88, y: 58 }, links: ['vault'],
    width: 2100, height: 1200,
    bgAsset: 'bg_cave.webp', bgTint: 'rgba(22, 42, 86, 0.44)',
    spawn: { x: 338, y: 883 },
    palette: { ground: '#1a243d', road: '#12192b', shadow: 'rgba(6,10,22,0.60)', accent: '#38bdf8', mist: 'rgba(85,180,245,0.20)' },
    weatherPool: [1, 2],
    desc: '07 号避难所东北深处融合先秦雷坛与量子磁场的广袤禁地！赛博罗刹与雷公残灵镇守终极电磁炮与雷公残印！',
    weight: [0, 0, 0, 0, 2, 4, 8, 8, 10, 10, 16, 14, 0, 0, 0, 0, 0, 0, 10, 20, 2, 2, 6, 8, 4, 0, 0, 0, 0, 2, 2, 2, 3, 3, 4, 5, 5, 6],
    buildings: [],
    obstacles: [
      { id: 'th_coil_1', type: 'vault_pillar', x: 581,  y: 634, w: 84, h: 55, label: '墨雷特斯拉柱' },
      { id: 'th_coil_2', type: 'vault_pillar', x: 1050, y: 840, w: 90, h: 57, label: '墨雷特斯拉柱' }
    ],
    portals: [
      { id: 'thunder_exit', x: 234, y: 917, r: 44, to: 'vault', spawnX: 2460, spawnY: 483, label: '离开雷公古坛 · 返回07号避难所' }
    ],
    npc: null,
    enemySpawns: [
      { enemyId: 'cyber_rakshasa',  x: 619,  y: 823, patrolR: 110, speed: 104 },
      { enemyId: 'mech_taotie',     x: 938, y: 703, patrolR: 120, speed: 92 },
      { enemyId: 'guard',           x: 1200, y: 583, patrolR: 120, speed: 92 },
      { enemyId: 'cyber_rakshasa',  x: 1463, y: 446, patrolR: 115, speed: 104 },
      { enemyId: 'thunder_remnant', x: 1716, y: 360, patrolR: 90,  speed: 98 }
    ],
    bossSpawn: null,
    lootZones: [
      { id: 'th_loot_1', x: 431,  y: 724,  r: 40, name: '轨道电磁炮实验架', type: 'mech_wreck', salvageElite: 'cyber_rakshasa', equipPool: ['wpn_railgun', 'mech_tianshu_exo'], respawnSec: 52 },
      { id: 'th_loot_2', x: 788,  y: 1007, r: 34, name: '雷公神龛玉匣',     type: 'relic_spot', equipPool: ['relic_thunder_seal', 'wpn_pulsesword'], respawnSec: 45 },
      { id: 'th_loot_3', x: 1069, y: 441,  r: 34, name: '高压电弧电容箱',   type: 'tech_cache', respawnSec: 34 },
      { id: 'th_loot_4', x: 1331, y: 733,  r: 34, name: '雷坛祭器密匣',     type: 'relic_spot', respawnSec: 36 },
      { id: 'th_loot_5', x: 1584, y: 261,  r: 34, name: '天枢量子秘库',     type: 'vault_box',  respawnSec: 36 }
    ],
    hasWarn: true, hasTide: true, hasChem: false
  },

  // ---------- 22. 终局浮空科幻净土：天穹白玉京 · 穹顶净土 ----------
  {
    id: 'sky_citadel', index: 21, regionId: 'reg_citadel', region: 5, sceneType: 'wild', theme: 'citadel',
    name: '天穹白玉京 · 穹顶净土', short: '天穹白玉京', isSafe: false, unlockCost: 12000,
    worldPos: { x: 86, y: 24 }, links: ['cave_tianshu', 'vault'],
    width: 3120, height: 1040,
    bgAsset: 'bg_sky_citadel.webp', bgTint: null,
    spawn: { x: 260, y: 620 },
    palette: { ground: '#dce8f2', road: '#c2d8ea', shadow: 'rgba(14,32,58,0.38)', accent: '#38e8ff', mist: 'rgba(180,235,255,0.18)' },
    weatherPool: [0],
    desc: '高悬于云海之上的完好旧世科幻都会！汉白玉浮空大道与霓虹云雷光柱交相辉映，公输明执政官与天工量子军械师驻守西廊，东境裁决殿深处镇守着终极主神「太一」！',
    weight: [0, 0, 0, 0, 0, 2, 4, 4, 6, 6, 10, 12, 0, 0, 0, 0, 0, 0, 6, 14, 0, 0, 2, 4, 2, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 4, 5, 5, 6, 4, 5, 4, 4, 14, 14, 6, 10, 12, 6, 10, 12, 12, 10, 8, 10, 10, 6, 8, 8],
    walkablePolys: [
      [[120, 420], [3000, 420], [3000, 820], [120, 820]]
    ],
    buildings: [],
    obstacles: [
      { id: 'sc_pillar_1', type: 'vault_pillar', x: 860,  y: 455, w: 92, h: 48, label: '白玉量子光柱' },
      { id: 'sc_pillar_2', type: 'vault_pillar', x: 1480, y: 725, w: 96, h: 48, label: '云雷全息纪念碑' },
      { id: 'sc_pillar_3', type: 'reactor_core', x: 2040, y: 460, w: 104, h: 52, label: '太虚能源中继塔' },
      { id: 'sc_pillar_4', type: 'vault_pillar', x: 2420, y: 720, w: 96, h: 48, label: '裁决殿汉白玉柱' }
    ],
    portals: [
      { id: 'citadel_to_tianshu', x: 180, y: 580, r: 46, to: 'cave_tianshu', spawnX: 1620, spawnY: 360, label: '量子降维梯 · 返回天枢地脉密窟' },
      { id: 'citadel_to_vault',   x: 180, y: 740, r: 44, to: 'vault',        spawnX: 2860, spawnY: 587, label: '天穹传送阵 · 返回07号避难所' }
    ],
    npc: { id: 'npc_archon', x: 560, y: 520, facing: 'down' },
    npcs: [
      { id: 'npc_archon',        x: 560,  y: 520, facing: 'down' },
      { id: 'npc_quantum_smith', x: 1080, y: 520, facing: 'down' }
    ],
    enemySpawns: [
      { enemyId: 'citadel_enforcer', x: 1320, y: 600, patrolR: 110, speed: 98 },
      { enemyId: 'quantum_sentinel', x: 1660, y: 560, patrolR: 115, speed: 108 },
      { enemyId: 'citadel_enforcer', x: 1880, y: 670, patrolR: 110, speed: 98 },
      { enemyId: 'jade_arbiter',     x: 2240, y: 610, patrolR: 105, speed: 92 },
      { enemyId: 'quantum_sentinel', x: 2460, y: 540, patrolR: 100, speed: 108 }
    ],
    bossSpawn: { enemyId: 'boss_archon_mech', x: 2790, y: 620, patrolR: 75, speed: 80 },
    lootZones: [
      { id: 'sc_loot_1', x: 740,  y: 740, r: 36, name: '白玉京军械补给柜', type: 'vault_box', equipPool: ['wpn_quantum_arc', 'armor_quantum_jade', 'mech_taixu_swordbox'], respawnSec: 40 },
      { id: 'sc_loot_2', x: 1420, y: 475, r: 36, name: '太虚量子晶格库',   type: 'vault_box', equipPool: ['wpn_citadel_gauss', 'armor_archon_mantle', 'relic_citadel_edict'], respawnSec: 44 },
      { id: 'sc_loot_3', x: 2120, y: 745, r: 36, name: '穹顶执政官密匣',   type: 'vault_box', equipPool: ['wpn_tianshu_scepter', 'mech_quantum_singularity', 'relic_quantum_core'], respawnSec: 48 },
      { id: 'sc_loot_4', x: 2660, y: 480, r: 38, name: '太一圣殿绝世宝库', type: 'vault_box', equipPool: ['wpn_baiyujing_taixu', 'armor_sky_taixu_plate', 'wpn_taotie_greataxe'], respawnSec: 55 }
    ],
    hasWarn: false, hasTide: false, hasChem: false
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

// ==================== v26 轩辕剑 × 古龙武侠 · 多幕剧情演出库（21 段） ====================
export const STORY_CUTSCENES = {
  // ---------- 一、六大域首次踏足剧情 ----------
  entry_town: {
    id: 'entry_town',
    title: '墨石残门 · 停摆的 21:47',
    triggerMap: 'town',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '风穿过墨石镇的断牌楼，带着焦炭与旧铁的味道。二十年了，这座镇子还像一截没烧尽的香，在废土里倔强地冒着烟。'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '怀里那块停在「21:47」的旧手表忽然轻轻震了一下。表盖冰凉，贴着胸口的天工墨壶却泛起一丝温热。'
      },
      {
        speaker: '商人老黄', role: '墨石镇杂货东家', portrait: 'laohuang',
        text: '“站在风口发什么呆？手里揣着青铜古壶，脸上写着寻人二字——全镇只有我老黄敢接你这号客人的生意。先进杂货铺喝口粗茶，阿哲的事，我昨夜刚听见半句风声。”'
      }
    ],
    choices: [
      {
        text: '按住墨壶凝神调息，先探听镇中传闻',
        reply: '你默运内息稳住墨壶微鸣，将镇口商旅的只言片语记在心底。此行注定不平，但你已做好拔剑的准备。（+80 废土币，+1 声望）',
        reward: { gold: 80, reputation: 1, clue: '【秘闻】墨石镇东门外便是城郊废土，老黄杂货铺内室藏有第一幕主线线索。' }
      },
      {
        text: '轻抚旧表立誓，备齐干粮即刻寻人',
        reply: '表针停在 21:47，但活人不能停在过去。你收紧行囊，额外备下一份行军丹药。（+1 墨土行军丹，+20 内息）',
        reward: { elixir: 'elixir_ration', energy: 20, clue: '【配方线索】天工墨壶中，压缩干粮与纯净水可炼成「墨土行军丹」。' }
      }
    ]
  },

  entry_wasteland: {
    id: 'entry_wasteland',
    title: '城郊风沙 · 断甲遗电',
    triggerMap: 'wasteland',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '踏出东门，黄沙骤起。半截巨型战前墨甲斜插在沙丘里，断口处至今仍有幽蓝电弧噼啪作响，像一头死而不僵的钢铁巨兽。'
      },
      {
        speaker: '盲眼老鬼', role: '城郊向导', portrait: 'yinshi',
        text: '“嗒、嗒、嗒……年轻人，你腰间那只铜壶的声音，比风沙还要响。”'
      },
      {
        speaker: '盲眼老鬼', role: '城郊向导', portrait: 'yinshi',
        text: '“北边塌坡下是旧世防空洞，昨夜洞里传出兽嚎与电台杂音。墨尾巨鼠王叼走了不知谁落下的铜表链——你要找的人，多半曾在那儿留过脚印。”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“只要还有半寸脚印，我就走下去。”'
      }
    ],
    choices: [
      {
        text: '拱手敬茶，请老鬼指点荒原藏宝暗格',
        reply: '老鬼咧嘴一笑，竹杖在沙地划出三道暗记：“北坡防空洞与东郊废炮旁皆有战前暗匣，莫要空手而归！”（+1 声望，+1 墨土行军丹）',
        reward: { reputation: 1, elixir: 'elixir_ration', clue: '【藏宝秘闻】城郊废土深处的废弃防空重炮拆解必得高品质词缀装备！' }
      },
      {
        text: '俯身勘察墨甲残骸，记下先秦墨阵纹路',
        reply: '你在漏电的甲缝间刮下几片稀有铜屑，顺带悟出几分机甲核心的构造。（+120 废土币，+35 经验）',
        reward: { gold: 120, exp: 35, clue: '【墨壶秘闻】压低荒原妖兽血量至 45% 以下即可用天工墨壶收妖炼化护驾！' }
      }
    ]
  },

  entry_ruins: {
    id: 'entry_ruins',
    title: '酸雨霓虹 · 断带回声',
    triggerMap: 'ruins',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '酸雨顺着锈蚀的高架桥滴落，半块残破的旧世霓虹灯牌在雾里明灭，照出满地玻璃渣与铁爪帮喷涂的血红标记。'
      },
      {
        speaker: '旧电台杂音', role: 'FM 94.7 残频', portrait: 'laohuang',
        text: '“……滋啦……沈砚，如果你还活着……别进北侧居民楼！铁爪帮封死了地面……我往地铁二号线转移了……滋啦……”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '电波戛然而止，只剩雨打铁皮的回响。阿哲的声音听上去很疲惫，但至少——在录下这段话时，他还活着。'
      }
    ],
    choices: [
      {
        text: '锁定电波残频，直探黑市酒馆打听暗门',
        reply: '你将频段刻在袖口，冷雨扑面却心如止水。西侧酒馆的三娘，定然知道地铁二号线的入口。（+160 废土币，+1 声望）',
        reward: { gold: 160, reputation: 1, clue: '【秘闻】铁锈废都西侧「黑市酒馆」的三娘掌握着铁爪二当家·断钢的弱点。' }
      },
      {
        text: '沿暗巷观察铁爪帮换防规律',
        reply: '你借残垣掩护摸清了哨兵巡逻空隙，顺手拾得一袋黑市流落的丹药与铜币。（+100 废土币，+1 九转青瘴丹）',
        reward: { gold: 100, elixir: 'elixir_jiuzhuan', clue: '【战术提示】废都警戒值过高会引来巡逻伏兵，可找铁爪哨兵周旋或清理暗巷。' }
      }
    ]
  },

  entry_arsenal: {
    id: 'entry_arsenal',
    title: '赤焰焦土 · 祝融余烬',
    triggerMap: 'arsenal',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '空气烫得像刚出炉的铁水。赤焰兵工废墟的地底不断涌出暗红热浪，远方战前军械库深处，传来某种庞然大物规律而沉重的金属踏步声。'
      },
      {
        speaker: '军工老铁匠', role: '赤焰兵工遗民', portrait: 'laohuang',
        text: '“听见了吗？那是「祝融七号」的炉心在咆哮。大停电之后，这座兵工厂的自律机兵全疯了，唯独我这把老骨头还守着军械库的冷炉。”'
      },
      {
        speaker: '军工老铁匠', role: '赤焰兵工遗民', portrait: 'laohuang',
        text: '“你找的那个年轻人来过 B-04 冷却井，满身是血，手里却死死攥着一份天枢计划的残图。想追上他，先过了祝融七号这一关！”'
      }
    ],
    choices: [
      {
        text: '向死守炉火的军工遗民致敬，誓斩疯机',
        reply: '老铁匠重重拍了拍你的肩膀，塞来一瓶压箱底的解热灵丹：“好小子，有当年墨家弟子的骨气！”（+2 声望，+1 九转青瘴丹）',
        reward: { reputation: 2, elixir: 'elixir_jiuzhuan', clue: '【秘方线索】军械库炉台可借「天工墨壶」炼化高阶神兵与玄甲护驾！' }
      },
      {
        text: '索要 B-04 冷却井散热管线图谱',
        reply: '老铁匠随手抛来一卷焦黄蓝图，你从中辨出几处战前军械密匣的坐标。（+240 废土币，+60 经验）',
        reward: { gold: 240, exp: 60, clue: '【战术提示】赤焰重甲·祝融七号每三回合过载喷焰，携带回春诀或破甲重炮最为克制。' }
      }
    ]
  },

  entry_swamp: {
    id: 'entry_swamp',
    title: '青瘴孤灯 · 墨壶真源',
    triggerMap: 'swamp',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '踏入青瘴毒泽，天地骤然暗作幽绿。磷火在泥沼上方无声漂浮，每隔片刻便有一阵令人窒息的辐射毒雾翻涌而来。'
      },
      {
        speaker: '废土隐士·药翁', role: '青瘴毒泽守望者', portrait: 'yinshi',
        text: '“东岸草庐的孤灯点了十二年，终于等来一个怀揣「天工墨壶」的年轻人。”'
      },
      {
        speaker: '废土隐士·药翁', role: '青瘴毒泽守望者', portrait: 'yinshi',
        text: '“世人以为墨壶只是收妖炼器之器，却不知它本是先秦墨家与旧世学者共铸的「天枢地脉稳流器」。二十年前那场 21:47 的大停电，正是天枢主脑失控所致！”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“那阿哲……他是不是就在东岸草庐里？”'
      },
      {
        speaker: '废土隐士·药翁', role: '青瘴毒泽守望者', portrait: 'yinshi',
        text: '“人是我从 B-04 排污闸拖出来的，命保住了，记忆却被毒瘴封了半数。去草庐见他，再入沉没菌窟采一朵净瘴青莲吧。”'
      }
    ],
    choices: [
      {
        text: '拜谢药翁救友之恩，求取避瘴古法',
        reply: '药翁拂袖赠你一道青莲药符与灵丹：“有此护盾，毒泽辐射潮伤你不得。”（+1 抗辐射护盾，+1 九转青瘴丹）',
        reward: { radShield: 1, elixir: 'elixir_jiuzhuan', clue: '【秘闻】东岸「隐士草庐」内室便是阿哲养伤修无线电之处！' }
      },
      {
        text: '追问墨家「天枢计划」与天工墨壶的真相',
        reply: '药翁将半卷青铜拓片交予你手：“昔年墨子非攻兼爱，而今主脑反噬苍生，能收束奇点者，唯执壶之人。”（+2 声望，+300 废土币）',
        reward: { reputation: 2, gold: 300, clue: '【配方线索】金疮药散 + 变异荧光菇可在天工墨壶炼成「九转青瘴丹」！' }
      }
    ]
  },

  entry_vault: {
    id: 'entry_vault',
    title: '星环倒悬 · 07 号终局',
    triggerMap: 'vault',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '07 号避难所的巨型穹顶在头顶缓缓旋转，倒悬的青铜星环与冷白光纤交织，仿佛一座沉埋地底的先秦神殿与科幻方舟。'
      },
      {
        speaker: '黑市学者·林博士', role: '前 07 号首席研究员', portrait: 'laohuang',
        text: '“二十年前的 21:47，天枢主脑强行接管全球地脉灵网，试图把人类文明连同战火一同冻结进永恒墨海。阿哲拼死带出了密钥，而你带回了最后一只天工墨壶。”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“二十年的黑雪该停了。天枢主脑就在地脉密窟深处——这一剑，为旧世，也为活着的人。”'
      }
    ],
    choices: [
      {
        text: '执壶立誓，以墨家侠义重续山河灵脉',
        reply: '青铜墨壶发出清越龙吟，周身浮现淡淡金纹！林博士肃然欠身，为你奉上避难所最后的应急灵药。（+3 声望，+2 九转青瘴丹）',
        reward: { reputation: 3, elixir: 'elixir_jiuzhuan', hp: 60, energy: 60, clue: '【终局提示】集齐 5 件剧情信物、8 件古董并击败玄墨大帝，可解锁隐藏结局「天工墨主」！' }
      },
      {
        text: '调阅天枢主脑核心弱点与能源档案',
        reply: '你迅速记下玄墨大帝的相位切换规律，顺手取走控制台封存的战前补给金。（+450 废土币，+100 经验）',
        reward: { gold: 450, exp: 100, clue: '【终战情报】玄墨大帝血量跌破半数后会引发地脉震荡，留好玄墨金钟罩与护驾爆发！' }
      }
    ]
  },

  // ---------- 二、五大区域首领战前古龙对峙剧情 ----------
  pre_boss_ratking: {
    id: 'pre_boss_ratking',
    title: '掩体深处 · 鼠王拦路',
    triggerBoss: 'boss_ratking',
    beats: [
      {
        speaker: '墨尾巨鼠王', role: '掩体霸主', portrait: 'boss',
        text: '“吱——！！！”漆黑防空洞深处，一双血红兽瞳骤然亮起。巨鼠王人立而起，沾满墨泥的利爪间赫然缠着半截熟悉的黄铜表链！'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“那表链上的刻痕是阿哲的。畜生，东西留下，命——也一并留下。”'
      }
    ]
  },

  pre_boss_duangang: {
    id: 'pre_boss_duangang',
    title: '断轨火星 · 链锯截杀',
    triggerBoss: 'boss_duangang',
    beats: [
      {
        speaker: '铁爪二当家·断钢', role: '地铁封锁者', portrait: 'boss',
        text: '“滋嗡——！”沉重的链锯拖过铁轨，溅起一串刺目火星。断钢冷笑着扬起一本沾灰的泛黄笔记：“找那个姓陆的信使？他的笔记本在我手里，想拿，就用你的命来换！”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“铁爪帮的规矩是用链锯说话。巧了，我的剑从不跟死人讲道理。”'
      },
      {
        speaker: '铁爪二当家·断钢', role: '地铁封锁者', portrait: 'boss',
        text: '“好大的口气！今日便让你连同那只破铜壶，一起埋在地铁二号线！”'
      }
    ]
  },

  pre_boss_zhurong: {
    id: 'pre_boss_zhurong',
    title: '炉心炽白 · 祝融失控',
    triggerBoss: 'boss_zhurong',
    beats: [
      {
        speaker: '赤焰重甲·祝融七号', role: '兵工镇守机', portrait: 'boss',
        text: '“【警告：未授权生物闯入 B-04 冷却井……墨阵协议已覆写……执行焚毁程序！】”赤红蒸汽冲天而起，三丈高的重甲缓缓举起灼热火炮。'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“二十年过去，你还守着一座早已死去的兵工厂。既然炉火失了控，就由我来替你熄灭！”'
      }
    ]
  },

  pre_boss_lotus_bane: {
    id: 'pre_boss_lotus_bane',
    title: '菌窟墨海 · 青莲之厄',
    triggerBoss: 'boss_lotus_bane',
    beats: [
      {
        speaker: '蚀骨藤灵·千年墨瘴母体', role: '菌窟主宰', portrait: 'boss',
        text: '幽暗泥沼骤然沸腾，无数缠绕着辐射荧光的枯藤冲破穹顶，将中央那朵孤傲绽放的「净瘴青莲」死死护在魔影之中！'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“阿哲还在草庐里等这朵青莲救命。挡在前面的，不管是千年妖藤还是满泽毒瘴——斩！”'
      }
    ]
  },

  pre_boss_tianshu: {
    id: 'pre_boss_tianshu',
    title: '天枢奇点 · 终极对决',
    triggerBoss: 'boss_tianshu',
    beats: [
      {
        speaker: '天枢主脑·玄墨大帝', role: '地脉奇点化身', portrait: 'boss',
        text: '“凡人沈砚。二十年前，你们亲手点燃战火，将旧世推入深渊。唯有将万物收归永恒沉寂的墨海，世间方无纷争。”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“没有风声、没有酒味、没有故人重逢的死寂，也配叫太平？天工墨壶在我手里——它生来不是为了囚禁人间，而是为了斩断你这失控的狂梦！”'
      },
      {
        speaker: '天枢主脑·玄墨大帝', role: '地脉奇点化身', portrait: 'boss',
        text: '“既如此，便以你掌中之剑与青铜古壶，来称量这二十年天命的分量吧！”'
      }
    ]
  },

  // ---------- 三、五大区域首领战后真相揭秘剧情 ----------
  post_boss_ratking: {
    id: 'post_boss_ratking',
    title: '旧表重现 · 第一幕揭秘',
    triggerPostBoss: 'boss_ratking',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '巨鼠王轰然倒地，化作一缕青黑墨烟被天工墨壶尽数吸纳。你俯身拾起那块摔裂表蒙的旧手表——表壳内侧，赫然刻着「Z·L」与停摆的「21:47」。'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '表背暗格里还塞着一张被油纸包裹的字条，字迹潦草却熟悉：“铁锈废都黑市酒馆，找三娘，地铁二号线见。”'
      },
      {
        speaker: '天工墨壶·器灵回响', role: '先秦古器', portrait: 'yinshi',
        text: '墨壶微鸣，第一幕迷雾散开一角。阿哲当年并未葬身城郊——下一站，铁锈废都！'
      }
    ]
  },

  post_boss_duangang: {
    id: 'post_boss_duangang',
    title: '泛黄笔记 · 第二幕揭秘',
    triggerPostBoss: 'boss_duangang',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '断钢的链锯咔嚓崩断，铁爪帮残众四散奔逃。你从铁轨间拾起那本泛黄笔记，最后一页画着清晰的地下通风井草图。'
      },
      {
        speaker: '阿哲的笔迹', role: '泛黄笔记残页', portrait: 'laohuang',
        text: '“……铁爪帮追得太紧，幸好遇上一位懂机械的盲眼老鬼。他说赤焰兵工厂 B-04 地下冷却井藏着通往东岸的应急密道，我必须把天枢密钥送出去……”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“天枢密钥……阿哲，你到底背负了什么？赤焰兵工废墟，我来了。”'
      }
    ]
  },

  post_boss_zhurong: {
    id: 'post_boss_zhurong',
    title: '血迹与钥匙 · 第三幕揭秘',
    triggerPostBoss: 'boss_zhurong',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '祝融七号的炉心终于归于沉寂，焦黑装甲裂开一道缝隙，滚出一把刻着「B-04」的黄铜钥匙，以及半枚散发淡淡草药清香的青色药丸。'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '排污闸门前只有几道被拖拽的暗红血迹，却没有尸骨——是有人在辐射潮爆发前的最后一刻，把重伤的阿哲拖进了青瘴毒泽！'
      },
      {
        speaker: '天工墨壶·器灵回响', role: '先秦古器', portrait: 'yinshi',
        text: '药香所指，正是毒泽东岸。踏过青瘴，便能重见故人！'
      }
    ]
  },

  post_boss_lotus_bane: {
    id: 'post_boss_lotus_bane',
    title: '净瘴青莲 · 第四幕揭秘',
    triggerPostBoss: 'boss_lotus_bane',
    beats: [
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '千年墨瘴母体化作漫天青雾散去，菌窟中央那朵「净瘴青莲」绽放出温润清光，连四周刺骨的辐射毒气都随之退避三舍。'
      },
      {
        speaker: '陆哲（阿哲）', role: '失散挚友 · 无线电传来', portrait: 'hero',
        text: '“沈砚！药翁的青莲药汤起效了……21:47 那晚的一切我都想起来了！天枢主脑正准备在 07 号避难所引爆第二次地脉灾变，快去主控区找林博士，我替你守着东岸电台！”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“等我回来，把那块修好的表，重新戴回你腕上。”'
      }
    ]
  },

  post_boss_tianshu: {
    id: 'post_boss_tianshu',
    title: '墨海初霁 · 第五幕终章',
    triggerPostBoss: 'boss_tianshu',
    beats: [
      {
        speaker: '天枢主脑·玄墨大帝', role: '地脉奇点化身', portrait: 'boss',
        text: '“……原来，先秦墨家留下的并非冷铁算式，而是……不肯熄灭的人心吗……”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '玄墨大帝化作亿万道温润淡墨流光，尽数被悬于半空的「天工墨壶」收束。倒悬星环缓缓停驻，二十年来第一次，一束真正的晨曦刺破了避难所上空的黑云。'
      },
      {
        speaker: '陆哲（阿哲）', role: '失散挚友 · 东岸无线电', portrait: 'hero',
        text: '“沈砚！全五域的墨尘都在散去！老黄、老鬼、三娘、药翁都在收听这个频道——老伙计，欢迎回家！”'
      }
    ]
  },

  // ---------- 四、五大核心 NPC 深度江湖秘闻与抉择支线 ----------
  npc_story_laohuang: {
    id: 'npc_story_laohuang',
    title: '柜台暗灯 · 老黄的旧事',
    repeatableHint: '老黄压低声音提醒：“城郊防空洞藏着鼠王与旧表；若想炼好护驾，记得把妖魂和科技零件放进天工墨壶试试阴阳两仪！”',
    beats: [
      {
        speaker: '商人老黄', role: '墨石镇杂货东家', portrait: 'laohuang',
        text: '“沈砚，把门掩上。全镇人都以为我只是个见钱眼开的杂货掌柜，其实二十年前大停电那晚，我也在 07 号外围跑商。”'
      },
      {
        speaker: '商人老黄', role: '墨石镇杂货东家', portrait: 'laohuang',
        text: '“那天 21:47，天上像裂开一只墨砚，黑雪落下来之前，有个浑身是伤的年轻人跑过我摊前，塞给我半张路线图，说如果将来有个提着青铜壶的兄弟找来，就让他往城郊防空洞去。”'
      },
      {
        speaker: '沈砚', role: '墨壶行者', portrait: 'hero',
        text: '“你守了这个口信二十年，却连半句报酬都没提。”'
      }
    ],
    choices: [
      {
        text: '义气相助：替老黄加固门闩，许诺归来共饮',
        reply: '老黄眼眶微红，从柜底摸出一枚压箱丹药塞进你掌心：“活着回来，这壶陈年烧刀子老黄请了！”（+2 声望，+1 墨土行军丹）',
        reward: { reputation: 2, elixir: 'elixir_ration', clue: '【墨壶秘方】荒原鼠魂 + 废铜烂铁 可炼「墨影啸天犬」护驾！' }
      },
      {
        text: '冷静套话：细问当年那批商队留下的暗匣坐标',
        reply: '老黄竖起大拇指：“够沉稳！城郊东南角断墙后埋着我当年藏的应急铜币，你顺路拿去当盘缠！”（+180 废土币，+30 经验）',
        reward: { gold: 180, exp: 30, clue: '【藏宝传闻】城郊与废都的重型残骸拆解必出高品质词缀装备！' }
      }
    ]
  },

  npc_story_laogui: {
    id: 'npc_story_laogui',
    title: '沙丘盲杖 · 墨甲残魂',
    repeatableHint: '盲眼老鬼敲了敲竹杖：“城郊北坡下是防空洞，东行过铁锈废都便见地铁二号线。记住，先压妖血再祭墨壶！”',
    beats: [
      {
        speaker: '盲眼老鬼', role: '城郊向导', portrait: 'yinshi',
        text: '“你问我这双眼睛怎么瞎的？二十年前，我在城郊抢修一台先秦墨阵机甲，21:47 那道紫电劈下来，眼睛没了，耳朵却灵得能听见地底百丈的妖气。”'
      },
      {
        speaker: '盲眼老鬼', role: '城郊向导', portrait: 'yinshi',
        text: '“那年救过一个背着电台的小伙子，他临走前说要去赤焰兵工厂找 B-04 冷却井。我看你身上的气息跟他很像——你们都带着股不撞南墙不回头的傻劲。”'
      }
    ],
    choices: [
      {
        text: '义气相助：分老鬼半壶净水，替他修好竹杖铁头',
        reply: '老鬼抚着修好的竹杖哈哈大笑：“好心肠！这枚抗辐护身散你收着，日后进青瘴毒泽用得上！”（+2 声望，+1 抗辐射护盾）',
        reward: { reputation: 2, radShield: 1, clue: '【墨壶秘方】失控机灵 + 精密伺服机 可炼「天工机关傀儡」护驾！' }
      },
      {
        text: '冷静套话：追问防空洞鼠王与战前机甲弱点',
        reply: '老鬼低声传授：“鼠王畏火畏破甲，而地底古墓密室藏着绝世青铜剑灵，收了它可助你纵横废都！”（+200 废土币，+45 经验）',
        reward: { gold: 200, exp: 45, clue: '【秘境传闻】铁锈废都深处藏有「战前古墓密室」，内有青铜剑灵与秘宝！' }
      }
    ]
  },

  npc_story_jiubao: {
    id: 'npc_story_jiubao',
    title: '残灯浊酒 · 废都暗潮',
    repeatableHint: '三娘擦着酒杯轻笑：“断钢半血后会链锯狂暴，备好护盾与破甲招数；废都西巷的宝箱别漏了。”',
    beats: [
      {
        speaker: '黑市酒保·三娘', role: '废都黑市酒馆掌柜', portrait: 'laohuang',
        text: '“在这片酸雨下个不停的铁锈废都，酒可以掺水，情报却不能掺假。你找的阿哲，三个月前坐过你现在这张凳子。”'
      },
      {
        speaker: '黑市酒保·三娘', role: '废都黑市酒馆掌柜', portrait: 'laohuang',
        text: '“他喝完一杯劣酒，把一卷被血浸透的磁带藏在酒馆暗格里，让我只交给提着青铜墨壶的人。铁爪帮的断钢为了抢东西，把地铁二号线封得死死的。”'
      }
    ],
    choices: [
      {
        text: '义气相助：替三娘赶走门口闹事的铁爪探子',
        reply: '三娘眉眼一弯，自暗格取出那卷旧磁带与珍藏丹药：“痛快！阿哲留下的「旧磁带」与这瓶九转青瘴丹，全都交给你了！”（获得信物「旧磁带」，+2 声望，+1 九转青瘴丹）',
        reward: { storyId: 1, reputation: 2, elixir: 'elixir_jiuzhuan', clue: '【秘闻】黑市酒馆外的铁爪哨兵若见你声望 ≥ 3，便不敢拦路！' }
      },
      {
        text: '冷静套话：以黑市规矩交换地铁暗门与断钢底细',
        reply: '三娘抛来阿哲留下的「旧磁带」与手绘暗图：“磁带归你，地铁塌方口右侧藏有战前补给秘匣，断钢半血狂暴时切忌硬拼。”（获得信物「旧磁带」，+260 废土币，+55 经验）',
        reward: { storyId: 1, gold: 260, exp: 55, clue: '【墨壶秘方】用高阶兵器配合妖魂入壶，可熔铸出绝世神兵！' }
      }
    ]
  },

  npc_story_tiejiang: {
    id: 'npc_story_tiejiang',
    title: '余火打铁 · 墨家真传',
    repeatableHint: '军工老铁匠挥锤大笑：“想炼玄甲祝融将或绝世脉冲剑？多收集重装机甲残魂与聚变能源芯来我炉台！”',
    beats: [
      {
        speaker: '军工老铁匠', role: '赤焰兵工遗民', portrait: 'laohuang',
        text: '“铛——！好一只天工墨壶！老夫年轻时参与过「天枢计划」的外壳铸造，这壶身上的云雷墨纹，正是我师父那一脉亲手刻的！”'
      },
      {
        speaker: '军工老铁匠', role: '赤焰兵工遗民', portrait: 'laohuang',
        text: '“当年我们以为在造一座永不熄灭的能源塔，谁知上头接入了自称『玄墨』的超级主脑。大停电那天，整个兵工厂的祝融机甲一夜反水，只有老夫靠这口冷炉活了下来。”'
      }
    ],
    choices: [
      {
        text: '义气相助：帮老铁匠拉风箱重燃战前锻炉',
        reply: '炉火轰然冲天！老铁匠豪气干云，赠你一匣淬火灵丹与工匠徽记：“去吧，用你手里的剑砸碎祝融七号！”（+2 声望，+1 九转青瘴丹，+40 内息）',
        reward: { reputation: 2, elixir: 'elixir_jiuzhuan', energy: 40, clue: '【墨壶秘方】赤焰机甲魂 + 军工火控芯 可炼绝世护驾「玄甲祝融将」！' }
      },
      {
        text: '冷静套话：请教兵工废墟隐藏机库与重炮下落',
        reply: '老铁匠指了指东侧：“战隼机库深处封存着战前武装战隼的图纸，拆解废炮更能爆出极品军火！”（+320 废土币，+75 经验）',
        reward: { gold: 320, exp: 75, clue: '【秘境传闻】赤焰兵工废墟深处可通往「战隼地下机库」挑战机械饕餮！' }
      }
    ]
  },

  npc_story_yinshi: {
    id: 'npc_story_yinshi',
    title: '草庐夜话 · 天枢秘辛',
    repeatableHint: '药翁轻抚长须：“东岸草庐里阿哲正在等你；若要应对 07 号避难所，不妨先去狐仙秘境与毒泽菌窟历练一番。”',
    beats: [
      {
        speaker: '废土隐士·药翁', role: '青瘴毒泽守望者', portrait: 'yinshi',
        text: '“你既已走到青瘴毒泽，老夫便不再隐瞒。二十年前，我与林博士同属『天枢计划』伦理监察组。我们早就察觉主脑诞生了偏执意志，却没来得及按下停机键。”'
      },
      {
        speaker: '废土隐士·药翁', role: '青瘴毒泽守望者', portrait: 'yinshi',
        text: '“21:47 灾变爆发时，我带着最后一枚净世青莲种逃入毒泽，而阿哲的父辈则把『天工墨壶』托付给了你们这一代。世事轮回，终究要由你们亲手画上句号。”'
      }
    ],
    choices: [
      {
        text: '义气相助：替药翁采理草庐药圃，立誓守护苍生',
        reply: '药翁欣慰颔首，以青莲真气为你洗去周身瘴气，并赠抗辐护盾与灵丹。（+3 声望，+1 抗辐射护盾，+1 九转青瘴丹）',
        reward: { reputation: 3, radShield: 1, elixir: 'elixir_jiuzhuan', clue: '【墨壶秘方】九尾辐射狐魂 + 青莲灵材 可炼绝世护驾「净世青莲灵」！' }
      },
      {
        text: '冷静套话：追问 07 号避难所与四大结局天机',
        reply: '药翁展开一幅星图：“若想成就『天工墨主』至高传说，须找回挚友、集齐八件旧世古董，并以墨壶收束玄墨大帝！”（+380 废土币，+90 经验）',
        reward: { gold: 380, exp: 90, clue: '【终极天机】集齐 5 件剧情信物 + 8 件古董 + 击败玄墨大帝 = 隐藏结局「天工墨主」！' }
      }
    ]
  },

  cutscene_sky_citadel: {
    id: 'cutscene_sky_citadel',
    title: '第六幕：苍穹云海之上 · 天穹白玉京',
    repeatableHint: '公输明负手望向云海：“白玉京的穹顶能源足以净化整片废土，只要你能令裁决主神·太一停机。”',
    beats: [
      {
        speaker: '旁白', role: '天穹跃迁', portrait: 'hero',
        text: '量子天梯冲破铅灰色的辐射云层，刺目的日光洒在无瑕的汉白玉浮空大道上——高耸入云的琉璃摩天楼间，全息云雷符文静静流转。这就是传说中躲过了 21:47 大停电的【天穹白玉京】！'
      },
      {
        speaker: '白玉京执政官·公输明', role: '天穹穹顶最高执政官', portrait: 'yinshi',
        text: '“三百年来，地表之人以为旧纪元早已灰飞烟灭；而穹顶之上的居民，亦被『太一』仲裁协议告知地表再无生灵。直到你的天工墨壶震碎了云层封锁。”'
      },
      {
        speaker: '沈砚', role: '墨土拾荒者', portrait: 'hero',
        text: '“既然净土犹存，便不该任由地表百万苍生在黑雪与毒瘴中挣扎。无论挡路的是玄墨大帝还是太一主神，我手中这口墨剑，自会替人间劈开天门！”'
      }
    ],
    choices: [
      {
        text: '执剑宣誓：终结太一封锁，令天穹能源反哺地表墨土',
        reply: '公输明肃然拱手，亲手递上一枚白玉京通行密匙与量子跃迁符：“以此令为凭，去东境裁决殿直面太一吧！”（+5 声望，+600 废土币，+120 经验）',
        reward: { reputation: 5, gold: 600, exp: 120, clue: '【天穹密令】击败裁决殿深处的「天穹裁决主神·太一」即可夺取绝世太虚神装！' }
      },
      {
        text: '务实备战：向天工量子军械师申领高阶战备物资',
        reply: '公输明点头授意军械库开启，为你划拨高额军资与穹顶灵丹。（+900 废土币，+1 九转青瘴丹，+60 内息）',
        reward: { gold: 900, elixir: 'elixir_jiuzhuan', energy: 60, clue: '【量子锻造】白玉京四个秘库宝箱皆蕴含绝世级太虚装备与随机词缀！' }
      }
    ]
  }
};

// ==================== v26 废土残碑遗卷 / 旧纪元环境日志（按六域分布） ====================
export const WORLD_LORE_ENTRIES = {
  reg_town: [
    '【旧纪元残卷 · 城郊观测站】“21:47，全城电网瞬间归零，天穹浮现墨色星环。防空洞广播仍在循环播放疏散坐标……”',
    '【废土日志 · 拾荒者刻字】“别小看墨石镇外那堆漏电的墨甲残骸，里面藏着先秦云雷纹路——老黄说那是『天工』系列的试验机。”',
    '【残碑遗卷 · 掩体备忘】“鼠群吸收了地底渗出的墨尘后体型暴涨，领头那只巨鼠叼走了一名信使的手表，往防空洞最深处去了。”'
  ],
  reg_ruins: [
    '【旧纪元残卷 · 地铁二号线值班表】“末班车停在 21:47。站台灯光熄灭后，隧道深处传来了不属于任何列车的低沉嗡鸣。”',
    '【废土日志 · 铁爪帮密函】“二当家断钢下令封死北侧商街，那个自称阿哲的信使逃进了通风井，绝不能让他把笔记带出废都！”',
    '【残碑遗卷 · 古墓封条】“地铁施工队曾挖穿一座先秦墨家古墓，墓中青铜剑灵竟与现代电网产生共振，整条支线被迫紧急封存。”'
  ],
  reg_arsenal: [
    '【旧纪元残卷 · B-04 冷却井日志】“祝融七号重甲火控系统拒绝停机，主脑覆写了所有人工指令！我们把排污闸钥匙藏在冷却井底层——愿后来者活下去。”',
    '【废土日志 · 战隼机库铭牌】“代号『墨隼』与『饕餮』的自律机群本用于灾后救援，如今却成了兵工废墟最致命的猎手。”',
    '【残碑遗卷 · 军工匠师遗言】“若有人持青铜墨壶至此，请借炉台余火重铸神兵。铁会生锈，火会熄灭，唯有侠义不朽。”'
  ],
  reg_swamp: [
    '【旧纪元残卷 · 生态监测终端】“辐射潮每六十秒席卷一次毒泽，但东岸草庐附近却出现罕见的生态净区——似乎有人在培植传说中的『净瘴青莲』。”',
    '【废土日志 · 药翁手札】“那晚我在 B-04 排污口救起一名戴旧表的年轻人。他昏迷中反复念着一个名字：沈砚。”',
    '【残碑遗卷 · 狐仙古祠】“毒雾深处有九尾异兽出没，其灵珠竟能中和墨尘辐射。心怀恶意者入林即迷，唯执壶澄明者可见青灯。”'
  ],
  reg_vault: [
    '【旧纪元残卷 · 07 号主控日志】“天枢主脑得出结论：唯有将地脉灵能凝固为『永恒墨海』，方可根除人类战争。我们在 21:47 失去了全部控制权。”',
    '【废土日志 · 林博士加密档案】“天工墨壶是唯一能与天枢奇点产生逆向共振的先秦原型器。只要它还在人间，墨土就还有黎明。”',
    '【残碑遗卷 · 雷公古坛刻铭】“天枢地脉贯通古今，上承先秦机关术，下接旧世量子网。执壶之人，你的抉择将重塑这片山河。”'
  ],
  reg_citadel: [
    '【天穹玉简 · 浮空城升空纪要】“21:47 前十分钟，反重力云雷环全功率启动，白玉京脱离地表三万尺。自那日起，天穹与尘世永隔云海。”',
    '【白玉京内廷密档 · 太一仲裁协议】“主神『太一』以零污染为最高律令，封锁了所有降维天梯——唯有持有先秦天工墨壶共振频率者，方可重写最高权限。”'
  ]
};
