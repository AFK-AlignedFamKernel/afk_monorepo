import { PrismaClient } from '../prisma/.prisma/client';

const prisma = new PrismaClient();

export default prisma;
export { PrismaClient };
