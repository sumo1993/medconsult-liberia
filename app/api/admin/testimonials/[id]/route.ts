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
      `SELECT id, name, role, rating, text, is_active, display_order, created_at, updated_at,
       CASE WHEN photo IS NOT NULL THEN true ELSE false END as has_photo
       FROM testimonials WHERE id = ?`,
      [id]
    );

    if (testimonials.length === 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json(testimonials[0]);
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, rating, text, is_active, display_order } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (rating !== undefined) { updates.push('rating = ?'); values.push(rating); }
    if (text !== undefined) { updates.push('text = ?'); values.push(text); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    const [, meta] = await pool.execute(
      `UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Testimonial updated successfully' });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
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
      'DELETE FROM testimonials WHERE id = ?',
      [id]
    );

    if ((meta as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
