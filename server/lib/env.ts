import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const envPath = path.join(rootDir, '.env');

console.log(`Attempting to load .env from: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

// Load .env file from the project root
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`Error loading .env file: ${result.error.message}`);
} else {
  console.log('.env file loaded successfully');
}

// Also try loading with process.cwd() as a fallback
if (!process.env.CLERK_SECRET_KEY || !process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  const cwdEnvPath = path.join(process.cwd(), '.env');
  console.log(`Trying alternative path: ${cwdEnvPath}`);
  dotenv.config({ path: cwdEnvPath });
}

// Initialize environment variables
const env = {
  // Clerk authentication
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  clerkPublishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  clerkSignInUrl: process.env.VITE_CLERK_SIGN_IN_URL || '/sign-in',
  clerkSignUpUrl: process.env.VITE_CLERK_SIGN_UP_URL || '/sign-up',
  clerkAfterSignInUrl: process.env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  clerkAfterSignUpUrl: process.env.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  
  // Supabase
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Coinbase Commerce
  coinbaseApiKey: process.env.COINBASE_API_KEY || '',
  coinbaseWebhookSecret: process.env.COINBASE_WEBHOOK_SECRET || '',
  
  // OpenRouter API
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  
  // Server settings
  isDevelopment: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_here',
  
  // Plan Configuration
  premiumPlanPrice: parseFloat(process.env.PREMIUM_PLAN_PRICE || '0.01'),
  premiumPlanCurrency: process.env.PREMIUM_PLAN_CURRENCY || 'USD',
  
  // Plan Pricing
  proMonthlyPrice: parseFloat(process.env.PRO_PLAN_MONTHLY_PRICE || '0.01'),
  proYearlyPrice: parseFloat(process.env.PRO_PLAN_YEARLY_PRICE || '0.01'),
  enterprisePrice: parseFloat(process.env.ENTERPRISE_PLAN_PRICE || '0.01'),
  proPlanCurrency: process.env.PRO_PLAN_CURRENCY || 'USD',
  
  // Thread Generation Limits
  dailyThreadLimitFree: parseInt(process.env.DAILY_THREAD_LIMIT_FREE || '3', 10),
  dailyThreadLimitPro: parseInt(process.env.DAILY_THREAD_LIMIT_PRO || '30', 10),
  
  // AI Model Configuration
  aiModel: process.env.AI_MODEL || 'google/gemini-flash-1.5-8b',
  fallbackAiModel: process.env.FALLBACK_AI_MODEL || 'anthropic/claude-3-haiku-20240307',
};

console.log('Environment variables loaded:');
console.log(`- CLERK_SECRET_KEY: ${env.clerkSecretKey ? '✓ Found' : '✗ Missing'}`);
console.log(`- VITE_CLERK_PUBLISHABLE_KEY: ${env.clerkPublishableKey ? '✓ Found' : '✗ Missing'}`);
console.log(`- VITE_SUPABASE_URL: ${env.supabaseUrl ? '✓ Found' : '✗ Missing'}`);
console.log(`- COINBASE_API_KEY: ${env.coinbaseApiKey ? '✓ Found' : '✗ Missing'}`);
console.log(`- OPENROUTER_API_KEY: ${env.openrouterApiKey ? '✓ Found' : '✗ Missing'}`);

// Validate required environment variables
const requiredVars = [
  { name: 'CLERK_SECRET_KEY', value: env.clerkSecretKey },
  { name: 'VITE_CLERK_PUBLISHABLE_KEY', value: env.clerkPublishableKey },
  { name: 'VITE_SUPABASE_URL', value: env.supabaseUrl },
  { name: 'OPENROUTER_API_KEY', value: env.openrouterApiKey },
];

const missingVars = requiredVars.filter(v => !v.value);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v.name}`));
  
  if (env.isDevelopment) {
    console.warn('⚠️ Running in development mode with missing variables');
  } else {
    throw new Error(`Missing required environment variables: ${missingVars.map(v => v.name).join(', ')}`);
  }
}

export default env; 