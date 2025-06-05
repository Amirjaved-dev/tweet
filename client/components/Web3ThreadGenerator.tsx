import { useState, useEffect, useRef } from 'react';
import TonePresets from './TonePresets';

interface TokenOption {
  symbol: string;
  name: string;
  category?: string;
  marketCap?: number;
  isPopular?: boolean;
  logo?: string;
}

interface Web3ThreadGeneratorProps {
  onThreadGenerated?: (thread: any) => void;
  hasReachedLimit?: boolean;
}

// Add this component before AIAgentPreview
const TypingText = ({ text, speed = 50 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else {
      setCompleted(true);
    }
  }, [index, text, speed]);
  
  return (
    <span>
      {displayedText}
      {!completed && <span className="animate-pulse">|</span>}
    </span>
  );
};

// Replace the AIAgentPreview component with this enhanced version
const AIAgentPreview = ({ steps, currentStep, cryptoSymbol }: { steps: any[], currentStep: number, cryptoSymbol: string }) => {
  const [aiThoughts, setAiThoughts] = useState('');
  const thoughtsRef = useRef<HTMLDivElement>(null);
  
  // AI "thoughts" that appear while generating - incorporate the crypto symbol
  const getAiThoughtPool = (symbol: string) => [
    `Analyzing ${symbol} price patterns...`,
    `Scanning ${symbol} news sources...`,
    `Evaluating ${symbol} market sentiment indicators...`,
    `Checking ${symbol} governance activity...`,
    `Calculating ${symbol} volatility metrics...`,
    `Identifying key ${symbol} support and resistance levels...`,
    `Comparing ${symbol} on-chain metrics with historical data...`,
    `Formatting ${symbol} thread for maximum engagement...`,
    `Optimizing ${symbol} content structure...`,
    `Adding relevant #${symbol} hashtags for visibility...`,
    `Reviewing ${symbol} social media sentiment...`,
    `Analyzing ${symbol} developer activity metrics...`,
    `Comparing ${symbol} to market trends...`
  ];
  
  // Simulate AI "thinking" with changing thoughts
  useEffect(() => {
    if (currentStep === 5) { // Only show during final generation step
      const thoughtPool = getAiThoughtPool(cryptoSymbol);
      const interval = setInterval(() => {
        const randomThought = thoughtPool[Math.floor(Math.random() * thoughtPool.length)];
        setAiThoughts(randomThought);
        
        // Scroll to bottom if container exists
        if (thoughtsRef.current) {
          thoughtsRef.current.scrollTop = thoughtsRef.current.scrollHeight;
        }
      }, 2500);
      
      return () => clearInterval(interval);
    }
  }, [currentStep, cryptoSymbol]);
  
  return (
    <div className="bg-black/30 backdrop-blur-md border border-blue-900/50 rounded-lg p-4 mt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-blue-900/5 z-0"></div>
      
      <h3 className="text-white font-semibold mb-4 relative z-10 flex items-center">
        <span className="inline-block mr-2">
          <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
        <span className="mr-1">AI Agent</span>
        <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full">WORKING</span>
      </h3>
      
      <div className="space-y-3 relative z-10">
        {steps.map((step, index) => (
          <div key={index} className={`flex items-start ${index < currentStep ? 'opacity-80' : 'opacity-100'}`}>
            <div className="mr-3 mt-0.5">
              {step.status === 'pending' && (
                <div className="w-5 h-5 rounded-full border border-gray-600"></div>
              )}
              {step.status === 'loading' && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {step.status === 'complete' && (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {step.status === 'error' && (
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-gray-300">{step.step}</div>
              
              {step.status === 'complete' && step.data && (
                <div className="mt-1 text-xs bg-blue-900/30 border border-blue-900/50 rounded px-2 py-1 text-blue-300">
                  {index === 1 && (
                    // Price data
                    <div className="flex justify-between">
                      <span>Current price: {step.data.price}</span>
                      <span className={step.data.change.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
                        {step.data.change}
                      </span>
                    </div>
                  )}
                  
                  {index === 2 && (
                    // Sentiment data
                    <div className="flex justify-between">
                      <span>Market sentiment: <span className={
                        step.data.overall === 'Bullish' ? 'text-green-400' : 
                        step.data.overall === 'Bearish' ? 'text-red-400' : 'text-gray-400'
                      }>{step.data.overall}</span></span>
                      <span>Confidence: {step.data.score}</span>
                    </div>
                  )}
                  
                  {index === 3 && (
                    // News data
                    <div>
                      <div>Found {step.data.count} recent article{step.data.count !== 1 ? 's' : ''}</div>
                      {step.data.count > 0 && (
                        <div className="mt-1 italic">"{step.data.latest}"</div>
                      )}
                    </div>
                  )}
                  
                  {index === 4 && (
                    // Governance data
                    <div>
                      {step.data.count > 0 ? 
                        `Found ${step.data.count} governance proposal${step.data.count !== 1 ? 's' : ''}` : 
                        'No active governance proposals found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* AI "thoughts" section - only shows during final generation step */}
      {currentStep === 5 && aiThoughts && (
        <div 
          ref={thoughtsRef}
          className="mt-4 bg-black/40 border border-blue-900/30 rounded p-2 max-h-24 overflow-y-auto text-xs text-blue-300 font-mono"
        >
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-400 text-[10px] uppercase tracking-wider">AI Thoughts</span>
          </div>
          <div className="pl-4 text-gray-400">
            <TypingText text={aiThoughts} speed={30} />
          </div>
        </div>
      )}
      
      {/* Real-time thread preview glimpse */}
      {currentStep === 5 && (
        <div className="mt-4 opacity-60 hover:opacity-100 transition-opacity">
          <div className="border-b border-blue-900/30 pb-1 mb-2">
            <span className="text-xs text-blue-400">Thread preview</span>
          </div>
          <div className="text-xs text-white/70 font-mono pl-2 border-l-2 border-blue-600/30">
            <div className="animate-pulse">1/10: 🧵 THREAD: Analyzing the latest on ${cryptoSymbol}...</div>
          </div>
        </div>
      )}
      
      {/* Animated lines in background */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            style={{
              top: `${20 + i * 15}%`,
              left: '-10%',
              width: '120%',
              animation: `scanLine ${1 + i * 0.2}s infinite linear`,
              animationDelay: `${i * 0.5}s`
            }}
          ></div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanLine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background-color: #4f8ef7;
          animation: blink 1s step-end infinite;
        }
        
        @keyframes blink {
          from, to {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
};

export default function Web3ThreadGenerator({ onThreadGenerated, hasReachedLimit = false }: Web3ThreadGeneratorProps) {
  const [symbol, setSymbol] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [isCustomSymbol, setIsCustomSymbol] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingThreads, setRemainingThreads] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [planType, setPlanType] = useState<string>('free');
  const [popularTokens, setPopularTokens] = useState<TokenOption[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [tokenSearch, setTokenSearch] = useState<string>('');
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [lastGeneratedThread, setLastGeneratedThread] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('idle');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('neutral');
  const [analysisTimeframe, setAnalysisTimeframe] = useState<string>('short');
  const [generationSteps, setGenerationSteps] = useState<{step: string, status: 'pending' | 'loading' | 'complete' | 'error', data?: any}[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Token categories for filtering - Enhanced with more options
  const categories = [
    { id: 'all', name: 'All Tokens' },
    { id: 'layer1', name: 'Layer 1' },
    { id: 'layer2', name: 'Layer 2' },
    { id: 'defi', name: 'DeFi' },
    { id: 'meme', name: 'Meme' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'ai', name: 'AI' },
    { id: 'nft', name: 'NFT' },
  ];

  // Sentiment options
  const sentimentOptions = [
    { id: 'bullish', name: 'Bullish' },
    { id: 'neutral', name: 'Neutral' },
    { id: 'bearish', name: 'Bearish' },
  ];

  // Timeframe options
  const timeframeOptions = [
    { id: 'short', name: 'Short-term' },
    { id: 'medium', name: 'Medium-term' },
    { id: 'long', name: 'Long-term' },
  ];

  // Check for successful payment on component mount
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Check URL for payment success indicators
        const urlParams = new URLSearchParams(window.location.search);
        const chargeId = urlParams.get('chargeId');
        const success = urlParams.get('success');
        
        if (chargeId && success === 'true') {
          console.log('Payment success detected in URL, activating subscription');
          
          // Get current user ID
          const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'current-user';
          
          // Call API to activate subscription
          const response = await fetch('/api/payment/activate-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId,
              sessionId: chargeId,
              planType: 'premium'
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Subscription activated successfully:', data);
            
            // Update local state
            setPlanType('premium');
            setDailyLimit(30);
            
            // Refresh thread count
            refreshThreadCount();
            
            // Remove URL parameters using history API to prevent repeated activation
            const url = new URL(window.location.href);
            url.searchParams.delete('chargeId');
            url.searchParams.delete('success');
            window.history.replaceState({}, document.title, url.toString());
            
            // Show success message
            alert('Premium subscription activated successfully! You now have 30 threads per day.');
          } else {
            console.error('Failed to activate subscription');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };
    
    checkPaymentStatus();
  }, []);

  // Fetch user plan on component mount
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        // Get current user ID from localStorage or context
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'current-user';
        
        // First try to check Supabase directly for the premium status
        try {
          const response = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-User-ID': userId
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            console.log('User profile from Supabase:', profileData);
            
            if (profileData.user) {
              // Use the premium status and daily limit from Supabase
              const isPremium = profileData.user.is_premium;
              const dailyLimit = profileData.user.daily_thread_limit || 3;
              const planType = isPremium ? 'premium' : 'free';
              
              console.log(`User premium status from Supabase: ${isPremium}, daily limit: ${dailyLimit}`);
              
              // Update state with the Supabase data
              setPlanType(planType);
              setDailyLimit(dailyLimit);
              
              // Still fetch remaining count from API
              const remainingResponse = await fetch(`/api/thread/plan/${userId}`);
              
              if (remainingResponse.ok) {
                const remainingData = await remainingResponse.json();
                setRemainingThreads(remainingData.remaining);
              }
              
              return;
            }
          }
        } catch (supabaseError) {
          console.error('Error fetching from Supabase:', supabaseError);
          // Continue to API fallback
        }
        
        // Fallback to API if Supabase check fails
        const response = await fetch(`/api/thread/plan/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user plan');
        }
        
        const data = await response.json();
        
        // Update state with the plan data
        setRemainingThreads(data.remaining);
        setDailyLimit(data.dailyLimit);
        setPlanType(data.plan);
        
        // Add debugging message to console
        console.log('User plan data from API:', data);
        console.log(`Plan type: ${data.plan}, Daily limit: ${data.dailyLimit}, Used: ${data.used}, Remaining: ${data.remaining}`);
        
        // Force refresh if we detect inconsistency (premium plan but only 3 threads)
        if (data.plan === 'premium' && data.dailyLimit <= 3) {
          console.warn('Detected inconsistency: Premium plan with free-tier thread limit. Syncing with Supabase...');
          syncWithSupabase(userId, true);
        }
      } catch (err) {
        console.error('Error fetching user plan:', err);
        // Fallback to default free plan limit
        setRemainingThreads(3);
        setDailyLimit(3);
        setPlanType('free');
      }
    };
    
    fetchUserPlan();
  }, []);
  
  // Function to sync with Supabase directly
  const syncWithSupabase = async (userId: string, isPremium: boolean = true) => {
    try {
      console.log(`Syncing user ${userId} with Supabase, setting premium status to ${isPremium}`);
      
      const response = await fetch('/api/thread/update-supabase-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          isPremium,
          planType: isPremium ? 'premium' : 'free'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error syncing with Supabase:', errorData);
        return false;
      }
      
      const data = await response.json();
      console.log('Supabase sync response:', data);
      
      // Update local state with the new profile data
      if (data.profile) {
        setPlanType(data.profile.is_premium ? 'premium' : 'free');
        setDailyLimit(data.profile.daily_thread_limit || 3);
        // Refresh thread count
        refreshThreadCount();
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      return false;
    }
  };

  // Fetch popular tokens on component mount
  useEffect(() => {
    const fetchPopularTokens = async () => {
      try {
        const response = await fetch('/api/web3Thread/tokens');
        
        if (!response.ok) {
          throw new Error('Failed to fetch popular tokens');
        }
        
        const data = await response.json();
        
        // Enhance token data with categories and logos
        const enhancedTokens = (data.tokens || []).map((token: TokenOption) => {
          // Assign categories based on token symbol/name
          let category = 'other';
          
          // Layer 1 blockchains
          if (['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'ATOM'].includes(token.symbol)) {
            category = 'layer1';
          }
          // Layer 2 solutions
          else if (['MATIC', 'OP', 'ARB', 'IMX', 'BASE', 'ZKS'].includes(token.symbol)) {
            category = 'layer2';
          }
          // DeFi tokens
          else if (['AAVE', 'UNI', 'LINK', 'MKR', 'CRV', 'SNX', 'COMP', 'SUSHI', '1INCH'].includes(token.symbol)) {
            category = 'defi';
          }
          // Meme coins
          else if (['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'BRETT'].includes(token.symbol)) {
            category = 'meme';
          }
          // Gaming tokens
          else if (['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'IMX', 'MAGIC'].includes(token.symbol)) {
            category = 'gaming';
          }
          // AI tokens
          else if (['FET', 'AGIX', 'OCEAN', 'RLC', 'NMR'].includes(token.symbol)) {
            category = 'ai';
          }
          // NFT tokens
          else if (['APE', 'BLUR', 'LOOKS', 'RARE'].includes(token.symbol)) {
            category = 'nft';
          }
          
          // Add placeholder for logo url
          const logo = `/assets/crypto-logos/${token.symbol.toLowerCase()}.png`;
          
          return {
            ...token,
            category,
            isPopular: true,
            logo
          };
        });
        
        setPopularTokens(enhancedTokens);
      } catch (err) {
        console.error('Error fetching popular tokens:', err);
        // Set enhanced default tokens if API fails
        setPopularTokens([
          { symbol: 'BTC', name: 'Bitcoin', category: 'layer1', isPopular: true, logo: '/assets/crypto-logos/btc.png' },
          { symbol: 'ETH', name: 'Ethereum', category: 'layer1', isPopular: true, logo: '/assets/crypto-logos/eth.png' },
          { symbol: 'SOL', name: 'Solana', category: 'layer1', isPopular: true, logo: '/assets/crypto-logos/sol.png' },
          { symbol: 'DOGE', name: 'Dogecoin', category: 'meme', isPopular: true, logo: '/assets/crypto-logos/doge.png' },
          { symbol: 'ARB', name: 'Arbitrum', category: 'layer2', isPopular: true, logo: '/assets/crypto-logos/arb.png' },
          { symbol: 'PEPE', name: 'Pepe', category: 'meme', isPopular: true, logo: '/assets/crypto-logos/pepe.png' },
          { symbol: 'LINK', name: 'Chainlink', category: 'defi', isPopular: true, logo: '/assets/crypto-logos/link.png' },
          { symbol: 'ADA', name: 'Cardano', category: 'layer1', isPopular: true, logo: '/assets/crypto-logos/ada.png' },
          { symbol: 'XRP', name: 'XRP', category: 'layer1', isPopular: true, logo: '/assets/crypto-logos/xrp.png' },
          { symbol: 'AVAX', name: 'Avalanche', category: 'layer1', isPopular: true, logo: '/assets/crypto-logos/avax.png' },
          { symbol: 'MATIC', name: 'Polygon', category: 'layer2', isPopular: true, logo: '/assets/crypto-logos/matic.png' },
          { symbol: 'SHIB', name: 'Shiba Inu', category: 'meme', isPopular: true, logo: '/assets/crypto-logos/shib.png' },
        ]);
      }
    };
    
    fetchPopularTokens();
  }, []);

  // Filtered tokens based on category and search
  const filteredTokens = popularTokens.filter(token => {
    // Filter by category
    const matchesCategory = currentCategory === 'all' || token.category === currentCategory;
    
    // Filter by search term (if provided)
    const matchesSearch = !tokenSearch || 
      token.name.toLowerCase().includes(tokenSearch.toLowerCase()) || 
      token.symbol.toLowerCase().includes(tokenSearch.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  /**
   * Process raw content into a structured thread format
   * Used as a fallback when server returns malformed JSON
   */
  const processRawContent = (rawContent: string): string => {
    // If content is extremely large, truncate it
    let content = rawContent;
    if (content.length > 10000) {
      content = content.substring(0, 10000) + '... (content truncated)';
    }
    
    // First, check if the content has HTML tags and try to extract meaningful content
    if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<body')) {
      // Extract title if available
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'HTML Response';
      
      // Try to extract body content
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodyContent = bodyMatch ? 
        bodyMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : 
        'No readable content available in HTML response';
      
      // Limit body content length
      if (bodyContent.length > 500) {
        bodyContent = bodyContent.substring(0, 500) + '... (content truncated)';
      }
      
      // Format as error thread
      return `1/3: 🚨 Error: Received HTML instead of JSON data\n\n` +
             `2/3: ${title}\n\n` +
             `3/3: ${bodyContent}`;
    }
    
    // Try to detect if it's JSON-like content
    const jsonDetectionRegex = /^[\s\n]*[\{\[].*[\}\]][\s\n]*$/;
    if (jsonDetectionRegex.test(content)) {
      try {
        // Try to parse and extract meaningful content
        const parsed = JSON.parse(content);
        
        // If we have a thread-like structure, extract content
        if (parsed.thread && parsed.thread.content) {
          return parsed.thread.content;
        }
        
        // If we have choices like OpenAI format
        if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
          return parsed.choices[0].message.content || JSON.stringify(parsed.choices[0].message);
        }
        
        // Otherwise, stringify the JSON nicely
        return `1/3: 📊 Received JSON data with the following structure:\n\n` +
               `2/3: ${Object.keys(parsed).join(', ')}\n\n` +
               `3/3: Please try again or contact support if this issue persists.`;
      } catch (e) {
        // If JSON parsing fails, continue with regular processing
        console.error('Failed to parse JSON-like content:', e);
      }
    }
    
    // Check if content looks like it's already in a thread format (e.g., "1/10:")
    if (!content.includes('1/10') && !content.includes('2/10')) {
      // Split by newlines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // If we have a lot of lines, take up to 10 segments
      if (lines.length > 10) {
        const segments = lines.slice(0, 10);
        
        // Format as a thread
        return segments.map((segment, i) => {
          return `${i+1}/10: ${segment}`;
        }).join('\n\n');
      } 
      // If we have a reasonable number of lines, use all of them
      else if (lines.length > 1) {
        return lines.map((segment, i) => {
          return `${i+1}/${lines.length}: ${segment}`;
        }).join('\n\n');
      }
      // If we just have one big chunk, split it into 3 parts
      else if (content.length > 0) {
        const maxSegmentLength = 280; // Twitter-like limit
        const segments = [];
        
        // Split content into roughly equal parts, up to 10 segments
        for (let i = 0; i < content.length; i += maxSegmentLength) {
          if (segments.length < 10) {
            segments.push(content.substring(i, Math.min(i + maxSegmentLength, content.length)));
          }
        }
        
        // Format as a thread
        return segments.map((segment, i) => {
          return `${i+1}/${segments.length}: ${segment}`;
        }).join('\n\n');
      }
    }
    
    // If content already has thread format or we couldn't process it in any special way
    return content;
  };

  // Function to refresh thread count
  const refreshThreadCount = async () => {
    try {
      // Get current user ID from localStorage or context
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'current-user';
      const response = await fetch(`/api/thread/plan/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRemainingThreads(data.remaining);
        setDailyLimit(data.dailyLimit);
        setPlanType(data.plan);
        console.log('Updated thread count:', data.remaining, 'Plan type:', data.plan);
      }
    } catch (err) {
      console.error('Error refreshing thread count:', err);
    }
  };

  // Generate thread with enhanced options
  const generateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine which symbol to use (predefined or custom)
    const tokenSymbol = isCustomSymbol ? customSymbol : symbol;
    
    if (!tokenSymbol) {
      setError('Please select or enter a cryptocurrency');
      return;
    }
    
    // Get current user ID from localStorage or context
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'current-user';
    
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Initiating generation process...');
    
    // Initialize generation steps to show the preview of AI working
    const steps = [
      { step: 'Initializing AI agents', status: 'pending' as const },
      { step: 'Scraping real-time price data', status: 'pending' as const },
      { step: 'Analyzing market sentiment', status: 'pending' as const },
      { step: 'Fetching latest news', status: 'pending' as const },
      { step: 'Searching for governance proposals', status: 'pending' as const },
      { step: 'Generating thread content', status: 'pending' as const }
    ];
    
    setGenerationSteps(steps);
    setCurrentStep(0);
    
    // Start generation preview updates with API data
    let previewFetchAttempts = 0;
    const maxPreviewFetchAttempts = 5;
    
    // Start with the first step
    setGenerationSteps(prevSteps => {
      const newSteps = [...prevSteps];
      newSteps[0] = { ...newSteps[0], status: 'loading' };
      return newSteps;
    });
    
    // Function to fetch preview data
    const fetchPreviewData = async () => {
      try {
        // Mark the first step as complete immediately
        setTimeout(() => {
          setGenerationSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[0] = { ...newSteps[0], status: 'complete' };
            newSteps[1] = { ...newSteps[1], status: 'loading' };
            return newSteps;
          });
          setCurrentStep(1);
        }, 800);
        
        // Fetch actual generation status data from API
        const response = await fetch(`/api/web3Thread/generation-status/${tokenSymbol}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Update steps with real data
          if (data && data.steps) {
            for (let i = 1; i < data.steps.length; i++) {
              const delay = i * 1200; // Stagger updates for visual effect
              
              setTimeout(() => {
                setGenerationSteps(prevSteps => {
                  const newSteps = [...prevSteps];
                  newSteps[i] = { 
                    ...newSteps[i], 
                    status: data.steps[i].status, 
                    data: data.steps[i].data 
                  };
                  
                  // If this step is complete, start the next one
                  if (i < newSteps.length - 1 && data.steps[i].status === 'complete') {
                    newSteps[i+1] = { ...newSteps[i+1], status: 'loading' };
                  }
                  
                  return newSteps;
                });
                
                setCurrentStep(i);
              }, delay);
            }
          }
        } else {
          // If API fails, fall back to simulation
          fallbackToSimulation();
        }
      } catch (error) {
        console.error('Error fetching preview data:', error);
        // If API fails, fall back to simulation
        fallbackToSimulation();
      }
    };
    
    // Fallback to simulated preview if API fails
    const fallbackToSimulation = () => {
      previewFetchAttempts++;
      
      if (previewFetchAttempts < maxPreviewFetchAttempts) {
        // Try again with simulation
        const simulateStep = (index: number) => {
          if (index >= steps.length) return;
          
          // Update current step to loading
          setGenerationSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[index] = { ...newSteps[index], status: 'loading' };
            return newSteps;
          });
          
          setCurrentStep(index);
          
          // After a delay, mark as complete and move to next step
          const delay = index === steps.length - 1 ? 3500 : Math.random() * 1000 + 800; // Last step takes longer
          setTimeout(() => {
            // Generate fake data for each step
            let fakeData: {
              price?: string;
              change?: string;
              overall?: string;
              score?: string;
              count?: number;
              latest?: string;
              active?: boolean;
            } | undefined;
            
            switch(index) {
              case 1: // Price data
                fakeData = {
                  price: `$${(Math.random() * 1000 + 50).toFixed(2)}`,
                  change: `${(Math.random() * 10 - 5).toFixed(2)}%`
                };
                break;
              case 2: // Sentiment
                const sentiments = ['Bullish', 'Neutral', 'Bearish'];
                const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
                fakeData = {
                  overall: sentiment,
                  score: `${(Math.random() * 100).toFixed(0)}%`
                };
                break;
              case 3: // News
                fakeData = {
                  count: Math.floor(Math.random() * 5) + 1,
                  latest: `${tokenSymbol} announces new partnership`
                };
                break;
              case 4: // Governance
                fakeData = {
                  count: Math.floor(Math.random() * 3),
                  active: Math.random() > 0.5
                };
                break;
            }
            
            setGenerationSteps(prevSteps => {
              const newSteps = [...prevSteps];
              newSteps[index] = { 
                ...newSteps[index], 
                status: 'complete',
                data: fakeData
              };
              return newSteps;
            });
            
            // Move to next step
            if (index < steps.length - 1) {
              simulateStep(index + 1);
            }
          }, delay);
        };
        
        // Start the simulation with the first step
        simulateStep(0);
      }
    };
    
    // Start the preview
    fetchPreviewData();
    
    try {
      setLoadingStatus('Fetching crypto data...');
      
      // Get advanced options from form with new sentiment and timeframe options
      const advancedOptions = {
        includePricePredictions: document.getElementById('includePricePredictions') instanceof HTMLInputElement
          ? (document.getElementById('includePricePredictions') as HTMLInputElement).checked
          : true,
        includeTechnicalAnalysis: document.getElementById('includeTechnicalAnalysis') instanceof HTMLInputElement
          ? (document.getElementById('includeTechnicalAnalysis') as HTMLInputElement).checked
          : true,
        includeCryptoNews: document.getElementById('includeCryptoNews') instanceof HTMLInputElement
          ? (document.getElementById('includeCryptoNews') as HTMLInputElement).checked
          : true,
        includeGovernanceProposals: document.getElementById('includeGovernanceProposals') instanceof HTMLInputElement
          ? (document.getElementById('includeGovernanceProposals') as HTMLInputElement).checked
          : true,
        threadTone: document.getElementById('threadTone') instanceof HTMLSelectElement
          ? (document.getElementById('threadTone') as HTMLSelectElement).value
          : 'expert',
        sentiment: selectedSentiment,
        timeframe: analysisTimeframe
      };
      
      console.log('Advanced options:', advancedOptions);
      
      // Make API call to generate Web3 thread
      setLoadingStatus('Sending request to server...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
      
      try {
        const response = await fetch('/api/web3Thread/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            symbol: tokenSymbol,
            userId: userId,
            options: advancedOptions
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // FIXED: Get text content first to ensure we have valid JSON
        let responseText;
        try {
          responseText = await response.text();
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers));
          console.log('Response text length:', responseText.length);
          
          if (responseText.length > 0) {
            // Only log a preview to avoid console flooding
            console.log('Response preview:', responseText.substring(0, 200) + '...');
          } else {
            console.warn('Empty response received from server');
            throw new Error('Empty response received from server');
          }
        } catch (textError) {
          console.error('Error reading response text:', textError);
          throw new Error('Failed to read server response');
        }
        
        // Helper function to sanitize JSON
        const sanitizeJson = (text: string): string => {
          // FIXED: More robust JSON sanitization
          if (!text || typeof text !== 'string') {
            return '{}';
          }
          
          try {
          // Remove any potential BOM or other invisible characters
          let cleaned = text.replace(/^\uFEFF/, '');
          // Trim whitespace
          cleaned = cleaned.trim();
            
            // Check if it even looks like JSON
            if (!(cleaned.startsWith('{') && cleaned.endsWith('}')) && 
                !(cleaned.startsWith('[') && cleaned.endsWith(']'))) {
              console.warn('Text does not appear to be JSON format');
              return '{}';
            }
            
            // Test if it's valid JSON by parsing and stringifying
            const parsed = JSON.parse(cleaned);
            return JSON.stringify(parsed);
          } catch (e) {
            console.error('JSON sanitization error:', e);
            // If we can't parse it at all, return empty object
            return '{}';
          }
        };
        
        if (!response.ok) {
          // Check for JSON parsing errors in the response
          let errorMessage = 'Failed to generate thread';
          
          try {
            // Only try to parse as JSON if it looks like JSON
            if (responseText && (responseText.trim()[0] === '{' || responseText.trim()[0] === '[')) {
              const errorData = JSON.parse(sanitizeJson(responseText));
              console.log('Parsed error data:', errorData);
              
              if (errorData.error) {
                errorMessage = errorData.error;
                
                // Handle specific error cases
                if (errorData.error === 'Daily thread generation limit reached') {
                  errorMessage = 'You\'ve reached your daily thread generation limit';
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
            } else {
              // If response is not JSON, use text directly
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
              if (responseText) {
                errorMessage += ` - ${responseText.substring(0, 100)}`;
              }
            }
          } catch (parseError) {
            // If JSON parsing fails, use raw text
            console.error('Error parsing error response:', parseError);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
            if (responseText) {
              errorMessage += ` - ${responseText.substring(0, 100)}`;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        setLoadingStatus('Processing thread...');
        
        // FIXED: Parse the successful response with better error handling
        let data;
        try {
          // First, check if the response is HTML instead of JSON
          if (responseText.trim().startsWith('<!DOCTYPE') || 
              responseText.trim().startsWith('<html') || 
              responseText.includes('<!DOCTYPE html>')) {
            console.error('Received HTML response instead of JSON');
            
            // Try to extract title or error message from HTML
            const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
            const errorMessage = titleMatch ? `HTML Error: ${titleMatch[1]}` : 'Server returned HTML page instead of JSON';
            
            setError(errorMessage);
            console.error('HTML response:', responseText.substring(0, 200));
            
            // Create a fallback object instead of throwing
            data = {
              thread: {
                id: `error-${Date.now()}`,
                topic: tokenSymbol,
                tone: 'Web3 Expert',
                content: `ERROR: The server returned an HTML page instead of JSON data.\n\n${errorMessage}\n\nPlease try again later or contact support if this issue persists.`,
                created_at: new Date().toISOString(),
                metadata: { 
                  isError: true,
                  htmlResponse: true,
                  errorType: 'html_response',
                  generatedAt: new Date().toISOString()
                }
              },
              remaining: 0,
              error: errorMessage
            };
            
            // Skip the normal JSON parsing
          } else {
            // Try to determine if the response is valid JSON before parsing
            const sanitizedResponse = sanitizeJson(responseText);
            const trimmedResponse = sanitizedResponse.trim();
            const looksLikeJson = (trimmedResponse[0] === '{' && trimmedResponse[trimmedResponse.length - 1] === '}') ||
                                (trimmedResponse[0] === '[' && trimmedResponse[trimmedResponse.length - 1] === ']');
                                
            if (looksLikeJson) {
              console.log('Response appears to be valid JSON, attempting to parse');
              try {
                data = JSON.parse(sanitizedResponse);
                console.log('Successfully parsed JSON data:', data);
              } catch (strictParseError) {
                // If still can't parse after sanitization, try more aggressive cleanup
                console.error('JSON parse error after sanitization:', strictParseError);
                
                // Try to extract JSON from the response if it's embedded in other content
                const jsonMatch = responseText.match(/(\{.*\}|\[.*\])/);
                if (jsonMatch) {
                  try {
                    console.log('Attempting to extract JSON from response');
                    data = JSON.parse(jsonMatch[0]);
                    console.log('Successfully extracted and parsed JSON');
                  } catch (extractError) {
                    console.error('Failed to extract JSON:', extractError);
                    throw new Error('Failed to parse response as JSON');
                  }
                } else {
                  throw new Error('Could not find valid JSON in response');
                }
              }
            } else {
              console.error('Response does not appear to be valid JSON');
              // Try to show the raw response in the UI for debugging
              setError(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
              throw new Error('Server returned invalid JSON response');
            }
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('First 100 chars of response:', responseText.substring(0, 100));
          console.error('Last 100 chars of response:', responseText.substring(responseText.length - 100));
          
          // Check again for HTML in case it wasn't caught earlier
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html') || responseText.includes('<body')) {
            console.error('HTML response detected in error handler');
            
            // Try to extract title or error message from HTML
            const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
            const bodyContentMatch = responseText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            let errorDetails = titleMatch ? titleMatch[1] : 'Unknown HTML error';
            
            // Create fallback content with any details we can extract
            let fallbackContent = `ERROR: The server returned an HTML page instead of JSON.\n\n`;
            fallbackContent += `Error details: ${errorDetails}\n\n`;
            
            if (bodyContentMatch && bodyContentMatch[1]) {
              // Try to extract text from HTML body
              const bodyText = bodyContentMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
              if (bodyText.length > 0) {
                fallbackContent += `Message: ${bodyText.substring(0, 500)}`;
              }
            }
            
            // Create a fallback thread with the error details
            data = {
              thread: {
                id: `html-error-${Date.now()}`,
                topic: tokenSymbol,
                tone: 'Web3 Expert',
                content: processRawContent(fallbackContent),
                created_at: new Date().toISOString(),
                metadata: { 
                  isError: true,
                  htmlResponse: true,
                  errorDetails: errorDetails,
                  generatedAt: new Date().toISOString()
                }
              },
              remaining: 0,
              error: 'HTML response detected'
            };
            
            setError(`Server error: ${errorDetails}`);
            
          } else {
            // DIRECT FALLBACK: Create a thread directly from the response content
            console.log('Implementing direct client-side fallback for parsing error');
            
            // Process the raw content into a more readable thread format
            const processedContent = processRawContent(responseText);
            
            // Construct a minimal thread object
            data = {
              thread: {
                id: `fallback-${Date.now()}`,
                topic: tokenSymbol,
                tone: 'Web3 Expert',
                content: processedContent,
                created_at: new Date().toISOString(),
                metadata: { 
                  isFallback: true,
                  clientSideFallback: true,
                  generatedAt: new Date().toISOString()
                }
              },
              remaining: 0, // Assume 0 remaining as a fallback
              note: "Client-side fallback due to JSON parsing error"
            };
            
            console.log('Created client-side fallback thread:', data);
            setError('Server returned malformed JSON. Using raw content as thread.');
          }
        }
        
        // Update remaining threads from API response
        if (data && typeof data.remaining === 'number') {
          setRemainingThreads(data.remaining);
        }
        
        // FIXED: Verify we have valid thread data
        if (!data || !data.thread) {
          console.error('Invalid response format: Missing thread data', data);
          throw new Error('Server returned incomplete data');
        }
        
        // Format the thread object to match our interface
        const generatedThread = {
          id: data.thread.id,
          topic: data.thread.topic || tokenSymbol,
          tone: data.thread.tone || 'Web3 Expert',
          content: data.thread.content || '',
          created_at: data.thread.created_at || new Date().toISOString(),
          metadata: data.thread.metadata || {}
        };

        // Ensure content is not empty or malformed
        if (!generatedThread.content || generatedThread.content.trim() === '') {
          console.warn('Empty thread content detected, adding fallback message');
          generatedThread.content = `1/3: 🔍 Thread for ${tokenSymbol} was generated\n\n2/3: However, the content appears to be empty\n\n3/3: Please try generating again or try a different cryptocurrency`;
          generatedThread.metadata = {
            ...generatedThread.metadata,
            contentError: true,
            fallbackApplied: true
          };
        }

        // Save the last generated thread locally
        setLastGeneratedThread(generatedThread);
        
        // Call callback if provided
        if (onThreadGenerated) {
          onThreadGenerated(generatedThread);
        }
        
        // Refresh thread count after successful generation
        await refreshThreadCount();
        
        // Reset form
        setSymbol('');
        setCustomSymbol('');
        setIsCustomSymbol(false);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Thread generation error:', err);
      setError(err.message || 'Error generating thread. Please try again later.');
      
      // Still try to refresh thread count in case of error
      await refreshThreadCount();
    } finally {
      setIsLoading(false);
      setLoadingStatus('idle');
    }
  };

  // Handle token selection
  const handleTokenSelect = (tokenSymbol: string) => {
    setSymbol(tokenSymbol);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Create Crypto Thread</h2>
          <p className="text-gray-400 text-sm mt-1">Generate a viral crypto thread with AI</p>
        </div>
      </div>
      
      <form onSubmit={generateThread} className="space-y-5">
        <div className="space-y-5">
          {!isCustomSymbol ? (
            <div>
              {/* Token Category Filter */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCurrentCategory(category.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        currentCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-900/30 text-gray-300 hover:bg-blue-800/30'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Search Filter */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-sm"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-1">
                Select Cryptocurrency
              </label>
              
              {/* Token Grid Selection */}
              {filteredTokens.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => handleTokenSelect(token.symbol)}
                      className={`flex items-center p-3 rounded-lg border transition-all ${
                        symbol === token.symbol
                          ? 'bg-blue-900/60 border-blue-500 shadow-md shadow-blue-900/30'
                          : 'bg-blue-950/30 border-blue-900/50 hover:bg-blue-900/40'
                      }`}
                    >
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white mr-3">
                        {token.symbol.substring(0, 1)}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium text-sm">${token.symbol}</div>
                        <div className="text-gray-400 text-xs">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 text-center mb-4">
                  <p className="text-gray-400 text-sm">No tokens found matching your search</p>
                </div>
              )}
              
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomSymbol(true)}
                  className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                >
                  Enter custom token
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="customSymbol" className="block text-sm font-medium text-gray-300 mb-1">
                Enter Token Symbol or Name
              </label>
              <input
                id="customSymbol"
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                placeholder="e.g., BTC, ETH, DOGE, Arbitrum..."
                className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                disabled={isLoading}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomSymbol(false)}
                  className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                >
                  Choose from popular tokens
                </button>
              </div>
            </div>
          )}
          
          {/* Advanced Options Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 transition-transform ${isAdvancedMode ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {isAdvancedMode ? 'Hide advanced options' : 'Show advanced options'}
            </button>
            
            {isAdvancedMode && (
              <div className="mt-4 p-4 rounded-lg border border-blue-900/50 bg-blue-950/30">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Advanced Thread Options</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2 text-sm text-gray-400">
                      <input 
                        type="checkbox"
                        id="includePricePredictions"
                        className="rounded bg-blue-900/50 border-blue-700 text-blue-600 focus:ring-blue-500/30"
                        defaultChecked
                        disabled={isLoading}
                      />
                      <span>Include price predictions</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm text-gray-400">
                      <input 
                        type="checkbox"
                        id="includeTechnicalAnalysis"
                        className="rounded bg-blue-900/50 border-blue-700 text-blue-600 focus:ring-blue-500/30"
                        defaultChecked
                        disabled={isLoading}
                      />
                      <span>Include technical analysis</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm text-gray-400">
                      <input 
                        type="checkbox"
                        id="includeCryptoNews"
                        className="rounded bg-blue-900/50 border-blue-700 text-blue-600 focus:ring-blue-500/30"
                        defaultChecked
                        disabled={isLoading}
                      />
                      <span>Include crypto news</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm text-gray-400">
                      <input 
                        type="checkbox"
                        id="includeGovernanceProposals"
                        className="rounded bg-blue-900/50 border-blue-700 text-blue-600 focus:ring-blue-500/30"
                        defaultChecked
                        disabled={isLoading}
                      />
                      <span>Include governance proposals</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-4">
                  <TonePresets 
                    onSelect={(tone) => {
                      const select = document.getElementById('threadTone') as HTMLSelectElement;
                      if (select) select.value = tone;
                    }}
                    currentTone={document.getElementById('threadTone') instanceof HTMLSelectElement ? 
                      (document.getElementById('threadTone') as HTMLSelectElement).value : ''}
                    variant="web3"
                  />
                  
                  <div className="hidden">
                    <select
                      id="threadTone"
                      className="w-full rounded-lg border border-blue-900/50 bg-[#0A0F29] px-3 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-sm"
                      disabled={isLoading}
                    >
                      <option value="expert">Crypto Expert</option>
                      <option value="bullish">Bullish</option>
                      <option value="bearish">Bearish</option>
                      <option value="neutral">Neutral Analysis</option>
                      <option value="influencer">Influencer</option>
                      <option value="degen">Degen Mode</option>
                      <option value="hype">Hype Mode</option>
                      <option value="educational">Educational Mode</option>
                      <option value="shill">Shill Mode</option>
                    </select>
                  </div>
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
              ${(isLoading || hasReachedLimit || (!isCustomSymbol && !symbol) || (isCustomSymbol && !customSymbol)) ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasReachedLimit || (!isCustomSymbol && !symbol) || (isCustomSymbol && !customSymbol)}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingStatus || 'Generating your thread...'}
              </span>
            ) : (
              'Generate Thread'
            )}
          </button>
          
          {/* Add AI Agent Preview when loading */}
          {isLoading && generationSteps.length > 0 && (
            <AIAgentPreview 
              steps={generationSteps} 
              currentStep={currentStep} 
              cryptoSymbol={isCustomSymbol ? customSymbol : symbol}
            />
          )}
          
          {!error && !hasReachedLimit && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Using AI to craft a comprehensive crypto analysis thread
            </p>
          )}
        </div>
      </form>
      
      {/* Features Section */}
      <div className="border-t border-blue-900/30 pt-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Features:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Real-time price data from CoinGecko</p>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Latest news from CryptoPanic</p>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">DAO proposals from Snapshot</p>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">AI-crafted insights and alpha</p>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Sentiment analysis</p>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-blue-900/30 p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Viral-ready formatted tweets</p>
          </div>
        </div>
      </div>
    </div>
  );
} 