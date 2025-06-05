import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                       process.env.SUPABASE_ANON_KEY;

// Use development placeholders if environment variables are missing
const isDevelopment = process.env.NODE_ENV === 'development';

const finalSupabaseUrl = supabaseUrl || (isDevelopment ? 'https://leirhgtidkhuvdwpblel.supabase.co' : undefined);
const finalServiceKey = supabaseServiceKey || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5Mzk2NywiZXhwIjoyMDY0MTY5OTY3fQ.px1Bc-co-k3g5Xzbymv9pxTz2tUAY4tZGgcrLAP5EPk' : undefined);
const finalAnonKey = supabaseAnonKey || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE' : undefined);

if (!finalSupabaseUrl || !finalServiceKey) {
  if (isDevelopment) {
    console.warn('Using placeholder Supabase credentials in development mode');
  } else {
    throw new Error('Missing Supabase environment variables');
  }
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(
  finalSupabaseUrl || 'https://placeholder.supabase.co', 
  finalServiceKey || 'placeholder_key'
);

// Create Supabase client with anon key for client-like operations
export const supabasePublic = createClient(
  finalSupabaseUrl || 'https://placeholder.supabase.co', 
  finalAnonKey || 'placeholder_key'
);

/**
 * Get user profile from Supabase
 * @param clerkId - Clerk user ID
 * @returns User profile data
 */
export async function getUserProfile(clerkId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
}

/**
 * Update user's plan in Supabase
 * @param clerkId - Clerk user ID
 * @param plan - User plan (free or premium)
 * @returns Updated user data
 */
export async function updateUserPlan(clerkId: string, plan: 'free' | 'premium') {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        plan: plan,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserPlan:', error);
    throw error;
  }
}

/**
 * Sync user data with Supabase (create if not exists)
 * @param clerkId - Clerk user ID
 * @param email - User email
 * @returns User data
 */
export async function syncUser(clerkId: string, email: string) {
  try {
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If user doesn't exist, create them with default free plan
    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email: email,
          plan: 'free'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newUser;
    }

    return existingUser;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}

export async function createUserProfile(clerkId: string, email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email,
        plan: 'free'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
} 