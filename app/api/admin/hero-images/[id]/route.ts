import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// DELETE - Remove hero image
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Delete the image
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM hero_images WHERE id = ?',
      [id]
    );

    console.log('[Hero Images] Deleted image:', id, 'Affected rows:', result.affectedRows);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[Hero Images] Error deleting:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero image' },
      { status: 500 }
    );
  }
}
