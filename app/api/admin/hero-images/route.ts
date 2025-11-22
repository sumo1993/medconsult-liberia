import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch hero images (only active ones for public, all for admin)
export async function GET(request: NextRequest) {
  try {
    // Check if request is from admin
    const user = await verifyAuth(request).catch(() => null);
    const isAdmin = user && user.role === 'admin';

    let query = 'SELECT id, url, order_position as `order`, is_active FROM hero_images';
    
    // Only show active images for non-admin users
    if (!isAdmin) {
      query += ' WHERE is_active = TRUE';
    }
    
    query += ' ORDER BY order_position ASC';

    const [images] = await pool.execute<RowDataPacket[]>(query);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('[Hero Images] Error fetching:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero images' },
      { status: 500 }
    );
  }
}

// POST - Add new hero image
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Get the next order number
    const [maxOrder] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(MAX(order_position), 0) + 1 as next_order FROM hero_images'
    );

    const nextOrder = maxOrder[0].next_order;

    // Insert new image (active by default)
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO hero_images (url, order_position, is_active) VALUES (?, ?, TRUE)',
      [url, nextOrder]
    );

    console.log('[Hero Images] Added new image:', url);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      url,
      order: nextOrder,
    });
  } catch (error) {
    console.error('[Hero Images] Error adding:', error);
    return NextResponse.json(
      { error: 'Failed to add hero image' },
      { status: 500 }
    );
  }
}
