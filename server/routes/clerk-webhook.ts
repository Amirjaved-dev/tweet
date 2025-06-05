import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';

// Handle GET requests for the Clerk webhook endpoint
export function handleClerkWebhookGet(req: Request, res: Response) {
  console.log('GET request received on /api/clerk-webhook');
  return res.status(200).json({
    status: 'ok',
    message: 'Clerk webhook endpoint is active and ready to receive events',
    timestamp: new Date().toISOString()
  });
}

// Clerk webhook handler for syncing users to Supabase
export async function handleClerkWebhook(req: Request, res: Response) {
  try {
    console.log('POST request received on /api/clerk-webhook');
    
    // Get Svix headers for verification
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing Svix headers');
      return res.status(400).json({ error: 'Missing Svix headers' });
    }
    
    // Verify webhook signature
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    // Skip verification in development mode if no secret is configured
    let isValidSignature = true;
    if (webhookSecret) {
      try {
        const timestampAsNumber = parseInt(svix_timestamp);
        // Check if the timestamp is too old (5 minutes)
        if (isNaN(timestampAsNumber) || Date.now() - timestampAsNumber > 5 * 60 * 1000) {
          return res.status(401).json({ error: 'Timestamp too old' });
        }
        
        // Create the signature message from the timestamp, id, and body
        const payload = JSON.stringify(req.body);
        const signatureMessage = `${svix_timestamp}.${svix_id}.${payload}`;
        
        // Create an HMAC with the webhook secret
        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(signatureMessage);
        const expectedSignature = hmac.digest('hex');
        
        // Compare signatures
        isValidSignature = svix_signature === expectedSignature;
      } catch (error) {
        console.error('Error verifying Clerk webhook signature:', error);
        isValidSignature = false;
      }
    } else {
      console.warn('CLERK_WEBHOOK_SECRET not configured, skipping signature verification');
    }
    
    if (!isValidSignature) {
      console.error('Invalid Clerk webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { type, data } = req.body;
    console.log(`Received Clerk webhook: ${type}`);
    
    // Handle user creation
    if (type === 'user.created') {
      const { id: clerkId, email_addresses, username, first_name, last_name } = data;
      
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
    else if (type === 'user.updated') {
      const { id: clerkId, email_addresses, username, first_name, last_name } = data;
      
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
    else if (type === 'user.deleted') {
      const { id: clerkId } = data;
      
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
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 