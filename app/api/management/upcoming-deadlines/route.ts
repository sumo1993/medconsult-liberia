import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

const dbClient = (process.env.DB_CLIENT || '').toLowerCase();
const usePostgres =
  dbClient === 'postgres' ||
  dbClient === 'postgresql' ||
  !!process.env.DATABASE_URL;

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultantId = user.userId;

    // Get assignments with upcoming deadlines
    const [deadlines] = await pool.execute<RowDataPacket[]>(
      usePostgres
        ? `SELECT
             ar.id,
             ar.title,
             ar.deadline,
             ar.status,
             u.full_name as client_name,
             GREATEST(0, CAST(DATE_PART('day', ar.deadline::timestamp - NOW()) AS INT)) as days_left,
             CASE WHEN DATE_PART('day', ar.deadline::timestamp - NOW()) <= 2 THEN 1 ELSE 0 END as urgent
           FROM assignment_requests ar
           JOIN users u ON ar.client_id = u.id
           WHERE ar.doctor_id = ?
           AND ar.status IN ('in_progress', 'payment_verified', 'accepted')
           AND ar.deadline >= CURRENT_DATE
           ORDER BY ar.deadline ASC
           LIMIT 10`
        : `SELECT
             ar.id,
             ar.title,
             ar.deadline,
             ar.status,
             u.full_name as client_name,
             DATEDIFF(ar.deadline, NOW()) as days_left,
             CASE WHEN DATEDIFF(ar.deadline, NOW()) <= 2 THEN 1 ELSE 0 END as urgent
           FROM assignment_requests ar
           JOIN users u ON ar.client_id = u.id
           WHERE ar.doctor_id = ?
           AND ar.status IN ('in_progress', 'payment_verified', 'accepted')
           AND ar.deadline >= CURDATE()
           ORDER BY ar.deadline ASC
           LIMIT 10`,
      [consultantId]
    );

    // Calculate progress for each assignment (mock - you can enhance this)
    const deadlinesWithProgress = deadlines.map((d) => ({
      ...d,
      progress: d.status === 'in_progress' ? 50 : 25,
      daysLeft: Number(d.days_left || 0),
    }));

    return NextResponse.json(deadlinesWithProgress);
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming deadlines' },
      { status: 500 }
    );
  }
}
