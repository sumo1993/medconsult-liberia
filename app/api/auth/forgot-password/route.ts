import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { ensureResetPasswordColumns } from '@/lib/ensureResetColumns';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 5, windowMs: 60_000, prefix: 'forgot-pw' });
  if (limited) return limited;

  try {
    await ensureResetPasswordColumns();
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

      // Silently skip inactive accounts to prevent enumeration
      if (user.status !== 'active') {
        return NextResponse.json({
          success: true,
          message: 'If an account exists with that email, password reset instructions have been sent.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await pool.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [resetToken, resetTokenExpiry, user.id]
      );

      const appOrigin =
        process.env.NEXT_PUBLIC_APP_URL ||
        request.headers.get('origin') ||
        'http://localhost:3000';
      const resetLink = `${appOrigin.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

      let emailSent = false;
      let deliveryError = '';

      // Send email with reset link
      try {
        await sendPasswordResetEmail(user.email, user.full_name, resetToken, resetLink);
        emailSent = true;
      } catch (emailError) {
        console.error('[Forgot Password] Failed to send email:', emailError);
        deliveryError = emailError instanceof Error ? emailError.message : 'Unknown SMTP error';
      }

      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          success: true,
          emailSent,
          message: emailSent
            ? 'Password reset email sent successfully.'
            : 'Password reset token generated, but email delivery failed in local mode.',
          devResetLink: emailSent ? '' : resetLink,
          deliveryError: emailSent ? '' : deliveryError,
        });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to process request. Please try again.',
        ...(process.env.NODE_ENV !== 'production' ? { details: errorMessage } : {}),
      },
      { status: 500 }
    );
  }
}
