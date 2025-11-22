import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    console.log('[Admin Analytics] Fetching analytics data...');

    // 1. Overall Statistics
    const [totalStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_assignments,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_assignments,
        SUM(CASE WHEN final_price IS NOT NULL THEN final_price ELSE 0 END) as total_revenue,
        AVG(CASE WHEN final_price IS NOT NULL THEN final_price ELSE NULL END) as avg_assignment_value
       FROM assignment_requests`
    );

    // 2. User Statistics
    const [userStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as total_clients,
        SUM(CASE WHEN role = 'management' THEN 1 ELSE 0 END) as total_doctors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
       FROM users`
    );

    // 3. Completion Rate
    const completionRate = totalStats[0].total_assignments > 0
      ? (totalStats[0].completed_assignments / totalStats[0].total_assignments * 100).toFixed(2)
      : 0;

    // 4. Top Performing Doctors
    const [topDoctors] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.average_rating,
        u.total_ratings,
        COUNT(ar.id) as total_assignments,
        SUM(CASE WHEN ar.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        SUM(CASE WHEN ar.final_price IS NOT NULL THEN ar.final_price ELSE 0 END) as total_revenue
       FROM users u
       LEFT JOIN assignment_requests ar ON u.id = ar.doctor_id
       WHERE u.role = 'management'
       GROUP BY u.id
       ORDER BY completed_assignments DESC, average_rating DESC
       LIMIT 10`
    );

    // 5. Recent Activity (last 30 days)
    const [recentActivity] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as assignments_created,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as assignments_completed
       FROM assignment_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // 6. Revenue by Month (last 12 months)
    const [monthlyRevenue] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total_assignments,
        SUM(CASE WHEN final_price IS NOT NULL THEN final_price ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM assignment_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC`
    );

    // 7. Status Distribution
    const [statusDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        status,
        COUNT(*) as count
       FROM assignment_requests
       GROUP BY status
       ORDER BY count DESC`
    );

    // 8. Average Response Time (time from pending_review to under_review)
    const [responseTime] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_response_hours
       FROM assignment_requests
       WHERE status != 'pending_review'`
    );

    // 9. Client Satisfaction (average rating)
    const [satisfaction] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_ratings,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_ratings
       FROM ratings`
    );

    const satisfactionRate = satisfaction[0].total_ratings > 0
      ? (satisfaction[0].positive_ratings / satisfaction[0].total_ratings * 100).toFixed(2)
      : 0;

    // 10. Subject Distribution
    const [subjectDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        subject,
        COUNT(*) as count
       FROM assignment_requests
       GROUP BY subject
       ORDER BY count DESC
       LIMIT 10`
    );

    console.log('[Admin Analytics] Analytics data fetched successfully');

    return NextResponse.json({
      overview: {
        totalAssignments: totalStats[0].total_assignments,
        completedAssignments: totalStats[0].completed_assignments,
        inProgressAssignments: totalStats[0].in_progress_assignments,
        cancelledAssignments: totalStats[0].cancelled_assignments,
        totalRevenue: parseFloat(String(totalStats[0].total_revenue || 0)).toFixed(2),
        avgAssignmentValue: parseFloat(String(totalStats[0].avg_assignment_value || 0)).toFixed(2),
        completionRate: parseFloat(String(completionRate)),
        totalClients: userStats[0].total_clients,
        totalDoctors: userStats[0].total_doctors,
        totalAdmins: userStats[0].total_admins,
      },
      performance: {
        avgResponseHours: parseFloat(responseTime[0].avg_response_hours || 0).toFixed(2),
        avgRating: parseFloat(satisfaction[0].avg_rating || 0).toFixed(2),
        totalRatings: satisfaction[0].total_ratings,
        satisfactionRate: parseFloat(String(satisfactionRate)),
      },
      topDoctors: topDoctors.map(d => ({
        id: d.id,
        name: d.full_name,
        email: d.email,
        rating: parseFloat(d.average_rating || 0).toFixed(2),
        totalRatings: d.total_ratings,
        totalAssignments: d.total_assignments,
        completedAssignments: d.completed_assignments,
        revenue: parseFloat(d.total_revenue || 0).toFixed(2),
      })),
      recentActivity: recentActivity.map(a => ({
        date: a.date,
        created: a.assignments_created,
        completed: a.assignments_completed,
      })),
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.month,
        assignments: m.total_assignments,
        revenue: parseFloat(m.revenue || 0).toFixed(2),
        completed: m.completed,
      })),
      statusDistribution: statusDistribution.map(s => ({
        status: s.status,
        count: s.count,
      })),
      subjectDistribution: subjectDistribution.map(s => ({
        subject: s.subject,
        count: s.count,
      })),
    });

  } catch (error: any) {
    console.error('[Admin Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics: ' + error.message },
      { status: 500 }
    );
  }
}
