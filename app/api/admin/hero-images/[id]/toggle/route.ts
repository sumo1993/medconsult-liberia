import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// PATCH - Toggle image active status
export async function PATCH(
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

    // Toggle is_active status
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE hero_images SET is_active = NOT is_active WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    console.log('[Hero Images] Toggled active status for image:', id);

    return NextResponse.json({ success: true, message: 'Image status toggled successfully' });
  } catch (error) {
    console.error('[Hero Images] Error toggling status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle image status' },
      { status: 500 }
    );
  }
}
