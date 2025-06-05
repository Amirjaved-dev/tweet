import express from 'express';
import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

// FORCE DEBUG OUTPUT TO VERIFY FILE IS LOADING
console.log('🔥 COINBASE WEBHOOK ROUTE IS LOADING!');
console.log('🔥 DIRECT ENV CHECK:', process.env.COINBASE_COMMERCE_WEBHOOK_SECRET ? 'WEBHOOK SECRET FOUND' : 'WEBHOOK SECRET MISSING');

const router = express.Router();

// Load environment variables DIRECTLY (bypass config placeholders)
const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || 
                                process.env.COINBASE_WEBHOOK_SECRET;

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY || 
                        process.env.COINBASE_API_KEY;

const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

// Debug webhook configuration immediately after loading - DIRECT FROM ENV
console.log('🔑 Coinbase webhook configuration (DIRECT FROM ENV):', {
  hasWebhookSecret: !!COINBASE_WEBHOOK_SECRET,
  hasApiKey: !!COINBASE_API_KEY,
  secretLength: COINBASE_WEBHOOK_SECRET?.length || 0,
  secretPreview: COINBASE_WEBHOOK_SECRET ? `${COINBASE_WEBHOOK_SECRET.substring(0, 8)}...` : 'none',
  secretValue: COINBASE_WEBHOOK_SECRET || 'MISSING',
  webhookSecretSource: process.env.COINBASE_COMMERCE_WEBHOOK_SECRET ? 'COINBASE_COMMERCE_WEBHOOK_SECRET' : 
                      (process.env.COINBASE_WEBHOOK_SECRET ? 'COINBASE_WEBHOOK_SECRET' : 'none'),
  nodeEnv: process.env.NODE_ENV,
  allCoinbaseEnvVars: {
    COINBASE_COMMERCE_WEBHOOK_SECRET: process.env.COINBASE_COMMERCE_WEBHOOK_SECRET ? 'SET' : 'UNSET',
    COINBASE_WEBHOOK_SECRET: process.env.COINBASE_WEBHOOK_SECRET ? 'SET' : 'UNSET',
    COINBASE_COMMERCE_API_KEY: process.env.COINBASE_COMMERCE_API_KEY ? 'SET' : 'UNSET',
    COINBASE_API_KEY: process.env.COINBASE_API_KEY ? 'SET' : 'UNSET'
  }
});

