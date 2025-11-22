import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// PUT - Submit paper for review
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('🔥 Submit API called');
  try {
    const user = await verifyAuth(request);
    console.log('User:', user);
    
    if (!user || (user.role !== 'consultant' && user.role !== 'researcher')) {
      console.log('Unauthorized - role:', user?.role);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const paperId = params.id;
    console.log('Paper ID:', paperId);

    // Verify ownership and status
    const [existing]: any = await pool.execute(
      'SELECT author_id, status FROM research_posts WHERE id = ?',
      [paperId]
    );
    console.log('Existing paper:', existing);

    if (existing.length === 0 || existing[0].author_id !== user.userId) {
      console.log('Not found or unauthorized');
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    if (existing[0].status !== 'draft') {
      console.log('Paper status is not draft:', existing[0].status);
      return NextResponse.json({ error: 'Paper already submitted or published' }, { status: 400 });
    }

    // Update status to pending
    console.log('Updating status to pending...');
    const [result]: any = await pool.execute(
      `UPDATE research_posts 
       SET status = 'pending', rejection_reason = NULL, updated_at = NOW()
       WHERE id = ? AND author_id = ?`,
      [paperId, user.userId]
    );
    console.log('Update result:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Paper submitted for admin review' 
    });
  } catch (error: any) {
    console.error('❌ Error submitting paper:', error);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { error: 'Failed to submit paper', details: error.message },
      { status: 500 }
    );
  }
}
