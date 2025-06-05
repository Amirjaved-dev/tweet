import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';

interface SupabaseUser {
  id: string;
  clerk_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  plan: 'free' | 'premium';
  status?: string;
  created_at: string;
  updated_at?: string;
  // Legacy fields that might exist in some records
  is_premium?: boolean;
  plan_status?: string;
  subscription_expires_at?: string;
  [key: string]: any;
}

export function useUserData() {
  const { isLoaded, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Function to refresh user data
  const refreshUserData = useCallback(async (force = false) => {
    if (!clerkUser) {
      console.log('❌ refreshUserData: No clerkUser available');
      setSupabaseUser(null);
      setIsLoading(false);
      return;
    }

    // Prevent too frequent refreshes unless forced
    const now = Date.now();
    if (!force && now - lastRefresh < 2000) {
      console.log('⏩ refreshUserData: Skipping refresh - too recent (last refresh:', lastRefresh, 'now:', now, ')');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setLastRefresh(now);
      
      console.log('🔄 refreshUserData: Starting refresh for Clerk user:', clerkUser.id);
      
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUser.id)
        .single();

      console.log('📊 refreshUserData: Supabase query result:', {
        userData,
        fetchError,
        clerkId: clerkUser.id
      });

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('⚠️ refreshUserData: User not found in Supabase (PGRST116), will need manual sync');
          setSupabaseUser(null);
        } else {
          console.error('❌ refreshUserData: Error fetching user data:', fetchError);
          setError(fetchError.message);
        }
      } else if (userData) {
        console.log('✅ refreshUserData: Successfully fetched user data from Supabase:', {
          id: userData.id,
          email: userData.email,
          plan: userData.plan,
          is_premium: userData.is_premium,
          subscription_expires_at: userData.subscription_expires_at,
          full_data: userData
        });
        
        setSupabaseUser(userData as SupabaseUser);
        
        // Clear any error
        setError(null);
        
        // If user is premium, clear any payment in progress flags
        if (userData.plan === 'premium' || userData.is_premium) {
          console.log('🎉 refreshUserData: User has premium plan, clearing payment flags');
          localStorage.removeItem('paymentAttemptInProgress');
        } else {
          console.log('⚠️ refreshUserData: User does not have premium plan - plan:', userData.plan, 'is_premium:', userData.is_premium);
        }
      } else {
        console.log('❓ refreshUserData: No error but also no userData returned');
      }
    } catch (err: any) {
      console.error('❌ refreshUserData: Exception during refresh:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 refreshUserData: Refresh completed, isLoading set to false');
    }
  }, [clerkUser, lastRefresh]);

  // Initial fetch when Clerk user is loaded
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!clerkUser) {
      setSupabaseUser(null);
      setIsLoading(false);
      return;
    }

    refreshUserData(true);
  }, [clerkUser, isLoaded, refreshUserData]);

  // Set up event listeners and polling for updates
  useEffect(() => {
    const handleUserDataUpdated = () => {
      console.log('👂 User data updated event received - refreshing...');
      refreshUserData(true);
    };
    
    const handleStorageChange = () => {
      console.log('👂 Storage change event received - refreshing...');
      refreshUserData(true);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👂 Page became visible - refreshing user data...');
        refreshUserData(true);
      }
    };
    
    // Add event listeners
    document.addEventListener('user-data-updated', handleUserDataUpdated);
    document.addEventListener('localStorageChange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleUserDataUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up polling interval (every 30 seconds) to check for plan updates
    const pollInterval = setInterval(() => {
      if (clerkUser && !document.hidden) {
        console.log('⏰ Polling for user data updates...');
        refreshUserData(false);
      }
    }, 30000);
    
    return () => {
      // Clean up listeners and intervals
      document.removeEventListener('user-data-updated', handleUserDataUpdated);
      document.removeEventListener('localStorageChange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleUserDataUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [clerkUser, refreshUserData]);

  // Check if user has premium status - check the 'plan' field from database
  let isPremium = supabaseUser?.plan === 'premium' || 
                  supabaseUser?.is_premium === true || 
                  supabaseUser?.plan_status === 'premium';
  
  // Development override for testing premium features
  if (process.env.NODE_ENV === 'development') {
    const devOverride = localStorage.getItem('dev_override_premium');
    if (devOverride === 'true') {
      isPremium = true;
      console.log('🧪 Development override: Setting isPremium to true');
    } else if (devOverride === 'false') {
      isPremium = false;
      console.log('🧪 Development override: Setting isPremium to false');
    }
  }
  
  console.log('🔍 useUserData: Current state:', {
    clerkUser: clerkUser?.id,
    supabaseUser: supabaseUser ? {
      id: supabaseUser.id,
      plan: supabaseUser.plan,
      is_premium: supabaseUser.is_premium,
      plan_status: supabaseUser.plan_status
    } : null,
    isPremium,
    isPremiumOverridden: process.env.NODE_ENV === 'development' ? localStorage.getItem('dev_override_premium') : 'N/A',
    isLoading,
    error,
    lastRefresh: new Date(lastRefresh).toLocaleTimeString()
  });

  // Function to force a manual refresh (for use in components)
  const forceRefresh = () => {
    console.log('🔄 Force refresh requested');
    refreshUserData(true);
  };

  return {
    clerkUser,
    supabaseUser,
    isLoading,
    error,
    refreshUserData: forceRefresh,
    isPremium
  };
} 