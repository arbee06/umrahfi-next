// Migration script to create reviews table
const sequelize = require('../lib/database');

async function migrateReviews() {
  try {
    console.log('🚀 Starting reviews table migration...');
    
    // Create reviews table
    console.log('📦 Creating reviews table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId INT NOT NULL,
        packageId INT NOT NULL,
        companyId INT NOT NULL,
        customerId INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        serviceRating INT NOT NULL CHECK (serviceRating >= 1 AND serviceRating <= 5),
        accommodationRating INT NOT NULL CHECK (accommodationRating >= 1 AND accommodationRating <= 5),
        transportRating INT NOT NULL CHECK (transportRating >= 1 AND transportRating <= 5),
        valueRating INT NOT NULL CHECK (valueRating >= 1 AND valueRating <= 5),
        photos JSON DEFAULT ('[]'),
        helpful INT DEFAULT 0,
        response TEXT,
        responseDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
        FOREIGN KEY (companyId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_package_reviews (packageId),
        INDEX idx_company_reviews (companyId),
        INDEX idx_customer_reviews (customerId),
        INDEX idx_order_review (orderId),
        UNIQUE KEY unique_order_review (orderId)
      );
    `);
    console.log('✅ Reviews table created successfully!');

    console.log('🎉 Reviews migration completed successfully!');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Reviews table already exists!');
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('Full error:', error);
    }
  } finally {
    process.exit(0);
  }
}

migrateReviews();