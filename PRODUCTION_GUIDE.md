# ThreadFlowPro Production Deployment Guide

This guide provides detailed instructions for deploying ThreadFlowPro to various production environments.

## Prerequisites

- Node.js 18+ installed on your production server
- Supabase project (not direct PostgreSQL)
- Domain name with SSL certificate
- Clerk and Coinbase Commerce accounts and API keys

## Deployment Options

ThreadFlowPro can be deployed using several methods:

1. **Traditional VPS/Dedicated Server**
2. **Docker Deployment**
3. **Cloud Platform Deployment**

## 1. VPS/Dedicated Server Deployment

### Server Setup

1. **Update and install dependencies**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx
```

2. **Install Node.js 18+**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2 for process management**

```bash
sudo npm install -g pm2
```

### Application Deployment

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ThreadFlowPro.git
cd ThreadFlowPro
```

2. **Install dependencies**

```bash
npm install
```

3. **Create production environment file**

```bash
cp production.env.sample .env.production
```

Edit `.env.production` with your production values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_production_clerk_publishable_key
CLERK_SECRET_KEY=your_production_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_production_clerk_webhook_secret

# Payment Processing
COINBASE_COMMERCE_API_KEY=your_production_coinbase_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_production_coinbase_webhook_secret

# Application
NODE_ENV=production
PORT=3000
```

4. **Supabase Database Setup**

Ensure your Supabase project is properly configured:
- Create a Supabase project if you haven't already at [supabase.com](https://supabase.com)
- Set up the required tables using the SQL script or Drizzle migrations
- Configure Row-Level Security (RLS) policies appropriately
- Note your Supabase URL and API keys for the environment variables

5. **Build the application**

```bash
npm run build:prod
```

6. **Configure PM2**

The project includes `ecosystem.config.js` for PM2 configuration. Review and modify it if needed:

```javascript
module.exports = {
  apps: [
    {
      name: "threadflowpro",
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

7. **Start the application with PM2**

```bash
npm run start:prod
# or directly with PM2
pm2 start ecosystem.config.js --env production
```

8. **Set up PM2 to start on system boot**

```bash
pm2 startup
pm2 save
```

### Nginx Configuration

1. **Create Nginx configuration file**

```bash
sudo nano /etc/nginx/sites-available/threadflowpro
```

2. **Add the following configuration**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. **Enable the site and restart Nginx**

```bash
sudo ln -s /etc/nginx/sites-available/threadflowpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Set up SSL with Certbot**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 2. Docker Deployment

### Prerequisite

- Docker and Docker Compose installed on your server

### Deployment Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ThreadFlowPro.git
cd ThreadFlowPro
```

2. **Create production environment file**

```bash
cp production.env.sample .env.production
```

Edit `.env.production` with your Supabase and other production values.

3. **Build and run with Docker Compose**

```bash
docker-compose -f docker-compose.yml up -d --build
```

This will:
- Build the Docker image using the Dockerfile
- Start the container in detached mode
- Map port 3000 from the container to the host

The application will be accessible at `http://your-server-ip:3000`.

### Updating the Application

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## 3. Cloud Platform Deployment

### Vercel Deployment

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Configure Supabase in Vercel**

Add your Supabase environment variables in the Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

3. **Deploy to Vercel**

```bash
vercel login
vercel
```

Follow the prompts to deploy your application. For subsequent deployments:

```bash
vercel --prod
```

### Railway Deployment

1. **Install Railway CLI**

```bash
npm install -g @railway/cli
```

2. **Configure Supabase in Railway**

Add your Supabase environment variables in the Railway dashboard before deployment.

3. **Deploy to Railway**

```bash
railway login
railway init
railway up
```

## Supabase Database Maintenance

### Database Backup

Supabase provides automated backups for paid plans. Additionally, you can:

1. Use the Supabase dashboard to create manual backups
2. Schedule regular SQL dumps using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create a backup
supabase db dump -p your-project-ref > backup-$(date +%Y%m%d%H%M%S).sql
```

You can schedule this using cron:

```bash
crontab -e
```

Add:

```
0 0 * * * cd /path/to/ThreadFlowPro && supabase db dump -p your-project-ref > backups/backup-$(date +%Y%m%d%H%M%S).sql
```

### Database Migrations

When deploying schema changes:

```bash
# Using Drizzle
npm run db:push

# Or manually apply SQL to Supabase
supabase db execute -p your-project-ref -f migrations/your-migration.sql
```

You can also use the Supabase dashboard SQL editor to apply migrations manually.

## Webhook Configuration

### Clerk Webhooks

1. Go to your Clerk dashboard
2. Navigate to Webhooks
3. Create a new webhook endpoint pointing to `https://yourdomain.com/api/webhooks/clerk`
4. Use the CLERK_WEBHOOK_SECRET from your `.env.production` file

### Coinbase Commerce Webhooks

1. Go to your Coinbase Commerce dashboard
2. Navigate to Settings > Webhook subscriptions
3. Add a new webhook endpoint pointing to `https://yourdomain.com/api/webhooks/coinbase`
4. Save the webhook secret to your `.env.production` file

## Monitoring and Maintenance

### Monitoring with PM2

```bash
pm2 monit
pm2 logs threadflowpro
```

### Monitoring Supabase

1. Use the Supabase dashboard to monitor database performance
2. Set up Supabase logging to track database operations
3. Configure alerts for unusual database activity

### Updating the Application

```bash
cd /path/to/ThreadFlowPro
git pull
npm install
npm run build:prod
pm2 restart threadflowpro
```

## Scaling Considerations

### Horizontal Scaling

For high-traffic scenarios, consider:

1. Using a load balancer with multiple application instances
2. Implementing Redis for session storage
3. Using a CDN for static assets

### Supabase Scaling

As your user base grows:

1. Upgrade your Supabase plan to handle increased load
2. Optimize your queries and implement proper indexing
3. Consider using Supabase's edge functions for certain operations
4. Implement proper caching strategies to reduce database load

## Troubleshooting

### Common Issues

1. **Application not starting:**
   - Check environment variables
   - Verify Supabase connection
   - Check port availability

2. **Payment webhooks not working:**
   - Verify webhook URL is publicly accessible
   - Check webhook secret matches
   - Inspect webhook logs

3. **Authentication issues:**
   - Verify Clerk API keys
   - Check webhook configuration

4. **Supabase connection issues:**
   - Verify your Supabase URL and API keys
   - Check network connectivity to Supabase
   - Ensure your Supabase project is active

For further assistance, check the application logs:

```bash
pm2 logs threadflowpro
```

## Security Best Practices

1. Keep all dependencies updated
2. Use environment variables for sensitive information
3. Implement rate limiting for APIs
4. Set up proper firewall rules
5. Regularly update SSL certificates
6. Configure Supabase Row-Level Security (RLS) policies properly
7. Use strong passwords for all services
8. Back up data regularly 