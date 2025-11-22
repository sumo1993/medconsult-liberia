import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// PUT - Approve or reject research paper
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const paperId = params.id;
    const body = await request.json();
    const { action, rejection_reason } = body;

    if (action === 'approve') {
      // Approve and publish
      await pool.execute(
        `UPDATE research_posts 
         SET status = 'published', 
             published_at = NOW(),
             reviewed_by = ?,
             reviewed_at = NOW()
         WHERE id = ?`,
        [user.userId, paperId]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Research paper approved and published' 
      });

    } else if (action === 'reject') {
      // Reject and send back to draft
      await pool.execute(
        `UPDATE research_posts 
         SET status = 'draft',
             rejection_reason = ?,
             reviewed_by = ?,
             reviewed_at = NOW()
         WHERE id = ?`,
        [rejection_reason, user.userId, paperId]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Research paper rejected' 
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
