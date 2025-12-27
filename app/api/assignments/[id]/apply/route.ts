import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// POST - Consultant applies for an assignment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('[Apply API] Starting application...');
  
  try {
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Apply API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Apply API] User:', user.email, 'Role:', user.role);

    // Only consultants can apply
    if (user.role !== 'consultant') {
      console.log('[Apply API] Not a consultant');
      return NextResponse.json({ error: 'Only consultants can apply for assignments' }, { status: 403 });
    }

    const params = await context.params;
    const assignmentId = params.id;
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const { message } = body;
    
    console.log('[Apply API] Assignment ID:', assignmentId);

    // Verify assignment exists
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT id, status, consultant_id, client_id, title 
       FROM assignment_requests 
       WHERE id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      console.log('[Apply API] Assignment not found');
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignments[0];
    console.log('[Apply API] Assignment found:', assignment.title, 'Status:', assignment.status, 'Consultant ID:', assignment.consultant_id);

    // Check if already assigned to someone else
    if (assignment.consultant_id) {
      console.log('[Apply API] Already assigned to consultant:', assignment.consultant_id);
      return NextResponse.json({ error: 'This assignment is already assigned to a consultant' }, { status: 400 });
    }

    // Check if consultant already applied
    const [existingApplication] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM assignment_applications 
       WHERE assignment_id = ? AND consultant_id = ?`,
      [assignmentId, user.userId]
    );

    if (existingApplication.length > 0) {
      console.log('[Apply API] Already applied');
      return NextResponse.json({ error: 'You have already applied for this assignment' }, { status: 400 });
    }

    // Get consultant info
    const [consultantInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT full_name, email FROM users WHERE id = ?',
      [user.userId]
    );

    console.log('[Apply API] Creating application...');

    // Create application - use simple insert
    await pool.execute<ResultSetHeader>(
      `INSERT INTO assignment_applications 
       (assignment_id, consultant_id, message, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [assignmentId, user.userId, message || 'I am interested in working on this assignment.']
    );

    console.log('[Apply API] Application created successfully');

    // Send notification message to the assignment chat
    try {
      await pool.execute(
        `INSERT INTO assignment_messages 
         (assignment_request_id, sender_id, message, message_type)
         VALUES (?, ?, ?, 'system')`,
        [
          assignmentId,
          user.userId,
          `📋 New Application: ${consultantInfo[0]?.full_name || 'A consultant'} has applied to work on this assignment.`
        ]
      );
    } catch (msgError) {
      console.log('[Apply API] Warning - could not add chat message:', msgError);
      // Continue anyway - application was created
    }

    console.log('[Apply API] Success!');
    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully! Management will review your request.' 
    });
  } catch (error: any) {
    console.error('[Apply API] Error:', error);
    console.error('[Apply API] Error message:', error.message);
    console.error('[Apply API] Error code:', error.code);
    return NextResponse.json(
      { error: 'Failed to submit application: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw application
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const assignmentId = params.id;

    await pool.execute(
      `DELETE FROM assignment_applications 
       WHERE assignment_id = ? AND consultant_id = ? AND status = 'pending'`,
      [assignmentId, user.userId]
    );

    return NextResponse.json({ success: true, message: 'Application withdrawn' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    );
  }
}

