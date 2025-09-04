const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  remaining: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  priceSdg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  priceUsd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
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
  // Instance methods
  instanceMethods: {
    // Calculate current value in SDG based on today's exchange rate
    getCurrentValueSdg(currentExchangeRate) {
      return this.priceUsd * currentExchangeRate * this.remaining;
    },

    // Withdraw a specific quantity
    withdraw(quantity, currentExchangeRate) {
      if (quantity > this.remaining) {
        throw new Error(`Cannot withdraw ${quantity} units. Only ${this.remaining} remaining.`);
      }
      
      const withdrawnQuantity = quantity;
      const originalPriceSdg = this.priceSdg * withdrawnQuantity;
      const currentPriceSdg = this.priceUsd * currentExchangeRate * withdrawnQuantity;
      
      this.remaining -= withdrawnQuantity;
      
      return {
        product: this,
        withdrawnQuantity,
        originalPriceSdg,
        currentPriceSdg,
        priceDifference: currentPriceSdg - originalPriceSdg,
        exchangeRateAtPurchase: this.exchangeRate,
        currentExchangeRate
      };
    }
  }
});

module.exports = Product;
