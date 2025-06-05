# ThreadFlowPro Production Deployment Guide

This guide will walk you through the process of deploying ThreadFlowPro to a production server. Follow these steps carefully to ensure a successful deployment.

## 1. Prerequisites

Before beginning the deployment process, ensure you have:

- A Linux server (Ubuntu 20.04 LTS or newer recommended)
- Domain name pointed to your server
- SSH access to your server
- Git installed on your server
- Node.js 18.x or newer installed on your server
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed on your server
- PostgreSQL database (either on the same server or a managed service)

## 2. Local Preparation

### 2.1 Environment Setup

1. Create your production environment file:
   ```bash
   cp production.env.sample .env.production
   ```

2. Edit `.env.production` with your actual production values:
   - Update all API keys, secrets, and configuration values
   - Set `BASE_URL` to your actual domain name
   - Configure your database connection strings
   - Set proper thread limits and pricing for your plans

### 2.2 Update Configuration Files

1. Update `ecosystem.config.js` with your server details:
   - Set the correct `user` for your server
   - Update `host` with your server's hostname or IP
   - Change `repo` to your actual Git repository URL
   - Adjust `path` to where you want to deploy on your server

2. Update `nginx.conf` with your domain information:
   - Replace `yourdomain.com` with your actual domain
   - Adjust paths if needed

### 2.3 Build and Test Locally

1. Run a production build locally to ensure everything compiles:
   ```bash
   npm run build:prod
   ```

2. Test the production build locally:
   ```bash
   NODE_ENV=production node dist/index.js
   ```

3. Fix any issues before proceeding to deployment.

## 3. Server Setup

### 3.1 Initial Server Configuration

1. Connect to your server via SSH:
   ```bash
   ssh username@your-server-ip
   ```

2. Update the system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. Install required dependencies if not already installed:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

### 3.2 Database Setup

If using a local PostgreSQL database:

1. Install PostgreSQL:
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   ```

2. Create a database and user:
   ```bash
   sudo -u postgres psql
   ```

3. In the PostgreSQL prompt:
   ```sql
   CREATE DATABASE threadflowpro_production;
   CREATE USER threadflowpro WITH ENCRYPTED PASSWORD 'your_strong_password';
   GRANT ALL PRIVILEGES ON DATABASE threadflowpro_production TO threadflowpro;
   \q
   ```

4. Update your `.env.production` file with these database credentials.

### 3.3 SSL Certificate

1. Configure Nginx for your domain:
   ```bash
   sudo nano /etc/nginx/sites-available/threadflowpro
   ```

2. Add a basic server block (we'll replace this later):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       root /var/www/ThreadFlowPro/public;
       
       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/threadflowpro /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## 4. Deployment Methods

You have three deployment options:

### 4.1 Manual Deployment

1. Clone your repository:
   ```bash
   mkdir -p /var/www
   cd /var/www
   git clone https://github.com/yourusername/ThreadFlowPro.git
   cd ThreadFlowPro
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Copy your `.env.production` file to the server.

4. Build the application:
   ```bash
   npm run build:prod
   ```

5. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

6. Save the PM2 process list:
   ```bash
   pm2 save
   ```

7. Set PM2 to start on boot:
   ```bash
   pm2 startup
   ```

### 4.2 Automated Deployment with PM2 Deploy

1. Set up SSH keys for passwordless login from your development machine to the server.

2. Initialize the deployment setup:
   ```bash
   pm2 deploy ecosystem.config.js production setup
   ```

3. Deploy your application:
   ```bash
   pm2 deploy ecosystem.config.js production
   ```

### 4.3 Docker Deployment

1. Install Docker and Docker Compose on your server:
   ```bash
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

2. Copy your project files, including `docker-compose.yml`, `Dockerfile`, and `.env.production` to the server.

3. Start the containers:
   ```bash
   sudo docker-compose up -d
   ```

## 5. Nginx Configuration

1. Replace the Nginx configuration with your full configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/threadflowpro
   ```

2. Copy the contents of your updated `nginx.conf` file, replacing domain names and paths as needed.

3. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 6. Database Migration

1. Run database migrations:
   ```bash
   cd /var/www/ThreadFlowPro
   NODE_ENV=production npm run db:push
   ```

2. If you have a database backup, restore it:
   ```bash
   psql -U postgres threadflowpro_production < supabase_backup.sql
   ```

## 7. Monitoring and Maintenance

### 7.1 PM2 Monitoring

1. View application logs:
   ```bash
   pm2 logs threadflowpro
   ```

2. Monitor application performance:
   ```bash
   pm2 monit
   ```

3. Check status:
   ```bash
   pm2 status
   ```

### 7.2 Regular Maintenance

1. Set up a database backup cron job:
   ```bash
   crontab -e
   ```

2. Add the following line to run a daily backup at 2 AM:
   ```
   0 2 * * * cd /var/www/ThreadFlowPro && npm run db:backup
   ```

3. Set up log rotation for your application logs.

### 7.3 Updates and Rollbacks

1. To update your application:
   ```bash
   pm2 deploy ecosystem.config.js production
   ```

2. To rollback to a previous version:
   ```bash
   pm2 deploy ecosystem.config.js production revert 1
   ```

## 8. Security Considerations

1. Set up a firewall:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

2. Configure fail2ban to protect against brute force attacks:
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. Regularly update your system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. Set up regular security audits.

## 9. Troubleshooting

### Common Issues and Solutions

1. **Application doesn't start:**
   - Check logs: `pm2 logs threadflowpro`
   - Verify environment variables are correct
   - Ensure the build process completed successfully

2. **Cannot connect to database:**
   - Check database credentials in `.env.production`
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check network connectivity and firewall rules

3. **Nginx returns 502 Bad Gateway:**
   - Ensure your application is running: `pm2 status`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify the proxy_pass port matches your application port

4. **SSL certificate issues:**
   - Renew certificate: `sudo certbot renew`
   - Check certificate expiration: `sudo certbot certificates`

### Getting Help

If you encounter issues not covered in this guide, refer to:

- The project's documentation and README
- PM2 documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx documentation: https://nginx.org/en/docs/
- Node.js documentation: https://nodejs.org/en/docs/

## 10. Final Checklist

Before considering your deployment complete, verify:

- [ ] Application runs in production mode
- [ ] SSL is properly configured
- [ ] Database connections work correctly
- [ ] All API endpoints are accessible
- [ ] Authentication system works
- [ ] Payment system functions properly
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] Security measures are in place

Congratulations! Your ThreadFlowPro application should now be deployed and running in production. 