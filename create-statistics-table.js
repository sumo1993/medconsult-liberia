const mysql = require('mysql2/promise');

async function createStatisticsTable() {
  console.log('🗄️  Creating statistics table...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    // Create statistics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        research_projects INT NOT NULL DEFAULT 0,
        clinic_setups INT NOT NULL DEFAULT 0,
        rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        total_consultations INT NOT NULL DEFAULT 0,
        years_experience INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ statistics table created successfully!');

    // Check if there are any existing records
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM statistics');
    
    if (existing[0].count === 0) {
      // Add default statistics
      await connection.execute(`
        INSERT INTO statistics (research_projects, clinic_setups, rating, total_consultations, years_experience) 
        VALUES (?, ?, ?, ?, ?)
      `, [25, 15, 4.95, 500, 20]);
      console.log('✅ Default statistics added');
    }

    console.log('\n✅ Setup complete!');
    console.log('📊 Statistics tracking enabled');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createStatisticsTable();
