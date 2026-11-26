// ==================== 游戏核心配置数据 ====================

export const QUALITY = {
  common: { key: 'common', name: '普通', rate: 0.60, multiplier: 1, color: '#9aa4b2' },
  fine:   { key: 'fine',   name: '优良', rate: 0.26, multiplier: 1.6, color: '#4cd964' },
  rare:   { key: 'rare',   name: '稀有', rate: 0.11, multiplier: 3.2, color: '#c06cff' },
  legend: { key: 'legend', name: '传说', rate: 0.03, multiplier: 10, color: '#ff9f1c' }
};

export const ITEMS = [
  // ---- 通用废品与高价值电子件 (0 - 11) ----
  { id: 0,  name: '塑料瓶',     icon: '🧴', baseValue: 8,   dis: false, desc: '城郊随处可见的再生塑料。' },
  { id: 1,  name: '废纸箱',     icon: '📦', baseValue: 16,  dis: false, desc: '印着战前物流编码的硬纸板。' },
  { id: 2,  name: '生锈铁罐',   icon: '🥫', baseValue: 24,  dis: false, desc: '战前罐头盒，铁皮可回炉。' },
  { id: 3,  name: '废铜线',     icon: '🔌', baseValue: 45,  dis: false, desc: '高纯度铜芯线，营地硬通货。' },
  { id: 4,  name: '旧家电',     icon: '📺', baseValue: 95,  dis: true,  desc: '老式显像管电器，拆开常有惊喜。' },
  { id: 5,  name: '电路板',     icon: '🟩', baseValue: 140, dis: true,  desc: '镀金触点尚存的主板，拆解价值极高。' },
  { id: 6,  name: '废旧显卡',   icon: '🖥️', baseValue: 320, dis: true,  desc: '战前算力芯片遗物，散热片完整。' },
  { id: 7,  name: '军用蓄电池', icon: '🔋', baseValue: 260, dis: true,  desc: '密封铅酸电池，残余电量仍可驱动设备。' },
  { id: 8,  name: '破损无人机', icon: '🛸', baseValue: 430, dis: true,  desc: '侦察无人机残骸，精密陀螺仪尚存。' },
  { id: 9,  name: '光学镜片',   icon: '🔭', baseValue: 370, dis: false, desc: '军工级镀膜镜片，极受狙击手欢迎。' },
  { id: 10, name: '辐射稳定核', icon: '☢️', baseValue: 680, dis: true,  desc: '幽蓝微光的同位素容器，收益惊人。' },
  { id: 11, name: '战前黑匣子', icon: '📼', baseValue: 950, dis: false, desc: '航空级加密数据盒，学者出天价收购。' },

  // ---- 区域专属特色道具 (12 - 19) ----
  { id: 12, name: '地铁通行币', icon: '🪙', baseValue: 180, dis: false, desc: '【地铁专属】战前黄铜乘车币，地下老鬼最爱收集。' },
  { id: 13, name: '大桥钢缆段', icon: '⛓️', baseValue: 240, dis: true,  desc: '【断桥专属】高强度合金钢索，拆解可得稀有金属。' },
  { id: 14, name: '应急信号枪', icon: '🧨', baseValue: 310, dis: false, desc: '【断桥专属】未受潮的红色信号弹，商队抢手货。' },
  { id: 15, name: '破损ATM机芯',icon: '🏧', baseValue: 460, dis: true,  desc: '【商业街专属】厚重防盗钱箱残骸，拆解可能暴富！' },
  { id: 16, name: '奢侈品腕表', icon: '⌚', baseValue: 540, dis: false, desc: '【商业街专属】橱窗遗落的瑞士机械表，品相极佳。' },
  { id: 17, name: '变异荧光菇', icon: '🍄', baseValue: 290, dis: false, desc: '【沼泽专属】散发幽绿微光的真菌，制药黑市紧俏货。' },
  { id: 18, name: '军工伺服机', icon: '⚙️', baseValue: 520, dis: true,  desc: '【军工厂专属】高精度液压伺服模块。' },
  { id: 19, name: '避难所芯片', icon: '💾', baseValue: 1100,dis: true,  desc: '【避难所专属】07号避难所加密存储核心，价值连城。' },

  // ---- 野生可拾取补给品 (20 - 24) ----
  { id: 20, name: '压缩饼干',   icon: '🍪', baseValue: 22,  dis: false, isConsumable: true, effect: { food: 35 }, desc: '硬得像砖头，使用：+35 饱食度。' },
  { id: 21, name: '纯净水',     icon: '💧', baseValue: 28,  dis: false, isConsumable: true, effect: { energy: 25, food: 12 }, desc: '未受污染的瓶装水，使用：+25体力 +12饱食。' },
  { id: 22, name: '功能饮料',   icon: '⚡', baseValue: 45,  dis: false, isConsumable: true, effect: { energy: 55 }, desc: '战前牛磺酸配方，使用：+55 体力。' },
  { id: 23, name: '抗辐射药剂', icon: '🧪', baseValue: 110, dis: false, isConsumable: true, effect: { radShield: 1, energy: 15 }, desc: '使用：抵御1次辐射潮并 +15 体力。' },
  { id: 24, name: '烟雾弹',     icon: '💨', baseValue: 90,  dis: false, isConsumable: true, effect: { clearWarn: true }, desc: '使用：立即清零当前区域警戒值！' },

  // ---- 剧情信物 (25 - 29) ----
  { id: 25, name: '旧手表',     icon: '⌚', baseValue: 0, dis: false, isStory: true, storyId: 0, desc: '指针停在 21:47 的机械表，刻着「Z·L」。' },
  { id: 26, name: '旧磁带',     icon: '📼', baseValue: 0, dis: false, isStory: true, storyId: 1, desc: '受潮录音带，标签写着“撤离路线备用”。' },
  { id: 27, name: '泛黄笔记',   icon: '📓', baseValue: 0, dis: false, isStory: true, storyId: 2, desc: '字迹潦草的生存手记。' },
  { id: 28, name: '生锈钥匙',   icon: '🗝️', baseValue: 0, dis: false, isStory: true, storyId: 3, desc: '编号 B-04 的黄铜钥匙。' },
  { id: 29, name: '旧照片',     icon: '🖼️', baseValue: 0, dis: false, isStory: true, storyId: 4, desc: '背面用红笔圈出了沼泽东岸的坐标。' },

  // ---- 战前古董 (30 - 37) ----
  { id: 30, name: '青铜吊坠',   icon: '🏺', baseValue: 0, dis: false, isCollection: true, colId: 0, desc: '战前博物馆仿古工艺品。' },
  { id: 31, name: '陶瓷碎片',   icon: '🥣', baseValue: 0, dis: false, isCollection: true, colId: 1, desc: '清代康熙青花瓷残片。' },
  { id: 32, name: '古币',       icon: '🪙', baseValue: 0, dis: false, isCollection: true, colId: 2, desc: '清代光绪通宝铜钱。' },
  { id: 33, name: '老邮票册',   icon: '📮', baseValue: 0, dis: false, isCollection: true, colId: 3, desc: '民国时期邮票合集。' },
  { id: 34, name: '翡翠扳指',   icon: '💍', baseValue: 0, dis: false, isCollection: true, colId: 4, desc: '冰种阳绿翡翠。' },
  { id: 35, name: '紫檀木盒',   icon: '🧰', baseValue: 0, dis: false, isCollection: true, colId: 5, desc: '小叶紫檀雕花首饰盒。' },
  { id: 36, name: '机械怀表',   icon: '🕰️', baseValue: 0, dis: false, isCollection: true, colId: 6, desc: '瑞士双盖鎏金怀表。' },
  { id: 37, name: '战前黑胶',   icon: '💿', baseValue: 0, dis: false, isCollection: true, colId: 7, desc: '交响乐母盘黑胶唱片。' }
];

