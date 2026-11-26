// ==================== 游戏配置 ====================
const QUALITY = {
  common: { name: '普通', rate: 0.65, multiplier: 1 },
  fine: { name: '优良', rate: 0.25, multiplier: 1.5 },
  rare: { name: '稀有', rate: 0.08, multiplier: 3 },
  legend: { name: '传说', rate: 0.02, multiplier: 10 }
}

const ITEMS = [
  { id: 0, name: '塑料瓶', baseValue: 5, dis: false },
  { id: 1, name: '废纸箱', baseValue: 12, dis: false },
  { id: 2, name: '废铜线', baseValue: 35, dis: false },
  { id: 3, name: '旧家电', baseValue: 90, dis: true },
  { id: 4, name: '电路板', baseValue: 120, dis: true },
  { id: 5, name: '废旧显卡', baseValue: 320, dis: false },
  { id: 6, name: '旧手表', baseValue: 0, dis: false, isStory: true, storyId: 0 },
  { id: 7, name: '旧磁带', baseValue: 0, dis: false, isStory: true, storyId: 1 },
  { id: 8, name: '泛黄笔记', baseValue: 0, dis: false, isStory: true, storyId: 2 },
  { id: 9, name: '生锈钥匙', baseValue: 0, dis: false, isStory: true, storyId: 3 },
  { id: 10, name: '旧照片', baseValue: 0, dis: false, isStory: true, storyId: 4 },
  { id: 11, name: '青铜吊坠', baseValue: 0, dis: false, isCollection: true, colId: 0 },
  { id: 12, name: '陶瓷碎片', baseValue: 0, dis: false, isCollection: true, colId: 1 },
  { id: 13, name: '古币', baseValue: 0, dis: false, isCollection: true, colId: 2 },
  { id: 14, name: '老邮票册', baseValue: 0, dis: false, isCollection: true, colId: 3 },
  { id: 15, name: '翡翠扳指', baseValue: 0, dis: false, isCollection: true, colId: 4 },
  { id: 16, name: '紫檀木盒', baseValue: 0, dis: false, isCollection: true, colId: 5 }
]

