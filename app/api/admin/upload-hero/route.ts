import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyAuth } from '@/lib/middleware';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'hero');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `hero-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const imageUrl = `/uploads/hero/${filename}`;

    // Get the next order number
    const [maxOrder] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(MAX(order_position), 0) + 1 as next_order FROM hero_images'
    );

    const nextOrder = maxOrder[0].next_order;

    // Add to hero_images table (active by default)
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO hero_images (url, order_position, is_active) VALUES (?, ?, TRUE)',
      [imageUrl, nextOrder]
    );

    console.log('[Upload Hero] Image uploaded:', imageUrl);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      imageUrl,
      filename,
    });
  } catch (error) {
    console.error('[Upload Hero] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
