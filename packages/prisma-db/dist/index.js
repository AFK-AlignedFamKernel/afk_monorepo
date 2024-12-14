'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PrismaClient = void 0;
const client_1 = require('../prisma/.prisma/client');
Object.defineProperty(exports, 'PrismaClient', {
  enumerable: true,
  get: function () {
    return client_1.PrismaClient;
  },
});
const prisma = new client_1.PrismaClient();
exports.default = prisma;
// Export any other types or utilities you need
// export * from '@prisma/client'
//# sourceMappingURL=index.js.map
