import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const paperId = params.id;

    // Fetch PDF from database
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT pdf_file, pdf_filename FROM research_posts WHERE id = ?',
      [paperId]
    );

    if (rows.length === 0 || !rows[0].pdf_file) {
      return new NextResponse('PDF not found', { status: 404 });
    }

    const pdfBuffer = rows[0].pdf_file;
    const filename = rows[0].pdf_filename || 'research.pdf';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return new NextResponse('Error fetching PDF', { status: 500 });
  }
}
