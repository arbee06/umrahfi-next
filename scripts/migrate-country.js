// Quick migration script to add country column
const sequelize = require('../lib/database');

async function addCountryColumn() {
  try {
    console.log('Adding country column to users table...');
    
    // Add country column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN country VARCHAR(255) DEFAULT NULL
    `);
    
    console.log('✅ Country column added successfully!');
    
    // Add index
    await sequelize.query(`
      CREATE INDEX idx_users_country ON users(country)
    `);
    
    console.log('✅ Country index added successfully!');
    
    console.log('🎉 Migration completed! You can now use the country field.');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Country column already exists!');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

addCountryColumn();