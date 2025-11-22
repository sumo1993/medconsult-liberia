import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getUserById } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  userId: number;
  email: string;
  role: 'admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher';
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
    
    console.log('verifyAuth - Token source:', token ? (request.cookies.get('auth-token') ? 'cookie' : 'header') : 'none');
    console.log('verifyAuth - Token present:', !!token);

    if (!token) {
      console.log('verifyAuth - No token found in cookie or header');
      return null;
    }

    const decoded = verify(token, JWT_SECRET) as AuthUser;
    console.log('verifyAuth - Token decoded for user:', decoded.email);
    
    // Verify user still exists and is active
    const user = await getUserById(decoded.userId);
    if (!user) {
      console.log('verifyAuth - User not found');
      return null;
    }
    
    if (user.status !== 'active') {
      console.log(`verifyAuth - User account is ${user.status}, not active. Denying access.`);
      return null;
    }

    console.log('verifyAuth - Success for user:', user.email, 'role:', user.role);
    return decoded;
  } catch (error) {
    console.log('verifyAuth - Error:', error);
    return null;
  }
}

export function requireAuth(allowedRoles?: ('admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher')[]) {
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
