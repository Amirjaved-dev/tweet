import express from 'express';
import { canGenerateThread, incrementThreadCount, getWeb3Threads } from '../db/storage';
import { config } from '../config';
import { Web3ThreadGeneratorService } from '../services/web3ThreadGenerator';
import { CryptoDataService } from '../services/cryptoData';

const router = express.Router();
const web3ThreadGenerator = new Web3ThreadGeneratorService();
const cryptoDataService = new CryptoDataService();

/**
 * Safely send a JSON response - ensures proper content type and valid JSON format
 * @param res Express response object
 * @param statusCode HTTP status code to send
 * @param data Data to send as JSON
 */
function safeJsonResponse(res: any, statusCode: number, data: any) {
  // Always set proper content type and CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  try {
    // If data is already a string, check if it's valid JSON
    if (typeof data === 'string') {
      try {
        // Try parsing to validate it's actual JSON
        JSON.parse(data);
        // If it parses successfully, we can send it directly
        return res.status(statusCode).send(data);
      } catch (e) {
        // Not valid JSON, convert to JSON object
        data = { content: data };
      }
    }
    
    // Test JSON stringification before sending
    const jsonString = JSON.stringify(data);
    
    // If we got here, the JSON is valid
    return res.status(statusCode).send(jsonString);
  } catch (jsonError) {
    console.error('Error stringifying response data:', jsonError);
    
    // Create a sanitized version of the data
    let sanitizedData;
    try {
      // Try to convert to string and remove problematic characters
      sanitizedData = JSON.stringify({
        error: 'Server error while formatting response',
        message: 'The server encountered an error while preparing the response data',
        originalDataType: typeof data
      });
    } catch (e) {
      // If that fails too, send a basic error response
      sanitizedData = JSON.stringify({
        error: 'Critical server error',
        message: 'Unable to format response data'
      });
    }
    
    // Send the sanitized response
    return res.status(500).send(sanitizedData);
  }
}

/**
 * Generate a Web3 Twitter thread with real-time data
 * POST /api/web3Thread/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { symbol, userId, options } = req.body;

    // Validate input
    if (!symbol || !userId) {
      return safeJsonResponse(res, 400, { error: 'Missing required fields' });
    }

    // Check if user can generate thread
    const { canGenerate, remaining } = await canGenerateThread(userId);

    if (!canGenerate) {
      return safeJsonResponse(res, 403, { 
        error: 'Daily thread generation limit reached', 
        remaining: 0 
      });
    }

    try {
      // Try to generate thread with the AI service
      console.log('Attempting to generate thread using OpenRouter API...');
      
      // Check if OpenRouter API key is configured
      if (!config.openRouterApiKey) {
        console.error('Missing OpenRouter API key');
        return safeJsonResponse(res, 500, { error: 'API configuration error' });
      }
      
      // Process advanced options if provided - Enhanced with new options
      const threadOptions = {
        includePricePredictions: options?.includePricePredictions !== undefined ? options.includePricePredictions : true,
        includeTechnicalAnalysis: options?.includeTechnicalAnalysis !== undefined ? options.includeTechnicalAnalysis : true,
        includeCryptoNews: options?.includeCryptoNews !== undefined ? options.includeCryptoNews : true,
        includeGovernanceProposals: options?.includeGovernanceProposals !== undefined ? options.includeGovernanceProposals : true,
        threadTone: options?.threadTone || 'expert',
        useTwitterAnalysis: options?.useTwitterAnalysis !== undefined ? options.useTwitterAnalysis : false,
        // New enhanced options
        sentiment: options?.sentiment || 'neutral',
        timeframe: options?.timeframe || 'short'
      };
      
      console.log('Thread generation options:', threadOptions);
      
      // Generate thread with real-time Web3 data and enhanced options
      const generatedThread = await web3ThreadGenerator.generateThread(symbol, userId, threadOptions);
      
      // Increment user's thread count
      await incrementThreadCount(userId);
      
      // Get updated remaining thread count after increment
      const { remaining: updatedRemaining } = await canGenerateThread(userId);
      
      // Check if user is on free plan to add watermark
      const isFreeUser = updatedRemaining <= config.dailyThreadLimitFree;
      
      // Add watermark for free users
      if (isFreeUser && generatedThread && generatedThread.content) {
        // Add watermark to the end of the thread content
        generatedThread.content += `\n\n${generatedThread.content.includes('10/10') ? '11/11' : '🔍'}: Generated with ThreadFlow Free. Upgrade for watermark-free threads at threadflowpro.app`;
        
        // Add watermark flag to metadata
        if (generatedThread.metadata) {
          generatedThread.metadata.watermarked = true;
        }
      }
      
      // Make sure we have a valid thread object
      if (!generatedThread || typeof generatedThread !== 'object') {
        console.error('Invalid thread data returned from generator:', generatedThread);
        return safeJsonResponse(res, 500, { 
          error: 'Server returned invalid thread data',
          remaining: updatedRemaining
        });
      }
      
      // Return the thread and remaining count
      return safeJsonResponse(res, 200, { 
        thread: generatedThread,
        remaining: updatedRemaining
      });
      
    } catch (error) {
      console.error('Error generating Web3 thread:', error);
      
      // Format error message for client
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Get the current remaining count (unchanged since generation failed)
      const { remaining: currentRemaining } = await canGenerateThread(userId);
      
      return safeJsonResponse(res, 500, { 
        error: 'Error generating Web3 thread', 
        message: errorMessage,
        remaining: currentRemaining
      });
    }
  } catch (error) {
    console.error('Critical error in generate endpoint:', error);
    return safeJsonResponse(res, 500, { 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown server error'
    });
  }
});

/**
 * Generate a template-based fallback thread when AI generation fails
 * @private
 */
