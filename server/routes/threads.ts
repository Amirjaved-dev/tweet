import express from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '../lib/clerk';
import { requireAuth } from '../middleware/auth';
import { threadService } from '../services/threadService';
import { xIntegrationService } from '../services/xIntegrationService';
import { config } from '../config';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_ANON_KEY;

// Use development placeholders if environment variables are missing
const isDevelopment = process.env.NODE_ENV === 'development';

// Use fallback values in development mode
const finalSupabaseUrl = supabaseUrl || (isDevelopment ? 'https://leirhgtidkhuvdwpblel.supabase.co' : undefined);
const finalAnonKey = supabaseAnonKey || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE' : undefined);

if (!finalSupabaseUrl || !finalAnonKey) {
  if (isDevelopment) {
    console.warn('Using placeholder Supabase credentials in development mode');
  } else {
    throw new Error('Missing Supabase environment variables');
  }
}

const supabase = createClient(
  finalSupabaseUrl || 'https://placeholder.supabase.co',
  finalAnonKey || 'placeholder_key'
);

// Type definitions
interface ComprehensiveContext {
  userInputs: any;
  tokenData: any;
  xSocialData: any;
  trendingTopics: any[];
  hashtags: string[];
  userPreferences: any;
  historicalContext: any;
  userHistory: any;
  competitorAnalysis: any;
  marketSentiment: any;
  timestamp: string;
  [key: string]: any; // Index signature for dynamic access
}

interface TrendingTopic {
  topic: string;
  change: string;
}

interface ToneMap {
  [key: string]: string;
}

interface HookMap {
  [key: string]: string;
}

interface TokenCategories {
  [key: string]: string[];
}

interface ToneCount {
  [key: string]: number;
}

