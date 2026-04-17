import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getUserById } from './auth';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. The application cannot start without it.');
}
const AUTH_CACHE_TTL_MS = 10 * 60_000;
const activeUserCache = new Map<number, number>();

export interface AuthUser {
  userId: number;
  email: string;
  role: 'admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher' | 'census';
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return null;
    }

    const decoded = verify(token, JWT_SECRET) as AuthUser;
    const normalizedUserId = Number((decoded as { userId?: unknown }).userId);
    if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
      return null;
    }
    const normalizedDecoded: AuthUser = {
      ...decoded,
      userId: normalizedUserId,
    };
    const cacheUntil = activeUserCache.get(normalizedUserId);
    if (cacheUntil && cacheUntil > Date.now()) {
      return normalizedDecoded;
    }

    const user = await getUserById(normalizedDecoded.userId);
    if (!user) {
      activeUserCache.delete(normalizedUserId);
      return null;
    }
    
    if (user.status !== 'active') {
      activeUserCache.delete(normalizedUserId);
      return null;
    }

    // Use the role from DB (not the JWT) so role changes take effect immediately
    const freshUser: AuthUser = {
      userId: normalizedUserId,
      email: user.email,
      role: user.role,
    };

    activeUserCache.set(normalizedUserId, Date.now() + AUTH_CACHE_TTL_MS);
    return freshUser;
  } catch (error) {
    console.log('verifyAuth - Error:', error);
    return null;
  }
}

export function requireAuth(allowedRoles?: ('admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher' | 'census')[]) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request);

    if (!user) {
      return { error: 'Unauthorized', status: 401 };
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    return { user };
  };
}
