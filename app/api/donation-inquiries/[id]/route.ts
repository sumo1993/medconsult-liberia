import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// PATCH update donation inquiry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin or management access
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or Management access required.' },
        { status: 401 }
      );
    }

    const { status } = await request.json();

    // Validate status
    if (!['pending', 'contacted', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    await pool.execute(
      'UPDATE donation_inquiries SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error('Error updating donation inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to update donation inquiry' },
      { status: 500 }
    );
  }
}
