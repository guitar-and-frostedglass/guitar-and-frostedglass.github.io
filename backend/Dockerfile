# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app

# 复制 package files
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 生成 Prisma client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# 复制必要文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 设置用户
USER expressjs

# 暴露端口
EXPOSE 4000

# 启动命令
CMD ["npm", "start"]

