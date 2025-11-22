import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET all donation inquiries
export async function GET(request: NextRequest) {
  try {
    // Verify admin or management access
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or Management access required.' },
        { status: 401 }
      );
    }

    const [inquiries] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM donation_inquiries ORDER BY created_at DESC'
    );

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Error fetching donation inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation inquiries' },
      { status: 500 }
    );
  }
}
