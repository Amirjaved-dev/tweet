import axios from 'axios';
import { request, gql } from 'graphql-request';

/**
 * Service for fetching cryptocurrency data from various APIs
 * - CoinGecko for price data
 * - CryptoPanic for news
 * - Snapshot for DAO proposals
 */
export class CryptoDataService {
  private readonly COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
  private readonly CRYPTOPANIC_API_URL = 'https://cryptopanic.com/api/v1';
  private readonly SNAPSHOT_API_URL = 'https://hub.snapshot.org/graphql';
  private readonly CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || ''; // Optional, can work without it with limits

  /**
   * Get cryptocurrency price data from CoinGecko
   * @param symbol Cryptocurrency symbol or name
   * @returns Price and market data
   */
  async getCoinPrice(symbol: string): Promise<any> {
    try {
      // Convert common symbols to IDs if needed
      const coinId = this.getCoingeckoId(symbol);
      
      // Fetch coin data from CoinGecko
      const response = await axios.get(`${this.COINGECKO_API_URL}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
        timeout: 5000, // 5 second timeout
      });

      // Extract the relevant price data
      return {
        name: response.data.name,
        symbol: response.data.symbol.toUpperCase(),
        price: response.data.market_data.current_price.usd,
        priceChangePercentage24h: response.data.market_data.price_change_percentage_24h,
        marketCap: response.data.market_data.market_cap.usd,
        volume24h: response.data.market_data.total_volume.usd,
        high24h: response.data.market_data.high_24h.usd,
        low24h: response.data.market_data.low_24h.usd,
        allTimeHigh: response.data.market_data.ath.usd,
        allTimeHighDate: response.data.market_data.ath_date.usd,
      };
    } catch (error) {
      console.error('Error fetching coin price:', error);
      // If the exact match fails, try the search endpoint to find the coin
      return this.searchCoinByKeyword(symbol);
    }
  }

  /**
   * Search for a coin by keyword if direct ID lookup fails
   * @param keyword Cryptocurrency name or symbol
   * @returns Price data or null if not found
   */
  private async searchCoinByKeyword(keyword: string): Promise<any> {
    try {
      const response = await axios.get(`${this.COINGECKO_API_URL}/search`, {
        params: { query: keyword },
        timeout: 5000,
      });

      if (response.data.coins && response.data.coins.length > 0) {
        // Get the top result
        const coinId = response.data.coins[0].id;
        
        // Fetch the full coin data
        const coinResponse = await axios.get(`${this.COINGECKO_API_URL}/coins/${coinId}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
          },
          timeout: 5000,
        });

