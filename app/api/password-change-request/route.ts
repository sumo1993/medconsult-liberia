import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

// Create password_change_requests table if it doesn't exist
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_change_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        new_password_hash VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        reviewed_by INT NULL,
        admin_notes TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);
    console.log('✅ password_change_requests table ensured');
  } catch (error) {
    console.error('Error ensuring table:', error);
  }
}

// POST - Submit password change request
export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only accountant can request password changes (for now)
    if (user.role !== 'accountant') {
      return NextResponse.json({ error: 'Only accountants can request password changes' }, { status: 403 });
    }

    const { reason, newPassword } = await request.json();

    if (!reason || !newPassword) {
      return NextResponse.json({ error: 'Reason and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check if there's already a pending request
    const [existingRequests]: any = await pool.execute(
      `SELECT id FROM password_change_requests 
       WHERE user_id = ? AND status = 'pending'`,
      [user.userId]
    );

    if (existingRequests.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending password change request. Please wait for admin approval.' 
      }, { status: 400 });
    }

    // Create the request
    await pool.execute(
      `INSERT INTO password_change_requests 
       (user_id, user_email, user_role, reason, new_password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [user.userId, user.email, user.role, reason, hashedPassword]
    );

    return NextResponse.json({ 
      message: 'Password change request submitted successfully. Waiting for admin approval.' 
    });
  } catch (error: any) {
    console.error('Error submitting password change request:', error);
    return NextResponse.json({ 
      error: 'Failed to submit request',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get password change requests (admin only)
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [requests] = await pool.execute(`
      SELECT 
        pcr.*,
        u.full_name as requester_name,
        admin.full_name as reviewer_name
      FROM password_change_requests pcr
      LEFT JOIN users u ON pcr.user_id = u.id
      LEFT JOIN users admin ON pcr.reviewed_by = admin.id
      ORDER BY pcr.requested_at DESC
    `);

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Error fetching password change requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch requests',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Approve/Reject password change request (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action, adminNotes } = await request.json();

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get the request details
    const [requests]: any = await pool.execute(
      `SELECT * FROM password_change_requests WHERE id = ? AND status = 'pending'`,
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 });
    }

    const passwordRequest = requests[0];

    if (action === 'approve') {
      // Update user's password
      await pool.execute(
        `UPDATE users SET password = ? WHERE id = ?`,
        [passwordRequest.new_password_hash, passwordRequest.user_id]
      );
    }

    // Update request status
    await pool.execute(
      `UPDATE password_change_requests 
       SET status = ?, reviewed_at = NOW(), reviewed_by = ?, admin_notes = ?
       WHERE id = ?`,
      [action === 'approve' ? 'approved' : 'rejected', user.userId, adminNotes || null, requestId]
    );

    return NextResponse.json({ 
      message: `Password change request ${action}d successfully` 
    });
  } catch (error: any) {
    console.error('Error processing password change request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message 
    }, { status: 500 });
  }
}
