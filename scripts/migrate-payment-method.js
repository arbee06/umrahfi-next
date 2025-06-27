const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function updatePaymentMethodEnum() {
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

    // Check current enum values
    console.log('Checking current paymentMethod enum...');
    const [currentEnum] = await connection.execute(`
      SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'paymentMethod'
    `);
    console.log('Current enum:', currentEnum[0]?.COLUMN_TYPE);

    // Step 1: Add new enum values (including old ones temporarily)
    console.log('Adding new enum values...');
    await connection.execute(`
      ALTER TABLE \`orders\` 
      MODIFY COLUMN \`paymentMethod\` ENUM('stripe', 'bank_transfer', 'cash', 'credit_card') 
      DEFAULT 'stripe' NOT NULL
    `);

    // Step 2: Update existing credit_card entries to stripe
    console.log('Updating existing credit_card entries to stripe...');
    const [updateResult] = await connection.execute(`
      UPDATE \`orders\` SET \`paymentMethod\` = 'stripe' WHERE \`paymentMethod\` = 'credit_card'
    `);
    console.log(`Updated ${updateResult.affectedRows} rows`);

    // Step 3: Remove credit_card from enum
    console.log('Removing credit_card from enum...');
    await connection.execute(`
      ALTER TABLE \`orders\` 
      MODIFY COLUMN \`paymentMethod\` ENUM('stripe', 'bank_transfer', 'cash') 
      DEFAULT 'stripe' NOT NULL
    `);

    // Verify changes
    console.log('Verifying changes...');
    const [newEnum] = await connection.execute(`
      SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'paymentMethod'
    `);
    console.log('New enum:', newEnum[0]?.COLUMN_TYPE);

    console.log('✅ Migration completed successfully!');

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

updatePaymentMethodEnum();