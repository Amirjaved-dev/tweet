# ThreadFlowPro

ThreadFlowPro is a modern web application for creating and managing social media threads, with premium features available through cryptocurrency payments.

## 🚀 Architecture

This application uses a clean architecture with three main services:

- **Clerk** - Authentication & user management
- **Supabase** - Database & user data storage
- **Coinbase Commerce** - Cryptocurrency payment processing

## 🔧 Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account
- Clerk account
- Coinbase Commerce account

### Setup

1. Clone & Install
```bash
git clone https://github.com/yourusername/ThreadFlowPro.git
cd ThreadFlowPro
npm install
```

2. Environment Setup
```bash
# Copy the sample env file
cp env.sample .env

# Edit the .env file with your credentials
# Minimum required variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
```

3. Database Setup
```bash
# Set up database with Drizzle
npm run db:push

# Or import the SQL backup
psql -d your_database < supabase_backup.sql
```

4. Start Development Server
```bash
npm run dev
```

The app will be available at http://localhost:3000

## 🔄 Development Commands

```bash
# Start development server
npm run dev

# Start with less logging
npm run dev:minimal

# Build for production
npm run build:prod

# Run TypeScript check
npm run check

# Back up database
npm run db:backup

# Test payment system
npm run payment:test-health
npm run payment:test-charge
npm run payment:test-full

# Docker commands
npm run docker:build
npm run docker:compose
npm run docker:stop
```

## 🏭 Production Deployment

For comprehensive production deployment instructions, please refer to the [Production Deployment Guide](PRODUCTION_GUIDE.md).

### Quick Production Setup

```bash
# Copy production environment sample
cp production.env.sample .env.production

# Edit .env.production with your production values

# Build for production
npm run build:prod

# Start with PM2
npm run start:prod

# Docker deployment
npm run docker:compose
```

### Production Considerations

- Use production environment variables (see `production.env.sample`)
- Configure proper SSL certificates for secure HTTPS connections
- Set up database backups and monitoring
- Implement proper logging and error tracking

## 🗂️ Project Structure

```
ThreadFlowPro/
├── client/                # Frontend React application
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── App.tsx            # Main application component
├── server/                # Backend Express server
│   ├── lib/               # Server utilities
│   ├── routes/            # API routes
│   └── index.ts           # Server entry point
├── public/                # Static assets
├── api/                   # API endpoints
├── scripts/               # Utility scripts
├── shared/                # Shared code between client and server
└── lib/                   # Common library code
```

## 📊 Application Workflows

### Authentication Flow
1. User signs up/logs in via Clerk
2. Upon successful authentication, user data is synchronized with Supabase
3. The application checks for the user's plan status in Supabase
4. UI adapts based on whether the user has a free or premium plan

### Payment Flow
1. User clicks "Upgrade to Premium" button
2. Application creates a Coinbase Commerce checkout session
3. User is redirected to Coinbase Commerce to complete payment
4. After payment, Coinbase sends a webhook to `/api/coinbase/webhook`
5. Server verifies the webhook signature and updates the user's plan status
6. User is redirected to success page and sees their premium features

## 🛠️ Development Guide

### Adding New Features

When adding new features that require premium access:

```javascript
// Example of gating premium features
import { useUserData } from '../hooks/useUserData';

function PremiumFeature() {
  const { isPremium, isLoading } = useUserData();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!isPremium) {
    return (
      <div>
        <p>This feature requires a premium subscription</p>
        <UpgradeButton />
      </div>
    );
  }
  
  return (
    <div>
      {/* Premium feature content */}
    </div>
  );
}
```

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.dev/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Coinbase Commerce Documentation](https://commerce.coinbase.com/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
