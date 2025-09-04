const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Invoices',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  priceUsd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  originalPriceSdg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currentPriceSdg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  exchangeRateAtPurchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currentExchangeRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = InvoiceItem;
