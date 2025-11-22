const mysql = require('mysql2/promise');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

async function updateStatus() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  console.log('Updating research_posts status enum...\n');

  try {
    // Modify the status enum to include 'pending'
    await connection.execute(`
      ALTER TABLE research_posts 
      MODIFY COLUMN status ENUM('draft', 'pending', 'published', 'archived') DEFAULT 'draft'
    `);
    console.log('✅ Added "pending" status to research_posts');

    // Add rejection_reason column for admin feedback
    try {
      await connection.execute(`ALTER TABLE research_posts ADD COLUMN rejection_reason TEXT NULL`);
      console.log('✅ Added rejection_reason column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  rejection_reason exists');
      else console.log('❌ rejection_reason:', e.message);
    }

    // Add reviewed_by column
    try {
      await connection.execute(`ALTER TABLE research_posts ADD COLUMN reviewed_by INT NULL`);
      console.log('✅ Added reviewed_by column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  reviewed_by exists');
      else console.log('❌ reviewed_by:', e.message);
    }

    // Add reviewed_at column
    try {
      await connection.execute(`ALTER TABLE research_posts ADD COLUMN reviewed_at TIMESTAMP NULL`);
      console.log('✅ Added reviewed_at column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  reviewed_at exists');
      else console.log('❌ reviewed_at:', e.message);
    }

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⏭️  Columns already exist');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  console.log('\n✅ Research approval workflow ready!');
  await connection.end();
}

updateStatus().catch(console.error);
