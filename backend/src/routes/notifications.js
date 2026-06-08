import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

// ── GET /notifications ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where:   { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take:    50,
  })
  res.json(notifications)
})

// ── POST /notifications/read-all ──────────────────────────────────────────────
router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data:  { read: true },
  })
  res.json({ ok: true })
})

// ── POST /notifications/:id/read ──────────────────────────────────────────────
router.post('/:id/read', async (req, res) => {
  // Scope by userId so a user can only mark their own notifications.
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data:  { read: true },
  })
  res.json({ ok: true })
})

export default router
