#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-postgres-password.js <email> <newPassword>');
    process.exit(1);
  }

  loadEnvLocal();
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing. Please set it in .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const existing = await pool.query(
      'SELECT id, email, role, status FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );

    if (existing.rows.length === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, status = 'active', updated_at = NOW() WHERE lower(email) = lower($2)",
      [passwordHash, email]
    );

    const user = existing.rows[0];
    console.log('Password reset successful:');
    console.log(`- id: ${user.id}`);
    console.log(`- email: ${user.email}`);
    console.log(`- role: ${user.role}`);
    console.log(`- status: active`);
  } catch (error) {
    console.error('Failed to reset password:', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
