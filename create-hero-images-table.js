const mysql = require('mysql2/promise');

async function createHeroImagesTable() {
  console.log('🗄️  Creating hero_images table...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    // Create hero_images table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hero_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(500) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order (display_order)
      )
    `);

    console.log('✅ hero_images table created successfully!');

    // Check if there are any existing images
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM hero_images');
    
    if (existing[0].count === 0) {
      // Add default image
      await connection.execute(
        'INSERT INTO hero_images (url, display_order) VALUES (?, ?)',
        ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", 1]
      );
      console.log('✅ Default hero image added');
    }

    console.log('\n✅ Setup complete!');
    console.log('📝 You can now add multiple hero images from the admin dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createHeroImagesTable();