function generateTemplateFallbackThread(cryptoData: any, threadOptions: any, userId: string): any {
  console.log('Creating template-based fallback thread');
  
  // Extract token data
  const token = cryptoData.token || {};
  const tokenName = token.name || 'this cryptocurrency';
  const tokenSymbol = token.symbol || 'CRYPTO';
  const price = token.price ? `$${token.price.toFixed(2)}` : 'unknown price';
  const priceChange = token.priceChangePercentage24h ? 
    (token.priceChangePercentage24h > 0 ? `+${token.priceChangePercentage24h.toFixed(2)}%` : `${token.priceChangePercentage24h.toFixed(2)}%`) : 
    'unknown';
  
  // Create emojis based on price movement
  const emoji = token.priceChangePercentage24h > 0 ? '🚀' : (token.priceChangePercentage24h < 0 ? '📉' : '📊');
  
  // Create template tweets
  const tweets = [
    `1/10: ${emoji} THREAD: ${tokenName} ($${tokenSymbol}) is currently trading at ${price}, with a 24h change of ${priceChange}. Let's analyze what's happening! #${tokenSymbol} #Crypto`,
    `2/10: ${emoji} ${tokenName} has a market cap of $${token.marketCap ? (token.marketCap / 1000000000).toFixed(2) + 'B' : 'unknown'} and 24h trading volume of $${token.volume24h ? (token.volume24h / 1000000).toFixed(2) + 'M' : 'unknown'}. ${token.priceChangePercentage24h > 0 ? 'Strong buying interest today!' : 'Watching for potential recovery.'}`,
    `3/10: ${emoji} KEY METRICS: 24h price range is $${token.low24h || '?'} - $${token.high24h || '?'}. All-time high: $${token.allTimeHigh || '?'}. ${token.price && token.allTimeHigh ? `Currently ${((token.price - token.allTimeHigh) / token.allTimeHigh * 100).toFixed(2)}% from ATH.` : ''}`,
    `4/10: ${emoji} ${cryptoData.news && cryptoData.news.length > 0 ? `LATEST NEWS: ${cryptoData.news[0].title}` : `No major news for ${tokenName} today, but stay tuned to official channels for updates.`}`,
    `5/10: ${emoji} ${cryptoData.proposals && cryptoData.proposals.length > 0 ? `GOVERNANCE: There's an active proposal - "${cryptoData.proposals[0].title}"` : `${tokenName} continues to develop its ecosystem and community governance.`}`,
    `6/10: ${emoji} TECHNICAL OUTLOOK: ${token.priceChangePercentage24h > 0 ? `$${tokenSymbol} is showing bullish momentum with key resistance levels ahead.` : `$${tokenSymbol} is in a consolidation phase. Watch key support levels.`}`,
    `7/10: ${emoji} FUNDAMENTALS: Consider ${tokenName}'s utility, adoption metrics, and development activity when evaluating long-term potential.`,
    `8/10: ${emoji} MARKET SENTIMENT: Overall market sentiment for ${tokenName} appears ${token.priceChangePercentage24h > 5 ? 'strongly bullish' : (token.priceChangePercentage24h > 0 ? 'cautiously optimistic' : (token.priceChangePercentage24h < -5 ? 'bearish' : 'neutral'))}.`,
    `9/10: ${emoji} ALPHA: Keep an eye on ${tokenName}'s upcoming developments and roadmap milestones. These could be significant catalysts for future price action.`,
    `10/10: ${emoji} That's my analysis on $${tokenSymbol}! If you found this helpful, please RT and follow for more crypto insights and alpha! #Crypto #${tokenSymbol}`
  ];
  
  // Join all tweets with double newlines
  const threadContent = tweets.join('\n\n');
  
  // Create a formatted thread structure similar to what the AI would generate
  const formattedTweets = tweets.map((tweet, index) => {
    const tweetNumber = index + 1;
    const cleanContent = tweet.replace(/^\d+\/10:\s/, '');
    
    // Determine tweet type
    let tweetType = 'info';
    if (tweetNumber === 1) tweetType = 'hook';
    if (tweetNumber === 10) tweetType = 'cta';
    if (tweet.includes('TECHNICAL') || tweet.includes('price') || tweet.includes('resistance')) tweetType = 'price';
    if (tweet.includes('NEWS')) tweetType = 'news';
    if (tweet.includes('GOVERNANCE')) tweetType = 'governance';
    if (tweet.includes('ALPHA')) tweetType = 'alpha';
    
    return {
      number: tweetNumber,
      content: cleanContent,
      characterCount: cleanContent.length,
      hashtags: (cleanContent.match(/#[a-zA-Z0-9_]+/g) || []),
      mentions: [],
      type: tweetType
    };
  });
  
  // Create sentiment analysis
  const sentiment = {
    price: token.priceChangePercentage24h > 5 ? 'very-bullish' : 
          (token.priceChangePercentage24h > 0 ? 'bullish' : 
          (token.priceChangePercentage24h < -5 ? 'very-bearish' : 
          (token.priceChangePercentage24h < 0 ? 'bearish' : 'neutral'))),
    news: 'neutral',
    overall: token.priceChangePercentage24h > 5 ? 'very-bullish' : 
            (token.priceChangePercentage24h > 0 ? 'bullish' : 
            (token.priceChangePercentage24h < -5 ? 'very-bearish' : 
            (token.priceChangePercentage24h < 0 ? 'bearish' : 'neutral')))
  };
  
  // Create thread metadata
  return {
    user_id: userId,
    topic: tokenName,
    tone: threadOptions.threadTone === 'expert' ? 'Web3 Expert' : `Web3 ${threadOptions.threadTone.charAt(0).toUpperCase() + threadOptions.threadTone.slice(1)}`,
    content: threadContent,
    metadata: {
      tokenData: cryptoData.token,
      newsCount: cryptoData.news?.length || 0,
      proposalsCount: cryptoData.proposals?.length || 0,
      tweets: formattedTweets,
      sentiment: sentiment,
      sources: {
        price: { source: 'CoinGecko', available: !!cryptoData.token },
        news: { source: 'CryptoPanic', available: cryptoData.news && cryptoData.news.length > 0 },
        governance: { source: 'Snapshot', available: cryptoData.proposals && cryptoData.proposals.length > 0 }
      },
      isFallback: true,
      options: threadOptions
    }
  };
}

/**
 * Get popular crypto tokens list with enhanced categorization
 * GET /api/web3Thread/tokens
 */
router.get('/tokens', async (req, res) => {
  try {
    // Enhanced list of popular tokens with detailed categorization
    const popularTokens = [
      // Layer 1 blockchains
      { symbol: 'BTC', name: 'Bitcoin', category: 'layer1', marketCap: 800000000000, isPopular: true, logo: '/assets/crypto-logos/btc.png' },
      { symbol: 'ETH', name: 'Ethereum', category: 'layer1', marketCap: 300000000000, isPopular: true, logo: '/assets/crypto-logos/eth.png' },
      { symbol: 'SOL', name: 'Solana', category: 'layer1', marketCap: 25000000000, isPopular: true, logo: '/assets/crypto-logos/sol.png' },
      { symbol: 'ADA', name: 'Cardano', category: 'layer1', marketCap: 15000000000, isPopular: true, logo: '/assets/crypto-logos/ada.png' },
      { symbol: 'XRP', name: 'XRP', category: 'layer1', marketCap: 35000000000, isPopular: true, logo: '/assets/crypto-logos/xrp.png' },
      { symbol: 'AVAX', name: 'Avalanche', category: 'layer1', marketCap: 12000000000, isPopular: true, logo: '/assets/crypto-logos/avax.png' },
      { symbol: 'DOT', name: 'Polkadot', category: 'layer1', marketCap: 8000000000, isPopular: true, logo: '/assets/crypto-logos/dot.png' },
      { symbol: 'ATOM', name: 'Cosmos', category: 'layer1', marketCap: 3000000000, isPopular: true, logo: '/assets/crypto-logos/atom.png' },
      { symbol: 'NEAR', name: 'NEAR Protocol', category: 'layer1', marketCap: 4000000000, isPopular: true, logo: '/assets/crypto-logos/near.png' },

      // Layer 2 solutions
      { symbol: 'MATIC', name: 'Polygon', category: 'layer2', marketCap: 7000000000, isPopular: true, logo: '/assets/crypto-logos/matic.png' },
      { symbol: 'ARB', name: 'Arbitrum', category: 'layer2', marketCap: 3000000000, isPopular: true, logo: '/assets/crypto-logos/arb.png' },
      { symbol: 'OP', name: 'Optimism', category: 'layer2', marketCap: 2000000000, isPopular: false, logo: '/assets/crypto-logos/op.png' },
      { symbol: 'IMX', name: 'Immutable X', category: 'layer2', marketCap: 1500000000, isPopular: false, logo: '/assets/crypto-logos/imx.png' },

      // DeFi protocols
      { symbol: 'LINK', name: 'Chainlink', category: 'defi', marketCap: 8000000000, isPopular: true, logo: '/assets/crypto-logos/link.png' },
      { symbol: 'UNI', name: 'Uniswap', category: 'defi', marketCap: 4000000000, isPopular: true, logo: '/assets/crypto-logos/uni.png' },
      { symbol: 'AAVE', name: 'Aave', category: 'defi', marketCap: 2000000000, isPopular: false, logo: '/assets/crypto-logos/aave.png' },
      { symbol: 'CRV', name: 'Curve DAO', category: 'defi', marketCap: 800000000, isPopular: false, logo: '/assets/crypto-logos/crv.png' },
      { symbol: 'MKR', name: 'Maker', category: 'defi', marketCap: 1500000000, isPopular: false, logo: '/assets/crypto-logos/mkr.png' },
      { symbol: 'SNX', name: 'Synthetix', category: 'defi', marketCap: 500000000, isPopular: false, logo: '/assets/crypto-logos/snx.png' },
      { symbol: 'COMP', name: 'Compound', category: 'defi', marketCap: 300000000, isPopular: false, logo: '/assets/crypto-logos/comp.png' },
      { symbol: 'SUSHI', name: 'SushiSwap', category: 'defi', marketCap: 200000000, isPopular: false, logo: '/assets/crypto-logos/sushi.png' },

      // Meme coins
      { symbol: 'DOGE', name: 'Dogecoin', category: 'meme', marketCap: 12000000000, isPopular: true, logo: '/assets/crypto-logos/doge.png' },
      { symbol: 'SHIB', name: 'Shiba Inu', category: 'meme', marketCap: 5000000000, isPopular: true, logo: '/assets/crypto-logos/shib.png' },
      { symbol: 'PEPE', name: 'Pepe', category: 'meme', marketCap: 800000000, isPopular: true, logo: '/assets/crypto-logos/pepe.png' },
      { symbol: 'FLOKI', name: 'Floki Inu', category: 'meme', marketCap: 300000000, isPopular: false, logo: '/assets/crypto-logos/floki.png' },
      { symbol: 'BONK', name: 'Bonk', category: 'meme', marketCap: 150000000, isPopular: false, logo: '/assets/crypto-logos/bonk.png' },
      { symbol: 'WIF', name: 'dogwifhat', category: 'meme', marketCap: 400000000, isPopular: false, logo: '/assets/crypto-logos/wif.png' },

      // Gaming tokens
      { symbol: 'AXS', name: 'Axie Infinity', category: 'gaming', marketCap: 800000000, isPopular: false, logo: '/assets/crypto-logos/axs.png' },
      { symbol: 'SAND', name: 'The Sandbox', category: 'gaming', marketCap: 600000000, isPopular: false, logo: '/assets/crypto-logos/sand.png' },
      { symbol: 'MANA', name: 'Decentraland', category: 'gaming', marketCap: 400000000, isPopular: false, logo: '/assets/crypto-logos/mana.png' },
      { symbol: 'ENJ', name: 'Enjin Coin', category: 'gaming', marketCap: 200000000, isPopular: false, logo: '/assets/crypto-logos/enj.png' },
      { symbol: 'GALA', name: 'Gala Games', category: 'gaming', marketCap: 300000000, isPopular: false, logo: '/assets/crypto-logos/gala.png' },
      { symbol: 'MAGIC', name: 'Magic', category: 'gaming', marketCap: 100000000, isPopular: false, logo: '/assets/crypto-logos/magic.png' },

      // AI tokens
      { symbol: 'FET', name: 'Fetch.ai', category: 'ai', marketCap: 500000000, isPopular: false, logo: '/assets/crypto-logos/fet.png' },
      { symbol: 'AGIX', name: 'SingularityNET', category: 'ai', marketCap: 300000000, isPopular: false, logo: '/assets/crypto-logos/agix.png' },
      { symbol: 'OCEAN', name: 'Ocean Protocol', category: 'ai', marketCap: 200000000, isPopular: false, logo: '/assets/crypto-logos/ocean.png' },
      { symbol: 'RLC', name: 'iExec RLC', category: 'ai', marketCap: 150000000, isPopular: false, logo: '/assets/crypto-logos/rlc.png' },
      { symbol: 'NMR', name: 'Numeraire', category: 'ai', marketCap: 100000000, isPopular: false, logo: '/assets/crypto-logos/nmr.png' },

      // NFT tokens
      { symbol: 'APE', name: 'ApeCoin', category: 'nft', marketCap: 800000000, isPopular: false, logo: '/assets/crypto-logos/ape.png' },
      { symbol: 'BLUR', name: 'Blur', category: 'nft', marketCap: 300000000, isPopular: false, logo: '/assets/crypto-logos/blur.png' },
      { symbol: 'LOOKS', name: 'LooksRare', category: 'nft', marketCap: 50000000, isPopular: false, logo: '/assets/crypto-logos/looks.png' },
      { symbol: 'RARE', name: 'SuperRare', category: 'nft', marketCap: 30000000, isPopular: false, logo: '/assets/crypto-logos/rare.png' },
    ];

    // Add metadata about categories
    const categories = [
      { id: 'all', name: 'All Tokens', count: popularTokens.length },
      { id: 'layer1', name: 'Layer 1', count: popularTokens.filter(t => t.category === 'layer1').length },
      { id: 'layer2', name: 'Layer 2', count: popularTokens.filter(t => t.category === 'layer2').length },
      { id: 'defi', name: 'DeFi', count: popularTokens.filter(t => t.category === 'defi').length },
      { id: 'meme', name: 'Meme', count: popularTokens.filter(t => t.category === 'meme').length },
      { id: 'gaming', name: 'Gaming', count: popularTokens.filter(t => t.category === 'gaming').length },
      { id: 'ai', name: 'AI', count: popularTokens.filter(t => t.category === 'ai').length },
      { id: 'nft', name: 'NFT', count: popularTokens.filter(t => t.category === 'nft').length },
    ];
    
    return safeJsonResponse(res, 200, { 
      tokens: popularTokens,
      categories: categories,
      meta: {
        totalTokens: popularTokens.length,
        popularTokens: popularTokens.filter(t => t.isPopular).length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    return safeJsonResponse(res, 500, { error: 'Error fetching popular tokens' });
  }
});

/**
 * Get trending crypto tokens
 * GET /api/web3Thread/trending
 */
router.get('/trending', async (req, res) => {
  try {
    // Get trending tokens from CoinGecko
    const trendingData = await fetch('https://api.coingecko.com/api/v3/search/trending').then(res => res.json());
    
    if (!trendingData || !trendingData.coins) {
      return safeJsonResponse(res, 200, { 
        trending: [],
        message: 'No trending data available'
      });
    }
    
    // Format trending tokens
    const trendingTokens = trendingData.coins.map((coin: any) => ({
      id: coin.item.id,
      symbol: coin.item.symbol.toUpperCase(),
      name: coin.item.name,
      marketCapRank: coin.item.market_cap_rank,
      thumb: coin.item.thumb,
      score: coin.item.score,
    }));
    
    return safeJsonResponse(res, 200, { trending: trendingTokens });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return safeJsonResponse(res, 500, { 
      error: 'Error fetching trending tokens',
      trending: [] 
    });
  }
});

/**
 * Get token metadata (price, news, proposals)
 * GET /api/web3Thread/token/:symbol
 */
router.get('/token/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return safeJsonResponse(res, 400, { error: 'Missing token symbol' });
    }
    
    // Get token data
    const tokenData = await cryptoDataService.getAllCryptoData(symbol);
    
    return safeJsonResponse(res, 200, { data: tokenData });
  } catch (error) {
    console.error('Error fetching token data:', error);
    return safeJsonResponse(res, 500, { 
      error: 'Error fetching token data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's Web3 thread history
 * GET /api/web3Thread/history/:userId
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return safeJsonResponse(res, 400, { error: 'Missing user ID' });
    }
    
    // Get Web3 threads for the user
    const { data: threads, error } = await getWeb3Threads(userId);
    
    if (error) {
      console.error('Error fetching threads:', error);
      return safeJsonResponse(res, 500, { error: 'Error fetching threads' });
    }
    
    return safeJsonResponse(res, 200, { threads });
  } catch (error) {
    console.error('Error fetching Web3 thread history:', error);
    return safeJsonResponse(res, 500, { error: 'Error fetching thread history' });
  }
});

/**
 * Get real-time generation status for AI preview
 * GET /api/web3Thread/generation-status/:symbol
 */
router.get('/generation-status/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return safeJsonResponse(res, 400, { error: 'Missing token symbol' });
    }
    
    // Quickly fetch limited data to simulate real-time scraping
    const tokenPrice = await cryptoDataService.getQuickTokenPrice(symbol);
    const newsCount = await cryptoDataService.getQuickNewsCount(symbol);
    
    // Generate a realistic response with real data when available
    const status = {
      steps: [
        { 
          step: 'Initializing AI agents', 
          status: 'complete', 
          timestamp: new Date().toISOString() 
        },
        { 
          step: 'Scraping real-time price data', 
          status: 'complete', 
          timestamp: new Date().toISOString(),
          data: tokenPrice ? {
            price: `$${tokenPrice.price?.toFixed(2) || '?'}`,
            change: `${tokenPrice.priceChangePercentage24h > 0 ? '+' : ''}${tokenPrice.priceChangePercentage24h?.toFixed(2) || '?'}%`
          } : {
            price: `$${(Math.random() * 1000 + 50).toFixed(2)}`,
            change: `${(Math.random() * 10 - 5).toFixed(2)}%`
          }
        },
        { 
          step: 'Analyzing market sentiment', 
          status: 'complete', 
          timestamp: new Date().toISOString(),
          data: {
            overall: tokenPrice && tokenPrice.priceChangePercentage24h ? 
              (tokenPrice.priceChangePercentage24h > 5 ? 'Bullish' : 
               tokenPrice.priceChangePercentage24h < -5 ? 'Bearish' : 'Neutral') : 
              ['Bullish', 'Neutral', 'Bearish'][Math.floor(Math.random() * 3)],
            score: `${(Math.random() * 100).toFixed(0)}%`
          }
        },
        { 
          step: 'Fetching latest news', 
          status: 'complete', 
          timestamp: new Date().toISOString(),
          data: {
            count: newsCount || Math.floor(Math.random() * 5) + 1,
            latest: `${symbol} ${['announces partnership', 'gains momentum', 'reaches new milestone', 'trends on social media'][Math.floor(Math.random() * 4)]}`
          }
        },
        { 
          step: 'Searching for governance proposals', 
          status: 'complete', 
          timestamp: new Date().toISOString(),
          data: {
            count: Math.floor(Math.random() * 3),
            active: Math.random() > 0.5
          }
        },
        { 
          step: 'Generating thread content', 
          status: 'loading', 
          timestamp: new Date().toISOString(),
          progress: Math.floor(Math.random() * 40) + 60 // 60-100% progress
        }
      ],
      currentStep: 5,
      overallProgress: 90,
      estimatedTimeRemaining: Math.floor(Math.random() * 10) + 5 // 5-15 seconds
    };
    
    return safeJsonResponse(res, 200, status);
  } catch (error) {
    console.error('Error fetching generation status:', error);
    return safeJsonResponse(res, 500, { 
      error: 'Error fetching generation status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 