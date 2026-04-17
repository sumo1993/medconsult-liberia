import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.execute<any[]>(
      `SELECT m.*, u.full_name as author_name
       FROM media_posts m
       LEFT JOIN users u ON m.posted_by = u.id
       WHERE m.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({ media: rows[0] });
  } catch (error: any) {
    console.error('[Media GET/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, is_published } = body;

    const fields: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (is_published !== undefined) {
      fields.push('is_published = ?');
      values.push(is_published ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await pool.execute(
      `UPDATE media_posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Media PUT/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [rows] = await pool.execute<{ media_url: string }[]>(
      'SELECT media_url FROM media_posts WHERE id = ?',
      [id]
    );
    const row = rows?.[0];
    if (row?.media_url?.startsWith('/uploads/media/')) {
      const safe = path.basename(row.media_url);
      if (safe && safe !== '.' && safe !== '..') {
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'media', safe);
        if (path.resolve(filePath).startsWith(path.join(process.cwd(), 'public', 'uploads', 'media'))) {
          try {
            await unlink(filePath);
          } catch {
            // file may already be gone
          }
        }
      }
    }

    await pool.execute('DELETE FROM media_posts WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Media DELETE/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
