let prisma: any

// Only instantiate Prisma if DATABASE_URL is set
if (process.env.DATABASE_URL) {
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
} else {
  // Return a mock during build
  prisma = {}
}

export { prisma }
