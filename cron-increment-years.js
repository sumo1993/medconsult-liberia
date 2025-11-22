const mysql = require('mysql2/promise');

async function incrementYearsExperience() {
  console.log('🔄 Checking if years need to be incremented...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    const today = new Date();
    const isJanuaryFirst = today.getMonth() === 0 && today.getDate() === 1;

    if (isJanuaryFirst) {
      // Increment years_experience by 1
      await connection.execute(
        'UPDATE statistics SET years_experience = years_experience + 1 WHERE id = 1'
      );
      
      const [stats] = await connection.execute(
        'SELECT years_experience FROM statistics WHERE id = 1'
      );
      
      console.log('✅ Years of experience incremented!');
      console.log(`📅 New value: ${stats[0].years_experience} years`);
      console.log(`🎉 Happy New Year! Experience updated on ${today.toDateString()}`);
    } else {
      console.log('ℹ️  Not January 1st - no update needed');
      console.log(`📅 Current date: ${today.toDateString()}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

incrementYearsExperience();
