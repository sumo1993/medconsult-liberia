import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET PDF file for a research post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    
    const [posts] = await pool.execute<RowDataPacket[]>(
      'SELECT pdf_file, pdf_filename FROM research_posts WHERE id = ? AND pdf_file IS NOT NULL',
      [id]
    );

    if (posts.length === 0 || !posts[0].pdf_file) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    const post = posts[0];
    const pdfBuffer = Buffer.from(post.pdf_file);
    const filename = post.pdf_filename || `research-${id}.pdf`;

    // Use 'inline' for viewing in browser, 'attachment' for downloading
    const disposition = download ? 'attachment' : 'inline';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF' },
      { status: 500 }
    );
  }
}
