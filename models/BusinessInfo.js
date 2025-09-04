const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BusinessInfo = sequelize.define('BusinessInfo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  additionalInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
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
  timestamps: true
});

module.exports = BusinessInfo;
