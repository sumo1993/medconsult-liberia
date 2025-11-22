import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET single research post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching post with ID:', id);
    
    const [posts] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM research_posts WHERE id = ?',
      [id]
    );

    console.log('Posts found:', posts.length);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0];
    
    // Parse tags if they're stored as JSON
    if (post.tags && typeof post.tags === 'string') {
      try {
        post.tags = JSON.parse(post.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        post.tags = [];
      }
    }

    // Convert featured_image Buffer to base64 string
    if (post.featured_image) {
      post.featured_image = Buffer.from(post.featured_image).toString('base64');
    }

    console.log('Returning post:', post.title);
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching research post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research post', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT update research post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify management or admin access
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, summary, content, category, tags, status, pdf_data, pdf_filename, pdf_size, remove_pdf } = body;

    // If only status is provided (quick publish), do a simple status update
    if (status && !title && !content) {
      let publishedAt = null;
      if (status === 'published') {
        const [existing] = await pool.execute<RowDataPacket[]>(
          'SELECT published_at FROM research_posts WHERE id = ?',
          [id]
        );
        
        if (existing.length > 0 && existing[0].published_at) {
          publishedAt = existing[0].published_at;
        } else {
          publishedAt = new Date();
        }
      }

      await pool.execute(
        `UPDATE research_posts 
         SET status = ?, published_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [status, publishedAt, id]
      );

      return NextResponse.json({
        success: true,
        message: 'Research post status updated successfully',
      });
    }

    // Full update
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Parse tags if provided
    const tagsArray = tags ? tags.split(',').map((t: string) => t.trim()) : [];
    const tagsJson = JSON.stringify(tagsArray);

    // Set published_at if status is being changed to published
    let publishedAt = null;
    if (status === 'published') {
      // Check if it was already published
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT published_at FROM research_posts WHERE id = ?',
        [id]
      );
      
      if (existing.length > 0 && existing[0].published_at) {
        publishedAt = existing[0].published_at;
      } else {
        publishedAt = new Date();
      }
    }

    // Handle PDF updates
    let pdfBuffer = null;
    let finalPdfFilename = pdf_filename;
    let finalPdfSize = pdf_size;

    if (remove_pdf) {
      // Remove PDF
      pdfBuffer = null;
      finalPdfFilename = null;
      finalPdfSize = null;
    } else if (pdf_data) {
      // New PDF uploaded
      const base64Data = pdf_data.includes(',') ? pdf_data.split(',')[1] : pdf_data;
      pdfBuffer = Buffer.from(base64Data, 'base64');
    }

    // Update with or without PDF changes
    if (remove_pdf || pdf_data) {
      await pool.execute(
        `UPDATE research_posts 
         SET title = ?, summary = ?, content = ?, category = ?, tags = ?, status = ?, published_at = ?, 
             pdf_file = ?, pdf_filename = ?, pdf_size = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, summary || null, content, category || null, tagsJson, status || 'draft', publishedAt, 
         pdfBuffer, finalPdfFilename, finalPdfSize, id]
      );
    } else {
      // Update without changing PDF
      await pool.execute(
        `UPDATE research_posts 
         SET title = ?, summary = ?, content = ?, category = ?, tags = ?, status = ?, published_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, summary || null, content, category || null, tagsJson, status || 'draft', publishedAt, id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Research post updated successfully',
    });
  } catch (error) {
    console.error('Error updating research post:', error);
    return NextResponse.json(
      { error: 'Failed to update research post' },
      { status: 500 }
    );
  }
}

// DELETE research post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify management or admin access
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'management' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await pool.execute(
      'DELETE FROM research_posts WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Research post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting research post:', error);
    return NextResponse.json(
      { error: 'Failed to delete research post' },
      { status: 500 }
    );
  }
}
