import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch all doctors with their public profiles
export async function GET(request: NextRequest) {
  try {
    const [doctors] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.email,
        u.full_name,
        up.status,
        up.educational_level,
        up.university,
        up.bio,
        up.specialization,
        up.years_of_experience,
        up.languages_spoken,
        up.research_interests,
        up.available_hours,
        up.certifications,
        up.profile_photo IS NOT NULL as has_photo
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.role = 'management' OR u.role = 'admin'
       ORDER BY u.full_name ASC`
    );

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}
