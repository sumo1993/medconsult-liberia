import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// POST - Submit a rating
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId, rating, review } = await request.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Get assignment details
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT id, client_id, doctor_id, status 
       FROM assignment_requests 
       WHERE id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignments[0];

    // Verify client owns this assignment
    if (assignment.client_id !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify assignment is completed
    if (assignment.status !== 'completed') {
      return NextResponse.json({ error: 'Can only rate completed assignments' }, { status: 400 });
    }

    // Check if rating already exists
    const [existingRatings] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM ratings WHERE assignment_request_id = ? AND client_id = ?',
      [assignmentId, user.userId]
    );

    if (existingRatings.length > 0) {
      // Update existing rating
      await pool.execute(
        `UPDATE ratings 
         SET rating = ?, review = ?, updated_at = NOW()
         WHERE assignment_request_id = ? AND client_id = ?`,
        [rating, review || null, assignmentId, user.userId]
      );
    } else {
      // Insert new rating
      await pool.execute(
        `INSERT INTO ratings (assignment_request_id, client_id, doctor_id, rating, review)
         VALUES (?, ?, ?, ?, ?)`,
        [assignmentId, user.userId, assignment.doctor_id, rating, review || null]
      );
    }

    // Update doctor's average rating
    const [ratingStats] = await pool.execute<RowDataPacket[]>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total
       FROM ratings
       WHERE doctor_id = ?`,
      [assignment.doctor_id]
    );

    await pool.execute(
      `UPDATE users 
       SET average_rating = ?, total_ratings = ?
       WHERE id = ?`,
      [ratingStats[0].avg_rating || 0, ratingStats[0].total || 0, assignment.doctor_id]
    );

    console.log('[Rating] Rating submitted:', { assignmentId, rating, doctorId: assignment.doctor_id });

    return NextResponse.json({ 
      success: true, 
      message: 'Rating submitted successfully',
      averageRating: ratingStats[0].avg_rating,
      totalRatings: ratingStats[0].total
    });

  } catch (error: any) {
    console.error('[Rating] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating: ' + error.message },
      { status: 500 }
    );
  }
}

// GET - Get ratings for a doctor or assignment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const assignmentId = searchParams.get('assignmentId');

    if (doctorId) {
      // Get all ratings for a doctor
      const [ratings] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           r.id,
           r.assignment_request_id,
           r.rating,
           r.review,
           r.created_at,
           u.full_name as client_name,
           ar.title as assignment_title
         FROM ratings r
         JOIN users u ON r.client_id = u.id
         JOIN assignment_requests ar ON r.assignment_request_id = ar.id
         WHERE r.doctor_id = ?
         ORDER BY r.created_at DESC`,
        [doctorId]
      );

      console.log('[Rating] Found ratings for doctor', doctorId, ':', ratings.length);
      return NextResponse.json({ ratings });
    } else if (assignmentId) {
      // Get rating for specific assignment
      const [ratings] = await pool.execute<RowDataPacket[]>(
        `SELECT r.*, u.full_name as client_name
         FROM ratings r
         JOIN users u ON r.client_id = u.id
         WHERE r.assignment_request_id = ?`,
        [assignmentId]
      );

      console.log('[Rating] Found rating for assignment', assignmentId, ':', ratings.length > 0);
      return NextResponse.json({ rating: ratings[0] || null });
    } else {
      return NextResponse.json({ error: 'doctorId or assignmentId required' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Rating] Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings: ' + error.message },
      { status: 500 }
    );
  }
}
