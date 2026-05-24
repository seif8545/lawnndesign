import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'

const router = Router()

// ── GET /profiles ─────────────────────────────────────────────────────────────
// Public — list all student profiles (talent directory)
router.get('/', async (req, res) => {
  const { skill, availability, search } = req.query

  const profiles = await prisma.profile.findMany({
    where: {
      ...(availability && { availability }),
      ...(skill && {
        skills: { some: { skill: { contains: skill, mode: 'insensitive' } } },
      }),
      ...(search && {
        user: { name: { contains: search, mode: 'insensitive' } },
      }),
    },
    include: {
      user: { select: { id: true, name: true, initials: true, avatarColor: true } },
      skills: true,
      portfolio: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { rating: 'desc' },
  })

  return res.json(profiles)
})

// ── GET /profiles/:id ─────────────────────────────────────────────────────────
// Public — single profile with full details
router.get('/:id', async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, initials: true, avatarColor: true } },
      skills: true,
      portfolio: { orderBy: { sortOrder: 'asc' } },
      education: true,
      experience: true,
    },
  })

  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  return res.json(profile)
})

// ── PATCH /profiles/:id ───────────────────────────────────────────────────────
// Auth required — students can only update their own profile
router.patch('/:id', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id } })
  if (!profile) return res.status(404).json({ error: 'Profile not found' })

  // Students may only edit their own profile
  if (req.user.role === 'student' && profile.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const {
    bio, availability, hourlyRate, university, dept, year, isGrad, avatar,
    skills, portfolio, education, experience,
  } = req.body

  // Update scalar fields
  const updated = await prisma.profile.update({
    where: { id: req.params.id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(availability && { availability }),
      ...(hourlyRate !== undefined && { hourlyRate: parseInt(hourlyRate) }),
      ...(university !== undefined && { university }),
      ...(dept !== undefined && { dept }),
      ...(year !== undefined && { year: parseInt(year) }),
      ...(isGrad !== undefined && { isGrad }),
      ...(avatar !== undefined && { avatar }),
    },
  })

  // Replace skills if provided
  if (Array.isArray(skills)) {
    await prisma.profileSkill.deleteMany({ where: { profileId: req.params.id } })
    if (skills.length) {
      await prisma.profileSkill.createMany({
        data: skills.map(skill => ({ profileId: req.params.id, skill })),
      })
    }
  }

  // Replace portfolio if provided
  if (Array.isArray(portfolio)) {
    await prisma.portfolioItem.deleteMany({ where: { profileId: req.params.id } })
    if (portfolio.length) {
      await prisma.portfolioItem.createMany({
        data: portfolio.map((item, i) => ({
          profileId: req.params.id,
          label: item.label,
          color: item.color || '#21326c',
          height: item.h || item.height || 'medium',
          imageUrl: item.imageUrl || null,
          pdfUrl: item.pdfUrl || null,
          pdfName: item.pdfName || null,
          sortOrder: i,
        })),
      })
    }
  }

  // Replace education if provided
  if (Array.isArray(education)) {
    await prisma.education.deleteMany({ where: { profileId: req.params.id } })
    if (education.length) {
      await prisma.education.createMany({
        data: education.map(e => ({ profileId: req.params.id, ...e })),
      })
    }
  }

  // Replace experience if provided
  if (Array.isArray(experience)) {
    await prisma.experience.deleteMany({ where: { profileId: req.params.id } })
    if (experience.length) {
      await prisma.experience.createMany({
        data: experience.map(e => ({ profileId: req.params.id, ...e })),
      })
    }
  }

  // Return full updated profile
  const full = await prisma.profile.findUnique({
    where: { id: req.params.id },
    include: { skills: true, portfolio: { orderBy: { sortOrder: 'asc' } }, education: true, experience: true },
  })
  return res.json(full)
})

export default router
