import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// POST - Client reviews final work (accept/reject)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'client') {
      return NextResponse.json({ error: 'Only clients can review work' }, { status: 403 });
    }

    const params = await context.params;
    const requestId = parseInt(params.id);
    
    const body = await request.json();
    const { action, notes } = body; // action: 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify this assignment belongs to the authenticated client
    const [rows] = await pool.execute<(import('mysql2').RowDataPacket)[]>(
      'SELECT id FROM assignment_requests WHERE id = ? AND client_id = ?',
      [requestId, user.userId]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    if (action === 'accept') {
      await pool.execute(
        `UPDATE assignment_requests 
         SET client_review_status = 'accepted',
             client_review_notes = ?,
             client_reviewed_at = NOW(),
             status = 'completed'
         WHERE id = ? AND client_id = ?`,
        [notes || 'Work accepted', requestId, user.userId]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Work accepted! Assignment marked as completed.'
      });
    } else {
      // Reject - send back for revision (keep status as in_progress)
      await pool.execute(
        `UPDATE assignment_requests 
         SET client_review_status = 'rejected',
             client_review_notes = ?,
             client_reviewed_at = NOW()
         WHERE id = ? AND client_id = ?`,
        [notes || 'Revisions needed', requestId, user.userId]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Feedback sent. Doctor will revise the work.'
      });
    }
  } catch (error: any) {
    console.error('[Client Review] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process review: ' + error.message },
      { status: 500 }
    );
  }
}
