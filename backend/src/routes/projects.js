import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { notify } from '../lib/notify.js'

const router = Router()

// ── GET /projects ─────────────────────────────────────────────────────────────
// Returns the current user's projects (client sees their own, student sees hired)
router.get('/', requireAuth, async (req, res) => {
  const where =
    req.user.role === 'client'
      ? { clientId: req.user.id }
      : req.user.role === 'admin'
      ? {}
      : { talentId: req.user.id }

  const projects = await prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, initials: true, avatarColor: true } },
      talent: { select: { id: true, name: true, initials: true, avatarColor: true } },
      reviews: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json(projects)
})

// ── GET /projects/:id ─────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      client: { select: { id: true, name: true, initials: true, avatarColor: true } },
      talent: { select: { id: true, name: true, initials: true, avatarColor: true } },
      reviews: {
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!project) return res.status(404).json({ error: 'Project not found' })

  // Only participants and admins can view
  const isParticipant = project.clientId === req.user.id || project.talentId === req.user.id
  if (!isParticipant && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  return res.json(project)
})

// ── POST /projects ────────────────────────────────────────────────────────────
// Clients create projects (direct hire via profile page)
router.post('/', requireAuth, requireRole('client', 'admin'), async (req, res) => {
  const { title, brief, budget, talentId, vip } = req.body

  if (!title || !brief || !budget) {
    return res.status(400).json({ error: 'title, brief, and budget are required' })
  }

  const project = await prisma.project.create({
    data: {
      clientId: req.user.id,
      talentId: talentId || null,
      title,
      brief,
      budget: parseInt(budget),
      vip: Boolean(vip),
    },
    include: {
      client: { select: { id: true, name: true } },
      talent: { select: { id: true, name: true } },
    },
  })

  return res.status(201).json(project)
})

// ── POST /projects/:id/advance ────────────────────────────────────────────────
// Drive the escrow state machine forward one step
router.post('/:id/advance', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const isClient = project.clientId === req.user.id
  const isTalent = project.talentId === req.user.id

  let data = {}
  let nextStatus

  switch (project.status) {
    case 'open':
      // Client accepts a talent's offer — talentId required in body
      if (!isClient) return res.status(403).json({ error: 'Only the client can accept an offer' })
      if (!req.body.talentId) return res.status(400).json({ error: 'talentId is required' })
      nextStatus = 'offer_accepted'
      data = { talentId: req.body.talentId }
      break

    case 'offer_accepted':
      // Client pays deposit (50%)
      if (!isClient) return res.status(403).json({ error: 'Only the client can pay the deposit' })
      nextStatus = 'deposit_paid'
      data = {
        depositAmount: Math.floor(project.budget * 0.5),
        depositPaidAt: new Date(),
      }
      break

    case 'deposit_paid':
      // Automatically moves to in_progress once deposit is confirmed (client confirms)
      if (!isClient) return res.status(403).json({ error: 'Only the client can confirm' })
      nextStatus = 'in_progress'
      break

    case 'in_progress':
      // Talent submits delivery
      if (!isTalent) return res.status(403).json({ error: 'Only the talent can submit delivery' })
      if (!req.body.deliveryNote) return res.status(400).json({ error: 'deliveryNote is required' })
      nextStatus = 'delivered'
      data = { deliveryNote: req.body.deliveryNote, deliveredAt: new Date() }
      break

    case 'delivered':
      // Client approves → releases payment and marks complete
      if (!isClient) return res.status(403).json({ error: 'Only the client can approve delivery' })
      nextStatus = 'completed'
      data = { clientApproved: true, completedAt: new Date() }
      break

    case 'completed':
      // Move to reviewed once both parties submit reviews (handled in /reviews endpoint)
      return res.status(400).json({ error: 'Use POST /projects/:id/reviews to leave a review' })

    default:
      return res.status(400).json({ error: `Cannot advance from status: ${project.status}` })
  }

  // Release escrow to the talent on completion. The deposit isn't credited
  // earlier because it's notionally held in platform escrow until the client
  // approves delivery. When Paymob is integrated, the deposit will be collected
  // at `deposit_paid` and the remainder at `completed`; the wallet credit here
  // represents the full released amount.
  const updated = await prisma.$transaction(async tx => {
    if (nextStatus === 'completed' && project.talentId) {
      await tx.profile.updateMany({
        where: { userId: project.talentId },
        data: { walletBalance: { increment: project.budget } },
      })
    }
    return tx.project.update({
      where: { id: req.params.id },
      data: { status: nextStatus, ...data },
      include: {
        client: { select: { id: true, name: true } },
        talent: { select: { id: true, name: true } },
      },
    })
  })

  // Notify the relevant counterparty about the transition.
  const t = updated.talentId
  const c = updated.clientId
  const title = updated.title
  if (nextStatus === 'offer_accepted')   await notify(t, { type: 'check', title: `Your offer was accepted for "${title}"`, body: 'The client will pay the deposit next.', link: 'projects' })
  else if (nextStatus === 'deposit_paid') await notify(t, { type: 'money', title: `Deposit received for "${title}"`, body: 'Funds are in escrow — you can start the work.', link: 'projects' })
  else if (nextStatus === 'in_progress')  await notify(t, { type: 'bag',   title: `"${title}" is now in progress`, body: 'Submit your delivery when it\'s ready.', link: 'projects' })
  else if (nextStatus === 'delivered')    await notify(c, { type: 'bag',   title: `Delivery submitted for "${title}"`, body: 'Review it and approve to release payment.', link: 'projects' })
  else if (nextStatus === 'completed')    await notify(t, { type: 'money', title: `Payment released for "${title}"`, body: 'The client approved your delivery.', link: 'projects' })

  return res.json(updated)
})

