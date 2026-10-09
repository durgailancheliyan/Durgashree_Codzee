import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/** Allowed DB names for auto-create (prevents SQL injection in CREATE DATABASE). */
function assertSafeDbName(name: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(
      `Invalid database name "${name}". Use only letters, numbers, and underscores (e.g. hospital_mid).`
    );
  }
}

function getTargetDatabaseName(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    try {
      const pathname = new URL(url).pathname.replace(/^\//, '');
      const db = pathname.split('/')[0];
      return db || null;
    } catch {
      return null;
    }
  }
  return process.env.PGDATABASE?.trim() || null;
}

function buildPoolConfig(): pg.PoolConfig {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return { connectionString: url };
  }

  const host = process.env.PGHOST ?? 'localhost';
  const port = parseInt(process.env.PGPORT ?? '5432', 10);
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD ?? '';

  if (!database || !user) {
    throw new Error(
      'Set DATABASE_URL or PG* variables (PGDATABASE, PGUSER, PGPASSWORD, optional PGHOST, PGPORT). See .env.example.'
    );
  }

  return {
    host,
    port,
    database,
    user,
    password,
  };
}

/** Connect to the default `postgres` DB and create the target DB if missing. */
function buildAdminPoolConfig(): pg.PoolConfig {
  const adminDb = process.env.PGADMIN_DATABASE ?? 'postgres';
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    try {
      const u = new URL(url);
      u.pathname = `/${adminDb}`;
      return { connectionString: u.toString() };
    } catch {
      throw new Error('Invalid DATABASE_URL');
    }
  }

  const host = process.env.PGHOST ?? 'localhost';
  const port = parseInt(process.env.PGPORT ?? '5432', 10);
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD ?? '';
  if (!user) {
    throw new Error('PGUSER is required when using PG* connection settings.');
  }

  return {
    host,
    port,
    database: adminDb,
    user,
    password,
  };
}

function isRemoteManagedDatabase(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    try {
      const host = new URL(url).hostname;
      return host !== 'localhost' && host !== '127.0.0.1';
    } catch {
      return false;
    }
  }
  const host = process.env.PGHOST ?? 'localhost';
  return host !== 'localhost' && host !== '127.0.0.1';
}

export async function ensureDatabaseExists(): Promise<void> {
  if (isRemoteManagedDatabase()) {
    return;
  }

  const targetDb = getTargetDatabaseName();
  if (!targetDb || targetDb === 'postgres') {
    return;
  }

  assertSafeDbName(targetDb);

  const adminPool = new Pool(buildAdminPoolConfig());
  try {
    const client = await adminPool.connect();
    try {
      const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
      if (exists.rows.length > 0) {
        return;
      }
      await client.query(`CREATE DATABASE ${targetDb}`);
      console.log(`PostgreSQL: created database "${targetDb}"`);
    } finally {
      client.release();
    }
  } finally {
    await adminPool.end();
  }
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
  }
  return pool;
}

export async function runMigrations(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await getPool().connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}
