/**
 * Load .env.local without dotenv dependency, then verify Gmail SMTP auth.
 * Run from project root: node scripts/verify-smtp.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env.local at', envPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnvLocal();
const user = (env.SMTP_USER || '').trim();
const pass = (env.SMTP_PASS || '').replace(/\s+/g, '');

if (!user || !pass) {
  console.error('SMTP_USER and SMTP_PASS must be set in .env.local');
  process.exit(1);
}

console.log('SMTP_USER:', user);
console.log('SMTP_PASS length:', pass.length, '(expected 16 for Gmail App Password)');
console.log('Verifying…\n');

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

try {
  await t.verify();
  console.log('OK — Gmail accepted these credentials (SMTP verify succeeded).');
  process.exit(0);
} catch (e) {
  console.error('FAILED:', e.message || e);
  console.log('\nTips:');
  console.log('- Use App Password from the same Google account as SMTP_USER.');
  console.log('- Revoke old app passwords and generate a new one at myaccount.google.com/apppasswords');
  console.log('- Sign in to medconsultliberia@gmail.com in your browser, then open:');
  console.log('  https://accounts.google.com/DisplayUnlockCaptcha');
  console.log('  (avoid /b/0/ in the URL — use the link above)');
  process.exit(1);
}
