# ThreadFlowPro Deployment Quickstart

This quickstart guide provides the essential steps to deploy ThreadFlowPro to production. For more detailed instructions, refer to the comprehensive `DEPLOYMENT_GUIDE.md`.

## 1. Local Preparation

1. **Prepare environment file**:
   ```bash
   cp production.env.sample .env.production
   # Edit .env.production with your production values
   ```

2. **Update configuration files**:
   - Edit `ecosystem.config.js` with your server details
   - Edit `nginx.conf` with your domain name

3. **Build application**:
   ```bash
   npm ci
   npm run build:prod
   ```

## 2. Server Setup

1. **Basic server setup**:
   ```bash
   # Connect to your server
   ssh username@your-server-ip
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install required software
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Install Node.js and PM2**:
   ```bash
   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 globally
   sudo npm install -g pm2
   ```

3. **Configure SSL**:
   ```bash
   # Set up basic Nginx config
   sudo nano /etc/nginx/sites-available/threadflowpro
   # Add basic server block
   
   # Enable site and get SSL certificate
   sudo ln -s /etc/nginx/sites-available/threadflowpro /etc/nginx/sites-enabled/
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## 3. Choose Deployment Method

### Option 1: Manual Deployment

```bash
# Create directory and clone repository
mkdir -p /var/www
cd /var/www
git clone https://github.com/yourusername/ThreadFlowPro.git
cd ThreadFlowPro

# Install dependencies and build
npm ci
npm run build:prod

# Upload your .env.production file to the server
# Then start the application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Option 2: PM2 Deploy

```bash
# On your local machine
# Make sure your ecosystem.config.js is configured correctly
pm2 deploy ecosystem.config.js production setup
pm2 deploy ecosystem.config.js production
```

### Option 3: Docker Deployment

```bash
# Install Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Copy project files and start containers
# Upload docker-compose.yml, Dockerfile, and .env.production to server
sudo docker-compose up -d
```

## 4. Final Configuration

1. **Update Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/threadflowpro
   # Replace with contents from nginx.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Database setup**:
   ```bash
   # For local database
   sudo -u postgres psql
   # Create database and user
   
   # Run migrations
   NODE_ENV=production npm run db:push
   ```

## 5. Verify Deployment

1. **Check application status**:
   ```bash
   pm2 status
   pm2 logs threadflowpro
   ```

2. **Test website functionality**:
   - Open your domain in a browser
   - Test authentication flows
   - Test core functionality
   - Test payment processing

## 6. Maintenance Commands

```bash
# View logs
pm2 logs threadflowpro

# Monitor application
pm2 monit

# Restart application
pm2 restart threadflowpro

# Update application
pm2 deploy ecosystem.config.js production

# Database backup
npm run db:backup
```

## 7. Security Checklist

- [ ] Configure firewall (`sudo ufw enable`)
- [ ] Set up automatic updates
- [ ] Install and configure fail2ban
- [ ] Set up database backups
- [ ] Enable log rotation
- [ ] Update SSL settings

For more detailed instructions and troubleshooting, refer to the comprehensive `DEPLOYMENT_GUIDE.md` and `PRODUCTION_TESTING.md` documents. 