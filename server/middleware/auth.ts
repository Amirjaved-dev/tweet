import { Request, Response, NextFunction } from 'express';
import { verifySession, getUser } from '../lib/clerk';

// Make sure we load the correct key
const clerkKey = process.env.CLERK_SECRET_KEY;
if (!clerkKey || !clerkKey.startsWith('sk_test_')) {
  console.error('ERROR: Invalid Clerk key format. Authentication will fail!');
  console.log('Please check your .env file and ensure CLERK_SECRET_KEY is correct');
  console.log('Current key format:', clerkKey ? `${clerkKey.substring(0, 10)}...` : 'undefined');
}

// Simple request-level cache to avoid re-verifying the same token multiple times in a single request cycle
const requestCache = new Map<string, { auth: any; user: any; timestamp: number }>();
const REQUEST_CACHE_TTL = 30 * 1000; // 30 seconds

// Cleanup old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of requestCache.entries()) {
    if (now - cached.timestamp > REQUEST_CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}, REQUEST_CACHE_TTL);

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.error('Missing or invalid authorization header');
      }
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.error('No token provided');
      }
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication token is required'
      });
    }

    // Check request cache first
    const cacheKey = `auth_${token.substring(0, 20)}`;
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < REQUEST_CACHE_TTL) {
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.log('Using cached auth data for request');
      }
      (req as any).auth = cached.auth;
      (req as any).user = cached.user;
      return next();
    }

    try {
      // Verify the session token with Clerk
      const session = await verifySession(token);
      
      if (!session || !session.userId) {
        throw new Error('Invalid session');
      }
      
      // Add user data to request for downstream handlers
      const authData = {
        userId: session.userId,
        sessionId: session.id,
        session
      };
      
      (req as any).auth = authData;
      
      // Get basic user data and add to request
      let userData = null;
      try {
        userData = await getUser(session.userId);
        (req as any).user = userData;
      } catch (userError) {
        if (process.env.LOG_LEVEL === 'WARN' || process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
          console.warn('Could not fetch user data:', userError);
        }
        // Continue even without user data
      }

      // Cache the successful auth result
      requestCache.set(cacheKey, {
        auth: authData,
        user: userData,
        timestamp: Date.now()
      });

      next();
    } catch (error) {
      // Only log verification errors if they're not rate limit errors
      if (error instanceof Error && !error.message.includes('Rate limit')) {
        console.error('Session verification failed:', error);
      } else if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.warn('Session verification failed (possibly rate limited):', error);
      }
      
      return res.status(401).json({ 
        error: 'Invalid session token',
        message: error instanceof Error && error.message.includes('Rate limit') 
          ? 'Too many requests. Please try again in a moment.'
          : 'Your authentication token is invalid or expired'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while authenticating your request'
    });
  }
}; 