const mysql = require('mysql2/promise');

async function createAccountantTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    console.log('Creating accountant-related tables...');

    // Create transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_type ENUM('consultation_fee', 'partnership_payment', 'expense', 'refund', 'other') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        description TEXT,
        consultant_id INT,
        client_id INT,
        partnership_id INT,
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (consultant_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Transactions table created');

    // Create consultant_earnings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS consultant_earnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultant_id INT NOT NULL,
        transaction_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        commission_rate DECIMAL(5, 2) DEFAULT 70.00,
        net_earning DECIMAL(10, 2) NOT NULL,
        payment_status ENUM('pending', 'paid', 'on_hold') DEFAULT 'pending',
        payment_date DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (consultant_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Consultant earnings table created');

    // Create expenses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_url VARCHAR(500),
        approved_by INT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Expenses table created');

    // Add indexes
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_transactions_consultant ON transactions(consultant_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_consultant_earnings_consultant ON consultant_earnings(consultant_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_consultant_earnings_status ON consultant_earnings(payment_status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)');
    console.log('✓ Indexes created');

    console.log('\n✅ All accountant tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await connection.end();
  }
}

createAccountantTables();
