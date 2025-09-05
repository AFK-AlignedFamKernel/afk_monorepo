import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './src/schema.ts',
  out: './.drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_CONNECTION_STRING || process.env.INDEXER_V2_DATABASE_URL,
  },
 } satisfies Config;

// export default defineConfig({
//   schema: './src/schema.ts',
//   out: './.drizzle',
//   dialect: 'postgresql',
//   dbCredentials: {
//     url: process.env.POSTGRES_CONNECTION_STRING || process.env.INDEXER_V2_DATABASE_URL,
//   },
// }) satisfies Config;
