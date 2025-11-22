import { hashPassword } from '../lib/auth';
import pool from '../lib/db';

async function createAdminUser() {
  try {
    const password = 'Admin@123';
    const passwordHash = await hashPassword(password);

    await pool.execute(
      `INSERT INTO users (email, password_hash, full_name, role, status, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['admin@medconsult.com', passwordHash, 'System Administrator', 'admin', 'active', true]
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@medconsult.com');
    console.log('Password: Admin@123');
    console.log('⚠️  Please change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
