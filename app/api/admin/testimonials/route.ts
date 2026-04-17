import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

async function ensureTable() {
  if (IS_POSTGRES) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        rating INT DEFAULT 5,
        text TEXT NOT NULL,
        photo BYTEA NULL,
        photo_type VARCHAR(100) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        rating INT DEFAULT 5,
        text TEXT NOT NULL,
        photo LONGBLOB NULL,
        photo_type VARCHAR(100) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';

    let query = `
      SELECT 
        id, name, role, rating, text, is_active, display_order, created_at, updated_at,
        CASE WHEN photo IS NOT NULL THEN true ELSE false END as has_photo
      FROM testimonials
    `;
    if (publicOnly) query += ' WHERE is_active = TRUE';
    query += ' ORDER BY display_order ASC, created_at DESC';

    const [testimonials] = await pool.execute<any[]>(query);
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTable();

    const body = await request.json();
    const { name, role, rating, text, display_order } = body;

    if (!name || !role || !text) {
      return NextResponse.json({ error: 'Name, role, and text are required' }, { status: 400 });
    }

    const [, meta] = await pool.execute(
      `INSERT INTO testimonials (name, role, rating, text, display_order) VALUES (?, ?, ?, ?, ?)`,
      [name, role, rating || 5, text, display_order || 0]
    );

    return NextResponse.json({
      message: 'Testimonial created successfully',
      id: (meta as any).insertId,
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
