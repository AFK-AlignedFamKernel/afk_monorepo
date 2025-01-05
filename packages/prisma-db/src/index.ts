import { PrismaClient } from '../prisma/.prisma/client';

const prisma = new PrismaClient();

export default prisma;
export { PrismaClient };

// Export any other types or utilities you need
// export * from '@prisma/client'
