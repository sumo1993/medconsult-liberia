import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Find user_id if user exists
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    const userId = users.length > 0 ? users[0].id : null;

    // Insert into database with user_id
    const [result] = await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject, message, userId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check here for admin access
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, email, subject, message, user_id, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 50'
    );

    return NextResponse.json({ messages: rows }, { status: 200 });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
