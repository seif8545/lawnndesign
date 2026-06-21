import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

// Shared participant selects for conversation includes.
const userSelect = { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } }
const convInclude = {
  client:  userSelect,
  talent:  userSelect,
  admin:   userSelect,
  project: { select: { id: true, title: true } },
}

const isParticipant = (conv, userId) =>
  conv.clientId === userId || conv.talentId === userId || conv.adminId === userId

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
      ...convInclude,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  })

  // Unread count only for conversations the user actually participates in.
  // (Admins observe every thread but only see unread badges on their own DMs.)
  const withUnread = await Promise.all(
    conversations.map(async conv => {
      const unreadCount = isParticipant(conv, userId)
        ? await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              readAt: null,
            },
          })
        : 0
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

  // Verify the counterparty exists and is the right role.
  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, role: true },
  })
  if (!other) return res.status(404).json({ error: 'User not found' })

  // Admin ↔ anyone. The admin sits in adminId; the target sits in the talentId
  // participant slot regardless of its role (student, client, or another admin).
  // Deduped by hand since the unique index only covers client↔student pairs.
  if (role === 'admin') {
    const existing = await prisma.conversation.findFirst({ where: { adminId: userId, talentId: other.id } })
    const conversation = existing
      ? await prisma.conversation.findUnique({ where: { id: existing.id }, include: convInclude })
      : await prisma.conversation.create({ data: { adminId: userId, talentId: other.id }, include: convInclude })
    return res.json(conversation)
  }

  // Student or client contacting an admin (support). Stored the same way as an
  // admin-initiated thread — admin in adminId, the other user in talentId — so
  // the two directions dedupe to a single conversation.
  if (other.role === 'admin') {
    const existing = await prisma.conversation.findFirst({ where: { adminId: other.id, talentId: userId } })
    const conversation = existing
      ? await prisma.conversation.findUnique({ where: { id: existing.id }, include: convInclude })
      : await prisma.conversation.create({ data: { adminId: other.id, talentId: userId }, include: convInclude })
    return res.json(conversation)
  }

  // Client ↔ student threads put the client in clientId and the student in
  // talentId (deterministic by role). Any other pair — e.g. a marketplace
  // buyer ↔ seller of the same role — is assigned deterministically by id so the
  // pair always dedupes to a single conversation. The slots are just user
  // references; the chat UI renders participants by their actual identity.
  let clientId, actualTalentId
  if (role === 'client' && other.role === 'student') {
    clientId = userId
    actualTalentId = other.id
  } else if (role === 'student' && other.role === 'client') {
    clientId = other.id
    actualTalentId = userId
  } else {
    const [a, b] = [userId, other.id].sort()
    clientId = a
    actualTalentId = b
  }

  // Upsert: find existing or create new
  const conversation = await prisma.conversation.upsert({
    where: { clientId_talentId: { clientId, talentId: actualTalentId } },
    update: projectId ? { projectId } : {},
    create: { clientId, talentId: actualTalentId, projectId: projectId || null },
    include: convInclude,
  })

  res.json(conversation)
})

// ── POST /conversations/support ───────────────────────────────────────────────
// One-tap "contact an admin" for students and clients. Opens (or reuses) a
// direct thread with an admin so users can reach support at any time.
router.post('/support', async (req, res) => {
  const { id: userId, role } = req.user
  if (role === 'admin') return res.status(400).json({ error: 'Use the New message picker to start a chat.' })

  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (!admin) return res.status(503).json({ error: 'No admin is available right now.' })

  const existing = await prisma.conversation.findFirst({ where: { adminId: admin.id, talentId: userId } })
  const conversation = existing
    ? await prisma.conversation.findUnique({ where: { id: existing.id }, include: convInclude })
    : await prisma.conversation.create({ data: { adminId: admin.id, talentId: userId }, include: convInclude })
  res.json(conversation)
})

// ── Get messages for a conversation ──────────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  const { id: userId, role } = req.user
  const { id: conversationId } = req.params
  const { before, limit = '50' } = req.query

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv) return res.status(404).json({ error: 'Conversation not found' })

  if (!isParticipant(conv, userId) && role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  // Cap the page size so a caller can't request an unbounded message dump.
  const pageSize = Math.min(Math.max(parseInt(limit) || 50, 1), 100)
  // Ignore an unparseable `before` cursor rather than passing an Invalid Date
  // into Prisma (which throws → 500).
  const beforeDate = before ? new Date(before) : null
  const validBefore = beforeDate && !Number.isNaN(beforeDate.getTime()) ? beforeDate : null
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(validBefore ? { createdAt: { lt: validBefore } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    include: {
      sender: { select: { id: true, name: true, initials: true, avatarColor: true, profile: { select: { avatar: true } } } },
    },
  })

  // Return in chronological order (oldest first)
  res.json(messages.reverse())
})

export default router
