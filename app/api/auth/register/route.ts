import { NextRequest, NextResponse } from 'next/server';
import { createUser, logActivity } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role } = body;

    // Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Only allow client registration through public endpoint
    // Admin and management accounts must be created by admins
    const userRole = role === 'client' || !role ? 'client' : 'client';

    const user = await createUser(email, password, full_name, userRole, phone);

    if (!user) {
      return NextResponse.json(
        { error: 'User already exists or registration failed' },
        { status: 400 }
      );
    }

    // Log activity
    await logActivity(
      user.id,
      'register',
      'user',
      user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Please login.',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