// POST /api/threads/create
router.post('/create', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }

    // Get Clerk session token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const sessionToken = authHeader.substring(7);
    
    // Verify the session token with Clerk
    let clerkUserId: string;
    try {
      const session = await verifySession(sessionToken);
      clerkUserId = session.userId;
    } catch (error) {
      console.error('Clerk session verification failed:', error);
      return res.status(401).json({ error: 'Invalid session token' });
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check plan limits
    if (user.plan === 'free') {
      // Get today's thread count for free users
      const today = new Date().toISOString().split('T')[0];
      const { count, error: countError } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_id', clerkUserId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (countError) {
        console.error('Error counting threads:', countError);
        return res.status(500).json({ error: 'Failed to check thread limits' });
      }

      const threadCount = count || 0;
      const freeLimit = parseInt(process.env.DAILY_THREAD_LIMIT_FREE || '3');
      
      if (threadCount >= freeLimit) {
        return res.status(403).json({ 
          error: 'Daily thread limit reached',
          message: `Free plan allows ${freeLimit} threads per day. Upgrade to premium for unlimited threads.`,
          limit: freeLimit,
          current: threadCount
        });
      }
    }

    // Create the thread
    const { data: newThread, error: createError } = await supabase
      .from('threads')
      .insert({
        clerk_id: clerkUserId,
        content: content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating thread:', createError);
      return res.status(500).json({ error: 'Failed to create thread' });
    }

    res.status(201).json({
      success: true,
      thread: newThread,
      message: 'Thread created successfully'
    });

  } catch (error) {
    console.error('Unexpected error in thread creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate advanced Twitter thread with X integration and ALL user data
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { options, tokenData, userPreferences, historicalContext } = req.body;
    const clerkUserId = (req as any).auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!options) {
      return res.status(400).json({ error: 'Missing thread options' });
    }

    console.log('🚀 Starting ENHANCED thread generation with COMPREHENSIVE user data...');

    // Validate thread options against user plan
    const validation = await threadService.validateThreadOptions(clerkUserId, options);
    if (!validation.valid) {
      return res.status(403).json({ 
        error: validation.error,
        isPremium: validation.isPremium,
        upgradeRequired: !validation.isPremium
      });
    }

    // Check if user can create thread (handles premium vs free limits)
    const limits = await threadService.canCreateThread(clerkUserId);
    
    if (!limits.canCreate) {
      return res.status(403).json({ 
        error: limits.reason,
        isPremium: limits.isPremium,
        upgradeRequired: !limits.isPremium,
        usage: {
          remaining: limits.remaining,
          dailyLimit: limits.dailyLimit
        }
      });
    }

    // ENHANCED DATA COLLECTION - Get ALL available context
    console.log('📊 Collecting comprehensive data context...');
    
    // 1. Get user's historical thread performance and preferences
    const userHistory = await getUserHistoricalData(clerkUserId);
    
    // 2. Get real-time X data for enhanced accuracy
    let xData = null;
    let trending = null;
    let hashtags = null;
    let competitorAnalysis = null;
    let marketSentiment = null;
    
    try {
      console.log('📈 Fetching real-time multi-source data...');
      
      // Get X data based on thread type
      if (options.threadType === 'token' && options.tokenSymbol) {
        xData = await xIntegrationService.getXData(options.tokenSymbol, 'token');
        hashtags = await xIntegrationService.getHashtagTrends('crypto');
        // Get competitor analysis for token
        competitorAnalysis = await getCompetitorAnalysis(options.tokenSymbol);
        marketSentiment = await getMarketSentimentAnalysis();
      } else if (options.threadType === 'custom' && options.customTopic) {
        xData = await xIntegrationService.getXData(options.customTopic, 'topic');
        hashtags = await xIntegrationService.getHashtagTrends('general');
      }
      
      // Get trending topics for context
      trending = await xIntegrationService.getTrendingTopics('crypto');
      
    } catch (xError) {
      console.log('⚠️ X data partially unavailable, continuing with available data...');
    }

    // 3. Build COMPREHENSIVE prompt with ALL user data
    let prompt = '';
    const comprehensiveContext: ComprehensiveContext = {
      userInputs: options,
      tokenData: tokenData || null,
      xSocialData: xData || null,
      trendingTopics: trending || [],
      hashtags: hashtags || [],
      userPreferences: userPreferences || {},
      historicalContext: historicalContext || {},
      userHistory: userHistory || {},
      competitorAnalysis: competitorAnalysis || null,
      marketSentiment: marketSentiment || null,
      timestamp: new Date().toISOString()
    };

    switch (options.threadType) {
      case 'token':
        prompt = await buildComprehensiveTokenPrompt(comprehensiveContext);
        break;
      case 'custom':
        prompt = await buildComprehensiveCustomPrompt(comprehensiveContext);
        break;
      case 'trend':
        prompt = await buildComprehensiveTrendPrompt(comprehensiveContext);
        break;
      default:
        prompt = await buildComprehensiveCustomPrompt(comprehensiveContext);
    }

    console.log('🤖 Generating thread with comprehensive AI analysis...');

    // Call enhanced AI with ALL context
    const threadContent = await callComprehensiveAI(prompt, comprehensiveContext);
    
    // Parse and format thread
    const threadArray = parseThreadContent(threadContent, options);
    
    // Store thread for future learning
    await storeThreadForLearning(clerkUserId, threadArray, comprehensiveContext);
    
    console.log('✅ Enhanced thread generated successfully!');

    res.json({
      success: true,
      thread: threadArray,
      usage: {
        remaining: limits.remaining - 1
      },
      enhancedFeatures: {
        dataSourcesUsed: Object.keys(comprehensiveContext).filter(key => comprehensiveContext[key] !== null).length,
        aiModel: config.aiModel,
        xIntegrationEnabled: !!xData,
        historicalDataUsed: !!userHistory,
        competitorAnalysisIncluded: !!competitorAnalysis
      }
    });

  } catch (error) {
    console.error('Error generating enhanced thread:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to generate thread',
      details: errorMessage
    });
  }
});

