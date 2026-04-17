import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, logActivity } from '@/lib/auth';
import { sign } from 'jsonwebtoken';
import { rateLimit } from '@/lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 10, windowMs: 60_000, prefix: 'login' });
  if (limited) return limited;

  try {
    const body = await request.json();
    const rawEmail = String(body?.email || '');
    const email = rawEmail
      .trim()
      .replace(/＠/g, '@')
      .replace(/[。．｡]/g, '.')
      .replace(/\s+/g, '')
      .toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const auth = await authenticateUser(email, password);

    if (!auth.ok) {
      if (auth.reason === 'suspended') {
        return NextResponse.json(
          {
            error: 'Your account has been suspended. Please contact support for assistance.',
            accountStatus: 'suspended',
          },
          { status: 403 }
        );
      }
      if (auth.reason === 'inactive') {
        return NextResponse.json(
          {
            error: 'Your account is inactive. Please contact support to reactivate.',
            accountStatus: 'inactive',
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          ...(process.env.NODE_ENV !== 'production' ? { debug: { email } } : {}),
        },
        { status: 401 }
      );
    }

    const user = auth.user;

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

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;
    const ua = request.headers.get('user-agent') || undefined;
    void logActivity(user.id, 'login', 'user', user.id, ip, ua);

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
