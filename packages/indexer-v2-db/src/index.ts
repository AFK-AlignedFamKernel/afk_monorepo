import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema';
import * as queries from './queries/index';

const connectionString =
  process.env.INDEXER_V2_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5435/postgres';

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

export type Database = NodePgDatabase<typeof schema>;
export { queries };
