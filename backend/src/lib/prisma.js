import { PrismaClient } from '@prisma/client'

// Reuse a single Prisma instance (avoids connection pool exhaustion in dev)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

export default prisma
