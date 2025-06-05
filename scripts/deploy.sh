#!/bin/bash

# ThreadFlowPro Production Deployment Script
# This script automates the process of deploying ThreadFlowPro to production

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
LOG_FILE="./deploy_${TIMESTAMP}.log"

# Ensure the backup directory exists
mkdir -p $BACKUP_DIR

# Log both to console and file
log() {
  echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1" | tee -a $LOG_FILE
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
  exit 1
}

# Check environment
if [ ! -f .env.production ]; then
  error "Production environment file (.env.production) not found!"
fi

# Backup current state
log "Creating backup of current state..."
if [ -d "dist" ]; then
  mkdir -p "${BACKUP_DIR}/dist_${TIMESTAMP}"
  cp -r dist/* "${BACKUP_DIR}/dist_${TIMESTAMP}/"
  log "Application backup created at ${BACKUP_DIR}/dist_${TIMESTAMP}/"
fi

# Database backup (if using local database)
if command -v pg_dump &> /dev/null && grep -q "DATABASE_URL=postgresql" .env.production; then
  log "Creating database backup..."
  source .env.production
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  pg_dump -U postgres $DB_NAME > "${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql" || warn "Database backup failed, continuing deployment..."
  log "Database backup created at ${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"
fi

# Pull latest changes
log "Pulling latest changes from repository..."
git pull origin main || error "Failed to pull latest changes"

# Install dependencies
log "Installing dependencies..."
npm ci || error "Failed to install dependencies"

# Build for production
log "Building application for production..."
npm run build:prod || error "Build failed"

# Restart application
log "Restarting application with PM2..."
if pm2 list | grep -q "threadflowpro"; then
  pm2 restart threadflowpro || error "Failed to restart application"
else
  pm2 start ecosystem.config.js --env production || error "Failed to start application"
fi

# Save PM2 configuration
pm2 save

# Check application status
log "Checking application status..."
sleep 5
if pm2 list | grep -q "threadflowpro" && pm2 list | grep -q "online"; then
  log "Application successfully deployed and running!"
else
  error "Application deployment completed but it may not be running correctly. Check logs with: pm2 logs threadflowpro"
fi

# Final message
log "🚀 Deployment completed successfully!"
log "Check the application at: $(grep BASE_URL .env.production | cut -d '=' -f2)"
log "Monitor with: pm2 monit"
log "View logs with: pm2 logs threadflowpro" 