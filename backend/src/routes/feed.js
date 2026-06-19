import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'
import { notify } from '../lib/notify.js'
import { safeUrl } from '../lib/sanitize.js'

const router = Router()

// Strip password and reshape post for client consumption.
function shape(post) {
  const { user, likedBy, _count, ...rest } = post
  return {
    ...rest,
    author:      user?.name || 'Anonymous',
    authorId:    user?.id,
    initials:    user?.initials || '??',
    avatarColor: user?.avatarColor || '#21326c',
    university:  user?.profile?.university || '',
    liked:       Array.isArray(likedBy) && likedBy.length > 0,
    commentCount: _count?.comments ?? 0,
  }
}

// ── GET /feed ─────────────────────────────────────────────────────────────────
// Public — approved posts. Admins (when authenticated) also see pending.
router.get('/', optionalAuth, async (req, res) => {
  const isAdmin = req.user?.role === 'admin'
  const userId  = req.user?.id
  const posts = await prisma.feedPost.findMany({
    where: isAdmin ? undefined : { status: 'approved' },
    include: {
      user: {
        select: {
          id: true, name: true, initials: true, avatarColor: true,
          profile: { select: { university: true } },
        },
      },
      // Only the caller's own like row, so `shape` can set `liked`.
      ...(userId ? { likedBy: { where: { userId }, select: { userId: true } } } : {}),
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(posts.map(shape))
})

// ── GET /feed/:id ───────────────────────────────────────────────────────────
// Single post — powers shareable deep links. Public for approved posts; the
// author and admins can also fetch their own pending/rejected posts.
router.get('/:id', optionalAuth, async (req, res) => {
  const post = await prisma.feedPost.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: {
          id: true, name: true, initials: true, avatarColor: true,
          profile: { select: { university: true } },
        },
      },
      ...(req.user?.id ? { likedBy: { where: { userId: req.user.id }, select: { userId: true } } } : {}),
      _count: { select: { comments: true } },
    },
  })
  if (!post) return res.status(404).json({ error: 'Post not found' })

  const isOwner = post.userId === req.user?.id
  const isAdmin = req.user?.role === 'admin'
  if (post.status !== 'approved' && !isOwner && !isAdmin) {
    return res.status(404).json({ error: 'Post not found' })
  }
  res.json(shape(post))
})

// ── GET /feed/:id/comments ──────────────────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { feedPostId: req.params.id },
    include: { user: { select: { id: true, name: true, initials: true, avatarColor: true } } },
    orderBy: { createdAt: 'asc' },
  })
  res.json(comments.map(c => ({
    id:          c.id,
    content:     c.content,
    createdAt:   c.createdAt,
    authorId:    c.user?.id,
    author:      c.user?.name || 'Anonymous',
    initials:    c.user?.initials || '??',
    avatarColor: c.user?.avatarColor || '#21326c',
  })))
})

// ── POST /feed/:id/comments ─────────────────────────────────────────────────
// Any signed-in user can comment on an approved post.
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' })

  const post = await prisma.feedPost.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true, status: true } })
  if (!post || post.status !== 'approved') return res.status(404).json({ error: 'Post not found' })

  const comment = await prisma.comment.create({
    data: { feedPostId: post.id, userId: req.user.id, content: content.trim() },
    include: { user: { select: { id: true, name: true, initials: true, avatarColor: true } } },
  })

  // Notify the author (unless they commented on their own post).
  if (post.userId !== req.user.id) {
    await notify(post.userId, {
      type: 'message',
      title: `${comment.user?.name || 'Someone'} commented on your post`,
      body: comment.content.slice(0, 120),
      link: 'feed',
    })
  }

  res.status(201).json({
    id:          comment.id,
    content:     comment.content,
    createdAt:   comment.createdAt,
    authorId:    comment.user?.id,
    author:      comment.user?.name || 'Anonymous',
    initials:    comment.user?.initials || '??',
    avatarColor: comment.user?.avatarColor || '#21326c',
  })
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
      imageUrl: safeUrl(imageUrl),
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
// Toggle the caller's like on a post. Returns the new count and liked state.
router.post('/:id/like', requireAuth, async (req, res) => {
  const feedPostId = req.params.id
  const userId     = req.user.id

  const exists = await prisma.feedPost.findUnique({ where: { id: feedPostId }, select: { id: true } })
  if (!exists) return res.status(404).json({ error: 'Post not found' })

  const existing = await prisma.feedLike.findUnique({
    where: { userId_feedPostId: { userId, feedPostId } },
  })

  if (existing) {
    const [, post] = await prisma.$transaction([
      prisma.feedLike.delete({ where: { userId_feedPostId: { userId, feedPostId } } }),
      prisma.feedPost.update({ where: { id: feedPostId }, data: { likes: { decrement: 1 } } }),
    ])
    return res.json({ likes: Math.max(0, post.likes), liked: false })
  }

  const [, post] = await prisma.$transaction([
    prisma.feedLike.create({ data: { userId, feedPostId } }),
    prisma.feedPost.update({ where: { id: feedPostId }, data: { likes: { increment: 1 } } }),
  ])
  return res.json({ likes: post.likes, liked: true })
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

  if (status === 'approved') {
    await notify(post.userId, {
      type: 'check',
      title: 'Your post was approved',
      body: 'It\'s now live in the feed.',
      link: 'feed',
    })
  }
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
