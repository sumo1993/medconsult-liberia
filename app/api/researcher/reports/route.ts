import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

// Ensure table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS research_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_id INT,
        project_name VARCHAR(255),
        report_type ENUM('summary', 'detailed', 'quarterly', 'annual', 'special') DEFAULT 'summary',
        file_data LONGBLOB,
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size VARCHAR(50),
        status ENUM('draft', 'published') DEFAULT 'published',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_project (project_id),
        INDEX idx_status (status)
      )
    `);

    // Check if we have any reports
    const [existingReports] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM research_reports'
    );
    
    if (existingReports[0].count === 0) {
      // Insert sample reports
      await pool.execute(`
        INSERT INTO research_reports (title, description, project_name, report_type, file_size, status) VALUES
        ('Malaria Prevalence Q4 2025 Summary', 'Quarterly summary of malaria prevalence data collected in Bong County', 'Malaria Prevalence Study', 'quarterly', '2.4 MB', 'published'),
        ('Maternal Health Survey Preliminary Results', 'Initial findings from the maternal health survey in Montserrado', 'Maternal Health Survey', 'summary', '1.8 MB', 'published'),
        ('Water Quality Assessment - December Report', 'Monthly water quality assessment findings from coastal communities', 'Water Quality Assessment', 'summary', '856 KB', 'published'),
        ('Annual Research Summary 2025', 'Comprehensive overview of all research activities conducted in 2025', 'Multiple Projects', 'annual', '5.2 MB', 'published'),
        ('Field Data Collection Guidelines', 'Standard operating procedures for field researchers', 'Training Materials', 'special', '1.1 MB', 'published')
      `);
      console.log('[Research Reports] Seeded sample reports');
    }
  } catch (error: any) {
    if (!error.message?.includes('Duplicate')) {
      console.error('Error ensuring research_reports table:', error);
    }
  }
}

// GET - Fetch reports
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';

    const [reports] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id, title, description, project_id, project_name, report_type,
        file_name, file_type, file_size, status, created_at
       FROM research_reports 
       WHERE status = ?
       ORDER BY created_at DESC`,
      [status]
    );

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}


