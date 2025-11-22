import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Change Email] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Change Email] Request body:', { newEmail: body.newEmail, hasPassword: !!body.password });
    
    const { newEmail, password } = body;

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'New email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    console.log('[Change Email] Request from user:', user.userId);

    // Get current user data
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT email, password_hash FROM users WHERE id = ?',
      [user.userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = users[0];

    // Check if new email is same as current
    if (newEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'New email must be different from current email' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, currentUser.password_hash);
    if (!isValid) {
      console.log('[Change Email] Invalid password for user:', user.userId);
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      );
    }

    // Check if new email already exists
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [newEmail, user.userId]
    );

    if (existingUsers.length > 0) {
      console.log('[Change Email] Email already in use:', newEmail);
      return NextResponse.json(
        { error: 'This email address is already in use by another account' },
        { status: 400 }
      );
    }

    // Update email
    await pool.execute(
      'UPDATE users SET email = ? WHERE id = ?',
      [newEmail, user.userId]
    );

    console.log('[Change Email] Email changed successfully:', currentUser.email, '->', newEmail);

    return NextResponse.json({
      success: true,
      message: 'Email changed successfully. Please login with your new email.',
    });
  } catch (error) {
    console.error('[Change Email] Error:', error);
    return NextResponse.json(
      { error: 'Failed to change email' },
      { status: 500 }
    );
  }
}
