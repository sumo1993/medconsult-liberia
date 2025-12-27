import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// POST - Save About section settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can edit any user's About section
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can edit About section' },
        { status: 403 }
      );
    }

    const { userId, full_name, status, about_text } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user profile info (full_name, status)
    // First check if user_profiles exists for this user
    const [existingProfile] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (existingProfile.length === 0) {
      // Create profile
      await pool.execute(
        'INSERT INTO user_profiles (user_id, full_name, status) VALUES (?, ?, ?)',
        [userId, full_name || '', status || '']
      );
    } else {
      // Update profile
      await pool.execute(
        'UPDATE user_profiles SET full_name = ?, status = ? WHERE user_id = ?',
        [full_name || '', status || '', userId]
      );
    }

    // Also update the users table
    await pool.execute(
      'UPDATE users SET full_name = ? WHERE id = ?',
      [full_name || '', userId]
    );

    // Update about_text in doctor_about_me table
    if (about_text !== undefined) {
      const [existingAbout] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM doctor_about_me WHERE user_id = ?',
        [userId]
      );

      if (existingAbout.length === 0) {
        // Create about record
        await pool.execute(
          'INSERT INTO doctor_about_me (user_id, about_text) VALUES (?, ?)',
          [userId, about_text || '']
        );
      } else {
        // Update about record
        await pool.execute(
          'UPDATE doctor_about_me SET about_text = ? WHERE user_id = ?',
          [about_text || '', userId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'About section updated successfully',
    });
  } catch (error) {
    console.error('Error saving About section:', error);
    return NextResponse.json(
      { error: 'Failed to save About section' },
      { status: 500 }
    );
  }
}

// GET - Get About settings for a specific user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.email,
        COALESCE(up.full_name, u.full_name) as full_name,
        up.status,
        dam.about_text,
        dam.photo IS NOT NULL as has_about_photo
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN doctor_about_me dam ON u.id = dam.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching About settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch About settings' },
      { status: 500 }
    );
  }
}


