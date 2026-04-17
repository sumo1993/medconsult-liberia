import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Public: applicant checks status by email (latest application for that email).
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 20, windowMs: 60_000, prefix: 'team-app-status' });
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const rows = (await query(
      `SELECT status, created_at, reviewed_at
       FROM team_applications
       WHERE LOWER(email) = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    )) as { status: string; created_at: string; reviewed_at: string | null }[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'No application found for this email. Check the address or apply at Join Our Team.',
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
    console.error('[lookup-status]', e);
    return NextResponse.json({ error: 'Could not look up status.' }, { status: 500 });
  }
}
