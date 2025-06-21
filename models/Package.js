const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  childPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  departureAirport: {
    type: DataTypes.STRING(3),
    allowNull: true,
    validate: {
      len: [3, 3]
    }
  },
  arrivalAirport: {
    type: DataTypes.STRING(3),
    allowNull: true,
    validate: {
      len: [3, 3]
    }
  },
  transitAirport: {
    type: DataTypes.STRING(3),
    allowNull: true,
    validate: {
      len: [3, 3]
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  departureDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  inclusions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  exclusions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  itinerary: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  hotelName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hotelRating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    },
    defaultValue: 3
  },
  mealPlan: {
    type: DataTypes.ENUM('Breakfast', 'Half Board', 'Full Board', 'All Inclusive'),
    defaultValue: 'Breakfast'
  },
  transportation: {
    type: DataTypes.ENUM('Flight', 'Bus', 'Train', 'Private Car'),
    defaultValue: 'Flight'
  },
  images: {
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
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Saudi Arabia'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'soldout'),
    defaultValue: 'active'
  },
  includesPassportAssistance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'includes_passport_assistance'
  },
  includesVisaAssistance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'includes_visa_assistance'
  },
  passportAssistanceFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'passport_assistance_fee'
  },
  visaAssistanceFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'visa_assistance_fee'
  }
}, {
  tableName: 'packages',
  indexes: [
    {
      fields: ['companyId', 'status']
    },
    {
      fields: ['departureDate']
    },
    {
      fields: ['price']
    },
    {
      fields: ['departureAirport']
    },
    {
      fields: ['arrivalAirport']
    },
    {
      fields: ['transitAirport']
    }
  ]
});

module.exports = Package;