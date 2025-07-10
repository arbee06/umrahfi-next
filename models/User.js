const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../lib/database');

const User = sequelize.define('User', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('customer', 'company', 'admin'),
    defaultValue: 'customer'
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companyLicense: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companyAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  bankName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bankAccountNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bankAccountHolderName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bankRoutingNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  bankSwiftCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  bankAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Custom validation for company fields
User.addHook('beforeValidate', (user) => {
  if (user.role === 'company') {
    if (!user.companyName || !user.companyLicense || !user.companyAddress) {
      throw new Error('Company information is required for company users');
    }
  }
});

module.exports = User;