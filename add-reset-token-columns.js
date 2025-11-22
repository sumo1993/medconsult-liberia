const mysql = require('mysql2/promise');

async function addResetTokenColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('🔧 Adding password reset token columns to users table...\n');

    // Check if columns already exist
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'reset_token%'"
    );

    if (columns.length > 0) {
      console.log('✅ Reset token columns already exist:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });
      console.log('\n✨ No changes needed!');
      return;
    }

    // Add the columns
    console.log('📝 Adding columns...');
    await connection.execute(
      `ALTER TABLE users 
       ADD COLUMN reset_token VARCHAR(255) NULL,
       ADD COLUMN reset_token_expiry DATETIME NULL,
       ADD INDEX idx_reset_token (reset_token)`
    );

    console.log('✅ Columns added successfully!\n');

    // Verify
    const [newColumns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'reset_token%'"
    );

    console.log('✅ Verified columns:');
    newColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });

    console.log('\n🎉 Password reset functionality is now ready!');
    console.log('\n📋 What you can do now:');
    console.log('   1. Go to /forgot-password');
    console.log('   2. Enter your email');
    console.log('   3. Get reset link (shown in console for dev)');
    console.log('   4. Click link to reset password');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addResetTokenColumns();
