import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch available consultants
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and management can assign consultants
    if (user.role !== 'admin' && user.role !== 'management') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all consultants (active or any status)
    const [consultants] = await pool.execute<RowDataPacket[]>(
      `SELECT id, full_name, email, status 
       FROM users 
       WHERE role = 'consultant'
       ORDER BY full_name ASC`
    );
    
    console.log('[Assign API] Found', consultants.length, 'consultants');

    return NextResponse.json({ consultants });
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultants' },
      { status: 500 }
    );
  }
}

// POST - Assign consultant to assignment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and management can assign consultants
    if (user.role !== 'admin' && user.role !== 'management') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const params = await context.params;
    const assignmentId = params.id;
    const { consultantId } = await request.json();

    if (!consultantId) {
      return NextResponse.json({ error: 'Consultant ID required' }, { status: 400 });
    }

    // Verify the assignment exists
    const [assignments] = await pool.execute<RowDataPacket[]>(
      'SELECT id, status FROM assignment_requests WHERE id = ?',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Verify the consultant exists and is a consultant
    const [consultants] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name FROM users WHERE id = ? AND role = ?',
      [consultantId, 'consultant']
    );

    if (consultants.length === 0) {
      return NextResponse.json({ error: 'Consultant not found' }, { status: 404 });
    }

    // Update the assignment with the consultant
    await pool.execute<ResultSetHeader>(
      `UPDATE assignment_requests 
       SET consultant_id = ?, 
           assigned_at = NOW(),
           status = CASE WHEN status IN ('payment_verified', 'assigned') THEN 'assigned' ELSE status END
       WHERE id = ?`,
      [consultantId, assignmentId]
    );

    // Add a message to notify about the assignment
    await pool.execute(
      `INSERT INTO assignment_messages 
       (assignment_request_id, sender_id, message, message_type)
       VALUES (?, ?, ?, 'system')`,
      [
        assignmentId,
        user.userId,
        `This assignment has been assigned to ${consultants[0].full_name}.`
      ]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Assignment assigned to ${consultants[0].full_name}` 
    });
  } catch (error) {
    console.error('Error assigning consultant:', error);
    return NextResponse.json(
      { error: 'Failed to assign consultant' },
      { status: 500 }
    );
  }
}

