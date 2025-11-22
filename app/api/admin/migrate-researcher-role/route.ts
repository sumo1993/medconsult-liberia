import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting researcher role migration...');

    // Step 1: Alter the users table to add 'researcher' to ENUM
    await pool.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'management', 'client', 'accountant', 'consultant', 'researcher') 
      NOT NULL DEFAULT 'client'
    `);
    console.log('✅ Added researcher to role ENUM');

    // Step 2: Update the specific user to researcher role
    await pool.execute(
      `UPDATE users SET role = 'researcher' WHERE email = ?`,
      ['429319lr@gmail.com']
    );
    console.log('✅ Updated user 429319lr@gmail.com to researcher');

    // Step 3: Verify the changes
    const [users]: any = await pool.execute(
      `SELECT id, email, full_name, role FROM users WHERE email = ?`,
      ['429319lr@gmail.com']
    );

    return NextResponse.json({
      success: true,
      message: 'Researcher role migration completed successfully',
      updatedUser: users[0]
    });
  } catch (error) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
