import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js 15+ requirement)
    const { id } = await params;

    const body = await request.json();
    const { status, feedback } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update assignment status and feedback
    await pool.execute(
      'UPDATE assignment_requests SET status = ?, feedback = ?, updated_at = NOW() WHERE id = ?',
      [status, feedback || null, id]
    );

    // If assignment is completed, increment total consultations
    if (status === 'completed') {
      await pool.execute(
        'UPDATE statistics SET total_consultations = total_consultations + 1 WHERE id = 1'
      );
      console.log('✅ Consultation count incremented');
    }

    return NextResponse.json(
      {
        success: true,
        message: `Assignment ${status} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}
