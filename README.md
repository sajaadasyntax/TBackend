# PharmaRate Backend API

This is the backend API for the PharmaRate application.

## Environment Setup

### Development Environment

To set up the development environment:

1. Install dependencies:
```
npm install
```

2. Create a `.env` file based on `.env.example` and configure your database connection.

3. Run in development mode:
```
npm run dev
```

### Production Environment

To deploy in production:

1. Set environment to production:
```
export NODE_ENV=production
```

2. Install production dependencies only:
```
npm ci --only=production
```

3. Option 1: Direct startup:
```
npm start
```

4. Option 2 (Recommended): Using PM2 for process management:
```
# Install PM2 globally
npm install -g pm2

# Start using the ecosystem config
pm2 start ecosystem.config.js

# Other useful PM2 commands:
# pm2 status
# pm2 logs pharmarate-api
# pm2 monit
# pm2 restart pharmarate-api
```

## API Endpoints

The API provides the following endpoints:

- `/api/auth` - Authentication
- `/api/products` - Product management
- `/api/exchange-rates` - Exchange rates
- `/api/customers` - Customer management
- `/api/invoices` - Invoice management
- `/api/business-info` - Business information
- `/api/settings` - Settings management

## Environment Variables

Configuration is managed through environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `LOG_LEVEL` - Logging level (error, warn, info, verbose, debug)

## Production Considerations

- In production, automatic database schema alterations are disabled for safety
- Logging is less verbose in production for performance
- CORS is configured to allow requests from any origin
- Error handling is more robust in production

## Deployment Helpers

- `deploy.js` - Deployment script for easier setup
- `ecosystem.config.js` - PM2 configuration for production deployment
