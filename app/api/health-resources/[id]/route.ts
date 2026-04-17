import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid resource id' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, description, type, category, url, file_name, file_size, created_at
       FROM research_resources
       WHERE id = ? AND is_public = TRUE
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      title: row.title || 'Untitled Resource',
      description: row.description || 'No description available.',
      type: row.type || 'document',
      category: row.category || 'General',
      url: row.url || null,
      file_name: row.file_name || null,
      file_size: row.file_size || null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    });
  } catch (error) {
    console.error('[Health Resources API] Failed to fetch resource detail:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

