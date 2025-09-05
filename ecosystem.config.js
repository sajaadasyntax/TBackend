/**
 * PM2 Ecosystem Configuration for PharmaRate Backend
 * 
 * To use:
 * 1. Install PM2: npm install -g pm2
 * 2. Start the application: pm2 start ecosystem.config.js
 * 3. Monitor: pm2 monit
 * 4. View logs: pm2 logs
 * 5. Restart: pm2 restart pharmarate-api
 */

module.exports = {
  apps: [{
    name: 'pharmarate-api',
    script: 'server.js',
    instances: 'max',       // Use maximum number of CPU cores
    exec_mode: 'cluster',   // Run in cluster mode for load balancing
    autorestart: true,      // Auto restart if app crashes
    watch: false,           // Don't watch for file changes in production
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Error logs
    error_file: './logs/pm2-error.log',
    // Combined logs
    out_file: './logs/pm2-out.log',
    // Merge out and error logs
    merge_logs: true,
    // Format logs as JSON for easier parsing
    log_type: 'json',
    // Add timestamp to logs
    time: true
  }]
};
