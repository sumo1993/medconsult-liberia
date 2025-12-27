import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

// Ensure table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS research_resources (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('document', 'video', 'link', 'guide') DEFAULT 'document',
        category VARCHAR(100),
        url VARCHAR(500),
        file_data LONGBLOB,
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size VARCHAR(50),
        is_public BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_type (type)
      )
    `);

    // Check if we have any resources
    const [existingResources] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM research_resources'
    );
    
    if (existingResources[0].count === 0) {
      // Insert sample resources
      await pool.execute(`
        INSERT INTO research_resources (title, description, type, category, file_size, url) VALUES
        ('Research Ethics Guidelines', 'Comprehensive guidelines for ethical research conduct in Liberia. Covers informed consent, data protection, and community engagement.', 'document', 'Guidelines', '2.5 MB', NULL),
        ('Data Collection Training Manual', 'Step-by-step guide for field researchers on proper data collection methods and quality control.', 'document', 'Training', '3.2 MB', NULL),
        ('Survey Form Template - Health', 'Standard template for community health surveys with validated questions.', 'document', 'Templates', '500 KB', NULL),
        ('Interview Techniques Video', 'Training video demonstrating proper interview techniques for qualitative research.', 'video', 'Training', NULL, 'https://example.com/video'),
        ('Data Entry Best Practices', 'Guide for accurate data entry and common mistakes to avoid.', 'guide', 'Guidelines', '1.1 MB', NULL),
        ('Liberia Health Statistics 2024', 'Official health statistics and demographics for reference in research.', 'document', 'Guidelines', '4.8 MB', NULL),
        ('Mobile Data Collection App Guide', 'Instructions for using mobile data collection tools in the field.', 'guide', 'Training', '1.5 MB', NULL),
        ('Community Engagement Protocol', 'Protocol for engaging with communities before, during, and after research.', 'document', 'Guidelines', '800 KB', NULL)
      `);
      console.log('[Research Resources] Seeded sample resources');
    }
  } catch (error: any) {
    if (!error.message?.includes('Duplicate')) {
      console.error('Error ensuring research_resources table:', error);
    }
  }
}

// GET - Fetch resources
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = `
      SELECT id, title, description, type, category, url, file_name, file_size, created_at
      FROM research_resources 
      WHERE is_public = TRUE
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const [resources] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}


