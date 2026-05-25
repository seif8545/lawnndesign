import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'

const router = Router()

// Strip password and reshape post for client consumption.
function shape(post) {
  const { user, ...rest } = post
  return {
    ...rest,
    author:      user?.name || 'Anonymous',
    authorId:    user?.id,
    initials:    user?.initials || '??',
    avatarColor: user?.avatarColor || '#21326c',
    university:  user?.profile?.university || '',
  }
}

// ── GET /feed ─────────────────────────────────────────────────────────────────
// Public — approved posts. Admins (when authenticated) also see pending.
router.get('/', optionalAuth, async (req, res) => {
  const isAdmin = req.user?.role === 'admin'
  const posts = await prisma.feedPost.findMany({
    where: isAdmin ? undefined : { status: 'approved' },
    include: {
      user: {
        select: {
          id: true, name: true, initials: true, avatarColor: true,
          profile: { select: { university: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(posts.map(shape))
})

// ── POST /feed ────────────────────────────────────────────────────────────────
// Auth required. Admins post live; everyone else goes to pending.
router.post('/', requireAuth, async (req, res) => {
  const { content, imageUrl, tags = [] } = req.body
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' })
  }
  const post = await prisma.feedPost.create({
    data: {
      userId:   req.user.id,
      content:  content.trim(),
      imageUrl: imageUrl || null,
      tags:     Array.isArray(tags) ? tags : [],
      status:   req.user.role === 'admin' ? 'approved' : 'pending',
    },
    include: {
      user: {
        select: {
          id: true, name: true, initials: true, avatarColor: true,
          profile: { select: { university: true } },
        },
      },
    },
  })
  res.status(201).json(shape(post))
})

// ── POST /feed/:id/like ───────────────────────────────────────────────────────
// Naive like — just increments the counter. No per-user tracking yet.
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await prisma.feedPost.update({
      where: { id: req.params.id },
      data:  { likes: { increment: 1 } },
    })
    res.json({ likes: post.likes })
  } catch {
    res.status(404).json({ error: 'Post not found' })
  }
})

// ── PATCH /feed/:id/status ────────────────────────────────────────────────────
// Admin moderation.
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const { status } = req.body
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved | rejected | pending' })
  }
  const post = await prisma.feedPost.update({
    where: { id: req.params.id },
    data:  { status },
  })
  res.json(post)
})

// ── DELETE /feed/:id ──────────────────────────────────────────────────────────
// Author or admin.
router.delete('/:id', requireAuth, async (req, res) => {
  const post = await prisma.feedPost.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  if (req.user.role !== 'admin' && post.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  await prisma.feedPost.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
