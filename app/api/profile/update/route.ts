import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Profile Update] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    console.log('[Profile Update] User ID:', user.userId);
    console.log('[Profile Update] Updating profile with data:', {
      full_name: data.full_name,
      email: data.email,
      date_of_birth: data.date_of_birth,
      city: data.city,
      phone_number: data.phone_number,
    });

    // Update user profile
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users SET 
        full_name = ?,
        email = ?,
        title = ?,
        date_of_birth = ?,
        gender = ?,
        city = ?,
        county = ?,
        country = ?,
        educational_level = ?,
        marital_status = ?,
        employment_status = ?,
        occupation = ?,
        phone_number = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        emergency_contact_relationship = ?,
        specialization = ?,
        years_of_experience = ?,
        license_number = ?,
        research_interests = ?,
        current_projects = ?,
        bio = ?
      WHERE id = ?`,
      [
        data.full_name,
        data.email,
        data.title || null,
        data.date_of_birth || null,
        data.gender || null,
        data.city || null,
        data.county || null,
        data.country || null,
        data.educational_level || null,
        data.marital_status || null,
        data.employment_status || null,
        data.occupation || null,
        data.phone_number || null,
        data.emergency_contact_name || null,
        data.emergency_contact_phone || null,
        data.emergency_contact_relationship || null,
        data.specialization || null,
        data.years_of_experience || null,
        data.license_number || null,
        data.research_interests || null,
        data.current_projects || null,
        data.bio || null,
        user.userId,
      ]
    );

    console.log('[Profile Update] Affected rows:', result.affectedRows);
    console.log('[Profile Update] Changed rows:', result.changedRows);

    if (result.affectedRows === 0) {
      console.log('[Profile Update] User not found with ID:', user.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Profile Update] ✅ Profile updated successfully for user:', user.userId);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('[Profile Update] ❌ Error updating profile:', error);
    console.error('[Profile Update] Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage 
      },
      { status: 500 }
    );
  }
}
