# ThreadFlowPro - AI-Powered Twitter Thread Generator

![ThreadFlowPro Banner](https://img.shields.io/badge/ThreadFlowPro-AI%20Thread%20Generator-purple?style=for-the-badge)

**ThreadFlowPro** is a sophisticated AI-powered platform that generates viral Twitter/X threads with advanced analytics, token/cryptocurrency integration, and premium subscription features. The platform combines cutting-edge AI technology with real-time market data to create engaging, data-driven social media content.

## 🚀 Features

### Core Features
- **🤖 AI-Powered Thread Generation**: Multiple AI models for creating engaging Twitter threads
- **💰 Cryptocurrency Integration**: Real-time token data from multiple sources (CoinGecko, DEXScreener)
- **📊 Advanced Analytics**: Thread performance tracking and insights
- **👑 Premium Subscription**: Coinbase Commerce integration for premium features
- **🔐 Secure Authentication**: Clerk-based authentication with user management
- **🎨 Modern UI/UX**: Dark theme with gradient effects and responsive design

### Thread Generation Types
- **Token Analysis Threads**: Cryptocurrency and token-focused content
- **General Content Threads**: Versatile content for any topic
- **Market Analysis**: Real-time market data integration
- **Viral Content**: AI-optimized for maximum engagement

### Token Features
- **Multi-Source Search**: Search across built-in categories, CoinGecko, and DEXScreener
- **Real-Time Data**: Live price feeds, 24h changes, market cap data
- **Smart Filtering**: Category-based browsing with verified tokens
- **Contract Verification**: Ethereum and multi-chain contract validation

### Premium Features
- **Unlimited Thread Generation**: No limits on content creation
- **Advanced Analytics Dashboard**: Detailed performance metrics
- **Priority AI Models**: Access to premium AI models
- **Custom Token Management**: Save and manage personal token lists
- **Priority Support**: Dedicated customer support

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight client-side routing
- **Lucide Icons**: Beautiful icon system
- **Class Variance Authority**: Utility for component variants

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web application framework
- **TypeScript**: Server-side type safety

### Database & Services
- **Supabase**: PostgreSQL database with real-time features
- **Clerk**: Authentication and user management
- **Coinbase Commerce**: Payment processing
- **External APIs**:
  - CoinGecko API (cryptocurrency data)
  - DEXScreener API (DEX trading data)
  - Multiple AI providers (OpenAI, Anthropic, Perplexity, etc.)

### Deployment & Infrastructure
- **Vercel/Railway**: Deployment platforms
- **PostgreSQL**: Production database
- **Webhook Integration**: Real-time payment processing

## 🏗 Architecture

### Project Structure
```
ThreadFlowPro/
├── client/                          # Frontend React application
│   ├── components/                  # React components
│   │   ├── Auth/                   # Authentication components
│   │   ├── Dashboard/              # Dashboard pages and components
│   │   ├── Premium/                # Premium features and upgrade flows
│   │   └── ui/                     # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries and configurations
│   └── src/                        # Source files and global styles
├── server/                         # Backend Express server
│   ├── routes/                     # API route handlers
│   │   ├── auth/                   # Authentication routes
│   │   ├── tokens/                 # Token/cryptocurrency routes
│   │   ├── threads/                # Thread generation routes
│   │   └── webhooks/               # Payment webhook handlers
│   ├── middleware/                 # Express middleware
│   ├── lib/                        # Server utilities and configurations
│   └── types/                      # TypeScript type definitions
├── supabase/                       # Database configuration
│   ├── migrations/                 # Database schema migrations
│   └── seed.sql                    # Initial data seeding
└── docs/                           # Documentation
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR UNIQUE NOT NULL,
  email VARCHAR NOT NULL,
  username VARCHAR,
  plan VARCHAR DEFAULT 'free',
  is_premium BOOLEAN DEFAULT FALSE,
  status VARCHAR DEFAULT 'active',
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR NOT NULL,
  coinbase_charge_id VARCHAR UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR NOT NULL,
  plan_type VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Threads Table
```sql
CREATE TABLE threads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  thread_type VARCHAR NOT NULL,
  token_symbol VARCHAR,
  metadata JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Analytics Table
```sql
CREATE TABLE thread_analytics (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES threads(id),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  tracked_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or Supabase)
- Required API keys (see Environment Variables section)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ThreadFlowPro
   ```

2. **Install Dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create `.env` file in the root directory:
   ```env
   # Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   
   # Payment Processing
   COINBASE_COMMERCE_API_KEY=your_coinbase_api_key
   COINBASE_COMMERCE_WEBHOOK_SECRET=your_coinbase_webhook_secret
   
   # AI Providers (choose your preferred providers)
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   PERPLEXITY_API_KEY=your_perplexity_key
   GOOGLE_API_KEY=your_google_key
   
   # External APIs
   COINGECKO_API_KEY=your_coingecko_key  # Optional for rate limits
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db reset
   
   # Or manually execute SQL files
   psql -d your_database < supabase/migrations/001_initial_schema.sql
   psql -d your_database < supabase/migrations/002_create_payments_table.sql
   psql -d your_database < supabase/migrations/003_create_threads_table.sql
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server (Terminal 1)
   npm run dev
   
   # Start frontend server (Terminal 2)
   cd client
   npm run dev
   ```

6. **Access Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## 🔑 API Documentation

### Authentication Routes
- `POST /api/auth/webhook` - Clerk user synchronization
- `GET /api/auth/user` - Get current user data

### Token Routes
- `GET /api/tokens/categories` - Get token categories
- `GET /api/tokens/search` - Search tokens across all sources
- `POST /api/tokens/validate-contract` - Validate contract address
- `GET /api/tokens/supported-chains` - Get supported blockchain networks

### Thread Routes
- `POST /api/threads/generate` - Generate new thread
- `GET /api/threads/user/:userId` - Get user's threads
- `PUT /api/threads/:id` - Update thread
- `DELETE /api/threads/:id` - Delete thread

### Payment Routes
- `POST /api/payments/create-charge` - Create Coinbase charge
- `POST /api/payments/webhook` - Process payment webhooks
- `GET /api/payments/verify/:chargeId` - Verify payment status

### Analytics Routes
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `POST /api/analytics/track` - Track thread performance
- `GET /api/analytics/threads/:threadId` - Get thread-specific analytics

## 💳 Payment Integration

### Coinbase Commerce Setup

1. **Create Coinbase Commerce Account**
   - Sign up at [commerce.coinbase.com](https://commerce.coinbase.com)
   - Generate API key and webhook secret

2. **Configure Webhook Endpoint**
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `charge:created`, `charge:confirmed`, `charge:failed`

3. **Payment Flow**
   ```typescript
   // Create payment charge
   const charge = await fetch('/api/payments/create-charge', {
     method: 'POST',
     body: JSON.stringify({
       planType: 'premium_monthly',
       amount: 29.99,
       currency: 'USD'
     })
   });
   
   // Redirect to Coinbase checkout
   window.location.href = charge.checkout_url;
   ```

### Payment Processing
- **Webhook Verification**: HMAC-SHA256 signature validation
- **Status Tracking**: Real-time payment status updates
- **User Upgrades**: Automatic premium activation
- **Failure Handling**: Graceful error handling and retries

## 🎨 UI Components

### Component Library
- **Button**: Multiple variants with gradient effects
- **Input**: Dark theme with focus states
- **Card**: Glass morphism design
- **Toast**: Notification system
- **Modal**: Overlay components
- **Loading**: Skeleton and spinner components

### Design System
- **Colors**: Purple/blue gradient theme
- **Typography**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Animations**: Smooth transitions and hover effects

### Responsive Design
- **Mobile-first**: Progressive enhancement
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Touch-friendly**: Optimized for mobile interactions

## 🔐 Security Features

### Authentication Security
- **JWT Tokens**: Secure session management
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side data validation

### Payment Security
- **Webhook Verification**: Cryptographic signature validation
- **PCI Compliance**: Coinbase Commerce handles sensitive data
- **Secure Headers**: HTTPS enforcement and security headers

### Data Protection
- **Database Security**: Row-level security with Supabase
- **API Key Management**: Environment-based configuration
- **User Data Privacy**: GDPR-compliant data handling

## 📊 Analytics & Monitoring

### Performance Metrics
- **Thread Generation**: Success rates and response times
- **User Engagement**: Click-through rates and interactions
- **Payment Conversion**: Subscription conversion rates
- **API Performance**: Endpoint response times and error rates

### Monitoring Tools
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: User behavior and feature usage
- **Payment Tracking**: Revenue and subscription metrics

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build for production
cd client
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend Deployment (Railway)
```bash
# Configure railway
railway login
railway init

# Deploy
railway up
```

### Environment Configuration
- Set all environment variables in deployment platform
- Configure domain and SSL certificates
- Set up monitoring and logging

## 🔄 Recent Updates & Fixes

### Payment System Fixes (Latest)
- ✅ **Webhook Signature Verification**: Fixed HMAC-SHA256 validation
- ✅ **Payload Parsing**: Handles nested Coinbase payload structure
- ✅ **Database Schema**: Corrected payment table column names
- ✅ **Success Page**: Added automatic payment verification
- ✅ **Error Handling**: Improved webhook error responses

### UI/UX Improvements
- ✅ **Token Search Dropdown**: Replaced browse section with search dropdown
- ✅ **Component Unification**: Standardized UI component library
- ✅ **Toast System**: Implemented comprehensive notification system
- ✅ **Responsive Design**: Mobile-optimized layouts

### Performance Optimizations
- ✅ **API Optimization**: Improved token search performance
- ✅ **Caching Strategy**: Implemented smart caching for token data
- ✅ **Bundle Optimization**: Reduced client bundle size
- ✅ **Database Queries**: Optimized database query performance

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

### Technical Support
- **Email**: niceearn7@gmail.com
- **Documentation**: [docs.threadflowpro.com](https://docs.threadflowpro.com)
- **Discord**: [ThreadFlowPro Community](https://discord.gg/threadflowpro)

### Premium Support
Premium users get priority support with:
- ⚡ **24-hour response time**
- 🎯 **Direct developer access**
- 📞 **Video call support**
- 🔧 **Custom feature requests**

---

**Built with ❤️ by the ThreadFlowPro Team**

*Making viral Twitter threads accessible to everyone through the power of AI* 