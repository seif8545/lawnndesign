import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from './lib/prisma.js'
import { safeUrl } from './lib/sanitize.js'
import { checkMessage } from './lib/chatFilter.js'
import { signPrivateRead } from './routes/uploads.js'
import { cookieAuthEnabled, readCookie, SESSION_COOKIE } from './lib/cookies.js'

// The handshake token comes from auth.token (current client) or, when cookie
// auth is enabled, the httpOnly session cookie sent on the WS upgrade request.
function handshakeToken(socket) {
  const fromAuth = socket.handshake.auth?.token
  if (fromAuth) return fromAuth
  if (cookieAuthEnabled()) return readCookie(socket.handshake, SESSION_COOKIE)
  return null
}

export function initSocket(httpServer) {
  // Match the REST layer: support a comma-separated list of allowed origins
  // rather than treating the whole string as one literal origin.
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  })

  // ── Auth middleware ──────────────────────────────────────────────────────────
  // Every connecting socket must provide a valid JWT in handshake.auth.token.
  // Mirror the REST `requireAuth`: a valid signature isn't enough — the account
  // must still exist and not be suspended. Otherwise a banned/deleted user with
  // an unexpired 7-day token keeps full realtime chat access (sending messages,
  // observing rooms), defeating the instant-ban guarantee the HTTP layer gives.
  io.use(async (socket, next) => {
    const token = handshakeToken(socket)
    if (!token) return next(new Error('Unauthorized'))
    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return next(new Error('Token invalid or expired'))
    }
    if (!payload?.id) return next(new Error('Unauthorized'))
    // Look up the live account so role + active-status come from the DB, never
    // from the (possibly stale) token claims.
    const user = await prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, role: true, suspended: true, tokenVersion: true },
    }).catch(() => null)
    if (!user || user.suspended) return next(new Error('Account is no longer active'))
    // Reject tokens invalidated by a password change (tokenVersion bump).
    if ((payload.tv ?? 0) !== user.tokenVersion) return next(new Error('Session expired'))
    socket.user = { id: user.id, role: user.role }
    next()
  })

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', async socket => {
    const { id: userId, role } = socket.user

    // Join all conversation rooms this user is a participant in. Never let a
    // DB hiccup here become an unhandled rejection (which would kill the process).
    try {
      const myConvos = await prisma.conversation.findMany({
        where: { OR: [{ clientId: userId }, { talentId: userId }, { adminId: userId }] },
        select: { id: true },
      })
      myConvos.forEach(c => socket.join(`conv:${c.id}`))
    } catch (err) {
      console.error('[socket] failed to join conversation rooms:', err)
    }

    // Admins join ONE broadcast room instead of every conversation room —
    // O(1) joins no matter how many conversations exist. Message broadcasts
    // target the conversation room + this room (socket.io de-dupes the union,
    // so a participating admin still receives each message exactly once).
    if (role === 'admin') socket.join('admins')

    // ── send_message ────────────────────────────────────────────────────────
    socket.on('send_message', async ({ conversationId, content, fileUrl, fileName, fileMime } = {}) => {
      try {
        if (!conversationId || !content?.trim()) return
        // Cap message length. Socket payloads bypass the REST express.json('1mb')
        // limit, so without this a client could persist arbitrarily large strings.
        const body = content.trim().slice(0, 5000)

        // Content rules: block phone numbers + off-site payment/contact keywords.
        // The client blocks these pre-send; this is the server-side backstop so
        // a direct socket call can't bypass it. Tell the sender why.
        const check = checkMessage(body)
        if (check.blocked) {
          socket.emit('message_rejected', { reason: check.reason })
          return
        }

        // Verify sender is a participant (client, student, or the admin on an
        // admin-initiated thread). Admins observing others' threads can't send.
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
        if (!conv) return
        if (conv.clientId !== userId && conv.talentId !== userId && conv.adminId !== userId) return

        // Ensure the sender is subscribed to this room before broadcasting, so a
        // conversation created after they connected (e.g. started from a
        // marketplace listing) still echoes their own message back to them.
        socket.join(`conv:${conversationId}`)

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content:  body,
            fileUrl:  safeUrl(fileUrl),
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

        // Private attachments are stored as paths — broadcast a signed URL so the
        // recipients can actually open the file.
        const outgoing = message.fileUrl && !/^https?:\/\//i.test(message.fileUrl)
          ? { ...message, fileUrl: await signPrivateRead(message.fileUrl) }
          : message

        // Broadcast to everyone in the room (both participants + any admin)
        io.to(`conv:${conversationId}`).to('admins').emit('message', outgoing)
      } catch (err) {
        console.error('[socket] send_message failed:', err)
      }
    })

    // ── typing indicator ────────────────────────────────────────────────────
    socket.on('typing', ({ conversationId, isTyping }) => {
      // Broadcast to the room but NOT back to the sender
      socket.to(`conv:${conversationId}`).emit('typing', { userId, isTyping })
    })

    // ── mark_read ───────────────────────────────────────────────────────────
    socket.on('mark_read', async ({ conversationId } = {}) => {
      try {
        if (!conversationId) return
        // Only a participant may clear unread state on a thread. (Admins observing
        // others' threads shouldn't flip read receipts on conversations they're
        // merely watching.)
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
        if (!conv) return
        if (conv.clientId !== userId && conv.talentId !== userId && conv.adminId !== userId) return

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
      } catch (err) {
        console.error('[socket] mark_read failed:', err)
      }
    })

    // ── new_conversation (admin join hook) ──────────────────────────────────
    // When a new conversation is created via REST, the server notifies admins
    // so they can join the new room without reconnecting
    socket.on('join_conversation', async ({ conversationId } = {}) => {
      try {
        if (!conversationId) return
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
        if (!conv) return
        const isParticipant = conv.clientId === userId || conv.talentId === userId || conv.adminId === userId
        if (isParticipant || role === 'admin') {
          socket.join(`conv:${conversationId}`)
        }
      } catch (err) {
        console.error('[socket] join_conversation failed:', err)
      }
    })
  })

  return io
}
