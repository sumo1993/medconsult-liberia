import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { verifyAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;

    // Sanitize filename: strip directory traversal sequences and use only the basename
    const sanitized = path.basename(filename);
    if (!sanitized || sanitized === '.' || sanitized === '..') {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    const filepath = path.join(uploadsDir, sanitized);

    // Ensure resolved path stays within the uploads directory
    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(uploadsDir))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    if (!existsSync(resolved)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(resolved);

    const ext = path.extname(sanitized).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const inline = request.nextUrl.searchParams.get('inline') === '1';
    const disposition = inline ? 'inline' : 'attachment';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${sanitized.replace(/"/g, '')}"`,
        'Cache-Control': 'private, max-age=3600',
        // Allow same-origin embedding if this URL is ever used in an iframe (global config may still set frame policy).
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
