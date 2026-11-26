# 末世拾荒 · 安卓 App 打包指南

当前项目已完成 **PWA 桌面安装** 与 **Capacitor 安卓原生封装配置**。

## 方式一：手机浏览器免安装直装（PWA）
1. 将 `web/` 目录部署到任意 HTTPS 地址（或局域网调试）。
2. 使用安卓 Chrome / Edge 打开页面，点击右上角菜单 **「添加到主屏幕 / 安装应用」**，即可作为全屏独立 App 运行并支持离线缓存。

## 方式二：打包成正式 `.apk` 安装包（Capacitor）
> 需在已安装 **Android Studio / Android SDK** 的电脑上执行（当前测试机未安装 Android SDK，故已预先生成配置文件）：

```bash
# 1. 安装 Capacitor 依赖
npm install

# 2. 生成原生 android/ 工程
npx cap add android

# 3. 将最新 web/ 代码同步进安卓工程
npx cap sync android

# 4. 用 Android Studio 打开工程，点击 Build -> Build APK(s)
npx cap open android
```
