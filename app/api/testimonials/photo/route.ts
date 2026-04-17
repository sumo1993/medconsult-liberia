import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID required' }, { status: 400 });
    }

    const [testimonials] = await pool.execute<any[]>(
      'SELECT photo, photo_type FROM testimonials WHERE id = ? AND is_active = TRUE',
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
