const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./config/database');
const logger = require('./config/logger');
const { requestLogger, detailedRequestLogger } = require('./middleware/requestLogger');
const models = require('./models');

// Load env variables
dotenv.config();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Starting server in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Create Express app
const app = express();

// CORS configuration - Allow all origins and requests
const corsOptions = {
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Additional CORS handling for pre-flight requests
app.options('*', cors(corsOptions));

// Apply different middleware based on environment
if (isProduction) {
  // Production middleware - minimal logging for performance
  app.use((req, res, next) => {
    // Set CORS headers with no verbose logging
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    next();
  });
  
  // Use basic request logging in production
  app.use(requestLogger);
} else {
  // Development middleware - verbose logging
  app.use((req, res, next) => {
    // Log CORS-related information
    logger.info('CORS request received', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      headers: {
        'access-control-request-headers': req.headers['access-control-request-headers'],
        'access-control-request-method': req.headers['access-control-request-method']
      }
    });
    
    // Set CORS headers again (extra safety)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    
    next();
  });
  
  // Use detailed request logging in development
  app.use(requestLogger);
  app.use(detailedRequestLogger);
}

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const exchangeRateRoutes = require('./routes/exchangeRates');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const businessInfoRoutes = require('./routes/businessInfo');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/business-info', businessInfoRoutes);
app.use('/api/settings', settingsRoutes);

// Add a simple route to check if the server is running
app.get('/', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.send('PharmaRate API is running');
});

// Test database connection
testConnection();

// Sync database models - with different behavior for production vs development
if (isProduction) {
  // In production, don't automatically alter tables - this could be dangerous
  sequelize.sync()
    .then(() => {
      logger.info('Database connected successfully in production mode');
      console.log('Database connected in PRODUCTION mode - schema changes must be done manually');
    })
    .catch(err => {
      logger.error('Database connection error in production', { error: err.message });
      console.error('PRODUCTION DATABASE ERROR:', err.message);
      process.exit(1); // Exit on database error in production
    });
} else {
  // In development, we can alter tables automatically
  sequelize.sync({ alter: true })
    .then(() => {
      logger.info('Database synchronized successfully in development mode');
      console.log('Database synchronized in DEVELOPMENT mode with automatic schema updates');
    })
    .catch(err => {
      logger.error('Database sync error in development', { error: err.message, stack: err.stack });
      console.error('Development database sync error:', err);
    });
}

// Server configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started successfully', { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  
  if (isProduction) {
    // Production startup messages - minimal
    console.log(`✅ PharmaRate API server running in PRODUCTION mode on port ${PORT}`);
  } else {
    // Development startup messages - verbose
    console.log(`🔧 PharmaRate API server running in DEVELOPMENT mode on port ${PORT}`);
    console.log(`📱 Access the API from Expo Go at http://YOUR_LOCAL_IP:${PORT}`);
    console.log(`🌐 For web access: http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});