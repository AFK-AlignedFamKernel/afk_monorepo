import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema';

const connectionString =
  process.env.POSTGRES_CONNECTION_STRING ?? 'postgres://postgres:postgres@localhost:5434/postgres';

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

export type Database = NodePgDatabase<typeof schema>;
