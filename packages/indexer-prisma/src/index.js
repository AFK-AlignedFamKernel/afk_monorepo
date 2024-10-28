const { PrismaClient } = require('../prisma/.prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;