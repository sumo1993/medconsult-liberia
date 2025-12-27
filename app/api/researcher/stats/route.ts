import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      activeProjects: 0,
      dataSubmissions: 0,
      pendingReview: 0,
      completedProjects: 0,
      totalDataPoints: 0,
      thisMonthSubmissions: 0,
    };

    // Get active projects count
    try {
      const [activeProjects] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM research_projects WHERE status = 'active'"
      );
      stats.activeProjects = activeProjects[0]?.count || 0;
    } catch (e) {
      // Table might not exist
    }

    // Get completed projects count
    try {
      const [completed] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM research_projects WHERE status = 'completed'"
      );
      stats.completedProjects = completed[0]?.count || 0;
    } catch (e) {
      // Table might not exist
    }

    // Get submissions count
    try {
      const [submissions] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count, COALESCE(SUM(sample_count), 0) as total_samples FROM research_submissions WHERE researcher_id = ?',
        [user.userId]
      );
      stats.dataSubmissions = submissions[0]?.count || 0;
      stats.totalDataPoints = parseInt(submissions[0]?.total_samples) || 0;
    } catch (e) {
      // Table might not exist
    }

    // Get pending review count
    try {
      const [pending] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM research_submissions WHERE researcher_id = ? AND status = 'pending'",
        [user.userId]
      );
      stats.pendingReview = pending[0]?.count || 0;
    } catch (e) {
      // Table might not exist
    }

    // Get this month's submissions
    try {
      const [thisMonth] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM research_submissions 
         WHERE researcher_id = ? 
         AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
        [user.userId]
      );
      stats.thisMonthSubmissions = thisMonth[0]?.count || 0;
    } catch (e) {
      // Table might not exist
    }

    // Get data entries count and add to data points
    try {
      const [entries] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM research_data_entries WHERE researcher_id = ?',
        [user.userId]
      );
      stats.totalDataPoints += (entries[0]?.count || 0);
    } catch (e) {
      // Table might not exist
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching researcher stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

