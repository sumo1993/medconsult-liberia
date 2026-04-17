import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import {
  getCensusReportsAccessFlags,
  isCensusReportsBlockedForRole,
  setCensusReportsAccessFlags,
} from '@/lib/census-reports-access';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  admin: '/dashboard/admin',
  management: '/dashboard/management',
  researcher: '/dashboard/researcher',
};

// GET /api/census-reports/access — who can see flags + whether current user is blocked
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const flags = await getCensusReportsAccessFlags();
    const blocked = isCensusReportsBlockedForRole(user.role, flags);

    return NextResponse.json({
      flags,
      blocked_for_me: blocked,
      role: user.role,
      home_dashboard: DASHBOARD_BY_ROLE[user.role] || '/dashboard/researcher',
      profile_path: `${DASHBOARD_BY_ROLE[user.role] || '/dashboard/researcher'}/profile`,
    });
  } catch (e) {
    console.error('census-reports access GET:', e);
    return NextResponse.json({ error: 'Failed to load access settings' }, { status: 500 });
  }
}

// PUT /api/census-reports/access — admin: both toggles; management: researchers only
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const br = body?.block_researchers;
    const bm = body?.block_management;

    if (user.role === 'admin') {
      await setCensusReportsAccessFlags(
        {
          ...(typeof br === 'boolean' ? { block_researchers: br } : {}),
          ...(typeof bm === 'boolean' ? { block_management: bm } : {}),
        },
        'admin'
      );
      const flags = await getCensusReportsAccessFlags();
      return NextResponse.json({ success: true, flags });
    }

    if (user.role === 'management') {
      if (typeof bm === 'boolean') {
        return NextResponse.json({ error: 'Only an admin can block CEO (management) access.' }, { status: 403 });
      }
      if (typeof br !== 'boolean') {
        return NextResponse.json({ error: 'block_researchers boolean required' }, { status: 400 });
      }
      await setCensusReportsAccessFlags({ block_researchers: br }, 'management');
      const flags = await getCensusReportsAccessFlags();
      return NextResponse.json({ success: true, flags });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (e) {
    console.error('census-reports access PUT:', e);
    return NextResponse.json({ error: 'Failed to update access settings' }, { status: 500 });
  }
}
