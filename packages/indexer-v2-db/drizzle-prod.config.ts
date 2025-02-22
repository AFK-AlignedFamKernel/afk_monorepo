import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error('POSTGRES_CONNECTION_STRING is not defined');
}

export default defineConfig({
  schema: './src/schema.js',
  out: './.drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
}) as Config;
