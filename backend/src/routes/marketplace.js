import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'
import { notify } from '../lib/notify.js'
import { safeUrl, nonNegativeInt, clampText } from '../lib/sanitize.js'

const router = Router()

// `viewerId` controls offer visibility: the seller sees every offer on their
// listing; anyone else sees only the offers they themselves made.
function shape(listing, viewerId) {
  const { seller, offers, ...rest } = listing
  const isSeller = viewerId && seller?.id === viewerId
  const visibleOffers = (offers || [])
    .filter(o => isSeller || o.buyerId === viewerId)
    .map(o => ({
      id:           o.id,
      buyerId:      o.buyerId,
      from:         o.buyer?.name        || 'Someone',
      fromInitials: o.buyer?.initials    || '??',
      fromColor:    o.buyer?.avatarColor || '#21326c',
      amount:       o.amount,
      message:      o.message || '',
      reply:        o.reply   || null,
      status:       o.status,
    }))
  return {
    ...rest,
    seller: {
      userId:      seller?.id,
      name:        seller?.name        || 'Anonymous',
      initials:    seller?.initials    || '??',
      avatarColor: seller?.avatarColor || '#21326c',
    },
    offers: visibleOffers,
  }
}

const offerInclude = {
  buyer: { select: { id: true, name: true, initials: true, avatarColor: true } },
}

// ── GET /marketplace ──────────────────────────────────────────────────────────
// Public — active listings only. Admins also see pending. Authed sellers see
// their own listings regardless of status.
router.get('/', optionalAuth, async (req, res) => {
  // Admins see everything; everyone else only sees listings from active (non-
  // suspended) sellers.
  const where = req.user?.role === 'admin'
    ? {}
    : {
        seller: { suspended: false },
        ...(req.user
          ? { OR: [{ status: 'active' }, { status: 'sold' }, { sellerId: req.user.id }] }
          : { OR: [{ status: 'active' }, { status: 'sold' }] }),
      }

  const listings = await prisma.marketplaceListing.findMany({
    where,
    include: {
      seller: { select: { id: true, name: true, initials: true, avatarColor: true } },
      offers: { include: offerInclude, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(listings.map(l => shape(l, req.user?.id)))
})

// ── POST /marketplace ─────────────────────────────────────────────────────────
// Students post pending; admins post active. Clients can browse + buy, not list.
router.post('/', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  const { price, category, fileUrl, imageUrl, location } = req.body
  const title       = clampText(req.body.title, 200)
  const description = clampText(req.body.description, 5000)
  if (!title || !description || price === undefined) {
    return res.status(400).json({ error: 'title, description, and price are required' })
  }
  const priceInt = nonNegativeInt(price)
  if (priceInt === null) {
    return res.status(400).json({ error: 'price must be a non-negative number' })
  }
  const listing = await prisma.marketplaceListing.create({
    data: {
      sellerId:    req.user.id,
      title,
      description,
      price:       priceInt,
      category:    clampText(category, 80) || 'Other',
      location:    location ? String(location).slice(0, 200) : null,
      imageUrl:    safeUrl(imageUrl),
      fileUrl:     safeUrl(fileUrl),
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
  const { title, description, location, imageUrl } = req.body
  const updated = await prisma.marketplaceListing.update({
    where: { id: req.params.id },
    data:  {
      ...(title       !== undefined && { title: clampText(title, 200) }),
      ...(description !== undefined && { description: clampText(description, 5000) }),
      ...(location    !== undefined && { location: location ? String(location).slice(0, 200) : null }),
      ...(imageUrl    !== undefined && { imageUrl: safeUrl(imageUrl) }),
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
  // Admins can set any status. A seller can manage their own listing: mark it
  // sold, deactivate it (→ removed), or reactivate a previously-live one
  // (removed → active). They cannot self-approve a pending listing.
  const sellerAllowed =
    isSeller && (
      status === 'sold' ||
      status === 'removed' ||
      (status === 'active' && listing.status === 'removed')
    )
  if (!isAdmin && !sellerAllowed) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id: req.params.id },
    data:  { status },
    include: {
      seller: { select: { id: true, name: true, initials: true, avatarColor: true } },
    },
  })

  if (isAdmin && status === 'active') {
    await notify(updated.sellerId, {
      type: 'bag',
      title: `Your listing "${updated.title}" is now active`,
      body: 'It\'s live on the marketplace.',
      link: 'marketplace',
    })
  }
  res.json(shape(updated))
})

// ── POST /marketplace/:id/offers ──────────────────────────────────────────────
// A buyer makes an offer on a listing.
router.post('/:id/offers', requireAuth, async (req, res) => {
  const { amount } = req.body
  const amountInt = nonNegativeInt(amount)
  // Reject zero/negative/NaN and absurd values that would overflow the Int column.
  if (amountInt === null || amountInt <= 0 || amountInt > 1_000_000_000) {
    return res.status(400).json({ error: 'A valid offer amount is required' })
  }
  const message = clampText(req.body.message, 1000) || null
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } })
  if (!listing) return res.status(404).json({ error: 'Listing not found' })
  if (listing.sellerId === req.user.id) return res.status(400).json({ error: 'You cannot make an offer on your own listing' })
  if (listing.status !== 'active') return res.status(409).json({ error: 'This listing is not accepting offers' })

  // Block stacking offers: one open (pending) offer per buyer per listing, so a
  // buyer can't spam the seller with notifications.
  const openOffer = await prisma.offer.findFirst({
    where: { listingId: listing.id, buyerId: req.user.id, status: 'pending' },
    select: { id: true },
  })
  if (openOffer) return res.status(409).json({ error: 'You already have a pending offer on this listing' })

  const offer = await prisma.offer.create({
    data: { listingId: listing.id, buyerId: req.user.id, amount: amountInt, message },
    include: offerInclude,
  })

  await notify(listing.sellerId, {
    type: 'bag',
    title: `New offer on "${listing.title}"`,
    body: `${offer.buyer?.name || 'A buyer'} offered ${offer.amount.toLocaleString()} EGP.`,
    link: 'marketplace',
  })

  res.status(201).json(offer)
})

// Helper: load an offer with its listing, and authorise the seller.
async function loadOfferForSeller(offerId, userId) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { listing: true } })
  if (!offer) return { error: 404 }
  if (offer.listing.sellerId !== userId) return { error: 403 }
  return { offer }
}

