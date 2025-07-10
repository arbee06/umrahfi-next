const sequelize = require('../lib/database');

async function fixJsonColumn() {
  try {
    console.log('Fixing preferredPaymentMethods JSON column...');

    // Check if column exists
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM users`);
    const columnNames = columns.map(col => col.Field);

    if (!columnNames.includes('preferredPaymentMethods')) {
      // Add the JSON column without default value
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN preferredPaymentMethods JSON COMMENT 'Array of preferred payment methods: stripe, bank_transfer, cash'
      `);
      console.log('✅ Added preferredPaymentMethods column');
    } else {
      console.log('ℹ️  preferredPaymentMethods column already exists');
    }

    // Update all company users to have default payment methods
    const [results] = await sequelize.query(`
      UPDATE users 
      SET preferredPaymentMethods = '["stripe", "bank_transfer"]'
      WHERE role = 'company' AND (
        preferredPaymentMethods IS NULL OR 
        preferredPaymentMethods = '' OR 
        JSON_LENGTH(COALESCE(preferredPaymentMethods, '[]')) = 0
      )
    `);

    console.log(`Updated ${results.affectedRows} company records with default payment methods.`);

    // Verify the fix
    const [companyUsers] = await sequelize.query(`
      SELECT id, companyName, preferredPaymentMethods 
      FROM users 
      WHERE role = 'company' 
      LIMIT 3
    `);

    console.log('\nSample company payment configurations:');
    companyUsers.forEach(user => {
      console.log(`- ${user.companyName || user.id}: ${user.preferredPaymentMethods}`);
    });

    console.log('\n✅ JSON column fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing JSON column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixJsonColumn();