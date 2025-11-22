import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    console.log('[Client Stats] Request received');
    const user = await verifyAuth(request);
    console.log('[Client Stats] Auth result:', user ? `User: ${user.email}, Role: ${user.role}` : 'null');
    
    if (!user) {
      console.log('[Client Stats] Unauthorized - No user from verifyAuth');
      return NextResponse.json(
        { error: 'Unauthorized - Authentication failed' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'client') {
      console.log('[Client Stats] Unauthorized - User role is', user.role, 'but expected client');
      return NextResponse.json(
        { error: 'Unauthorized - Not a client account' },
        { status: 401 }
      );
    }

    console.log('[Client Stats] Fetching stats for user:', user.email, 'ID:', user.userId);

    // Optimized: Get all assignment stats in one query
    const [assignmentStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN doctor_notes IS NOT NULL THEN 1 ELSE 0 END) as with_feedback,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM assignment_requests 
       WHERE client_id = ?`,
      [user.userId]
    );

    console.log('[Client Stats] Assignment stats:', assignmentStats[0]);

    // Get available research count
    const [researchResult] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM research_posts WHERE status = 'published'"
    );

    // Get study materials count (placeholder for now)
    const studyMaterials = 0;

    // Get unread messages (placeholder for now)
    const unreadMessages = 0;

    const stats = {
      myAssignments: assignmentStats[0].total || 0,
      availableResearch: researchResult[0]?.count || 0,
      studyMaterials,
      unreadMessages,
      assignmentsWithFeedback: assignmentStats[0].with_feedback || 0,
      completedAssignments: assignmentStats[0].completed || 0,
    };

    console.log('[Client Stats] Returning stats:', stats);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Client Stats] Error fetching client stats:', error);
    console.error('[Client Stats] Error message:', error.message);
    console.error('[Client Stats] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch stats: ' + error.message },
      { status: 500 }
    );
  }
}