// ── POST /marketplace/offers/:offerId/accept ──────────────────────────────────
// Seller accepts an offer → listing sold, other pending offers rejected.
router.post('/offers/:offerId/accept', requireAuth, async (req, res) => {
  const { offer, error } = await loadOfferForSeller(req.params.offerId, req.user.id)
  if (error === 404) return res.status(404).json({ error: 'Offer not found' })
  if (error === 403) return res.status(403).json({ error: 'Forbidden' })

  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: 'accepted' } }),
    prisma.offer.updateMany({ where: { listingId: offer.listingId, id: { not: offer.id }, status: 'pending' }, data: { status: 'rejected' } }),
    prisma.marketplaceListing.update({ where: { id: offer.listingId }, data: { status: 'sold' } }),
  ])

  await notify(offer.buyerId, {
    type: 'check',
    title: `Your offer was accepted — "${offer.listing.title}"`,
    body: 'The seller accepted your offer. They\'ll be in touch to arrange the sale.',
    link: 'marketplace',
  })
  res.json({ ok: true })
})

// ── POST /marketplace/offers/:offerId/reject ──────────────────────────────────
router.post('/offers/:offerId/reject', requireAuth, async (req, res) => {
  const { offer, error } = await loadOfferForSeller(req.params.offerId, req.user.id)
  if (error === 404) return res.status(404).json({ error: 'Offer not found' })
  if (error === 403) return res.status(403).json({ error: 'Forbidden' })

  await prisma.offer.update({ where: { id: offer.id }, data: { status: 'rejected' } })
  await notify(offer.buyerId, {
    type: 'info',
    title: `Your offer on "${offer.listing.title}" was declined`,
    link: 'marketplace',
  })
  res.json({ ok: true })
})

// ── POST /marketplace/offers/:offerId/reply ───────────────────────────────────
router.post('/offers/:offerId/reply', requireAuth, async (req, res) => {
  const { reply } = req.body
  if (!reply || !reply.trim()) return res.status(400).json({ error: 'reply is required' })
  const { offer, error } = await loadOfferForSeller(req.params.offerId, req.user.id)
  if (error === 404) return res.status(404).json({ error: 'Offer not found' })
  if (error === 403) return res.status(403).json({ error: 'Forbidden' })

  await prisma.offer.update({ where: { id: offer.id }, data: { reply: reply.trim() } })
  await notify(offer.buyerId, {
    type: 'message',
    title: `The seller replied to your offer on "${offer.listing.title}"`,
    body: reply.trim().slice(0, 120),
    link: 'marketplace',
  })
  res.json({ ok: true })
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