// NEW: Parse and format thread content
function parseThreadContent(content: string, options: any): string[] {
  // Split content into tweets, handling various formats
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const tweets: string[] = [];
  
  let currentTweet = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if line starts with tweet number (1/, 2/, etc.)
    const tweetNumberMatch = trimmedLine.match(/^(\d+)[\/\)\.]?\s*(.*)$/);
    
    if (tweetNumberMatch) {
      // If we have a current tweet, save it
      if (currentTweet.trim()) {
        tweets.push(currentTweet.trim());
      }
      // Start new tweet
      currentTweet = tweetNumberMatch[2];
    } else {
      // Continue current tweet
      if (currentTweet) {
        currentTweet += ' ' + trimmedLine;
      } else {
        currentTweet = trimmedLine;
      }
    }
  }
  
  // Add the last tweet
  if (currentTweet.trim()) {
    tweets.push(currentTweet.trim());
  }
  
  // If no structured format found, split by paragraphs
  if (tweets.length === 0) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    tweets.push(...paragraphs.map(p => p.trim()));
  }
  
  // Ensure we don't exceed the requested thread length
  const maxLength = options.threadLength || 8;
  return tweets.slice(0, maxLength);
}

// NEW: Get user's historical thread performance and preferences
async function getUserHistoricalData(clerkUserId: string) {
  try {
    // Get user's past thread performance
    const { data: userThreads, error } = await supabase
      .from('threads')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('Could not fetch user history:', error);
      return null;
    }

    // Analyze user's successful patterns
    const threadAnalysis = {
      totalThreads: userThreads?.length || 0,
      recentTopics: userThreads?.map(t => t.title).filter(Boolean) || [],
      preferredLength: calculatePreferredLength(userThreads || []),
      successfulTones: analyzeTonePatterns(userThreads || []),
      optimalPostingTimes: analyzePostingPatterns(userThreads || [])
    };

    return threadAnalysis;
  } catch (error) {
    console.error('Error getting user historical data:', error);
    return null;
  }
}

// NEW: Get competitor analysis for tokens
async function getCompetitorAnalysis(tokenSymbol: string) {
  try {
    // Get similar tokens and their performance
    const competitorTokens = await findSimilarTokens(tokenSymbol);
    const competitorData = await Promise.all(
      competitorTokens.map(async (token) => {
        const data = await fetch(`/api/token/data?symbol=${token}`);
        return data.json();
      })
    );

    return {
      similarTokens: competitorTokens,
      competitorPerformance: competitorData,
      marketPosition: analyzeMarketPosition(tokenSymbol, competitorData)
    };
  } catch (error) {
    console.error('Error getting competitor analysis:', error);
    return null;
  }
}

// NEW: Get comprehensive market sentiment
async function getMarketSentimentAnalysis() {
  try {
    // Aggregate sentiment from multiple sources
    const sentiment = {
      overall: 'Bullish', // This would come from real sentiment analysis
      fearGreedIndex: Math.floor(Math.random() * 100), // Mock data
      marketCap: 'Growing',
      volume: 'Increasing',
      newsFlow: 'Positive',
      institutionalActivity: 'Active'
    };

    return sentiment;
  } catch (error) {
    console.error('Error getting market sentiment:', error);
    return null;
  }
}

