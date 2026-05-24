import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'

const router = Router()

// All admin routes require auth + admin role
router.use(requireAuth, requireRole('admin'))

// ── POST /admin/students ──────────────────────────────────────────────────────
// Create a student account after their application is accepted
router.post('/students', async (req, res) => {
  const { name, email, password, university, dept, year, isGrad = false } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const hash     = await bcrypt.hash(password, 12)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase()

  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      name,
      role: 'student',
      initials,
      profile: {
        create: {
          university: university || '',
          dept:       dept       || '',
          year:       year ? parseInt(year) : null,
          isGrad:     Boolean(isGrad),
        },
      },
    },
    include: { profile: true },
  })

  const { password: _, ...safeUser } = user
  return res.status(201).json(safeUser)
})

// ── GET /admin/students ───────────────────────────────────────────────────────
// List all student accounts
router.get('/students', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { profile: { include: { skills: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(students.map(({ password, ...u }) => u))
})

// ── DELETE /admin/students/:id ────────────────────────────────────────────────
router.delete('/students/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user || user.role !== 'student') {
    return res.status(404).json({ error: 'Student not found' })
  }
  await prisma.user.delete({ where: { id: req.params.id } })
  return res.status(204).send()
})

export default router
