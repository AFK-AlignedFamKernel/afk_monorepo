"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
const client_1 = require("../prisma/.prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
const prisma = new client_1.PrismaClient();
// Test the connection
// prisma.$connect()
//   .then(() => console.log('Successfully connected to database'))
//   .catch((e: any) => console.error('Failed to connect to database:', e))
// Export everything from @prisma/client for types
__exportStar(require("@prisma/client"), exports);
exports.default = prisma;
// import { PrismaClient } from '@prisma/client'
// export const prisma = new PrismaClient()
// // Export any other types or utilities you need
// export * from '@prisma/client'
//# sourceMappingURL=index.js.map