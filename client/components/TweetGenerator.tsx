import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import TonePresets from './TonePresets';

interface TweetGeneratorProps {
  onTweetGenerated?: (tweet: any) => void;
  hasReachedLimit?: boolean;
}

interface GeneratedTweet {
  id: string;
  content: string;
  score: number;
  reasoning: string;
  hashtags: string[];
  mentions: string[];
  engagement_prediction: string;
}

interface TopicResearch {
  summary: string;
  trending_hashtags: string[];
  key_points: string[];
  recent_news: string[];
  suggested_mentions: string[];
  optimal_timing: string;
}

export default function TweetGenerator({ onTweetGenerated, hasReachedLimit = false }: TweetGeneratorProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  // Form state
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [mentions, setMentions] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTweets, setRemainingTweets] = useState<number | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  
  // Enhanced features
  const [autoResearch, setAutoResearch] = useState(true);
  const [topicResearch, setTopicResearch] = useState<TopicResearch | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedTweet[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [generateMultiple, setGenerateMultiple] = useState(false);
  
  // Advanced research data
  const [accountInsights, setAccountInsights] = useState<any>({});
  const [trendingData, setTrendingData] = useState<any>(null);
  const [researchLoading, setResearchLoading] = useState<boolean>(false);
  
  // Advanced options
  const [tweetType, setTweetType] = useState<string>('single');
  const [targetAudience, setTargetAudience] = useState<string>('general');
  const [viralPotential, setViralPotential] = useState<string>('medium');

  // Tone options (similar to ThreadGenerator)
  const tones = [
    'Professional', 'Bold', 'Funny', 'Educational', 'Motivational',
    'Controversial', 'Inspirational', 'Thought-provoking', 'Casual', 'Expert'
  ];

  // Tweet type options
  const tweetTypes = [
    { id: 'single', name: 'Single Tweet', description: 'One powerful tweet' },
    { id: 'thread', name: 'Thread Starter', description: 'Tweet to start a thread' },
    { id: 'viral', name: 'Viral Optimized', description: 'Maximum shareability' },
    { id: 'educational', name: 'Educational', description: 'Informative content' },
    { id: 'promotional', name: 'Promotional', description: 'Product/service promotion' }
  ];

  // Audience options
  const audienceOptions = [
    { id: 'general', name: 'General' },
    { id: 'tech', name: 'Tech' },
    { id: 'business', name: 'Business' },
    { id: 'creators', name: 'Creators' },
    { id: 'finance', name: 'Finance' },
    { id: 'crypto', name: 'Crypto' },
    { id: 'ai', name: 'AI/ML' },
    { id: 'startup', name: 'Startup' }
  ];

  // Fetch remaining tweets
  useEffect(() => {
    const fetchRemainingTweets = async () => {
      if (!user?.id) return;

      try {
        const token = await getToken();
        const response = await fetch(`/api/tweet/limit`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setRemainingTweets(data.remaining);
        }
      } catch (err) {
        console.error('Error fetching tweet limit:', err);
        setRemainingTweets(user ? 10 : 0);
      }
    };
    
    if (user) {
      fetchRemainingTweets();
    }
  }, [user, getToken, hasReachedLimit]);

  // Auto-research when topic changes
  useEffect(() => {
    if (autoResearch && topic.length > 5) {
      const timeoutId = setTimeout(() => {
        handleTopicResearch();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [topic, autoResearch]);

  // Research topic
  const handleTopicResearch = async () => {
    if (!topic || topic.length < 3) return;
    
    setResearchLoading(true);
    
    try {
      const token = await getToken();
      
      // 1. Basic topic research
      const researchResponse = await fetch('/api/tweet/research', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          topic,
          includeNews: true,
          includeTrending: true,
          targetAudience 
        })
      });

      if (researchResponse.ok) {
        const research = await researchResponse.json();
        // Normalize the research data to ensure arrays
        const normalizedResearch = {
          ...research,
          trending_hashtags: Array.isArray(research.trending_hashtags) ? research.trending_hashtags : [],
          key_points: Array.isArray(research.key_points) ? research.key_points : [],
          recent_news: Array.isArray(research.recent_news) ? research.recent_news : [],
          suggested_mentions: Array.isArray(research.suggested_mentions) ? research.suggested_mentions : [],
          current_trends: Array.isArray(research.current_trends) ? research.current_trends : []
        };
        setTopicResearch(normalizedResearch);
        
        // 2. Fetch trending data
        try {
          const trendingResponse = await fetch(`/api/tweet/trending-data?topic=${encodeURIComponent(topic)}&audience=${encodeURIComponent(targetAudience)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (trendingResponse.ok) {
            const trending = await trendingResponse.json();
            // Normalize the trending data to ensure arrays
            const normalizedTrending = {
              ...trending,
              viral_content_types: Array.isArray(trending.viral_content_types) ? trending.viral_content_types : [],
              algorithm_favors: Array.isArray(trending.algorithm_favors) ? trending.algorithm_favors : [],
              trending_hashtags: Array.isArray(trending.trending_hashtags) ? trending.trending_hashtags : [],
              hot_discussions: Array.isArray(trending.hot_discussions) ? trending.hot_discussions : [],
              trending_keywords: Array.isArray(trending.trending_keywords) ? trending.trending_keywords : []
            };
            setTrendingData(normalizedTrending);
          }
        } catch (trendError) {
          console.warn('Trending data fetch failed:', trendError);
        }
        
        // 3. Fetch account insights for suggested mentions
        if (research.suggested_mentions && research.suggested_mentions.length > 0) {
          try {
            const accountResponse = await fetch('/api/tweet/account-insights', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                accounts: research.suggested_mentions,
                topic
              })
            });
            
            if (accountResponse.ok) {
              const accountData = await accountResponse.json();
              setAccountInsights(accountData.account_insights || {});
            }
          } catch (accountError) {
            console.warn('Account insights fetch failed:', accountError);
          }
        }
      }
    } catch (err) {
      console.warn('Research failed:', err);
    } finally {
      setResearchLoading(false);
    }
  };

  // Mention management
  const addMentionInput = () => setMentions([...mentions, '']);
  const removeMentionInput = (index: number) => {
    if (mentions.length > 1) {
      setMentions(mentions.filter((_, i) => i !== index));
    }
  };
  const updateMention = (index: number, value: string) => {
    const newMentions = [...mentions];
    newMentions[index] = value;
    setMentions(newMentions);
  };

  // Generate tweets
  const generateTweets = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic) {
      setError('Please enter a topic');
      return;
    }

    if (!user?.id) {
      setError('Please sign in to generate tweets');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedVariations([]);
    
    try {
      const token = await getToken();
      
      // Filter mentions and get advanced options
      const filteredMentions = mentions.filter(m => m.trim() !== '');
      const suggestedMentions = topicResearch?.suggested_mentions || [];
      const allMentions = [...filteredMentions, ...suggestedMentions];
      
      // Get advanced options from form
      const includeHashtags = (document.getElementById('includeHashtags') as HTMLInputElement)?.checked ?? true;
      const includeEmojis = (document.getElementById('includeEmojis') as HTMLInputElement)?.checked ?? true;
      const includeCTA = (document.getElementById('includeCTA') as HTMLInputElement)?.checked ?? false;
      const includeQuestion = (document.getElementById('includeQuestion') as HTMLInputElement)?.checked ?? false;
      
      const requestBody = {
        topic,
        tone,
        mentions: allMentions,
        referenceTweets: [],
        topicResearch: {
          ...topicResearch,
          account_insights: accountInsights,
          trending_data: trendingData
        },
        generateMultiple,
        options: {
          tweetType,
          targetAudience,
          includeHashtags,
          includeEmojis,
          includeCTA,
          includeQuestion,
          urgency: 'normal',
          viralPotential,
          optimizeEngagement: true,
          includeNews: true,
          includeTrending: true,
          useResearchData: true,
          enhancedResearch: true
        }
      };
      
      const response = await fetch('/api/tweet/generate-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific limit errors
        if (response.status === 403 && errorData.error?.includes('limit')) {
          setRemainingTweets(0);
          setError('Daily tweet generation limit reached. Upgrade your plan to continue or wait until tomorrow.');
        } else {
          throw new Error(errorData.error || 'Failed to generate tweets');
        }
        return;
      }
      
      const data = await response.json();
      
      setRemainingTweets(data.remaining);
      setGeneratedVariations(data.variations || [data.tweet]);
      setSelectedVariation(0);
      
      if (onTweetGenerated && data.variations?.length > 0) {
        onTweetGenerated({
          id: data.variations[0].id,
          topic,
          tone,
          content: data.variations[0].content,
          mentions: allMentions,
          created_at: new Date().toISOString()
        });
      }
      
      // Reset form
      setTopic('');
      
    } catch (err: any) {
      console.error('Tweet generation error:', err);
      if (err.message?.includes('limit')) {
        setRemainingTweets(0);
        setError('Daily tweet generation limit reached. Upgrade your plan to continue generating tweets.');
      } else {
        setError(err.message || 'Error generating tweets. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy tweet
  const copyTweet = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">🚀 AI Tweet Generator</h2>
          <p className="text-gray-400 mb-6">Please sign in to access our AI-powered tweet generation with research capabilities</p>
          <div className="flex justify-center space-x-4">
            <a 
              href="/sign-in" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Sign In
            </a>
            <a 
              href="/sign-up" 
              className="border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasReachedLimit) {
    return (
      <div className="space-y-6">
        <div className="bg-[#0F1736] rounded-lg border border-red-900/30 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-300 mb-2">Daily Tweet Limit Reached</h2>
            <p className="text-gray-400 mb-6">You've reached your daily tweet generation limit. Upgrade your plan to continue generating tweets or wait until tomorrow for your limit to reset.</p>
          </div>
          
          <div className="bg-[#0A0F29] rounded-lg p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">🔓 Unlock More Tweets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <h4 className="text-blue-400 font-medium mb-2">Pro Plan</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 50 tweets per day</li>
                  <li>• Advanced research features</li>
                  <li>• Multiple variations</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-purple-400 font-medium mb-2">Premium Plan</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Unlimited tweets</li>
                  <li>• All Pro features</li>
                  <li>• Advanced analytics</li>
                  <li>• Custom integrations</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/pricing" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Upgrade Plan
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="border border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Check Again
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Your limit resets daily at midnight UTC. Current remaining: <span className="text-red-400 font-medium">0 tweets</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Limit Warning Banner */}
      {remainingTweets !== null && remainingTweets <= 3 && remainingTweets > 0 && (
        <div className={`rounded-lg border p-4 ${
          remainingTweets === 1 ? 'bg-red-900/20 border-red-700/50' :
          remainingTweets <= 2 ? 'bg-yellow-900/20 border-yellow-700/50' :
          'bg-orange-900/20 border-orange-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                remainingTweets === 1 ? 'bg-red-400' :
                remainingTweets <= 2 ? 'bg-yellow-400' :
                'bg-orange-400'
              }`}></div>
              <div>
                <p className={`text-sm font-medium ${
                  remainingTweets === 1 ? 'text-red-300' :
                  remainingTweets <= 2 ? 'text-yellow-300' :
                  'text-orange-300'
                }`}>
                  {remainingTweets === 1 ? 'Last Tweet!' : `${remainingTweets} tweets remaining`}
                </p>
                <p className="text-xs text-gray-400">
                  {remainingTweets === 1 
                    ? 'This is your last tweet for today. Consider upgrading for unlimited access.' 
                    : 'You\'re running low on tweets. Upgrade your plan to continue generating after reaching the limit.'
                  }
                </p>
              </div>
            </div>
            <a 
              href="/pricing"
              className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              Upgrade
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🚀 AI Tweet Generator</h2>
          <p className="text-gray-400 text-sm mt-1">Create engaging tweets with AI research and optimization</p>
        </div>
        {remainingTweets !== null && (
          <div className="text-sm text-gray-400 bg-[#0A0F29] px-3 py-2 rounded-lg border border-blue-900/30">
            Remaining tweets: <span className={`font-medium ${
              remainingTweets === 0 ? 'text-red-400' :
              remainingTweets <= 2 ? 'text-yellow-400' : 
              'text-blue-400'
            }`}>{remainingTweets}</span>
          </div>
        )}
      </div>

      <form onSubmit={generateTweets} className="space-y-6">
        {/* Topic Input */}
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                📝 Tweet Topic *
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoResearch}
                    onChange={(e) => setAutoResearch(e.target.checked)}
                    className="mr-2 rounded"
                  />
                  Auto-research
                </label>
                <button
                  type="button"
                  onClick={handleTopicResearch}
                  disabled={!topic || researchLoading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {researchLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Researching...
                    </span>
                  ) : (
                    '🔍 Research'
                  )}
                </button>
              </div>
            </div>
            
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI trends 2024, productivity tips, crypto analysis..."
              className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
              disabled={isLoading || hasReachedLimit}
            />
            
            {topicResearch && (
              <div className="mt-4 p-4 bg-[#0A0F29] rounded-lg border border-blue-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-400">🎯 Research Insights</h4>
                  {researchLoading && (
                    <div className="flex items-center text-xs text-gray-400">
                      <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Researching...
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <p className="text-gray-300 mb-1 text-xs font-medium">📋 Summary:</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{topicResearch.summary}</p>
                  </div>

                  {/* Grid Layout for Better Organization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Trending Hashtags */}
                    <div>
                      <p className="text-gray-300 mb-2 text-xs font-medium">🔥 Trending Hashtags:</p>
                      <div className="flex flex-wrap gap-1">
                        {topicResearch.trending_hashtags && Array.isArray(topicResearch.trending_hashtags) && topicResearch.trending_hashtags.slice(0, 8).map((hashtag, i) => (
                          <span key={i} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded hover:bg-blue-900/50 cursor-pointer transition-colors">
                            #{hashtag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Key Points */}
                    <div>
                      <p className="text-gray-300 mb-2 text-xs font-medium">💡 Key Talking Points:</p>
                      <div className="space-y-1">
                        {topicResearch.key_points && Array.isArray(topicResearch.key_points) && topicResearch.key_points.slice(0, 3).map((point, i) => (
                          <div key={i} className="text-xs text-gray-400 flex items-start">
                            <span className="text-green-400 mr-1">•</span>
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent News */}
                    {topicResearch.recent_news && Array.isArray(topicResearch.recent_news) && topicResearch.recent_news.length > 0 && (
                      <div>
                        <p className="text-gray-300 mb-2 text-xs font-medium">📰 Recent Developments:</p>
                        <div className="space-y-1">
                          {topicResearch.recent_news.slice(0, 2).map((news, i) => (
                            <div key={i} className="text-xs text-gray-400 flex items-start">
                              <span className="text-yellow-400 mr-1">•</span>
                              <span className="leading-relaxed">{news}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Mentions */}
                    <div>
                      <p className="text-gray-300 mb-2 text-xs font-medium">🏷️ Strategic Mentions:</p>
                      <div className="flex flex-wrap gap-1">
                        {topicResearch.suggested_mentions && Array.isArray(topicResearch.suggested_mentions) && topicResearch.suggested_mentions.slice(0, 6).map((mention, i) => (
                          <div key={i} className="relative group">
                            <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded hover:bg-green-900/50 cursor-pointer transition-colors">
                              @{mention}
                            </span>
                            {/* Account Insight Tooltip */}
                            {accountInsights[mention] && (
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 bg-gray-900 border border-gray-700 rounded-lg p-3 w-64 text-xs">
                                <div className="font-medium text-white mb-1">@{mention}</div>
                                <div className="text-gray-300 mb-1">
                                  <span className="font-medium">Expertise:</span> {accountInsights[mention].expertise}
                                </div>
                                <div className="text-gray-300 mb-1">
                                  <span className="font-medium">Style:</span> {accountInsights[mention].style}
                                </div>
                                <div className="text-gray-400">
                                  <span className="font-medium">Strategy:</span> {accountInsights[mention].mention_strategy}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trending Data */}
                  {trendingData && (
                    <div className="mt-4 pt-4 border-t border-blue-900/20">
                      <p className="text-gray-300 mb-2 text-xs font-medium">📈 Live Trending Intelligence:</p>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {trendingData.viral_content_types && Array.isArray(trendingData.viral_content_types) && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">🚀 Viral Formats:</p>
                            <div className="space-y-1">
                              {trendingData.viral_content_types.slice(0, 2).map((format, i) => (
                                <div key={i} className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                                  {format}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {trendingData.algorithm_favors && Array.isArray(trendingData.algorithm_favors) && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">🤖 Algorithm Tips:</p>
                            <div className="space-y-1">
                              {trendingData.algorithm_favors.slice(0, 2).map((tip, i) => (
                                <div key={i} className="text-xs text-cyan-300 bg-cyan-900/20 px-2 py-1 rounded">
                                  {tip}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {trendingData.engagement_peaks && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">⏰ Optimal Timing:</p>
                            <div className="text-xs text-orange-300 bg-orange-900/20 px-2 py-1 rounded">
                              {trendingData.engagement_peaks}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Optimal Timing */}
                  <div className="mt-3 pt-3 border-t border-blue-900/20">
                    <p className="text-gray-300 mb-1 text-xs font-medium">⏰ Posting Strategy:</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{topicResearch.optimal_timing}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mentions */}
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                🏷️ Mentions (optional)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={addMentionInput}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Add Mention
                </button>
                {topicResearch?.suggested_mentions && Array.isArray(topicResearch.suggested_mentions) && topicResearch.suggested_mentions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newMentions = [...mentions];
                      topicResearch.suggested_mentions.forEach((suggestedMention, index) => {
                        if (index < 3 && newMentions[index] === '') {
                          newMentions[index] = suggestedMention;
                        }
                      });
                      setMentions(newMentions);
                    }}
                    className="text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    + Use Suggested
                  </button>
                )}
              </div>
            </div>
            
            {mentions.map((mention, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 font-medium">@</span>
                    <input
                      type="text"
                      value={mention}
                      onChange={(e) => updateMention(index, e.target.value)}
                      placeholder="username"
                      className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] pl-7 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                      disabled={isLoading || hasReachedLimit}
                    />
                  </div>
                  {mentions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMentionInput(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Show account insights if available */}
                {mention && accountInsights[mention] && (
                  <div className="ml-7 p-2 bg-[#0A0F29] rounded border border-green-900/30">
                    <div className="text-xs text-green-300 font-medium mb-1">@{mention} Insights:</div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div><span className="text-gray-300">Expertise:</span> {accountInsights[mention].expertise}</div>
                      <div><span className="text-gray-300">Style:</span> {accountInsights[mention].style}</div>
                      <div><span className="text-gray-300">Strategy:</span> {accountInsights[mention].mention_strategy}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Quick suggestions from research */}
            {topicResearch?.suggested_mentions && Array.isArray(topicResearch.suggested_mentions) && topicResearch.suggested_mentions.length > 0 && (
              <div className="pt-3 border-t border-blue-900/20">
                <p className="text-xs text-gray-400 mb-2">💡 Suggested from research:</p>
                <div className="flex flex-wrap gap-1">
                  {topicResearch.suggested_mentions.slice(0, 8).map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const emptyIndex = mentions.findIndex(m => m.trim() === '');
                        if (emptyIndex !== -1) {
                          updateMention(emptyIndex, suggestion);
                        } else {
                          setMentions([...mentions, suggestion]);
                        }
                      }}
                      className="text-xs bg-green-900/20 text-green-300 px-2 py-1 rounded hover:bg-green-900/40 transition-colors"
                      disabled={mentions.includes(suggestion)}
                    >
                      @{suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tone and Type Selection */}
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-6">
          <div className="space-y-6">
            {/* Tone Selection */}
            <div>
              <TonePresets
                onSelect={(selectedTone) => setTone(selectedTone)}
                currentTone={tone}
                variant="general"
              />
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full mt-3 appearance-none rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                disabled={isLoading || hasReachedLimit}
              >
                {tones.map((toneOption) => (
                  <option key={toneOption} value={toneOption}>
                    {toneOption}
                  </option>
                ))}
              </select>
            </div>

            {/* Tweet Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Tweet Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tweetTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTweetType(type.id)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      tweetType === type.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-blue-900/20 border-blue-900/30 text-blue-300 hover:bg-blue-900/40'
                    }`}
                    disabled={isLoading || hasReachedLimit}
                  >
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs opacity-75 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audience and Viral Potential */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {audienceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTargetAudience(option.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        targetAudience === option.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/40'
                      }`}
                      disabled={isLoading || hasReachedLimit}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">🔥 Viral Potential</label>
                <select
                  value={viralPotential}
                  onChange={(e) => setViralPotential(e.target.value)}
                  className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  disabled={isLoading || hasReachedLimit}
                >
                  <option value="low">Conservative</option>
                  <option value="medium">Balanced</option>
                  <option value="high">Aggressive</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">⚙️ Advanced Options</h3>
            <button
              type="button"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isAdvancedMode ? 'Hide' : 'Show'} Options
            </button>
          </div>
          
          {isAdvancedMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">🔄 Multiple Variations</label>
                  <input
                    type="checkbox"
                    checked={generateMultiple}
                    onChange={(e) => setGenerateMultiple(e.target.checked)}
                    className="rounded"
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300"># Hashtags</label>
                  <input
                    type="checkbox"
                    id="includeHashtags"
                    defaultChecked={true}
                    className="rounded"
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">😀 Emojis</label>
                  <input
                    type="checkbox"
                    id="includeEmojis"
                    defaultChecked={true}
                    className="rounded"
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">📢 Call to Action</label>
                  <input
                    type="checkbox"
                    id="includeCTA"
                    defaultChecked={false}
                    className="rounded"
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">❓ Question</label>
                  <input
                    type="checkbox"
                    id="includeQuestion"
                    defaultChecked={false}
                    className="rounded"
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <div className="pt-3">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className={`w-full rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-4 text-white font-bold hover:shadow-xl hover:shadow-purple-800/30 transition-all text-lg ${
              (isLoading || hasReachedLimit || !topic) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || hasReachedLimit || !topic}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                🚀 Generating {generateMultiple ? 'variations' : 'tweet'}...
              </span>
            ) : hasReachedLimit ? (
              '🔒 Daily Limit Reached - Upgrade to Continue'
            ) : !topic ? (
              '📝 Enter Topic to Generate Tweet'
            ) : remainingTweets === 1 ? (
              '🎯 Generate Final Tweet of the Day'
            ) : (
              `🎯 Generate ${generateMultiple ? 'Multiple Variations' : 'Tweet'}`
            )}
          </button>
          
          {/* Additional limit info below button */}
          {remainingTweets !== null && remainingTweets > 0 && !isLoading && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {remainingTweets === 1 
                  ? 'This will be your last tweet for today'
                  : `${remainingTweets - 1} tweets will remain after this generation`
                }
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Generated Tweets Display */}
      {generatedVariations.length > 0 && (
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">✨ Generated Tweets</h3>
          
          {generateMultiple && generatedVariations.length > 1 && (
            <div className="flex space-x-2 mb-4 overflow-x-auto">
              {generatedVariations.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVariation(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedVariation === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/40'
                  }`}
                >
                  Variation {index + 1}
                </button>
              ))}
            </div>
          )}

          {generatedVariations[selectedVariation] && (
            <div className="space-y-4">
              <div className="bg-[#0A0F29] rounded-lg p-4 relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-400">
                      Score: {generatedVariations[selectedVariation].score}/10
                    </span>
                    <span className="text-xs text-gray-400">
                      {generatedVariations[selectedVariation].engagement_prediction}
                    </span>
                  </div>
                  <button
                    onClick={() => copyTweet(generatedVariations[selectedVariation].content)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy tweet"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-white text-lg leading-relaxed mb-3">
                  {generatedVariations[selectedVariation].content}
                </p>
                
                <div className="flex justify-between items-center text-xs">
                  <span className={`${generatedVariations[selectedVariation].content.length > 280 ? 'text-red-400' : 'text-green-400'}`}>
                    {generatedVariations[selectedVariation].content.length}/280 characters
                  </span>
                  <div className="flex space-x-2">
                    {generatedVariations[selectedVariation].hashtags?.map((hashtag, i) => (
                      <span key={i} className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs">
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {generatedVariations[selectedVariation].reasoning && (
                <div className="bg-[#0A0F29] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">🧠 AI Reasoning</h4>
                  <p className="text-gray-400 text-sm">{generatedVariations[selectedVariation].reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="border-t border-blue-900/30 pt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">💡 Pro Tips:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="rounded-full bg-green-900/30 p-1 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">🔍 Research-Driven</p>
              <p className="text-xs text-gray-400">Use auto-research for trending topics</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">🏷️ Strategic Mentions</p>
              <p className="text-xs text-gray-400">Tag relevant accounts for reach</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 