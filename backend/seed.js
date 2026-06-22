import 'dotenv/config'
import crypto from 'crypto'

// Must set env BEFORE Prisma client is imported (ES module imports are hoisted)
process.env.DATABASE_URL = process.env.DIRECT_URL

const { hashPassword }    = await import('./src/lib/password.js')
const { default: prisma } = await import('./src/lib/prisma.js')

// ── Safety guard ─────────────────────────────────────────────────────────────
// This script creates known starter accounts. Running it against production
// could create privileged accounts or interfere with real data, so it refuses
// to run unless explicitly allowed and never in production.
if (process.env.NODE_ENV === 'production' || process.env.ALLOW_SEED !== 'yes') {
  console.error('Refusing to seed. This is for local/dev only.')
  console.error('To run: ensure NODE_ENV is not "production" and set ALLOW_SEED=yes')
  process.exit(1)
}

// Passwords are NEVER hardcoded in the repo. Each comes from an env var if set,
// otherwise a strong random one is generated and printed ONCE below. Set
// SEED_ADMIN_PASSWORD / SEED_CLIENT_PASSWORD / SEED_STUDENT_PASSWORD to choose.
function genPassword() {
  return crypto.randomBytes(12).toString('base64url') // ~16 chars, strong
}

async function seed() {
  console.log('🌱 Seeding starter accounts (dev only)...\n')

  const accounts = [
    { email: 'admin@lawnndesign.com',   envKey: 'SEED_ADMIN_PASSWORD',   role: 'admin',   name: 'Yomna (Admin)',   initials: 'YA', avatarColor: '#21326c' },
    { email: 'client@lawnndesign.com',  envKey: 'SEED_CLIENT_PASSWORD',  role: 'client',  name: 'Yomna (Client)',  initials: 'YC', avatarColor: '#c4622d' },
    { email: 'student@lawnndesign.com', envKey: 'SEED_STUDENT_PASSWORD', role: 'student', name: 'Yomna (Student)', initials: 'YS', avatarColor: '#db9630' },
  ]

  const printed = []

  for (const acc of accounts) {
    // Never overwrite an existing account — protects a real password from being
    // reset to a known value if this is ever run against a populated DB.
    const existing = await prisma.user.findUnique({ where: { email: acc.email }, select: { id: true } })
    if (existing) {
      console.log(`•  ${acc.role.padEnd(7)}  ${acc.email}  — already exists, left unchanged`)
      continue
    }

    const password = process.env[acc.envKey] || genPassword()
    const hash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email:       acc.email,
        password:    hash,
        role:        acc.role,
        name:        acc.name,
        initials:    acc.initials,
        avatarColor: acc.avatarColor,
      },
    })

    if (acc.role === 'student') {
      await prisma.profile.create({
        data: {
          userId:       user.id,
          bio:          'Creative student ready to take on exciting projects.',
          availability: 'open',
          hourlyRate:   0,
        },
      })
    }

    printed.push({ role: acc.role, email: acc.email, password })
    console.log(`✅ ${acc.role.padEnd(7)}  ${acc.email}  — created`)
  }

  if (printed.length) {
    console.log('\n🔑 New account passwords (shown once — save them now):')
    for (const p of printed) console.log(`   ${p.role.padEnd(7)}  ${p.email}  /  ${p.password}`)
  }

  console.log('\n🎉 Done.')
  await prisma.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
