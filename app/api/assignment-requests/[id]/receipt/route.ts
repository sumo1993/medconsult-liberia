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
    const requestId = params.id;

    const [requests] = await pool.execute<RowDataPacket[]>(
      'SELECT payment_receipt_data, payment_receipt_filename, client_id, doctor_id FROM assignment_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0 || !requests[0].payment_receipt_data) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];

    // Check authorization - only client who uploaded or assigned doctor can view
    if (
      user.role === 'client' && assignmentRequest.client_id !== user.userId ||
      (user.role === 'management' || user.role === 'admin') && assignmentRequest.doctor_id !== user.userId
    ) {
      if (user.role !== 'management' && user.role !== 'admin' && user.userId !== assignmentRequest.client_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const buffer = Buffer.from(assignmentRequest.payment_receipt_data);
    const filename = assignmentRequest.payment_receipt_filename || 'receipt';
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (filename.match(/\.(jpg|jpeg)$/i)) {
      contentType = 'image/jpeg';
    } else if (filename.match(/\.png$/i)) {
      contentType = 'image/png';
    } else if (filename.match(/\.gif$/i)) {
      contentType = 'image/gif';
    } else if (filename.match(/\.pdf$/i)) {
      contentType = 'application/pdf';
    } else if (filename.match(/\.webp$/i)) {
      contentType = 'image/webp';
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading receipt:', error);
    return NextResponse.json(
      { error: 'Failed to download receipt' },
      { status: 500 }
    );
  }
}
