import * as dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Function to parse daily thread limit
function parseDailyThreadLimit(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    console.warn(`Invalid daily thread limit: ${value}. Using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
}

// Default values for environment variables
const DEFAULT_DAILY_THREAD_LIMIT_FREE = 3;
const DEFAULT_DAILY_THREAD_LIMIT_PRO = 30;
const DEFAULT_DAILY_TWEET_LIMIT_FREE = 10;
const DEFAULT_DAILY_TWEET_LIMIT_PRO = 50;
const DEFAULT_AI_MODEL = 'google/gemini-flash-1.5-8b';
const FALLBACK_AI_MODEL = 'anthropic/claude-3-haiku-20240307';

interface Config {
  // Clerk authentication
  clerkSecretKey: string;
  clerkPublishableKey: string;
  // OpenRouter and thread limits
  openRouterApiKey: string;
  walletConnectProjectId: string;
  dailyThreadLimitFree: number;
  dailyThreadLimitPro: number;
  dailyTweetLimitFree: number;
  dailyTweetLimitPro: number;
  aiModel: string;
  fallbackAiModel: string;
  isDevelopment: boolean;
  // Coinbase Commerce settings
  coinbaseCommerceApiKey: string;
  coinbaseCommerceWebhookSecret: string;
  proPlanPrice: number;
  proPlanCurrency: string;
}

// Environment variables validation
function getMissingEnvVars(): string[] {
  // In development mode, don't treat any variables as required
  if (isDevelopment) {
    return [];
  }
  
  // In production, these variables are required
  const required = ['OPENROUTER_API_KEY', 'CLERK_SECRET_KEY'];
  return required.filter(key => !process.env[key]);
}

// Check for missing required environment variables
const missingEnvVars = getMissingEnvVars();
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please make sure to create a .env file with the required variables.');
  
  // Only exit in production mode
  if (!isDevelopment) {
    process.exit(1);
  }
}

// Generate placeholder values for development mode
const getDevPlaceholder = (key: string, value: string | undefined): string => {
  if (isDevelopment && !value) {
    console.warn(`Using placeholder value for ${key} in development mode`);
    return `dev-placeholder-${key.toLowerCase()}`;
  }
  return value || '';
};

// Log loading of environment variables
if (isDevelopment) {
  console.log('Environment variables loaded:');
  console.log(`- CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log(`- VITE_CLERK_PUBLISHABLE_KEY: ${process.env.VITE_CLERK_PUBLISHABLE_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log(`- OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log(`- COINBASE_COMMERCE_API_KEY: ${process.env.COINBASE_COMMERCE_API_KEY ? '✓ Found' : '✗ Missing'}`);
}

// Export configuration
export const config: Config = {
  // Clerk authentication
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  clerkPublishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  // OpenRouter and thread limits
  openRouterApiKey: getDevPlaceholder('OPENROUTER_API_KEY', process.env.OPENROUTER_API_KEY),
  walletConnectProjectId: getDevPlaceholder('WALLETCONNECT_PROJECT_ID', process.env.WALLETCONNECT_PROJECT_ID || '28c035db614d7997a6c061103ad8f977'),
  dailyThreadLimitFree: parseDailyThreadLimit(
    process.env.DAILY_THREAD_LIMIT_FREE, 
    DEFAULT_DAILY_THREAD_LIMIT_FREE
  ),
  dailyThreadLimitPro: parseDailyThreadLimit(
    process.env.DAILY_THREAD_LIMIT_PRO, 
    DEFAULT_DAILY_THREAD_LIMIT_PRO
  ),
  dailyTweetLimitFree: parseDailyThreadLimit(
    process.env.DAILY_TWEET_LIMIT_FREE, 
    DEFAULT_DAILY_TWEET_LIMIT_FREE
  ),
  dailyTweetLimitPro: parseDailyThreadLimit(
    process.env.DAILY_TWEET_LIMIT_PRO, 
    DEFAULT_DAILY_TWEET_LIMIT_PRO
  ),
  aiModel: process.env.AI_MODEL || DEFAULT_AI_MODEL,
  fallbackAiModel: process.env.FALLBACK_AI_MODEL || FALLBACK_AI_MODEL,
  isDevelopment,
  // Coinbase Commerce settings
  coinbaseCommerceApiKey: getDevPlaceholder('COINBASE_COMMERCE_API_KEY', process.env.COINBASE_COMMERCE_API_KEY),
  coinbaseCommerceWebhookSecret: getDevPlaceholder('COINBASE_COMMERCE_WEBHOOK_SECRET', process.env.COINBASE_COMMERCE_WEBHOOK_SECRET),
  proPlanPrice: parseFloat(process.env.PRO_PLAN_PRICE || '0.01'),
  proPlanCurrency: process.env.PRO_PLAN_CURRENCY || 'USD'
};

export default config; 