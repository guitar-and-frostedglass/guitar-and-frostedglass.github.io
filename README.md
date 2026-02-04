# 🎸 Guitar & Frosted Glass - 共享日记

一个支持多人协作的便签式日记应用。

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
- JWT (认证)

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
npm install

# 设置数据库连接 (复制 .env.example 到 .env 并配置)
cp .env.example .env

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

## 部署

- 前端: GitHub Pages (通过 GitHub Actions 自动部署)
- 后端: Oracle Free Tier (Docker)

详细部署指南请查看 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## License

MIT

