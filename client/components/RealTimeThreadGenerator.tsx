import { useState, useEffect } from 'react';

interface RealTimeThreadGeneratorProps {
  onThreadGenerated?: (thread: any) => void;
  hasReachedLimit?: boolean;
}

export default function RealTimeThreadGenerator({ onThreadGenerated, hasReachedLimit = false }: RealTimeThreadGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingThreads, setRemainingThreads] = useState<number | null>(30);
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('trending');
  const [timeRange, setTimeRange] = useState<string>('day');

  // Data source options
  const dataSourceOptions = [
    { id: 'trending', name: 'Trending' },
    { id: 'news', name: 'News' },
    { id: 'market', name: 'Market' },
    { id: 'custom', name: 'Custom' },
  ];

  // Time range options
  const timeRangeOptions = [
    { id: 'hour', name: 'Last Hour' },
    { id: 'day', name: 'Today' },
    { id: 'week', name: 'This Week' },
  ];

  // Fetch remaining threads on component mount
  useEffect(() => {
    const fetchRemainingThreads = async () => {
      try {
        // Use a default user ID for demo purposes
        const userId = 'demo-user';
        
        // Get user's remaining thread count from API
        const response = await fetch(`/api/thread/limit/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch thread limit');
        }
        
        const data = await response.json();
        setRemainingThreads(data.remaining);
      } catch (err) {
        console.error('Error fetching thread limit:', err);
        // Fallback to default
        setRemainingThreads(30);
      }
    };
    
    fetchRemainingThreads();
  }, []);

  // Generate thread
  const generateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dataSource === 'custom' && !topic) {
      setError('Please enter a topic when using Custom data source');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use a default user ID for demo purposes
      const userId = 'demo-user';
      
      // Get advanced options
      const advancedOptions = {
        dataSource,
        timeRange,
        includeImages: document.getElementById('includeImages') instanceof HTMLInputElement
          ? (document.getElementById('includeImages') as HTMLInputElement).checked
          : true,
        includeLinks: document.getElementById('includeLinks') instanceof HTMLInputElement
          ? (document.getElementById('includeLinks') as HTMLInputElement).checked
          : true,
        includeStats: document.getElementById('includeStats') instanceof HTMLInputElement
          ? (document.getElementById('includeStats') as HTMLInputElement).checked
          : true,
        includeTrends: document.getElementById('includeTrends') instanceof HTMLInputElement
          ? (document.getElementById('includeTrends') as HTMLInputElement).checked
          : true,
      };
      
      // Make API call to generate thread
      const response = await fetch('/api/realtime/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          topic: dataSource === 'custom' ? topic : '',
          dataSource,
          timeRange,
          userId,
          options: advancedOptions
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to generate thread';
        
        if (errorData.error) {
          errorMessage = errorData.error;
          
          // Handle specific error cases
          if (errorData.error === 'Daily thread generation limit reached') {
            errorMessage = 'You\'ve reached your daily thread generation limit';
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Update remaining threads from API response
      if (data.remaining !== undefined) {
        setRemainingThreads(data.remaining);
      }
      
      // Format the thread object to match our interface
      const generatedThread = {
        id: data.thread.id || `realtime-${Date.now()}`,
        topic: data.thread.topic || (dataSource === 'custom' ? topic : dataSource),
        content: data.thread.content,
        created_at: data.thread.created_at || new Date().toISOString(),
        metadata: {
          dataSource,
          timeRange,
          ...data.thread.metadata
        }
      };
      
      // Call callback if provided
      if (onThreadGenerated) {
        onThreadGenerated(generatedThread);
      }
      
      // Reset form for custom topics
      if (dataSource === 'custom') {
        setTopic('');
      }
      
    } catch (err: any) {
      setError(err.message || 'Error generating thread. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Create Real-time Thread</h2>
          <p className="text-gray-400 text-sm mt-1">Generate threads based on current trends and news</p>
        </div>
      </div>
      
      <form onSubmit={generateThread} className="space-y-5">
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Source
              </label>
              <div className="grid grid-cols-4 gap-2">
                {dataSourceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDataSource(option.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      dataSource === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/40'
                    }`}
                    disabled={isLoading || hasReachedLimit}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select the source of real-time data</p>
            </div>

            {dataSource === 'custom' && (
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">
                  Custom Topic
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Bitcoin price, AI trends, Social media marketing..."
                  className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  disabled={isLoading || hasReachedLimit}
                />
                <p className="text-xs text-gray-500 mt-1">Enter a specific topic to search for real-time data</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Time Range
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTimeRange(option.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      timeRange === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/40'
                    }`}
                    disabled={isLoading || hasReachedLimit}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select how recent the data should be</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Thread Options</h3>
            <button
              type="button"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
            >
              {isAdvancedMode ? 'Hide advanced options' : 'Show advanced options'}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ml-1 transition-transform ${isAdvancedMode ? 'rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {isAdvancedMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="includeImages" className="text-sm text-gray-300">
                  Include Image Suggestions
                </label>
                <input
                  type="checkbox"
                  id="includeImages"
                  className="h-4 w-4 rounded border-blue-900 text-blue-600 focus:ring-blue-500"
                  defaultChecked={true}
                  disabled={isLoading || hasReachedLimit}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="includeLinks" className="text-sm text-gray-300">
                  Include Source Links
                </label>
                <input
                  type="checkbox"
                  id="includeLinks"
                  className="h-4 w-4 rounded border-blue-900 text-blue-600 focus:ring-blue-500"
                  defaultChecked={true}
                  disabled={isLoading || hasReachedLimit}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="includeStats" className="text-sm text-gray-300">
                  Include Statistics
                </label>
                <input
                  type="checkbox"
                  id="includeStats"
                  className="h-4 w-4 rounded border-blue-900 text-blue-600 focus:ring-blue-500"
                  defaultChecked={true}
                  disabled={isLoading || hasReachedLimit}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="includeTrends" className="text-sm text-gray-300">
                  Include Trending Hashtags
                </label>
                <input
                  type="checkbox"
                  id="includeTrends"
                  className="h-4 w-4 rounded border-blue-900 text-blue-600 focus:ring-blue-500"
                  defaultChecked={true}
                  disabled={isLoading || hasReachedLimit}
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-blue-900/30">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center overflow-hidden mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-gray-400">
                Real-time threads are generated using the latest data from various sources including Twitter trends, news APIs, and market data.
              </p>
            </div>
          </div>
        </div>
        
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
          
          {hasReachedLimit && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 px-4 py-3 rounded-lg mb-4 text-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p>You've reached your daily thread generation limit.</p>
                  <p className="mt-1">Upgrade to Pro for more threads or wait until tomorrow.</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className={`w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white font-medium hover:shadow-lg hover:shadow-blue-800/30 transition-all 
              ${(isLoading || hasReachedLimit || (dataSource === 'custom' && !topic)) ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasReachedLimit || (dataSource === 'custom' && !topic)}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating your real-time thread...
              </span>
            ) : (
              'Generate Real-time Thread'
            )}
          </button>
          
          {!error && !hasReachedLimit && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Uses real-time data from multiple sources for up-to-date content
            </p>
          )}
        </div>
      </form>
      
      <div className="border-t border-blue-900/30 pt-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Real-time thread benefits:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Leverage current trends for higher engagement</p>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Stay relevant with timely content</p>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Includes verifiable sources and citations</p>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Perfect for news, market analysis, and trending topics</p>
          </div>
        </div>
      </div>
    </div>
  );
} 