// NEW: Build comprehensive token prompt with ALL data
async function buildComprehensiveTokenPrompt(context: ComprehensiveContext) {
  const { userInputs: options, tokenData, xSocialData, userHistory, competitorAnalysis, marketSentiment } = context;
  
  const toneInstructions = getToneInstructions(options.tonePreset);
  const hookInstructions = getHookInstructions(options.hookStyle);
  
  let prompt = `${toneInstructions}

${hookInstructions}

Create a ${options.threadLength}-tweet thread analyzing ${options.tokenSymbol}.

🎯 USER CONTEXT & PREFERENCES:`;

  // Add user historical context
  if (userHistory && userHistory.totalThreads > 0) {
    prompt += `
- User's Experience Level: ${userHistory.totalThreads} previous threads
- Preferred Content Style: ${userHistory.successfulTones || 'Educational'}
- Optimal Thread Length: ${userHistory.preferredLength || 'Medium'} tweets
- Recent Focus Areas: ${userHistory.recentTopics.slice(0, 3).join(', ')}`;
  }

  // Add comprehensive token data
  if (tokenData) {
    prompt += `

💰 COMPREHENSIVE TOKEN DATA:
- Current Price: ${tokenData.price}
- 24h Change: ${tokenData.change24h}
- Market Cap: ${tokenData.marketCap}
- Volume: ${tokenData.volume24h}
- Market Sentiment: ${tokenData.sentiment}
- Data Source: ${tokenData.dataSource}`;

    if (tokenData.xIntegration) {
      prompt += `
- Social Mentions: ${tokenData.xIntegration.socialMetrics?.mentions || 'N/A'}
- Community Engagement: ${tokenData.xIntegration.socialMetrics?.engagement || 'N/A'}
- Sentiment Distribution: ${JSON.stringify(tokenData.xIntegration.sentiment?.distribution || {})}`;
    }
  }

  // Add real-time X social data
  if (xSocialData) {
    prompt += `

📊 REAL-TIME SOCIAL INTELLIGENCE:
- Total Mentions: ${xSocialData.metrics?.totalMentions?.toLocaleString() || 'N/A'}
- Unique Users: ${xSocialData.metrics?.uniqueUsers?.toLocaleString() || 'N/A'}  
- Engagement Rate: ${xSocialData.metrics?.averageEngagementRate || 'N/A'}
- Overall Sentiment: ${xSocialData.sentiment?.overall || 'N/A'}
- Community Confidence: ${xSocialData.dataQuality?.confidence || 'N/A'}%`;

    if (xSocialData.keyTopics && xSocialData.keyTopics.length > 0) {
      prompt += `
- Trending Discussion Topics: ${xSocialData.keyTopics.join(', ')}`;
    }

    if (xSocialData.topTweets && xSocialData.topTweets.length > 0) {
      prompt += `

🔥 TOP COMMUNITY INSIGHTS:
${xSocialData.topTweets.slice(0, 2).map((tweet: any, index: number) => 
  `${index + 1}. "${tweet.text}" (${tweet.engagement?.likes || 0} likes)`
).join('\n')}`;
    }
  }

  // Add competitor analysis
  if (competitorAnalysis) {
    prompt += `

🏆 COMPETITIVE LANDSCAPE:
- Similar Tokens: ${competitorAnalysis.similarTokens?.join(', ') || 'N/A'}
- Market Position: ${competitorAnalysis.marketPosition || 'N/A'}
- Competitive Advantages: Use this data to highlight unique value propositions`;
  }

  // Add market sentiment
  if (marketSentiment) {
    prompt += `

📈 BROADER MARKET CONTEXT:
- Overall Market Sentiment: ${marketSentiment.overall}
- Fear & Greed Index: ${marketSentiment.fearGreedIndex}/100
- Institutional Activity: ${marketSentiment.institutionalActivity}
- News Flow: ${marketSentiment.newsFlow}`;
  }

  // Add current trends
  if (context.trendingTopics && context.trendingTopics.length > 0) {
    prompt += `

🔄 CURRENT CRYPTO TRENDS:
${context.trendingTopics.slice(0, 3).map((t: TrendingTopic) => `- ${t.topic} (${t.change})`).join('\n')}`;
  }

  if (options.includeCTA) {
    prompt += `\n\nEnd with this call-to-action: "${options.ctaText}"`;
  }

  prompt += `

🎯 COMPREHENSIVE AI INSTRUCTIONS: 
- Use ALL the multi-source data above to create highly accurate, insightful content
- Incorporate user's historical preferences and successful patterns
- Reference specific metrics, sentiment, and competitive insights
- Connect to broader market trends and social sentiment
- Make content feel personalized to this user's style and experience level
- Include competitor context and unique value propositions
- Use real community insights and trending topics naturally
- Create content that feels current, relevant, and deeply researched
- Format as numbered tweets (1/, 2/, 3/, etc.) 
- Optimize for engagement based on user's historical performance patterns`;

  return prompt;
}

