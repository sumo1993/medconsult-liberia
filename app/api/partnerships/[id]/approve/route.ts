import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Await params if it's a Promise (Next.js 15+)
  const params = context.params instanceof Promise ? await context.params : context.params;
  console.log('[Partnership API] POST request received for ID:', params.id);
  
  try {
    console.log('[Partnership API] Verifying auth...');
    const user = await verifyAuth(request);
    console.log('[Partnership API] Auth result:', user);
    
    if (!user || user.role !== 'admin') {
      console.log('[Partnership API] Unauthorized - user:', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Partnership API] Reading request body...');
    const { action } = await request.json(); // 'approve', 'reject', 'publish', or 'unpublish'
    console.log('[Partnership API] Action:', action, 'for ID:', params.id);
    console.log('[Partnership API] User object:', JSON.stringify(user, null, 2));
    console.log('[Partnership API] User.userId:', user.userId);
    console.log('[Partnership API] User keys:', Object.keys(user));
    
    let status = '';
    if (action === 'approve') status = 'approved';
    else if (action === 'reject') status = 'rejected';
    else if (action === 'publish') status = 'published';
    else if (action === 'unpublish') status = 'approved'; // Unpublish returns to approved state

    console.log('[Partnership API] New status:', status);
    console.log('[Partnership API] Params.id:', params.id);
    console.log('[Partnership API] Params.id type:', typeof params.id);

    // Validate all parameters before query
    if (!status) {
      console.error('[Partnership API] Invalid status');
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!params.id) {
      console.error('[Partnership API] Missing partnership ID');
      return NextResponse.json({ error: 'Missing partnership ID' }, { status: 400 });
    }

    // Check if partnership exists
    const [existing] = await pool.execute(
      'SELECT id FROM partnerships WHERE id = ?',
      [params.id]
    );
    
    if ((existing as any[]).length === 0) {
      console.error('[Partnership API] Partnership not found:', params.id);
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Get user ID - handle both userId and id properties
    const adminUserId = user.userId || (user as any).id || null;
    console.log('[Partnership API] Admin user ID:', adminUserId);
    console.log('[Partnership API] About to execute UPDATE with params:', {
      status,
      adminUserId,
      partnershipId: params.id
    });

    const result = await pool.execute(
      `UPDATE partnerships 
       SET status = ?, approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [status, adminUserId, params.id]
    );

    console.log('[Partnership API] Update result:', result);
    console.log('[Partnership API] Update successful');

    return NextResponse.json({ 
      success: true,
      message: `Partnership ${action}d successfully`
    });
  } catch (error: any) {
    console.error('[Partnership API] ERROR:', error);
    console.error('[Partnership API] Error message:', error?.message);
    console.error('[Partnership API] Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Failed to update partnership status',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
