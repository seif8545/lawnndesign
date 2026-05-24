import 'dotenv/config'

// Must set env BEFORE Prisma client is imported (ES module imports are hoisted)
process.env.DATABASE_URL = process.env.DIRECT_URL

const { default: bcrypt } = await import('bcryptjs')
const { default: prisma }  = await import('./src/lib/prisma.js')

async function seed() {
  console.log('🌱 Seeding accounts...\n')

  const accounts = [
    { email: 'admin@lawnndesign.com',   password: 'lawnn-admin',   role: 'admin',   name: 'Yomna (Admin)',   initials: 'YA', avatarColor: '#21326c' },
    { email: 'client@lawnndesign.com',  password: 'lawnn-client',  role: 'client',  name: 'Yomna (Client)',  initials: 'YC', avatarColor: '#c4622d' },
    { email: 'student@lawnndesign.com', password: 'lawnn-student', role: 'student', name: 'Yomna (Student)', initials: 'YS', avatarColor: '#db9630' },
  ]

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10)

    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: { password: hash },
      create: {
        email:       acc.email,
        password:    hash,
        role:        acc.role,
        name:        acc.name,
        initials:    acc.initials,
        avatarColor: acc.avatarColor,
      },
    })

    // Create a profile for the student
    if (acc.role === 'student') {
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId:       user.id,
          bio:          'Creative student ready to take on exciting projects.',
          availability: 'open',
          hourlyRate:   0,
        },
      })
    }

    console.log(`✅ ${acc.role.padEnd(7)}  ${acc.email}  /  ${acc.password}`)
  }

  console.log('\n🎉 Done! Use the credentials above to sign in.')
  await prisma.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
