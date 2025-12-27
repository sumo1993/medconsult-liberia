import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Ensure table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS research_projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        status ENUM('active', 'completed', 'pending', 'paused') DEFAULT 'active',
        deadline DATE,
        target_samples INT DEFAULT 100,
        data_collected INT DEFAULT 0,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create project assignments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS research_project_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        researcher_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assignment (project_id, researcher_id)
      )
    `);

    // Check if we have any projects
    const [existingProjects] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM research_projects'
    );
    
    if (existingProjects[0].count === 0) {
      // Insert sample research projects
      await pool.execute(`
        INSERT INTO research_projects (title, description, location, status, deadline, target_samples, data_collected) VALUES
        ('Malaria Prevalence Study', 'Study to assess malaria prevalence in rural communities across Bong County', 'Bong County', 'active', '2026-03-31', 500, 127),
        ('Maternal Health Survey', 'Survey on maternal health practices and outcomes in Montserrado', 'Montserrado County', 'active', '2026-02-28', 300, 89),
        ('Water Quality Assessment', 'Assessment of drinking water quality in coastal communities', 'Grand Bassa County', 'active', '2026-04-15', 200, 45),
        ('Vaccination Coverage Study', 'Study on childhood vaccination coverage and barriers to access', 'Nimba County', 'pending', '2026-05-01', 400, 0),
        ('Nutrition Assessment', 'Community nutrition assessment focusing on children under 5', 'Lofa County', 'completed', '2025-12-01', 250, 250)
      `);
      console.log('[Research Projects] Seeded sample projects');
    }
  } catch (error: any) {
    // Table might already exist with data
    if (!error.message?.includes('Duplicate')) {
      console.error('Error ensuring research_projects table:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projects - for now return all active/pending projects
    // In a full implementation, filter by assignments
    const [projects] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM research_projects 
       WHERE status IN ('active', 'pending')
       ORDER BY deadline ASC`
    );

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching researcher projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}


