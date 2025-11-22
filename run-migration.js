// Migration script to add featured image columns
const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'medconsult_liberia',
    });

    console.log('✓ Connected to database');

    // Check if columns already exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'medconsult_liberia' 
      AND TABLE_NAME = 'research_posts' 
      AND COLUMN_NAME IN ('featured_image', 'featured_image_filename', 'featured_image_size', 'download_count')
    `);

    if (columns.length > 0) {
      console.log('⚠ Some columns already exist. Skipping migration.');
      console.log('Existing columns:', columns.map(c => c.COLUMN_NAME).join(', '));
    } else {
      // Run migration
      console.log('Running migration...');
      
      await connection.query(`
        ALTER TABLE research_posts 
        ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
        ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
        ADD COLUMN featured_image_size INT AFTER featured_image_filename,
        ADD COLUMN download_count INT DEFAULT 0 AFTER views
      `);

      console.log('✓ Migration completed successfully!');
      console.log('✓ Added columns:');
      console.log('  - featured_image (LONGBLOB)');
      console.log('  - featured_image_filename (VARCHAR(255))');
      console.log('  - featured_image_size (INT)');
      console.log('  - download_count (INT DEFAULT 0)');
    }

    // Create pool for fee breakdown migration
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'medconsult_liberia',
      waitForConnections: true,
      connectionLimit: 10,
    });

    try {
      console.log('Adding fee breakdown columns to consultant_earnings...');
      
      // Check if columns exist
      const [feeColumns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'consultant_earnings' 
        AND COLUMN_NAME IN ('website_fee', 'team_fee', 'notes')
      `);
      
      console.log('Existing columns:', feeColumns);
      
      if (feeColumns.length === 0) {
        await pool.execute(`
          ALTER TABLE consultant_earnings 
          ADD COLUMN website_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '10% platform fee',
          ADD COLUMN team_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '15% team fee',
          ADD COLUMN notes TEXT COMMENT 'Breakdown details'
        `);
        console.log('✅ Fee breakdown columns added');
      } else {
        console.log('Columns already exist, checking which ones are missing...');
        const existingCols = feeColumns.map(c => c.COLUMN_NAME);
        
        if (!existingCols.includes('website_fee')) {
          await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN website_fee DECIMAL(10, 2) DEFAULT 0`);
          console.log('✅ Added website_fee');
        }
        if (!existingCols.includes('team_fee')) {
          await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN team_fee DECIMAL(10, 2) DEFAULT 0`);
          console.log('✅ Added team_fee');
        }
        if (!existingCols.includes('notes')) {
          await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN notes TEXT`);
          console.log('✅ Added notes');
        }
      }
      
      // Allow NULL consultant_id
      await pool.execute(`
        ALTER TABLE consultant_earnings 
        MODIFY COLUMN consultant_id INT NULL
      `);
      console.log('✅ consultant_id set to allow NULL');
      
      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('SQL Error:', error.sqlMessage);
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

// Run the migration
runMigration();
