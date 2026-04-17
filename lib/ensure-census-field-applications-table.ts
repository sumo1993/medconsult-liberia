import pool, { IS_POSTGRES } from '@/lib/db';

let p: Promise<void> | null = null;

export async function ensureCensusFieldApplicationsTable(): Promise<void> {
  if (p) {
    await p;
    return;
  }
  p = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_field_applications (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          preferred_region VARCHAR(255) NOT NULL,
          field_experience TEXT NOT NULL,
          motivation TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL
        )
      `);
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_field_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          preferred_region VARCHAR(255) NOT NULL,
          field_experience TEXT NOT NULL,
          motivation TEXT NOT NULL,
          status ENUM('pending', 'reviewing', 'approved', 'rejected') DEFAULT 'pending',
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL
        )
      `);
    }
  })();
  await p;
}