// 共 38 项物品，每张地图均配置专属掉落权重与地图坐标 (x%, y%)
export const MAPS = [
  {
    id: 0,
    name: '城郊废土堆',
    short: '城郊',
    icon: '🏚️',
    x: 17, y: 66,
    links: [1, 2],
    unlockCost: 0,
    theme: 'wasteland',
    desc: '离幸存者营地最近的垃圾填埋场，视野开阔且无掠夺者巡逻，最适合新手起步。',
    //       0   1   2   3   4   5   6   7   8   9  10  11 | 12 13 14 15 16 17 18 19 | 20 21 22 23 24 | 25 26 27 28 29 | 30 31 32 33 34 35 36 37
    weight: [30, 24, 18, 12,  5,  2,  0,  0,  0,  0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0,  6, 5, 1, 0, 0,   3, 0, 0, 0, 0,   2, 0, 0, 0, 0, 0, 0, 0],
    npc: 'laohuang',
    hasWarn: false,
    hasTide: false,
    hasChem: false
  },
  {
    id: 1,
    name: '废弃居民楼',
    short: '居民楼',
    icon: '🏢',
    x: 33, y: 34,
    links: [0, 3, 4],
    unlockCost: 600,
    theme: 'apartments',
    desc: '坍塌的高层住宅区，旧家电与电路板云集，但铁爪帮哨兵会推高警戒值。',
    weight: [10, 12, 12, 14, 16, 10,  4,  2,  0,  0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0,  5, 4, 3, 0, 2,   2, 4, 2, 0, 0,   1, 3, 1, 0, 0, 0, 0, 0],
    npc: 'shaobing',
    hasWarn: true,
    hasTide: false,
    hasChem: false
  },
  {
    id: 2,
    name: '地铁旧隧道',
    short: '地铁站',
    icon: '🚇',
    x: 35, y: 74,
    links: [0, 3, 5],
    unlockCost: 1200,
    theme: 'subway',
    desc: '漆黑的地下二号线铁轨，盛产【地铁通行币】；强光手电可大幅提升密室发现率。',
    weight: [ 6,  8, 10, 12, 10, 12,  6,  6,  2,  0,  0,  0, 14, 0, 0, 0, 0, 0, 0, 0,  4, 4, 3, 1, 2,   1, 3, 4, 2, 0,   1, 2, 3, 2, 0, 0, 0, 1],
    npc: 'laogui',
    hasWarn: true,
    hasTide: false,
    hasChem: false
  },
  {
    id: 3,
    name: '跨江断桥区',
    short: '断桥区',
    icon: '🌉',
    x: 52, y: 52,
    links: [1, 2, 4, 5],
    unlockCost: 2000,
    theme: 'bridge',
    desc: '横跨毒水河的断裂高架桥，常年狂风呼啸，遗留大量【大桥钢缆】与【应急信号枪】。',
    weight: [ 4,  5,  8, 10, 10, 10,  8,  6,  4,  4,  0,  0,  0,12,10, 0, 0, 0, 0, 0,  3, 4, 4, 2, 2,   0, 2, 2, 2, 0,   1, 1, 2, 2, 1, 0, 1, 1],
    npc: 'laohuang',
    hasWarn: true,
    hasTide: false,
    hasChem: false
  },
  {
    id: 4,
    name: '军工厂废墟',
    short: '军工厂',
    icon: '🏭',
    x: 68, y: 26,
    links: [1, 3, 6],
    unlockCost: 3200,
    theme: 'factory',
    desc: '战前精密兵工厂，盛产【军工伺服机】与光学镜片，但化学品泄漏会灼伤体力。',
    weight: [ 3,  4,  6, 10, 12, 14, 10,  8,  6,  6,  2,  0,  0, 0, 0, 0, 0, 0,12, 0,  3, 3, 4, 3, 2,   0, 1, 2, 3, 1,   0, 1, 2, 2, 2, 0, 1, 1],
    npc: 'laohuang',
    hasWarn: true,
    hasTide: false,
    hasChem: true
  },
  {
    id: 5,
    name: '旧城商业街',
    short: '商业街',
    icon: '🏬',
    x: 66, y: 76,
    links: [2, 3, 6, 7],
    unlockCost: 4500,
    theme: 'mall',
    desc: '战前繁华百货残骸，遍布【破损ATM机芯】与【奢侈品腕表】，古董极多。',
    weight: [ 2,  4,  4,  6, 10, 10,  8,  4,  4,  4,  0,  0,  0, 0, 0,12,10, 0, 0, 0,  3, 3, 3, 2, 3,   0, 1, 1, 2, 2,   2, 2, 2, 3, 3, 3, 3, 3],
    npc: 'shaobing',
    hasWarn: true,
    hasTide: false,
    hasChem: false
  },
  {
    id: 6,
    name: '辐射沼泽',
    short: '辐射沼泽',
    icon: '☣️',
    x: 84, y: 44,
    links: [4, 5, 7],
    unlockCost: 6500,
    theme: 'swamp',
    desc: '每 60 秒爆发致命「辐射潮」的绿色泥沼，特产【变异荧光菇】与最后信物。',
    weight: [ 2,  2,  4,  6,  6,  8,  8,  6,  6,  6,  8,  4,  0, 0, 0, 0, 0,14, 0, 0,  2, 3, 3, 5, 2,   0, 0, 1, 3, 5,   2, 2, 2, 2, 3, 3, 2, 2],
    npc: 'yinshi',
    hasWarn: false,
    hasTide: true,
    hasChem: false
  },
  {
    id: 7,
    name: '07号避难所',
    short: '避难所',
    icon: '☢️',
    x: 86, y: 78,
    links: [5, 6],
    unlockCost: 10000,
    theme: 'vault',
    desc: '地下主控核心区，辐射潮、化学品与警卫并存，蕴藏终极【避难所芯片】与黑匣子。',
    weight: [ 1,  1,  2,  4,  6,  8, 10,  8, 10,  8, 10,  8,  0, 0, 0, 0, 0, 0, 4,12,  2, 2, 4, 6, 3,   0, 0, 1, 2, 4,   1, 1, 2, 2, 3, 4, 4, 4],
    npc: 'xuezhe',
    hasWarn: true,
    hasTide: true,
    hasChem: true
  }
];

