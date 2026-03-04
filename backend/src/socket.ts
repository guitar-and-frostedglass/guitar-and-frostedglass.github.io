import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

let io: Server | null = null

interface JwtPayload {
  userId: string
}

export function initSocket(httpServer: HttpServer, corsOrigins: string | string[]) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  })

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('未提供认证令牌'))

    const secret = process.env.JWT_SECRET
    if (!secret) return next(new Error('服务器配置错误'))

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload
      socket.data.userId = decoded.userId
      next()
    } catch {
      next(new Error('无效的认证令牌'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    console.log(`🔌 Socket connected: ${userId} (${socket.id})`)

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} (${reason})`)
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized')
  return io
}