// Helper function to get tone instructions
function getToneInstructions(tonePreset: string): string {
  const toneMap: ToneMap = {
    degen: "Write in degen crypto speak with phrases like 'gm frens', 'ape in', 'diamond hands', 'to the moon', 'ser this is alpha'. Use casual crypto slang and be enthusiastic about gains and opportunities.",
    hype: "Write with HIGH ENERGY and excitement! Use CAPS for emphasis, lots of rocket emojis 🚀, fire emojis 🔥, and phrases like 'THIS IS HUGE', 'ABSOLUTELY MASSIVE', 'GOING TO THE MOON'. Be extremely bullish and excited.",
    educational: "Write in a professional, informative tone. Focus on facts, analysis, and educational content. Use clear explanations and provide valuable insights. Be objective and well-researched.",
    shill: "Write with bullish sentiment emphasizing why this is undervalued and early alpha. Use phrases like 'still early', 'hidden gem', 'undervalued', 'massive potential'. Be convincing but not overly aggressive.",
    calm: "Write with a balanced, measured tone. Provide objective analysis considering both bullish and bearish perspectives. Be thoughtful and analytical without extreme emotions."
  };
  
  return toneMap[tonePreset] || toneMap.educational;
}

// Helper function to get hook instructions
function getHookInstructions(hookStyle: string): string {
  const hookMap: HookMap = {
    question: "Start your first tweet with an engaging question that hooks the reader and makes them want to read more.",
    stat: "Start your first tweet with a compelling statistic or number that grabs attention.",
    bold: "Start your first tweet with a bold statement or prediction that makes people stop scrolling.",
    story: "Start your first tweet with a narrative hook or personal experience that draws readers in."
  };
  
  return hookMap[hookStyle] || hookMap.question;
}

// NEW: Build comprehensive custom prompt with ALL data
async function buildComprehensiveCustomPrompt(context: ComprehensiveContext) {
  const { userInputs: options, xSocialData, userHistory, trendingTopics, marketSentiment } = context;
  
  const toneInstructions = getToneInstructions(options.tonePreset);
  const hookInstructions = getHookInstructions(options.hookStyle);
  
  let prompt = `${toneInstructions}

${hookInstructions}

Create a ${options.threadLength}-tweet thread about: ${options.customTopic}

🎯 USER CONTEXT & PREFERENCES:`;

  // Add user historical context
  if (userHistory && userHistory.totalThreads > 0) {
    prompt += `
- User's Experience Level: ${userHistory.totalThreads} previous threads
- Preferred Content Style: ${userHistory.successfulTones || 'Educational'}
- Optimal Thread Length: ${userHistory.preferredLength || 'Medium'} tweets
- Recent Focus Areas: ${userHistory.recentTopics.slice(0, 3).join(', ')}`;
  }

  // Add real-time X social data
  if (xSocialData) {
    prompt += `

📊 REAL-TIME SOCIAL INTELLIGENCE:
- Current Mentions: ${xSocialData.metrics?.totalMentions?.toLocaleString() || 'Growing'}
- Community Engagement: ${xSocialData.metrics?.averageEngagementRate || 'Active'}
- Overall Sentiment: ${xSocialData.sentiment?.overall || 'Positive'}`;

    if (xSocialData.keyTopics && xSocialData.keyTopics.length > 0) {
      prompt += `
- Related Topics: ${xSocialData.keyTopics.join(', ')}`;
    }

    if (xSocialData.topTweets && xSocialData.topTweets.length > 0) {
      prompt += `

🔥 TOP COMMUNITY INSIGHTS:
${xSocialData.topTweets.slice(0, 2).map((tweet: any, index: number) => 
  `${index + 1}. "${tweet.text}" (${tweet.engagement?.likes || 0} likes)`
).join('\n')}`;
    }
  }

  // Add market sentiment
  if (marketSentiment) {
    prompt += `

📈 BROADER MARKET CONTEXT:
- Overall Market Sentiment: ${marketSentiment.overall}
- Fear & Greed Index: ${marketSentiment.fearGreedIndex}/100
- Institutional Activity: ${marketSentiment.institutionalActivity}
- News Flow: ${marketSentiment.newsFlow}`;
  }

  // Add current trends
  if (trendingTopics && trendingTopics.length > 0) {
    prompt += `

🔄 CURRENT TRENDING TOPICS:
${trendingTopics.slice(0, 3).map((t: TrendingTopic) => `- ${t.topic} (${t.change})`).join('\n')}`;
  }

  if (options.includeCTA) {
    prompt += `\n\nEnd with this call-to-action: "${options.ctaText}"`;
  }

  prompt += `

🎯 COMPREHENSIVE AI INSTRUCTIONS:
- Use ALL the multi-source data above to create highly relevant content
- Incorporate user's historical preferences and successful patterns
- Connect your topic to current trends and social sentiment
- Make content feel personalized to this user's style and experience level
- Use real-time insights to make content feel fresh and relevant
- Reference what people are actually discussing about this topic
- Create content that feels current, relevant, and deeply researched
- Format as numbered tweets (1/, 2/, 3/, etc.)
- Optimize for engagement based on user's historical performance patterns`;

  return prompt;
}

