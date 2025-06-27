const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
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
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  numberOfTravelers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  numberOfAdults: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  numberOfChildren: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  travelers: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partial', 'completed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('stripe', 'bank_transfer', 'cash'),
    defaultValue: 'stripe',
    allowNull: false
  },
  paymentReceiptPath: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  paymentReceiptOriginalName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  paymentNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentVerifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: false,
  hooks: {
    beforeCreate: (order) => {
      if (!order.orderNumber) {
        order.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      }
    }
  },
  indexes: [
    {
      fields: ['customerId', 'status']
    },
    {
      fields: ['companyId', 'status']
    },
    {
      fields: ['orderNumber']
    },
    {
      fields: ['paymentMethod']
    },
    {
      fields: ['paymentVerified']
    }
  ]
});

module.exports = Order;