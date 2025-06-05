module.exports = {
  apps: [
    {
      name: 'threadflowpro',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env_file: './.env.production'
    }
  ],
  deploy: {
    production: {
      user: 'your-server-username',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/ThreadFlowPro.git',
      path: '/var/www/ThreadFlowPro',
      'post-deploy': 'npm ci && npm run build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'echo "This will run before setting up the repo"',
      'post-setup': 'mkdir -p logs'
    }
  }
}; 