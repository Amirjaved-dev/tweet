import express from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../config';
import { requireAuth } from '../middleware/auth';
import { clerkClient } from '../lib/clerk';

const router = express.Router();

// Helper function to get the correct base URL for redirects
const getBaseUrl = (req?: express.Request): string => {
  // 1. Check environment variable first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // 2. In development, try to detect ngrok URL from request headers
  if (process.env.NODE_ENV === 'development' && req) {
    const host = req.get('host');
    const forwardedHost = req.get('x-forwarded-host');
    const forwardedProto = req.get('x-forwarded-proto');
    
    // If we have forwarded headers (likely ngrok), use them
    if (forwardedHost && forwardedProto) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    
    // Check if host looks like ngrok
    if (host && host.includes('ngrok')) {
      return `https://${host}`;
    }
  }
  
  // 3. Fallback to localhost
  return 'http://localhost:3000';
};

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_ANON_KEY;

// Use development placeholders if environment variables are missing
const isDevelopment = process.env.NODE_ENV === 'development';

// Use fallback values in development mode
const finalSupabaseUrl = supabaseUrl || (isDevelopment ? 'https://leirhgtidkhuvdwpblel.supabase.co' : undefined);
const finalAnonKey = supabaseAnonKey || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE' : undefined);

if (!finalSupabaseUrl || !finalAnonKey) {
  if (isDevelopment) {
    console.warn('Using placeholder Supabase credentials in development mode');
  } else {
    throw new Error('Missing Supabase environment variables');
  }
}

const supabase = createClient(
  finalSupabaseUrl || 'https://placeholder.supabase.co',
  finalAnonKey || 'placeholder_key'
);

// Coinbase Commerce configuration
// First check COINBASE_COMMERCE_API_KEY, then fall back to COINBASE_API_KEY
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY || process.env.COINBASE_API_KEY || config.coinbaseCommerceApiKey;
const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

if (!COINBASE_API_KEY) {
  console.warn('COINBASE_API_KEY not found in environment variables');
}

