import { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include the clerkUserId
declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
    }
  }
}

export const clerkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Clerk
    const response = await fetch('https://api.clerk.dev/v1/sessions/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const sessionData = await response.json();
    
    // Extract user ID from the session
    req.clerkUserId = sessionData.user_id;
    
    next();
  } catch (error) {
    console.error('Clerk auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional auth middleware - doesn't fail if no token is provided
export const optionalClerkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      const response = await fetch('https://api.clerk.dev/v1/sessions/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const sessionData = await response.json();
        req.clerkUserId = sessionData.user_id;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional Clerk auth middleware error:', error);
    // Don't fail, just continue without setting clerkUserId
    next();
  }
}; 