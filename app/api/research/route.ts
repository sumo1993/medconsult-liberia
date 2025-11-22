import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// Set max duration for this route
export const maxDuration = 60; // 60 seconds timeout

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Check if user is authenticated for accessing drafts
    const user = await verifyAuth(request);
    const isAuthenticated = user && (user.role === 'management' || user.role === 'admin');

    let query = 'SELECT * FROM research_posts';
    const params: string[] = [];

    if (status === 'all' && isAuthenticated) {
      // Authenticated users can see all posts
      // No WHERE clause needed
    } else if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    } else {
      // Default: show only published for public
      query += ' WHERE status = "published"';
    }

    query += ' ORDER BY created_at DESC';

    const [posts] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching research posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify management or admin access
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, summary, content, category, tags, status, pdf_data, pdf_filename, pdf_size, image_data, image_filename, image_size } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Parse tags if provided
    const tagsArray = tags ? tags.split(',').map((t: string) => t.trim()) : [];
    const tagsJson = JSON.stringify(tagsArray);

    const publishedAt = status === 'published' ? new Date() : null;

    // Convert PDF base64 to buffer if provided
    let pdfBuffer = null;
    if (pdf_data) {
      const base64Data = pdf_data.includes(',') ? pdf_data.split(',')[1] : pdf_data;
      pdfBuffer = Buffer.from(base64Data, 'base64');
    }

    // Convert image base64 to buffer if provided
    let imageBuffer = null;
    if (image_data) {
      const base64Data = image_data.includes(',') ? image_data.split(',')[1] : image_data;
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    const [result] = await pool.execute(
      `INSERT INTO research_posts 
       (title, summary, content, author_id, category, tags, status, published_at, pdf_file, pdf_filename, pdf_size, featured_image, featured_image_filename, featured_image_size) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, summary || null, content, user.userId, category || null, tagsJson, status || 'draft', publishedAt, pdfBuffer, pdf_filename || null, pdf_size || null, imageBuffer, image_filename || null, image_size || null]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Research post created successfully',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating research post:', error);
    
    // Provide more specific error message
    let errorMessage = 'Failed to create research post';
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific errors
      if (error.message.includes('Packet too large')) {
        errorMessage = 'Content is too large. Please reduce the size of your content, images, or PDF.';
      } else if (error.message.includes('ER_DATA_TOO_LONG')) {
        errorMessage = 'Content exceeds maximum allowed size. Please reduce content length.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection failed. Please try again.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
