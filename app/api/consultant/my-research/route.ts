import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch researcher's own papers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [papers] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id, title, summary, category, status, views, likes, 
        created_at, rejection_reason
      FROM research_posts
      WHERE author_id = ?
      ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}

// POST - Create new research paper
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const pdfFile = formData.get('pdf') as File | null;

    let pdfBuffer = null;
    let pdfFilename = null;
    let pdfSize = 0;

    if (pdfFile && pdfFile.size > 0) {
      const bytes = await pdfFile.arrayBuffer();
      pdfBuffer = Buffer.from(bytes);
      pdfFilename = pdfFile.name;
      pdfSize = pdfFile.size;
    }

    const [result]: any = await pool.execute(
      `INSERT INTO research_posts 
       (title, summary, content, category, author_id, status, pdf_file, pdf_filename, pdf_size, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, NOW())`,
      [title, summary, content, category, user.userId, pdfBuffer, pdfFilename, pdfSize]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Research paper created as draft' 
    });
  } catch (error) {
    console.error('Error creating paper:', error);
    return NextResponse.json(
      { error: 'Failed to create paper' },
      { status: 500 }
    );
  }
}

// PUT - Update research paper
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'consultant' && user.role !== 'researcher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const pdfFile = formData.get('pdf') as File | null;

    // Verify ownership
    const [existing]: any = await pool.execute(
      'SELECT author_id, status FROM research_posts WHERE id = ?',
      [id]
    );

    if (existing.length === 0 || existing[0].author_id !== user.userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    if (existing[0].status !== 'draft') {
      return NextResponse.json({ error: 'Can only edit draft papers' }, { status: 400 });
    }

    if (pdfFile && pdfFile.size > 0) {
      const bytes = await pdfFile.arrayBuffer();
      const pdfBuffer = Buffer.from(bytes);
      
      await pool.execute(
        `UPDATE research_posts 
         SET title = ?, summary = ?, content = ?, category = ?,
             pdf_file = ?, pdf_filename = ?, pdf_size = ?,
             updated_at = NOW()
         WHERE id = ? AND author_id = ?`,
        [title, summary, content, category, pdfBuffer, pdfFile.name, pdfFile.size, id, user.userId]
      );
    } else {
      await pool.execute(
        `UPDATE research_posts 
         SET title = ?, summary = ?, content = ?, category = ?, updated_at = NOW()
         WHERE id = ? AND author_id = ?`,
        [title, summary, content, category, id, user.userId]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Research paper updated' 
    });
  } catch (error) {
    console.error('Error updating paper:', error);
    return NextResponse.json(
      { error: 'Failed to update paper' },
      { status: 500 }
    );
  }
}
