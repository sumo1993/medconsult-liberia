const mysql = require('mysql2/promise');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

async function migrate() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  console.log('Connected to database');

  const columns = [
    { name: 'profile_photo', def: 'LONGBLOB NULL' },
    { name: 'profile_photo_filename', def: 'VARCHAR(255) NULL' },
    { name: 'profile_photo_size', def: 'INT NULL' },
    { name: 'specialization', def: 'VARCHAR(255) NULL' },
    { name: 'years_of_experience', def: 'INT NULL' },
    { name: 'bio', def: 'TEXT NULL' },
    { name: 'average_rating', def: 'DECIMAL(3,2) NULL DEFAULT 0.00' },
    { name: 'total_ratings', def: 'INT NULL DEFAULT 0' },
  ];

  for (const col of columns) {
    try {
      console.log(`Adding column: ${col.name}...`);
      await connection.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
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
  const [allColumns] = await connection.execute(`SHOW COLUMNS FROM users`);
  console.log('\nAll users table columns:');
  allColumns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
  
  await connection.end();
}

migrate().catch(console.error);
