const User = require('./User');
const Product = require('./Product');
const ExchangeRate = require('./ExchangeRate');
const Customer = require('./Customer');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const BusinessInfo = require('./BusinessInfo');
const Settings = require('./Settings');

// Define relationships

// User relationships
User.hasMany(Product, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(ExchangeRate, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Customer, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Invoice, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasOne(BusinessInfo, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasOne(Settings, { foreignKey: 'userId', onDelete: 'CASCADE' });

// Product relationships
Product.belongsTo(User, { foreignKey: 'userId' });

// ExchangeRate relationships
ExchangeRate.belongsTo(User, { foreignKey: 'userId' });

// Customer relationships
Customer.belongsTo(User, { foreignKey: 'userId' });
Customer.hasMany(Invoice, { foreignKey: 'customerId' });

// Invoice relationships
Invoice.belongsTo(User, { foreignKey: 'userId' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });

// InvoiceItem relationships
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });
InvoiceItem.belongsTo(Product, { foreignKey: 'productId' });

// BusinessInfo relationships
BusinessInfo.belongsTo(User, { foreignKey: 'userId' });

// Settings relationships
Settings.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Product,
  ExchangeRate,
  Customer,
  Invoice,
  InvoiceItem,
  BusinessInfo,
  Settings
};
