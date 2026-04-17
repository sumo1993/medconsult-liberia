import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [testimonials] = await pool.execute<any[]>(
      'SELECT photo, photo_type FROM testimonials WHERE id = ?',
      [id]
    );

    if (testimonials.length === 0 || !testimonials[0].photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = testimonials[0].photo;
    const photoType = testimonials[0].photo_type || 'image/jpeg';

    return new NextResponse(photo, {
      headers: {
        'Content-Type': photoType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching testimonial photo:', error);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const [, meta] = await pool.execute(
      'UPDATE testimonials SET photo = ?, photo_type = ? WHERE id = ?',
      [buffer, file.type, id]
    );

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Photo uploaded successfully' });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [, meta] = await pool.execute(
      'UPDATE testimonials SET photo = NULL, photo_type = NULL WHERE id = ?',
      [id]
    );

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Photo removed successfully' });
  } catch (error) {
    console.error('Error removing photo:', error);
    return NextResponse.json({ error: 'Failed to remove photo' }, { status: 500 });
  }
}
