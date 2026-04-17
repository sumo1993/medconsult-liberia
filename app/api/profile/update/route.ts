import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Get existing columns from users table
    const [columns] = await pool.execute<any[]>(
      IS_POSTGRES
        ? `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'`
        : `SELECT COLUMN_NAME as column_name FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );

    const existingColumns = new Set(
      columns.map((row) => String(row.column_name || '').toLowerCase())
    );

    const fieldValues: Record<string, unknown> = {
      full_name: data.full_name,
      email: data.email,
      title: data.title || null,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      city: data.city || null,
      county: data.county || null,
      country: data.country || null,
      educational_level: data.educational_level || null,
      marital_status: data.marital_status || null,
      employment_status: data.employment_status || null,
      occupation: data.occupation || null,
      phone_number: data.phone_number || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      emergency_contact_relationship: data.emergency_contact_relationship || null,
      specialization: data.specialization || null,
      years_of_experience: data.years_of_experience || null,
      license_number: data.license_number || null,
      research_interests: data.research_interests || null,
      current_projects: data.current_projects || null,
      bio: data.bio || null,
    };

    const updateEntries = Object.entries(fieldValues).filter(([column]) =>
      existingColumns.has(column.toLowerCase())
    );

    if (updateEntries.length === 0) {
      return NextResponse.json(
        { error: 'No updatable profile columns found in users table' },
        { status: 500 }
      );
    }

    const setClause = updateEntries.map(([column]) => `${column} = ?`).join(', ');
    const values = updateEntries.map(([, value]) => value);

    const [, meta] = await pool.execute(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, user.userId]
    );

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string };
    console.error('[Profile Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: errorObj?.message },
      { status: 500 }
    );
  }
}
