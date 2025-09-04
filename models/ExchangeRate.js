const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExchangeRate = sequelize.define('ExchangeRate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  // Class methods
  classMethods: {
    // Create an exchange rate for today
    createForToday(rate, userId) {
      return ExchangeRate.create({
        rate,
        date: new Date(),
        userId
      });
    }
  },
  // Instance methods
  instanceMethods: {
    // Convert SDG to USD
    convertSdgToUsd(amountSdg) {
      return amountSdg / this.rate;
    },

    // Convert USD to SDG
    convertUsdToSdg(amountUsd) {
      return amountUsd * this.rate;
    },

    // Format the date as YYYY-MM-DD
    getFormattedDate() {
      return this.date.toISOString().split('T')[0];
    }
  }
});

module.exports = ExchangeRate;
