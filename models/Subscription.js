const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Company user ID'
  },
  planId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Subscription plan identifier'
  },
  planName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Human readable plan name'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'expired', 'trial'),
    defaultValue: 'trial',
    comment: 'Current subscription status'
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly',
    comment: 'Billing frequency'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Subscription price per billing cycle'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    comment: 'Currency code'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Subscription start date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Subscription end date'
  },
  trialEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Trial period end date'
  },
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Next billing date'
  },
  // Plan limits
  maxPackages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Maximum number of packages allowed'
  },
  maxBookingsPerMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Maximum bookings per month'
  },
  maxPhotosPerPackage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Maximum photos per package'
  },
  prioritySupport: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether priority support is included'
  },
  featuredListings: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether featured listings are included'
  },
  analyticsAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether analytics access is included'
  },
  // Payment tracking
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Stripe subscription ID if using Stripe'
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Stripe customer ID if using Stripe'
  },
  lastPaymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last successful payment date'
  },
  lastPaymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Last payment amount'
  },
  failedPaymentAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of failed payment attempts'
  },
  // Admin fields
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes about the subscription'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin who created/modified the subscription'
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin who last modified the subscription'
  },
  // Cancellation tracking
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when subscription was cancelled'
  },
  cancelledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Who cancelled the subscription'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for cancellation'
  }
}, {
  tableName: 'subscriptions',
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['planId']
    },
    {
      fields: ['endDate']
    },
    {
      fields: ['nextBillingDate']
    }
  ]
});

module.exports = Subscription;