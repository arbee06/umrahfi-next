const { syncDatabase } = require('../models');

async function main() {
  try {
    console.log('Starting database synchronization...');
    
    // Sync database with alter: true to update existing tables
    await syncDatabase(false);
    
    console.log('Database synchronization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database synchronization failed:', error);
    process.exit(1);
  }
}

main();