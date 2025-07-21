const sequelize = require('../lib/database');
const User = require('./User');
const Package = require('./Package');
const Order = require('./Order');
const Passport = require('./Passport');
const Visa = require('./Visa');
const PackageTemplate = require('./PackageTemplate');
const CompanyDocument = require('./CompanyDocument');
const Subscription = require('./Subscription');

// Define associations
User.hasMany(Package, { 
  foreignKey: 'companyId', 
  as: 'packages',
  onDelete: 'CASCADE'
});
Package.belongsTo(User, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

User.hasMany(Order, { 
  foreignKey: 'customerId', 
  as: 'customerOrders',
  onDelete: 'CASCADE'
});
Order.belongsTo(User, { 
  foreignKey: 'customerId', 
  as: 'customer' 
});

User.hasMany(Order, { 
  foreignKey: 'companyId', 
  as: 'companyOrders',
  onDelete: 'CASCADE'
});
Order.belongsTo(User, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

Package.hasMany(Order, { 
  foreignKey: 'packageId', 
  as: 'orders',
  onDelete: 'CASCADE'
});
Order.belongsTo(Package, { 
  foreignKey: 'packageId', 
  as: 'package' 
});

Order.hasMany(Passport, { 
  foreignKey: 'orderId', 
  as: 'passports',
  onDelete: 'CASCADE'
});
Passport.belongsTo(Order, { 
  foreignKey: 'orderId', 
  as: 'order' 
});

Order.hasMany(Visa, { 
  foreignKey: 'orderId', 
  as: 'visas',
  onDelete: 'CASCADE'
});
Visa.belongsTo(Order, { 
  foreignKey: 'orderId', 
  as: 'order' 
});

User.hasMany(PackageTemplate, { 
  foreignKey: 'companyId', 
  as: 'packageTemplates',
  onDelete: 'CASCADE'
});
PackageTemplate.belongsTo(User, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

User.hasMany(CompanyDocument, { 
  foreignKey: 'userId', 
  as: 'documents',
  onDelete: 'CASCADE'
});
CompanyDocument.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

User.hasMany(Subscription, { 
  foreignKey: 'companyId', 
  as: 'subscriptions',
  onDelete: 'CASCADE'
});
Subscription.belongsTo(User, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

// Function to sync database
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database synchronization failed:', error);
  }
}

module.exports = {
  sequelize,
  User,
  Package,
  Order,
  Passport,
  Visa,
  PackageTemplate,
  CompanyDocument,
  Subscription,
  syncDatabase
};