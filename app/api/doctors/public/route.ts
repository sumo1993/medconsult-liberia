import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch doctors with their About Me data
export async function GET(request: NextRequest) {
  try {
    const [doctors] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.email,
        COALESCE(up.full_name, u.full_name) as full_name,
        up.status,
        up.educational_level,
        up.university,
        up.specialization,
        up.years_of_experience,
        up.languages_spoken,
        up.research_interests,
        up.available_hours,
        up.certifications,
        up.profile_photo IS NOT NULL as has_profile_photo,
        dam.about_text,
        dam.photo IS NOT NULL as has_about_photo
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN doctor_about_me dam ON u.id = dam.user_id
       WHERE u.role = 'management'
       ORDER BY COALESCE(up.full_name, u.full_name) ASC`
    );

    // Return with no-cache headers
    return NextResponse.json({ doctors }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}
