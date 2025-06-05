import { supabase } from './supabase';

// Plan configuration and limits
export const PLAN_LIMITS = {
  free: {
    dailyThreads: parseInt(process.env.DAILY_THREAD_LIMIT_FREE || '3', 10),
    maxCharsPerThread: 2000,
    aiModels: ['google/gemini-flash-1.5-8b'],
    allowRealTime: false,
    allowWeb3Features: false
  },
  premium: {
    dailyThreads: 999, // Essentially unlimited
    maxCharsPerThread: 10000,
    aiModels: [
      'anthropic/claude-3-haiku-20240307',
      'anthropic/claude-3-sonnet-20240229',
      'google/gemini-flash-1.5-8b',
      'google/gemini-pro-1.5'
    ],
    allowRealTime: true,
    allowWeb3Features: true
  }
};

/**
 * Check if a user has reached their daily thread limit
 * @param clerkUserId - Clerk user ID
 * @returns Object with limit information and whether the limit is reached
 */
export async function checkDailyThreadLimit(clerkUserId: string) {
  try {
    // Get user's plan from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    const plan = user?.plan || 'free';
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].dailyThreads;

    // Count today's threads
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_id', clerkUserId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (countError) {
      throw new Error(`Error counting threads: ${countError.message}`);
    }

    const threadCount = count || 0;
    const limitReached = threadCount >= limit;

    return {
      plan,
      limit,
      count: threadCount,
      limitReached,
      remaining: Math.max(0, limit - threadCount)
    };
  } catch (error) {
    console.error('Error checking thread limit:', error);
    throw error;
  }
}

/**
 * Check if a user can use a specific AI model based on their plan
 * @param clerkUserId - Clerk user ID
 * @param modelName - Name of the AI model
 * @returns Whether the user can use the model
 */
export async function canUseModel(clerkUserId: string, modelName: string) {
  try {
    // Get user's plan from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    const plan = user?.plan || 'free';
    const allowedModels = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].aiModels;

    return allowedModels.includes(modelName);
  } catch (error) {
    console.error('Error checking model access:', error);
    throw error;
  }
}

/**
 * Get all information about a user's plan
 * @param clerkUserId - Clerk user ID
 * @returns Plan details and limits
 */
export async function getPlanDetails(clerkUserId: string) {
  try {
    // Get user's plan from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan, created_at')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    const plan = user?.plan || 'free';
    const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    
    // Get today's thread count
    const threadLimitInfo = await checkDailyThreadLimit(clerkUserId);

    return {
      plan,
      memberSince: user?.created_at,
      limits: planLimits,
      usage: {
        dailyThreads: threadLimitInfo
      }
    };
  } catch (error) {
    console.error('Error getting plan details:', error);
    throw error;
  }
} 