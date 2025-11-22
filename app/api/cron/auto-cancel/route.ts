import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Auto-cancel stale assignments after timeout period
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Auto-Cancel] Starting auto-cancel check...');

    const cancelledAssignments = [];

    // 1. Cancel pending_review assignments after 7 days
    const [pendingReview] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, client_id, created_at
       FROM assignment_requests
       WHERE status = 'pending_review'
       AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    for (const assignment of pendingReview) {
      await pool.execute(
        `UPDATE assignment_requests 
         SET status = 'cancelled'
         WHERE id = ?`,
        [assignment.id]
      );

      await pool.execute(
        `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
         VALUES (?, ?, ?, 'system')`,
        [assignment.id, assignment.client_id, '❌ Assignment auto-cancelled: No doctor response after 7 days.']
      );

      cancelledAssignments.push({ id: assignment.id, reason: 'No doctor response (7 days)' });
    }

    // 2. Cancel price_proposed assignments after 5 days of no client response
    const [priceProposed] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, client_id, price_proposed_at
       FROM assignment_requests
       WHERE status = 'price_proposed'
       AND price_proposed_at < DATE_SUB(NOW(), INTERVAL 5 DAY)`
    );

    for (const assignment of priceProposed) {
      await pool.execute(
        `UPDATE assignment_requests 
         SET status = 'cancelled'
         WHERE id = ?`,
        [assignment.id]
      );

      await pool.execute(
        `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
         VALUES (?, ?, ?, 'system')`,
        [assignment.id, assignment.client_id, '❌ Assignment auto-cancelled: No response to price proposal after 5 days.']
      );

      cancelledAssignments.push({ id: assignment.id, reason: 'No price response (5 days)' });
    }

    // 3. Cancel payment_pending assignments after 3 days
    const [paymentPending] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, client_id, updated_at
       FROM assignment_requests
       WHERE status = 'payment_pending'
       AND updated_at < DATE_SUB(NOW(), INTERVAL 3 DAY)`
    );

    for (const assignment of paymentPending) {
      await pool.execute(
        `UPDATE assignment_requests 
         SET status = 'cancelled'
         WHERE id = ?`,
        [assignment.id]
      );

      await pool.execute(
        `INSERT INTO assignment_messages (assignment_request_id, sender_id, message, message_type)
         VALUES (?, ?, ?, 'system')`,
        [assignment.id, assignment.client_id, '❌ Assignment auto-cancelled: Payment not received after 3 days.']
      );

      cancelledAssignments.push({ id: assignment.id, reason: 'No payment (3 days)' });
    }

    console.log(`[Auto-Cancel] Cancelled ${cancelledAssignments.length} assignments`);

    return NextResponse.json({
      success: true,
      cancelledCount: cancelledAssignments.length,
      cancelled: cancelledAssignments,
    });

  } catch (error: any) {
    console.error('[Auto-Cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-cancel assignments: ' + error.message },
      { status: 500 }
    );
  }
}
