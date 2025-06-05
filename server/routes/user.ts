import express from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { supabase } from '../lib/supabase';
import { getPlanDetails } from '../lib/planLimits';
import { verifySession } from '../lib/clerk';

const router = express.Router();

// GET /api/user/me - Get current user information
router.get('/me', async (req, res) => {
  try {
    // Extract bearer token from request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Clerk
    let clerkUserId: string;
    try {
      const session = await verifySession(token);
      clerkUserId = session.userId;

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);

      // Get user details from Supabase
      const { data: supabaseUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Failed to fetch user data' });
      }

      // If user doesn't exist in Supabase, sync them
      if (!supabaseUser) {
        // Get primary email
        const primaryEmail = clerkUser.emailAddresses.length > 0 
          ? clerkUser.emailAddresses[0].emailAddress 
          : null;
        
        if (!primaryEmail) {
          return res.status(400).json({ error: 'No email found for user' });
        }

        // Create user in Supabase
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkUserId,
            email: primaryEmail,
            username: clerkUser.username || clerkUser.firstName || primaryEmail.split('@')[0],
            first_name: clerkUser.firstName || null,
            last_name: clerkUser.lastName || null,
            plan: 'free',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user in database' });
        }

        console.log(`Created new user in Supabase: ${clerkUserId}`);
        
        // Get plan details
        const planDetails = await getPlanDetails(clerkUserId);

        // Return the created user data along with plan details
        return res.status(200).json({
          id: clerkUserId,
          email: primaryEmail,
          username: clerkUser.username || clerkUser.firstName || primaryEmail.split('@')[0],
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          profileImageUrl: clerkUser.imageUrl || '',
          plan: 'free',
          planDetails,
          createdAt: newUser.created_at,
          isNewUser: true
        });
      }

      // Get plan details for existing user
      const planDetails = await getPlanDetails(clerkUserId);

      // Return the user data
      res.status(200).json({
        id: clerkUserId,
        email: supabaseUser.email || clerkUser.emailAddresses[0]?.emailAddress || '',
        username: supabaseUser.username || clerkUser.username || clerkUser.firstName || '',
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        profileImageUrl: clerkUser.imageUrl || '',
        plan: supabaseUser.plan || 'free',
        planDetails,
        createdAt: supabaseUser.created_at,
        isNewUser: false
      });

    } catch (sessionError) {
      console.error('Session verification failed:', sessionError);
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Your authentication session is invalid or expired'
      });
    }

  } catch (error) {
    console.error('Error in /api/user/me endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching user data'
    });
  }
});

// GET /api/user/plan - Get current user's plan information
router.get('/plan', async (req, res) => {
  try {
    // Extract bearer token from request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Clerk
    try {
      const session = await verifySession(token);
      const clerkUserId = session.userId;

      // Get plan details
      const planDetails = await getPlanDetails(clerkUserId);

      return res.status(200).json(planDetails);
    } catch (error) {
      console.error('Clerk token verification failed:', error);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication failed. Please sign in again.'
      });
    }
  } catch (error) {
    console.error('Error in /api/user/plan endpoint:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router; 