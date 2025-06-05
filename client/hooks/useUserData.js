import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';

export function useUserData() {
  const { user: clerkUser, isLoaded } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // DIRECT and AGGRESSIVE premium status detection - covers ALL possible cases
  const checkPremiumStatus = (userData) => {
    if (!userData) {
      console.log('🚫 [Premium Check] No user data provided');
      return false;
    }
    
    // Convert all values to strings for comparison to handle type inconsistencies
    const isTrue = (value) => {
      if (value === true || value === 1 || value === '1' || value === 'true') return true;
      return false;
    };
    
    const plan = String(userData.plan || '').toLowerCase();
    const status = String(userData.status || '').toLowerCase();
    
    // Multiple ways to check premium status - ANY of these should make user premium
    const premiumIndicators = [
      // Boolean checks for is_premium field
      isTrue(userData.is_premium),
      
      // Plan field checks
      plan === 'premium',
      plan === 'pro',
      plan === 'paid',
      
      // Status field checks  
      status === 'premium',
      status === 'pro', 
      status === 'paid',
      status === 'active' && plan === 'premium',
      
      // Subscription expiry check - if they have a future expiry date, they're premium
      userData.subscription_expires_at && new Date(userData.subscription_expires_at) > new Date()
    ];
    
    const isPremium = premiumIndicators.some(indicator => indicator === true);
    
    console.log('🎯 [Premium Check] COMPREHENSIVE ANALYSIS:', {
      user_id: userData.id,
      clerk_id: userData.clerk_id,
      raw_is_premium: userData.is_premium,
      raw_plan: userData.plan,
      raw_status: userData.status,
      subscription_expires_at: userData.subscription_expires_at,
      premiumIndicators,
      FINAL_RESULT: isPremium
    });
    
    return isPremium;
  };

  // Robust user data fetching with aggressive refresh
  const fetchUserData = async (forceRefresh = false) => {
    if (!clerkUser || !isLoaded) {
      console.log('⏳ [useUserData] Waiting for Clerk to load...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [useUserData] Fetching user data for:', clerkUser.id, forceRefresh ? '(FORCED REFRESH)' : '');

      // Query with ALL possible fields to ensure we get everything
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('❌ [useUserData] User not found in database, creating...');
          
          // Create user as free by default (normal behavior)
          const newUserData = {
            clerk_id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress,
            plan: 'free',
            is_premium: false,
            status: 'active',
            created_at: new Date().toISOString()
          };
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();
            
          if (createError) {
            console.error('❌ [useUserData] Failed to create user:', createError);
            setError(createError.message);
          } else {
            console.log('✅ [useUserData] Created new FREE user:', newUser);
            setSupabaseUser(newUser);
          }
        } else {
          console.error('❌ [useUserData] Database error:', fetchError);
          setError(fetchError.message);
        }
      } else if (userData) {
        console.log('✅ [useUserData] Found user data:', {
          id: userData.id,
          plan: userData.plan,
          is_premium: userData.is_premium,
          status: userData.status,
          expires_at: userData.subscription_expires_at
        });
        
        // Immediately set the user data
        setSupabaseUser(userData);
        
        // If user is premium, force additional UI updates
        if (userData.plan === 'premium' || userData.is_premium) {
          console.log('🎉 [useUserData] Premium user detected, forcing UI updates...');
          setTimeout(() => {
            window.dispatchEvent(new Event('user-data-updated'));
            document.dispatchEvent(new Event('user-data-updated'));
          }, 100);
        }
      }
    } catch (err) {
      console.error('❌ [useUserData] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    if (isLoaded) {
      fetchUserData();
    }
  }, [clerkUser?.id, isLoaded]);

  // Real-time subscription for database changes
  useEffect(() => {
    if (!clerkUser?.id) return;

    console.log('🔔 [useUserData] Setting up real-time subscription for user:', clerkUser.id);

    const subscription = supabase
      .channel(`user-${clerkUser.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users',
          filter: `clerk_id=eq.${clerkUser.id}`
        }, 
        (payload) => {
          console.log('🔔 [useUserData] Real-time database update received:', payload);
          if (payload.new) {
            console.log('📱 [useUserData] Updating user data from real-time event');
            setSupabaseUser(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 [useUserData] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [clerkUser?.id]);

  // Listen for manual refresh events
  useEffect(() => {
    const handleRefresh = (e) => {
      console.log('🔄 [useUserData] Manual refresh event received:', e.type);
      fetchUserData(true);
    };

    // Listen to multiple event types
    window.addEventListener('user-data-updated', handleRefresh);
    window.addEventListener('localStorageChange', handleRefresh);
    document.addEventListener('user-data-updated', handleRefresh);
    document.addEventListener('localStorageChange', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    
    return () => {
      window.removeEventListener('user-data-updated', handleRefresh);
      window.removeEventListener('localStorageChange', handleRefresh);
      document.removeEventListener('user-data-updated', handleRefresh);
      document.removeEventListener('localStorageChange', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  // Auto-refresh only for legitimate premium users who might have state sync issues
  useEffect(() => {
    if (supabaseUser && supabaseUser.plan === 'premium' && !checkPremiumStatus(supabaseUser)) {
      console.log('🔄 [useUserData] Premium user with state sync issue, refreshing...');
      const interval = setInterval(() => {
        console.log('⏰ [useUserData] Auto-refreshing for premium user state sync');
        fetchUserData(true);
      }, 10000); // Every 10 seconds, less aggressive
      
      return () => {
        console.log('🛑 [useUserData] Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [supabaseUser]);

  // Calculate premium status
  const isPremium = checkPremiumStatus(supabaseUser);

  // Enhanced refresh function
  const refreshUserData = async () => {
    console.log('🔄 [useUserData] Manual refresh requested');
    await fetchUserData(true);
  };

  // Debug logging every time this hook returns data
  console.log('📊 [useUserData] Hook returning:', {
    hasClerkUser: !!clerkUser,
    hasSupabaseUser: !!supabaseUser,
    isPremium,
    isLoading,
    error
  });

  return {
    clerkUser,
    supabaseUser,
    isLoading,
    error,
    refreshUserData,
    isPremium
  };
} 