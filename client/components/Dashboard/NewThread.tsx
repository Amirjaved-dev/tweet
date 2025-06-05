import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Zap, 
  Loader2, 
  TrendingUp, 
  Search, 
  Globe, 
  MessageSquare, 
  Settings, 
  DollarSign,
  Users,
  Activity,
  Twitter,
  Copy,
  RefreshCw,
  Bot,
  Hash,
  BarChart3,
  Crown,
  Lock
} from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';
import TokenSearchDropdown from './TokenSearchDropdown';

interface TokenData {
  symbol: string;
  price: string;
  change24h: string;
  marketCap: string;
  volume24h: string;
  sentiment: string;
}

interface ThreadOptions {
  threadType: 'token' | 'custom' | 'trend';
  tokenSymbol: string;
  tweetUrl: string;
  customTopic: string;
  tonePreset: 'degen' | 'hype' | 'educational' | 'shill' | 'calm';
  threadLength: number;
  includePrice: boolean;
  includeCTA: boolean;
  ctaText: string;
  hookStyle: 'question' | 'stat' | 'bold' | 'story';
}

interface PlanDetails {
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
}

export default function NewThread() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isPremium, supabaseUser, isLoading } = useUserData();
  
  const [options, setOptions] = useState<ThreadOptions>({
    threadType: 'custom', // Start with free-tier option
    tokenSymbol: '',
    tweetUrl: '',
    customTopic: '',
    tonePreset: 'educational', // Start with free-tier option
    threadLength: 5, // Conservative start
    includePrice: false, // Premium feature
    includeCTA: true,
    ctaText: 'What do you think? Drop your thoughts below 👇',
    hookStyle: 'question' // Free-tier option
  });
  
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedThread, setGeneratedThread] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'preview'>('basic');

  // Tone preset configurations with premium flags
  const tonePresets = {
    educational: {
      name: 'Educational',
      description: 'Informative, analytical, professional tone',
      color: 'blue', 
      icon: '📚',
      premium: false
    },
    calm: {
      name: 'Calm Analysis',
      description: 'Balanced perspective, measured tone, objective',
      color: 'gray',
      icon: '🧠',
      premium: false
    },
    degen: {
      name: 'Degen Mode',
      description: 'gm frens vibes, ape in, diamond hands energy',
      color: 'green',
      icon: '🦍',
      premium: true
    },
    hype: {
      name: 'Hype Mode', 
      description: 'CAPS LOCK ENERGY, moon mission, rocket emojis',
      color: 'yellow',
      icon: '🚀',
      premium: true
    },
    shill: {
      name: 'Shill Mode',
      description: 'Bullish sentiment, undervalued gems, early alpha',
      color: 'purple',
      icon: '💎',
      premium: true
    }
  };

  // Hook style options with premium flags
  const hookStyles = {
    question: { label: 'Start with an engaging question', premium: false },
    stat: { label: 'Lead with a compelling statistic', premium: true }, 
    bold: { label: 'Make a bold statement or prediction', premium: true },
    story: { label: 'Begin with a narrative or personal experience', premium: true }
  };

  // Thread types with premium flags
  const threadTypes = [
    { 
      id: 'custom', 
      title: 'Custom Topic', 
      description: 'Create threads on any crypto topic',
      icon: MessageSquare,
      color: 'blue',
      premium: false
    },
    { 
      id: 'token', 
      title: 'Token Analysis', 
      description: 'Generate threads about specific tokens',
      icon: DollarSign,
      color: 'purple',
      premium: true
    },
    { 
      id: 'trend', 
      title: 'From Tweet', 
      description: 'Expand on existing X posts',
      icon: Twitter,
      color: 'green',
      premium: true
    }
  ];

  // Fetch plan details and token data
  useEffect(() => {
    if (user) {
      fetchPlanDetails();
    }
  }, [user]);

  useEffect(() => {
    if (options.tokenSymbol && options.tokenSymbol.length > 1) {
      fetchTokenData(options.tokenSymbol);
    }
  }, [options.tokenSymbol]);

  // Update options when plan details change to ensure free users have valid defaults
  useEffect(() => {
    if (planDetails && !planDetails.isPremium) {
      setOptions(prev => ({
        ...prev,
        threadType: planDetails.features.allowedTypes.includes(prev.threadType) ? prev.threadType : 'custom',
        tonePreset: planDetails.features.allowedTones.includes(prev.tonePreset) ? prev.tonePreset : 'educational',
        threadLength: Math.min(prev.threadLength, planDetails.features.maxThreadLength),
        includePrice: planDetails.features.realtimeData ? prev.includePrice : false,
        hookStyle: planDetails.features.advancedHooks ? prev.hookStyle : 'question'
      }));
    }
  }, [planDetails]);

  const fetchPlanDetails = async () => {
    setIsLoadingPlan(true);
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setIsLoadingPlan(false);
        return;
      }
      
      const response = await fetch('/api/threads/plan', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch plan details:', errorData);
        setIsLoadingPlan(false);
        return;
      }
      
      const data = await response.json();
      setPlanDetails(data);
    } catch (err) {
      console.error('Failed to fetch plan details:', err);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const fetchTokenData = async (symbol: string) => {
    setIsLoadingToken(true);
    try {
      const response = await fetch(`/api/token/data?symbol=${symbol}`);
      const data = await response.json();
      
      if (response.ok) {
        setTokenData(data);
      } else {
        setTokenData(null);
      }
    } catch (err) {
      console.error('Failed to fetch token data:', err);
      setTokenData(null);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const generateThread = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedThread([]);
    
    try {
      const token = await getToken();
      
      // ENHANCED: Collect ALL user data and preferences for comprehensive AI analysis
      const userPreferences = {
        preferredTones: localStorage.getItem('preferred_tones')?.split(',') || [],
        preferredLengths: localStorage.getItem('preferred_lengths')?.split(',') || [],
        topics: localStorage.getItem('favorite_topics')?.split(',') || [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        screenSize: `${window.screen.width}x${window.screen.height}`,
        sessionTime: Date.now() - (parseInt(sessionStorage.getItem('session_start') || '0') || Date.now()),
        previousInteractions: JSON.parse(localStorage.getItem('user_interactions') || '[]'),
        customTokens: JSON.parse(localStorage.getItem('threadflowpro_custom_tokens') || '[]')
      };

      // ENHANCED: Collect historical and contextual data
      const historicalContext = {
        sessionData: {
          timeSpent: userPreferences.sessionTime,
          pagesVisited: parseInt(sessionStorage.getItem('pages_visited') || '1'),
          actionsPerformed: parseInt(sessionStorage.getItem('actions_count') || '0'),
          tokensSearched: JSON.parse(sessionStorage.getItem('tokens_searched') || '[]'),
          lastTokenSelected: sessionStorage.getItem('last_token_selected'),
          tabsSwitched: parseInt(sessionStorage.getItem('tabs_switched') || '0')
        },
        preferences: {
          hasUsedTokenBrowser: !!localStorage.getItem('has_used_token_browser'),
          favoriteThreadTypes: JSON.parse(localStorage.getItem('favorite_thread_types') || '[]'),
          mostUsedTones: JSON.parse(localStorage.getItem('most_used_tones') || '[]'),
          averageThreadLength: parseInt(localStorage.getItem('avg_thread_length') || '8'),
          preferredHooks: JSON.parse(localStorage.getItem('preferred_hooks') || '[]'),
          bestPerformingTopics: JSON.parse(localStorage.getItem('best_topics') || '[]')
        },
        engagement: {
          threadsCreatedToday: parseInt(localStorage.getItem('threads_today') || '0'),
          totalThreadsCreated: parseInt(localStorage.getItem('total_threads') || '0'),
          averageGenerationTime: parseInt(localStorage.getItem('avg_gen_time') || '0'),
          mostActiveTimeOfDay: localStorage.getItem('most_active_time') || 'Unknown',
          copyButtonClicks: parseInt(localStorage.getItem('copy_clicks') || '0'),
          regenerationRequests: parseInt(localStorage.getItem('regeneration_count') || '0')
        },
        currentContext: {
          pageLoadTime: Date.now(),
          referrer: document.referrer,
          currentPlan: isPremium ? 'premium' : 'free',
          isFirstTimeUser: !localStorage.getItem('has_generated_thread'),
          timeOnCurrentTab: Date.now() - (parseInt(sessionStorage.getItem('tab_start_time') || Date.now().toString())),
          currentlySelectedToken: options.tokenSymbol,
          hasSeenTokenData: !!tokenData
        }
      };

      // ENHANCED: Comprehensive request with ALL user data
      const comprehensiveRequest = {
        options: {
          ...options,
          // Add enhanced options
          userExperienceLevel: historicalContext.engagement.totalThreadsCreated > 10 ? 'expert' : 
                              historicalContext.engagement.totalThreadsCreated > 3 ? 'intermediate' : 'beginner',
          contextualRelevance: {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            marketOpenStatus: isMarketOpen(),
            userTimezone: userPreferences.timezone,
            sessionType: userPreferences.sessionTime > 300000 ? 'deep_dive' : 'quick_generation'
          },
          enhancedPersonalization: {
            adaptToUserStyle: true,
            useHistoricalPatterns: true,
            optimizeForEngagement: true,
            includePersonalizedInsights: true
          }
        },
        tokenData: tokenData ? {
          ...tokenData,
          userContext: {
            hasViewedThisTokenBefore: historicalContext.sessionData.tokensSearched.includes(options.tokenSymbol),
            isCustomToken: userPreferences.customTokens.some(t => t.symbol === options.tokenSymbol),
            selectionSource: sessionStorage.getItem('token_selection_source') || 'unknown',
            timeSpentAnalyzing: parseInt(sessionStorage.getItem('token_analysis_time') || '0')
          }
        } : null,
        userPreferences: {
          ...userPreferences,
          // Add AI learning data
          learningProfile: {
            contentPreferences: calculateContentPreferences(historicalContext),
            engagementPatterns: analyzeEngagementPatterns(historicalContext),
            successMetrics: calculateSuccessMetrics(historicalContext),
            improvementAreas: identifyImprovementAreas(historicalContext)
          }
        },
        historicalContext: {
          ...historicalContext,
          // Add market context
          marketContext: {
            userActiveHours: identifyActiveHours(historicalContext),
            preferredMarketConditions: identifyPreferredConditions(historicalContext),
            riskTolerance: calculateRiskTolerance(historicalContext),
            investmentFocus: identifyInvestmentFocus(historicalContext)
          }
        },
        // NEW: Real-time context
        realTimeContext: {
          timestamp: new Date().toISOString(),
          browserInfo: {
            userAgent: navigator.userAgent,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            connectionType: (navigator as any).connection?.effectiveType || 'unknown'
          },
          performanceMetrics: {
            pageLoadTime: performance.now(),
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            connectionSpeed: measureConnectionSpeed()
          },
          userInteractionData: {
            clickCount: parseInt(sessionStorage.getItem('click_count') || '0'),
            scrollDepth: calculateScrollDepth(),
            timeSpentOnForm: Date.now() - (parseInt(sessionStorage.getItem('form_start_time') || Date.now().toString())),
            inputChanges: parseInt(sessionStorage.getItem('input_changes') || '0')
          }
        }
      };

      console.log('🚀 Sending comprehensive request with ALL user data to AI...', {
        dataPoints: Object.keys(comprehensiveRequest).length,
        userPreferences: Object.keys(userPreferences).length,
        historicalContext: Object.keys(historicalContext).length,
        enhancedFeatures: true
      });
      
      const response = await fetch('/api/threads/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comprehensiveRequest)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate thread');
      }
      
      setGeneratedThread(data.thread);
      setActiveTab('preview');
      
      // ENHANCED: Store successful generation data for future learning
      updateUserLearningData(data, comprehensiveRequest);
      
      // Update plan details after successful generation
      if (data.usage) {
        setPlanDetails(prev => prev ? {
          ...prev,
          usage: {
            threadsToday: prev.usage.threadsToday + 1,
            remaining: data.usage.remaining
          }
        } : null);
      }

      // ENHANCED: Log generation success with analytics
      logGenerationSuccess(data.enhancedFeatures, comprehensiveRequest);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logGenerationError(err, options);
    } finally {
      setIsGenerating(false);
    }
  };

  // ENHANCED: Helper functions for user data analysis
  const calculateContentPreferences = (context: any) => {
    return {
      preferredComplexity: context.engagement.averageGenerationTime > 30000 ? 'detailed' : 'concise',
      informationDensity: context.preferences.averageThreadLength > 10 ? 'high' : 'moderate',
      technicalLevel: context.engagement.totalThreadsCreated > 5 ? 'advanced' : 'beginner'
    };
  };

  const analyzeEngagementPatterns = (context: any) => {
    return {
      peakActivityTime: context.engagement.mostActiveTimeOfDay,
      sessionDuration: context.sessionData.timeSpent / 60000, // minutes
      interactionFrequency: context.engagement.copyButtonClicks / Math.max(context.engagement.totalThreadsCreated, 1),
      explorationLevel: context.sessionData.tabsSwitched / context.sessionData.pagesVisited
    };
  };

  const calculateSuccessMetrics = (context: any) => {
    return {
      completionRate: 1 - (context.engagement.regenerationRequests / Math.max(context.engagement.totalThreadsCreated, 1)),
      efficiency: context.engagement.averageGenerationTime < 60000 ? 'high' : 'moderate',
      consistency: context.engagement.threadsCreatedToday > 0 ? 'active' : 'sporadic'
    };
  };

  const identifyImprovementAreas = (context: any) => {
    const areas = [];
    if (context.engagement.regenerationRequests > context.engagement.totalThreadsCreated * 0.3) {
      areas.push('content_optimization');
    }
    if (context.preferences.mostUsedTones.length < 2) {
      areas.push('tone_experimentation');
    }
    if (context.engagement.averageGenerationTime > 120000) {
      areas.push('faster_completion');
    }
    return areas;
  };

  // Additional helper functions
  const isMarketOpen = () => {
    const now = new Date();
    const hour = now.getUTCHours();
    return hour >= 8 && hour <= 22; // Simplified market hours
  };

  const identifyActiveHours = (context: any) => {
    return context.engagement.mostActiveTimeOfDay || 'Various';
  };

  const identifyPreferredConditions = (context: any) => {
    return context.preferences.bestPerformingTopics.length > 0 ? 'Bull Market' : 'All Conditions';
  };

  const calculateRiskTolerance = (context: any) => {
    const memeTokenUsage = context.sessionData.tokensSearched.filter(t => 
      ['PEPE', 'SHIB', 'DOGE', 'FLOKI'].includes(t.toUpperCase())
    ).length;
    return memeTokenUsage > 2 ? 'High' : memeTokenUsage > 0 ? 'Moderate' : 'Conservative';
  };

  const identifyInvestmentFocus = (context: any) => {
    const topics = context.preferences.bestPerformingTopics;
    if (topics.includes('DeFi')) return 'DeFi';
    if (topics.includes('Gaming')) return 'Gaming';
    if (topics.includes('AI')) return 'AI/Tech';
    return 'General';
  };

  const measureConnectionSpeed = () => {
    // Simplified connection speed measurement
    return (navigator as any).connection?.downlink || 'unknown';
  };

  const calculateScrollDepth = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100) || 0;
  };

  const updateUserLearningData = (responseData: any, requestData: any) => {
    // Store successful patterns for future use
    const successData = {
      timestamp: Date.now(),
      threadLength: responseData.thread?.length || 0,
      dataSourcesUsed: responseData.enhancedFeatures?.dataSourcesUsed || 0,
      generationSuccess: true,
      userSatisfaction: 'high' // Would be measured from user feedback
    };

    const existingData = JSON.parse(localStorage.getItem('ai_learning_data') || '[]');
    existingData.push(successData);
    
    // Keep only last 50 entries
    if (existingData.length > 50) existingData.shift();
    
    localStorage.setItem('ai_learning_data', JSON.stringify(existingData));
    
    // Update usage counters
    const currentThreads = parseInt(localStorage.getItem('total_threads') || '0') + 1;
    localStorage.setItem('total_threads', currentThreads.toString());
    localStorage.setItem('has_generated_thread', 'true');
  };

  const logGenerationSuccess = (enhancedFeatures: any, requestData: any) => {
    console.log('✅ Enhanced AI Generation Success:', {
      dataSourcesUsed: enhancedFeatures?.dataSourcesUsed,
      aiModel: enhancedFeatures?.aiModel,
      xIntegrationEnabled: enhancedFeatures?.xIntegrationEnabled,
      historicalDataUsed: enhancedFeatures?.historicalDataUsed,
      competitorAnalysisIncluded: enhancedFeatures?.competitorAnalysisIncluded,
      userDataPoints: Object.keys(requestData).length,
      personalizationLevel: 'Maximum'
    });
  };

  const logGenerationError = (error: any, options: any) => {
    console.error('❌ Enhanced AI Generation Error:', {
      error: error.message,
      threadType: options.threadType,
      tokenSymbol: options.tokenSymbol,
      userExperience: localStorage.getItem('total_threads') || '0'
    });
  };

  const copyThread = () => {
    const threadText = generatedThread.join('\n\n');
    navigator.clipboard.writeText(threadText);
  };

  const isFeatureRestricted = (feature: string) => {
    if (!planDetails || planDetails.isPremium) return false;
    
    switch (feature) {
      case 'token':
      case 'trend':
        return !planDetails.features.allowedTypes.includes(feature);
      case 'realtimeData':
        return !planDetails.features.realtimeData;
      case 'advancedHooks':
        return !planDetails.features.advancedHooks;
      default:
        return false;
    }
  };

  const getMaxThreadLength = () => {
    return planDetails?.features.maxThreadLength || 8;
  };

  // Simplified loading state for debugging
  if (!user || isLoadingPlan) {
    console.log('NewThread Loading State:', { 
      user: !!user, 
      isLoading, 
      isLoadingPlan, 
      supabaseUser: !!supabaseUser,
      planDetails: !!planDetails 
    });
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
        
      <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            <p className="text-gray-400 text-sm">
              {!user ? 'Loading authentication...' : 'Loading plan details...'}
            </p>
            <p className="text-gray-500 text-xs">
              User: {user ? '✓' : '✗'} | Supabase: {supabaseUser ? '✓' : '✗'} | Plan: {planDetails ? '✓' : '✗'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <div className="p-6 max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Create New Thread</h2>
          <div className="flex items-center gap-4">
            {planDetails && !planDetails.isPremium && planDetails.usage && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-medium text-sm">
                    Free Plan: {planDetails.usage.threadsToday}/{planDetails.features.dailyLimit} threads today
                  </span>
                </div>
              </div>
            )}
            {planDetails?.isPremium && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 font-medium text-sm">Premium Plan</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-white/20 mb-6">
          {[
            { id: 'basic', label: 'Basic Setup', icon: MessageSquare },
            { id: 'advanced', label: 'Advanced Options', icon: Settings },
            { id: 'preview', label: 'Preview & Generate', icon: Bot }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === tab.id 
                  ? 'text-purple-400 border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Basic Setup Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Thread Type Selection */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Thread Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {threadTypes.map(type => {
                      const isRestricted = isFeatureRestricted(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => !isRestricted && setOptions(prev => ({ ...prev, threadType: type.id as any }))}
                          disabled={isRestricted}
                          className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                            options.threadType === type.id
                              ? `border-${type.color}-500 bg-${type.color}-500/10`
                              : isRestricted 
                                ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                                : 'border-white/20 bg-black/20 hover:border-white/40'
                          }`}
                        >
                          {type.premium && isRestricted && (
                            <div className="absolute top-2 right-2">
                              <Crown className="w-4 h-4 text-yellow-500" />
                            </div>
                          )}
                          <type.icon className={`w-6 h-6 mb-2 ${
                            options.threadType === type.id ? `text-${type.color}-400` : 'text-gray-400'
                          }`} />
                          <h4 className="font-semibold text-white">{type.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                          {type.premium && isRestricted && (
                            <p className="text-xs text-yellow-400 mt-2">Premium Feature</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Input */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Content Input</h3>
                  
                  {options.threadType === 'token' && (
                    <div className="space-y-4">
                      <TokenSearchDropdown
                        value={options.tokenSymbol}
                        onChange={(symbol) => setOptions(prev => ({ ...prev, tokenSymbol: symbol }))}
                        placeholder="BTC, ETH, SOL..."
                        disabled={isLoadingToken}
                      />
                    </div>
                  )}
                  
                  {options.threadType === 'custom' && (
                    <div>
                      <label className="block text-white font-medium mb-2">Topic</label>
                      <input
                        type="text"
                        value={options.customTopic}
                        onChange={(e) => setOptions(prev => ({ ...prev, customTopic: e.target.value }))}
                        placeholder="DeFi trends, NFT market analysis, crypto regulations..."
                        className="w-full bg-black/50 border border-white/20 rounded-lg text-white px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  )}
                  
                  {options.threadType === 'trend' && (
                    <div>
                      <label className="block text-white font-medium mb-2">X Post URL</label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={options.tweetUrl}
                          onChange={(e) => setOptions(prev => ({ ...prev, tweetUrl: e.target.value }))}
                          placeholder="https://x.com/username/status/..."
                          className="w-full bg-black/50 border border-white/20 rounded-lg text-white pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tone Preset Selection */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Tone Preset</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(tonePresets).map(([key, preset]) => {
                      const isRestricted = preset.premium && !planDetails?.isPremium;
                      return (
                        <button
                          key={key}
                          onClick={() => !isRestricted && setOptions(prev => ({ ...prev, tonePreset: key as any }))}
                          disabled={isRestricted}
                          className={`p-4 rounded-lg border transition-all text-left relative ${
                            options.tonePreset === key
                              ? `border-${preset.color}-500 bg-${preset.color}-500/10`
                              : isRestricted
                                ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                                : 'border-white/20 bg-black/20 hover:border-white/40'
                          }`}
                        >
                          {preset.premium && isRestricted && (
                            <div className="absolute top-2 right-2">
                              <Crown className="w-4 h-4 text-yellow-500" />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{preset.icon}</span>
                            <div>
                              <h4 className="font-semibold text-white">{preset.name}</h4>
                              <p className="text-sm text-gray-400">{preset.description}</p>
                              {preset.premium && isRestricted && (
                                <p className="text-xs text-yellow-400 mt-1">Premium Feature</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
        </div>
      )}
      
            {/* Advanced Options Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* Thread Configuration */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Thread Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Thread Length (Max: {getMaxThreadLength()})
                      </label>
                      <select
                        value={options.threadLength}
                        onChange={(e) => setOptions(prev => ({ ...prev, threadLength: parseInt(e.target.value) }))}
                        className="w-full bg-black/50 border border-white/20 rounded-lg text-white px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value={5}>Short (5 tweets)</option>
                        {getMaxThreadLength() >= 8 && <option value={8}>Medium (8 tweets)</option>}
                        {getMaxThreadLength() >= 12 && <option value={12}>Long (12 tweets)</option>}
                        {getMaxThreadLength() >= 15 && <option value={15}>Extended (15 tweets)</option>}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Hook Style</label>
                      <select
                        value={options.hookStyle}
                        onChange={(e) => setOptions(prev => ({ ...prev, hookStyle: e.target.value as any }))}
                        className="w-full bg-black/50 border border-white/20 rounded-lg text-white px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        {Object.entries(hookStyles).map(([key, style]) => {
                          const isRestricted = style.premium && !planDetails?.isPremium;
                          return (
                            <option key={key} value={key} disabled={isRestricted}>
                              {style.label} {isRestricted ? '(Premium)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Features & Integrations */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Features & Integrations</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includePrice}
                        onChange={(e) => setOptions(prev => ({ ...prev, includePrice: e.target.checked }))}
                        disabled={isFeatureRestricted('realtimeData')}
                        className="w-5 h-5 text-purple-600 bg-black/50 border border-white/20 rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <span className="text-white">Include real-time price data</span>
                        {isFeatureRestricted('realtimeData') && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeCTA}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeCTA: e.target.checked }))}
                        className="w-5 h-5 text-purple-600 bg-black/50 border border-white/20 rounded focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Include call-to-action</span>
                      </div>
          </label>
                    
                    {options.includeCTA && (
                      <div className="ml-8">
                        <label className="block text-white font-medium mb-2">CTA Text</label>
                        <input
                          type="text"
                          value={options.ctaText}
                          onChange={(e) => setOptions(prev => ({ ...prev, ctaText: e.target.value }))}
                          placeholder="What do you think? Drop your thoughts below 👇"
                          className="w-full bg-black/50 border border-white/20 rounded-lg text-white px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
                    )}
                  </div>
                </div>

                {/* Premium Upgrade Prompt */}
                {!planDetails?.isPremium && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      <h3 className="text-xl font-bold text-white">Unlock Premium Features</h3>
                    </div>
                    <ul className="space-y-2 text-gray-300 mb-4">
                      <li>• Unlimited daily threads</li>
                      <li>• Token analysis with real-time data</li>
                      <li>• Tweet expansion feature</li>
                      <li>• Advanced tone presets (Degen, Hype, Shill)</li>
                      <li>• Longer threads (up to 15 tweets)</li>
                      <li>• Advanced hook styles</li>
                    </ul>
                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200">
                      Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preview & Generate Tab */}
            {activeTab === 'preview' && (
              <div className="space-y-6">
                {generatedThread.length > 0 ? (
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Generated Thread</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={copyThread}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Thread
                        </button>
                        <button
                          onClick={generateThread}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {generatedThread.map((tweet, index) => (
                        <div key={index} className="bg-black/60 border border-white/10 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-white flex-1">{tweet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
                    <Bot className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Generate</h3>
                    <p className="text-gray-400 mb-6">Click the button below to create your AI-powered thread</p>
                    
                    {planDetails && !planDetails.isPremium && planDetails.usage && planDetails.usage.remaining <= 0 ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                        <p className="text-yellow-300">Daily thread limit reached. Upgrade to premium for unlimited threads.</p>
                      </div>
                    ) : (
          <button
                        onClick={generateThread}
                        disabled={isGenerating || !user || (planDetails && !planDetails.isPremium && planDetails.usage && planDetails.usage.remaining <= 0)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Thread...
              </>
            ) : (
              <>
                            <Zap className="w-5 h-5" />
                            Generate Thread
              </>
            )}
          </button>
                    )}
        </div>
                )}
        
        {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                    {error.includes('premium') && (
                      <button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-all">
                        Upgrade to Premium
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            {planDetails && (
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Usage Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan:</span>
                    <span className="text-white font-medium capitalize flex items-center gap-1">
                      {planDetails.plan}
                      {planDetails.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Today's Usage:</span>
                    <span className="text-white font-medium">
                      {planDetails.usage?.threadsToday || 0}
                      {planDetails.features.dailyLimit !== -1 && `/${planDetails.features.dailyLimit}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="text-white font-medium">
                      {planDetails.features.dailyLimit === -1 ? 'Unlimited' : (planDetails.usage?.remaining || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Token Data Display */}
            {options.threadType === 'token' && tokenData && (
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Token Data
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-medium">{tokenData.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Change:</span>
                    <span className={`font-medium ${
                      tokenData.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tokenData.change24h}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="text-white font-medium">{tokenData.marketCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume:</span>
                    <span className="text-white font-medium">{tokenData.volume24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sentiment:</span>
                    <span className="text-green-400 font-medium">{tokenData.sentiment}</span>
                  </div>
                </div>
          </div>
        )}
        
            {/* Thread Preview Summary */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Thread Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white font-medium capitalize">{options.threadType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tone:</span>
                  <span className="text-white font-medium">{tonePresets[options.tonePreset].name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Length:</span>
                  <span className="text-white font-medium">{options.threadLength} tweets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Data:</span>
                  <span className="text-white font-medium">{options.includePrice ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CTA:</span>
                  <span className="text-white font-medium">{options.includeCTA ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Use specific token symbols for better data accuracy</li>
                <li>• Degen mode works best for meme coins</li>
                <li>• Educational tone is great for complex DeFi topics</li>
                <li>• Include CTAs to boost engagement</li>
                <li>• Longer threads work better for deep analysis</li>
                {!planDetails?.isPremium && (
                  <li className="text-yellow-400">• Upgrade to premium for unlimited features!</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 