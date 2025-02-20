import type { Config } from 'drizzle-kit';

const connectionString =
  process.env.POSTGRES_CONNECTION_STRING ?? 'postgres://postgres:postgres@localhost:5434/indexer';

export default {
  schema: './src/schema.ts',
  out: './.drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config;
