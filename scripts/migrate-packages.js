// Migration script to update packages table for multiple airports and hotels
const sequelize = require('../lib/database');

async function migratePackages() {
  try {
    console.log('🚀 Starting packages migration...');
    
    // Add new JSON columns for multiple airports and hotels
    console.log('📦 Adding new columns...');
    await sequelize.query(`
      ALTER TABLE packages 
      ADD COLUMN departureAirports JSON,
      ADD COLUMN arrivalAirports JSON,
      ADD COLUMN makkahHotels JSON,
      ADD COLUMN madinahHotels JSON
    `);
    console.log('✅ New columns added successfully!');

    // Initialize all new columns with empty JSON arrays
    console.log('🔧 Initializing columns with empty arrays...');
    await sequelize.query(`
      UPDATE packages 
      SET departureAirports = JSON_ARRAY(),
          arrivalAirports = JSON_ARRAY(),
          makkahHotels = JSON_ARRAY(),
          madinahHotels = JSON_ARRAY()
    `);

    // Migrate existing data from old single fields to new JSON arrays
    console.log('🔄 Migrating departure airports...');
    await sequelize.query(`
      UPDATE packages 
      SET departureAirports = CASE 
          WHEN departureAirport IS NOT NULL AND departureAirport != '' 
          THEN JSON_ARRAY(departureAirport) 
          ELSE JSON_ARRAY() 
      END
    `);

    console.log('🔄 Migrating arrival airports...');
    await sequelize.query(`
      UPDATE packages 
      SET arrivalAirports = CASE 
          WHEN arrivalAirport IS NOT NULL AND arrivalAirport != '' 
          THEN JSON_ARRAY(arrivalAirport) 
          ELSE JSON_ARRAY() 
      END
    `);

    console.log('🔄 Migrating Makkah hotels...');
    await sequelize.query(`
      UPDATE packages 
      SET makkahHotels = CASE 
          WHEN hotelName IS NOT NULL AND hotelName != '' 
          THEN JSON_ARRAY(JSON_OBJECT('name', hotelName, 'rating', COALESCE(hotelRating, 3))) 
          ELSE JSON_ARRAY() 
      END
    `);

    console.log('🔄 Setting default Madinah hotels...');
    await sequelize.query(`
      UPDATE packages 
      SET madinahHotels = JSON_ARRAY(JSON_OBJECT('name', 'Standard Madinah Hotel', 'rating', 3))
      WHERE makkahHotels != JSON_ARRAY()
    `);

    console.log('🗑️ Dropping old columns...');
    await sequelize.query(`
      ALTER TABLE packages 
      DROP COLUMN departureAirport,
      DROP COLUMN arrivalAirport,
      DROP COLUMN transitAirport,
      DROP COLUMN hotelName,
      DROP COLUMN hotelRating
    `);

    console.log('🗑️ Dropping old indexes...');
    try {
      await sequelize.query(`DROP INDEX idx_packages_departureAirport ON packages`);
    } catch (e) { /* Index might not exist */ }
    try {
      await sequelize.query(`DROP INDEX idx_packages_arrivalAirport ON packages`);
    } catch (e) { /* Index might not exist */ }
    try {
      await sequelize.query(`DROP INDEX idx_packages_transitAirport ON packages`);
    } catch (e) { /* Index might not exist */ }

    console.log('🎉 Packages migration completed successfully!');
    console.log('✨ Your packages now support multiple airports and hotels!');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Migration already applied - columns exist!');
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('Full error:', error);
    }
  } finally {
    process.exit(0);
  }
}

migratePackages();