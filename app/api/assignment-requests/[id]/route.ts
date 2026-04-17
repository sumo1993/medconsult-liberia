import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

const NON_EDITABLE_AFTER_PAYMENT_OR_START = new Set([
  'payment_uploaded',
  'payment_verified',
  'in_progress',
  'completed',
]);

function canClientEditOrDelete(assignmentRequest: RowDataPacket): boolean {
  const status = String(assignmentRequest.status || '');
  const hasPaymentEvidence =
    !!assignmentRequest.payment_method ||
    !!assignmentRequest.payment_receipt_filename ||
    !!assignmentRequest.payment_receipt_data;

  return !NON_EDITABLE_AFTER_PAYMENT_OR_START.has(status) && !hasPaymentEvidence;
}

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
              d.email as doctor_email,
              consultant.full_name as consultant_name,
              consultant.email as consultant_email
       FROM assignment_requests ar
       LEFT JOIN users c ON ar.client_id = c.id
       LEFT JOIN users d ON ar.doctor_id = d.id
       LEFT JOIN users consultant ON ar.consultant_id = consultant.id
       WHERE ar.id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];

    // Check authorization
    const isClient = user.role === 'client' && assignmentRequest.client_id === user.userId;
    const isAssignedConsultant = user.role === 'consultant' && assignmentRequest.consultant_id === user.userId;
    const isManagementOrAdmin = user.role === 'management' || user.role === 'admin';
    
    if (!isClient && !isAssignedConsultant && !isManagementOrAdmin) {
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

      case 'client_update_request':
        // Client edits own request before payment/start
        if (user.role !== 'client' || assignmentRequest.client_id !== user.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (!canClientEditOrDelete(assignmentRequest)) {
          return NextResponse.json(
            { error: 'You can only edit before payment upload and before work starts.' },
            { status: 400 }
          );
        }

        if (!data.title || !data.description) {
          return NextResponse.json(
            { error: 'Title and description are required.' },
            { status: 400 }
          );
        }

        await pool.execute(
          `UPDATE assignment_requests
           SET title = ?, subject = ?, description = ?, deadline = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            String(data.title).trim(),
            data.subject ? String(data.subject).trim() : null,
            String(data.description).trim(),
            data.deadline || null,
            requestId,
          ]
        );

        await pool.execute(
          `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
           VALUES (?, ?, ?, 'general')`,
          [requestId, user.userId, 'Client updated assignment details before payment/start.']
        );

        return NextResponse.json({ success: true, message: 'Assignment updated successfully.' });

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

// DELETE - Delete assignment request (client only, before payment/start)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const requestId = params.id;

    const [requests] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM assignment_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const assignmentRequest = requests[0];
    if (assignmentRequest.client_id !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!canClientEditOrDelete(assignmentRequest)) {
      return NextResponse.json(
        { error: 'You can only delete before payment upload and before work starts.' },
        { status: 400 }
      );
    }

    // Remove dependent rows first to avoid FK issues in stricter DB setups.
    await pool.execute('DELETE FROM assignment_message_reads WHERE assignment_request_id = ?', [requestId]).catch(() => {});
    await pool.execute('DELETE FROM assignment_messages WHERE assignment_request_id = ?', [requestId]).catch(() => {});
    await pool.execute('DELETE FROM assignment_applications WHERE assignment_id = ?', [requestId]).catch(() => {});
    await pool.execute('DELETE FROM ratings WHERE assignment_request_id = ?', [requestId]).catch(() => {});

    await pool.execute<ResultSetHeader>('DELETE FROM assignment_requests WHERE id = ?', [requestId]);

    return NextResponse.json({ success: true, message: 'Assignment request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting assignment request:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment request' },
      { status: 500 }
    );
  }
}
