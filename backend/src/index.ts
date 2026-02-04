import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import noteRoutes from './routes/notes.js'
import { errorHandler } from './middleware/errorHandler.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// 中间件
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' })
})

// 错误处理
app.use(errorHandler)

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎸 Guitar & Frosted Glass API 运行在 http://localhost:${PORT}`)
})

export default app

