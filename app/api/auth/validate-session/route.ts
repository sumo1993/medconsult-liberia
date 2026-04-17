import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ valid: false, reason: 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ valid: true, user });
  } catch (error) {
    console.error('[Session Validation] Error:', error);
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 });
  }
}
