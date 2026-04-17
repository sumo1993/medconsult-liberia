import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import { getCensusFieldBlockAll, isUserInCensusFieldBlockList } from '@/lib/census-field-access';

/** GET /api/census/field-access/me — census role: whether field dashboard is blocked */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'census') {
      return NextResponse.json({ applies: false, blocked: false });
    }
    const blockAll = await getCensusFieldBlockAll();
    if (blockAll) {
      return NextResponse.json({ applies: true, blocked: true, reason: 'all' as const });
    }
    const individually = await isUserInCensusFieldBlockList(user.userId);
    return NextResponse.json({
      applies: true,
      blocked: individually,
      reason: individually ? ('user' as const) : null,
    });
  } catch (e) {
    console.error('census field-access me:', e);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}