export const NPCS = {
  laohuang: {
    id: 'laohuang',
    name: '商人老黄',
    avatar: '🧔',
    title: '废土百事通 · 游商',
    talk: '“小伙子，每块地盘的天气和特产都不一样！看准辐射尘天气再去高危区，能爆出好货。”',
    options: [
      { text: '打听同伴「阿哲」的下落', desc: '获取剧情线索与方向提示' },
      { text: '请求高价收购（声望≥2享+15%溢价）', desc: '立即按当前市价溢价变卖背包物资' },
      { text: '赠送一份口粮套近乎（-15饱食，+1声望）', desc: '提升营地声望' }
    ]
  },
  shaobing: {
    id: 'shaobing',
    name: '掠夺者哨兵',
    avatar: '🥷',
    title: '铁爪帮巡逻队',
    talk: '“这片街区归‘铁爪帮’管了！要么交买路钱，要么把包里的好货留下。”',
    options: [
      { text: '给 200 金币买路（清零警戒）', desc: '花钱消灾，安全搜刮' },
      { text: '亮出营地声望震慑（需声望≥3）', desc: '免费清零警戒并获赠情报' },
      { text: '塞一份干粮溜进去（-30饱食，警戒减半）', desc: '用口粮打发哨兵' }
    ]
  },
  laogui: {
    id: 'laogui',
    name: '隧道拾荒老鬼',
    avatar: '🔦',
    title: '地下铁盲眼向导',
    talk: '“地下黑得很，没手电可别乱摸……这儿的黄铜通行币和密道图，你要不要？”',
    options: [
      { text: '花 150 金买地下密道图', desc: '立即发现一处隐藏密室！' },
      { text: '打听 B-04 钥匙与地铁惨案', desc: '解锁地下铁背景故事' },
      { text: '讨一杯热水（+20体力）', desc: '老鬼看你顺眼，分你半壶温水' }
    ]
  },
  yinshi: {
    id: 'yinshi',
    name: '废土隐士',
    avatar: '🧙‍♂️',
    title: '沼泽守望者',
    talk: '“我在这辐射沼泽边待了十几年，见过无数人沉下去……你找的那个人，我当年救过他一命。”',
    options: [
      { text: '追问同伴阿哲的去向', desc: '获得关键剧情指引' },
      { text: '以 300 金求购抗辐射秘药', desc: '获得 1 层抗辐射护盾与 +20 体力' },
      { text: '分享食物与故事（-20饱食，+2声望）', desc: '大幅提升隐士好感' }
    ]
  },
  xuezhe: {
    id: 'xuezhe',
    name: '黑市学者 · 林博士',
    avatar: '🥼',
    title: '07号避难所前研究员',
    talk: '“避难所核心区的数据还没彻底销毁。如果你带回芯片或黑匣子，我能给你最丰厚的回报。”',
    options: [
      { text: '用 400 金兑换 1 点技能点', desc: '战前神经训练技术（提升实力）' },
      { text: '询问「废土之王」的传说', desc: '了解隐藏结局的触发条件' },
      { text: '出售黑匣子情报（高价变卖背包）', desc: '学者溢价 +25% 收购背包物资' }
    ]
  }
};

