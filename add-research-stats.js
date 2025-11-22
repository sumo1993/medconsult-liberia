const mysql = require('mysql2/promise');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

async function addColumns() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  console.log('Adding likes and views columns to research_posts...\n');

  const columns = [
    { name: 'likes', def: 'INT DEFAULT 0' },
    { name: 'views', def: 'INT DEFAULT 0' },
  ];

  for (const col of columns) {
    try {
      console.log(`Adding column: ${col.name}...`);
      await connection.execute(`ALTER TABLE research_posts ADD COLUMN ${col.name} ${col.def}`);
      console.log(`✅ Added ${col.name}`);
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log(`⏭️  ${col.name} already exists`);
      } else {
        console.error(`❌ Failed to add ${col.name}:`, error.message);
      }
    }
  }

  console.log('\n✅ Migration completed!');
  
  // Verify columns exist
  const [columns_check] = await connection.execute(`SHOW COLUMNS FROM research_posts`);
  console.log('\nResearch posts columns:');
  columns_check.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

  await connection.end();
}

addColumns().catch(console.error);
