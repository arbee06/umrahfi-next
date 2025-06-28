const sequelize = require('../lib/database');

async function addDraftStatus() {
  try {
    console.log('Adding draft status to orders table...');
    
    // Add 'draft' to the status enum
    await sequelize.query(`
      ALTER TABLE \`orders\` 
      MODIFY COLUMN \`status\` ENUM('draft', 'pending', 'confirmed', 'cancelled', 'completed') 
      DEFAULT 'pending'
    `);
    
    console.log('✅ Successfully added draft status to orders table');
    
    // Verify the change
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM \`orders\` LIKE 'status'
    `);
    
    console.log('Current status column definition:', results[0]);
    
  } catch (error) {
    console.error('❌ Error adding draft status:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addDraftStatus();