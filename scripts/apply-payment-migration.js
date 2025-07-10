const sequelize = require('../lib/database');

async function applyPaymentMigration() {
  try {
    console.log('Applying payment configuration migration...');

    // Check existing columns first
    const [existingColumns] = await sequelize.query(`SHOW COLUMNS FROM users`);
    const columnNames = existingColumns.map(col => col.Field);

    const columnsToAdd = [
      {
        name: 'preferredPaymentMethods',
        sql: `ADD COLUMN preferredPaymentMethods JSON COMMENT 'Array of preferred payment methods: stripe, bank_transfer, cash'`
      },
      {
        name: 'stripePublishableKey',
        sql: `ADD COLUMN stripePublishableKey VARCHAR(500) DEFAULT NULL COMMENT 'Company Stripe publishable key'`
      },
      {
        name: 'stripeSecretKey',
        sql: `ADD COLUMN stripeSecretKey VARCHAR(500) DEFAULT NULL COMMENT 'Company Stripe secret key (encrypted)'`
      },
      {
        name: 'stripeWebhookSecret',
        sql: `ADD COLUMN stripeWebhookSecret VARCHAR(500) DEFAULT NULL COMMENT 'Company Stripe webhook endpoint secret'`
      },
      {
        name: 'paymentProcessingFee',
        sql: `ADD COLUMN paymentProcessingFee DECIMAL(5,2) DEFAULT 2.90 COMMENT 'Payment processing fee percentage'`
      },
      {
        name: 'acceptCashPayments',
        sql: `ADD COLUMN acceptCashPayments BOOLEAN DEFAULT TRUE COMMENT 'Whether company accepts cash payments'`
      },
      {
        name: 'acceptBankTransfers',
        sql: `ADD COLUMN acceptBankTransfers BOOLEAN DEFAULT TRUE COMMENT 'Whether company accepts bank transfers'`
      }
    ];

    // Add columns one by one, only if they don't exist
    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.name)) {
        try {
          await sequelize.query(`ALTER TABLE users ${column.sql}`);
          console.log(`✅ Added column: ${column.name}`);
        } catch (error) {
          console.log(`⚠️  Column ${column.name} might already exist or error occurred:`, error.message);
        }
      } else {
        console.log(`ℹ️  Column ${column.name} already exists, skipping...`);
      }
    }

    console.log('Migration columns added successfully.');

    // Update existing companies with default payment settings
    // First check if preferredPaymentMethods column exists
    const [updatedColumns] = await sequelize.query(`SHOW COLUMNS FROM users`);
    const updatedColumnNames = updatedColumns.map(col => col.Field);
    
    if (updatedColumnNames.includes('preferredPaymentMethods')) {
      const [results] = await sequelize.query(`
        UPDATE users 
        SET 
          preferredPaymentMethods = '["stripe", "bank_transfer"]',
          paymentProcessingFee = 2.90,
          acceptCashPayments = TRUE,
          acceptBankTransfers = TRUE
        WHERE role = 'company' AND (preferredPaymentMethods IS NULL OR preferredPaymentMethods = '' OR JSON_LENGTH(preferredPaymentMethods) = 0)
      `);
      console.log(`Updated ${results.affectedRows} company records with default payment settings.`);
    } else {
      // If preferredPaymentMethods doesn't exist, update other fields only
      const [results] = await sequelize.query(`
        UPDATE users 
        SET 
          paymentProcessingFee = 2.90,
          acceptCashPayments = TRUE,
          acceptBankTransfers = TRUE
        WHERE role = 'company'
      `);
      console.log(`Updated ${results.affectedRows} company records with default payment settings (excluding preferredPaymentMethods).`);
    }

    // Verify the migration
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM users`);
    const paymentColumns = columns.filter(col => 
      ['preferredPaymentMethods', 'stripePublishableKey', 'stripeSecretKey', 
       'stripeWebhookSecret', 'paymentProcessingFee', 'acceptCashPayments', 
       'acceptBankTransfers'].includes(col.Field)
    );

    console.log('Payment configuration columns:');
    paymentColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('✅ Payment configuration migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
applyPaymentMigration();