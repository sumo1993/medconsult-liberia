const mysql = require('mysql2/promise');

async function updateYearsExperience() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    await connection.execute(
      'UPDATE statistics SET years_experience = 15 WHERE id = 1'
    );
    console.log('✅ Years of experience updated to 15');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateYearsExperience();