export const STORY_CHAPTERS = [
  { id: 0, relic: '旧手表',   title: '第一章：停摆的 21:47',     text: '表壳内侧刻着阿哲的名字缩写「Z·L」。大停电爆发的那晚，正是 21:47，你们在城郊分头撤离，约定三天后在老站台汇合——但他再也没有出现。' },
  { id: 1, relic: '旧磁带',   title: '第二章：滋啦作响的留言',   text: '你借老黄的收录机放出了磁带里的杂音：“……别来居民楼，铁爪帮封锁了北侧，我往地铁二号线转移了，如果有谁听到……”磁带在这里被撕断了。' },
  { id: 2, relic: '泛黄笔记', title: '第三章：隧道深处的足迹',   text: '笔记里画着地铁通风井的草图：“物资快见底了，遇到一个懂机械的老鬼，他说军工厂地下还有未启封的应急通道，我决定去赌一把。”' },
  { id: 3, relic: '生锈钥匙', title: '第四章：B-04 闸门之后',    text: '这把黄铜钥匙属于军工厂通往辐射沼泽的排污闸门。门后没有尸体，只有几道被拖拽的血迹和半个空药瓶——有人在辐射潮前把他拖出了通道。' },
  { id: 4, relic: '旧照片',   title: '第五章：沼泽彼岸的灯火',   text: '照片背面用红笔标着一个清晰的营地坐标，旁边写着隐士的字迹：“失忆的年轻人已醒，在东岸修无线电，等一个戴旧表的人。”' }
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

export const SKILLS = [
  { id: 0, name: '快速拾取', icon: '🏃', maxLevel: 3, cost: [1, 2, 3], desc: '每次拾荒体力消耗减少 1 / 2 / 3 点' },
  { id: 1, name: '鹰眼术',   icon: '🦅', maxLevel: 3, cost: [1, 2, 3], desc: '稀有/传说概率 +15%/Lv，密室发现率 +4%/Lv' },
  { id: 2, name: '背包客',   icon: '🎒', maxLevel: 3, cost: [1, 2, 3], desc: '背包容量上限永久 +3 / +6 / +9 格' },
  { id: 3, name: '拆解大师', icon: '🔧', maxLevel: 3, cost: [1, 2, 3], desc: '拆解成功率 +10%/Lv，拆解收益 +20%/Lv' },
  { id: 4, name: '逃跑大师', icon: '💨', maxLevel: 3, cost: [1, 2, 3], desc: '追捕逃脱率 +15%/Lv，被抓/辐射损失 -10%/Lv' },
  { id: 5, name: '幸运儿',   icon: '🍀', maxLevel: 3, cost: [1, 2, 3], desc: '拆解暴击率 +8%/Lv，拾取品质与随机事件运气提升' }
];

export const WEATHERS = [
  { id: 0, name: '☀️ 晴天',     short: '☀️', rareBonus: 1.0,  energyCost: 1.0,  color: '#fbbf24', desc: '视野开阔，体力消耗正常。' },
  { id: 1, name: '🌫️ 辐射尘',   short: '☢️', rareBonus: 1.65, energyCost: 1.35, color: '#a3e635', desc: '辐射尘暴来袭！体力消耗+35%，稀有物资爆率大幅提升！' },
  { id: 2, name: '🌧️ 酸雨夜',   short: '🌧️', rareBonus: 1.35, energyCost: 1.25, color: '#38bdf8', desc: '酸雨倾盆，体力消耗+25%，电子件更容易被冲刷出来。' },
  { id: 3, name: '🔥 废土热浪', short: '🔥', rareBonus: 1.2,  energyCost: 1.2,  color: '#fb923c', desc: '热浪滚滚，体力消耗+20%，拾荒注意补充水分。' },
  { id: 4, name: '🌪️ 强风沙',   short: '🌪️', rareBonus: 1.4,  energyCost: 1.3,  color: '#cbd5e1', desc: '狂风吹开掩埋层！稀有率+40%，体力消耗+30%。' }
];

export const ENDINGS = {
  normal: {
    id: 'normal',
    badge: '结局 I · 常规结局',
    title: '庇护之地',
    content: '你攒够了 15,000 废土币，在城郊高地建起了带铁丝网与太阳能板的小型庇护所。围起栅栏、种上耐旱作物，你在末世终于有了一个遮风挡雨的家。'
  },
  friend: {
    id: 'friend',
    badge: '结局 II · 羁绊结局',
    title: '同伴重逢',
    content: '凭着五件信物串联起的线索，你穿过辐射沼泽，终于在东岸无线电营地找到了阿哲。两人隔着篝火相视良久，最终千言万语只化作一句：“老伙计，好久不见。”'
  },
  collector: {
    id: 'collector',
    badge: '结局 III · 传奇结局',
    title: '末世收藏家',
    content: '八件战前古董全数重现天日！大型幸存者联邦的博物官亲自带着护卫队上门收购。你一夜之间名震废土，蜕变为最受尊敬的古董大亨。'
  },
  king: {
    id: 'king',
    badge: '隐藏结局 · 至高传说',
    title: '废土之王',
    content: '你踏遍了八大险境、收齐八件战前遗珍、找回失散的挚友，并在废土留下了超过 500 次拾荒传奇！你不再只是求生者——你就是这片废土新的法则。'
  }
};

export const DAILY_TASK_TPL = [
  { id: 0, name: '拾荒新手', target: 15, reward: 120, sp: 1, type: 'pick' },
  { id: 1, name: '拆解能手', target: 4,  reward: 180, sp: 1, type: 'dis' },
  { id: 2, name: '小有积蓄', target: 600, reward: 220, sp: 1, type: 'sell' }
];

export const WEEKLY_TASK_TPL = {
  name: '周常：废土行者',
  target: 150,
  reward: 1200,
  sp: 5,
  type: 'pick'
};

export const TEAM_TASK_TPL = {
  name: '搜寻失落补给箱',
  desc: '哨兵报告有一批战前空投箱坠落在废土深处，发送信号即可加速定位！',
  target: 10
};
