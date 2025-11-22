import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// DELETE - Delete a file (doctor only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Only doctors can delete files' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete the file (comments will be deleted automatically due to CASCADE)
    await pool.execute(
      'DELETE FROM assignment_files WHERE id = ?',
      [id]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'File deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
