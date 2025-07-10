// models/Review.js
const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'packages',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  serviceRating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  accommodationRating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  transportRating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  valueRating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  helpful: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reviews',
  timestamps: true
});

// Define associations
Review.associate = (models) => {
  Review.belongsTo(models.User, {
    foreignKey: 'customerId',
    as: 'customer'
  });
  Review.belongsTo(models.User, {
    foreignKey: 'companyId',
    as: 'company'
  });
  Review.belongsTo(models.Package, {
    foreignKey: 'packageId',
    as: 'package'
  });
  Review.belongsTo(models.Order, {
    foreignKey: 'orderId',
    as: 'order'
  });
};

module.exports = Review;