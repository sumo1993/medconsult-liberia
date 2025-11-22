import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// GET - Get my password change requests
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [requests] = await pool.execute(`
      SELECT 
        pcr.*,
        admin.full_name as reviewer_name
      FROM password_change_requests pcr
      LEFT JOIN users admin ON pcr.reviewed_by = admin.id
      WHERE pcr.user_id = ?
      ORDER BY pcr.requested_at DESC
    `, [user.userId]);

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Error fetching password requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch requests',
      details: error.message 
    }, { status: 500 });
  }
}
