import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verify } from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

interface AuthUser {
  userId: number;
  email: string;
  role: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');
    if (token === 'null' || token === 'undefined' || token === '') {
      token = null;
    }

    if (!token) {
      token = request.cookies.get('auth-token')?.value || null;
    }

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    let user: AuthUser;
    try {
      user = verify(token, JWT_SECRET) as AuthUser;
    } catch {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (!['admin', 'management', 'consultant', 'client', 'researcher'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const materialId = parseInt(id, 10);
    if (Number.isNaN(materialId)) {
      return NextResponse.json({ error: 'Invalid material id' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id,
        title,
        COALESCE(file_name, SUBSTRING_INDEX(file_path, '/', -1), SUBSTRING_INDEX(file_url, '/', -1), title) as file_name,
        COALESCE(file_path, file_url) as file_path,
        file_type
       FROM study_materials
       WHERE id = ?`,
      [materialId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const material = rows[0];
    if (!material.file_path) {
      return NextResponse.json({ error: 'File path not found' }, { status: 404 });
    }

    const relativePath = String(material.file_path).replace(/^\/+/, '');
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    const buffer = await readFile(fullPath);

    await pool.execute(
      'UPDATE study_materials SET downloads = downloads + 1 WHERE id = ?',
      [materialId]
    );

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': material.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${material.file_name || 'material'}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error downloading material:', error);
    return NextResponse.json(
      { error: 'Failed to download material', details: error.message },
      { status: 500 }
    );
  }
}