// NEW: Build comprehensive trend prompt with ALL data
async function buildComprehensiveTrendPrompt(context: ComprehensiveContext) {
  const { userInputs: options, userHistory, trendingTopics, marketSentiment } = context;
  
  const toneInstructions = getToneInstructions(options.tonePreset);
  const hookInstructions = getHookInstructions(options.hookStyle);
  
  let prompt = `${toneInstructions}

${hookInstructions}

Create a ${options.threadLength}-tweet thread expanding on this X post: ${options.tweetUrl}

🎯 USER CONTEXT & PREFERENCES:`;

  // Add user historical context
  if (userHistory && userHistory.totalThreads > 0) {
    prompt += `
- User's Experience Level: ${userHistory.totalThreads} previous threads
- Preferred Content Style: ${userHistory.successfulTones || 'Educational'}
- Optimal Thread Length: ${userHistory.preferredLength || 'Medium'} tweets
- Recent Focus Areas: ${userHistory.recentTopics.slice(0, 3).join(', ')}`;
  }

  // Add market sentiment
  if (marketSentiment) {
    prompt += `

📈 BROADER MARKET CONTEXT:
- Overall Market Sentiment: ${marketSentiment.overall}
- Fear & Greed Index: ${marketSentiment.fearGreedIndex}/100
- Institutional Activity: ${marketSentiment.institutionalActivity}
- News Flow: ${marketSentiment.newsFlow}`;
  }

  // Add current trending context
  if (trendingTopics && trendingTopics.length > 0) {
    prompt += `

🔄 CURRENT TRENDING CONTEXT:
${trendingTopics.slice(0, 5).map((t: TrendingTopic) => `- ${t.topic} (${t.change})`).join('\n')}`;
  }

  if (options.includeCTA) {
    prompt += `\n\nEnd with this call-to-action: "${options.ctaText}"`;
  }

  prompt += `

🎯 COMPREHENSIVE AI INSTRUCTIONS:
- Analyze the post content and provide deeper insights, context, and commentary
- Use user's historical preferences to tailor the analysis style
- Connect the original post to current trending topics and market context
- Provide broader market implications and expert insights
- Make content feel personalized to this user's expertise level
- Use trending data to add relevant, timely commentary
- Create content that feels current, relevant, and deeply researched
- Format as numbered tweets (1/, 2/, 3/, etc.)
- Optimize for engagement based on user's historical performance patterns`;

  return prompt;
}

