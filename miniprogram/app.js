// 《墨土拾荒录》原生个人微信小程序入口
App({
  globalData: {
    studioName: '老年饼工作室',
    gameTitle: '墨土拾荒录',
    version: '20.0.0',
    systemInfo: null
  },

  onLaunch() {
    try {
      const info = typeof wx.getWindowInfo === 'function'
        ? wx.getWindowInfo()
        : wx.getSystemInfoSync();
      this.globalData.systemInfo = info;
    } catch (_) {
      this.globalData.systemInfo = null;
    }

    // 预加载游戏与地图分包，确保开屏结束后瞬间切入 2.5D 世界
    if (typeof wx.loadSubpackage === 'function') {
      ['pkg_game', 'pkg_maps'].forEach((name) => {
        try {
          wx.loadSubpackage({
            name,
            fail() {}
          });
        } catch (_) {}
      });
    }
  }
});
