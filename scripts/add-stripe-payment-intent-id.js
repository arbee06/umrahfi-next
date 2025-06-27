const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addStripePaymentIntentIdColumn() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('Connected to database');

    // Check if column already exists
    console.log('Checking if stripePaymentIntentId column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'stripePaymentIntentId'
    `);

    if (columns.length > 0) {
      console.log('✅ stripePaymentIntentId column already exists');
      return;
    }

    // Add the column
    console.log('Adding stripePaymentIntentId column to orders table...');
    await connection.execute(`
      ALTER TABLE \`orders\` 
      ADD COLUMN \`stripePaymentIntentId\` VARCHAR(255) NULL
    `);

    console.log('✅ Successfully added stripePaymentIntentId column');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

addStripePaymentIntentIdColumn();