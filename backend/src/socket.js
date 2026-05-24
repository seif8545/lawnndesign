import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from './lib/prisma.js'

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // ── Auth middleware ──────────────────────────────────────────────────────────
  // Every connecting socket must provide a valid JWT in handshake.auth.token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Unauthorized'))
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET)
      next()
    } catch {
      next(new Error('Token invalid or expired'))
    }
  })

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', async socket => {
    const { id: userId, role } = socket.user

    // Join all conversation rooms this user is a participant in
    const myConvos = await prisma.conversation.findMany({
      where: { OR: [{ clientId: userId }, { talentId: userId }] },
      select: { id: true },
    })
    myConvos.forEach(c => socket.join(`conv:${c.id}`))

    // Admins silently join every conversation room
    if (role === 'admin') {
      const allConvos = await prisma.conversation.findMany({ select: { id: true } })
      allConvos.forEach(c => socket.join(`conv:${c.id}`))
    }

    // ── send_message ────────────────────────────────────────────────────────
    socket.on('send_message', async ({ conversationId, content, fileUrl, fileName, fileMime }) => {
      if (!conversationId || !content?.trim()) return

      // Verify sender is a participant (admins cannot send)
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
      if (!conv) return
      if (conv.clientId !== userId && conv.talentId !== userId) return

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content:  content.trim(),
          fileUrl:  fileUrl  || null,
          fileName: fileName || null,
          fileMime: fileMime || null,
        },
        include: {
          sender: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
        },
      })

      // Update conversation's updatedAt so list sorts correctly
      await prisma.conversation.update({
        where: { id: conversationId },
        data:  { updatedAt: new Date() },
      })

      // Broadcast to everyone in the room (both participants + any admin)
      io.to(`conv:${conversationId}`).emit('message', message)
    })

    // ── typing indicator ────────────────────────────────────────────────────
    socket.on('typing', ({ conversationId, isTyping }) => {
      // Broadcast to the room but NOT back to the sender
      socket.to(`conv:${conversationId}`).emit('typing', { userId, isTyping })
    })

    // ── mark_read ───────────────────────────────────────────────────────────
    socket.on('mark_read', async ({ conversationId }) => {
      // Mark all messages in this conversation not sent by this user as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt:   null,
        },
        data: { readAt: new Date() },
      })
      // Tell the other participant their messages were read
      socket.to(`conv:${conversationId}`).emit('messages_read', { conversationId, readBy: userId })
    })

    // ── new_conversation (admin join hook) ──────────────────────────────────
    // When a new conversation is created via REST, the server notifies admins
    // so they can join the new room without reconnecting
    socket.on('join_conversation', ({ conversationId }) => {
      const conv_check = prisma.conversation.findUnique({ where: { id: conversationId } }).then(conv => {
        if (!conv) return
        const isParticipant = conv.clientId === userId || conv.talentId === userId
        if (isParticipant || role === 'admin') {
          socket.join(`conv:${conversationId}`)
        }
      })
    })
  })

  return io
}
