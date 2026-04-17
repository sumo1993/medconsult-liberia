import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import pool, { IS_POSTGRES } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { uploadMediaBuffer } from '@/lib/media-upload';

function isRemoteMediaStorageConfigured(): boolean {
  const supabase =
    !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const cloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  );
  return supabase || cloudinary;
}

// MySQL-only: blob table for dev / legacy hosts without object storage
async function ensureTeamPhotosTableMysql() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS team_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photo_data LONGBLOB NOT NULL,
      photo_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
    ]);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);
    const typeOk = file.type ? allowedTypes.has(file.type) : allowedExt.has(ext);
    if (!typeOk) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPEG, PNG, WebP, GIF, or HEIC from your device.' },
        { status: 400 }
      );
    }

    const storedMime =
      file.type && file.type !== ''
        ? file.type
        : ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'gif'
              ? 'image/gif'
              : ext === 'heif'
                ? 'image/heif'
                : ext === 'heic'
                  ? 'image/heic'
                  : 'image/jpeg';

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Production (Postgres on Vercel, etc.): use Supabase Storage or Cloudinary — never LONGBLOB DDL on Postgres
    if (isRemoteMediaStorageConfigured()) {
      const { url } = await uploadMediaBuffer(buffer, storedMime, 'medconsult/team-members');
      return NextResponse.json({
        success: true,
        photoUrl: url,
        message: 'Photo uploaded successfully',
      });
    }

    if (IS_POSTGRES) {
      return NextResponse.json(
        {
          error:
            'Photo storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (optional: SUPABASE_STORAGE_BUCKET, default media), or set CLOUDINARY_* variables.',
        },
        { status: 503 }
      );
    }

    await ensureTeamPhotosTableMysql();

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO team_photos (photo_data, photo_type) VALUES (?, ?)',
      [buffer, storedMime]
    );

    const photoId = result.insertId;
    const photoUrl = `/api/team-members/photo/${photoId}`;

    return NextResponse.json({
      success: true,
      photoUrl,
      message: 'Photo uploaded successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload] team-members/upload-photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo', details: message },
      { status: 500 }
    );
  }
}