// ── POST /projects/:id/reviews ────────────────────────────────────────────────
router.post('/:id/reviews', requireAuth, async (req, res) => {
  const { rating, comment } = req.body
  if (!rating || !comment) return res.status(400).json({ error: 'rating and comment are required' })
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1–5' })

  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (project.status !== 'completed' && project.status !== 'reviewed') {
    return res.status(400).json({ error: 'Project must be completed before leaving a review' })
  }

  const isClient = project.clientId === req.user.id
  const isTalent = project.talentId === req.user.id
  if (!isClient && !isTalent) return res.status(403).json({ error: 'Forbidden' })

  const recipientId = isClient ? project.talentId : project.clientId

  const review = await prisma.review.create({
    data: {
      projectId: project.id,
      authorId: req.user.id,
      recipientId,
      rating: parseInt(rating),
      comment,
    },
  })

  // Recalculate recipient's average rating
  const reviews = await prisma.review.findMany({ where: { recipientId } })
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  await prisma.profile.updateMany({
    where: { userId: recipientId },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length },
  })

  // Mark project as reviewed when both parties have reviewed
  const reviewCount = await prisma.review.count({ where: { projectId: project.id } })
  if (reviewCount >= 2) {
    await prisma.project.update({ where: { id: project.id }, data: { status: 'reviewed' } })
  }

  await notify(recipientId, {
    type: 'star',
    title: 'You received a review',
    body: `${rating}★ on "${project.title}"`,
    link: 'projects',
  })

  return res.status(201).json(review)
})

// ── DELETE /projects/:id ──────────────────────────────────────────────────────
// Admin: unrestricted.
// Client owner: only when status is still `open` — i.e. no talent has been
// hired yet and nothing's been paid into escrow. Once a talent is on board,
// cancellation needs a refund/notification flow and that's a separate
// endpoint (TODO).
router.delete('/:id', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  if (req.user.role !== 'admin' && project.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (req.user.role !== 'admin' && project.status !== 'open') {
    return res.status(409).json({
      error: 'This project is already underway — cancellation needs the talent to be released and the deposit refunded.',
    })
  }

  await prisma.project.delete({ where: { id: req.params.id } })
  return res.status(204).send()
})

export default router
