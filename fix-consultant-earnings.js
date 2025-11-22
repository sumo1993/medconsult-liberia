const mysql = require('mysql2/promise');

async function fixConsultantEarnings() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medconsult_liberia',
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    console.log('Checking consultant_earnings table...');
    
    // Check if columns exist
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultant_earnings' 
      AND COLUMN_NAME IN ('website_fee', 'team_fee', 'notes')
    `);
    
    console.log('Existing fee columns:', columns.map(c => c.COLUMN_NAME));
    
    const existingCols = columns.map(c => c.COLUMN_NAME);
    
    if (!existingCols.includes('website_fee')) {
      console.log('Adding website_fee column...');
      await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN website_fee DECIMAL(10, 2) DEFAULT 0`);
      console.log('✅ Added website_fee');
    } else {
      console.log('✓ website_fee already exists');
    }
    
    if (!existingCols.includes('team_fee')) {
      console.log('Adding team_fee column...');
      await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN team_fee DECIMAL(10, 2) DEFAULT 0`);
      console.log('✅ Added team_fee');
    } else {
      console.log('✓ team_fee already exists');
    }
    
    if (!existingCols.includes('notes')) {
      console.log('Adding notes column...');
      await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN notes TEXT`);
      console.log('✅ Added notes');
    } else {
      console.log('✓ notes already exists');
    }
    
    // Allow NULL consultant_id
    console.log('Setting consultant_id to allow NULL...');
    await pool.execute(`
      ALTER TABLE consultant_earnings 
      MODIFY COLUMN consultant_id INT NULL
    `);
    console.log('✅ consultant_id set to allow NULL');
    
    console.log('\n✅ All migrations completed successfully!');
    console.log('You can now add partnership payments with team distribution.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    await pool.end();
  }
}

fixConsultantEarnings();
