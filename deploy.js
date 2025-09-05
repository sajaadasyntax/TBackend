/**
 * Deployment script for PharmaRate backend
 * Run with: node deploy.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting PharmaRate backend deployment process...');

// Check for production environment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

console.log(`📊 Environment: ${process.env.NODE_ENV}`);

// Ensure we have a .env file for production
try {
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    console.log('⚠️ No .env file found, checking for .env.production template...');
    
    if (fs.existsSync(path.join(__dirname, '.env.production'))) {
      console.log('📝 Using .env.production as template...');
      fs.copyFileSync(
        path.join(__dirname, '.env.production'),
        path.join(__dirname, '.env')
      );
      console.log('✅ Created .env file from production template');
    } else {
      console.error('❌ No .env or .env.production file found! Deployment may fail.');
    }
  } else {
    console.log('✅ .env file found');
  }
} catch (err) {
  console.error('❌ Error checking environment files:', err);
}

// Install production dependencies only
try {
  console.log('📦 Installing production dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (err) {
  console.error('❌ Error installing dependencies:', err);
  process.exit(1);
}

// Start the server
try {
  console.log('🚀 Starting server...');
  
  // For actual deployment, you would likely use:
  // pm2 start server.js --name "pharmarate-api"
  // For now, just demonstrate the command:
  console.log('To start with PM2 (recommended for production): pm2 start server.js --name "pharmarate-api"');
  console.log('Starting directly with Node...');
  
  // For test purposes, just start with node
  execSync('NODE_ENV=production node server.js', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Error starting server:', err);
}
