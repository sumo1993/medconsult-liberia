import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { uploadMediaBuffer } from '@/lib/media-upload';

let ensureTablePromise: Promise<void> | null = null;

async function ensureMediaTable(): Promise<void> {
  if (ensureTablePromise) {
    await ensureTablePromise;
    return;
  }
  ensureTablePromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS media_posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          media_url VARCHAR(500) NOT NULL,
          media_type VARCHAR(10) NOT NULL DEFAULT 'image',
          thumbnail_url VARCHAR(500),
          posted_by INT NOT NULL,
          is_published BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS media_posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          media_url VARCHAR(500) NOT NULL,
          media_type VARCHAR(10) NOT NULL DEFAULT 'image',
          thumbnail_url VARCHAR(500),
          posted_by INT NOT NULL,
          is_published TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }
  })();
  await ensureTablePromise;
}

export async function GET(request: NextRequest) {
  try {
    await ensureMediaTable();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const publicOnly = searchParams.get('public') === 'true';
    const offset = (page - 1) * limit;

    const publishedCondition = IS_POSTGRES ? 'm.is_published = TRUE' : 'm.is_published = 1';
    let whereClause = '';
    if (publicOnly) {
      whereClause = `WHERE ${publishedCondition}`;
    }

    const [rows] = await pool.execute<any[]>(
      `SELECT m.*, u.full_name as author_name
       FROM media_posts m
       LEFT JOIN users u ON m.posted_by = u.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM media_posts m ${whereClause}`
    );
    const total = countRows[0]?.total || 0;

    return NextResponse.json({
      media: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Media GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Only admin and management can post media' }, { status: 403 });
    }

    await ensureMediaTable();

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const file = formData.get('file') as File | null;

    if (!title || !file) {
      return NextResponse.json({ error: 'Title and file are required' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum 100MB.' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Unsupported file type. Use JPEG, PNG, GIF, WebP, MP4, WebM, or MOV.',
      }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url: mediaUrl, usedCloudinary } = await uploadMediaBuffer(
      buffer,
      file.type,
      'medconsult/media'
    );

    let thumbnailUrl: string | null = null;
    if (isVideo && mediaUrl && usedCloudinary) {
      thumbnailUrl = mediaUrl.replace(/\.\w+$/, '.jpg');
    }

    const [, meta] = await pool.execute(
      `INSERT INTO media_posts (title, description, media_url, media_type, thumbnail_url, posted_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, mediaUrl, mediaType, thumbnailUrl, user.userId]
    );

    const insertId = (meta as any).insertId;

    return NextResponse.json({
      success: true,
      media: {
        id: insertId,
        title,
        description,
        media_url: mediaUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        posted_by: user.userId,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Media POST] Error:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}
