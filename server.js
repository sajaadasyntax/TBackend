const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./config/database');
const logger = require('./config/logger');
const { requestLogger, detailedRequestLogger } = require('./middleware/requestLogger');
const models = require('./models');

// Load env variables
dotenv.config();

// Create Express app
const app = express();

// Configure CORS for Expo Go access
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:19006',  // Expo web
      'http://localhost:19002',  // Expo devtools
      'exp://127.0.0.1:19000',   // Expo Go local
      'exp://192.168.1.1:19000', // Example LAN IP, use your actual IP
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Logging middleware
app.use(requestLogger);
app.use(detailedRequestLogger);

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

// Sync database models
sequelize.sync({ alter: true })
  .then(() => {
    logger.info('Database synchronized successfully');
    console.log('Database synchronized');
  })
  .catch(err => {
    logger.error('Database sync error', { error: err.message, stack: err.stack });
    console.error('Database sync error:', err);
  });

// Server - Listen on all available network interfaces for Expo Go access
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started successfully', { port: PORT });
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API from Expo Go at http://YOUR_LOCAL_IP:${PORT}`);
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