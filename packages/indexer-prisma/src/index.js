// import { PrismaClient } from '@prisma/client';
// import { PrismaClient } from '../generated/client';
const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient();
module.exports= {prisma}
// export = prisma;
// export default prisma;