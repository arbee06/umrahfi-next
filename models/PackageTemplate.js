const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const PackageTemplate = sequelize.define('PackageTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('inclusions', 'exclusions'),
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'package_templates',
  indexes: [
    {
      fields: ['companyId', 'type']
    },
    {
      fields: ['isDefault']
    }
  ]
});

module.exports = PackageTemplate;