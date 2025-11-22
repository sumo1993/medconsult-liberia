import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// DELETE - Delete research paper
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const paperId = params.id;

    // Verify ownership and can only delete drafts
    const [existing]: any = await pool.execute(
      'SELECT author_id, status FROM research_posts WHERE id = ?',
      [paperId]
    );

    if (existing.length === 0 || existing[0].author_id !== user.userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    if (existing[0].status !== 'draft') {
      return NextResponse.json({ error: 'Can only delete draft papers' }, { status: 400 });
    }

    await pool.execute(
      'DELETE FROM research_posts WHERE id = ? AND author_id = ?',
      [paperId, user.userId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Paper deleted' 
    });
  } catch (error) {
    console.error('Error deleting paper:', error);
    return NextResponse.json(
      { error: 'Failed to delete paper' },
      { status: 500 }
    );
  }
}