        return {
          name: coinResponse.data.name,
          symbol: coinResponse.data.symbol.toUpperCase(),
          price: coinResponse.data.market_data.current_price.usd,
          priceChangePercentage24h: coinResponse.data.market_data.price_change_percentage_24h,
          marketCap: coinResponse.data.market_data.market_cap.usd,
          volume24h: coinResponse.data.market_data.total_volume.usd,
          high24h: coinResponse.data.market_data.high_24h.usd,
          low24h: coinResponse.data.market_data.low_24h.usd,
          allTimeHigh: coinResponse.data.market_data.ath.usd,
          allTimeHighDate: coinResponse.data.market_data.ath_date.usd,
        };
      }
      return null;
    } catch (error) {
      console.error('Error searching for coin:', error);
      return null;
    }
  }

  /**
   * Map common cryptocurrency symbols to CoinGecko IDs
   * @param symbol Cryptocurrency symbol or name
   * @returns CoinGecko ID
   */
  private getCoingeckoId(symbol: string): string {
    // Remove $ prefix if present
    const cleanSymbol = symbol.startsWith('$') ? symbol.substring(1).toLowerCase() : symbol.toLowerCase();
    
    // Map of common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'sol': 'solana',
      'doge': 'dogecoin',
      'arb': 'arbitrum',
      'shib': 'shiba-inu',
      'link': 'chainlink',
      'dot': 'polkadot',
      'avax': 'avalanche-2',
      'matic': 'matic-network',
      'ada': 'cardano',
      'xrp': 'ripple',
      'bnb': 'binancecoin',
      'arbitrum': 'arbitrum',
    };

    return symbolMap[cleanSymbol] || cleanSymbol;
  }

  /**
   * Get cryptocurrency news from CryptoPanic
   * @param symbol Cryptocurrency symbol or name
   * @returns Latest news articles
   */
  async getCryptoNews(symbol: string): Promise<any[]> {
    try {
      // Remove $ prefix if present
      const cleanSymbol = symbol.startsWith('$') ? symbol.substring(1).toLowerCase() : symbol.toLowerCase();
      
      const response = await axios.get(`${this.CRYPTOPANIC_API_URL}/posts/`, {
        params: {
          auth_token: this.CRYPTOPANIC_API_KEY,
          currencies: cleanSymbol,
          public: true,
          kind: 'news',
          limit: 5,
        },
        timeout: 5000,
      });

      if (response.data && response.data.results) {
        return response.data.results.map((item: any) => ({
          title: item.title,
          url: item.url,
          source: item.source.title,
          publishedAt: item.published_at,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      return [];
    }
  }

  /**
   * Get DAO proposals from Snapshot
   * @param daoName DAO name or ENS domain
   * @returns Latest proposals
   */
  async getDAOProposals(daoName: string): Promise<any[]> {
    try {
      // Get the space ENS or ID based on input
      const space = this.getSnapshotSpace(daoName);
      
      // GraphQL query to fetch recent proposals
      const query = gql`
        query GetProposals($space: String!) {
          proposals(
            first: 5,
            skip: 0,
            where: { space: $space },
            orderBy: "created",
            orderDirection: desc
          ) {
            id
            title
            body
            start
            end
            state
            space {
              id
              name
            }
            scores_total
          }
        }
      `;

      const variables = { space };
      
      const data = await request(this.SNAPSHOT_API_URL, query, variables);
      
      if (data && data.proposals) {
        return data.proposals.map((proposal: any) => ({
          id: proposal.id,
          title: proposal.title,
          body: proposal.body,
          state: proposal.state,
          start: proposal.start,
          end: proposal.end,
          totalVotes: proposal.scores_total,
          spaceName: proposal.space.name,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching DAO proposals:', error);
      return [];
    }
  }

  /**
   * Map common token names to Snapshot spaces
   * @param daoName DAO name or token
   * @returns Snapshot space ID
   */
  private getSnapshotSpace(daoName: string): string {
    // Remove $ prefix if present
    const cleanName = daoName.startsWith('$') ? daoName.substring(1).toLowerCase() : daoName.toLowerCase();
    
    // Map of common tokens to their Snapshot spaces
    const spaceMap: Record<string, string> = {
      'arb': 'arbitrum.eth',
      'arbitrum': 'arbitrum.eth',
      'eth': 'eth.eth',
      'ethereum': 'eth.eth',
      'aave': 'aave.eth',
      'ens': 'ens.eth',
      'uniswap': 'uniswap',
      'uni': 'uniswap',
      'compound': 'compound',
      'maker': 'makerdao.eth',
      'mkr': 'makerdao.eth',
      'sushi': 'sushigov.eth',
      'balancer': 'balancer.eth',
      'dydx': 'dydx.eth',
      'gitcoin': 'gitcoin.eth',
    };

    return spaceMap[cleanName] || cleanName;
  }

  /**
   * Get all data for a cryptocurrency in one function call
   * @param symbol Cryptocurrency symbol or name
   * @returns Combined data object with price, news, and proposals
   */
  async getAllCryptoData(symbol: string): Promise<any> {
    try {
      // Run all API calls in parallel
      const [priceData, newsData, proposalsData] = await Promise.all([
        this.getCoinPrice(symbol),
        this.getCryptoNews(symbol),
        this.getDAOProposals(symbol),
      ]);

      return {
        token: {
          ...priceData,
        },
        news: newsData,
        proposals: proposalsData,
      };
    } catch (error) {
      console.error('Error fetching all crypto data:', error);
      throw new Error(`Failed to fetch crypto data for ${symbol}`);
    }
  }

  /**
   * Get quick token price data for generation preview (faster, limited data)
   * @param symbol Cryptocurrency symbol
   * @returns Basic price data or null if not found
   */
  async getQuickTokenPrice(symbol: string): Promise<any> {
    try {
      // Convert symbol to CoinGecko ID
      const coinId = this.getCoingeckoId(symbol);
      
      // Use the simpler price endpoint for speed
      const response = await axios.get(`${this.COINGECKO_API_URL}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
          precision: 2
        },
        timeout: 3000, // Shorter timeout for faster response
      });
      
      if (response.data && response.data[coinId]) {
        return {
          symbol: symbol.toUpperCase(),
          price: response.data[coinId].usd,
          priceChangePercentage24h: response.data[coinId].usd_24h_change
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quick token price:', error);
      return null;
    }
  }
  
  /**
   * Get quick news count for generation preview (faster)
   * @param symbol Cryptocurrency symbol
   * @returns Number of recent news articles or null if not found
   */
  async getQuickNewsCount(symbol: string): Promise<number | null> {
    try {
      // Remove $ prefix if present
      const cleanSymbol = symbol.startsWith('$') ? symbol.substring(1).toLowerCase() : symbol.toLowerCase();
      
      // Use a smaller limit and fewer fields for speed
      const response = await axios.get(`${this.CRYPTOPANIC_API_URL}/posts/`, {
        params: {
          auth_token: this.CRYPTOPANIC_API_KEY,
          currencies: cleanSymbol,
          public: true,
          kind: 'news',
          limit: 3,
          fields: 'id,title' // Request minimal fields
        },
        timeout: 3000, // Shorter timeout for faster response
      });
      
      if (response.data && response.data.results) {
        return response.data.results.length;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quick news count:', error);
      return null;
    }
  }
} 