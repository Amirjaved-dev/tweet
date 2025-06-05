import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import TweetGenerator from '../TweetGenerator';

interface Tweet {
  id: string;
  topic: string;
  tone: string;
  content: string;
  tokens?: string[];
  created_at: string;
}

export default function NewTweet() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [generatedTweet, setGeneratedTweet] = useState<Tweet | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [remainingTweets, setRemainingTweets] = useState<number | null>(null);
  const [limitCheckLoading, setLimitCheckLoading] = useState<boolean>(true);

  // Check user's tweet limit on component mount and when user changes
  useEffect(() => {
    const checkTweetLimit = async () => {
      if (!user?.id) {
        setLimitCheckLoading(false);
        return;
      }

      try {
        setLimitCheckLoading(true);
        const token = await getToken();
        const response = await fetch('/api/tweet/limit', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setRemainingTweets(data.remaining);
        } else {
          console.error('Failed to fetch tweet limit');
          setRemainingTweets(0);
        }
      } catch (err) {
        console.error('Error fetching tweet limit:', err);
        setRemainingTweets(0);
      } finally {
        setLimitCheckLoading(false);
      }
    };
    
    checkTweetLimit();
  }, [user, getToken]);

  const handleTweetGenerated = (tweet: Tweet) => {
    setGeneratedTweet(tweet);
    setTweets(prev => [tweet, ...prev]);
    // Update remaining count when a tweet is generated
    if (remainingTweets !== null && remainingTweets > 0) {
      setRemainingTweets(prev => prev !== null ? Math.max(0, prev - 1) : 0);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // You could add a toast notification here
      console.log('Tweet copied to clipboard!');
    });
  };

  const shareOnTwitter = (content: string) => {
    const encodedContent = encodeURIComponent(content);
    window.open(`https://twitter.com/intent/tweet?text=${encodedContent}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black py-8">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Tweet Generator
              </h1>
              <p className="text-gray-400 mt-2">
                Create engaging tweets with AI-powered assistance
              </p>
            </div>
            
            {/* Limit Display */}
            {!limitCheckLoading && remainingTweets !== null && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Daily Limit</div>
                  <div className={`text-lg font-semibold ${
                    remainingTweets === 0 ? 'text-red-400' : 
                    remainingTweets <= 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {remainingTweets} remaining
                  </div>
                </div>
                
                {remainingTweets === 0 && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2">
                    <div className="text-red-300 text-sm font-medium">Limit Reached</div>
                    <div className="text-red-400 text-xs">Resets daily or upgrade plan</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tweet Generator Form */}
          <div className="lg:col-span-2">
            <TweetGenerator
              onTweetGenerated={handleTweetGenerated}
              hasReachedLimit={remainingTweets === 0}
            />
          </div>

          {/* Generated Tweet Display */}
          <div className="lg:col-span-1">
            {generatedTweet && (
              <div className="bg-[#0F1736] rounded-lg border border-blue-900/30 p-6 sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Generated Tweet</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(generatedTweet.content)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => shareOnTwitter(generatedTweet.content)}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Share on Twitter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#0A0F29] rounded-lg p-4 mb-4">
                  <p className="text-white text-sm leading-relaxed">{generatedTweet.content}</p>
                </div>
                
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Topic:</span>
                    <span className="text-blue-400">{generatedTweet.topic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tone:</span>
                    <span className="text-purple-400">{generatedTweet.tone}</span>
                  </div>
                  {generatedTweet.tokens && generatedTweet.tokens.length > 0 && (
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span className="text-green-400">
                        {generatedTweet.tokens.map(token => `$${token}`).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Character count:</span>
                    <span className={generatedTweet.content.length > 280 ? 'text-red-400' : 'text-green-400'}>
                      {generatedTweet.content.length}/280
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tweet History */}
            {tweets.length > 1 && (
              <div className="mt-6 bg-[#0F1736] rounded-lg border border-blue-900/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Tweets</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tweets.slice(1).map((tweet) => (
                    <div key={tweet.id} className="bg-[#0A0F29] rounded-lg p-3">
                      <p className="text-white text-sm mb-2 line-clamp-3">{tweet.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {new Date(tweet.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => copyToClipboard(tweet.content)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Copy"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => shareOnTwitter(tweet.content)}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Share"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 