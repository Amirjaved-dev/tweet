import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';

interface User {
  id: string;
  email: string;
  plan_status?: string;
  plan?: string;
  is_premium?: boolean;
  created_at?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null; // Clerk user
  dbUser: any | null; // Supabase user
  isPremium: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Function to refresh user data from database
  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    
    if (!isClerkLoaded || !isSignedIn || !clerkUser) {
      console.log('❌ No Clerk user available');
      setDbUser(null);
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Searching for user in database with Clerk ID:', clerkUser.id);
      
      // Try to find user by clerk_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUser.id)
        .single();
      
      if (!userError && userData) {
        console.log('✅ Found user in database:', userData);
        setDbUser(userData);
        
        // Check premium status - multiple field compatibility
        const userIsPremium = userData.is_premium === true || 
                             userData.plan === 'premium' || 
                             userData.plan === 'pro';
        
        console.log('🎯 Premium status check:', {
          is_premium: userData.is_premium,
          plan: userData.plan,
          calculated_premium: userIsPremium
        });
        
        setIsPremium(userIsPremium);
        
        // Store clerk user ID in localStorage for other components
        localStorage.setItem('clerk_user_id', clerkUser.id);
        
      } else if (userError && userError.code === 'PGRST116') {
        console.log('⚠️ User not found in database, creating...');
        
        // User doesn't exist, create them
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || 'unknown@email.com',
            plan: 'free',
            is_premium: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
        } else {
          console.log('✅ Created new user:', newUser);
          setDbUser(newUser);
          setIsPremium(false);
        }
      } else {
        console.error('❌ Database error:', userError);
      }
      
      // Fallback: Check localStorage for subscription data
      try {
        const storedSubscription = localStorage.getItem('userSubscription');
        if (storedSubscription) {
          const subscriptionData = JSON.parse(storedSubscription);
          console.log('📦 Found subscription in localStorage:', subscriptionData);
          
          if (subscriptionData.status === 'active' && 
              (subscriptionData.plan_type === 'premium' || subscriptionData.plan_type === 'pro')) {
            console.log('✅ Setting premium status from localStorage');
            setIsPremium(true);
            
            // Update database with localStorage data
            if (userData) {
              await supabase
              .from('users')
                .update({
                  plan: subscriptionData.plan_type,
                  is_premium: true,
                  subscription_expires_at: subscriptionData.ends_at,
                  updated_at: new Date().toISOString()
                })
                .eq('clerk_id', clerkUser.id);
            }
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Error reading localStorage:', storageError);
      }
      
      } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      } finally {
        setIsLoading(false);
      }
  };

  // Initial load and auth state changes
  useEffect(() => {
    if (isClerkLoaded) {
      refreshUser();
    }
  }, [isClerkLoaded, isSignedIn, clerkUser?.id]);

  // Listen for manual refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Manual refresh triggered');
      refreshUser();
    };

    const handleStorageChange = () => {
      console.log('🔄 Storage change detected');
      refreshUser();
    };

    window.addEventListener('user-data-updated', handleRefresh);
    window.addEventListener('localStorageChange', handleStorageChange);
    document.addEventListener('localStorageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('user-data-updated', handleRefresh);
      window.removeEventListener('localStorageChange', handleStorageChange);
      document.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, []);

  const value = {
    isAuthenticated: isSignedIn || false,
    isLoading: !isClerkLoaded || isLoading,
    user: clerkUser,
    dbUser,
    isPremium,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the useAuth hook for components to use
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Keep the old name for backward compatibility
export function useAuthContext() {
  return useAuth();
} 