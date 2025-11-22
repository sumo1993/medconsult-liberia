import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[Forgot Password] Request for:', email);

    // Check if user exists
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, status FROM users WHERE email = ?',
      [email]
    );

    // Always return success to prevent email enumeration
    // But only actually process if user exists
    if (users.length > 0) {
      const user = users[0];

      // Check if account is active
      if (user.status !== 'active') {
        console.log(`[Forgot Password] Account not active: ${email} (${user.status})`);
        return NextResponse.json(
          { 
            error: `Your account is ${user.status}. Please contact support for assistance.`,
            accountStatus: user.status
          },
          { status: 403 }
        );
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await pool.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [resetToken, resetTokenExpiry, user.id]
      );

      console.log(`[Forgot Password] Reset token generated for: ${email}`);
      console.log(`[Forgot Password] Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

      // Send email with reset link
      try {
        await sendPasswordResetEmail(user.email, user.full_name, resetToken);
        console.log(`[Forgot Password] Email sent successfully to: ${email}`);
      } catch (emailError) {
        console.error('[Forgot Password] Failed to send email:', emailError);
        // Log error but don't expose it to user
      }
    } else {
      console.log('[Forgot Password] User not found:', email);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.'
    });

  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
