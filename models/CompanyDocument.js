const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const CompanyDocument = sequelize.define('CompanyDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  documentType: {
    type: DataTypes.ENUM('license', 'registration', 'insurance', 'other'),
    allowNull: false,
    comment: 'Type of document uploaded'
  },
  documentName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original filename or document title'
  },
  documentPath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Path to the uploaded document'
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this document is currently active'
  }
}, {
  tableName: 'company_documents',
  timestamps: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['documentType']
    }
  ]
});

module.exports = CompanyDocument;