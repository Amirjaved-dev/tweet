import { config } from '../config';
import { CryptoDataService } from './cryptoData';
import { PromptGeneratorService } from './promptGenerator';
import { TokenAnalyzerService } from './tokenAnalyzer';

/**
 * Service for generating Web3 Twitter threads with real-time data
 */
export class Web3ThreadGeneratorService {
  private cryptoDataService: CryptoDataService;
  private promptGeneratorService: PromptGeneratorService;
  private tokenAnalyzerService: TokenAnalyzerService;

  constructor() {
    this.cryptoDataService = new CryptoDataService();
    this.promptGeneratorService = new PromptGeneratorService();
    this.tokenAnalyzerService = new TokenAnalyzerService();
  }

  /**
   * Generate a Web3 Twitter thread for a given cryptocurrency
   * @param symbol Cryptocurrency symbol or token name
   * @param userId User ID for tracking
   * @param options Advanced thread generation options including new sentiment and timeframe analysis
   * @returns Generated thread and metadata
   */
  async generateThread(
    symbol: string, 
    userId: string, 
    options: {
      includePricePredictions?: boolean;
      includeTechnicalAnalysis?: boolean;
      includeCryptoNews?: boolean;
      includeGovernanceProposals?: boolean;
      threadTone?: string;
      useTwitterAnalysis?: boolean;
      sentiment?: string; // New: bullish, neutral, bearish
      timeframe?: string; // New: short, medium, long
    } = {}
  ): Promise<any> {
    try {
      // Set default options if not provided - Enhanced with new options
      const threadOptions = {
        includePricePredictions: options.includePricePredictions !== undefined ? options.includePricePredictions : true,
        includeTechnicalAnalysis: options.includeTechnicalAnalysis !== undefined ? options.includeTechnicalAnalysis : true,
        includeCryptoNews: options.includeCryptoNews !== undefined ? options.includeCryptoNews : true,
        includeGovernanceProposals: options.includeGovernanceProposals !== undefined ? options.includeGovernanceProposals : true,
        threadTone: options.threadTone || 'expert',
        useTwitterAnalysis: options.useTwitterAnalysis !== undefined ? options.useTwitterAnalysis : false,
        // New enhanced options
        sentiment: options.sentiment || 'neutral',
        timeframe: options.timeframe || 'short'
      };
      
      console.log(`Generating ${threadOptions.threadTone} thread for ${symbol} with ${threadOptions.sentiment} sentiment and ${threadOptions.timeframe}-term timeframe...`);
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.log('Thread options:', threadOptions);
      }
      
      let cryptoData;
      
      // Determine whether to use the TokenAnalyzer service or regular CryptoData service
      if (threadOptions.useTwitterAnalysis) {
        if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
          console.log(`Analyzing token ${symbol} using Twitter data...`);
        }
        
        // Check if symbol starts with @, otherwise add it for Twitter handle
        const twitterHandle = symbol.startsWith('@') ? symbol : `@${symbol}`;
        
        // Use the TokenAnalyzer service to get data from Twitter
        const tokenData = await this.tokenAnalyzerService.analyzeToken(twitterHandle, {
          includeHistoricalData: true,
          includeSentiment: true
        });
        
        // If the token analysis was successful and found DEX data
        if (tokenData.success === true && !tokenData.message) {
          if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
            console.log(`Successfully analyzed token from Twitter: ${tokenData.tokenName}`);
          }
          
          // Format the token data to match the format expected by the prompt generator
          cryptoData = this.formatTokenAnalyzerData(tokenData, symbol);
        } else {
          if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
            console.log(`Could not find token data via Twitter, falling back to regular data service`);
          }
          
