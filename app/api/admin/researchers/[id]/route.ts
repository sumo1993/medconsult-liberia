import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// PUT - Update researcher profile (admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('🔥 API CALLED');
  try {
    const params = await context.params;
    console.log('Researcher ID:', params.id);
    
    const user = await verifyAuth(request);
    console.log('User auth:', user?.role);
    
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Body received:', Object.keys(body));
    
    const specialization = body.specialization || null;
    const years_of_experience = body.years_of_experience || null;
    const bio = body.bio || null;
    const profile_photo_data = body.profile_photo_data || null;
    const profile_photo_filename = body.profile_photo_filename || null;
    const researcherId = params.id;
    
    console.log('Has photo:', !!profile_photo_data);

    // Handle photo upload if provided
    if (profile_photo_data) {
      console.log('Processing photo...');
      // Convert base64 to Buffer
      const base64Data = profile_photo_data.includes(',') 
        ? profile_photo_data.split(',')[1] 
        : profile_photo_data;
      const photoBuffer = Buffer.from(base64Data, 'base64');
      const photoSize = photoBuffer.length;
      console.log('Photo size:', photoSize);

      // Update with photo
      const [result]: any = await pool.execute(
        `UPDATE users 
         SET specialization = ?, 
             years_of_experience = ?, 
             bio = ?,
             profile_photo = ?,
             profile_photo_filename = ?,
             profile_photo_size = ?
         WHERE id = ? AND role = 'consultant'`,
        [specialization, years_of_experience, bio, photoBuffer, profile_photo_filename, photoSize, researcherId]
      );
      console.log('Rows affected:', result.affectedRows);
    } else {
      console.log('No photo, updating text only');
      // Update without photo
      const [result]: any = await pool.execute(
        `UPDATE users 
         SET specialization = ?, 
             years_of_experience = ?, 
             bio = ?
         WHERE id = ? AND role = 'consultant'`,
        [specialization, years_of_experience, bio, researcherId]
      );
      console.log('Rows affected:', result.affectedRows);
    }

    console.log('✅ Update complete');
    return NextResponse.json({ 
      success: true, 
      message: 'Researcher profile updated successfully' 
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update researcher profile', details: error.message },
      { status: 500 }
    );
  }
}
