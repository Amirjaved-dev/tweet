import { useState, useEffect } from 'react';
import TonePresets from './TonePresets';

interface ThreadGeneratorProps {
  onThreadGenerated?: (thread: any) => void;
  hasReachedLimit?: boolean;
}

export default function ThreadGenerator({ onThreadGenerated, hasReachedLimit = false }: ThreadGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingThreads, setRemainingThreads] = useState<number | null>(30); // Updated from 3 to 30
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<string>('medium');
  const [audience, setAudience] = useState<string>('general');

  // Tone options with enhanced selection
  const tones = [
    'Professional',
    'Bold',
    'Storytelling',
    'Funny',
    'Educational',
    'Motivational',
    'Controversial',
    'Data-driven',
    'Inspirational',
    'Thought-provoking'
  ];

  // Word count options
  const wordCountOptions = [
    { id: 'short', name: 'Short (~5 tweets)' },
    { id: 'medium', name: 'Medium (~10 tweets)' },
    { id: 'long', name: 'Long (~15 tweets)' },
  ];

  // Target audience options
  const audienceOptions = [
    { id: 'general', name: 'General' },
    { id: 'tech', name: 'Tech' },
    { id: 'business', name: 'Business' },
    { id: 'creators', name: 'Creators' },
    { id: 'finance', name: 'Finance' },
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
    
    if (!topic) {
      setError('Please enter a topic');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    let retryCount = 0;
    const maxRetries = 1;
    
    while (retryCount <= maxRetries) {
      try {
        // Use a default user ID for demo purposes
        const userId = 'demo-user';
        
        // Get advanced options
        const advancedOptions = {
          wordCount,
          audience,
          includeHashtags: document.getElementById('includeHashtags') instanceof HTMLInputElement
            ? (document.getElementById('includeHashtags') as HTMLInputElement).checked
            : true,
          includeCTA: document.getElementById('includeCTA') instanceof HTMLInputElement
            ? (document.getElementById('includeCTA') as HTMLInputElement).checked
            : true,
          includeEmojis: document.getElementById('includeEmojis') instanceof HTMLInputElement
            ? (document.getElementById('includeEmojis') as HTMLInputElement).checked
            : true,
          includeStats: document.getElementById('includeStats') instanceof HTMLInputElement
            ? (document.getElementById('includeStats') as HTMLInputElement).checked
            : false,
        };
        
        // Make API call to generate thread
        const response = await fetch('/api/thread/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            topic,
            tone,
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
              throw new Error(errorMessage); // Don't retry for limit errors
            }
            
            // Include details if available
            if (errorData.details) {
              console.error('Error details:', errorData.details);
              
              // Check for specific API errors
              if (errorData.details.error?.message) {
                errorMessage += `: ${errorData.details.error.message}`;
              }
            }
          }
          
          // If this is the first failure, retry once more
          if (retryCount < maxRetries) {
            console.log(`Retrying thread generation (attempt ${retryCount + 1})...`);
            retryCount++;
            continue;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Update remaining threads from API response
        setRemainingThreads(data.remaining);
        
        // Format the thread object to match our interface
        const generatedThread = {
          id: data.thread.id,
          topic: data.thread.topic,
          tone: data.thread.tone,
          content: data.thread.content,
          created_at: data.thread.created_at
        };
        
        // Call callback if provided
        if (onThreadGenerated) {
          onThreadGenerated(generatedThread);
        }
        
        // Reset form
        setTopic('');
        
        // Exit the retry loop on success
        break;
      } catch (err: any) {
        // If this isn't our last retry, continue to the next attempt
        if (retryCount < maxRetries && !err.message?.includes('limit')) {
          console.log(`Retrying after error: ${err.message}`);
          retryCount++;
          continue;
        }
        
        // Otherwise, set the error for display and exit the loop
        setError(err.message || 'Error generating thread. Please try again later.');
        break;
      }
    }
    
    // Reset loading state outside the retry loop
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Create New Thread</h2>
          <p className="text-gray-400 text-sm mt-1">Generate a viral Twitter thread in seconds with AI</p>
        </div>
      </div>
      
      <form onSubmit={generateThread} className="space-y-5">
        <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">
                Thread Topic or Main Idea
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How to grow on Twitter, 10 productivity tips, Web development trends 2023..."
                className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                disabled={isLoading || hasReachedLimit}
              />
              <p className="text-xs text-gray-500 mt-1">Be specific for better results</p>
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
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <TonePresets
                onSelect={(tone) => setTone(tone)}
                currentTone={tone}
                variant="general"
              />
              
              {/* Hidden tone selector for more options */}
              <div className="relative mt-2">
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-sm"
                  disabled={isLoading || hasReachedLimit}
                >
                  {tones.map((toneOption) => (
                    <option key={toneOption} value={toneOption}>
                      {toneOption}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Thread Length</label>
              <div className="grid grid-cols-3 gap-2">
                {wordCountOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setWordCount(option.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      wordCount === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/40'
                    }`}
                    disabled={isLoading || hasReachedLimit}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
              <div className="grid grid-cols-5 gap-2">
                {audienceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAudience(option.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      audience === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/40'
                    }`}
                    disabled={isLoading || hasReachedLimit}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            
            {isAdvancedMode && (
              <div className="mt-3 space-y-3 pt-3 border-t border-blue-900/30">
                <div className="flex items-center justify-between">
                  <label htmlFor="includeHashtags" className="text-sm text-gray-300">
                    Include Hashtags
                  </label>
                  <input
                    type="checkbox"
                    id="includeHashtags"
                    className="h-4 w-4 rounded border-blue-900 text-blue-600 focus:ring-blue-500"
                    defaultChecked={true}
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="includeCTA" className="text-sm text-gray-300">
                    Include Call to Action
                  </label>
                  <input
                    type="checkbox"
                    id="includeCTA"
                    className="h-4 w-4 rounded border-blue-900 text-blue-600 focus:ring-blue-500"
                    defaultChecked={true}
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="includeEmojis" className="text-sm text-gray-300">
                    Include Emojis
                  </label>
                  <input
                    type="checkbox"
                    id="includeEmojis"
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
                    defaultChecked={false}
                    disabled={isLoading || hasReachedLimit}
                  />
                </div>
              </div>
            )}
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
              ${(isLoading || hasReachedLimit || !topic) ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasReachedLimit || !topic}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating your thread...
              </span>
            ) : (
              'Generate Twitter Thread'
            )}
          </button>
          
          {!error && !hasReachedLimit && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Using advanced AI to craft a viral-worthy thread based on your input
            </p>
          )}
        </div>
      </form>
      
      <div className="border-t border-blue-900/30 pt-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Thread tips:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Focus on one specific topic to make your thread more valuable</p>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Threads with 7-15 tweets tend to perform best</p>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Add relevant images or visuals to boost engagement</p>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">End with a clear call-to-action for better results</p>
          </div>
        </div>
      </div>
    </div>
  );
} 