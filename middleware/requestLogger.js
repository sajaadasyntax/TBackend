const morgan = require('morgan');
const logger = require('../config/logger');

// Custom token for request body (for non-GET requests)
morgan.token('body', (req) => {
  if (req.method !== 'GET' && req.body) {
    // Mask sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) {
      sanitizedBody.password = '[REDACTED]';
    }
    if (sanitizedBody.verificationCode) {
      sanitizedBody.verificationCode = '[REDACTED]';
    }
    return JSON.stringify(sanitizedBody);
  }
  return '';
});

// Custom token for response time
morgan.token('response-time-ms', (req, res) => {
  if (!res._header || !req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom format for detailed logging
const detailedFormat = ':method :url :status :response-time-ms ms - :body';

// Create morgan middleware
const requestLogger = morgan(detailedFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging for health checks or static files
    return req.url === '/health' || req.url.startsWith('/static');
  }
});

// Additional middleware to log request details
const detailedRequestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger, detailedRequestLogger };
