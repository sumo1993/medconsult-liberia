import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Ensure testimonials table exists
async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      rating INT DEFAULT 5,
      text TEXT NOT NULL,
      photo LONGBLOB NULL,
      photo_type VARCHAR(100) NULL,
      is_active BOOLEAN DEFAULT true,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

// GET - Fetch active testimonials for public display
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    
    const [testimonials] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        id, name, role, rating, text, display_order, created_at,
        CASE WHEN photo IS NOT NULL THEN true ELSE false END as has_photo
      FROM testimonials
      WHERE is_active = true
      ORDER BY display_order ASC, created_at DESC
    `);
    
    return NextResponse.json({ 
      testimonials 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}


