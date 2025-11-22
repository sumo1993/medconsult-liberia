import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { createUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, role, phone, status, email_verified, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if cookie exists
    const authToken = request.cookies.get('auth-token');
    console.log('Auth token present:', !!authToken);
    console.log('All cookies:', request.cookies.getAll());
    
    // Verify admin access
    const user = await verifyAuth(request);
    console.log('Verified user:', user);
    
    if (!user || user.role !== 'admin') {
      console.log('Authorization failed. User:', user);
      return NextResponse.json(
        { error: 'Unauthorized - Please login as admin' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, full_name, role, phone } = body;

    // Validate input
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'management', 'client', 'accountant', 'consultant', 'researcher'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await createUser(email, password, full_name, role, phone);

    if (!newUser) {
      return NextResponse.json(
        { error: 'User already exists or creation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