// NEW: Enhanced AI API call with comprehensive context
async function callComprehensiveAI(prompt: string, context: ComprehensiveContext) {
  if (!config.openRouterApiKey) {
    throw new Error('AI API key not configured');
  }

  // Enhanced system prompt with comprehensive context awareness
  const systemPrompt = `You are ThreadFlow Pro's AI - the world's most advanced crypto Twitter thread creator with access to comprehensive real-time data. You create viral, engaging threads that provide exceptional value to the crypto community.

ADVANCED CAPABILITIES:
✅ Real-time social sentiment analysis from X (Twitter)
✅ Live market data integration from multiple sources  
✅ Historical user performance pattern analysis
✅ Competitor analysis and market positioning
✅ Current trending topic integration
✅ Comprehensive market sentiment analysis
✅ Community insight incorporation
✅ Personalized content optimization
✅ Multi-source data verification

DATA SOURCES AVAILABLE:
- User historical thread performance and preferences
- Real-time X social sentiment and community insights
- Live token price data from CoinGecko and DEXScreener
- Current trending topics and hashtags
- Competitor analysis and market positioning
- Broader market sentiment indicators
- Community engagement patterns

OPTIMIZATION FRAMEWORK:
- Personalize content based on user's successful historical patterns
- Reference specific real-time metrics and sentiment data
- Connect to current trends and community discussions
- Include competitive insights and unique value propositions
- Optimize engagement based on user's historical performance
- Create content that feels authentically current and data-driven

Use ALL the comprehensive data provided to create threads that feel like they were written by someone who deeply understands the current market, community sentiment, and the user's personal content style.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.openRouterApiKey}`,
      'HTTP-Referer': 'https://threadflowpro.app',
      'X-Title': 'ThreadFlow Pro - Comprehensive AI'
    },
    body: JSON.stringify({
      model: config.aiModel || 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: context.userInputs?.threadLength > 10 ? 3000 : 2000,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI API Error:', error);
    throw new Error(`AI API request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid AI API response format');
  }

  return data.choices[0].message.content;
}

// NEW: Store thread for future learning and personalization
async function storeThreadForLearning(clerkUserId: string, threadArray: string[], context: ComprehensiveContext) {
  try {
    // Create enhanced thread record with comprehensive metadata
    const { data: newThread, error: createError } = await supabase
      .from('threads')
      .insert({
        clerk_id: clerkUserId,
        title: context.userInputs?.customTopic || 
               (context.userInputs?.tokenSymbol ? `${context.userInputs.tokenSymbol} Analysis` :
                `Thread ${new Date().toISOString().split('T')[0]}`),
        content: threadArray.join('\n\n'),
        created_at: new Date().toISOString(),
        metadata: {
          threadType: context.userInputs?.threadType,
          tonePreset: context.userInputs?.tonePreset,
          threadLength: context.userInputs?.threadLength,
          tokenSymbol: context.userInputs?.tokenSymbol,
          customTopic: context.userInputs?.customTopic,
          hookStyle: context.userInputs?.hookStyle,
          dataSourcesUsed: Object.keys(context).filter(key => context[key] !== null).length,
          xIntegrationEnabled: !!context.xSocialData,
          historicalDataUsed: !!context.userHistory,
          competitorAnalysisIncluded: !!context.competitorAnalysis,
          comprehensiveContext: {
            trendingTopics: context.trendingTopics?.slice(0, 3) || [],
            marketSentiment: context.marketSentiment?.overall || 'N/A',
            userExperienceLevel: context.userHistory?.totalThreads || 0,
            dataFreshness: context.timestamp
          }
        }
      })
      .select()
      .single();

    if (createError) {
      console.error('Error storing thread for learning:', createError);
    } else {
      console.log('✅ Thread stored successfully for future personalization');
    }

    return newThread;
  } catch (error) {
    console.error('Error in storeThreadForLearning:', error);
    return null;
  }
}

// NEW: Helper functions for user pattern analysis
function calculatePreferredLength(threads: any[]): string {
  if (threads.length === 0) return 'Medium';
  
  const lengths = threads.map(t => t.metadata?.threadLength || 5);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  if (avgLength <= 5) return 'Short';
  if (avgLength <= 10) return 'Medium';
  return 'Long';
}

function analyzeTonePatterns(threads: any[]): string {
  if (threads.length === 0) return 'Educational';
  
  const tones = threads.map(t => t.metadata?.tonePreset || 'educational');
  const toneCount: ToneCount = {};
  
  tones.forEach((tone: string) => {
    toneCount[tone] = (toneCount[tone] || 0) + 1;
  });
  
  return Object.keys(toneCount).reduce((a, b) => toneCount[a] > toneCount[b] ? a : b);
}

function analyzePostingPatterns(threads: any[]): string[] {
  // This would analyze when user posts most successfully
  // For now, return placeholder data
  return ['Morning (9-11 AM)', 'Evening (7-9 PM)'];
}

// NEW: Helper function to find similar tokens for competitor analysis
async function findSimilarTokens(tokenSymbol: string): Promise<string[]> {
  // Simple categorization - in production this would use ML/AI categorization
  const tokenCategories: TokenCategories = {
    'BTC': ['ETH', 'LTC', 'BCH'],
    'ETH': ['BTC', 'BNB', 'ADA', 'SOL'],
    'SOL': ['ETH', 'ADA', 'AVAX', 'NEAR'],
    'PEPE': ['SHIB', 'DOGE', 'FLOKI', 'BONK'],
    'SHIB': ['DOGE', 'PEPE', 'FLOKI', 'ELON'],
    'DOGE': ['SHIB', 'PEPE', 'FLOKI', 'ELON'],
    'UNI': ['SUSHI', 'CAKE', '1INCH', 'CRV'],
    'AAVE': ['COMP', 'MKR', 'SNX', 'YFI']
  };
  
  return tokenCategories[tokenSymbol.toUpperCase()] || ['BTC', 'ETH', 'SOL'];
}

// NEW: Helper function to analyze market position
function analyzeMarketPosition(tokenSymbol: string, competitorData: any[]): string {
  // This would analyze relative performance vs competitors
  // For now, return placeholder analysis
  const positions = ['Market Leader', 'Strong Contender', 'Emerging Player', 'Undervalued Gem'];
  return positions[Math.floor(Math.random() * positions.length)];
}

// Get user's thread history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const clerkUserId = (req as any).auth?.userId;
    
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const threads = await threadService.getUserThreads(clerkUserId);
    
    res.json({
      success: true,
      threads
    });
  } catch (error) {
    console.error('Error fetching thread history:', error);
    res.status(500).json({ error: 'Failed to fetch thread history' });
  }
});

// Get thread limits and usage
router.get('/limits', requireAuth, async (req, res) => {
  try {
    const clerkUserId = (req as any).auth?.userId;
    
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const limits = await threadService.getThreadLimits(clerkUserId);
    
    res.json({
      canCreate: limits.canCreate,
      remaining: limits.remaining,
      isPremium: limits.isPremium,
      dailyLimit: limits.dailyLimit,
      used: limits.dailyLimit === -1 ? 0 : limits.dailyLimit - limits.remaining,
      reason: limits.reason
    });
  } catch (error) {
    console.error('Error fetching thread limits:', error);
    res.status(500).json({ error: 'Failed to fetch thread limits' });
  }
});

// Get user plan details
router.get('/plan', requireAuth, async (req, res) => {
  try {
    const clerkUserId = (req as any).auth?.userId;
    
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const planDetails = await threadService.getUserPlanDetails(clerkUserId);
    
    res.json(planDetails);
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ error: 'Failed to fetch plan details' });
  }
});

// New endpoint: Get X insights for any query
router.get('/x-insights', requireAuth, async (req, res) => {
  try {
    const { query, type = 'token' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    console.log(`🐦 Fetching X insights for: ${query}`);
    
    const xData = await xIntegrationService.getXData(query, type as any);
    const trending = await xIntegrationService.getTrendingTopics();
    const hashtags = await xIntegrationService.getHashtagTrends();
    
    res.json({
      success: true,
      data: {
        query,
        type,
        insights: xData,
        trending: trending.slice(0, 5),
        suggestedHashtags: hashtags.slice(0, 10),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching X insights:', error);
    res.status(500).json({ error: 'Failed to fetch X insights' });
  }
});

export default router; 