import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, preferred_date, preferred_time, reason } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
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

    // Insert into database
    const [result] = await pool.execute(
      'INSERT INTO appointments (name, email, phone, preferred_date, preferred_time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, preferred_date || null, preferred_time || null, reason || '', 'pending']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment request submitted successfully! We will contact you to confirm.',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Appointment booking error:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check here for admin access
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = 'SELECT * FROM appointments';
    const params: string[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ appointments: rows }, { status: 200 });
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
