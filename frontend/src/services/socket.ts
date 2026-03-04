import { io, Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const WS_URL = API_BASE_URL.replace(/\/api\/?$/, '')

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (socket?.connected) return socket

  const token = sessionStorage.getItem('token')
  if (!token) throw new Error('No auth token')

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected')
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connect error:', err.message)
    if (err.message.includes('认证') || err.message.includes('token')) {
      disconnectSocket()
    }
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
