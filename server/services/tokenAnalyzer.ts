import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Service for analyzing token information from Twitter (X) posts
 * - Scrapes Twitter for latest tweets from a token account
 * - Extracts DEX links from tweets
 * - Fetches token data from DexScreener API
 */
export class TokenAnalyzerService {
  private readonly DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex/pairs';
  private readonly DEXSCREENER_CHART_API = 'https://api.dexscreener.com/latest/dex/chart';

  /**
   * Analyze a token based on Twitter handle or token name
   * @param tokenIdentifier Token name or Twitter handle (e.g., @pepenfttoken)
   * @param options Additional options for token analysis
   * @returns Token analysis data
   */
  async analyzeToken(tokenIdentifier: string, options: {
    includeHistoricalData?: boolean;
    historicalDays?: number;
    includeSentiment?: boolean;
  } = {}): Promise<any> {
    try {
      // Set default options
      const analysisOptions = {
        includeHistoricalData: options.includeHistoricalData !== undefined ? options.includeHistoricalData : false,
        historicalDays: options.historicalDays || 7,
        includeSentiment: options.includeSentiment !== undefined ? options.includeSentiment : false
      };

      // Clean the token identifier (remove @ if present)
      const cleanIdentifier = tokenIdentifier.startsWith('@') 
        ? tokenIdentifier.substring(1) 
        : tokenIdentifier;
      
      console.log(`Analyzing token from Twitter handle: ${cleanIdentifier}`);
      
      // 1. Fetch tweets from the token's Twitter account
      const tweets = await this.fetchTweetsFromAccount(cleanIdentifier);
      
      if (!tweets || tweets.length === 0) {
        return {
          success: false,
          message: "Could not fetch tweets from the specified account."
        };
      }
      
      console.log(`Found ${tweets.length} tweets from ${cleanIdentifier}`);
      
      // 2. Scan tweets for DEX links
      const dexPairInfo = await this.findDexPairFromTweets(tweets);
      
      if (!dexPairInfo) {
        return {
          success: true,
          tokenName: cleanIdentifier,
          message: "DEX pair not found in recent tweets. Token may be pre-launch."
        };
      }
      
      console.log(`Found DEX pair: ${dexPairInfo.chain}/${dexPairInfo.pairAddress}`);
      
      // 3. Fetch token data from DexScreener
      const tokenData = await this.fetchTokenData(dexPairInfo.chain, dexPairInfo.pairAddress);
      
      // 4. Optional: Add historical price data
      if (analysisOptions.includeHistoricalData) {
        const historicalData = await this.fetchHistoricalData(
          dexPairInfo.chain,
          dexPairInfo.pairAddress,
          analysisOptions.historicalDays
        );
        
        tokenData.historicalData = historicalData;
      }
      
      // 5. Optional: Add sentiment analysis from tweets
      if (analysisOptions.includeSentiment) {
        const sentiment = this.analyzeTweetSentiment(tweets);
        tokenData.sentiment = sentiment;
      }
      
      return {
        success: true,
        ...tokenData
      };
      
    } catch (error) {
      console.error('Error analyzing token:', error);
      return {
        success: false,
        message: `Failed to analyze token: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Fetch recent tweets from a Twitter account
   * @param handle Twitter handle without @ symbol
   * @returns Array of tweet objects with text and date
   * @private
   */
  private async fetchTweetsFromAccount(handle: string): Promise<any[]> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Navigate to the user's Twitter page
      await page.goto(`https://twitter.com/${handle}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for tweets to load
      await page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 });
      
      // Extract tweets
      const tweets = await page.evaluate(() => {
        const tweetElements = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
        return tweetElements.slice(0, 10).map(article => {
          // Get tweet text
          const tweetTextElement = article.querySelector('div[data-testid="tweetText"]');
          const tweetText = tweetTextElement ? tweetTextElement.textContent : '';
          
          // Get links from tweet
          const links: string[] = [];
          const anchorElements = article.querySelectorAll('a');
          anchorElements.forEach(anchor => {
            if (anchor.href && !anchor.href.includes('twitter.com')) {
              links.push(anchor.href);
            }
          });
          
          // Get tweet date
          const timeElement = article.querySelector('time');
          const tweetDate = timeElement ? timeElement.getAttribute('datetime') : '';
          
          return {
            text: tweetText,
            links,
            date: tweetDate
          };
        });
      });
      
      return tweets;
    } catch (error) {
      console.error('Error fetching tweets:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
  
  /**
   * Find DEX pair information from tweet links
   * @param tweets Array of tweet objects
   * @returns Object with chain and pairAddress if found
   * @private
   */
  private async findDexPairFromTweets(tweets: any[]): Promise<{ chain: string, pairAddress: string } | null> {
    // Supported DEX URLs to look for
    const dexPatterns = [
      { regex: /dexscreener\.com\/([^\/]+)\/([^\/]+)/i, dex: 'dexscreener' },
      { regex: /pancakeswap\.finance\/.*[\?&]inputCurrency=([^&]+)/i, dex: 'pancakeswap' },
      { regex: /pancakeswap\.finance\/.*[\?&]outputCurrency=([^&]+)/i, dex: 'pancakeswap' },
      { regex: /uniswap\.org\/.*[\?&]inputCurrency=([^&]+)/i, dex: 'uniswap' },
      { regex: /uniswap\.org\/.*[\?&]outputCurrency=([^&]+)/i, dex: 'uniswap' },
      { regex: /birdeye\.so\/.*[\?&]token=([^&]+)/i, dex: 'birdeye' }
    ];
    
    // Check all tweets for DEX links
    for (const tweet of tweets) {
      // Process links in tweet
      if (tweet.links && tweet.links.length > 0) {
        for (const link of tweet.links) {
          // Check if link matches any DEX pattern
          for (const pattern of dexPatterns) {
            const match = link.match(pattern.regex);
            
            if (match) {
              // Handle different DEX URL patterns
              switch (pattern.dex) {
                case 'dexscreener':
                  return {
                    chain: match[1],
                    pairAddress: match[2]
                  };
                  
                case 'pancakeswap':
                case 'uniswap':
                  // For these DEXes, we need to make an additional call to find the pair
                  const tokenAddress = match[1];
                  // Assume BSC for Pancakeswap and ETH for Uniswap
                  const chain = pattern.dex === 'pancakeswap' ? 'bsc' : 'ethereum';
                  return await this.findPairAddressFromToken(chain, tokenAddress);
                  
                case 'birdeye':
                  // Assume Solana for Birdeye
                  return {
                    chain: 'solana',
                    pairAddress: match[1]
                  };
              }
            }
          }
        }
      }
      
      // If no links are found, check the tweet text for common patterns
      if (tweet.text) {
        // Look for contract addresses in the tweet text
        const contractMatch = tweet.text.match(/0x[a-fA-F0-9]{40}/);
        if (contractMatch) {
          // If a contract address is found, try to look it up on common chains
          const tokenAddress = contractMatch[0];
          const commonChains = ['ethereum', 'bsc', 'arbitrum'];
          
          for (const chain of commonChains) {
            const pairInfo = await this.findPairAddressFromToken(chain, tokenAddress);
            if (pairInfo) {
              return pairInfo;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Find pair address from token address
   * @param chain Blockchain chain
   * @param tokenAddress Token contract address
   * @returns Object with chain and pairAddress if found
   * @private
   */
  private async findPairAddressFromToken(chain: string, tokenAddress: string): Promise<{ chain: string, pairAddress: string } | null> {
    try {
      // Search for token on DexScreener
      const response = await axios.get(`${this.DEXSCREENER_API_URL}/${chain}/${tokenAddress}`);
      
      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        // Return the first pair found
        return {
          chain: response.data.pairs[0].chainId,
          pairAddress: response.data.pairs[0].pairAddress
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding pair address for ${chain}/${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch token data from DexScreener API
   * @param chain Blockchain chain
   * @param pairAddress Pair contract address
   * @returns Formatted token data
   * @private
   */
  private async fetchTokenData(chain: string, pairAddress: string): Promise<any> {
    try {
      const response = await axios.get(`${this.DEXSCREENER_API_URL}/${chain}/${pairAddress}`);
      
      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        throw new Error('No data returned from DexScreener API');
      }
      
      const pairData = response.data.pairs[0];
      
      // Format the token data
      return {
        tokenName: pairData.baseToken.name,
        tokenSymbol: pairData.baseToken.symbol,
        priceUSD: pairData.priceUsd,
        marketCap: pairData.fdv,
        liquidity: pairData.liquidity?.usd,
        volume24h: pairData.volume?.h24,
        pairCreatedAt: pairData.pairCreatedAt,
        chain: pairData.chainId,
        dexId: pairData.dexId,
        url: `https://dexscreener.com/${chain}/${pairAddress}`
      };
    } catch (error) {
      console.error(`Error fetching token data for ${chain}/${pairAddress}:`, error);
      throw new Error(`Failed to fetch token data from DexScreener: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 