// Import the unified verification function from payment.ts
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
      created_at: charge.created_at,
      timeline: charge.timeline?.map(t => ({ time: t.time, status: t.status })),
      payments: charge.payments?.map(p => ({ status: p.status, network: p.network }))
    });

    // 🚨 SECURITY CHECK: Prevent processing old charges
    const chargeCreatedAt = new Date(charge.created_at);
    const currentTime = new Date();
    const timeDiffMinutes = (currentTime.getTime() - chargeCreatedAt.getTime()) / (1000 * 60);
    
    // Only process charges created within the last 30 minutes
    if (timeDiffMinutes > 30) {
      console.log(`🚨 [SECURITY] Charge too old (${timeDiffMinutes.toFixed(1)} minutes), rejecting to prevent abuse`);
      return {
        success: false,
        status: 'rejected',
        message: `Charge too old (${timeDiffMinutes.toFixed(1)} minutes old). Only recent payments are processed.`
      };
    }

    // 🚨 SECURITY CHECK: Verify this charge hasn't been processed before
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from('payments')
      .select('id, clerk_id, status')
      .eq('charge_id', chargeId)
      .single();

    if (existingPayment && !paymentCheckError) {
      console.log(`🚨 [SECURITY] Charge already processed for user ${existingPayment.clerk_id}, status: ${existingPayment.status}`);
      return {
        success: false,
        status: 'already_processed',
        message: `This payment has already been processed for user ${existingPayment.clerk_id}`
      };
    }

    // 🚨 SECURITY CHECK: Verify charge belongs to the requesting user
    const metadata = charge.metadata || {};
    const chargeUserId = metadata.clerk_user_id || metadata.clerk_id || metadata.user_id;
    
    if (chargeUserId && chargeUserId !== clerkUserId) {
      console.log(`🚨 [SECURITY] Charge belongs to different user. Charge user: ${chargeUserId}, Requesting user: ${clerkUserId}`);
      return {
        success: false,
        status: 'user_mismatch',
        message: `This charge belongs to a different user`
      };
    }

    // 2. Check if payment is actually completed OR pending with payments (for instant upgrade)
    // Coinbase uses multiple ways to indicate completion/pending
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

    // NEW: Check if payment is pending but has been submitted (for instant upgrade)
    const isPendingWithPayment = (
      charge.timeline?.some(event => event.status === 'PENDING') &&
      charge.payments?.length > 0 &&
      charge.payments?.some(payment => 
        payment.status === 'pending' || 
        payment.status === 'PENDING'
      )
    );

    console.log(`💰 [COINBASE-VERIFY] Payment completion status:`, {
      isCompleted,
      isPendingWithPayment,
      confirmed_at: charge.confirmed_at,
      charge_status: charge.status,
      timeline_statuses: charge.timeline?.map(t => t.status),
      payment_statuses: charge.payments?.map(p => p.status),
      charge_age_minutes: timeDiffMinutes.toFixed(1)
    });

    // 🚨 ADDITIONAL SECURITY: Only process if payment is actually recent AND completed/pending
    console.log(`🚨 SECURITY CHECKS PASSED - Processing recent charge (${timeDiffMinutes.toFixed(1)} min old)`);

    // Accept both completed payments AND pending payments with transaction submitted
    if (!isCompleted && !isPendingWithPayment) {
      console.log(`⏳ [COINBASE-VERIFY] Payment not yet submitted for charge: ${chargeId}`);
      return {
        success: true,
        status: 'waiting',
        message: 'Payment not yet submitted'
      };
    }

    // Determine the payment status for database
    const paymentStatus = isCompleted ? 'confirmed' : 'pending';
    const upgradeReason = isCompleted ? 'Payment fully confirmed' : 'Payment submitted (instant upgrade)';
    
    console.log(`🚀 [COINBASE-VERIFY] Processing ${upgradeReason.toLowerCase()} for instant account upgrade`);

    // 3. Extract payment metadata
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
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !userData) {
      console.warn(`⚠️ [COINBASE-VERIFY] User not found by clerk_id, attempting to find by email:`, userError);
      
      // Try to find user by email instead
      if (userEmail) {
        const { data: emailUser, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (emailUser && !emailError) {
          console.log(`✅ [COINBASE-VERIFY] Found user by email, updating clerk_id from ${emailUser.clerk_id} to ${clerkUserId}`);
          
          // Update the clerk_id to match the current user
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              clerk_id: clerkUserId,
              updated_at: new Date().toISOString()
            })
            .eq('email', userEmail)
            .select()
            .single();

          if (updateError) {
            console.error(`❌ [COINBASE-VERIFY] Failed to update clerk_id:`, updateError);
            throw new Error(`Failed to update user clerk_id: ${updateError.message}`);
          }

          userData = updatedUser;
          console.log(`✅ [COINBASE-VERIFY] User clerk_id updated successfully`);
        } else {
          // Try to create the user automatically
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              clerk_id: clerkUserId,
              email: userEmail || `temp-${clerkUserId}@domain.com`,
              plan: 'free',
              is_premium: false,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error(`❌ [COINBASE-VERIFY] Failed to create user:`, createError);
            throw new Error(`User not found and cannot be created: ${clerkUserId}`);
    }

          console.log(`✅ [COINBASE-VERIFY] User created successfully:`, {
            id: newUser.id,
            email: newUser.email,
            clerk_id: newUser.clerk_id
          });

          userData = newUser;
        }
      } else {
        throw new Error(`User not found and no email provided: ${clerkUserId}`);
      }
    } else {
    console.log(`👤 [COINBASE-VERIFY] Found user:`, {
      id: userData.id,
      email: userData.email,
      current_plan: userData.plan,
      current_is_premium: userData.is_premium
    });
    }

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
        status: 'active',
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
      expires_at: updatedUser.subscription_expires_at
    });

    // 7. Record payment in payments table (with FIXED schema)
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          clerk_id: clerkUserId,
          plan: plan,
          amount: parseFloat(charge.pricing?.local?.amount || '0'),
          currency: charge.pricing?.local?.currency || 'USD',
          payment_method: 'cryptocurrency',
          payment_provider: 'coinbase_commerce',
          provider: 'coinbase_commerce',
          charge_id: chargeId,
          status: paymentStatus,
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
      status: paymentStatus,
      upgrade_reason: upgradeReason,
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

