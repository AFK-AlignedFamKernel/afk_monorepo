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
//# sourceMappingURL=index.js.map
