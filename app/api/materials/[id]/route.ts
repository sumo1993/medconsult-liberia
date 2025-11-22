import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { unlink } from 'fs/promises';
import path from 'path';

// DELETE - Delete a study material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors/admins can delete materials
    if (user.role !== 'management' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors can delete study materials' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const materialId = parseInt(id);

    // Get material info to delete file
    const [materials] = await pool.execute<RowDataPacket[]>(
      'SELECT file_path FROM study_materials WHERE id = ?',
      [materialId]
    );

    if (!materials || materials.length === 0) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    const material = materials[0];

    // Delete from database
    await pool.execute(
      'DELETE FROM study_materials WHERE id = ?',
      [materialId]
    );

    // Try to delete file (don't fail if file doesn't exist)
    try {
      const fullPath = path.join(process.cwd(), 'public', material.file_path);
      await unlink(fullPath);
    } catch (err) {
      console.log('File already deleted or not found');
    }

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete material',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Increment download count
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const materialId = parseInt(id);

    await pool.execute(
      'UPDATE study_materials SET downloads = downloads + 1 WHERE id = ?',
      [materialId]
    );

    return NextResponse.json({
      success: true,
      message: 'Download count updated',
    });
  } catch (error: any) {
    console.error('Error updating download count:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update download count',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
