const mysql = require('mysql2/promise');

async function checkTeamMembers() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  const [rows] = await conn.execute('SELECT id, name, role, status FROM team_members ORDER BY display_order ASC, created_at DESC');
  
  console.log('Team members in database:');
  console.log('Total:', rows.length);
  rows.forEach(m => {
    console.log(`- ${m.name} (${m.role}) - Status: ${m.status}`);
  });
  
  await conn.end();
}

checkTeamMembers();
