const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const Passport = sequelize.define('Passport', {
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
  passportType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'passport_type'
  },
  countryCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'country_code'
  },
  passportNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'passport_number'
  },
  surname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  givenNames: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'given_names'
  },
  nationality: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth'
  },
  placeOfBirth: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'place_of_birth'
  },
  sex: {
    type: DataTypes.STRING(10),
    allowNull: true
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
  issuingAuthority: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'issuing_authority'
  },
  personalNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'personal_number'
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'additional_info'
  },
  mrzLine1: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mrz_line1'
  },
  mrzLine2: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mrz_line2'
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
  tableName: 'passports',
  timestamps: true,
  underscored: true
});

module.exports = Passport;