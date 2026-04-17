import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { ensureCensusFieldApplicationsTable } from '@/lib/ensure-census-field-applications-table';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 20, windowMs: 60_000, prefix: 'census-app-status' });
  if (limited) return limited;

  try {
    await ensureCensusFieldApplicationsTable();
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
    }

    const rows = (await query(
      `SELECT status, created_at, reviewed_at
       FROM census_field_applications
       WHERE LOWER(email) = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    )) as { status: string; created_at: string; reviewed_at: string | null }[];

    if (!rows?.length) {
      return NextResponse.json({
        found: false,
        message: 'No field / census application found for this email.',
      });
    }

    const row = rows[0];
    return NextResponse.json({
      found: true,
      status: row.status,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
    });
  } catch (e) {
    console.error('[census lookup-status]', e);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }
}
