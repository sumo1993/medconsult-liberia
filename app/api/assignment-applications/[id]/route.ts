import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// PUT - Approve or reject application
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Application API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'management') {
      console.log('[Application API] Access denied - role:', user.role);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const params = await context.params;
    const applicationId = params.id;
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.log('[Application API] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { action, rejectionReason } = body;

    console.log('[Application API] Processing application:', applicationId, 'Action:', action);

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get application details
    const [applications] = await pool.execute<RowDataPacket[]>(
      `SELECT aa.id, aa.assignment_id, aa.consultant_id, aa.status,
              u.full_name as consultant_name, ar.title as assignment_title
       FROM assignment_applications aa
       JOIN users u ON aa.consultant_id = u.id
       JOIN assignment_requests ar ON aa.assignment_id = ar.id
       WHERE aa.id = ?`,
      [applicationId]
    );

    if (applications.length === 0) {
      console.log('[Application API] Application not found:', applicationId);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = applications[0];
    console.log('[Application API] Found application for:', application.consultant_name);

    if (action === 'approve') {
      // Update application status - use simple query first
      await pool.execute(
        `UPDATE assignment_applications SET status = 'approved' WHERE id = ?`,
        [applicationId]
      );

      // Assign consultant to the assignment
      await pool.execute(
        `UPDATE assignment_requests 
         SET consultant_id = ?, status = 'assigned'
         WHERE id = ?`,
        [application.consultant_id, application.assignment_id]
      );

      // Reject other pending applications for this assignment
      await pool.execute(
        `UPDATE assignment_applications 
         SET status = 'rejected'
         WHERE assignment_id = ? AND id != ? AND status = 'pending'`,
        [application.assignment_id, applicationId]
      );

      // Add system message
      try {
        await pool.execute(
          `INSERT INTO assignment_messages 
           (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'system')`,
          [
            application.assignment_id,
            user.userId,
            `✅ ${application.consultant_name} has been approved and assigned to this assignment.`
          ]
        );
      } catch (msgError) {
        console.log('[Application API] Warning - could not add message:', msgError);
        // Continue anyway
      }

      console.log('[Application API] Application approved successfully');
      return NextResponse.json({ 
        success: true, 
        message: `Application approved! ${application.consultant_name} has been assigned to ${application.assignment_title}.` 
      });
    } else {
      // Reject application
      await pool.execute(
        `UPDATE assignment_applications SET status = 'rejected' WHERE id = ?`,
        [applicationId]
      );

      console.log('[Application API] Application rejected successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Application rejected' 
      });
    }
  } catch (error: any) {
    console.error('[Application API] Error processing application:', error);
    console.error('[Application API] Error details:', error.message);
    console.error('[Application API] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to process application: ' + error.message },
      { status: 500 }
    );
  }
}

