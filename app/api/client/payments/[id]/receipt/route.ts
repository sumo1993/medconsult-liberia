import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const assignmentId = params.id;

    // Fetch assignment with payment receipt
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.client_id,
        ar.payment_receipt_data as receipt_data,
        ar.payment_receipt_filename as receipt_filename
       FROM assignment_requests ar
       WHERE ar.id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignments[0];

    // Verify user owns this assignment
    if (assignment.client_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!assignment.receipt_data) {
      return NextResponse.json({ error: 'No receipt available' }, { status: 404 });
    }

    // Return receipt image
    const receiptBuffer = Buffer.from(assignment.receipt_data);
    
    return new NextResponse(receiptBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="${assignment.receipt_filename || 'receipt.jpg'}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
