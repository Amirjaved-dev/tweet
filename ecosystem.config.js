module.exports = {
  apps: [
    {
      name: 'threadflowpro',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
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
      'post-setup': 'mkdir -p logs'
    }
  }
}; 