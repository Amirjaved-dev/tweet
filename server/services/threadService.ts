import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Use the instance from lib/supabase.ts which has proper fallback handling
const supabaseInstance = supabase;

export interface ThreadData {
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

interface ThreadLimits {
  canCreate: boolean;
  remaining: number;
  isPremium: boolean;
  dailyLimit: number;
  reason?: string;
}

interface CreateThreadData {
  clerk_id: string;
  content: string;
  metadata?: any;
}

export class ThreadService {
  // Free plan limitations
  private static readonly FREE_DAILY_LIMIT = 3;
  private static readonly FREE_THREAD_LENGTH_LIMIT = 8; // Max 8 tweets
  private static readonly FREE_ALLOWED_TONES = ['educational', 'calm']; // Limited tone presets
  private static readonly FREE_ALLOWED_TYPES = ['custom']; // No token analysis or trend analysis

  // Premium plan benefits
  private static readonly PREMIUM_DAILY_LIMIT = -1; // Unlimited
  private static readonly PREMIUM_THREAD_LENGTH_LIMIT = 15; // Up to 15 tweets
  private static readonly PREMIUM_ALLOWED_TONES = ['educational', 'calm', 'degen', 'hype', 'shill']; // All tones
  private static readonly PREMIUM_ALLOWED_TYPES = ['custom', 'token', 'trend']; // All types

