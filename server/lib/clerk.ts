import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import env from './env';

// Get Clerk secret key from environment - use the one loaded by env.ts
const secretKey = env.clerkSecretKey;

// Simple in-memory cache for user data
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50;

// Rate limiting tracking
const requestTracker = new Map<string, { count: number; windowStart: number }>();

// Make sure Clerk's env var is set directly for the SDK
if (secretKey) {
  process.env.CLERK_SECRET_KEY = secretKey;
  if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
    console.log('Using Clerk secret key from environment:', `${secretKey.substring(0, 10)}...`);
  }
} else {
  console.error('ERROR: CLERK_SECRET_KEY is not set in environment variables!');
  console.error('This will cause authentication to fail.');
  console.error('Please check your .env file and ensure CLERK_SECRET_KEY is set correctly.');
  console.error('Expected format: sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

  // In development, we'll provide detailed instructions
  if (env.isDevelopment) {
    console.warn('\nDevelopment environment detected. Instructions:');
    console.warn('1. Check that your .env file contains CLERK_SECRET_KEY');
    console.warn('2. Make sure there are no typos in the variable name');
    console.warn('3. Verify that the key format is correct (should start with sk_test_)');
    console.warn('4. Restart the server after making changes to .env');
    console.warn('5. If using npm run dev, ensure it properly loads environment variables');
  }
}

// Validate the key format
if (secretKey && !secretKey.startsWith('sk_test_')) {
  console.error('WARNING: Clerk secret key does not start with sk_test_');
  console.error('This may indicate an incorrect key format or a production key in development');
}

// Initialize Clerk client
export { clerkClient };

// Rate limiting helper
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const tracker = requestTracker.get(key);
  
  if (!tracker || now - tracker.windowStart > RATE_LIMIT_WINDOW) {
    requestTracker.set(key, { count: 1, windowStart: now });
    return false;
  }
  
  if (tracker.count >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for ${key}. Throttling requests.`);
    return true;
  }
  
  tracker.count++;
  return false;
}

// Cache helper functions
function getCachedUser(userId: string): any | null {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
      console.log(`Using cached user data for ${userId}`);
    }
    return cached.user;
  }
  return null;
}

function setCachedUser(userId: string, user: any): void {
  userCache.set(userId, { user, timestamp: Date.now() });
}

// Helper function to verify a session token using modern Clerk approach
export async function verifySession(token: string) {
  try {
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }
    
    // Check rate limiting
    if (isRateLimited('verify_session')) {
      throw new Error('Rate limit exceeded for session verification');
    }
    
    if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
      console.log(`Verifying session token with modern method: ${token.substring(0, 10)}...`);
    }
    
    // Use the modern networkless verification with required parameters
    const payload = await verifyToken(token, {
      secretKey: secretKey,
      issuer: "https://clerk.threadflowpro.com",
      audience: "threadflowpro.com"
    });
    
    if (!payload || !payload.sub) {
      throw new Error('Invalid token payload');
    }
    
    // Return a session-like object for compatibility
    return {
      id: payload.sid || 'session_' + payload.sub,
      userId: payload.sub,
      status: 'active',
      ...payload
    };
  } catch (error) {
    console.error('Failed to verify session:', error);
    throw error;
  }
}

// Helper function to get user by ID with caching
export async function getUser(userId: string) {
  try {
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }
    
    // Check cache first
    const cachedUser = getCachedUser(userId);
    if (cachedUser) {
      return cachedUser;
    }
    
    // Check rate limiting
    if (isRateLimited(`get_user_${userId}`)) {
      console.warn(`Rate limited user fetch for ${userId}, returning cached data if available`);
      // Try to return even expired cached data as fallback
      const expiredCache = userCache.get(userId);
      if (expiredCache) {
        console.warn(`Using expired cache for user ${userId} due to rate limiting`);
        return expiredCache.user;
      }
      throw new Error('Rate limit exceeded and no cached data available');
    }
    
    const user = await clerkClient.users.getUser(userId);
    setCachedUser(userId, user);
    
    if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
      console.log(`Fetched and cached user data for ${userId}`);
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
}

// Helper to clear cache when needed
export function clearUserCache(userId?: string) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, cached] of userCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL * 2) {
      userCache.delete(userId);
    }
  }
}, CACHE_TTL);

export default {
  verifySession,
  getUser,
  clearUserCache,
  clerkClient
}; 