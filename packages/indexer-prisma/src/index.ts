import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
export { PrismaClient, prisma }

// import { PrismaClient } from '@prisma/client'

// export const prisma = new PrismaClient()

// // Export any other types or utilities you need
// export * from '@prisma/client'