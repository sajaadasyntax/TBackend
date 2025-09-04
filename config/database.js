const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

// Create a new Sequelize instance with NeonDB connection string
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: (msg) => logger.debug('Database query:', { query: msg })
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connection to NeonDB has been established successfully.');
    console.log('Connection to NeonDB has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to NeonDB:', { error: error.message, stack: error.stack });
    console.error('Unable to connect to NeonDB:', error);
  }
};

// Export the database connection
module.exports = { sequelize, testConnection };
