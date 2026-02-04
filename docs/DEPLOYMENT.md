# 部署指南

本文档介绍如何部署 Guitar & Frosted Glass 应用。

## 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│    GitHub Pages         │     │   Oracle Free Tier          │
│  (静态前端 React App)    │────>│   Docker + PostgreSQL       │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## 前端部署 (GitHub Pages)

### 自动部署

前端代码会在推送到 `main` 分支时自动部署到 GitHub Pages。

1. 在 GitHub 仓库设置中启用 GitHub Pages
2. 设置 Repository Variables:
   - `API_URL`: 后端 API 地址（例如 `https://your-server.com/api`）

### 手动部署

```bash
cd frontend
npm install
VITE_API_URL=https://your-api-url.com/api npm run build
# 将 dist/ 目录内容上传到 GitHub Pages
```

---

## 后端部署 (Oracle Free Tier)

### 1. 准备 Oracle 云实例

1. 创建 Oracle Cloud 账号并申请 Free Tier
2. 创建一个 VM 实例（推荐 Ubuntu 22.04）
3. 配置安全组规则，开放端口：
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)
   - 4000 (API，可选)

### 2. 连接服务器并安装依赖

```bash
# SSH 连接到服务器
ssh ubuntu@your-server-ip

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin -y

# 重新登录以使 docker 组生效
exit
# 重新 SSH 连接
```

### 3. 部署后端

```bash
# 克隆代码
git clone https://github.com/yourusername/guitar-and-frostedglass-dev.git
cd guitar-and-frostedglass-dev/backend

# 创建环境变量文件
cat > .env << EOF
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres:your-strong-password@postgres:5432/guitar_frostedglass
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourusername.github.io
EOF

# 修改 docker-compose.yml 中的 PostgreSQL 密码
# 确保与 DATABASE_URL 中的密码一致

# 启动服务
docker compose up -d

# 运行数据库迁移
docker compose exec api npx prisma migrate deploy

# 检查服务状态
docker compose ps
docker compose logs -f api
```

### 4. 配置 Nginx 反向代理 + SSL

```bash
# 安装 Nginx 和 Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/api << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

### 5. 设置自动更新（可选）

创建更新脚本 `/home/ubuntu/update-api.sh`:

```bash
#!/bin/bash
cd /home/ubuntu/guitar-and-frostedglass-dev
git pull
cd backend
docker compose down
docker compose build
docker compose up -d
docker compose exec -T api npx prisma migrate deploy
```

设置 Webhook 或定时任务来触发更新。

---

## 环境变量说明

### 前端 (.env)

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_URL` | 后端 API 地址 | `https://api.example.com/api` |

### 后端 (.env)

| 变量 | 说明 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `4000` |
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥 | 随机生成的强密钥 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `CORS_ORIGIN` | 允许的跨域来源 | `https://user.github.io` |

---

## 常见问题

### Q: 前端无法连接后端

1. 检查 `VITE_API_URL` 是否正确配置
2. 检查后端 `CORS_ORIGIN` 是否包含前端域名
3. 检查服务器防火墙规则

### Q: 数据库连接失败

1. 检查 `DATABASE_URL` 格式是否正确
2. 检查 PostgreSQL 容器是否正常运行
3. 运行 `docker compose logs postgres` 查看日志

### Q: SSL 证书问题

1. 确保域名已正确解析到服务器 IP
2. 运行 `sudo certbot renew --dry-run` 测试续期
3. 检查 Nginx 配置语法

---

## 备份与恢复

### 备份数据库

```bash
docker compose exec postgres pg_dump -U postgres guitar_frostedglass > backup.sql
```

### 恢复数据库

```bash
docker compose exec -T postgres psql -U postgres guitar_frostedglass < backup.sql
```

