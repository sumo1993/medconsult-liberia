const mysql = require('mysql2/promise');

async function updateHeroImagesTable() {
  console.log('🔄 Updating hero_images table...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia',
  });

  try {
    // Check if is_active column exists
    const [activeCol] = await connection.execute(`
      SHOW COLUMNS FROM hero_images LIKE 'is_active'
    `);

    if (activeCol.length === 0) {
      await connection.execute(`
        ALTER TABLE hero_images 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Added is_active column');
    } else {
      console.log('ℹ️  is_active column already exists');
    }

    // Check if order_position exists
    const [orderCol] = await connection.execute(`
      SHOW COLUMNS FROM hero_images LIKE 'order_position'
    `);

    if (orderCol.length === 0) {
      // Check if display_order exists to rename it
      const [displayCol] = await connection.execute(`
        SHOW COLUMNS FROM hero_images LIKE 'display_order'
      `);
      
      if (displayCol.length > 0) {
        await connection.execute(`
          ALTER TABLE hero_images 
          CHANGE COLUMN display_order order_position INT NOT NULL DEFAULT 0
        `);
        console.log('✅ Renamed display_order to order_position');
      } else {
        await connection.execute(`
          ALTER TABLE hero_images 
          ADD COLUMN order_position INT NOT NULL DEFAULT 0
        `);
        console.log('✅ Added order_position column');
      }
    } else {
      console.log('ℹ️  order_position column already exists');
    }

    console.log('\n✅ Hero images table updated successfully!');
    console.log('📝 New features:');
    console.log('   - is_active: Control which images are shown');
    console.log('   - order_position: Control display order');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateHeroImagesTable();
