# Guitar & Frosted Glass - Mobile App

Expo (React Native) iPhone 应用，与 Web 端共享核心业务逻辑。

## 开发环境

### 前置条件

- Node.js 20+
- Expo CLI: `npm install -g eas-cli`
- iOS 模拟器 (Xcode) 或 Expo Go app

### 安装依赖

```bash
cd mobile
npm install
```

### 启动开发

```bash
# 在 iOS 模拟器运行
npm run ios

# 或启动 Expo 开发服务器
npm start
```

## 项目结构

```
mobile/
├── App.tsx                # 入口 (导航配置)
├── src/
│   ├── config.ts          # API URL 配置
│   ├── platform.ts        # 平台适配器 (SecureStore, Navigation)
│   ├── theme.ts           # 颜色/主题常量
│   ├── navigation.ts      # 导航类型定义
│   ├── services/          # API 服务 (thin wrappers around shared/)
│   ├── stores/            # Zustand stores (thin wrappers around shared/)
│   ├── components/        # 通用组件
│   └── screens/           # 页面
│       ├── LoginScreen
│       ├── RegisterScreen
│       ├── DashboardScreen
│       ├── NoteThreadScreen
│       ├── ProfileScreen
│       └── AdminScreen
├── metro.config.js        # Metro bundler 配置 (引入 shared/)
├── eas.json               # EAS Build 配置
└── app.json               # Expo 应用配置
```

## 代码共享

核心业务逻辑在 `shared/` 目录，web 和 mobile 共用：

- `shared/types/` - TypeScript 接口
- `shared/adapters.ts` - 平台适配器接口
- `shared/services/` - API 调用逻辑
- `shared/stores/` - Zustand 状态管理

Mobile 通过 `platform.ts` 提供 iOS 专属实现 (SecureStore, React Navigation)。

## 构建发布

### 1. 登录 EAS

```bash
eas login
```

### 2. 配置 Apple Developer

在 `eas.json` 的 `submit.production.ios` 中填入：

- `appleId`: Apple ID 邮箱
- `ascAppId`: App Store Connect 中的 App ID
- `appleTeamId`: Apple Developer Team ID

### 3. 本地开发构建 (模拟器)

```bash
eas build --profile development --platform ios
```

### 4. TestFlight 构建

```bash
eas build --profile production --platform ios
eas submit --platform ios
```

### 5. App Store 发布

在 App Store Connect 中提交审核。
