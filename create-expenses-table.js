const mysql = require('mysql2/promise');

async function createExpensesTable() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'medconsult_liberia'
    });

    console.log('✓ Connected to database');

    // Create expenses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_url VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_by INT,
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_expense_date (expense_date),
        INDEX idx_status (status),
        INDEX idx_category (category)
      )
    `);

    console.log('✓ Expenses table created successfully!');

    // Add foreign keys separately (in case they fail, table still exists)
    try {
      await connection.execute(`
        ALTER TABLE expenses 
        ADD CONSTRAINT fk_expenses_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✓ Foreign key for created_by added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key for created_by already exists');
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE expenses 
        ADD CONSTRAINT fk_expenses_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✓ Foreign key for approved_by added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key for approved_by already exists');
      }
    }

    console.log('\n✅ Expenses table is ready to use!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createExpensesTable();
