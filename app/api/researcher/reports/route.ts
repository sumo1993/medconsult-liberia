import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';
import { sendResearchReportNotificationEmail } from '@/lib/email';

async function getLeadershipEmailsFromSettings(): Promise<string[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT setting_key, setting_value
       FROM site_settings
       WHERE setting_key IN ('report_notification_emails', 'ceo_email', 'admin_email')`
    );

    const map = new Map<string, string>();
    rows.forEach((row) => {
      map.set(String(row.setting_key), String(row.setting_value || ''));
    });

    const combined = map.get('report_notification_emails') || '';
    const fromCombined = combined
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    const fallback = [map.get('ceo_email') || '', map.get('admin_email') || '']
      .map((email) => email.trim())
      .filter(Boolean);

    return Array.from(new Set([...fromCombined, ...fallback]));
  } catch (error) {
    console.error('[Research Reports] Failed reading leadership emails from settings:', error);
    return [];
  }
}

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

// POST - Create report and notify leadership (admin + management/CEO)
export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const user = await verifyAuth(request);
    if (!user || user.role !== 'researcher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      project_id,
      project_name,
      report_type,
      file_data,
      file_name,
      file_type,
      file_size,
    } = body || {};

    if (!title || String(title).trim().length < 3) {
      return NextResponse.json({ error: 'Report title is required' }, { status: 400 });
    }

    const allowedTypes = new Set(['summary', 'detailed', 'quarterly', 'annual', 'special']);
    const normalizedType = allowedTypes.has(String(report_type)) ? String(report_type) : 'summary';

    let fileBuffer: Buffer | null = null;
    if (file_data && typeof file_data === 'string') {
      const base64Payload = file_data.includes(',') ? file_data.split(',')[1] : file_data;
      fileBuffer = Buffer.from(base64Payload, 'base64');
    }

    const [insertResult] = await pool.execute(
      `INSERT INTO research_reports
        (title, description, project_id, project_name, report_type, file_data, file_name, file_type, file_size, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
      [
        String(title).trim(),
        description || null,
        project_id || null,
        project_name || null,
        normalizedType,
        fileBuffer,
        file_name || null,
        file_type || null,
        file_size || null,
        user.userId,
      ]
    );

    const reportId = Number((insertResult as { insertId?: number }).insertId || 0);

    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT full_name, email FROM users WHERE id = ? LIMIT 1',
      [user.userId]
    );
    const submitterName = userRows[0]?.full_name || 'Researcher';
    const submitterEmail = userRows[0]?.email || user.email || 'unknown@medconsult.local';

    const internalMessage = [
      `New research report submitted by ${submitterName}.`,
      `Title: ${String(title).trim()}`,
      `Type: ${normalizedType}`,
      `Project: ${project_name || 'N/A'}`,
      `Report ID: ${reportId}`,
    ].join('\n');

    // In-app visibility for Admin + Management dashboards (shared messages inbox)
    await pool.execute(
      `INSERT INTO contact_messages (name, email, subject, message, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [submitterName, submitterEmail, 'research_report', internalMessage]
    );

    // Leadership email copies (CEO/Admin)
    try {
      const recipients = await getLeadershipEmailsFromSettings();
      await sendResearchReportNotificationEmail({
        title: String(title).trim(),
        reportType: normalizedType,
        projectName: project_name || null,
        submittedByName: submitterName,
        submittedByEmail: submitterEmail,
        createdAt: new Date().toISOString(),
        recipients,
      });
    } catch (emailError) {
      console.error('[Research Reports] Failed to send leadership email notification:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Report published. Admin and management have been notified.',
        id: reportId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}