          // Fall back to regular crypto data service
          cryptoData = await this.cryptoDataService.getAllCryptoData(symbol);
        }
      } else {
        // Use the regular crypto data service
        if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
          console.log(`Fetching data for ${symbol}...`);
        }
        cryptoData = await this.cryptoDataService.getAllCryptoData(symbol);
      }
      
      // 2. Generate structured prompt with enhanced options
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.log(`Generating prompt for ${symbol} with sentiment: ${threadOptions.sentiment}, timeframe: ${threadOptions.timeframe}...`);
      }
      const prompt = this.promptGeneratorService.generatePrompt(
        cryptoData, 
        threadOptions
      );
      
      // Log the prompt for debugging
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.log('Generated prompt:', prompt);
      }
      
      try {
        // Run a simple test in development mode to ensure we can handle non-JSON responses
        if (process.env.TEST_NON_JSON_RESPONSE === 'true') {
          if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
            console.log('Running test for non-JSON response handling');
          }
          await this.testNonJsonResponseHandling();
        }
        
        // 3. Try to generate thread using AI (OpenRouter API) with enhanced options
        console.log(`Generating thread using AI model: ${config.aiModel}...`);
        return await this.callOpenRouterAPI(cryptoData, prompt, threadOptions, userId);
      } catch (aiError) {
        console.error('AI thread generation failed:', aiError);
        
        // 4. If AI generation fails, fall back to template-based generation with enhanced options
        console.log('Falling back to template-based thread generation...');
        return this.generateFallbackThread(cryptoData, threadOptions, userId);
      }
      
    } catch (error) {
      console.error('Error generating Web3 thread:', error);
      throw new Error(`Failed to generate Web3 thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format token analyzer data to match the format expected by the prompt generator
   * @private
   */
  private formatTokenAnalyzerData(tokenData: any, symbol: string): any {
    // Convert sentiment value to a string description
    const marketSentiment = tokenData.sentiment?.sentiment || 'neutral';
    
    // Calculate price levels based on historical data
    let priceLevel = 'unknown';
    if (tokenData.historicalData && tokenData.historicalData.length > 0) {
      const latestPrice = parseFloat(tokenData.priceUSD);
      const highestPrice = Math.max(...tokenData.historicalData.map((d: any) => parseFloat(d.high)));
      
      if (latestPrice >= highestPrice * 0.9) {
        priceLevel = 'near all-time high';
      } else if (latestPrice >= highestPrice * 0.7) {
        priceLevel = 'strong recovery';
      } else if (latestPrice >= highestPrice * 0.5) {
        priceLevel = 'mid recovery';
      } else if (latestPrice >= highestPrice * 0.3) {
        priceLevel = 'early recovery';
      } else {
        priceLevel = 'near lows';
      }
    }
    
    // Calculate buy/sell ratio
    const buys = tokenData.txns24h?.buys || 0;
    const sells = tokenData.txns24h?.sells || 0;
    const totalTxns = buys + sells;
    const buyRatio = totalTxns > 0 ? buys / totalTxns : 0.5;
    
    let marketTrend;
    if (buyRatio > 0.7) marketTrend = 'strong buying';
    else if (buyRatio > 0.6) marketTrend = 'moderate buying';
    else if (buyRatio > 0.4) marketTrend = 'balanced';
    else if (buyRatio > 0.3) marketTrend = 'moderate selling';
    else marketTrend = 'strong selling';
    
    // Format the data to match what the prompt generator expects
    return {
      name: tokenData.tokenName,
      symbol: tokenData.tokenSymbol,
      price: {
        current: tokenData.priceUSD,
        change24h: tokenData.priceChange?.h24 || 0,
        change7d: tokenData.priceChange?.d7 || 0,
        high24h: tokenData.historicalData?.[0]?.high || 0,
        low24h: tokenData.historicalData?.[0]?.low || 0,
        level: priceLevel
      },
      marketCap: tokenData.marketCap || 'unknown',
      volume: {
        h24: tokenData.volume24h || 0
      },
      analysis: {
        sentiment: marketSentiment,
        trend: marketTrend,
        buyPercentage: buyRatio * 100,
        volatility: this.calculateVolatility(tokenData)
      },
      launchInfo: {
        date: tokenData.pairCreatedAt,
        dex: tokenData.dexId,
        chain: tokenData.chain
      },
      news: [],
      proposals: [],
      twitterSentiment: tokenData.sentiment ? {
        overall: tokenData.sentiment.sentiment,
        positive: tokenData.sentiment.positiveWords,
        negative: tokenData.sentiment.negativeWords,
        score: tokenData.sentiment.score,
        confidence: tokenData.sentiment.confidence
      } : undefined,
      source: `DexScreener and Twitter analysis for ${symbol}`
    };
  }

  /**
   * Calculate volatility based on token data
   * @private
   */
  private calculateVolatility(tokenData: any): string {
    // If we have historical data, calculate volatility from it
    if (tokenData.historicalData && tokenData.historicalData.length > 0) {
      const priceChanges = [];
      
      // Calculate daily price changes in percentage
      for (let i = 1; i < tokenData.historicalData.length; i++) {
        const todayClose = parseFloat(tokenData.historicalData[i].close);
        const yesterdayClose = parseFloat(tokenData.historicalData[i-1].close);
        
        if (yesterdayClose > 0) {
          const percentChange = Math.abs((todayClose - yesterdayClose) / yesterdayClose * 100);
          priceChanges.push(percentChange);
        }
      }
      
      if (priceChanges.length > 0) {
        // Calculate average daily price change
        const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
        
        if (avgChange > 20) return 'extremely high';
        if (avgChange > 10) return 'very high';
        if (avgChange > 5) return 'high';
        if (avgChange > 2) return 'moderate';
        return 'low';
      }
    }
    
    // Fallback if no historical data: use 24h high/low
    if (tokenData.historicalData?.[0]) {
      const high = parseFloat(tokenData.historicalData[0].high);
      const low = parseFloat(tokenData.historicalData[0].low);
      
      if (high > 0 && low > 0) {
        const range = (high - low) / low * 100;
        
        if (range > 50) return 'extremely high';
        if (range > 30) return 'very high';
        if (range > 15) return 'high';
        if (range > 5) return 'moderate';
        return 'low';
      }
    }
    
    return 'unknown';
  }

  /**
   * Test function to verify non-JSON response handling
   * Only used in development
   */
  private async testNonJsonResponseHandling(): Promise<void> {
    try {
      console.log('Simulating a non-JSON API response...');
      
      // Create a mock Response with plain text instead of JSON
      const mockResponse = new Response(
        'This is a non-JSON response that would normally cause JSON.parse to fail', 
        { status: 200, statusText: 'OK' }
      );
      
      // Process the mock response with our handler
      const responseText = await mockResponse.text();
      console.log(`Mock response length: ${responseText.length}`);
      
      // Check if it would be detected as non-JSON
      const trimmed = responseText.trim();
      const isJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
                    (trimmed.startsWith('[') && trimmed.endsWith(']'));
      
      console.log(`Mock detected as JSON: ${isJson}`);
      console.log('Non-JSON response test successful');
    } catch (error) {
      console.error('Test for non-JSON handling failed:', error);
    }
  }

  /**
   * Call OpenRouter API to generate thread content
   * @private
   */
  private async callOpenRouterAPI(cryptoData: any, prompt: string, threadOptions: any, userId: string): Promise<any> {
    let modelToUse = config.aiModel;
    let retryCount = 0;
    let maxRetries = 1;
    let threadContent = '';
    
    while (retryCount <= maxRetries) {
      try {
        // Construct request body
        const requestBody = {
          model: modelToUse,
          messages: [
            { 
              role: 'system', 
              content: `You are an expert crypto ${threadOptions.threadTone} who creates viral Twitter threads with real-time data. You provide valuable insights and alpha on cryptocurrencies in an engaging way.`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        };
        
        console.log(`Making API request to OpenRouter with model: ${modelToUse}...`);
        
        // Make the API request with Accept header explicitly set to JSON
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Authorization': `Bearer ${config.openRouterApiKey}`,
            'HTTP-Referer': 'https://threadflowpro.app',
            'X-Title': 'ThreadFlow Pro'
          },
          body: JSON.stringify(requestBody),
        });

        // Simple response processing with focus on handling any format
        try {
          console.log(`Response status: ${response.status} ${response.statusText}`);
          
          // Log headers to check content type - using a TypeScript-compatible approach
          const contentType = response.headers.get('content-type');
          console.log('Response content-type:', contentType);
          
          // Check if content type is HTML - handle it early to avoid JSON parse errors
          if (contentType && (
              contentType.includes('text/html') || 
              contentType.includes('application/xhtml+xml'))) {
            console.error('Received HTML response instead of JSON');
            
            // Get the HTML content
            const htmlContent = await response.text();
            
            // Try to extract title or error message from HTML
            const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
            const errorMessage = titleMatch ? 
              `HTML Error: ${titleMatch[1]}` : 
              'Server returned HTML page instead of JSON';
            
            console.error('HTML response detected:', errorMessage);
            
            // If this is our first try, attempt with fallback model
            if (retryCount === 0) {
              console.log('HTML response detected, retrying with fallback model');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            }
            
            // If we already tried the fallback, throw with details
            throw new Error(`API returned HTML instead of JSON: ${errorMessage}`);
          }
          
          // Check if the response is OK
          if (!response.ok) {
            const errorText = await response.text();
            
            // Check if error response is HTML
            if (errorText.trim().startsWith('<!DOCTYPE') || 
                errorText.trim().startsWith('<html')) {
              console.error('Received HTML error response');
              
              // Try to extract title from HTML
              const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
              const errorMessage = titleMatch ? 
                `HTML Error: ${titleMatch[1]}` : 
                `API error ${response.status}: HTML response`;
                
              // If this is our first try, attempt with fallback model
              if (retryCount === 0) {
                console.log('HTML error response detected, retrying with fallback model');
                modelToUse = config.fallbackAiModel;
                retryCount++;
                continue;
              }
              
              throw new Error(errorMessage);
            }
            
            throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
          }
          
          // Get the raw response text to handle any possible format
          const responseText = await response.text();
          console.log(`Response length: ${responseText.length} chars`);
          
          // Log a preview in development mode
          if (config.isDevelopment) {
            console.log(`Response preview: ${responseText.substring(0, 200)}...`);
          }
          
          // Early check for HTML in successful responses
          if (responseText.trim().startsWith('<!DOCTYPE') || 
              responseText.trim().startsWith('<html') || 
              responseText.includes('<!DOCTYPE html>')) {
            console.error('Received HTML in successful response body');
            
            // Try to extract title from HTML
            const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
            const errorMessage = titleMatch ? 
              `HTML Error: ${titleMatch[1]}` : 
              'Server returned HTML page instead of JSON';
              
            // If this is our first try, attempt with fallback model
            if (retryCount === 0) {
              console.log('HTML in response body, retrying with fallback model');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            }
            
            throw new Error(errorMessage);
          }
          
          // If response is empty, throw error
          if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response from API');
          }
          
          // First try to parse as JSON, but handle gracefully if it's not
          try {
            // Check if it looks like JSON before attempting to parse
            const trimmed = responseText.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
              
              // Parse as JSON
              const data = JSON.parse(responseText);
              console.log('Successfully parsed response as JSON');
              
              // Try to extract content from various possible JSON structures
              if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                threadContent = data.choices[0].message.content;
                console.log('Found content in standard OpenAI format');
              } else if (data.text) {
                threadContent = data.text;
                console.log('Found content in data.text');
              } else if (data.content) {
                threadContent = data.content;
                console.log('Found content in data.content');
              } else if (typeof data.message === 'string') {
                threadContent = data.message;
                console.log('Found content in data.message');
              } else {
                // If we can't find content in expected places, use the raw JSON string
                console.warn('Could not find content in parsed JSON, using raw text');
                threadContent = responseText;
              }
            } else {
              // Not JSON, just use raw text as the thread content
              console.log('Response is not JSON, using raw text');
              threadContent = responseText;
            }
          } catch (jsonError) {
            // JSON parsing failed, log details and use the raw text
            console.error('JSON parsing failed, using raw text as content', jsonError);
            console.error('Raw text that failed to parse:', responseText.substring(0, 100));
            threadContent = responseText;
          }
          
          // Validate we have sufficient content
          if (!threadContent || threadContent.length < 50) {
            console.error('Thread content too short or empty:', threadContent);
            
            if (retryCount === 0) {
              console.log(`Retrying with fallback model: ${config.fallbackAiModel}`);
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error('Generated thread content too short');
            }
          }
          
          // Sanitize the content to ensure it doesn't contain invalid characters
          // This can help with JSON serialization issues later
          threadContent = threadContent.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');
          
          console.log(`Successfully generated thread content (${threadContent.length} chars)`);
          break; // Success! Exit the retry loop
          
        } catch (processingError) {
          console.error('Error processing API response:', processingError);
          
          if (retryCount === 0) {
            console.log(`Retrying with fallback model: ${config.fallbackAiModel}`);
            modelToUse = config.fallbackAiModel;
            retryCount++;
            continue;
          } else {
            throw new Error(`Failed to process API response: ${(processingError as Error).message || 'Unknown error'}`);
          }
        }
        
      } catch (error) {
        console.error(`Error with model ${modelToUse}:`, error);
        
        // Try fallback model on first attempt
        if (retryCount === 0) {
          console.log(`Retrying with fallback model: ${config.fallbackAiModel}`);
          modelToUse = config.fallbackAiModel;
          retryCount++;
        } else {
          throw error;
        }
      }
    }
    
    if (!threadContent) {
      throw new Error('Failed to generate thread content after all retries');
    }
    
    // Format the content into a structured thread
    const formattedThread = this.formatThreadContent(threadContent);
    
    // Process token data for better display
    const enhancedTokenData = this.enhanceTokenData(cryptoData.token);
    
    // Create the thread object with enhanced metadata
    return {
      userId: userId,
      topic: cryptoData.token?.name || cryptoData.token?.symbol || "cryptocurrency",
      tone: threadOptions.threadTone === 'expert' ? 'Web3 Expert' : `Web3 ${threadOptions.threadTone.charAt(0).toUpperCase() + threadOptions.threadTone.slice(1)}`,
      content: threadContent,
      metadata: {
        tokenData: enhancedTokenData,
        newsCount: cryptoData.news?.length || 0,
        proposalsCount: cryptoData.proposals?.length || 0,
        tweets: formattedThread,
        sentiment: this.analyzeTokenSentiment(cryptoData.token, cryptoData.news),
        sources: this.formatDataSources(cryptoData),
        generatedAt: new Date().toISOString(),
        options: threadOptions,
        isAIGenerated: true
      }
    };
  }

  /**
   * Generate a template-based fallback thread when AI generation fails
   * @private
   */
  private generateFallbackThread(cryptoData: any, threadOptions: any, userId: string): any {
    console.log('Creating template-based fallback thread');
    
    // Extract token data
    const token = cryptoData.token || {};
    const tokenName = token.name || 'this cryptocurrency';
    const tokenSymbol = token.symbol || 'CRYPTO';
    const price = token.price ? this.formatCurrency(token.price) : 'unknown price';
    const priceChange = token.priceChangePercentage24h ? 
      (token.priceChangePercentage24h > 0 ? `+${token.priceChangePercentage24h.toFixed(2)}%` : `${token.priceChangePercentage24h.toFixed(2)}%`) : 
      'unknown';
    
    // Create emojis based on price movement
    const emoji = token.priceChangePercentage24h > 0 ? '🚀' : (token.priceChangePercentage24h < 0 ? '📉' : '📊');
    
    // Create template tweets
    const tweets = [
      `1/10: ${emoji} THREAD: ${tokenName} ($${tokenSymbol}) is currently trading at ${price}, with a 24h change of ${priceChange}. Let's analyze what's happening! #${tokenSymbol} #Crypto`,
      `2/10: ${emoji} ${tokenName} has a market cap of ${token.marketCap ? this.formatLargeNumber(token.marketCap) : 'unknown'} and 24h trading volume of ${token.volume24h ? this.formatLargeNumber(token.volume24h) : 'unknown'}. ${token.priceChangePercentage24h > 0 ? 'Strong buying interest today!' : 'Watching for potential recovery.'}`,
      `3/10: ${emoji} KEY METRICS: 24h price range is ${token.low24h ? this.formatCurrency(token.low24h) : '?'} - ${token.high24h ? this.formatCurrency(token.high24h) : '?'}. All-time high: ${token.allTimeHigh ? this.formatCurrency(token.allTimeHigh) : '?'}. ${token.price && token.allTimeHigh ? `Currently ${((token.price - token.allTimeHigh) / token.allTimeHigh * 100).toFixed(2)}% from ATH.` : ''}`,
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
    
    // Format the content into a structured thread
    const formattedThread = this.formatThreadContent(threadContent);
    
    // Process token data for better display
    const enhancedTokenData = this.enhanceTokenData(cryptoData.token);
    
    // Create the thread object with enhanced metadata
    return {
      userId: userId,
      topic: tokenName,
      tone: threadOptions.threadTone === 'expert' ? 'Web3 Expert' : `Web3 ${threadOptions.threadTone.charAt(0).toUpperCase() + threadOptions.threadTone.slice(1)}`,
      content: threadContent,
      metadata: {
        tokenData: enhancedTokenData,
        newsCount: cryptoData.news?.length || 0,
        proposalsCount: cryptoData.proposals?.length || 0,
        tweets: formattedThread,
        sentiment: this.analyzeTokenSentiment(cryptoData.token, cryptoData.news),
        sources: this.formatDataSources(cryptoData),
        generatedAt: new Date().toISOString(),
        options: threadOptions,
        isFallback: true
      }
    };
  }

  /**
   * Format currency values nicely
   * @private
   */
  private formatCurrency(value: number): string {
    if (!value && value !== 0) return 'unknown';
    
    if (value < 0.01) {
      return `$${value.toFixed(8)}`;
    }
    
    if (value < 1) {
      return `$${value.toFixed(4)}`;
    }
    
    if (value < 1000) {
      return `$${value.toFixed(2)}`;
    }
    
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Format large numbers with K, M, B suffixes
   * @private
   */
  private formatLargeNumber(num: number): string {
    if (!num && num !== 0) return 'unknown';
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    
    return `$${num.toFixed(2)}`;
  }

  /**
   * Format raw thread content into structured tweets
   * @param content Raw thread content from AI
   * @returns Array of formatted tweets
   */
  private formatThreadContent(content: string): any[] {
    // Split the content by double newlines
    const tweets = content.split('\n\n').filter(tweet => tweet.trim() !== '');
    
    // Format each tweet
    return tweets.map((tweet, index) => {
      // Try to extract the tweet number (1/10, 2/10, etc.)
      const tweetNumberMatch = tweet.match(/^(\d+)\/10:?\s/);
      const tweetNumber = tweetNumberMatch ? parseInt(tweetNumberMatch[1]) : index + 1;
      
      // Clean up the tweet content
      let cleanContent = tweet;
      if (tweetNumberMatch) {
        cleanContent = tweet.replace(/^\d+\/10:?\s/, '');
      }
      
      // Count hashtags and mentions
      const hashtags = (cleanContent.match(/#[a-zA-Z0-9_]+/g) || []);
      const mentions = (cleanContent.match(/@[a-zA-Z0-9_]+/g) || []);
      
      // Categorize tweet by type
      let tweetType = 'info';
      if (tweetNumber === 1) tweetType = 'hook';
      if (tweetNumber === 10) tweetType = 'cta';
      if (cleanContent.toLowerCase().includes('price') || 
          cleanContent.toLowerCase().includes('$') ||
          cleanContent.match(/\d+%/)) {
        tweetType = 'price';
      } else if (cleanContent.toLowerCase().includes('news') ||
                cleanContent.toLowerCase().includes('announced')) {
        tweetType = 'news';
      } else if (cleanContent.toLowerCase().includes('proposal') ||
                cleanContent.toLowerCase().includes('governance') ||
                cleanContent.toLowerCase().includes('vote')) {
        tweetType = 'governance';
      } else if ((cleanContent.toLowerCase().includes('alpha') ||
                 cleanContent.toLowerCase().includes('tip') ||
                 cleanContent.toLowerCase().includes('advice')) &&
                 tweetNumber !== 10) {
        tweetType = 'alpha';
      }
      
      return {
        number: tweetNumber,
        content: cleanContent.trim(),
        characterCount: cleanContent.trim().length,
        hashtags: hashtags,
        mentions: mentions,
        type: tweetType
      };
    });
  }
  
  /**
   * Enhance token data with additional information
   * @param tokenData Raw token data
   * @returns Enhanced token data
   */
  private enhanceTokenData(tokenData: any): any {
    if (!tokenData) return null;
    
    // Calculate additional metrics
    const priceChange24hUSD = tokenData.price * (tokenData.priceChangePercentage24h / 100);
    const fromATHPercentage = ((tokenData.price - tokenData.allTimeHigh) / tokenData.allTimeHigh) * 100;
    
    return {
      ...tokenData,
      priceChange24hUSD,
      fromATHPercentage,
      priceLevel: this.calculatePriceLevel(tokenData.price, tokenData.allTimeHigh),
      volatility: this.calculateVolatility(tokenData)
    };
  }
  
  /**
   * Calculate the price level relative to ATH
   * @param currentPrice Current price
   * @param athPrice All-time high price
   * @returns Price level category
   */
  private calculatePriceLevel(currentPrice: number, athPrice: number): string {
    if (!currentPrice || !athPrice) return 'unknown';
    
    const percentFromATH = ((currentPrice - athPrice) / athPrice) * 100;
    
    if (percentFromATH >= -5) return 'all-time-high';
    if (percentFromATH >= -20) return 'near-high';
    if (percentFromATH >= -50) return 'mid-range';
    if (percentFromATH >= -80) return 'low-range';
    return 'bottom-range';
  }
  
  /**
   * Analyze sentiment from token and news data
   * @param tokenData Token price data
   * @param newsData News articles
   * @returns Sentiment analysis object
   */
  private analyzeTokenSentiment(tokenData: any, newsData: any[]): any {
    // Price-based sentiment
    let priceSentiment = 'neutral';
    if (tokenData.priceChangePercentage24h >= 10) priceSentiment = 'very-bullish';
    else if (tokenData.priceChangePercentage24h >= 5) priceSentiment = 'bullish';
    else if (tokenData.priceChangePercentage24h <= -10) priceSentiment = 'very-bearish';
    else if (tokenData.priceChangePercentage24h <= -5) priceSentiment = 'bearish';
    
    // News-based sentiment (simple keyword analysis)
    let newsPositiveCount = 0;
    let newsNegativeCount = 0;
    let newsNeutralCount = 0;
    
    const positiveKeywords = ['launch', 'partnership', 'growth', 'bullish', 'surge', 'gain', 'integration', 'adoption'];
    const negativeKeywords = ['crash', 'drop', 'fall', 'decline', 'bearish', 'risk', 'hack', 'scam', 'fraud', 'issue'];
    
    newsData.forEach(news => {
      let foundPositive = false;
      let foundNegative = false;
      
      positiveKeywords.forEach(keyword => {
        if (news.title.toLowerCase().includes(keyword)) foundPositive = true;
      });
      
      negativeKeywords.forEach(keyword => {
        if (news.title.toLowerCase().includes(keyword)) foundNegative = true;
      });
      
      if (foundPositive && !foundNegative) newsPositiveCount++;
      else if (foundNegative && !foundPositive) newsNegativeCount++;
      else newsNeutralCount++;
    });
    
    let newsSentiment = 'neutral';
    if (newsPositiveCount > newsNegativeCount * 2) newsSentiment = 'very-positive';
    else if (newsPositiveCount > newsNegativeCount) newsSentiment = 'positive';
    else if (newsNegativeCount > newsPositiveCount * 2) newsSentiment = 'very-negative';
    else if (newsNegativeCount > newsPositiveCount) newsSentiment = 'negative';
    
    // Overall sentiment (combining price and news)
    let overallSentiment = 'neutral';
    
    if ((priceSentiment === 'very-bullish' && newsSentiment !== 'very-negative') || 
        (newsSentiment === 'very-positive' && priceSentiment !== 'very-bearish')) {
      overallSentiment = 'very-bullish';
    } else if ((priceSentiment === 'very-bearish' && newsSentiment !== 'very-positive') || 
              (newsSentiment === 'very-negative' && priceSentiment !== 'very-bullish')) {
      overallSentiment = 'very-bearish';
    } else if (priceSentiment === 'bullish' || newsSentiment === 'positive') {
      overallSentiment = 'bullish';
    } else if (priceSentiment === 'bearish' || newsSentiment === 'negative') {
      overallSentiment = 'bearish';
    }
    
    return {
      price: priceSentiment,
      news: newsSentiment,
      overall: overallSentiment
    };
  }
  
  /**
   * Format data sources information
   * @param cryptoData All crypto data
   * @returns Formatted sources object
   */
  private formatDataSources(cryptoData: any): any {
    const sources = {
      price: {
        source: 'CoinGecko',
        available: !!cryptoData.token
      },
      news: {
        source: 'CryptoPanic',
        available: cryptoData.news && cryptoData.news.length > 0,
        count: cryptoData.news?.length || 0
      },
      governance: {
        source: 'Snapshot',
        available: cryptoData.proposals && cryptoData.proposals.length > 0,
        count: cryptoData.proposals?.length || 0
      }
    };
    
    return sources;
  }
} 