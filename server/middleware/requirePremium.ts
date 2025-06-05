import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth } from './auth';

// Type definitions for extended request
interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    session: any;
  };
  user?: any;
  clerkUserId?: string;
  userPlan?: string;
}

// Extend the Request interface to include clerkUserId
declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
    }
  }
}

/**
 * Middleware to verify that the user has premium access
 * First validates authentication, then checks premium status
 */
export const requirePremium = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated first
    if (!req.clerkUserId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this feature'
      });
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', req.clerkUserId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User account not found in our system'
      });
    }

    // Check if user has premium access
    const isPremium = user.is_premium || 
                     user.plan === 'premium' || 
                     user.plan === 'pro' || 
                     user.plan === 'lifetime';

    if (!isPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required',
        message: 'This feature is only available to premium subscribers. Upgrade your plan to access this functionality.',
        currentPlan: user.plan || 'free',
        upgradeRequired: true,
        upgradeUrl: '/pricing' // You can customize this URL
      });
    }

    // User has premium access, continue to the next middleware
    next();

  } catch (error) {
    console.error('Error in requirePremium middleware:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while checking premium status'
    });
  }
};

// Simpler middleware that just attaches plan info to the request
export const checkPlan = [
  requireAuth, // First ensure user is authenticated
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const clerkUserId = authReq.auth?.userId;
      
      if (!clerkUserId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'User ID not found in request'
        });
      }

      // Get user from Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('plan, is_premium')
        .eq('clerk_id', clerkUserId)
        .single();

      if (userError) {
        // Only log actual errors, not PGRST116 which means user doesn't exist
        if (userError.code !== 'PGRST116') {
          console.error('Error fetching user plan:', userError);
          return res.status(500).json({ 
            error: 'Database error',
            message: 'Failed to verify user plan'
          });
        } else {
          // User doesn't exist, they have free plan by default
          authReq.userPlan = 'free';
          authReq.clerkUserId = clerkUserId;
          return next();
        }
      }

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'User account not found in database'
        });
      }

      authReq.userPlan = user.plan;
      authReq.clerkUserId = clerkUserId;

      // Continue to next middleware/route with plan info attached
      next();
    } catch (error) {
      console.error('Unexpected error in checkPlan middleware:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while verifying your plan'
      });
    }
  }
]; 