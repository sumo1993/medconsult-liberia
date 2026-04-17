import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      console.log('[Profile GET] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Profile GET] Fetching profile for user ID:', user.userId);

    let users: RowDataPacket[] = [];
    try {
      // Preferred rich query (newer schemas)
      const [richUsers] = await pool.execute<RowDataPacket[]>(
        `SELECT id, email, role, status, full_name, title, date_of_birth, gender, city, county, country,
         educational_level, marital_status, employment_status, occupation,
         phone_number, emergency_contact_name, emergency_contact_phone,
         emergency_contact_relationship, specialization, years_of_experience,
         license_number, research_interests, current_projects, bio,
         average_rating, total_ratings
         FROM users WHERE id = ?`,
        [user.userId]
      );
      users = richUsers;
    } catch (schemaError) {
      // Fallback for older schemas missing one or more optional columns
      console.warn('[Profile GET] Falling back to minimal users query:', schemaError);
      const [basicUsers] = await pool.execute<RowDataPacket[]>(
        `SELECT id, email, role, full_name FROM users WHERE id = ?`,
        [user.userId]
      );
      users = basicUsers;
    }
    
    console.log('[Profile GET] User data retrieved:', {
      id: users[0]?.id,
      full_name: users[0]?.full_name,
      city: users[0]?.city,
      phone_number: users[0]?.phone_number,
    });

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = users[0];

    // Then get profile if exists
    let profiles: RowDataPacket[] = [];
    try {
      const [profileRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [user.userId]
      );
      profiles = profileRows;
    } catch (profileError) {
      console.warn('[Profile GET] user_profiles table unavailable, returning users data only:', profileError);
      profiles = [];
    }

    if (profiles.length === 0) {
      // Return user data from users table if no profile exists
      console.log('[Profile GET] No user_profiles record, returning data from users table');
      return NextResponse.json({
        id: userData.id,
        user_id: user.userId,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        full_name: userData.full_name || '',
        title: userData.title || '',
        date_of_birth: userData.date_of_birth || null,
        gender: userData.gender || '',
        city: userData.city || '',
        county: userData.county || '',
        country: userData.country || '',
        educational_level: userData.educational_level || '',
        marital_status: userData.marital_status || '',
        employment_status: userData.employment_status || '',
        occupation: userData.occupation || '',
        phone_number: userData.phone_number || '',
        emergency_contact_name: userData.emergency_contact_name || '',
        emergency_contact_phone: userData.emergency_contact_phone || '',
        emergency_contact_relationship: userData.emergency_contact_relationship || '',
        specialization: userData.specialization || '',
        years_of_experience: userData.years_of_experience || null,
        license_number: userData.license_number || '',
        research_interests: userData.research_interests || '',
        current_projects: userData.current_projects || '',
        bio: userData.bio || '',
        has_profile_photo: false,
        average_rating: userData.average_rating || 0,
        total_ratings: userData.total_ratings || 0,
      });
    }

    const profile = profiles[0];
    
    // Don't send BLOB data in JSON, only indicate if it exists
    return NextResponse.json({
      ...profile,
      ...userData, // Include all user data fields
      has_profile_photo: !!profile.profile_photo,
      profile_photo: null, // Remove BLOB from response
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      status,
      educational_level,
      university,
      date_of_birth,
      bio,
      phone_number,
      city,
      county,
      profile_photo_data,
      profile_photo_type,
      specialization,
      years_of_experience,
      languages_spoken,
      research_interests,
      available_hours,
      certifications,
    } = body;

    // Convert date_of_birth to proper DATE format (YYYY-MM-DD)
    let formattedDate = null;
    if (date_of_birth) {
      const date = new Date(date_of_birth);
      formattedDate = date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
    }

    // Convert base64 to Buffer if photo provided
    let photoBuffer = null;
    if (profile_photo_data) {
      const base64Data = profile_photo_data.includes(',') 
        ? profile_photo_data.split(',')[1] 
        : profile_photo_data;
      photoBuffer = Buffer.from(base64Data, 'base64');
    }

    // Check if profile exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [user.userId]
    );

    if (existing.length === 0) {
      // Insert new profile
      await pool.execute(
        `INSERT INTO user_profiles 
         (user_id, full_name, status, educational_level, university, date_of_birth, bio, profile_photo, profile_photo_type,
          specialization, years_of_experience, languages_spoken, research_interests, available_hours, certifications) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.userId,
          full_name || null,
          status || null,
          educational_level || null,
          university || null,
          formattedDate,
          bio || null,
          photoBuffer,
          profile_photo_type || null,
          specialization || null,
          years_of_experience || null,
          languages_spoken || null,
          research_interests || null,
          available_hours || null,
          certifications || null,
        ]
      );
    } else {
      // Update existing profile
      if (photoBuffer) {
        await pool.execute(
          `UPDATE user_profiles 
           SET full_name = ?, status = ?, educational_level = ?, university = ?, 
               date_of_birth = ?, bio = ?, profile_photo = ?, profile_photo_type = ?,
               specialization = ?, years_of_experience = ?, languages_spoken = ?, 
               research_interests = ?, available_hours = ?, certifications = ?
           WHERE user_id = ?`,
          [
            full_name || null,
            status || null,
            educational_level || null,
            university || null,
            formattedDate,
            bio || null,
            photoBuffer,
            profile_photo_type || null,
            specialization || null,
            years_of_experience || null,
            languages_spoken || null,
            research_interests || null,
            available_hours || null,
            certifications || null,
            user.userId,
          ]
        );
      } else {
        // Update without changing photo
        await pool.execute(
          `UPDATE user_profiles 
           SET full_name = ?, status = ?, educational_level = ?, university = ?, 
               date_of_birth = ?, bio = ?,
               specialization = ?, years_of_experience = ?, languages_spoken = ?, 
               research_interests = ?, available_hours = ?, certifications = ?
           WHERE user_id = ?`,
          [
            full_name || null,
            status || null,
            educational_level || null,
            university || null,
            formattedDate,
            bio || null,
            specialization || null,
            years_of_experience || null,
            languages_spoken || null,
            research_interests || null,
            available_hours || null,
            certifications || null,
            user.userId,
          ]
        );
      }
    }

    await pool.execute(
      `UPDATE users
       SET full_name = ?, phone_number = ?, city = ?, county = ?,
           educational_level = ?, specialization = ?, bio = ?, date_of_birth = ?
       WHERE id = ?`,
      [
        full_name || null,
        phone_number || null,
        city || null,
        county || null,
        educational_level || null,
        specialization || null,
        bio || null,
        formattedDate,
        user.userId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
