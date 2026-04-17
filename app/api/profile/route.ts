import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

async function ensureUserProfilesTable() {
  try {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          full_name VARCHAR(255),
          status VARCHAR(100),
          educational_level VARCHAR(255),
          university VARCHAR(255),
          date_of_birth DATE,
          bio TEXT,
          profile_photo BYTEA,
          profile_photo_type VARCHAR(100),
          specialization VARCHAR(255),
          years_of_experience INT,
          languages_spoken TEXT,
          research_interests TEXT,
          available_hours TEXT,
          certifications TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          full_name VARCHAR(255),
          status VARCHAR(100),
          educational_level VARCHAR(255),
          university VARCHAR(255),
          date_of_birth DATE,
          bio TEXT,
          profile_photo LONGBLOB,
          profile_photo_type VARCHAR(100),
          specialization VARCHAR(255),
          years_of_experience INT,
          languages_spoken TEXT,
          research_interests TEXT,
          available_hours TEXT,
          certifications TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }
  } catch (e) {
    console.warn('[user_profiles] ensureTable warning:', e);
  }
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let users: any[] = [];
    try {
      const [richUsers] = await pool.execute<any[]>(
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
    } catch {
      const [basicUsers] = await pool.execute<any[]>(
        `SELECT id, email, role, full_name FROM users WHERE id = ?`,
        [user.userId]
      );
      users = basicUsers;
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = users[0];

    let profiles: any[] = [];
    try {
      const [profileRows] = await pool.execute<any[]>(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [user.userId]
      );
      profiles = profileRows;
    } catch {
      profiles = [];
    }

    if (profiles.length === 0) {
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
    return NextResponse.json({
      ...profile,
      ...userData,
      has_profile_photo: !!profile.profile_photo,
      profile_photo: null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserProfilesTable();

    const body = await request.json();
    const {
      full_name, status, educational_level, university, date_of_birth, bio,
      phone_number, city, county, profile_photo_data, profile_photo_type,
      specialization, years_of_experience, languages_spoken, research_interests,
      available_hours, certifications,
    } = body;

    let formattedDate: string | null = null;
    if (date_of_birth) {
      formattedDate = new Date(date_of_birth).toISOString().split('T')[0];
    }

    let photoBuffer: Buffer | null = null;
    if (profile_photo_data) {
      const base64Data = profile_photo_data.includes(',')
        ? profile_photo_data.split(',')[1]
        : profile_photo_data;
      photoBuffer = Buffer.from(base64Data, 'base64');
    }

    // Check if profile exists
    let existing: any[] = [];
    try {
      const [rows] = await pool.execute<any[]>(
        'SELECT id FROM user_profiles WHERE user_id = ?',
        [user.userId]
      );
      existing = rows;
    } catch {
      existing = [];
    }

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO user_profiles
         (user_id, full_name, status, educational_level, university, date_of_birth, bio,
          profile_photo, profile_photo_type, specialization, years_of_experience,
          languages_spoken, research_interests, available_hours, certifications)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.userId, full_name || null, status || null, educational_level || null,
          university || null, formattedDate, bio || null, photoBuffer,
          profile_photo_type || null, specialization || null, years_of_experience || null,
          languages_spoken || null, research_interests || null, available_hours || null,
          certifications || null,
        ]
      );
    } else if (photoBuffer) {
      await pool.execute(
        `UPDATE user_profiles
         SET full_name=?, status=?, educational_level=?, university=?, date_of_birth=?,
             bio=?, profile_photo=?, profile_photo_type=?, specialization=?,
             years_of_experience=?, languages_spoken=?, research_interests=?,
             available_hours=?, certifications=?
         WHERE user_id=?`,
        [
          full_name || null, status || null, educational_level || null, university || null,
          formattedDate, bio || null, photoBuffer, profile_photo_type || null,
          specialization || null, years_of_experience || null, languages_spoken || null,
          research_interests || null, available_hours || null, certifications || null,
          user.userId,
        ]
      );
    } else {
      await pool.execute(
        `UPDATE user_profiles
         SET full_name=?, status=?, educational_level=?, university=?, date_of_birth=?,
             bio=?, specialization=?, years_of_experience=?, languages_spoken=?,
             research_interests=?, available_hours=?, certifications=?
         WHERE user_id=?`,
        [
          full_name || null, status || null, educational_level || null, university || null,
          formattedDate, bio || null, specialization || null, years_of_experience || null,
          languages_spoken || null, research_interests || null, available_hours || null,
          certifications || null, user.userId,
        ]
      );
    }

    // Also sync key fields back to users table
    await pool.execute(
      `UPDATE users SET full_name=?, phone_number=?, city=?, county=?,
       educational_level=?, specialization=?, bio=?, date_of_birth=?
       WHERE id=?`,
      [
        full_name || null, phone_number || null, city || null, county || null,
        educational_level || null, specialization || null, bio || null,
        formattedDate, user.userId,
      ]
    );

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile', details: msg }, { status: 500 });
  }
}