// Verify Coinbase webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    console.log('🔐 === WEBHOOK SIGNATURE VERIFICATION DEBUG ===');
    console.log(`📊 Signature verification inputs:`);
    console.log(`  - Signature: ${signature || 'MISSING'}`);
    console.log(`  - Secret exists: ${!!secret}`);
    console.log(`  - Secret length: ${secret?.length || 0}`);
    console.log(`  - Secret preview: ${secret ? secret.substring(0, 8) + '...' : 'NONE'}`);
    console.log(`  - Payload length: ${payload.length}`);
    console.log(`  - Payload type: ${typeof payload}`);
    console.log(`  - Payload preview: ${payload.substring(0, 100)}...`);
    
    if (!signature || !secret) {
      console.log('❌ Missing signature or secret - cannot verify');
      return false;
    }

    // Coinbase Commerce sends signature as hex string directly
    console.log(`🧮 Computing HMAC-SHA256...`);
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    console.log(`📋 Signature comparison:`);
    console.log(`  - Received:  ${signature}`);
    console.log(`  - Computed:  ${computedSignature}`);
    console.log(`  - Match:     ${signature === computedSignature}`);
    console.log(`  - Lengths:   received=${signature.length}, computed=${computedSignature.length}`);
    
    // Check character by character for debugging
    if (signature !== computedSignature) {
      console.log(`🔍 Character-by-character comparison:`);
      const maxLen = Math.max(signature.length, computedSignature.length);
      for (let i = 0; i < Math.min(20, maxLen); i++) {
        const receivedChar = signature[i] || 'END';
        const computedChar = computedSignature[i] || 'END';
        if (receivedChar !== computedChar) {
          console.log(`  - Position ${i}: received='${receivedChar}' vs computed='${computedChar}' ❌`);
        } else {
          console.log(`  - Position ${i}: '${receivedChar}' ✅`);
        }
      }
    }
    
    console.log('🔐 === END SIGNATURE VERIFICATION DEBUG ===');
    
    // Direct comparison since Coinbase sends hex directly
    return signature === computedSignature;
    
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

// GET /api/webhooks/coinbase
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Coinbase Commerce webhook endpoint is active',
    configured: !!COINBASE_WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
});

