import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import noteRoutes from './routes/notes.js'
import adminRoutes from './routes/admin.js'
import { errorHandler } from './middleware/errorHandler.js'
import { seedAdmin } from './controllers/authController.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:3000'
const corsOrigins = corsOriginEnv.includes(',')
  ? corsOriginEnv.split(',').map(o => o.trim())
  : corsOriginEnv

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/admin', adminRoutes)

app.use((_req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' })
})

app.use(errorHandler)

async function start() {
  await seedAdmin()
  app.listen(PORT, () => {
    console.log(`🎸 Guitar & Frosted Glass API 运行在 http://localhost:${PORT}`)
  })
}

start().catch(console.error)

export default app
