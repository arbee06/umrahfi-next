require('dotenv').config({ path: '.env.local' });
const { syncDatabase, User } = require('../models');

async function setupDatabase() {
  try {
    console.log('Starting database synchronization...');
    
    // Sync database (creates tables if they don't exist)
    await syncDatabase(false); // Set to true to force recreate tables
    
    console.log('Database synchronized successfully!');
    
    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { email: 'admin@umrahfi.com' } });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@umrahfi.com',
        password: 'admin123456',
        role: 'admin',
        isActive: true
      });
      console.log('Default admin user created: admin@umrahfi.com / admin123456');
    } else {
      console.log('Admin user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();