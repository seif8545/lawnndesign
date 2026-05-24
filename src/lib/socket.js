import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3001'

let socket = null

export function getSocket() {
  return socket
}

export function connectSocket(token) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.warn('[socket] connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
