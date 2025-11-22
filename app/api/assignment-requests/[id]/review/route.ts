import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// POST - Client reviews final work (accept/reject)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Client Review] Processing review...');
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

    console.log('[Client Review] Action:', action, 'for assignment:', requestId);

    if (action === 'accept') {
      // Accept - mark as completed
      await pool.execute(
        `UPDATE assignment_requests 
         SET client_review_status = 'accepted',
             client_review_notes = ?,
             client_reviewed_at = NOW(),
             status = 'completed'
         WHERE id = ?`,
        [notes || 'Work accepted', requestId]
      );

      console.log('[Client Review] Work accepted - assignment completed');

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
         WHERE id = ?`,
        [notes || 'Revisions needed', requestId]
      );

      console.log('[Client Review] Work rejected - needs revision');

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
