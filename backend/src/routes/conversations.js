import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

// ── List conversations for the current user (admin sees all) ──────────────────
router.get('/', async (req, res) => {
  const { id: userId, role } = req.user

  const where = role === 'admin'
    ? {}
    : { OR: [{ clientId: userId }, { talentId: userId }] }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
      talent: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
      project: { select: { id: true, title: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  })

  // Attach unread count for each conversation
  const withUnread = await Promise.all(
    conversations.map(async conv => {
      const unreadCount = role === 'admin' ? 0 : await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          readAt: null,
        },
      })
      return { ...conv, unreadCount }
    })
  )

  res.json(withUnread)
})

// ── Get or create a conversation between two users ────────────────────────────
// Body: { otherUserId, projectId? }
// Roles are derived from the DB, never trusted from the request body.
router.post('/', async (req, res) => {
  const { id: userId, role } = req.user
  // Accept `talentId` as a legacy alias so the existing frontend keeps working.
  const otherUserId = req.body.otherUserId || req.body.talentId
  const { projectId } = req.body

  if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' })
  if (otherUserId === userId) return res.status(400).json({ error: 'Cannot start a conversation with yourself' })
  if (role === 'admin') return res.status(403).json({ error: 'Admins cannot create conversations' })

  // Verify the counterparty exists and is the right role.
  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, role: true },
  })
  if (!other) return res.status(404).json({ error: 'User not found' })

  // Conversations are strictly client ↔ student. Decide which is which from
  // the actual DB roles, not anything the client sent.
  let clientId, actualTalentId
  if (role === 'client' && other.role === 'student') {
    clientId = userId
    actualTalentId = other.id
  } else if (role === 'student' && other.role === 'client') {
    clientId = other.id
    actualTalentId = userId
  } else {
    return res.status(400).json({ error: 'Conversations must be between a client and a student' })
  }

  // Upsert: find existing or create new
  const conversation = await prisma.conversation.upsert({
    where: { clientId_talentId: { clientId, talentId: actualTalentId } },
    update: projectId ? { projectId } : {},
    create: { clientId, talentId: actualTalentId, projectId: projectId || null },
    include: {
      client: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
      talent: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
      project: { select: { id: true, title: true } },
    },
  })

  res.json(conversation)
})

// ── Get messages for a conversation ──────────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  const { id: userId, role } = req.user
  const { id: conversationId } = req.params
  const { before, limit = '50' } = req.query

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv) return res.status(404).json({ error: 'Conversation not found' })

  const isParticipant = conv.clientId === userId || conv.talentId === userId
  if (!isParticipant && role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    include: {
      sender: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
    },
  })

  // Return in chronological order (oldest first)
  res.json(messages.reverse())
})

export default router
