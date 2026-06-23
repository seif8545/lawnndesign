import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { safeUrl } from '../lib/sanitize.js'

const router = Router()

// Keys whose values are single URLs and must be passed through safeUrl on write.
const URL_KEYS = new Set(['homeHeroImageUrl'])
// Allowed setting keys — anything else is ignored, so the endpoint can't be
// used as an arbitrary key/value dumping ground. `homeHeroImages` is a JSON
// array of URLs (the homepage hero carousel).
const ALLOWED_KEYS = new Set(['homeHeroImageUrl', 'homeHeroImages'])

// ── GET /settings ─────────────────────────────────────────────────────────────
// Public — returns all site settings as a flat { key: value } object.
router.get('/', async (_req, res) => {
  const rows = await prisma.siteSetting.findMany()
  const out = {}
  for (const r of rows) out[r.key] = r.value
  return res.json(out)
})

// ── PATCH /settings ───────────────────────────────────────────────────────────
// Admin — upsert one or more allowed settings. An empty/null value clears the
// setting. URL-valued keys are sanitised.
router.patch('/', requireAuth, requireRole('admin'), async (req, res) => {
  const body = req.body || {}
  const updates = []

  for (const [key, raw] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) continue

    // Hero carousel: an array of image URLs, validated and stored as JSON.
    if (key === 'homeHeroImages') {
      const clean = (Array.isArray(raw) ? raw : []).map(u => safeUrl(String(u))).filter(Boolean).slice(0, 12)
      updates.push(clean.length === 0
        ? prisma.siteSetting.deleteMany({ where: { key } })
        : prisma.siteSetting.upsert({ where: { key }, update: { value: JSON.stringify(clean) }, create: { key, value: JSON.stringify(clean) } }))
      continue
    }

    // Empty value → delete the setting (revert to default behaviour).
    if (raw === null || raw === undefined || raw === '') {
      updates.push(prisma.siteSetting.deleteMany({ where: { key } }))
      continue
    }

    let value = String(raw)
    if (URL_KEYS.has(key)) {
      const clean = safeUrl(value)
      if (!clean) return res.status(400).json({ error: `Invalid URL for ${key}` })
      value = clean
    }
    updates.push(
      prisma.siteSetting.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      })
    )
  }

  await prisma.$transaction(updates)

  const rows = await prisma.siteSetting.findMany()
  const out = {}
  for (const r of rows) out[r.key] = r.value
  return res.json(out)
})

export default router
