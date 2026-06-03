import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'

const router = Router()

// ── GET /news ───────────────────────────────────────────────────────────────
// Public — all articles, newest first.
router.get('/', async (_req, res) => {
  const posts = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(posts)
})

// ── POST /news ──────────────────────────────────────────────────────────────
// Admin only.
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, excerpt, body = [], category, readTime, color, author } = req.body
  if (!title?.trim() || !excerpt?.trim()) {
    return res.status(400).json({ error: 'title and excerpt are required' })
  }
  const post = await prisma.news.create({
    data: {
      title:    title.trim(),
      excerpt:  excerpt.trim(),
      body:     Array.isArray(body) ? body : [],
      ...(category ? { category } : {}),
      ...(readTime ? { readTime } : {}),
      ...(color    ? { color }    : {}),
      ...(author   ? { author }   : {}),
    },
  })
  res.status(201).json(post)
})

// ── PATCH /news/:id ─────────────────────────────────────────────────────────
// Admin only. Updates whichever fields are provided.
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, excerpt, body, category, readTime, color } = req.body
  const data = {}
  if (title    !== undefined) data.title    = title.trim()
  if (excerpt  !== undefined) data.excerpt  = excerpt.trim()
  if (body     !== undefined) data.body     = Array.isArray(body) ? body : []
  if (category !== undefined) data.category = category
  if (readTime !== undefined) data.readTime = readTime
  if (color    !== undefined) data.color    = color
  try {
    const post = await prisma.news.update({ where: { id: req.params.id }, data })
    res.json(post)
  } catch {
    res.status(404).json({ error: 'Article not found' })
  }
})

// ── DELETE /news/:id ────────────────────────────────────────────────────────
// Admin only.
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await prisma.news.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Article not found' })
  }
})

export default router
