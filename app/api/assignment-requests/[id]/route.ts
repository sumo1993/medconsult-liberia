import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch single assignment request
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
      `SELECT ar.*, 
              c.full_name as client_name,
              c.email as client_email,
              d.full_name as doctor_name,
              d.email as doctor_email
       FROM assignment_requests ar
       LEFT JOIN users c ON ar.client_id = c.id
       LEFT JOIN users d ON ar.doctor_id = d.id
       WHERE ar.id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];

    // Check authorization
    if (
      user.role === 'client' && assignmentRequest.client_id !== user.userId ||
      (user.role !== 'client' && user.role !== 'management' && user.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove BLOB data
    const sanitized = {
      ...assignmentRequest,
      attachment_data: null,
      payment_receipt_data: null,
      has_attachment: !!assignmentRequest.attachment_data,
      has_receipt: !!assignmentRequest.payment_receipt_data,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching assignment request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment request' },
      { status: 500 }
    );
  }
}

// PUT - Update assignment request (doctor pricing, client response, etc.)
export async function PUT(
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
    const data = await request.json();
    const { action } = data;

    // Fetch current request
    const [requests] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM assignment_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];

    // Handle different actions
    switch (action) {
      case 'propose_price':
        // Doctor proposes price
        if (user.role !== 'management' && user.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET doctor_id = ?, proposed_price = ?, final_price = ?, currency = ?, 
               doctor_notes = ?, status = 'price_proposed', price_proposed_at = NOW(), reviewed_at = NOW()
           WHERE id = ?`,
          [user.userId, data.price, data.price, data.currency || 'USD', data.notes || null, requestId]
        );

        // Add message
        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'price_proposal')`,
          [requestId, user.userId, `Price proposed: ${data.currency || 'USD'} ${data.price}. ${data.notes || ''}`, ]
        );

        return NextResponse.json({ success: true, message: 'Price proposed successfully' });

      case 'accept_price':
        // Client accepts price
        if (user.role !== 'client' || assignmentRequest.client_id !== user.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET status = 'payment_pending', accepted_at = NOW()
           WHERE id = ?`,
          [requestId]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'acceptance')`,
          [requestId, user.userId, 'Price accepted. Proceeding to payment.']
        );

        return NextResponse.json({ success: true, message: 'Price accepted' });

      case 'reject_price':
        // Client rejects price
        if (user.role !== 'client' || assignmentRequest.client_id !== user.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET status = 'rejected', rejection_reason = ?, rejected_at = NOW()
           WHERE id = ?`,
          [data.reason || 'Price rejected', requestId]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'rejection')`,
          [requestId, user.userId, `Rejected: ${data.reason || 'Price not acceptable'}`]
        );

        return NextResponse.json({ success: true, message: 'Request rejected' });

      case 'request_reduction':
        // Client requests price reduction
        if (user.role !== 'client' || assignmentRequest.client_id !== user.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET status = 'negotiating', negotiation_message = ?, negotiated_price = ?
           WHERE id = ?`,
          [data.message, data.counter_price || null, requestId]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'price_counter')`,
          [requestId, user.userId, data.message]
        );

        return NextResponse.json({ success: true, message: 'Reduction requested' });

      case 'update_price':
        // Doctor updates price after negotiation
        if (user.role !== 'management' && user.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET proposed_price = ?, final_price = ?, status = 'price_proposed', doctor_notes = ?
           WHERE id = ?`,
          [data.price, data.price, data.notes || null, requestId]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'price_proposal')`,
          [requestId, user.userId, `Updated price: ${data.currency || 'USD'} ${data.price}. ${data.notes || ''}`]
        );

        return NextResponse.json({ success: true, message: 'Price updated' });

      case 'upload_payment':
        // Client uploads payment receipt
        if (user.role !== 'client' || assignmentRequest.client_id !== user.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        let receiptBuffer = null;
        let receiptSize = 0;
        if (data.receipt_data && data.receipt_filename) {
          const base64Data = data.receipt_data.includes(',')
            ? data.receipt_data.split(',')[1]
            : data.receipt_data;
          receiptBuffer = Buffer.from(base64Data, 'base64');
          receiptSize = receiptBuffer.length;
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET payment_method = ?, payment_receipt_filename = ?, payment_receipt_data = ?, 
               payment_receipt_size = ?, status = 'in_progress', payment_verified_at = NOW()
           WHERE id = ?`,
          [data.payment_method, data.receipt_filename, receiptBuffer, receiptSize, requestId]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'general')`,
          [requestId, user.userId, `Payment confirmed. In process.`]
        );

        return NextResponse.json({ success: true, message: 'Payment confirmed. In process.' });

      case 'verify_payment':
        // Doctor verifies payment and starts work
        if (user.role !== 'management' && user.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await pool.execute(
          `UPDATE assignment_requests 
           SET status = 'in_progress', payment_verified_at = NOW()
           WHERE id = ?`,
          [requestId]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'general')`,
          [requestId, user.userId, 'Payment verified. Work is now in progress.']
        );

        return NextResponse.json({ success: true, message: 'Payment verified and work started' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating assignment request:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment request' },
      { status: 500 }
    );
  }
}
