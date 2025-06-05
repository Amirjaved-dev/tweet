import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Thread {
  id: number;
  title: string;
  topic: string;
  tone: string;
  content: string;
  created_at: string;
  metadata?: any;
}

interface ThreadHistoryProps {
  threads?: Thread[];
}

export default function ThreadHistory({ threads: initialThreads }: ThreadHistoryProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads || []);
  const [isLoading, setIsLoading] = useState(!initialThreads);
  const [error, setError] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);

  // Fetch user threads if not provided as props
  useEffect(() => {
    if (initialThreads) {
      setThreads(initialThreads);
      setIsLoading(false);
      return;
    }
    
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        
        // Use a default user ID for demo purposes
        const userId = 'demo-user';
        
        // Fetch threads from API
        const response = await fetch(`/api/thread/user/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch threads');
        }
        
        const data = await response.json();
        setThreads(data.threads || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching threads');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchThreads();
  }, [initialThreads]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format price with appropriate decimal places
  const formatPrice = (price: number) => {
    if (!price) return "$0";
    
    // For very small numbers (less than 0.01)
    if (price < 0.01) {
      return `$${price.toFixed(8)}`;
    }
    
    // For small numbers (less than 1)
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    
    // For medium numbers (less than 1000)
    if (price < 1000) {
      return `$${price.toFixed(2)}`;
    }
    
    // For large numbers
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    if (!value) return "0%";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get sentiment color class
  const getSentimentColorClass = (sentiment: string) => {
    switch (sentiment) {
      case 'very-bullish': return 'bg-green-900/40 text-green-300 border-green-500/30';
      case 'bullish': return 'bg-green-800/30 text-green-400 border-green-500/20';
      case 'neutral': return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
      case 'bearish': return 'bg-red-800/30 text-red-400 border-red-500/20';
      case 'very-bearish': return 'bg-red-900/40 text-red-300 border-red-500/30';
      default: return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
    }
  };

  // Get tweet type badge color
  const getTweetTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'hook': return 'bg-purple-900/40 text-purple-300 border-purple-500/30';
      case 'price': return 'bg-green-900/40 text-green-300 border-green-500/30';
      case 'news': return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
      case 'governance': return 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30';
      case 'alpha': return 'bg-pink-900/40 text-pink-300 border-pink-500/30';
      case 'cta': return 'bg-orange-900/40 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-900/40 text-gray-300 border-gray-500/30';
    }
  };

  // Handle copy to clipboard
  const copyToClipboard = async (thread: Thread) => {
    try {
      await navigator.clipboard.writeText(thread.content);
      setCopySuccess(thread.id);
      
      // Reset copy success after 2 seconds
      setTimeout(() => {
        setCopySuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export thread as text file
  const exportThread = (thread: Thread) => {
    const element = document.createElement('a');
    const file = new Blob([thread.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${thread.topic.replace(/\s+/g, '-').toLowerCase()}-thread.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-6">
        <div className="flex">
          <svg className="h-6 w-6 text-red-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="glass-effect rounded-xl border-2 border-dashed border-blue-500/20 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No threads yet</h3>
        <p className="text-gray-400 max-w-md mx-auto mb-6">You haven't generated any threads yet. Create your first thread to see it here!</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'generate' }))}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-700/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Your First Thread
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Your Threads</h2>
          <p className="text-gray-400 text-sm mt-1">All your previously generated threads</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => {
              // Trigger a refresh of threads
              setIsLoading(true);
              fetch(`/api/thread/user/${'demo-user'}`)
                .then(res => res.json())
                .then(data => {
                  setThreads(data.threads || []);
                  setIsLoading(false);
                })
                .catch(err => {
                  console.error('Error refreshing threads:', err);
                  setIsLoading(false);
                });
            }}
            className="text-sm px-3 py-1.5 border border-blue-500/30 rounded-md text-gray-300 hover:bg-blue-900/30 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {threads.map((thread) => (
          <div key={thread.id} className="glass-effect rounded-xl border border-blue-500/20 enhanced-border overflow-hidden transition-all hover:shadow-lg hover:shadow-blue-900/20">
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-lg text-white line-clamp-1">
                    {thread.title || thread.topic}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 ${thread.tone === 'Web3 Expert' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'bg-blue-900/40 text-blue-300 border border-blue-500/30'} rounded-full`}>
                      {thread.tone}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(thread.created_at)}
                    </span>
                    
                    {/* Display token price if Web3 thread */}
                    {thread.tone === 'Web3 Expert' && thread.metadata?.tokenData && (
                      <span className={`text-xs px-2 py-1 rounded-full ${thread.metadata.tokenData.priceChangePercentage24h >= 0 ? 'bg-green-900/40 text-green-300 border border-green-500/30' : 'bg-red-900/40 text-red-300 border border-red-500/30'}`}>
                        {formatPrice(thread.metadata.tokenData.price)} ({formatPercentage(thread.metadata.tokenData.priceChangePercentage24h)})
                      </span>
                    )}
                    
                    {/* Display sentiment if Web3 thread */}
                    {thread.tone === 'Web3 Expert' && thread.metadata?.sentiment && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColorClass(thread.metadata.sentiment.overall)}`}>
                        {thread.metadata.sentiment.overall.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedThread(selectedThread === thread.id ? null : thread.id)}
                    className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                      selectedThread === thread.id 
                        ? 'bg-blue-600 text-white' 
                        : 'border border-blue-500/30 text-gray-300 hover:bg-blue-900/30'
                    }`}
                  >
                    {selectedThread === thread.id ? 'Hide' : 'View'}
                  </button>
                  
                  <button
                    onClick={() => copyToClipboard(thread)}
                    className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                      copySuccess === thread.id
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-blue-500/30 text-gray-300 hover:bg-blue-900/30'
                    }`}
                  >
                    {copySuccess === thread.id ? (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => exportThread(thread)}
                    className="text-sm px-3 py-1.5 border border-blue-500/30 rounded-md text-gray-300 hover:bg-blue-900/30 transition-colors"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Export
                    </span>
                  </button>
                </div>
              </div>
              
              {selectedThread === thread.id && (
                <div className="mt-4 pt-4 border-t border-blue-900/30">
                  {/* Display Web3 data if available */}
                  {thread.tone === 'Web3 Expert' && thread.metadata?.tokenData && (
                    <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20">
                      <h4 className="text-sm font-medium text-blue-300 mb-3">Web3 Data</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Price and metrics data */}
                        <div className="col-span-1 sm:col-span-2 bg-blue-950/30 rounded-lg p-3 border border-blue-900/40">
                          <h5 className="text-xs font-semibold text-blue-400 mb-2">Token Metrics</h5>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-400">Token:</span>{' '}
                              <span className="text-white">{thread.metadata.tokenData.name} (${thread.metadata.tokenData.symbol})</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Price:</span>{' '}
                              <span className="text-white">{formatPrice(thread.metadata.tokenData.price)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">24h Change:</span>{' '}
                              <span className={`${thread.metadata.tokenData.priceChangePercentage24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPercentage(thread.metadata.tokenData.priceChangePercentage24h)}
                                {thread.metadata.tokenData.priceChange24hUSD && ` (${formatPrice(thread.metadata.tokenData.priceChange24hUSD)})`}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Market Cap:</span>{' '}
                              <span className="text-white">${(thread.metadata.tokenData.marketCap / 1000000).toFixed(2)}M</span>
                            </div>
                            <div>
                              <span className="text-gray-400">24h Range:</span>{' '}
                              <span className="text-white">
                                {formatPrice(thread.metadata.tokenData.low24h)} - {formatPrice(thread.metadata.tokenData.high24h)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">All-Time High:</span>{' '}
                              <span className="text-white">
                                {formatPrice(thread.metadata.tokenData.allTimeHigh)}
                                {thread.metadata.tokenData.fromATHPercentage && (
                                  <span className="text-gray-400"> ({formatPercentage(thread.metadata.tokenData.fromATHPercentage)} from ATH)</span>
                                )}
                              </span>
                            </div>
                            
                            {thread.metadata.tokenData.priceLevel && (
                              <div>
                                <span className="text-gray-400">Price Level:</span>{' '}
                                <span className="text-white capitalize">{thread.metadata.tokenData.priceLevel.replace('-', ' ')}</span>
                              </div>
                            )}
                            
                            {thread.metadata.tokenData.volatility && (
                              <div>
                                <span className="text-gray-400">Volatility:</span>{' '}
                                <span className="text-white capitalize">{thread.metadata.tokenData.volatility.replace('-', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Sentiment Analysis */}
                        <div className="bg-blue-950/30 rounded-lg p-3 border border-blue-900/40">
                          <h5 className="text-xs font-semibold text-blue-400 mb-2">Market Sentiment</h5>
                          {thread.metadata.sentiment ? (
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-gray-400">Overall:</span>{' '}
                                <span className={`px-2 py-0.5 rounded ${getSentimentColorClass(thread.metadata.sentiment.overall)}`}>
                                  {thread.metadata.sentiment.overall.replace('-', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Price:</span>{' '}
                                <span className={`px-2 py-0.5 rounded ${getSentimentColorClass(thread.metadata.sentiment.price)}`}>
                                  {thread.metadata.sentiment.price.replace('-', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">News:</span>{' '}
                                <span className={`px-2 py-0.5 rounded ${getSentimentColorClass(thread.metadata.sentiment.news.replace('positive', 'bullish').replace('negative', 'bearish'))}`}>
                                  {thread.metadata.sentiment.news.replace('-', ' ')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-xs">Sentiment data not available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Thread Content */}
                  {thread.tone === 'Web3 Expert' && thread.metadata?.tweets ? (
                    <div className="space-y-3">
                      {thread.metadata.tweets.map((tweet: any, index: number) => (
                        <div key={index} className="bg-[#0A0F29]/80 p-4 rounded-lg border border-blue-900/50 text-white">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-400">Tweet {tweet.number}/10</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getTweetTypeBadgeClass(tweet.type)}`}>
                              {tweet.type.charAt(0).toUpperCase() + tweet.type.slice(1)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap mb-2">{tweet.content}</p>
                          
                          {/* Show hashtags and mentions */}
                          {(tweet.hashtags?.length > 0 || tweet.mentions?.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tweet.hashtags?.map((hashtag: string, i: number) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                                  {hashtag}
                                </span>
                              ))}
                              {tweet.mentions?.map((mention: string, i: number) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-purple-900/30 text-purple-400 rounded">
                                  {mention}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-1.5 text-xs text-gray-500">
                            {tweet.characterCount}/280 characters
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#0A0F29]/80 p-4 rounded-lg border border-blue-900/50 whitespace-pre-wrap text-white">
                      {thread.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 