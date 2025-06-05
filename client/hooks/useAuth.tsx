import { useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import axios from 'axios';

type UserPlan = 'free' | 'premium';

interface PlanLimits {
  dailyThreads: number;
  maxCharsPerThread: number;
  aiModels: string[];
  allowRealTime: boolean;
  allowWeb3Features: boolean;
}

interface DailyThreadUsage {
  plan: UserPlan;
  limit: number;
  count: number;
  limitReached: boolean;
  remaining: number;
}

interface PlanDetails {
  plan: UserPlan;
  memberSince: string;
  limits: PlanLimits;
  usage: {
    dailyThreads: DailyThreadUsage;
  };
}

interface UserData {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string;
  plan: UserPlan;
  planDetails: PlanDetails;
  createdAt: string;
  isNewUser: boolean;
}

export function useAuth() {
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const { getToken } = useClerkAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from API
  useEffect(() => {
    async function fetchUserData() {
      try {
        if (!isClerkLoaded || !isSignedIn || !user) {
          setIsLoading(false);
          setUserData(null);
          return;
        }

        setIsLoading(true);
        setError(null);

        // Get token for API request
        const token = await getToken();
        
        if (!token) {
          throw new Error('Failed to get authentication token');
        }

        // Fetch user data from our API
        const response = await axios.get('/api/user/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUserData(response.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [isClerkLoaded, isSignedIn, user, getToken]);

  // Function to check if user has premium access
  const isPremium = (): boolean => {
    return userData?.plan === 'premium';
  };

  // Function to check if user can use a specific feature
  const canUseFeature = (feature: 'realtime' | 'web3'): boolean => {
    if (!userData) return false;
    
    switch (feature) {
      case 'realtime':
        return userData.planDetails.limits.allowRealTime;
      case 'web3':
        return userData.planDetails.limits.allowWeb3Features;
      default:
        return false;
    }
  };

  // Function to check if user has reached daily thread limit
  const hasReachedDailyThreadLimit = (): boolean => {
    if (!userData) return true;
    return userData.planDetails.usage.dailyThreads.limitReached;
  };

  // Function to get remaining threads for today
  const getRemainingThreads = (): number => {
    if (!userData) return 0;
    return userData.planDetails.usage.dailyThreads.remaining;
  };

  // Function to check if user can use a specific AI model
  const canUseModel = (modelName: string): boolean => {
    if (!userData) return false;
    return userData.planDetails.limits.aiModels.includes(modelName);
  };

  // Function to refresh user data
  const refreshUserData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSignedIn || !user) {
        setUserData(null);
        return;
      }

      // Get token for API request
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Fetch user data from our API
      const response = await axios.get('/api/user/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUserData(response.data);
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh user data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoaded: isClerkLoaded && !isLoading,
    isAuthenticated: isSignedIn,
    user: userData,
    isPremium,
    canUseFeature,
    hasReachedDailyThreadLimit,
    getRemainingThreads,
    canUseModel,
    refreshUserData,
    error
  };
} 