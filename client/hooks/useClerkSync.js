import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';

export function useClerkSync() {
  const { user: clerkUser, isLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Function to manually sync a user from Clerk to Supabase
  const syncUserToSupabase = async () => {
    if (!isLoaded || !clerkUser) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (!email) {
        throw new Error('No email found for user');
      }

      console.log('Starting sync for Clerk user:', clerkUser.id, 'email:', email);

      // First check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking user existence:', fetchError);
        throw new Error('Failed to check if user exists');
      }

      if (!existingUser) {
        console.log('User does not exist in Supabase. Creating new user...');
        // Extract username from Clerk or email
        const username = clerkUser.username || 
                         clerkUser.firstName || 
                         email.split('@')[0];
                         
        // User doesn't exist, create them
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            clerk_user_id: clerkUser.id,
            email: email,
            plan_status: 'free',
            username: username,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw new Error('Failed to create user in database: ' + insertError.message);
        }

        console.log('User created in Supabase:', newUser);
        setSuccess(true);
        
        // Dispatch event to notify the app that user data has been updated
        document.dispatchEvent(new Event('user-data-updated'));
        
        return { success: true, user: newUser };
      } else {
        console.log('User exists in Supabase. Updating user data...');
        // User exists, update them
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: email,
            username: clerkUser.username || existingUser.username || email.split('@')[0],
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', clerkUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw new Error('Failed to update user in database: ' + updateError.message);
        }

        console.log('User updated in Supabase:', updatedUser);
        setSuccess(true);
        
        // Dispatch event to notify the app that user data has been updated
        document.dispatchEvent(new Event('user-data-updated'));
        
        return { success: true, user: updatedUser };
      }
    } catch (err) {
      console.error('Error syncing user to Supabase:', err);
      setError(err.message || 'Failed to sync user');
      return { success: false, error: err.message || 'Failed to sync user' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncUserToSupabase,
    isLoading,
    error,
    success
  };
} 