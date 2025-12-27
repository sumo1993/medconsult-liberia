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

    const analytics = {
      submissionsByDay: [] as { date: string; count: number }[],
      submissionsByType: [] as { type: string; count: number }[],
      submissionsByLocation: [] as { location: string; count: number }[],
      weeklyProgress: 0,
      monthlyProgress: 0,
      streak: 0,
      totalDataPoints: 0,
      approvalRate: 0,
    };

    // Get submissions by day (last 7 days)
    try {
      const [dayData] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          DATE_FORMAT(created_at, '%a') as date,
          COUNT(*) as count
        FROM research_submissions 
        WHERE researcher_id = ? 
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%a')
        ORDER BY DATE(created_at)
      `, [user.userId]);

      // Fill in missing days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayName = dayNames[d.getDay()];
        const existing = dayData.find((r: any) => r.date === dayName);
        analytics.submissionsByDay.push({
          date: dayName,
          count: existing ? existing.count : 0,
        });
      }
    } catch (e) {
      // Generate empty data for 7 days
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      analytics.submissionsByDay = dayNames.map(d => ({ date: d, count: 0 }));
    }

    // Get submissions by type
    try {
      const [typeData] = await pool.execute<RowDataPacket[]>(`
        SELECT data_type as type, COUNT(*) as count
        FROM research_submissions 
        WHERE researcher_id = ?
        GROUP BY data_type
        ORDER BY count DESC
      `, [user.userId]);
      analytics.submissionsByType = typeData as { type: string; count: number }[];
    } catch (e) {}

    // Get submissions by location
    try {
      const [locationData] = await pool.execute<RowDataPacket[]>(`
        SELECT location, COUNT(*) as count
        FROM research_submissions 
        WHERE researcher_id = ? AND location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY count DESC
        LIMIT 10
      `, [user.userId]);
      analytics.submissionsByLocation = locationData as { location: string; count: number }[];
    } catch (e) {}

    // Calculate streak
    try {
      const [streakData] = await pool.execute<RowDataPacket[]>(`
        SELECT DISTINCT DATE(created_at) as submission_date
        FROM research_submissions 
        WHERE researcher_id = ?
        ORDER BY submission_date DESC
        LIMIT 30
      `, [user.userId]);

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < streakData.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const submissionDate = new Date(streakData[i].submission_date);
        submissionDate.setHours(0, 0, 0, 0);
        
        if (submissionDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else if (i === 0 && submissionDate.getTime() === expectedDate.getTime() - 86400000) {
          // Yesterday counts for starting the streak
          continue;
        } else {
          break;
        }
      }
      analytics.streak = streak;
    } catch (e) {}

    // Get total data points
    try {
      const [totalData] = await pool.execute<RowDataPacket[]>(`
        SELECT COALESCE(SUM(sample_count), 0) + COUNT(*) as total
        FROM research_submissions 
        WHERE researcher_id = ?
      `, [user.userId]);
      analytics.totalDataPoints = parseInt(totalData[0]?.total) || 0;

      // Add data entries
      const [entriesData] = await pool.execute<RowDataPacket[]>(`
        SELECT COUNT(*) as count FROM research_data_entries WHERE researcher_id = ?
      `, [user.userId]);
      analytics.totalDataPoints += parseInt(entriesData[0]?.count) || 0;
    } catch (e) {}

    // Calculate approval rate
    try {
      const [approvalData] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM research_submissions 
        WHERE researcher_id = ?
      `, [user.userId]);
      
      const total = approvalData[0]?.total || 0;
      const approved = approvalData[0]?.approved || 0;
      analytics.approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    } catch (e) {}

    // Calculate weekly progress (target: 10 submissions per week)
    try {
      const [weeklyData] = await pool.execute<RowDataPacket[]>(`
        SELECT COUNT(*) as count
        FROM research_submissions 
        WHERE researcher_id = ?
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `, [user.userId]);
      const weeklyTarget = 10;
      analytics.weeklyProgress = Math.round((weeklyData[0]?.count || 0) / weeklyTarget * 100);
    } catch (e) {}

    // Calculate monthly progress (target: 30 submissions per month)
    try {
      const [monthlyData] = await pool.execute<RowDataPacket[]>(`
        SELECT COUNT(*) as count
        FROM research_submissions 
        WHERE researcher_id = ?
          AND MONTH(created_at) = MONTH(CURDATE())
          AND YEAR(created_at) = YEAR(CURDATE())
      `, [user.userId]);
      const monthlyTarget = 30;
      analytics.monthlyProgress = Math.round((monthlyData[0]?.count || 0) / monthlyTarget * 100);
    } catch (e) {}

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}


