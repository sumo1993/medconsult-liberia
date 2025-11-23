import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medconsult_liberia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000, // 60 seconds
  ssl: process.env.DB_HOST?.includes('aivencloud.com') ? { 
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  } : undefined,
});

// Log connection info on startup (without password)
console.log('[DB] Connection pool created:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  ssl: !!process.env.DB_HOST?.includes('aivencloud.com')
});

// Helper function for executing queries
export async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export default pool;
