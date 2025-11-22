import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch About Me data
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT about_text, photo IS NOT NULL as has_photo FROM doctor_about_me WHERE user_id = ?',
      [user.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ about_text: '', has_photo: false });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching About Me:', error);
    return NextResponse.json(
      { error: 'Failed to fetch About Me data' },
      { status: 500 }
    );
  }
}

// POST/PUT - Save About Me text
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors can edit About Me
    if (user.role !== 'management' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors can edit About Me section' },
        { status: 403 }
      );
    }

    const { about_text } = await request.json();

    if (!about_text || about_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'About text is required' },
        { status: 400 }
      );
    }

    // Check if record exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM doctor_about_me WHERE user_id = ?',
      [user.userId]
    );

    if (existing.length === 0) {
      // Insert new record
      await pool.execute(
        'INSERT INTO doctor_about_me (user_id, about_text) VALUES (?, ?)',
        [user.userId, about_text.trim()]
      );
    } else {
      // Update existing record
      await pool.execute(
        'UPDATE doctor_about_me SET about_text = ? WHERE user_id = ?',
        [about_text.trim(), user.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'About Me updated successfully',
    });
  } catch (error) {
    console.error('Error saving About Me:', error);
    return NextResponse.json(
      { error: 'Failed to save About Me data' },
      { status: 500 }
    );
  }
}
