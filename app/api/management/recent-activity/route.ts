import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultantId = user.userId;
    const activities: any[] = [];

    // Get recent assignment submissions
    const [newAssignments] = await pool.execute<RowDataPacket[]>(
      `SELECT ar.id, ar.title, ar.created_at, u.full_name as client_name
       FROM assignment_requests ar
       JOIN users u ON ar.client_id = u.id
       WHERE ar.doctor_id = ? AND ar.status = 'pending_review'
       ORDER BY ar.created_at DESC
       LIMIT 5`,
      [consultantId]
    );

    newAssignments.forEach(a => {
      activities.push({
        icon: 'FileText',
        color: 'bg-blue-500',
        title: 'New Assignment Request',
        description: `${a.client_name} submitted "${a.title}"`,
        timestamp: a.created_at,
      });
    });

    // Get recent payment uploads
    const [payments] = await pool.execute<RowDataPacket[]>(
      `SELECT ar.id, ar.title, ar.updated_at, u.full_name as client_name
       FROM assignment_requests ar
       JOIN users u ON ar.client_id = u.id
       WHERE ar.doctor_id = ? AND ar.status = 'payment_uploaded'
       ORDER BY ar.updated_at DESC
       LIMIT 5`,
      [consultantId]
    );

    payments.forEach(p => {
      activities.push({
        icon: 'DollarSign',
        color: 'bg-green-500',
        title: 'Payment Receipt Uploaded',
        description: `${p.client_name} uploaded payment for "${p.title}"`,
        timestamp: p.updated_at,
      });
    });

    // Get recent completions
    const [completed] = await pool.execute<RowDataPacket[]>(
      `SELECT ar.id, ar.title, ar.completed_at, u.full_name as client_name
       FROM assignment_requests ar
       JOIN users u ON ar.client_id = u.id
       WHERE ar.doctor_id = ? AND ar.status = 'completed'
       ORDER BY ar.completed_at DESC
       LIMIT 5`,
      [consultantId]
    );

    completed.forEach(c => {
      activities.push({
        icon: 'CheckCircle',
        color: 'bg-emerald-500',
        title: 'Assignment Completed',
        description: `"${c.title}" marked as completed`,
        timestamp: c.completed_at,
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
