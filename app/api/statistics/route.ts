import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch statistics (public)
export async function GET() {
  try {
    const [stats] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM statistics LIMIT 1'
    );

    if (stats.length === 0) {
      return NextResponse.json({
        research_projects: 0,
        clinic_setups: 0,
        rating: 5.0,
        total_consultations: 0,
        years_experience: 0
      });
    }

    return NextResponse.json(stats[0]);
  } catch (error) {
    console.error('[Statistics] Error fetching:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// PUT - Update statistics (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { research_projects, clinic_setups, rating, total_consultations, years_experience } = body;

    // Update statistics (there should only be one row)
    await pool.execute<ResultSetHeader>(
      `UPDATE statistics SET 
        research_projects = ?, 
        clinic_setups = ?, 
        rating = ?, 
        total_consultations = ?,
        years_experience = ?
      WHERE id = 1`,
      [research_projects, clinic_setups, rating, total_consultations, years_experience]
    );

    console.log('[Statistics] Updated successfully');

    return NextResponse.json({ success: true, message: 'Statistics updated successfully' });
  } catch (error) {
    console.error('[Statistics] Error updating:', error);
    return NextResponse.json(
      { error: 'Failed to update statistics' },
      { status: 500 }
    );
  }
}
