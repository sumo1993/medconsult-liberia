import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Ensure table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS research_data_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        researcher_id INT NOT NULL,
        entry_type VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        entry_date DATE,
        data_fields JSON,
        status ENUM('saved', 'submitted', 'approved') DEFAULT 'saved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_researcher (researcher_id),
        INDEX idx_type (entry_type),
        INDEX idx_date (entry_date)
      )
    `);
  } catch (error) {
    console.error('Error ensuring research_data_entries table:', error);
  }
}

// GET - Fetch data entries for the researcher
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [entries] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM research_data_entries 
       WHERE researcher_id = ?
       ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching data entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data entries' },
      { status: 500 }
    );
  }
}

// POST - Create new data entry
export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      entry_type,
      location,
      entry_date,
      data_fields, // Array of { field_name, value }
    } = body;

    // Validate required fields
    if (!entry_type || !location) {
      return NextResponse.json(
        { error: 'Entry type and location are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO research_data_entries 
       (researcher_id, entry_type, location, entry_date, data_fields)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.userId,
        entry_type,
        location,
        entry_date || new Date().toISOString().split('T')[0],
        JSON.stringify(data_fields || []),
      ]
    );

    console.log('[Researcher Data Entry] Created entry:', result.insertId);

    return NextResponse.json({
      success: true,
      message: 'Data entry saved successfully',
      id: result.insertId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating data entry:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save data entry',
        details: error.message 
      },
      { status: 500 }
    );
  }
}



