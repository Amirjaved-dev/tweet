import { config } from '../config';

// Simple in-memory storage for threads and usage
interface Thread {
  id: string;
  userId: string;
  title: string;
  topic: string;
  tone: string;
  length: string;
  content: any;
  createdAt: string;
}

interface UserUsage {
  userId: string;
  date: string;
  generationCount: number;
  tweetCount: number;
}

interface SubscriptionPlan {
  userId: string;
  planType: string;
  dailyLimit: number;
  dailyTweetLimit: number;
  isActive: boolean;
  startDate: string;
}

// In-memory storage
const threads: Thread[] = [];
const userUsage: UserUsage[] = [];
const subscriptionPlans: SubscriptionPlan[] = [];

// Function to get daily usage for a user
export async function getUserDailyUsage(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];
  
  const usage = userUsage.find(u => u.userId === userId && u.date === todayString);
  return usage || null;
}

// Function to check if user can generate a thread
export async function canGenerateThread(userId: string) {
  // Get subscription plan - force refresh from latest data
  const plan = await getUserSubscriptionPlan(userId);
  
  // Get current usage
  const usage = await getUserDailyUsage(userId);
  
  if (!usage) {
    // No usage record today, can generate
    return { canGenerate: true, remaining: plan.dailyLimit };
  }
  
  const canGenerate = usage.generationCount < plan.dailyLimit;
  const remaining = plan.dailyLimit - usage.generationCount;
  
  return { canGenerate, remaining };
}

// Function to increment thread generation count
export async function incrementThreadCount(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];
  
  const usage = await getUserDailyUsage(userId);
  
  if (!usage) {
    // Create new usage record
    userUsage.push({
      userId,
      date: todayString,
      generationCount: 1,
      tweetCount: 0,
    });
    return true;
  }
  
  // Update existing record
  usage.generationCount += 1;
  return true;
}

