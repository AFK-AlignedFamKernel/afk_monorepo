import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

const connectionString =
  process.env.POSTGRES_CONNECTION_STRING ?? 'postgres://postgres:postgres@localhost:5434/indexer';

export default defineConfig({
  schema: './src/schema.ts',
  out: './.drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
}) as Config;
