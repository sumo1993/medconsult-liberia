import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

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

    // Get total users
    const [userCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users'
    );

    // Get total messages
    const [messageCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM contact_messages'
    );

    // Get total appointments
    const [appointmentCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM appointments'
    );

    // Get total research posts
    const [researchCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM research_posts'
    );

    // Get total assignment requests
    const [assignmentCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM assignment_requests'
    );

    return NextResponse.json({
      totalUsers: userCount[0].count,
      totalMessages: messageCount[0].count,
      totalAppointments: appointmentCount[0].count,
      totalResearch: researchCount[0].count,
      totalAssignments: assignmentCount[0].count,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