// Function to ensure user has a subscription plan
export async function ensureUserHasSubscriptionPlan(userId: string) {
  try {
    // Check if user already has a subscription plan
    const existingPlan = subscriptionPlans.find(p => p.userId === userId && p.isActive);
    
    // If user already has a plan, no need to create one
    if (existingPlan) {
      return true;
    }
    
    // Create a default free plan for the user
    subscriptionPlans.push({
      userId,
      planType: 'free',
      dailyLimit: config.dailyThreadLimitFree,
      dailyTweetLimit: config.dailyTweetLimitFree,
      isActive: true,
      startDate: new Date().toISOString()
    });
    
    console.log(`Created default subscription plan for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error ensuring user has subscription plan:', error);
    return false;
  }
}

// Function to store a thread
export async function storeThread(threadData: Omit<Thread, 'id' | 'createdAt'>) {
  const thread: Thread = {
    ...threadData,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };
  
  threads.push(thread);
  return { data: thread, error: null };
}

// Function to get threads for a user
export async function getUserThreads(userId: string) {
  const userThreads = threads
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { data: userThreads, error: null };
}

// Function to get all threads (for admin)
export async function getAllThreads() {
  const allThreads = threads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { data: allThreads, error: null };
}

// Function to get a specific thread by ID
export async function getThreadById(threadId: string) {
  const thread = threads.find(t => t.id === threadId);
  
  if (!thread) {
    return { data: null, error: 'Thread not found' };
  }
  
  return { data: thread, error: null };
}

// Function to get Web3 threads for a user
export async function getWeb3Threads(userId: string) {
  const web3Threads = threads
    .filter(t => t.userId === userId && t.tone === 'Web3 Expert')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { data: web3Threads, error: null };
}

// Function to update user subscription
export async function updateUserSubscription(userId: string, planType: string, paymentId: string) {
  try {
    // Get the correct daily limits based on plan type
    let dailyLimit: number;
    let dailyTweetLimit: number;
    
    if (planType === 'premium') {
      dailyLimit = 999; // Premium plan has virtually unlimited threads per day
      dailyTweetLimit = 999; // Premium plan has virtually unlimited tweets per day
    } else if (planType === 'pro') {
      dailyLimit = config.dailyThreadLimitPro; // Pro plan thread limit
      dailyTweetLimit = config.dailyTweetLimitPro; // Pro plan tweet limit
    } else if (planType === 'basic') {
      dailyLimit = 15; // Basic plan has 15 threads per day
      dailyTweetLimit = 25; // Basic plan has 25 tweets per day
    } else {
      dailyLimit = config.dailyThreadLimitFree; // Free plan (default)
      dailyTweetLimit = config.dailyTweetLimitFree; // Free plan tweet limit
    }
    
    // Check if user already has a subscription plan
    const existingPlanIndex = subscriptionPlans.findIndex(p => p.userId === userId && p.isActive);
    
    if (existingPlanIndex >= 0) {
      // Update existing plan
      subscriptionPlans[existingPlanIndex] = {
        ...subscriptionPlans[existingPlanIndex],
        planType: planType,
        dailyLimit: dailyLimit,
        dailyTweetLimit: dailyTweetLimit,
        startDate: new Date().toISOString()
      };
    } else {
      // Create a new plan
      subscriptionPlans.push({
        userId,
        planType,
        dailyLimit: dailyLimit,
        dailyTweetLimit: dailyTweetLimit,
        isActive: true,
        startDate: new Date().toISOString()
      });
    }
    
    // Clear any usage records for today to ensure the user gets the full new limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    // Find and remove any usage records for today
    const usageIndex = userUsage.findIndex(u => u.userId === userId && u.date === todayString);
    if (usageIndex >= 0) {
      userUsage.splice(usageIndex, 1);
    }
    
    console.log(`Updated subscription plan for user ${userId} to ${planType} with daily limits: ${dailyLimit} threads, ${dailyTweetLimit} tweets`);
    return true;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
}

// Function to get user subscription plan
export async function getUserSubscriptionPlan(userId: string) {
  // Get the active subscription plan for the user
  const plan = subscriptionPlans.find(p => p.userId === userId && p.isActive);
  
  if (!plan) {
    // Return a default free plan if no active plan exists
    return {
      planType: 'free',
      dailyLimit: config.dailyThreadLimitFree,
      dailyTweetLimit: config.dailyTweetLimitFree,
      isActive: true
    };
  }
  
  // Ensure the daily limits are correct based on the plan type
  // This acts as a safeguard in case the stored limits are incorrect
  let correctedDailyLimit = plan.dailyLimit;
  let correctedDailyTweetLimit = plan.dailyTweetLimit;
  
  if (plan.planType === 'premium') {
    correctedDailyLimit = 999; // Premium plan has virtually unlimited threads per day
    correctedDailyTweetLimit = 999; // Premium plan has virtually unlimited tweets per day
  } else if (plan.planType === 'pro') {
    correctedDailyLimit = config.dailyThreadLimitPro; // Pro plan thread limit
    correctedDailyTweetLimit = config.dailyTweetLimitPro; // Pro plan tweet limit
  } else if (plan.planType === 'basic') {
    correctedDailyLimit = 15; // Basic plan has 15 threads per day
    correctedDailyTweetLimit = 25; // Basic plan has 25 tweets per day
  } else {
    correctedDailyLimit = config.dailyThreadLimitFree; // Free plan
    correctedDailyTweetLimit = config.dailyTweetLimitFree; // Free plan tweet limit
  }
  
  return {
    ...plan,
    dailyLimit: correctedDailyLimit,
    dailyTweetLimit: correctedDailyTweetLimit
  };
}

// Function to check if user can generate a tweet
export async function canGenerateTweet(userId: string) {
  // Get subscription plan - force refresh from latest data
  const plan = await getUserSubscriptionPlan(userId);
  
  // Get current usage
  const usage = await getUserDailyUsage(userId);
  
  if (!usage) {
    // No usage record today, can generate
    return { canGenerate: true, remaining: plan.dailyTweetLimit };
  }
  
  const canGenerate = (usage.tweetCount || 0) < plan.dailyTweetLimit;
  const remaining = plan.dailyTweetLimit - (usage.tweetCount || 0);
  
  return { canGenerate, remaining };
}

// Function to increment tweet generation count
export async function incrementTweetCount(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];
  
  const usage = await getUserDailyUsage(userId);
  
  if (!usage) {
    // Create new usage record
    userUsage.push({
      userId,
      date: todayString,
      generationCount: 0,
      tweetCount: 1,
    });
    return true;
  }
  
  // Update existing record
  if (usage.tweetCount === undefined) {
    usage.tweetCount = 0;
  }
  usage.tweetCount += 1;
  return true;
}

// Function to store a tweet (reusing thread structure for now)
export async function storeTweet(userId: string, topic: string, tone: string, content: string, tokens: string[] = []) {
  const tweet: Thread = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    title: `Tweet: ${topic}`,
    topic,
    tone,
    length: 'tweet',
    content,
    createdAt: new Date().toISOString()
  };
  
  threads.push(tweet);
  return tweet.id;
}

// Function to get tweets for a user (tweets have length: 'tweet')
export async function getUserTweets(userId: string, limit: number = 10, offset: number = 0) {
  const userTweets = threads
    .filter(t => t.userId === userId && t.length === 'tweet')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
  
  return userTweets;
} 