import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// Test the connection
prisma.$connect()
  .then(() => console.log('Successfully connected to database'))
  .catch((e: any) => console.error('Failed to connect to database:', e))

// Export everything from @prisma/client for types
export * from '@prisma/client'

export default prisma
export { PrismaClient, prisma }

// import { PrismaClient } from '@prisma/client'

// export const prisma = new PrismaClient()

// // Export any other types or utilities you need
// export * from '@prisma/client'