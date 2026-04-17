import pool from '@/lib/db';

const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
const hasPostgresUrl = !!process.env.DATABASE_URL;
const usePostgres = dbClient === 'postgres' || dbClient === 'postgresql' || hasPostgresUrl;

export async function ensureResetPasswordColumns(): Promise<void> {
  if (usePostgres) {
    // PostgreSQL-safe path for Supabase
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL`);
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP NULL`);
    await pool.execute(`CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token)`);
    return;
  }

  // MySQL-safe fallback
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL`);
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME NULL`);
  try {
    await pool.execute(`CREATE INDEX idx_users_reset_token ON users (reset_token)`);
  } catch (error: any) {
    // Ignore duplicate index creation attempts.
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('duplicate') && !message.includes('exists')) {
      throw error;
    }
  }
}
