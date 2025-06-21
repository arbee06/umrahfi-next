const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const Visa = sequelize.define('Visa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  passengerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'passenger_name'
  },
  visaType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'visa_type'
  },
  visaNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'visa_number'
  },
  issuingCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'issuing_country'
  },
  issuingAuthority: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'issuing_authority'
  },
  dateOfIssue: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_issue'
  },
  dateOfExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_expiry'
  },
  validFrom: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'valid_from'
  },
  validUntil: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'valid_until'
  },
  numberOfEntries: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'number_of_entries'
  },
  durationOfStay: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'duration_of_stay'
  },
  purpose: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  placeOfIssue: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'place_of_issue'
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'additional_info'
  },
  fileHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'file_hash'
  },
  imagePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_path'
  }
}, {
  tableName: 'visas',
  timestamps: true,
  underscored: true
});

module.exports = Visa;