  // Get or create user profile
  async getOrCreateUser(clerkUserId: string): Promise<UserProfile> {
    try {
      // First try to get existing user
      const { data: existingUser, error: getError } = await supabaseInstance
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (existingUser && !getError) {
        return existingUser;
      }

      // Create new user if doesn't exist
      const { data: newUser, error: createError } = await supabaseInstance
        .from('users')
        .insert({
          clerk_user_id: clerkUserId,
          is_premium: false,
        })
        .select('*')
        .single();

      if (createError) {
        console.error(`Failed to create user profile: ${createError.message}`);
        // Return a mock user in development mode
        if (process.env.NODE_ENV === 'development') {
          return {
            id: 'mock-user-id',
            clerk_user_id: clerkUserId,
            is_premium: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        throw new Error(`Failed to create user profile: ${createError.message}`);
      }

      return newUser;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      // Return a mock user in development mode
      if (process.env.NODE_ENV === 'development') {
        return {
          id: 'mock-user-id',
          clerk_user_id: clerkUserId,
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  }

  // Check if user has premium access
  async checkPremiumAccess(clerkUserId: string): Promise<boolean> {
    try {
      const user = await this.getOrCreateUser(clerkUserId);
      return user.is_premium;
    } catch (error) {
      console.error('Error in checkPremiumAccess:', error);
      return false;
    }
  }

  // Get user's daily thread count
  async getDailyThreadCount(clerkUserId: string): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const user = await this.getOrCreateUser(clerkUserId);
      
      const { count, error } = await supabaseInstance
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString());

      if (error) {
        console.error(`Failed to get thread count: ${error.message}`);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getDailyThreadCount:', error);
      return 0;
    }
  }

  async canCreateThread(clerkUserId: string): Promise<ThreadLimits> {
    try {
      // Get user data from Supabase
      const { data: user, error: userError } = await supabaseInstance
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUserId)
        .single();

      if (userError || !user) {
        return {
          canCreate: false,
          remaining: 0,
          isPremium: false,
          dailyLimit: 0,
          reason: 'User not found'
        };
      }

      const isPremium = user.is_premium || user.plan === 'premium' || user.plan === 'pro' || user.plan === 'lifetime';

      // Premium users have unlimited threads
    if (isPremium) {
        return {
          canCreate: true,
          remaining: -1, // Unlimited
          isPremium: true,
          dailyLimit: -1
        };
      }

      // Free users have daily limits
      const today = new Date().toISOString().split('T')[0];
      const { count, error: countError } = await supabaseInstance
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_id', clerkUserId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (countError) {
        console.error('Error counting threads:', countError);
      return { 
        canCreate: false, 
          remaining: 0,
          isPremium: false,
          dailyLimit: ThreadService.FREE_DAILY_LIMIT,
          reason: 'Failed to check thread limits'
        };
      }

      const threadCount = count || 0;
      const remaining = ThreadService.FREE_DAILY_LIMIT - threadCount;

      if (remaining <= 0) {
        return {
          canCreate: false,
          remaining: 0,
          isPremium: false,
          dailyLimit: ThreadService.FREE_DAILY_LIMIT,
          reason: `Daily thread limit reached (${ThreadService.FREE_DAILY_LIMIT}/day). Upgrade to premium for unlimited threads.`
        };
      }

      return {
        canCreate: true,
        remaining,
        isPremium: false,
        dailyLimit: ThreadService.FREE_DAILY_LIMIT
      };

    } catch (error) {
      console.error('Error checking thread limits:', error);
      return {
        canCreate: false,
        remaining: 0,
        isPremium: false,
        dailyLimit: 0,
        reason: 'Server error while checking limits'
      };
    }
  }

  async validateThreadOptions(clerkUserId: string, options: any): Promise<{ valid: boolean; error?: string; isPremium: boolean }> {
    try {
      // Get user data
      const { data: user, error: userError } = await supabaseInstance
        .from('users')
      .select('*')
        .eq('clerk_id', clerkUserId)
      .single();

      if (userError || !user) {
        return { valid: false, error: 'User not found', isPremium: false };
    }

      const isPremium = user.is_premium || user.plan === 'premium' || user.plan === 'pro' || user.plan === 'lifetime';

      // Validate thread type
      if (!isPremium && !ThreadService.FREE_ALLOWED_TYPES.includes(options.threadType)) {
    return {
          valid: false,
          error: `Thread type '${options.threadType}' is only available for premium users. Upgrade to access token analysis and trend analysis.`,
          isPremium: false
        };
      }

      // Validate tone preset
      if (!isPremium && !ThreadService.FREE_ALLOWED_TONES.includes(options.tonePreset)) {
        return {
          valid: false,
          error: `Tone preset '${options.tonePreset}' is only available for premium users. Free users can use 'Educational' and 'Calm' tones.`,
          isPremium: false
        };
      }

      // Validate thread length
      const maxLength = isPremium ? ThreadService.PREMIUM_THREAD_LENGTH_LIMIT : ThreadService.FREE_THREAD_LENGTH_LIMIT;
      if (options.threadLength > maxLength) {
        return {
          valid: false,
          error: `Thread length limited to ${maxLength} tweets for ${isPremium ? 'premium' : 'free'} users. Requested: ${options.threadLength} tweets.`,
          isPremium
        };
      }

      // Validate premium-only features
      if (!isPremium) {
        if (options.threadType === 'token' && options.includePrice) {
          return {
            valid: false,
            error: 'Real-time price data is only available for premium users.',
            isPremium: false
          };
        }

        if (options.threadType === 'trend') {
          return {
            valid: false,
            error: 'Tweet expansion feature is only available for premium users.',
            isPremium: false
          };
        }

        // Advanced hook styles for premium only
        const premiumHooks = ['stat', 'bold', 'story'];
        if (premiumHooks.includes(options.hookStyle)) {
          return {
            valid: false,
            error: `Advanced hook styles are only available for premium users. Free users can use 'Question' hooks.`,
            isPremium: false
          };
        }
      }

      return { valid: true, isPremium };

    } catch (error) {
      console.error('Error validating thread options:', error);
      return { valid: false, error: 'Server error while validating options', isPremium: false };
    }
  }

  async createThread(data: CreateThreadData): Promise<any> {
    try {
      // Generate a meaningful title from the content
      const title = data.metadata?.customTopic || 
                   data.metadata?.tokenSymbol ? `${data.metadata.tokenSymbol} Analysis` :
                   `Thread ${new Date().toISOString().split('T')[0]}`;
      
      // Create the thread in database
      const { data: newThread, error: createError } = await supabaseInstance
      .from('threads')
        .insert({
          clerk_id: data.clerk_id,
          title: title,
          created_at: new Date().toISOString()
        })
        .select()
      .single();

      if (createError) {
        console.error('Error creating thread:', createError);
        throw new Error('Failed to create thread');
      }

      // Store the content as a message in the messages table
      const { error: messageError } = await supabaseInstance
        .from('messages')
        .insert({
          thread_id: newThread.id,
          content: data.content,
          role: 'assistant',
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error creating thread message:', messageError);
        // Don't fail the whole operation, but log the error
      }

      return newThread;

    } catch (error) {
      console.error('Error in createThread:', error);
      throw error;
    }
  }

  async getUserThreads(clerkUserId: string): Promise<any[]> {
    try {
      // Fetch threads with their messages
      const { data: threads, error } = await supabaseInstance
      .from('threads')
        .select(`
          *,
          messages (
            content,
            role,
            created_at
          )
        `)
        .eq('clerk_id', clerkUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user threads:', error);
        throw new Error('Failed to fetch threads');
      }

      return threads || [];

    } catch (error) {
      console.error('Error in getUserThreads:', error);
      throw error;
    }
  }

  async getThreadLimits(clerkUserId: string): Promise<ThreadLimits> {
    return this.canCreateThread(clerkUserId);
  }

  // Get user plan details with feature breakdown
  async getUserPlanDetails(clerkUserId: string): Promise<{
    plan: string;
    isPremium: boolean;
    features: {
      dailyLimit: number;
      maxThreadLength: number;
      allowedTypes: string[];
      allowedTones: string[];
      realtimeData: boolean;
      advancedHooks: boolean;
      prioritySupport: boolean;
    };
    usage: {
      threadsToday: number;
      remaining: number;
    };
  }> {
    try {
      // Get user data
      const { data: user, error: userError } = await supabaseInstance
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUserId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      const isPremium = user.is_premium || user.plan === 'premium' || user.plan === 'pro' || user.plan === 'lifetime';

      // Get today's usage
      const today = new Date().toISOString().split('T')[0];
      const { count: threadsToday } = await supabaseInstance
      .from('threads')
      .select('*', { count: 'exact', head: true })
        .eq('clerk_id', clerkUserId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      const dailyLimit = isPremium ? -1 : ThreadService.FREE_DAILY_LIMIT;
      const remaining = isPremium ? -1 : Math.max(0, ThreadService.FREE_DAILY_LIMIT - (threadsToday || 0));

      return {
        plan: user.plan || 'free',
        isPremium,
        features: {
          dailyLimit,
          maxThreadLength: isPremium ? ThreadService.PREMIUM_THREAD_LENGTH_LIMIT : ThreadService.FREE_THREAD_LENGTH_LIMIT,
          allowedTypes: isPremium ? ThreadService.PREMIUM_ALLOWED_TYPES : ThreadService.FREE_ALLOWED_TYPES,
          allowedTones: isPremium ? ThreadService.PREMIUM_ALLOWED_TONES : ThreadService.FREE_ALLOWED_TONES,
          realtimeData: isPremium,
          advancedHooks: isPremium,
          prioritySupport: isPremium
        },
        usage: {
          threadsToday: threadsToday || 0,
          remaining
        }
      };

    } catch (error) {
      console.error('Error getting user plan details:', error);
      throw error;
    }
  }

  // Helper method to get feature limits for UI
  static getFeatureLimits(isPremium: boolean) {
    return {
      dailyLimit: isPremium ? -1 : ThreadService.FREE_DAILY_LIMIT,
      maxThreadLength: isPremium ? ThreadService.PREMIUM_THREAD_LENGTH_LIMIT : ThreadService.FREE_THREAD_LENGTH_LIMIT,
      allowedTypes: isPremium ? ThreadService.PREMIUM_ALLOWED_TYPES : ThreadService.FREE_ALLOWED_TYPES,
      allowedTones: isPremium ? ThreadService.PREMIUM_ALLOWED_TONES : ThreadService.FREE_ALLOWED_TONES,
      realtimeData: isPremium,
      advancedHooks: isPremium,
      tweetExpansion: isPremium
    };
  }
}

export const threadService = new ThreadService(); 