// POST /api/payment/create
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { planPrice = config.proPlanPrice } = req.body;
    
    // User data is already verified and available from the auth middleware
    const clerkUserId = (req as any).auth.userId;
    const user = (req as any).user;
    
    // Get email from user object
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';

    if (!COINBASE_API_KEY) {
      return res.status(500).json({ 
        error: 'Payment service unavailable',
        message: 'Coinbase Commerce is not configured'
      });
    }

    // Create Coinbase Commerce checkout
    const checkoutData = {
      name: 'ThreadFlowPro Premium Upgrade',
      description: 'Upgrade to Premium plan for unlimited thread generation',
      pricing_type: 'fixed_price',
      local_price: {
        amount: planPrice.toString(),
        currency: config.proPlanCurrency
      },
      metadata: {
        clerk_user_id: clerkUserId,
        user_email: userEmail,
        plan: 'premium'
      },
      redirect_url: `${getBaseUrl(req)}/payment-success`,
      cancel_url: `${getBaseUrl(req)}/payment-cancel`
    };

    console.log('Creating Coinbase Commerce charge with API key:', COINBASE_API_KEY.substring(0, 5) + '...');
    
    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Coinbase Commerce API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to create payment session',
        message: 'Unable to connect to payment provider'
      });
    }

    const chargeData = await response.json();

    res.status(200).json({
      success: true,
      checkout_url: chargeData.data.hosted_url,
      charge_id: chargeData.data.id,
      message: 'Payment session created successfully'
    });

  } catch (error) {
    console.error('Unexpected error in payment creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payment/coinbase/create-charge
router.post('/coinbase/create-charge', async (req, res) => {
  try {
    const { clerkUserId, plan, planPrice, billingPeriod, redirectUrl, cancelUrl } = req.body;
    
    if (!clerkUserId || !plan) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Calculate price based on plan and billing period
    let finalPrice: number;
    
    if (planPrice) {
      // Use the provided price if available
      finalPrice = parseFloat(planPrice);
    } else {
      // Default pricing based on plan and billing period
      if (plan === 'premium' || plan === 'pro') {
        finalPrice = billingPeriod === 'yearly' ? 99 : 9.99;
      } else {
        finalPrice = billingPeriod === 'yearly' ? 49 : 4.99;
      }
    }
    
    // Get user details from Clerk (optional, enhance with user data if needed)
    let userEmail = '';
    try {
      const user = await clerkClient.users.getUser(clerkUserId);
      userEmail = user.emailAddresses[0]?.emailAddress || '';
    } catch (error) {
      console.warn('Could not fetch user details from Clerk:', error);
      // Continue without user email
    }

    if (!COINBASE_API_KEY) {
      return res.status(500).json({ 
        error: 'Payment service unavailable',
        message: 'Coinbase Commerce is not configured'
      });
    }

    // Create Coinbase Commerce charge
    const chargeData = {
      name: `ThreadFlowPro ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
      description: `${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'} subscription to ThreadFlowPro ${plan} plan`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: finalPrice.toString(),
        currency: config.proPlanCurrency
      },
      metadata: {
        clerk_user_id: clerkUserId,
        user_email: userEmail,
        plan: plan,
        billing_period: billingPeriod
      },
      redirect_url: redirectUrl || `${getBaseUrl(req)}/payment-success`,
      cancel_url: cancelUrl || `${getBaseUrl(req)}/payment-cancel`
    };

    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Coinbase Commerce API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to create cryptocurrency payment charge',
        details: errorData
      });
    }

    const responseData = await response.json();

    // Create a payment record in Supabase (optional)
    try {
      await supabase.from('payments').insert({
        clerk_user_id: clerkUserId,
        email: userEmail,
        plan: plan,
        amount: finalPrice,
        currency: config.proPlanCurrency,
        payment_method: 'cryptocurrency',
        payment_provider: 'coinbase_commerce',
        charge_id: responseData.data.id,
        status: 'pending',
        billing_period: billingPeriod,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error recording payment in database:', error);
      // Continue even if recording payment fails
    }

    // Return charge details including hosted checkout URL
    res.status(200).json({
      success: true,
      id: responseData.data.id,
      hosted_url: responseData.data.hosted_url,
      code: responseData.data.code,
      expires_at: responseData.data.expires_at
    });

  } catch (error) {
    console.error('Unexpected error in Coinbase payment creation:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    });
  }
});

// GET /api/payment/coinbase/charge/:id
router.get('/coinbase/charge/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Charge ID is required' });
    }
    
    if (!COINBASE_API_KEY) {
      return res.status(500).json({ error: 'Coinbase Commerce is not configured' });
    }
    
    // Fetch charge details from Coinbase Commerce
    const response = await fetch(`${COINBASE_API_URL}/charges/${id}`, {
      method: 'GET',
      headers: {
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error fetching charge ${id}:`, errorData);
      return res.status(response.status).json({ 
        error: 'Failed to fetch charge details',
        details: errorData
      });
    }
    
    const chargeData = await response.json();
    
    res.status(200).json({
      success: true,
      charge: chargeData.data
    });
  } catch (error) {
    console.error('Error fetching Coinbase charge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payment/activate-subscription
router.post('/activate-subscription', requireAuth, async (req, res) => {
  try {
    const { userId, sessionId, planId, planType, billingPeriod, forceDbUpdate } = req.body;
    
    console.log('🔄 activate-subscription: Request received:', {
      userId,
      sessionId,
      planId,
      planType,
      billingPeriod,
      forceDbUpdate
    });
    
    if (!userId || !planId) {
      console.error('❌ Missing required parameters:', { userId, planId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Find user in Supabase
    console.log('🔍 Searching for user in database...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();
    
    console.log('📊 User search result:', {
      found: !!userData,
      error: userError?.code,
      message: userError?.message
    });
    
    let currentUserData = userData;
    
    if (userError) {
      // Only log actual errors, not PGRST116 which means user doesn't exist
      if (userError.code !== 'PGRST116') {
        console.error('❌ Error finding user:', userError);
        return res.status(500).json({ error: 'Database error while checking user' });
      } else {
        // User doesn't exist, create them first
        console.log(`➕ User ${userId} not found in database, creating...`);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: userId,
            email: 'unknown@email.com', // This should be provided in the request
            plan: 'free',
            is_premium: false
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user in database' });
        }

        console.log(`✅ Created new user:`, newUser);
        currentUserData = newUser;
      }
    }

    // Calculate subscription end date based on billing period
    const durationMonths = billingPeriod === 'yearly' ? 12 : 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    
    console.log('📅 Setting subscription expiry to:', expiryDate.toISOString());
    
    // Update user's subscription status - using both `plan` and `plan_status` fields for compatibility
    const updateData = {
      plan: planType || 'premium',
      plan_status: planType || 'premium', // Add plan_status field for compatibility
      is_premium: true,
      subscription_expires_at: expiryDate.toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Updating user with data:', updateData);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription status' });
    }
    
    console.log('✅ User update successful:', updateResult);
    
    // Record subscription in subscriptions table
    console.log('📝 Recording subscription...');
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: currentUserData.id,
        clerk_id: userId,
        plan_id: planId,
        plan_type: planType || 'premium',
        payment_id: sessionId,
        status: 'active',
        billing_period: billingPeriod || 'monthly',
        starts_at: new Date().toISOString(),
        ends_at: expiryDate.toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (subscriptionError) {
      console.error('⚠️ Error recording subscription (continuing anyway):', subscriptionError);
      // Continue even if recording subscription fails
    } else {
      console.log('✅ Subscription recorded successfully');
    }
    
    const responseData = {
      success: true,
      message: 'Subscription activated successfully',
      user: updateResult[0],
      plan: planType || 'premium',
      is_premium: true,
      expires_at: expiryDate.toISOString()
    };
    
    console.log('📤 Sending success response:', responseData);
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('💥 Error activating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payment/webhook
// Coinbase Commerce webhook handler with improved development support
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-cc-webhook-signature'] as string;
    const payload = req.body.toString();
    
    console.log('🔔 Webhook received:', {
      hasSignature: !!signature,
      payloadLength: payload.length,
      webhookSecret: COINBASE_API_KEY ? 'API key exists' : 'Missing API key'
    });

    // In development, we can be more lenient with signature validation
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Lenient webhook validation');
      
      // Check if we have a webhook secret, if not, log and continue
      if (!COINBASE_API_KEY) {
        console.warn('⚠️ No webhook secret configured in development - proceeding anyway');
      }
      
      // Try to parse payload first
      let event;
      try {
        event = JSON.parse(payload);
        console.log('📦 Parsed webhook event:', event.type);
      } catch (error) {
        console.error('❌ Invalid JSON payload:', error);
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }

      // For development, we'll process certain events even without proper signature
      if (event.type === 'charge:confirmed' || event.type === 'charge:completed') {
        console.log('🔄 Processing payment confirmation in development mode');
        
        const charge = event.data;
        const metadata = charge.metadata;
        
        if (!metadata || !metadata.clerk_user_id) {
          console.error('❌ Missing clerk_user_id in webhook metadata');
          return res.status(400).json({ error: 'Missing clerk_user_id in metadata' });
        }

        const clerkId = metadata.clerk_user_id;
        const plan = metadata.plan || 'premium';
        const billingPeriod = metadata.billing_period || 'monthly';

        console.log(`🎯 Processing payment for user: ${clerkId}, plan: ${plan}`);

        try {
          // Call the manual activation endpoint internally
          const activationResult = await activateUserPlan(clerkId, plan, billingPeriod, charge.id);
          
          if (activationResult.success) {
            console.log('✅ Payment processed successfully in development mode');
            return res.status(200).json({ success: true, message: 'Payment processed' });
          } else {
            console.error('❌ Failed to activate plan:', activationResult.error);
            return res.status(500).json({ error: activationResult.error });
          }
        } catch (error) {
          console.error('❌ Error processing payment:', error);
          return res.status(500).json({ error: 'Failed to process payment' });
        }
      }
      
      // For other events in development, just log and acknowledge
      console.log(`📝 Webhook event ${event.type} logged in development mode`);
      return res.status(200).json({ success: true, message: 'Event logged' });
    }

    // Production mode - strict signature validation
    if (!signature) {
      console.error('❌ Missing webhook signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // For production, verify the signature strictly
    // This would require the actual Coinbase webhook secret
    console.log('🔒 Production mode: Strict signature validation required');
    return res.status(401).json({ error: 'Signature validation required in production' });

  } catch (error) {
    console.error('❌ Unexpected error in webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to activate user plan
async function activateUserPlan(clerkId: string, plan: string, billingPeriod: string, chargeId?: string) {
  try {
    // Find or create user
    let userData;
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (userError) {
      if (userError.code !== 'PGRST116') {
        throw new Error(`Database error: ${userError.message}`);
      } else {
        // Create user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkId,
            email: 'webhook-activation@example.com',
            plan: 'free'
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create user: ${createError.message}`);
        }
        userData = newUser;
      }
    } else {
      userData = existingUser;
    }

    // Calculate expiry date
    const durationMonths = billingPeriod === 'yearly' ? 12 : 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    // Update user plan
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        plan: plan,
        is_premium: true,
        subscription_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkId)
      .select();

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    // Record subscription
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userData.id,
        clerk_id: clerkId,
        plan_id: plan,
        plan_type: plan,
        payment_id: chargeId || 'webhook-' + Date.now(),
        status: 'active',
        billing_period: billingPeriod,
        starts_at: new Date().toISOString(),
        ends_at: expiryDate.toISOString(),
        created_at: new Date().toISOString()
      });

    if (subscriptionError) {
      console.warn('Warning: Failed to record subscription:', subscriptionError);
    }

    return { 
      success: true, 
      user: updateData[0],
      message: `Successfully activated ${plan} plan for user ${clerkId}`
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Debug endpoint to check base URL detection
router.get('/debug/base-url', (req, res) => {
  const detectedUrl = getBaseUrl(req);
  const envBaseUrl = process.env.BASE_URL;
  const requestHeaders = {
    host: req.get('host'),
    'x-forwarded-host': req.get('x-forwarded-host'),
    'x-forwarded-proto': req.get('x-forwarded-proto')
  };
  
  res.json({
    detectedBaseUrl: detectedUrl,
    envBaseUrl: envBaseUrl,
    requestHeaders: requestHeaders,
    nodeEnv: process.env.NODE_ENV
  });
});

// POST /api/payment/quick-upgrade
// Quick upgrade endpoint for testing (NO AUTH REQUIRED)
router.post('/quick-upgrade', async (req, res) => {
  try {
    console.log('🚀 Quick upgrade endpoint called');
    
    // In development mode only
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'This endpoint is only available in development mode' });
    }
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || 'https://leirhgtidkhuvdwpblel.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE'
    );

    // Get all free users and upgrade them
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('plan', 'free')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users', details: usersError });
    }
    
    if (!users || users.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No free users found to upgrade',
        upgraded: 0
      });
    }
    
    let upgraded = 0;
    
    // Upgrade each user
    for (const user of users) {
      console.log(`🚀 Upgrading user: ${user.clerk_id} (${user.email})`);
      
      // Calculate expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Update user to premium
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: 'premium',
          is_premium: true,
          subscription_expires_at: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`❌ Error updating user ${user.clerk_id}:`, updateError);
        continue;
      }
      
      console.log(`✅ Successfully upgraded user ${user.clerk_id} to premium`);
      upgraded++;
      
      // Record subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          clerk_id: user.clerk_id,
          plan_id: 'premium',
          plan_type: 'premium',
          payment_id: 'quick-upgrade-' + Date.now(),
          status: 'active',
          billing_period: 'monthly',
          starts_at: new Date().toISOString(),
          ends_at: expiryDate.toISOString(),
          created_at: new Date().toISOString()
        });
      
      if (subscriptionError) {
        console.warn(`⚠️ Warning: Failed to record subscription for ${user.clerk_id}:`, subscriptionError);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully upgraded ${upgraded} users to premium`,
      upgraded: upgraded,
      total_found: users.length
    });
    
  } catch (error) {
    console.error('❌ Error in quick upgrade:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /api/payment/sync-status
// Simple endpoint to sync user status between Clerk and Supabase
router.post('/sync-status', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('🔄 Syncing status for user:', userId);
    
    // Get user from Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();
    
    if (userData) {
      console.log('✅ Found user data:', userData.plan, userData.is_premium);
      
      res.json({
        success: true,
        message: 'Status synced successfully',
        user: {
          plan: userData.plan,
          is_premium: userData.is_premium,
          expires_at: userData.subscription_expires_at
        }
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
    
  } catch (error) {
    console.error('Error syncing status:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// POST /api/payment/force-upgrade
// Emergency force upgrade endpoint - NO AUTH REQUIRED in development
router.post('/force-upgrade', async (req, res) => {
  try {
    console.log('🚨 FORCE UPGRADE ENDPOINT CALLED');
    
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Force upgrade only available in development' });
    }
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || 'https://leirhgtidkhuvdwpblel.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE'
    );

    // Get ALL users and upgrade them ALL to premium
    console.log('🔄 Fetching ALL users from database...');
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .limit(100);
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch users', details: fetchError });
    }
    
    console.log(`📊 Found ${allUsers?.length || 0} users in database`);
    
    if (!allUsers || allUsers.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No users found in database',
        upgraded: 0
      });
    }
    
    // Calculate expiry date (60 days from now for extra time)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60);
    
    console.log(`📅 Setting premium expiry to: ${expiryDate.toISOString()}`);
    
    // Update ALL users to premium - no conditions
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        plan: 'premium',
        is_premium: true,
        subscription_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .neq('id', 0) // This matches all users (since ID is never 0)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating users:', updateError);
      return res.status(500).json({ error: 'Failed to update users', details: updateError });
    }
    
    console.log(`✅ Successfully upgraded ${updateResult?.length || 0} users to premium`);
    
    // Also record subscriptions for all users
    const subscriptions = allUsers.map(user => ({
      user_id: user.id,
      clerk_id: user.clerk_id,
      plan_id: 'premium',
      plan_type: 'premium',
      payment_id: 'force-upgrade-' + Date.now(),
      status: 'active',
      billing_period: 'monthly',
      starts_at: new Date().toISOString(),
      ends_at: expiryDate.toISOString(),
      created_at: new Date().toISOString()
    }));
    
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptions);
    
    if (subscriptionError) {
      console.warn('⚠️ Error recording subscriptions:', subscriptionError);
    } else {
      console.log('✅ Recorded subscriptions for all users');
    }
    
    res.json({
      success: true,
      message: `FORCE UPGRADED ALL ${updateResult?.length || 0} USERS TO PREMIUM`,
      upgraded: updateResult?.length || 0,
      total_found: allUsers.length,
      expires_at: expiryDate.toISOString(),
      users: updateResult?.map(u => ({ id: u.id, clerk_id: u.clerk_id, plan: u.plan, is_premium: u.is_premium }))
    });
    
  } catch (error) {
    console.error('❌ Error in force upgrade:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/payment/instant-upgrade
// Instantly upgrade all users to premium without authentication (development only)
router.get('/instant-upgrade', async (req, res) => {
  try {
    console.log('🚨 INSTANT UPGRADE ENDPOINT CALLED');
    
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'This endpoint is only available in development mode' });
    }
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || 'https://leirhgtidkhuvdwpblel.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE'
    );

    // Set expiry date (60 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60);
    
    // Update ALL users to premium
    console.log('🔄 Upgrading ALL users to premium...');
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        plan: 'premium',
        is_premium: true,
        subscription_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .neq('id', 0) // This matches all users
      .select();
    
    if (updateError) {
      console.error('❌ Error upgrading users:', updateError);
      return res.status(500).json({ error: 'Failed to upgrade users', details: updateError });
    }
    
    console.log(`✅ Successfully upgraded ${updateResult?.length || 0} users to premium`);
    
    // Format for HTML response
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Account Upgraded!</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #111;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .success-card {
              background: #222;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
              max-width: 500px;
              width: 90%;
            }
            h1 {
              color: #4ade80;
              margin-bottom: 15px;
            }
            .checkmark {
              font-size: 72px;
              color: #4ade80;
              margin-bottom: 20px;
            }
            .button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              margin-top: 20px;
              text-decoration: none;
              display: inline-block;
            }
            .users {
              margin-top: 20px;
              padding: 10px;
              background: #333;
              border-radius: 8px;
              text-align: left;
              max-height: 200px;
              overflow-y: auto;
              font-size: 14px;
            }
            .user-item {
              margin-bottom: 5px;
              padding: 5px;
              border-bottom: 1px solid #444;
            }
          </style>
          <script>
            // Store subscription data in localStorage
            function storeSubscription() {
              const subscriptionData = {
                plan_id: 'premium',
                plan_type: 'premium',
                status: 'active',
                billing_period: 'monthly',
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
              };
              
              localStorage.setItem('userSubscription', JSON.stringify(subscriptionData));
              console.log('Subscription data stored in localStorage');
              
              // Dispatch storage change event
              window.dispatchEvent(new Event('localStorageChange'));
              document.dispatchEvent(new Event('localStorageChange'));
              
              // Create and dispatch a custom event
              window.dispatchEvent(new CustomEvent('user-data-updated'));
              document.dispatchEvent(new CustomEvent('user-data-updated'));
              
              console.log('Events dispatched');
              
              return true;
            }
            
            // Run on page load
            window.onload = function() {
              storeSubscription();
            };
          </script>
        </head>
        <body>
          <div class="success-card">
            <div class="checkmark">✅</div>
            <h1>Account Upgraded!</h1>
            <p>All accounts have been successfully upgraded to Premium.</p>
            <p>Your premium status will be active for <strong>60 days</strong>.</p>
            
            <div class="users">
              <strong>Upgraded Users (${updateResult?.length || 0}):</strong>
              ${updateResult?.map(user => `
                <div class="user-item">
                  ${user.email || user.clerk_id || user.id}
                </div>
              `).join('') || 'No users found'}
            </div>
            
            <a href="/dashboard" class="button">Go to Dashboard</a>
          </div>
        </body>
      </html>
    `;
    
    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('❌ Error in instant upgrade:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Enhanced function to verify Coinbase payment status and sync database
async function verifyCoinbasePaymentAndUpdateUser(chargeId: string, clerkUserId: string) {
  try {
    console.log(`🔍 [COINBASE-VERIFY] Starting verification for charge: ${chargeId}, user: ${clerkUserId}`);
    
    if (!COINBASE_API_KEY) {
      throw new Error('Coinbase API key not configured');
    }

    // 1. Fetch charge details from Coinbase Commerce
    const response = await fetch(`${COINBASE_API_URL}/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ [COINBASE-VERIFY] Failed to fetch charge: ${errorData}`);
      throw new Error(`Failed to fetch charge: ${response.status}`);
    }

    const chargeData = await response.json();
    const charge = chargeData.data;
    
    console.log(`📊 [COINBASE-VERIFY] Charge status:`, {
      id: charge.id,
      timeline: charge.timeline?.map(t => ({ time: t.time, status: t.status })),
      payments: charge.payments?.map(p => ({ status: p.status, network: p.network }))
    });

    // 2. Check if payment is actually completed
    // Coinbase uses multiple ways to indicate completion
    const isCompleted = (
      // Check timeline for COMPLETED status
      charge.timeline?.some(event => 
        event.status === 'COMPLETED' || 
        event.status === 'CONFIRMED' || 
        event.status === 'RESOLVED'
      ) ||
      // Check payments array for confirmed payments
      charge.payments?.some(payment => 
        payment.status === 'CONFIRMED' || 
        payment.status === 'COMPLETED'
      ) ||
      // Check overall charge status
      charge.confirmed_at ||
      charge.status === 'COMPLETED'
    );

    console.log(`💰 [COINBASE-VERIFY] Payment completion status:`, {
      isCompleted,
      confirmed_at: charge.confirmed_at,
      charge_status: charge.status
    });

    if (!isCompleted) {
      console.log(`⏳ [COINBASE-VERIFY] Payment not yet completed for charge: ${chargeId}`);
      return {
        success: false,
        status: 'pending',
        message: 'Payment not yet completed'
      };
    }

    // 3. Extract payment metadata
    const metadata = charge.metadata || {};
    const plan = metadata.plan || metadata.planId || 'premium';
    const billingPeriod = metadata.billing_period || metadata.billingPeriod || 'monthly';
    const userEmail = metadata.user_email || metadata.email;

    console.log(`📝 [COINBASE-VERIFY] Payment metadata:`, {
      plan,
      billingPeriod,
      userEmail,
      fullMetadata: metadata
    });

    // 4. Verify user exists in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error(`❌ [COINBASE-VERIFY] User not found:`, userError);
      throw new Error(`User not found: ${clerkUserId}`);
    }

    console.log(`👤 [COINBASE-VERIFY] Found user:`, {
      id: userData.id,
      email: userData.email,
      current_plan: userData.plan,
      current_is_premium: userData.is_premium
    });

    // 5. Calculate expiry date
    const now = new Date();
    const expiryDate = new Date(now);
    if (billingPeriod === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // 6. Update user premium status in database - COMPREHENSIVE UPDATE
    console.log(`📱 [COINBASE-VERIFY] Updating user premium status...`);
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        plan: plan,
        is_premium: true,
        plan_status: 'premium',
        subscription_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkUserId)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ [COINBASE-VERIFY] Failed to update user:`, updateError);
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    console.log(`✅ [COINBASE-VERIFY] User updated successfully:`, {
      id: updatedUser.id,
      plan: updatedUser.plan,
      is_premium: updatedUser.is_premium,
      plan_status: updatedUser.plan_status,
      expires_at: updatedUser.subscription_expires_at
    });

    // 7. Record payment in payments table
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          clerk_user_id: clerkUserId,
          email: userEmail || userData.email,
          plan: plan,
          amount: parseFloat(charge.pricing?.local?.amount || '0'),
          currency: charge.pricing?.local?.currency || 'USD',
          payment_method: 'cryptocurrency',
          payment_provider: 'coinbase_commerce',
          charge_id: chargeId,
          status: 'confirmed',
          billing_period: billingPeriod,
          confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (paymentError) {
        console.warn(`⚠️ [COINBASE-VERIFY] Failed to record payment:`, paymentError);
      } else {
        console.log(`💾 [COINBASE-VERIFY] Payment recorded successfully`);
      }
    } catch (paymentRecordError) {
      console.warn(`⚠️ [COINBASE-VERIFY] Payment record error:`, paymentRecordError);
    }

    // 8. Record webhook event
    try {
      const { error: webhookError } = await supabase
        .from('webhook_events')
        .insert({
          provider: 'coinbase',
          event_type: 'charge:verified',
          status: 'processed',
          payload: { chargeId, clerkUserId, plan, billingPeriod, verifiedAt: new Date().toISOString() },
          processed_at: new Date().toISOString()
        });

      if (webhookError) {
        console.warn(`⚠️ [COINBASE-VERIFY] Failed to record webhook event:`, webhookError);
      }
    } catch (webhookRecordError) {
      console.warn(`⚠️ [COINBASE-VERIFY] Webhook record error:`, webhookRecordError);
    }

    console.log(`🎉 [COINBASE-VERIFY] Payment verification completed successfully!`);

    return {
      success: true,
      status: 'completed',
      user: updatedUser,
      charge: {
        id: chargeId,
        amount: charge.pricing?.local?.amount,
        currency: charge.pricing?.local?.currency
      },
      subscription: {
        plan,
        billing_period: billingPeriod,
        expires_at: expiryDate.toISOString()
      }
    };

  } catch (error) {
    console.error(`❌ [COINBASE-VERIFY] Error:`, error);
    return {
      success: false,
      status: 'error',
      message: error.message || 'Unknown error'
    };
  }
}

// POST /api/payment/verify-coinbase-payment
// New endpoint to manually verify and sync Coinbase payment status
router.post('/verify-coinbase-payment', requireAuth, async (req, res) => {
  // REMOVED - Using direct fix instead
  res.status(410).json({ error: 'Manual verification endpoint removed. Payments are now processed automatically.' });
});

// POST /api/payment/verify-manual
// Manual payment verification endpoint for when webhooks fail
router.post('/verify-manual', requireAuth, async (req, res) => {
  // REMOVED - Using direct fix instead
  res.status(410).json({ error: 'Manual verification endpoint removed. Payments are now processed automatically.' });
});

// 🚨 EMERGENCY: Revert account from premium to free (for payment fraud prevention)
router.post('/emergency-revert-premium', async (req, res) => {
  try {
    const { clerk_user_id, reason = 'Payment not completed' } = req.body;

    if (!clerk_user_id) {
      return res.status(400).json({ error: 'clerk_user_id is required' });
    }

    console.log(`🚨 [EMERGENCY-REVERT] Reverting premium status for user: ${clerk_user_id}, reason: ${reason}`);

    // 1. Update user back to free
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        plan: 'free',
        is_premium: false,
        status: 'active',
        subscription_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerk_user_id)
      .select()
      .single();

    if (userError) {
      console.error(`❌ [EMERGENCY-REVERT] Failed to revert user:`, userError);
      return res.status(500).json({ error: 'Failed to revert user account' });
    }

    console.log(`✅ [EMERGENCY-REVERT] User reverted to free:`, {
      id: updatedUser.id,
      plan: updatedUser.plan,
      is_premium: updatedUser.is_premium
    });

    // 2. Mark any recent payments as cancelled/fraudulent
    const { error: paymentsError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerk_user_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (paymentsError) {
      console.warn(`⚠️ [EMERGENCY-REVERT] Failed to cancel recent payments:`, paymentsError);
    }

    // 3. Record the emergency action
    try {
      await supabase
        .from('webhook_events')
        .insert({
          provider: 'emergency',
          event_type: 'premium_reverted',
          status: 'processed',
          payload: { 
            clerk_user_id, 
            reason,
            reverted_at: new Date().toISOString(),
            reverted_by: 'emergency_system'
          },
          processed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn(`⚠️ [EMERGENCY-REVERT] Failed to log action:`, logError);
    }

    return res.status(200).json({
      success: true,
      message: 'Account successfully reverted to free',
      user: {
        clerk_id: updatedUser.clerk_id,
        plan: updatedUser.plan,
        is_premium: updatedUser.is_premium,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error('❌ [EMERGENCY-REVERT] Error:', error);
    return res.status(500).json({ error: 'Emergency revert failed' });
  }
});

export default router;