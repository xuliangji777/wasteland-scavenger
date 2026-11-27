// 地图资源分包占位页（用于随 preloadRule 静默预载 /pkg_maps/assets/* 场景底图）
Page({
  onLoad() {
    wx.redirectTo({
      url: '/pkg_game/pages/world/world'
    });
  }
});
