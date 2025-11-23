import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, logActivity } from '@/lib/auth';
import { sign } from 'jsonwebtoken';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists first (to provide better error messages)
    const [userCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, status FROM users WHERE email = ?',
      [email]
    );

    if (userCheck.length > 0) {
      const userStatus = userCheck[0].status;
      
      // If account is suspended or inactive, provide specific message
      if (userStatus === 'suspended') {
        console.log(`[Login] Blocked suspended user: ${email}`);
        return NextResponse.json(
          { 
            error: 'Your account has been suspended. Please contact support for assistance.',
            accountStatus: 'suspended'
          },
          { status: 403 }
        );
      }
      
      if (userStatus === 'inactive') {
        console.log(`[Login] Blocked inactive user: ${email}`);
        return NextResponse.json(
          { 
            error: 'Your account is inactive. Please contact support to reactivate.',
            accountStatus: 'inactive'
          },
          { status: 403 }
        );
      }
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log activity
    await logActivity(
      user.id,
      'login',
      'user',
      user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token: token, // Send token in response body
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Also try to set cookie as fallback
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    console.log('Login successful, token sent for user:', user.email);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      dbHost: process.env.DB_HOST,
      dbPort: process.env.DB_PORT,
      dbUser: process.env.DB_USER,
      dbName: process.env.DB_NAME,
    });
    return NextResponse.json(
      { 
        error: 'Login failed. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
