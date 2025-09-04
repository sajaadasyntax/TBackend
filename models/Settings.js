const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    unique: true
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'en'
  },
  darkMode: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  onboardingComplete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = Settings;
