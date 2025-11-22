const mysql = require('mysql2/promise');

async function addUserProfileColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    console.log('🔄 Adding profile columns to users table...\n');

    // Check existing columns
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'medconsult_liberia' 
      AND TABLE_NAME = 'users'
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', existingColumns.join(', '));
    console.log('');

    // Define all profile columns that should exist
    const profileColumns = [
      { name: 'title', type: 'VARCHAR(50)', description: 'Title (Mr, Mrs, Dr, etc.)' },
      { name: 'date_of_birth', type: 'DATE', description: 'Date of birth' },
      { name: 'gender', type: 'VARCHAR(20)', description: 'Gender' },
      { name: 'city', type: 'VARCHAR(100)', description: 'City' },
      { name: 'county', type: 'VARCHAR(100)', description: 'County' },
      { name: 'country', type: 'VARCHAR(100)', description: 'Country' },
      { name: 'educational_level', type: 'VARCHAR(100)', description: 'Educational level' },
      { name: 'marital_status', type: 'VARCHAR(50)', description: 'Marital status' },
      { name: 'employment_status', type: 'VARCHAR(50)', description: 'Employment status' },
      { name: 'occupation', type: 'VARCHAR(100)', description: 'Occupation' },
      { name: 'phone_number', type: 'VARCHAR(20)', description: 'Phone number' },
      { name: 'emergency_contact_name', type: 'VARCHAR(255)', description: 'Emergency contact name' },
      { name: 'emergency_contact_phone', type: 'VARCHAR(20)', description: 'Emergency contact phone' },
      { name: 'emergency_contact_relationship', type: 'VARCHAR(50)', description: 'Emergency contact relationship' },
      { name: 'specialization', type: 'VARCHAR(255)', description: 'Specialization' },
      { name: 'years_of_experience', type: 'INT', description: 'Years of experience' },
      { name: 'license_number', type: 'VARCHAR(100)', description: 'License number' },
      { name: 'research_interests', type: 'TEXT', description: 'Research interests' },
      { name: 'current_projects', type: 'TEXT', description: 'Current projects' },
      { name: 'bio', type: 'TEXT', description: 'Biography' },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const column of profileColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name} (${column.description})`);
        await connection.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
        addedCount++;
      } else {
        console.log(`✓ Column already exists: ${column.name}`);
        skippedCount++;
      }
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`   Added: ${addedCount} columns`);
    console.log(`   Skipped: ${skippedCount} columns (already exist)`);
    console.log('');
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    await connection.end();
  }
}

addUserProfileColumns();
