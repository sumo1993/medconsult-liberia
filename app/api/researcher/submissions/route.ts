import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Ensure table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS research_submissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        researcher_id INT NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        date_collected DATE,
        sample_count INT DEFAULT 0,
        notes TEXT,
        file_data LONGBLOB,
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        reviewed_by INT,
        reviewed_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_researcher (researcher_id),
        INDEX idx_status (status),
        INDEX idx_date (date_collected)
      )
    `);
  } catch (error) {
    console.error('Error ensuring research_submissions table:', error);
  }
}

// GET - Fetch submissions for the researcher
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [submissions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        rs.id,
        rs.data_type,
        rs.title,
        rs.description,
        rs.location,
        rs.date_collected,
        rs.sample_count,
        rs.status,
        rs.created_at as submitted_at,
        rs.title as project_title
       FROM research_submissions rs
       WHERE rs.researcher_id = ?
       ORDER BY rs.created_at DESC`,
      [user.userId]
    );

    // Transform for frontend
    const formattedSubmissions = submissions.map((s: any) => ({
      id: s.id,
      project_title: s.title,
      submitted_at: s.submitted_at,
      status: s.status,
      data_points: s.sample_count || 1,
      data_type: s.data_type,
      location: s.location,
    }));

    return NextResponse.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      data_type,
      title,
      description,
      location,
      date_collected,
      sample_count,
      notes,
      file_data,
      file_name,
      file_type,
    } = body;

    // Validate required fields
    if (!title || !data_type) {
      return NextResponse.json(
        { error: 'Title and data type are required' },
        { status: 400 }
      );
    }

    // Convert file data if provided
    let fileBuffer = null;
    if (file_data) {
      const base64Data = file_data.includes(',') 
        ? file_data.split(',')[1] 
        : file_data;
      fileBuffer = Buffer.from(base64Data, 'base64');
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO research_submissions 
       (researcher_id, data_type, title, description, location, date_collected, sample_count, notes, file_data, file_name, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId,
        data_type,
        title,
        description || null,
        location || null,
        date_collected || null,
        parseInt(sample_count) || 0,
        notes || null,
        fileBuffer,
        file_name || null,
        file_type || null,
      ]
    );

    console.log('[Researcher Submissions] Created submission:', result.insertId);

    return NextResponse.json({
      success: true,
      message: 'Data submitted successfully',
      id: result.insertId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
