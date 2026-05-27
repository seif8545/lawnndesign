import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'

const router = Router()

function shape(listing) {
  const { seller, ...rest } = listing
  return {
    ...rest,
    seller: {
      userId:      seller?.id,
      name:        seller?.name        || 'Anonymous',
      initials:    seller?.initials    || '??',
      avatarColor: seller?.avatarColor || '#21326c',
    },
    // The frontend's offers/replies system isn't modelled in the DB yet —
    // return an empty array so the page renders without crashing.
    offers: [],
  }
}

// ── GET /marketplace ──────────────────────────────────────────────────────────
// Public — active listings only. Admins also see pending. Authed sellers see
// their own listings regardless of status.
router.get('/', optionalAuth, async (req, res) => {
  const where = req.user?.role === 'admin'
    ? {}
    : req.user
      ? { OR: [{ status: 'active' }, { status: 'sold' }, { sellerId: req.user.id }] }
      : { OR: [{ status: 'active' }, { status: 'sold' }] }

  const listings = await prisma.marketplaceListing.findMany({
    where,
    include: {
      seller: { select: { id: true, name: true, initials: true, avatarColor: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(listings.map(shape))
})

// ── POST /marketplace ─────────────────────────────────────────────────────────
// Auth required. Sellers post pending; admins post active.
router.post('/', requireAuth, async (req, res) => {
  const { title, description, price, category, fileUrl } = req.body
  if (!title || !description || price === undefined) {
    return res.status(400).json({ error: 'title, description, and price are required' })
  }
  const listing = await prisma.marketplaceListing.create({
    data: {
      sellerId:    req.user.id,
      title,
      description,
      price:       parseInt(price, 10) || 0,
      category:    category || 'Other',
      fileUrl:     fileUrl || null,
      status:      req.user.role === 'admin' ? 'active' : 'pending',
    },
    include: {
      seller: { select: { id: true, name: true, initials: true, avatarColor: true } },
    },
  })
  res.status(201).json(shape(listing))
})

// ── PATCH /marketplace/:id ────────────────────────────────────────────────────
// Owner edits (title/description only — price is locked once posted).
router.patch('/:id', requireAuth, async (req, res) => {
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } })
  if (!listing) return res.status(404).json({ error: 'Listing not found' })
  if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const { title, description } = req.body
  const updated = await prisma.marketplaceListing.update({
    where: { id: req.params.id },
    data:  {
      ...(title       !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
    include: {
      seller: { select: { id: true, name: true, initials: true, avatarColor: true } },
    },
  })
  res.json(shape(updated))
})

// ── PATCH /marketplace/:id/status ─────────────────────────────────────────────
// Admin moderation (approve/reject); seller can mark their own as sold.
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body
  if (!['pending', 'active', 'sold', 'removed'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' })
  }
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } })
  if (!listing) return res.status(404).json({ error: 'Listing not found' })

  const isAdmin  = req.user.role === 'admin'
  const isSeller = listing.sellerId === req.user.id
  // Only admins can approve/reject (pending → active/removed).
  // Sellers can only mark their own listing as sold.
  if (!isAdmin && !(isSeller && status === 'sold')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id: req.params.id },
    data:  { status },
    include: {
      seller: { select: { id: true, name: true, initials: true, avatarColor: true } },
    },
  })
  res.json(shape(updated))
})

// ── DELETE /marketplace/:id ───────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } })
  if (!listing) return res.status(404).json({ error: 'Listing not found' })
  if (req.user.role !== 'admin' && listing.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  await prisma.marketplaceListing.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
