# 🎸 Guitar & Frosted Glass

一个支持多人协作的便签应用。所有用户共享便签板，每个便签都是一个聊天话题，所有人都可以参与回复。

## 功能

- **邀请制注册** — 管理员生成 15 分钟有效的邀请码，只有持有邀请码的人才能注册
- **邮箱 / 昵称登录** — 用邮箱或注册时的昵称 + 密码登录
- **共享便签板** — 所有人的便签在同一个面板上，以卡片网格展示
- **便签话题 & 回复** — 每个便签是一个聊天窗口，任何人都可以在里面不断回复
- **管理后台** — 管理员可以管理用户、生成邀请码、调整角色

## 项目结构

```
guitar-and-frostedglass-dev/
├── frontend/          # React 前端 (部署到 GitHub Pages)
├── backend/           # Node.js 后端 (部署到 Oracle Free Tier)
├── shared/            # 前后端共享的类型定义
└── docs/              # 项目文档
```

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- TailwindCSS (样式)
- Zustand (状态管理)
- React Router (路由)

### 后端
- Node.js + Express + TypeScript
- Prisma (ORM)
- PostgreSQL (数据库)
- JWT (认证) + bcryptjs (密码哈希)

## 快速开始

### 后端开发

```bash
cd backend
npm install

# 设置环境变量
cp .env.example .env
# 编辑 .env，配置数据库连接和管理员账号

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器 (自动创建管理员账号)
npm run dev
```

### 前端开发

```bash
cd frontend
npm install

# 连接本地后端
npm run dev

# 或连接远程 dev API
VITE_API_URL=https://gfg-api.duckdns.org/dev-api npm run dev
```

### 首次使用

1. 启动后端后，系统自动用 `.env` 里的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 创建管理员
2. 用管理员账号登录前端
3. 进入管理后台，生成邀请码
4. 将邀请码发给要注册的人（15 分钟有效）
5. 注册成功后即可使用共享便签板

## 部署

- 前端: GitHub Pages (通过 GitHub Actions 自动部署)
- 后端: Oracle Free Tier (Docker)

详细部署指南请查看 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## License

MIT