const MAPS = [
  {
    id: 0, name: '城郊废土堆', unlock: true, unlockCost: 0,
    weight: [40, 30, 20, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    npc: 'laohuang', hasWarn: false, hasTide: false, hasChem: false
  },
  {
    id: 1, name: '废弃居民楼', unlock: false, unlockCost: 800,
    weight: [15, 20, 15, 20, 10, 5, 5, 5, 5, 0, 0, 0, 5, 0, 0, 0, 0],
    npc: 'shaobing', hasWarn: true, hasTide: false, hasChem: false
  },
  {
    id: 2, name: '军工厂废墟', unlock: false, unlockCost: 2500,
    weight: [10, 10, 20, 20, 20, 15, 0, 0, 5, 5, 0, 0, 0, 5, 0, 0, 0],
    npc: 'laohuang', hasWarn: true, hasTide: false, hasChem: true
  },
  {
    id: 3, name: '辐射沼泽', unlock: false, unlockCost: 6000,
    weight: [15, 10, 15, 10, 10, 10, 0, 0, 0, 5, 5, 10, 5, 5, 5, 5, 5],
    npc: 'yinshi', hasWarn: false, hasTide: true, hasChem: false
  }
]

const NPCS = {
  laohuang: {
    name: '商人老黄',
    talk: '小伙子，最近收获不错啊。废弃楼那边好东西多，就是掠夺者不好惹。',
    options: ['打听同伴下落', '高价收我的货', '闲聊两句']
  },
  shaobing: {
    name: '掠夺者哨兵',
    talk: '这地盘是我们的，赶紧滚！……要不，意思意思？',
    options: ['给200金币买路', '赌一把偷偷捡', '转身离开']
  },
  yinshi: {
    name: '废土隐士',
    talk: '我在这沼泽边待了几十年，见过不少人沉下去……你找的那个人，我好像见过。',
    options: ['追问同伴消息', '用古董换线索', '给老人送点吃的']
  }
}

const COLLECTIONS = [
  { id: 0, name: '青铜吊坠', desc: '战前工艺品，工艺古朴', unlocked: false },
  { id: 1, name: '陶瓷碎片', desc: '青花瓷残片，落款清晰', unlocked: false },
  { id: 2, name: '古币', desc: '清代光绪年间铜钱', unlocked: false },
  { id: 3, name: '老邮票册', desc: '民国邮票合集，品相完好', unlocked: false },
  { id: 4, name: '翡翠扳指', desc: '冰种翡翠，价值不菲', unlocked: false },
  { id: 5, name: '紫檀木盒', desc: '小叶紫檀首饰盒', unlocked: false }
]

const SKILLS = [
  { id: 0, name: '快速拾取', maxLevel: 3, cost: [1,2,3] },
  { id: 1, name: '鹰眼术', maxLevel: 3, cost: [1,2,3] },
  { id: 2, name: '背包客', maxLevel: 3, cost: [1,2,3] },
  { id: 3, name: '拆解大师', maxLevel: 3, cost: [1,2,3] },
  { id: 4, name: '逃跑大师', maxLevel: 3, cost: [1,2,3] },
  { id: 5, name: '幸运儿', maxLevel: 3, cost: [1,2,3] }
]

const ENDINGS = {
  normal: { title: '【结局一】庇护之地', content: '你攒够了物资，在城郊搭建了自己的小型庇护所。围起栅栏，种上野菜，在末世里过上了安稳日子。那位同伴的下落，终究成了废土里的一声叹息。' },
  friend: { title: '【结局二】同伴重逢', content: '凭着五件信物，你终于在沼泽下游的营地找到了同伴。原来他当年遭遇兽潮受伤，被游商救下后失忆了。两人相对无言，最后只剩一句："好久不见。"' },
  collector: { title: '【结局三】末世收藏家', content: '六件战前古董全数现世，最大的幸存者营地亲自上门收购。你一夜暴富，从拾荒者变成了废土知名的古董商人。只是深夜里，你还是会想起当年翻垃圾堆的日子。' },
  king: { title: '【隐藏结局】废土之王', content: '你踏遍了整片废土，解锁了所有隐秘区域，收齐了全部古董。这片废土的地下世界，都流传着你的传说。没人知道你最终去了哪，只知道哪里有宝贝，哪里就有你的踪迹。' }
}

const WEATHERS = [
  { id: 0, name: '☀️ 晴天', rareBonus: 1, energyCost: 1 },
  { id: 1, name: '🌫️ 辐射尘', rareBonus: 1.6, energyCost: 1.5 }
]

const DAILY_TASK_TPL = [
  { id: 0, name: '拾荒新手', target: 20, reward: 100, sp: 1, type: 'pick', progress: 0, done: false },
  { id: 1, name: '拆解能手', target: 5, reward: 150, sp: 1, type: 'dis', progress: 0, done: false },
  { id: 2, name: '小有积蓄', target: 500, reward: 200, sp: 1, type: 'sell', progress: 0, done: false }
]

const WEEKLY_TASK_TPL = { name: '周常：废土行者', target: 200, reward: 1000, sp: 5, type: 'pick', progress: 0, done: false }

const TEAM_TASK_TPL = { name: '搜寻失落补给箱', desc: '传说中有一批战前补给掉落在废土深处，单靠一人很难找到，邀请好友一起助力搜寻吧。', target: 10, progress: 0, claimed: false }

// ==================== 页面逻辑 ====================
Page({
  data: {
    gold: 50,
    bagNum: 0,
    bagMax: 8,
    energy: 100,
    energyMax: 100,
    food: 100,
    foodMax: 100,
    debt: 0,

    mapId: 0,
    mapName: '城郊废土堆',
    mapList: MAPS,
    mapWarn: false,
    warnLevel: 0,
    isChasing: false,

    weatherId: 0,
    weatherText: '☀️ 晴天',
    tideTime: 0,

    garbageList: [],
    hasHiddenEntrance: false,

    bagPrice: 150,
    toolPrice: 400,
    flashPrice: 600,
    glovePrice: 500,
    breadPrice: 20,
    energyPrice: 40,
    hasTool: false,
    hasFlash: false,
    hasGloves: false,

    skillPoint: 1,
    skillList: SKILLS.map(s => ({ ...s, level: 0 })),

    storyProgress: 0,
    storyItems: [],
    currentQuest: '主线：在废土中寻找失散的同伴',
    endingProgress: 0,

    collection: COLLECTIONS,
    allCollection: COLLECTIONS,
    colUnlocked: 0,

    totalPick: 0,
    totalGold: 0,
    totalDis: 0,

    dailyTasks: [],
    dailyDone: 0,
    dailyTotal: 3,
    weeklyTask: {},
    lastDailyDate: '',
    lastWeeklyDate: '',

    rankList: [],
    teamTask: {},

    showShop: false,
    showSkill: false,
    showNpc: false,
    showLoan: false,
    showDaily: false,
    showRank: false,
    showTeam: false,
    showEvent: false,
    showDisassemble: false,
    showCollection: false,
    showEnding: false,

    currentNpc: NPCS.laohuang,
    eventData: {},
    hasDisItem: false,
    disRate: 0.3,
    critRate: 0.1,
    endingData: {}
  },

  onLoad() {
    const save = wx.getStorageSync('saveData')
    if (save) this.setData({ ...save })

    this.initDailyTasks()
    this.initTeamTask()
    const rank = wx.getStorageSync('rankList')
    if (rank) this.setData({ rankList: rank })

    this.randomWeather()
    this.refreshGarbage()
    this._statusTimer = this.startStatusLoop()
    this._tideTimer = setInterval(() => this.tideLoop(), 1000)
    this.checkEndingProgress()
  },

  // ========== 每日任务 ==========
  initDailyTasks() {
    const today = this.getTodayStr()
    const week = this.getWeekStr()

    if (this.data.lastDailyDate !== today) {
      const tasks = DAILY_TASK_TPL.map(t => ({ ...t, progress: 0, done: false }))
      this.setData({ dailyTasks: tasks, dailyDone: 0, lastDailyDate: today })
    }

    if (this.data.lastWeeklyDate !== week) {
      this.setData({ weeklyTask: { ...WEEKLY_TASK_TPL, progress: 0, done: false }, lastWeeklyDate: week })
    }

    this.updateDailyDone()
  },

  getTodayStr() {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
  },

  getWeekStr() {
    const d = new Date()
    const onejan = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7)
    return `${d.getFullYear()}-W${week}`
  },

  updateDailyDone() {
    const done = this.data.dailyTasks.filter(t => t.done).length
    this.setData({ dailyDone: done })
  },

  addTaskProgress(type, value) {
    let tasks = [...this.data.dailyTasks]
    tasks.forEach(t => {
      if (t.type === type && !t.done) t.progress = Math.min(t.target, t.progress + value)
    })

    let weekly = { ...this.data.weeklyTask }
    if (weekly.type === type && !weekly.done) weekly.progress = Math.min(weekly.target, weekly.progress + value)

    this.setData({ dailyTasks: tasks, weeklyTask: weekly })
    this.saveGame()
  },

  claimTask(e) {
    const id = Number(e.currentTarget.dataset.id)
    let tasks = [...this.data.dailyTasks]
    const task = tasks.find(t => t.id === id)
    if (!task || task.done || task.progress < task.target) return

    task.done = true
    this.setData({
      gold: this.data.gold + task.reward,
      skillPoint: this.data.skillPoint + task.sp,
      dailyTasks: tasks
    })
    this.updateDailyDone()
    wx.showToast({ title: `领取成功 +${task.reward}金` })
    this.saveGame()
  },

  claimWeekly() {
    let weekly = { ...this.data.weeklyTask }
    if (weekly.done || weekly.progress < weekly.target) return

    weekly.done = true
    this.setData({
      gold: this.data.gold + weekly.reward,
      skillPoint: this.data.skillPoint + weekly.sp,
      weeklyTask: weekly
    })
    wx.showToast({ title: `周常奖励 +${weekly.reward}金` })
    this.saveGame()
  },

  // ========== 协作任务 ==========
  initTeamTask() {
    const today = this.getTodayStr()
    const saveTeam = wx.getStorageSync('teamTask')

    if (!saveTeam || saveTeam.date !== today) {
      const team = { ...TEAM_TASK_TPL, date: today, progress: 0, claimed: false }
      wx.setStorageSync('teamTask', team)
      this.setData({ teamTask: team })
    } else {
      this.setData({ teamTask: saveTeam })
    }
  },

  claimTeam() {
    if (this.data.teamTask.claimed) return
    if (this.data.teamTask.progress < this.data.teamTask.target) return

    const rareItems = ITEMS.filter(it => it.baseValue >= 100)
    const item = rareItems[Math.floor(Math.random() * rareItems.length)]
    let gList = [...this.data.garbageList]
    gList.push({
      ...item,
      quality: 'rare',
      qualityText: '稀有',
      value: Math.floor(item.baseValue * 3),
      uniqueId: Date.now()
    })

    let team = { ...this.data.teamTask, claimed: true }
    this.setData({ garbageList: gList, teamTask: team })
    wx.setStorageSync('teamTask', team)
    wx.showModal({
      title: '🎉 协作完成！',
      content: `获得稀有物资【${item.name}】，已放入拾取区`,
      showCancel: false
    })
  },

  onShareAppMessage() {
    return {
      title: `我在《末世拾荒》里赚了${this.data.gold}金币，快来帮我助力！`,
      path: '/pages/index/index'
    }
  },

  // ========== 排行榜 ==========
  saveRank(endingName) {
    const record = { gold: this.data.gold, ending: endingName, time: Date.now() }
    let list = [...this.data.rankList]
    list.push(record)
    list.sort((a, b) => b.gold - a.gold)
    list = list.slice(0, 10)
    wx.setStorageSync('rankList', list)
    this.setData({ rankList: list })
  },

  // ========== 工具函数 ==========
  randomByWeight(weightArr) {
    let sum = weightArr.reduce((a, b) => a + b, 0)
    let r = Math.random() * sum
    for (let i = 0; i < weightArr.length; i++) {
      r -= weightArr[i]
      if (r <= 0) return ITEMS[i]
    }
    return ITEMS[0]
  },

  randomQuality() {
    const luckBonus = 1 + this.data.skillList[5].level * 0.1
    const weatherBonus = WEATHERS[this.data.weatherId].rareBonus
    const r = Math.random()

    let threshold = QUALITY.legend.rate * luckBonus * weatherBonus
    if (r < threshold) return 'legend'
    threshold += QUALITY.rare.rate * luckBonus * weatherBonus
    if (r < threshold) return 'rare'
    threshold += QUALITY.fine.rate * luckBonus * weatherBonus
    if (r < threshold) return 'fine'
    return 'common'
  },

  // ========== 拾取逻辑 ==========
  refreshGarbage() {
    const map = this.data.mapList[this.data.mapId]
    let list = []

    for (let i = 0; i < 6; i++) {
      const baseItem = this.randomByWeight(map.weight)
      const quality = this.randomQuality()
      const value = Math.floor(baseItem.baseValue * QUALITY[quality].multiplier)

      list.push({ ...baseItem, quality, qualityText: QUALITY[quality].name, value, uniqueId: Date.now() + i })
    }

    const hiddenChance = this.data.hasFlash ? 0.15 : 0.05
    const hasHidden = Math.random() < hiddenChance
    this.setData({ garbageList: list, hasHiddenEntrance: hasHidden })
  },

  pickItem(e) {
    const idx = e.currentTarget.dataset.index
    const item = this.data.garbageList[idx]
    const weather = WEATHERS[this.data.weatherId]
    const cost = Math.floor(6 * weather.energyCost * (this.data.hasGloves ? 0.7 : 1))

    if (this.data.bagNum >= this.data.bagMax) return wx.showToast({ title: '背包已满！', icon: 'none' })
    if (this.data.energy < cost) return wx.showToast({ title: '体力不足！', icon: 'none' })
    if (this.data.food <= 0) return wx.showToast({ title: '太饿了，捡不动', icon: 'none' })

    const map = this.data.mapList[this.data.mapId]
    let warnLevel = this.data.warnLevel
    if (map.hasWarn) {
      warnLevel = Math.min(100, warnLevel + 8 + Math.random() * 5)
      if (warnLevel >= 100 && !this.data.isChasing) this.startChase()
    }

    let energy = this.data.energy - cost
    if (map.hasChem && Math.random() < 0.1) {
      energy = Math.max(0, energy - 10)
      wx.showToast({ title: '被化学品溅到！-10体力', icon: 'none' })
    }

    let bagNum = this.data.bagNum + item.value
    let totalPick = this.data.totalPick + 1
    this.addTaskProgress('pick', 1)

    if (item.isStory) {
      let storyItems = [...this.data.storyItems]
      if (!storyItems.includes(item.storyId)) {
        storyItems.push(item.storyId)
        const progress = storyItems.length
        this.setData({
          storyItems, storyProgress: progress,
          currentQuest: `主线：收集同伴信物 (${progress}/5)`
        })
        wx.showModal({
          title: '✨ 发现信物！',
          content: `你捡到了【${item.name}】，这是同伴留下的第${progress}件信物。`,
          showCancel: false
        })
        if (progress >= 5) return this.triggerEnding('friend')
      }
    }

    if (item.isCollection) {
      let cols = [...this.data.collection]
      if (!cols[item.colId].unlocked) {
        cols[item.colId].unlocked = true
        const unlocked = cols.filter(c => c.unlocked).length
        this.setData({ collection: cols, allCollection: cols, colUnlocked: unlocked })
        wx.showModal({
          title: '💎 发现古董！',
          content: `【${item.name}】已存入图鉴`,
          showCancel: false
        })
        wx.vibrateShort({ type: 'medium' })
        if (unlocked >= 6) return this.triggerEnding('collector')
      }
    }

    let gList = [...this.data.garbageList]
    gList.splice(idx, 1)
    const newItem = this.randomByWeight(map.weight)
    const quality = this.randomQuality()
    gList.push({
      ...newItem, quality, qualityText: QUALITY[quality].name,
      value: Math.floor(newItem.baseValue * QUALITY[quality].multiplier),
      uniqueId: Date.now()
    })

    this.setData({ garbageList: gList, bagNum, energy, totalPick, warnLevel })

    if (Math.random() < 0.12) this.triggerRandomEvent()

    this.checkEndingProgress()
    this.saveGame()
  },

  // ========== 出售与地图 ==========
  sellAll() {
    const earn = this.data.bagNum
    const gold = this.data.gold + earn
    const totalGold = this.data.totalGold + earn

    let debt = this.data.debt
    let actualEarn = earn
    if (debt > 0) {
      const repay = Math.min(debt, earn)
      debt -= repay
      actualEarn -= repay
    }

    this.addTaskProgress('sell', earn)
    this.setData({ gold, bagNum: 0, totalGold, debt })
    wx.showToast({ title: `实际到账 +${actualEarn}金币` })

    let maps = [...this.data.mapList]
    let unlockFlag = false
    maps.forEach((m, i) => {
      if (!m.unlock && gold >= m.unlockCost) {
        maps[i].unlock = true
        unlockFlag = true
        wx.showModal({
          title: '🗺️ 新区域解锁',
          content: `【${m.name}】已开放！风险更高，物资也更珍贵。`,
          showCancel: false
        })
      }
    })
    if (unlockFlag) this.setData({ mapList: maps })

    if (gold >= 15000 && this.data.storyProgress < 5) this.triggerEnding('normal')

    this.checkEndingProgress()
    this.saveGame()
  },

  changeMap(e) {
    const mid = Number(e.currentTarget.dataset.id)
    const m = this.data.mapList[mid]
    if (!m.unlock) return

    this.setData({
      mapId: mid, mapName: m.name, mapWarn: m.hasWarn,
      warnLevel: 0, isChasing: false,
      currentNpc: NPCS[m.npc],
      tideTime: m.hasTide ? 60 : 0
    })
    this.refreshGarbage()
    this.randomWeather()
    this.saveGame()
  },

  // ========== 追捕系统 ==========
  startChase() {
    this.setData({ isChasing: true, warnLevel: 100 })
    wx.vibrateLong()

    setTimeout(() => {
      const escapeRate = 0.3 + this.data.skillList[4].level * 0.15
      if (Math.random() < escapeRate) {
        wx.showToast({ title: '成功甩掉掠夺者！' })
        this.setData({ isChasing: false, warnLevel: 30 })
      } else {
        const lossRate = 0.5 - this.data.skillList[4].level * 0.1
        const loss = Math.floor(this.data.bagNum * lossRate)
        this.setData({
          bagNum: Math.max(0, this.data.bagNum - loss),
          isChasing: false, warnLevel: 0
        })
        wx.showModal({
          title: '被抓住了！',
          content: `掠夺者抢走了你价值${loss}的物资，把你赶了出去。`,
          showCancel: false
        })
      }
      this.saveGame()
    }, 2000)
  },

  // ========== 辐射潮 ==========
  tideLoop() {
    if (!this.data.mapList[this.data.mapId].hasTide) return
    if (this.data.tideTime <= 0) {
      const loss = Math.floor(this.data.bagNum * 0.4)
      this.setData({ bagNum: Math.max(0, this.data.bagNum - loss), tideTime: 60 })
      wx.showModal({
        title: '☢️ 辐射潮来了！',
        content: `辐射浪潮淹没了沼泽，你损失了价值${loss}的物资。`,
        showCancel: false
      })
      this.refreshGarbage()
    } else {
      this.setData({ tideTime: this.data.tideTime - 1 })
    }
  },

  // ========== 隐藏密室 ==========
  enterHidden() {
    this.setData({ hasHiddenEntrance: false })

    if (Math.random() < 0.5) {
      const bonus = Math.floor(200 + Math.random() * 800)
      this.setData({ gold: this.data.gold + bonus, totalGold: this.data.totalGold + bonus })
      wx.showModal({
        title: '🏆 隐秘宝藏！',
        content: `你在密室里发现了一箱战前物资，卖了${bonus}金币！`,
        showCancel: false
      })
      wx.vibrateShort({ type: 'heavy' })
    } else {
      const damage = Math.floor(20 + Math.random() * 30)
      this.setData({ energy: Math.max(0, this.data.energy - damage) })
      wx.showModal({
        title: '⚠️ 遇险！',
        content: `密室里有陷阱，你损失了${damage}点体力，仓皇逃出。`,
        showCancel: false
      })
    }
    this.checkEndingProgress()
    this.saveGame()
  },

  // ========== 拆解系统 ==========
  openDisassemble() {
    const hasDis = this.data.garbageList.some(it => it.dis)
    const baseRate = this.data.hasTool ? 0.75 : 0.3
    const skillBonus = this.data.skillList[3].level * 0.1
    const critRate = 0.1 + this.data.skillList[5].level * 0.05

    this.setData({
      showDisassemble: true, hasDisItem: hasDis,
      disRate: Math.min(0.95, baseRate + skillBonus), critRate
    })
  },

  doDisassemble() {
    const disItems = this.data.garbageList.filter(it => it.dis)
    if (disItems.length === 0) return

    if (Math.random() < this.data.disRate) {
      let gain = Math.floor(disItems[0].value * 2.2)
      let isCrit = Math.random() < this.data.critRate
      if (isCrit) {
        gain *= 3
        wx.showToast({ title: `💥 拆解暴击！+${gain}金`, icon: 'none' })
        wx.vibrateShort({ type: 'medium' })
      } else {
        wx.showToast({ title: `拆解成功 +${gain}金` })
      }
      this.setData({
        gold: this.data.gold + gain,
        totalGold: this.data.totalGold + gain,
        totalDis: this.data.totalDis + 1
      })
      this.addTaskProgress('dis', 1)
    } else {
      wx.showToast({ title: '拆解失败，零件损坏', icon: 'none' })
    }

    let gList = [...this.data.garbageList]
    const idx = gList.findIndex(it => it.dis)
    if (idx > -1) gList.splice(idx, 1)
    const newItem = this.randomByWeight(this.data.mapList[this.data.mapId].weight)
    const quality = this.randomQuality()
    gList.push({
      ...newItem, quality, qualityText: QUALITY[quality].name,
      value: Math.floor(newItem.baseValue * QUALITY[quality].multiplier),
      uniqueId: Date.now()
    })

    this.setData({ garbageList: gList, showDisassemble: false })
    this.checkEndingProgress()
    this.saveGame()
  },

  // ========== 商店与技能 ==========
  openShop() { this.setData({ showShop: true }) },
  openSkill() { this.setData({ showSkill: true }) },
  openDaily() { this.setData({ showDaily: true }) },
  openRank() { this.setData({ showRank: true }) },
  openTeam() { this.setData({ showTeam: true }) },

  buyBag() {
    if (this.data.gold >= this.data.bagPrice) {
      this.setData({
        gold: this.data.gold - this.data.bagPrice,
        bagMax: this.data.bagMax + 4,
        bagPrice: Math.floor(this.data.bagPrice * 1.7)
      })
      wx.showToast({ title: '背包扩容成功' })
      this.saveGame()
    } else wx.showToast({ title: '金币不足', icon: 'none' })
  },

  buyTool() {
    if (this.data.hasTool) return wx.showToast({ title: '已拥有', icon: 'none' })
    if (this.data.gold >= this.data.toolPrice) {
      this.setData({ gold: this.data.gold - this.data.toolPrice, hasTool: true })
      wx.showToast({ title: '获得拆解钳' })
      this.saveGame()
    } else wx.showToast({ title: '金币不足', icon: 'none' })
  },

  buyFlash() {
    if (this.data.hasFlash) return wx.showToast({ title: '已拥有', icon: 'none' })
    if (this.data.gold >= this.data.flashPrice) {
      this.setData({ gold: this.data.gold - this.data.flashPrice, hasFlash: true })
      wx.showToast({ title: '获得强光手电' })
      this.saveGame()
    } else wx.showToast({ title: '金币不足', icon: 'none' })
  },

  buyGloves() {
    if (this.data.hasGloves) return wx.showToast({ title: '已拥有', icon: 'none' })
    if (this.data.gold >= this.data.glovePrice) {
      this.setData({ gold: this.data.gold - this.data.glovePrice, hasGloves: true })
      wx.showToast({ title: '获得防护手套' })
      this.saveGame()
    } else wx.showToast({ title: '金币不足', icon: 'none' })
  },

  buyBread() {
    if (this.data.gold >= this.data.breadPrice) {
      this.setData({
        gold: this.data.gold - this.data.breadPrice,
        food: Math.min(this.data.foodMax, this.data.food + 30)
      })
      wx.showToast({ title: '饱食+30' })
      this.saveGame()
    } else wx.showToast({ title: '金币不足', icon: 'none' })
  },

  buyEnergy() {
    if (this.data.gold >= this.data.energyPrice) {
      this.setData({
        gold: this.data.gold - this.data.energyPrice,
        energy: Math.min(this.data.energyMax, this.data.energy + 50)
      })
      wx.showToast({ title: '体力+50' })
      this.saveGame()
    } else wx.showToast({ title: '金币不足', icon: 'none' })
  },

  levelSkill(e) {
    const id = Number(e.currentTarget.dataset.id)
    const skill = this.data.skillList[id]
    if (skill.level >= skill.maxLevel) return wx.showToast({ title: '已满级', icon: 'none' })
    const cost = skill.cost[skill.level]
    if (this.data.skillPoint < cost) return wx.showToast({ title: '技能点不足', icon: 'none' })

    let skills = [...this.data.skillList]
    skills[id].level += 1
    let bagMax = this.data.bagMax
    if (id === 2) bagMax += 2

    this.setData({ skillPoint: this.data.skillPoint - cost, skillList: skills, bagMax })
    wx.showToast({ title: `${skill.name}升级成功` })
    this.saveGame()
  },

  // ========== NPC与借贷 ==========
  openNpc() { this.setData({ showNpc: true }) },
  openLoan() { this.setData({ showLoan: true }) },

  npcSelect(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const npc = this.data.currentNpc

    if (npc.name === '商人老黄' && idx === 0) {
      wx.showModal({ title: '老黄', content: '听说你同伴当年在沼泽那边出事了，你可以去那边碰碰运气。', showCancel: false })
    } else if (npc.name === '掠夺者哨兵' && idx === 0) {
      if (this.data.gold >= 200) {
        this.setData({ gold: this.data.gold - 200, warnLevel: 0 })
        wx.showToast({ title: '哨兵放你一马' })
      } else wx.showToast({ title: '钱不够', icon: 'none' })
    } else if (npc.name === '废土隐士' && idx === 0) {
      wx.showModal({ title: '隐士', content: '那个人……好像往东边去了。你找他做什么？都过去这么多年了。', showCancel: false })
    }

    this.setData({ showNpc: false })
    this.saveGame()
  },

  borrowMoney() {
    this.setData({ gold: this.data.gold + 500, debt: this.data.debt + 600 })
    wx.showToast({ title: '到账500金币，负债+600' })
    this.saveGame()
  },

  repayMoney() {
    const repay = Math.min(this.data.debt, this.data.gold)
    this.setData({ gold: this.data.gold - repay, debt: this.data.debt - repay })
    wx.showToast({ title: `还款${repay}金币` })
    this.saveGame()
  },

  // ========== 随机事件 ==========
  triggerRandomEvent() {
    const events = [
      {
        title: '🚛 补给车倾覆！',
        content: '一辆废弃补给车刚被发现，短时间内稀有物资概率大幅提升！',
        options: ['太棒了！'],
        cb: () => {
          const rareItems = ITEMS.filter(it => it.baseValue > 100)
          const item = rareItems[Math.floor(Math.random() * rareItems.length)]
          let gList = [...this.data.garbageList]
          gList.push({ ...item, quality: 'rare', qualityText: '稀有', value: Math.floor(item.baseValue * 3), uniqueId: Date.now() })
          this.setData({ garbageList: gList })
        }
      },
      {
        title: '👮 巡逻队突击！',
        content: '掠夺者巡逻队突然出现，赶紧把值钱的藏好！',
        options: ['赶紧跑'],
        cb: () => {
          const loss = Math.floor(this.data.bagNum * 0.3)
          this.setData({ bagNum: Math.max(0, this.data.bagNum - loss) })
          wx.showToast({ title: `损失${loss}价值物资`, icon: 'none' })
        }
      },
      {
        title: '🧙 神秘游商',
        content: '一个戴兜帽的游商问你要不要赌一把，100金币抽一次，可能血赚可能血亏。',
        options: ['赌一把！', '算了'],
        cb: (sel) => {
          if (sel === 0) {
            if (this.data.gold < 100) return wx.showToast({ title: '钱不够', icon: 'none' })
            if (Math.random() < 0.5) {
              const win = 300 + Math.floor(Math.random() * 500)
              this.setData({ gold: this.data.gold - 100 + win })
              wx.showToast({ title: `赚了${win}金币！` })
            } else {
              this.setData({ gold: this.data.gold - 100 })
              wx.showToast({ title: '亏了100金币', icon: 'none' })
            }
          }
        }
      },
      {
        title: '💸 捡到腰包',
        content: '你捡到一个遗落的腰包，里面有300金币。上交营地还是自留？',
        options: ['自留', '上交'],
        cb: (sel) => {
          if (sel === 0) {
            this.setData({ gold: this.data.gold + 300 })
            wx.showToast({ title: '到手300金币' })
          } else {
            wx.showToast({ title: '获得营地声望+1', icon: 'none' })
          }
        }
      }
    ]

    const evt = events[Math.floor(Math.random() * events.length)]
    this._eventCB = evt.cb
    this.setData({
      showEvent: true,
      eventData: { title: evt.title, content: evt.content, options: evt.options }
    })
  },

  eventSelect(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (this._eventCB) this._eventCB(idx)
    this.setData({ showEvent: false })
    this.saveGame()
  },

  // ========== 天气与状态 ==========
  randomWeather() {
    const id = Math.random() < 0.7 ? 0 : 1
    this.setData({ weatherId: id, weatherText: WEATHERS[id].name })
  },

  startStatusLoop() {
    return setInterval(() => {
      let { energy, energyMax, food, foodMax } = this.data
      food = Math.max(0, food - 1)

      if (food <= 0) {
        energy = Math.max(0, energy - 2)
      } else {
        energy = Math.min(energyMax, energy + 0.8)
      }

      let warnLevel = this.data.warnLevel
      if (warnLevel > 0 && !this.data.isChasing) warnLevel = Math.max(0, warnLevel - 1)

      this.setData({ energy, food, warnLevel })
      this.saveGame()
    }, 3000)
  },

  // ========== 结局系统 ==========
  checkEndingProgress() {
    let progress = 0
    progress += Math.min(25, (this.data.gold / 15000) * 25)
    progress += Math.min(25, (this.data.storyProgress / 5) * 25)
    progress += Math.min(25, (this.data.colUnlocked / 6) * 25)
    const unlockedMaps = this.data.mapList.filter(m => m.unlock).length
    progress += Math.min(25, (unlockedMaps / 4) * 25)

    const allCol = this.data.colUnlocked >= 6
    const allStory = this.data.storyProgress >= 5
    const allMap = unlockedMaps >= 4
    if (allCol && allStory && allMap && this.data.totalPick >= 500) {
      return this.triggerEnding('king')
    }

    this.setData({ endingProgress: Math.floor(progress) })
  },

  triggerEnding(type) {
    const endingName = ENDINGS[type].title.replace(/【.*?】/, '').trim()
    this.saveRank(endingName)
    this.setData({ showEnding: true, endingData: ENDINGS[type] })
  },

  restartGame() {
    clearInterval(this._statusTimer)
    clearInterval(this._tideTimer)
    wx.removeStorageSync('saveData')
    wx.showModal({
      title: '重新开始',
      content: '游戏已重置，即将刷新',
      showCancel: false,
      success: () => {
        this.onLoad()
        this.setData({ showEnding: false })
      }
    })
  },

  // ========== 通用 ==========
  openCollection() { this.setData({ showCollection: true }) },

  saveAndRefresh() {
    this.refreshGarbage()
    wx.showToast({ title: '已刷新', icon: 'none' })
  },

  closePanel() {
    this.setData({
      showShop: false, showSkill: false, showNpc: false, showLoan: false,
      showDaily: false, showRank: false, showTeam: false,
      showEvent: false, showDisassemble: false, showCollection: false
    })
  },

  saveGame() {
    const save = {
      gold: this.data.gold, bagNum: this.data.bagNum, bagMax: this.data.bagMax,
      energy: this.data.energy, food: this.data.food, debt: this.data.debt,
      mapList: this.data.mapList, mapId: this.data.mapId,
      hasTool: this.data.hasTool, hasFlash: this.data.hasFlash, hasGloves: this.data.hasGloves,
      skillPoint: this.data.skillPoint, skillList: this.data.skillList,
      storyItems: this.data.storyItems, storyProgress: this.data.storyProgress,
      collection: this.data.collection,
      totalPick: this.data.totalPick, totalGold: this.data.totalGold, totalDis: this.data.totalDis,
      bagPrice: this.data.bagPrice, toolPrice: this.data.toolPrice,
      flashPrice: this.data.flashPrice, glovePrice: this.data.glovePrice,
      dailyTasks: this.data.dailyTasks, weeklyTask: this.data.weeklyTask,
      lastDailyDate: this.data.lastDailyDate, lastWeeklyDate: this.data.lastWeeklyDate
    }
    wx.setStorageSync('saveData', save)
  }
})
