import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, amount, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Save to database
    await pool.execute(
      `INSERT INTO donation_inquiries (name, email, phone, amount, message, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, phone || null, amount || null, message]
    );

    // TODO: Send email notification to admin
    // You can add email sending logic here later

    return NextResponse.json({
      success: true,
      message: 'Thank you! We will contact you shortly about your donation.',
    });
  } catch (error) {
    console.error('Error saving donation inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    );
  }
}
