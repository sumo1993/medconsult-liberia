import { compare, hash } from 'bcryptjs';
import pool from './db';
import { RowDataPacket } from 'mysql2';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher';
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  created_at: Date;
  last_login?: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, role, phone, status, email_verified, created_at, last_login FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) return null;
    return rows[0] as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, role, phone, status, email_verified, created_at, last_login FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0] as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ? AND status = "active"',
      [email]
    );

    if (rows.length === 0) return null;

    const user = rows[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) return null;

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

export async function createUser(
  email: string,
  password: string,
  full_name: string,
  role: 'admin' | 'management' | 'client' | 'accountant' | 'consultant' | 'researcher' = 'client',
  phone?: string
): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, full_name, role, phone || null]
    );

    const userId = (result as any).insertId;
    return await getUserById(userId);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('User already exists');
    } else {
      console.error('Error creating user:', error);
    }
    return null;
  }
}

export async function logActivity(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType || null, entityId || null, ipAddress || null, userAgent || null]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
