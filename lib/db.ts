import mysql from 'mysql2/promise';

type QueryMeta = {
  affectedRows?: number;
  insertId?: number;
  rowCount?: number;
};

type DbPool = {
  execute: <T = unknown[]>(sql: string, params?: ReadonlyArray<unknown>) => Promise<[T, QueryMeta]>;
  query: <T = unknown[]>(sql: string, params?: ReadonlyArray<unknown>) => Promise<[T, QueryMeta]>;
};

const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
const hasPostgresUrl = !!process.env.DATABASE_URL;
const usePostgres = dbClient === 'postgres' || dbClient === 'postgresql' || hasPostgresUrl;
export const IS_POSTGRES = usePostgres;

function convertMysqlPlaceholdersToPg(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function createMySqlPool(): DbPool {
  const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medconsult_liberia',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    ssl: process.env.DB_HOST?.includes('aivencloud.com')
      ? {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        }
      : undefined,
  });

  console.log('[DB] MySQL connection pool created:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    ssl: !!process.env.DB_HOST?.includes('aivencloud.com'),
  });

  return {
    execute: async <T = unknown[]>(sql: string, params: ReadonlyArray<unknown> = []) => {
      const [rows, meta] = await mysqlPool.execute(sql, params);
      return [rows as T, meta as QueryMeta];
    },
    query: async <T = unknown[]>(sql: string, params: ReadonlyArray<unknown> = []) => {
      const [rows, meta] = await mysqlPool.query(sql, params);
      return [rows as T, meta as QueryMeta];
    },
  };
}

function createPostgresPool(): DbPool {
  console.log('[DB] PostgreSQL connection pool created:', {
    host: process.env.PGHOST || 'from DATABASE_URL',
    database: process.env.PGDATABASE || 'from DATABASE_URL',
    ssl: process.env.PGSSLMODE !== 'disable',
  });

  type PgQueryResult = {
    rows: unknown[];
    rowCount: number | null;
  };

  type PgPoolLike = {
    query: (text: string, values?: ReadonlyArray<unknown>) => Promise<PgQueryResult>;
  };

  let pgPoolPromise: Promise<PgPoolLike> | null = null;

  const isTransientPgError = (error: unknown): boolean => {
    const err = error as { code?: string; message?: string } | undefined;
    const code = err?.code || '';
    const message = (err?.message || '').toLowerCase();
    return (
      code === 'ECONNRESET' ||
      code === 'EPIPE' ||
      code === 'ETIMEDOUT' ||
      code === '57P01' ||
      message.includes('connection terminated unexpectedly') ||
      message.includes('terminating connection')
    );
  };

  const getPgPool = async (): Promise<PgPoolLike> => {
    if (!pgPoolPromise) {
      pgPoolPromise = import('pg')
        .then((pgModule) => {
          const PgPoolCtor = pgModule.Pool as unknown as new (cfg: Record<string, unknown>) => PgPoolLike;
          if (!PgPoolCtor) {
            throw new Error(
              'PostgreSQL client not installed. Run `npm i pg @types/pg` before using DB_CLIENT=postgres.'
            );
          }

          const pool = new PgPoolCtor({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
            max: parseInt(process.env.DB_POOL_MAX || '10', 10),
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
            keepAlive: true,
          });
          return pool;
        })
        .catch(() => {
          throw new Error(
            'PostgreSQL client not installed. Run `npm i pg @types/pg` before using DB_CLIENT=postgres.'
          );
        });
    }
    return pgPoolPromise;
  };

  return {
    execute: async <T = unknown[]>(sql: string, params: ReadonlyArray<unknown> = []) => {
      const pgSql = convertMysqlPlaceholdersToPg(sql);
      let result: PgQueryResult;
      try {
        const pgPool = await getPgPool();
        result = await pgPool.query(pgSql, params);
      } catch (error) {
        if (!isTransientPgError(error)) {
          throw error;
        }
        console.warn('[DB] Transient PostgreSQL error on execute; resetting pool and retrying once.', error);
        pgPoolPromise = null;
        const retryPool = await getPgPool();
        result = await retryPool.query(pgSql, params);
      }
      const header = {
        affectedRows: result.rowCount ?? 0,
        insertId:
          result.rows && result.rows.length > 0 && typeof result.rows[0]?.id !== 'undefined'
            ? Number((result.rows[0] as { id: unknown }).id || 0)
            : 0,
        rowCount: result.rowCount ?? 0,
      };
      return [result.rows as T, header];
    },
    query: async <T = unknown[]>(sql: string, params: ReadonlyArray<unknown> = []) => {
      const pgSql = convertMysqlPlaceholdersToPg(sql);
      let result: PgQueryResult;
      try {
        const pgPool = await getPgPool();
        result = await pgPool.query(pgSql, params);
      } catch (error) {
        if (!isTransientPgError(error)) {
          throw error;
        }
        console.warn('[DB] Transient PostgreSQL error on query; resetting pool and retrying once.', error);
        pgPoolPromise = null;
        const retryPool = await getPgPool();
        result = await retryPool.query(pgSql, params);
      }
      const header = { rowCount: result.rowCount ?? 0 };
      return [result.rows as T, header];
    },
  };
}

const pool: DbPool = usePostgres ? createPostgresPool() : createMySqlPool();

export async function query<T = unknown[]>(sql: string, params?: ReadonlyArray<unknown>) {
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

export default pool;
