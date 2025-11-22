import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    console.log('[Session Validation] Checking session...');
    const user = await verifyAuth(request);
    
    if (!user) {
      console.log('[Session Validation] ❌ User not authenticated or account locked');
      return NextResponse.json({ valid: false, reason: 'unauthorized' }, { status: 401 });
    }

    console.log('[Session Validation] ✅ User authenticated:', user.email);
    return NextResponse.json({ valid: true, user });
  } catch (error) {
    console.error('[Session Validation] Error:', error);
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 });
  }
}
