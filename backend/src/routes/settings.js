import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { safeUrl } from '../lib/sanitize.js'

const router = Router()

// Keys whose values are URLs and must be passed through safeUrl on write.
const URL_KEYS = new Set(['homeHeroImageUrl'])
// Allowed setting keys — anything else is ignored, so the endpoint can't be
// used as an arbitrary key/value dumping ground.
const ALLOWED_KEYS = new Set(['homeHeroImageUrl'])

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
