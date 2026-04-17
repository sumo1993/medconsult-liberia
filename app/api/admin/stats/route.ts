import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

async function safeCount(tableName: string): Promise<number> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const raw = rows?.[0]?.count ?? 0;
    const count = Number(raw);
    return Number.isFinite(count) ? count : 0;
  } catch (error) {
    console.error(`[Admin Stats] Failed counting ${tableName}:`, error);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [
      totalUsers,
      totalMessages,
      totalAppointments,
      totalResearch,
      totalAssignments,
    ] = await Promise.all([
      safeCount('users'),
      safeCount('contact_messages'),
      safeCount('appointments'),
      safeCount('research_posts'),
      safeCount('assignment_requests'),
    ]);

    return NextResponse.json({
      totalUsers,
      totalMessages,
      totalAppointments,
      totalResearch,
      totalAssignments,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
