import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'
import { safeUrl, clampText, nonNegativeInt } from '../lib/sanitize.js'

const router = Router()

// ── GET /profiles ─────────────────────────────────────────────────────────────
// Public — list all student profiles (talent directory)
router.get('/', optionalAuth, async (req, res) => {
  const { skill, availability, search } = req.query
  const isAdmin = req.user?.role === 'admin'

  const profiles = await prisma.profile.findMany({
    where: {
      ...(availability && { availability }),
      ...(skill && {
        skills: { some: { skill: { contains: skill, mode: 'insensitive' } } },
      }),
      // Hide suspended students from everyone but admins; keep the name search.
      user: {
        ...(isAdmin ? {} : { suspended: false }),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
    },
    include: {
      user: { select: { id: true, name: true, initials: true, avatarColor: true } },
      skills: true,
      portfolio: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { rating: 'desc' },
    take: 200,
  })

  return res.json(profiles)
})

// ── GET /profiles/client/me ───────────────────────────────────────────────────
// The current client's editable profile (company, bio, website, logo).
router.get('/client/me', requireAuth, async (req, res) => {
  const profile = await prisma.clientProfile.findUnique({ where: { userId: req.user.id } })
  res.json(profile || { company: '', bio: '', website: '', logo: null })
})

// ── PATCH /profiles/client/me ─────────────────────────────────────────────────
// Upsert the current client's profile.
router.patch('/client/me', requireAuth, requireRole('client', 'admin'), async (req, res) => {
  const { company, bio, website, logo } = req.body
  const data = {
    ...(company  !== undefined && { company: clampText(company, 200) }),
    ...(bio      !== undefined && { bio: clampText(bio, 5000) }),
    ...(website  !== undefined && { website: safeUrl(website) }),
    ...(logo     !== undefined && { logo: safeUrl(logo) }),
  }
  const profile = await prisma.clientProfile.upsert({
    where:  { userId: req.user.id },
    update: data,
    create: { userId: req.user.id, ...data },
  })
  res.json(profile)
})

// ── GET /profiles/:id ─────────────────────────────────────────────────────────
// Public — single profile with full details
router.get('/:id', optionalAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, initials: true, avatarColor: true, suspended: true } },
      skills: true,
      portfolio: { orderBy: { sortOrder: 'asc' } },
      education: true,
      experience: true,
    },
  })

  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  // A suspended student's profile is hidden from everyone but admins.
  if (profile.user?.suspended && req.user?.role !== 'admin') {
    return res.status(404).json({ error: 'Profile not found' })
  }
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
      ...(hourlyRate !== undefined && { hourlyRate: nonNegativeInt(hourlyRate) ?? 0 }),
      ...(university !== undefined && { university }),
      ...(dept !== undefined && { dept }),
      ...(year !== undefined && { year: nonNegativeInt(year) }),
      ...(isGrad !== undefined && { isGrad }),
      ...(avatar !== undefined && { avatar: safeUrl(avatar) }),
    },
  })

  // Replace skills if provided
  if (Array.isArray(skills)) {
    await prisma.$transaction([
      prisma.profileSkill.deleteMany({ where: { profileId: req.params.id } }),
      ...(skills.length ? [prisma.profileSkill.createMany({
        data: skills.map(skill => ({ profileId: req.params.id, skill })),
      })] : []),
    ])
  }

  // Replace portfolio if provided
  if (Array.isArray(portfolio)) {
    await prisma.$transaction([
      prisma.portfolioItem.deleteMany({ where: { profileId: req.params.id } }),
      ...(portfolio.length ? [prisma.portfolioItem.createMany({
        data: portfolio.map((item, i) => ({
          profileId: req.params.id,
          label: item.label,
          color: item.color || '#21326c',
          height: item.h || item.height || 'medium',
          imageUrl: safeUrl(item.imageUrl),
          pdfUrl: safeUrl(item.pdfUrl),
          pdfName: item.pdfName || null,
          sortOrder: i,
        })),
      })] : []),
    ])
  }

  // Replace education if provided. Pick explicit fields only — never spread the
  // raw body object, or a caller could override `profileId` and write rows into
  // another user's profile (mass-assignment IDOR).
  if (Array.isArray(education)) {
    await prisma.$transaction([
      prisma.education.deleteMany({ where: { profileId: req.params.id } }),
      ...(education.length ? [prisma.education.createMany({
        data: education.map(e => ({
          profileId: req.params.id,
          degree: String(e.degree || ''),
          school: String(e.school || ''),
          years:  String(e.years  || ''),
        })),
      })] : []),
    ])
  }

  // Replace experience if provided (same explicit-field rule as above).
  if (Array.isArray(experience)) {
    await prisma.$transaction([
      prisma.experience.deleteMany({ where: { profileId: req.params.id } }),
      ...(experience.length ? [prisma.experience.createMany({
        data: experience.map(e => ({
          profileId: req.params.id,
          role:    String(e.role    || ''),
          company: String(e.company || ''),
          years:   String(e.years   || ''),
        })),
      })] : []),
    ])
  }

  // Return full updated profile
  const full = await prisma.profile.findUnique({
    where: { id: req.params.id },
    include: { skills: true, portfolio: { orderBy: { sortOrder: 'asc' } }, education: true, experience: true },
  })
  return res.json(full)
})

export default router