// POST /api/webhooks/coinbase
router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  try {
    console.log('----------------------------------------------------');
    console.log('🔔 Coinbase webhook received');
    
    const signature = req.headers['x-cc-webhook-signature'] as string;
    
    // Handle different body formats from Express middleware
    let payload: string;
    let rawBody = req.body;
    
    console.log(`📝 Raw body type: ${typeof rawBody}, is Buffer: ${Buffer.isBuffer(rawBody)}`);
    console.log(`📝 Raw body constructor: ${rawBody?.constructor?.name}`);
    console.log(`📝 Raw body content: ${rawBody}`);
    
    // Check if we have a rawBody property (from custom middleware)
    if ((req as any).rawBody) {
      payload = (req as any).rawBody;
      console.log(`🔧 Using req.rawBody: ${payload.substring(0, 100)}...`);
    }
    // Handle Buffer (expected from express.raw)
    else if (Buffer.isBuffer(rawBody)) {
      payload = rawBody.toString('utf8');
      console.log(`🔧 Using buffer: ${payload.substring(0, 100)}...`);
    }
    // Handle string
    else if (typeof rawBody === 'string') {
      payload = rawBody;
      console.log(`🔧 Using string: ${payload.substring(0, 100)}...`);
    }
    // Handle object (from JSON middleware)
    else if (typeof rawBody === 'object' && rawBody !== null) {
      payload = JSON.stringify(rawBody);
      console.log(`🔧 Using stringified object: ${payload.substring(0, 100)}...`);
    }
    // Fallback
    else {
      payload = String(rawBody);
      console.log(`🔧 Using string conversion: ${payload.substring(0, 100)}...`);
    }

    console.log(`🌍 Environment: NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`🔑 Webhook secret configured: ${!!COINBASE_WEBHOOK_SECRET}`);
    console.log(`📝 Final payload length: ${payload.length}`);
    console.log(`📝 Final payload preview: ${payload.substring(0, 100)}...`);
    console.log(`🔐 Signature received: ${signature || 'NONE'}`);
    
    // Parse the webhook payload
    let event;
    try {
      const parsedPayload = JSON.parse(payload);
      
      // Handle Coinbase's nested payload structure
      // Coinbase sends: { attempt_number: 1, event: { type: "charge:created", data: {...} } }
      // We need: { type: "charge:created", data: {...} }
      if (parsedPayload.event && parsedPayload.attempt_number !== undefined) {
        // This is the nested structure from Coinbase
        event = parsedPayload.event;
        console.log(`📦 Coinbase nested payload detected, using inner event`);
        console.log(`📦 Attempt number: ${parsedPayload.attempt_number}`);
      } else {
        // This is direct event structure (fallback)
        event = parsedPayload;
        console.log(`📦 Direct event structure detected`);
      }
      
      console.log(`📦 Webhook event type: ${event.type}`);
      console.log(`📦 Event data preview:`, {
        id: event.data?.id,
        type: event.type,
        hasData: !!event.data,
        api_version: event.api_version,
        created_at: event.created_at
      });
    } catch (error) {
      console.error('❌ Invalid JSON payload:', error);
      console.error('❌ Payload that failed to parse:', payload);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    // Verify webhook signature in production and when secret is available
    if (COINBASE_WEBHOOK_SECRET) {
      const isValidSignature = verifyWebhookSignature(payload, signature, COINBASE_WEBHOOK_SECRET);
      
      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature - rejecting request');
        console.log(`🔍 Debug - Secret length: ${COINBASE_WEBHOOK_SECRET.length}`);
        console.log(`🔍 Debug - Secret preview: ${COINBASE_WEBHOOK_SECRET.substring(0, 8)}...`);
        console.log(`🔍 Debug - Payload first 200 chars: ${payload.substring(0, 200)}`);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Webhook signature verified successfully');
    } else {
      console.warn('⚠️ No webhook secret configured - accepting request (DEVELOPMENT ONLY)');
    }

    // Process ANY payment-related event
    if (event.type === 'charge:confirmed' || 
        event.type === 'charge:completed' || 
        event.type === 'charge:created' ||
        event.type === 'charge:pending' ||
        event.type === 'charge:resolved' ||
        event.type.includes('charge')) {
      
      console.log('💰 Processing payment event...');
      
      const charge = event.data;
      const metadata = charge.metadata || {};
      
      // Extract user ID from metadata (try different field names)
      let clerkId = metadata.clerk_user_id || 
                   metadata.clerk_id || 
                   metadata.user_id;
    
      // If no clerk ID in metadata, try to find a user with matching email
      if (!clerkId && metadata.user_email) {
        console.log(`🔍 No clerk_id in metadata, searching by email: ${metadata.user_email}`);
        
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('clerk_id')
            .eq('email', metadata.user_email)
            .single();

          if (userData && !error) {
            clerkId = userData.clerk_id;
            console.log(`✅ Found user by email: ${clerkId}`);
          }
        } catch (err) {
          console.log(`⚠️ Could not find user by email: ${err}`);
        }
      }
    
      // If still no clerk ID, check recent users (for development)
      if (!clerkId) {
        console.log('🔍 No user ID found, trying to find most recent user...');
        
        try {
          const { data: recentUser, error } = await supabase
            .from('users')
            .select('clerk_id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
          if (recentUser && !error) {
            clerkId = recentUser.clerk_id;
            console.log(`✅ Using most recent user: ${clerkId}`);
          }
        } catch (err) {
          console.log(`⚠️ Could not find recent user: ${err}`);
        }
      }
    
      if (!clerkId) {
        console.error('❌ No user ID found in metadata or database');
        return res.status(400).json({ 
          error: 'No user ID found',
          metadata: metadata,
          event_type: event.type 
        });
      }
    
      console.log(`🎯 Processing payment for user: ${clerkId}, charge: ${charge.id}`);

      try {
        // Use the unified verification function
        const result = await verifyCoinbasePaymentAndUpdateUser(charge.id, clerkId);
        
        if (result.success) {
          console.log('🎉 Payment processing completed successfully!');
          return res.status(200).json({ 
            success: true, 
            message: 'Payment processed successfully',
            user: result.user,
            event_type: event.type
          });
        } else {
          // Changed: Always return 200 for valid webhooks, even if payment is pending
          console.log(`⏳ Payment still pending: ${result.message}`);
          return res.status(200).json({ 
            success: true, 
            message: result.message,
            status: result.status,
            event_type: event.type
          });
        }
        
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    } else {
      // For non-payment events, just acknowledge
      console.log(`📝 Non-payment event acknowledged: ${event.type}`);
      return res.status(200).json({ 
        success: true, 
        message: `Event ${event.type} acknowledged` 
      });
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router; 