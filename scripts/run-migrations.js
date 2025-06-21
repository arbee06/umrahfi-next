const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '188.166.214.90',
    user: process.env.DB_USER || 'dev',
    password: process.env.DB_PASSWORD || 'Operation1996!',
    database: process.env.DB_NAME || 'umrahfi-next'
  });

  try {
    console.log('Connected to database');

    // Skip package migration since columns already exist
    console.log('📋 Package assistance columns already exist, skipping...');

    // Read and execute visa table migration
    const visaMigration = fs.readFileSync(
      path.join(__dirname, '../migrations/create-visas-table.sql'), 
      'utf8'
    );
    
    console.log('Running visa table migration...');
    await connection.execute(visaMigration);
    console.log('✅ Visa table migration completed');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // If columns already exist, that's OK
    if (error.message.includes('Duplicate column name')) {
      console.log('⚠️  Columns already exist, skipping...');
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);