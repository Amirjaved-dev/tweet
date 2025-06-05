import express from 'express';
import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

const router = express.Router();

// Webhook secret for verification
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Add a GET endpoint to handle test requests
router.get('/', (req, res) => {
  console.log('GET request received on /api/webhooks/clerk');
  res.status(200).json({
    status: 'ok',
    message: 'Clerk webhook endpoint is active and ready to receive events',
    timestamp: new Date().toISOString()
  });
});

// Verify Clerk webhook signature
function verifyClerkWebhookSignature(payload: string, svix_id: string, svix_timestamp: string, svix_signature: string): boolean {
  if (!CLERK_WEBHOOK_SECRET) {
    console.warn('CLERK_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Skip verification in development
  }

  try {
    console.log('Verifying Clerk webhook signature');
    console.log(`Svix ID: ${svix_id}`);
    console.log(`Svix timestamp: ${svix_timestamp}`);
    console.log(`Svix signature: ${svix_signature}`);
    console.log(`Webhook secret length: ${CLERK_WEBHOOK_SECRET.length}`);
    
    const timestampAsNumber = parseInt(svix_timestamp);
    // Check if the timestamp is too old (5 minutes)
    if (isNaN(timestampAsNumber) || Date.now() - timestampAsNumber > 5 * 60 * 1000) {
      console.error('Timestamp is invalid or too old');
      console.log(`Current time: ${Date.now()}, Webhook timestamp: ${timestampAsNumber}`);
      console.log(`Difference: ${Date.now() - timestampAsNumber}ms`);
      return false;
    }

    // Create the signature message from the timestamp, id, and body
    const signatureMessage = `${svix_timestamp}.${svix_id}.${payload}`;
    console.log(`Signature message length: ${signatureMessage.length}`);
    
    // Get the signature from Clerk
    const signature = svix_signature;
    
    // Create an HMAC with the webhook secret
    const hmac = crypto.createHmac('sha256', CLERK_WEBHOOK_SECRET);
    hmac.update(signatureMessage);
    const expectedSignature = hmac.digest('hex');
    
    console.log(`Expected signature: ${expectedSignature}`);
    console.log(`Do signatures match? ${signature === expectedSignature}`);
    
    // Compare signatures
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error in timingSafeEqual comparison:', error);
      // Fallback to direct comparison if Buffer comparison fails
      return signature === expectedSignature;
    }
  } catch (error) {
    console.error('Error verifying Clerk webhook signature:', error);
    return false;
  }
}

// POST /api/webhooks/clerk
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('----------------------------------------------------');
    console.log('POST request received on /api/webhooks/clerk');
    console.log('Full headers:', JSON.stringify(req.headers, null, 2));
    
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;
    
    // Log headers for debugging
    console.log('Webhook headers:', {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    });
    
    // Get the webhook body
    let payload = '';
    if (Buffer.isBuffer(req.body)) {
      payload = req.body.toString('utf8');
      console.log('Request body is a Buffer, converted to string');
    } else if (typeof req.body === 'string') {
      payload = req.body;
      console.log('Request body is already a string');
    } else if (typeof req.body === 'object') {
      payload = JSON.stringify(req.body);
      console.log('Request body is an object, stringified to JSON');
    } else {
      console.error('Unexpected body type:', typeof req.body);
      return res.status(400).json({ error: 'Invalid body format' });
    }
    
    console.log(`Webhook payload (${payload.length} bytes):`, payload.substring(0, 100) + (payload.length > 100 ? '...' : ''));
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing Svix headers');
      return res.status(400).json({ error: 'Missing Svix headers' });
    }
    
    // Log webhook secret status
    console.log(`Clerk webhook secret configured: ${!!CLERK_WEBHOOK_SECRET}`);
    if (CLERK_WEBHOOK_SECRET) {
      console.log(`Secret length: ${CLERK_WEBHOOK_SECRET.length}`);
    }
    
    // Skip verification in development if no webhook secret
    let isValidSignature = true;
    if (CLERK_WEBHOOK_SECRET) {
      isValidSignature = verifyClerkWebhookSignature(
        payload, 
        svix_id, 
        svix_timestamp, 
        svix_signature
      );
      console.log(`Signature verification result: ${isValidSignature ? 'Valid' : 'Invalid'}`);
    } else {
      console.log('Skipping signature verification (no webhook secret)');
    }
    
    if (!isValidSignature) {
      console.error('Invalid Clerk webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(payload);
    } catch (error) {
      console.error('Error parsing webhook payload:', error);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    const eventType = event.type;
    
    console.log(`Received Clerk webhook: ${eventType}`);
    
    // Handle user creation
    if (eventType === 'user.created') {
      const { id: clerkId, email_addresses, username, first_name, last_name } = event.data;
      
      // Get primary email
      const primaryEmail = email_addresses && email_addresses.length > 0 
        ? email_addresses[0].email_address 
        : null;
      
      if (!primaryEmail) {
        console.error('No email found for user');
        return res.status(400).json({ error: 'No email found for user' });
      }
      
      // Check if user already exists in Supabase
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();
      
      // If user doesn't exist, create them
      if (checkError && checkError.code === 'PGRST116') {
        // Create the user in Supabase
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkId,
            email: primaryEmail,
            username: username || first_name || primaryEmail.split('@')[0],
            first_name: first_name || null,
            last_name: last_name || null,
            plan: 'free',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating user in Supabase:', createError);
          return res.status(500).json({ error: 'Failed to create user in database' });
        }
        
        console.log(`Created new user in Supabase: ${clerkId}`);
      } else if (checkError) {
        console.error('Error checking for existing user:', checkError);
        return res.status(500).json({ error: 'Database error while checking for existing user' });
      } else {
        console.log(`User already exists in Supabase: ${clerkId}`);
      }
    }
    
    // Handle user update
    else if (eventType === 'user.updated') {
      const { id: clerkId, email_addresses, username, first_name, last_name } = event.data;
      
      // Get primary email
      const primaryEmail = email_addresses && email_addresses.length > 0 
        ? email_addresses[0].email_address 
        : null;
      
      if (!primaryEmail) {
        console.error('No email found for user');
        return res.status(400).json({ error: 'No email found for user' });
      }
      
      // Update the user in Supabase
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email: primaryEmail,
          username: username || first_name || primaryEmail.split('@')[0],
          first_name: first_name || null,
          last_name: last_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', clerkId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user in Supabase:', updateError);
        return res.status(500).json({ error: 'Failed to update user in database' });
      }
      
      console.log(`Updated user in Supabase: ${clerkId}`);
    }
    
    // Handle user deletion
    else if (eventType === 'user.deleted') {
      const { id: clerkId } = event.data;
      
      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', checkError);
        return res.status(500).json({ error: 'Database error while checking for existing user' });
      }
      
      if (existingUser) {
        // Soft delete by updating status
        const { error: updateError } = await supabase
          .from('users')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', clerkId);
        
        if (updateError) {
          console.error('Error soft deleting user:', updateError);
          return res.status(500).json({ error: 'Failed to delete user in database' });
        }
        
        console.log(`Soft deleted user in Supabase: ${clerkId}`);
      } else {
        console.log(`User not found in Supabase for deletion: ${clerkId}`);
      }
    }
    
    // Return success
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 