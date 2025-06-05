import express from 'express';
import { requireAuth } from '../middleware/auth';
import { xIntegrationService } from '../services/xIntegrationService';

const router = express.Router();

// Multiple API sources for token validation
const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest';
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Popular token categories for better organization
const TOKEN_CATEGORIES = {
  'major': ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC', 'UNI'],
  'defi': ['AAVE', 'COMP', 'MKR', 'YFI', 'SUSHI', 'CRV', '1INCH', 'SNX', 'BAL', 'LDO'],
  'meme': ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'WOJAK', 'MEME', 'ELON', 'KISHU'],
  'gaming': ['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'IMX', 'ALICE', 'TLM', 'SLP', 'YGG'],
  'layer2': ['OP', 'ARB', 'MATIC', 'LRC', 'METIS', 'BOBA', 'ZK', 'STRK', 'IMX', 'DYDX'],
  'ai': ['FET', 'AGIX', 'OCEAN', 'RLC', 'AI', 'TAO', 'RNDR', 'GRT', 'NMR', 'CTXC']
};

// Chain configurations for contract validation
const SUPPORTED_CHAINS = {
  'ethereum': {
    id: 1,
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io'
  },
  'bsc': {
    id: 56,
    name: 'BNB Smart Chain', 
    rpc: 'https://bsc.llamarpc.com',
    explorer: 'https://bscscan.com'
  },
  'polygon': {
    id: 137,
    name: 'Polygon',
    rpc: 'https://polygon.llamarpc.com',
    explorer: 'https://polygonscan.com'
  },
  'arbitrum': {
    id: 42161,
    name: 'Arbitrum One',
    rpc: 'https://arbitrum.llamarpc.com',
    explorer: 'https://arbiscan.io'
  },
  'optimism': {
    id: 10,
    name: 'Optimism',
    rpc: 'https://optimism.llamarpc.com',
    explorer: 'https://optimistic.etherscan.io'
  },
  'avalanche': {
    id: 43114,
    name: 'Avalanche C-Chain',
    rpc: 'https://avalanche.llamarpc.com',
    explorer: 'https://snowtrace.io'
  },
  'solana': {
    id: 'solana',
    name: 'Solana',
    rpc: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://solscan.io'
  }
};

// Cache for token validation and data
const tokenCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 minutes

// Popular tokens that should prioritize CoinGecko
const COINGECKO_PRIORITY_TOKENS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC', 'UNI',
  'LINK', 'LTC', 'BCH', 'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'ETC', 'HBAR',
  'AAVE', 'COMP', 'MKR', 'YFI', 'SUSHI', 'CRV', '1INCH', 'SNX', 'BAL', 'LDO',
  'AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'IMX', 'ALICE', 'TLM',
  'OP', 'ARB', 'LRC', 'METIS', 'BOBA', 'ZK', 'STRK', 'DYDX',
  'FET', 'AGIX', 'OCEAN', 'RLC', 'AI', 'TAO', 'RNDR', 'GRT', 'NMR'
];

// Meme coins that should prioritize DEXScreener for real-time data
const MEME_TOKENS = [
  'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'WOJAK', 'MEME', 'ELON', 'KISHU',
  'DOGELON', 'BABYDOGE', 'SAFEMOON', 'AKITA', 'SAITAMA', 'HOGE', 'PIT', 'LEASH',
  'BONE', 'RYOSHI', 'JACY', 'LUFFY', 'GOKU', 'KUMA', 'POODL', 'CORGI', 'HOKK',
  'ASS', 'PUSSY', 'CUM', 'MOON', 'SAFE', 'DIAMOND', 'ROCKET'
];

// Helper function to validate contract address format
function isValidContractAddress(address: string, chain: string): boolean {
  if (chain === 'solana') {
    // Solana addresses are base58 encoded, typically 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } else {
    // EVM chains use hex addresses starting with 0x
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

// Validate and fetch token data from contract address
async function validateTokenContract(address: string, chain: string): Promise<any> {
  const cacheKey = `contract_${chain}_${address}`;
  const cached = tokenCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    console.log(`🔍 Validating contract ${address} on ${chain}...`);
    
    // First try DEXScreener for comprehensive DeFi data
    let tokenData = await fetchTokenFromDEXScreener(address, chain);
    
    if (!tokenData) {
      // Fallback to CoinGecko if available
      tokenData = await fetchTokenFromCoinGecko(address, chain);
    }
    
    if (!tokenData) {
      // Create basic token data structure
      tokenData = {
        address,
        chain,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        verified: false,
        source: 'Contract Only'
      };
    }
    
    // Cache the result
    tokenCache.set(cacheKey, { data: tokenData, timestamp: Date.now() });
    
    return tokenData;
  } catch (error) {
    console.error(`Error validating contract ${address}:`, error);
    throw new Error(`Failed to validate contract: ${error.message}`);
  }
}

// Fetch token data from DEXScreener
async function fetchTokenFromDEXScreener(address: string, chain: string): Promise<any> {
  try {
    const response = await fetch(`${DEXSCREENER_API_BASE}/dex/tokens/${address}`, {
      headers: {
        'User-Agent': 'ThreadFlowPro/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }
    
    // Get the best pair (highest liquidity/volume)
    const bestPair = data.pairs.reduce((best: any, current: any) => {
      const currentLiquidity = parseFloat(current.liquidity?.usd || '0');
      const bestLiquidity = parseFloat(best?.liquidity?.usd || '0');
      return currentLiquidity > bestLiquidity ? current : best;
    });
    
    const baseToken = bestPair.baseToken;
    const price = parseFloat(bestPair.priceUsd || '0');
    const volume24h = parseFloat(bestPair.volume?.h24 || '0');
    const liquidity = parseFloat(bestPair.liquidity?.usd || '0');
    
    return {
      address: baseToken.address,
      chain: chain,
      symbol: baseToken.symbol,
      name: baseToken.name,
      decimals: parseInt(baseToken.decimals || '18'),
      price: price,
      volume24h: volume24h,
      liquidity: liquidity,
      dexData: {
        dexName: bestPair.dexId,
        pairAddress: bestPair.pairAddress,
        chainId: bestPair.chainId
      },
      verified: true,
      source: 'DEXScreener'
    };
  } catch (error) {
    console.error(`DEXScreener error for ${address}:`, error);
    return null;
  }
}

// Fetch token data from CoinGecko
async function fetchTokenFromCoinGecko(address: string, chain: string): Promise<any> {
  try {
    // CoinGecko chain ID mapping
    const chainMapping = {
      'ethereum': 'ethereum',
      'bsc': 'binance-smart-chain',
      'polygon': 'polygon-pos',
      'arbitrum': 'arbitrum-one',
      'optimism': 'optimistic-ethereum',
      'avalanche': 'avalanche'
    };
    
    const chainId = chainMapping[chain];
    if (!chainId) {
      return null;
    }
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${chainId}/contract/${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ThreadFlowPro/1.0'
        }
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      address: address,
      chain: chain,
      symbol: data.symbol?.toUpperCase() || 'UNKNOWN',
      name: data.name || 'Unknown Token',
      decimals: data.detail_platforms?.[chainId]?.decimal_place || 18,
      price: data.market_data?.current_price?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      coingeckoData: {
        id: data.id,
        rank: data.market_cap_rank,
        description: data.description?.en?.substring(0, 200) + '...' || ''
      },
      verified: true,
      source: 'CoinGecko'
    };
  } catch (error) {
    console.error(`CoinGecko error for ${address}:`, error);
    return null;
  }
}

// Helper function to search CoinGecko for tokens
async function searchCoinGeckoTokens(query: string, limit = 10): Promise<any[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ThreadFlowPro/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`CoinGecko search API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.coins || data.coins.length === 0) {
      return [];
    }
    
    // Process and format CoinGecko results
    const results = data.coins.slice(0, limit).map((coin: any) => ({
      symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
      name: coin.name || 'Unknown Token',
      id: coin.id,
      thumb: coin.thumb,
      market_cap_rank: coin.market_cap_rank,
      category: 'coingecko',
      source: 'CoinGecko',
      verified: true,
      priority: COINGECKO_PRIORITY_TOKENS.includes(coin.symbol?.toUpperCase()) ? 1 : 2
    }));
    
    return results.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error(`CoinGecko search error:`, error);
    return [];
  }
}

// Enhanced token data fetching with intelligent source selection
async function getEnhancedTokenData(symbol: string): Promise<any> {
  const cacheKey = `enhanced_${symbol.toLowerCase()}`;
  const cached = tokenCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    console.log(`🔍 Getting enhanced data for ${symbol}...`);
    
    let tokenData = null;
    const upperSymbol = symbol.toUpperCase();
    
    // Check if it's a meme coin - use DEXScreener first for real-time meme data
    if (MEME_TOKENS.includes(upperSymbol)) {
      console.log(`🐸 ${symbol} is a meme token, prioritizing DEXScreener for real-time data...`);
      
      // Try DEXScreener first for meme coins
      tokenData = await searchDEXScreenerBySymbol(symbol);
      
      // Fallback to CoinGecko if DEXScreener fails
      if (!tokenData) {
        console.log(`📊 DEXScreener failed for meme token ${symbol}, trying CoinGecko fallback...`);
        tokenData = await fetchTokenFromCoinGeckoBySymbol(symbol);
      }
    } else {
      // For all other tokens, prioritize CoinGecko for data quality
      console.log(`📊 ${symbol} is a regular token, prioritizing CoinGecko for data quality...`);
      
      // Try CoinGecko first for established tokens
      tokenData = await fetchTokenFromCoinGeckoBySymbol(symbol);
      
      // Fallback to DEXScreener if CoinGecko fails
      if (!tokenData) {
        console.log(`🔍 CoinGecko failed for ${symbol}, trying DEXScreener fallback...`);
        tokenData = await searchDEXScreenerBySymbol(symbol);
      }
    }
    
    if (!tokenData) {
      tokenData = {
        symbol: symbol.toUpperCase(),
        name: `${symbol.toUpperCase()} Token`,
        verified: false,
        source: 'Not Found'
      };
    }
    
    // Cache the result
    tokenCache.set(cacheKey, { data: tokenData, timestamp: Date.now() });
    
    return tokenData;
  } catch (error) {
    console.error(`Error getting enhanced token data for ${symbol}:`, error);
    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Token`,
      verified: false,
      source: 'Error',
      error: error.message
    };
  }
}

// Search DEXScreener by symbol (not contract)
async function searchDEXScreenerBySymbol(symbol: string): Promise<any> {
  try {
    const response = await fetch(`${DEXSCREENER_API_BASE}/dex/search/?q=${symbol}`, {
      headers: {
        'User-Agent': 'ThreadFlowPro/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DEXScreener search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }
    
    // Find the best match - prioritize exact symbol match and highest liquidity
    const exactMatches = data.pairs.filter((pair: any) => 
      pair.baseToken?.symbol?.toLowerCase() === symbol.toLowerCase()
    );
    
    const bestPair = (exactMatches.length > 0 ? exactMatches : data.pairs)
      .reduce((best: any, current: any) => {
        const currentLiquidity = parseFloat(current.liquidity?.usd || '0');
        const bestLiquidity = parseFloat(best?.liquidity?.usd || '0');
        return currentLiquidity > bestLiquidity ? current : best;
      });
    
    if (!bestPair || !bestPair.baseToken) {
      return null;
    }
    
    const baseToken = bestPair.baseToken;
    const price = parseFloat(bestPair.priceUsd || '0');
    const volume24h = parseFloat(bestPair.volume?.h24 || '0');
    const liquidity = parseFloat(bestPair.liquidity?.usd || '0');
    
    return {
      symbol: baseToken.symbol,
      name: baseToken.name,
      address: baseToken.address,
      price: price,
      volume24h: volume24h,
      liquidity: liquidity,
      chainId: bestPair.chainId,
      dexData: {
        dexName: bestPair.dexId,
        pairAddress: bestPair.pairAddress,
        chainId: bestPair.chainId
      },
      verified: true,
      source: 'DEXScreener'
    };
  } catch (error) {
    console.error(`DEXScreener symbol search error for ${symbol}:`, error);
    return null;
  }
}

// Fetch token from CoinGecko by symbol
async function fetchTokenFromCoinGeckoBySymbol(symbol: string): Promise<any> {
  try {
    // First search for the token
    const searchResults = await searchCoinGeckoTokens(symbol, 5);
    
    if (searchResults.length === 0) {
      return null;
    }
    
    // Find exact symbol match or take the first result
    const exactMatch = searchResults.find(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase()
    );
    const tokenInfo = exactMatch || searchResults[0];
    
    // Get detailed token data
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${tokenInfo.id}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ThreadFlowPro/1.0'
        }
      }
    );
    
    if (!response.ok) {
      return tokenInfo; // Return basic info if detailed call fails
    }
    
    const data = await response.json();
    
    return {
      symbol: data.symbol?.toUpperCase() || tokenInfo.symbol,
      name: data.name || tokenInfo.name,
      id: data.id,
      price: data.market_data?.current_price?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      change24h: data.market_data?.price_change_percentage_24h || 0,
      rank: data.market_cap_rank || tokenInfo.market_cap_rank,
      image: data.image?.large || tokenInfo.thumb,
      coingeckoData: {
        id: data.id,
        rank: data.market_cap_rank,
        description: data.description?.en?.substring(0, 200) + '...' || ''
      },
      verified: true,
      source: 'CoinGecko'
    };
  } catch (error) {
    console.error(`CoinGecko symbol search error for ${symbol}:`, error);
    return null;
  }
}

// GET /api/tokens/categories - Get organized token categories (public)
router.get('/categories', async (req, res) => {
  try {
    console.log('📋 Fetching organized token categories...');
    
    const categories = Object.keys(TOKEN_CATEGORIES).map(category => ({
      name: category,
      displayName: category.charAt(0).toUpperCase() + category.slice(1),
      tokens: TOKEN_CATEGORIES[category],
      count: TOKEN_CATEGORIES[category].length
    }));
    
    res.json({
      success: true,
      categories,
      total: Object.values(TOKEN_CATEGORIES).flat().length,
      supported_chains: Object.keys(SUPPORTED_CHAINS)
    });
  } catch (error) {
    console.error('Error fetching token categories:', error);
    res.status(500).json({ error: 'Failed to fetch token categories' });
  }
});

// GET /api/tokens/search?q=bitcoin - Search tokens across categories (public)
router.get('/search', async (req, res) => {
  try {
    const { q, category, limit = 20, source = 'all' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log(`🔍 Searching tokens for: ${q} - showing ALL sources`);
    
    const query = q.toLowerCase();
    let allResults = [];
    
    // Search in predefined categories
    const categoriesToSearch = category ? [category] : Object.keys(TOKEN_CATEGORIES);
    
    for (const cat of categoriesToSearch) {
      const tokens = TOKEN_CATEGORIES[cat] || [];
      const matches = tokens.filter(token => 
        token.toLowerCase().includes(query)
      ).map(token => ({
        symbol: token,
        category: cat,
        type: 'predefined',
        source: 'Built-in Categories',
        priority: 1,
        isMeme: MEME_TOKENS.includes(token)
      }));
      allResults.push(...matches);
    }
    
    // Add CoinGecko search results
    if (source === 'all' || source === 'coingecko') {
      try {
        console.log(`📊 Searching CoinGecko for: ${q}`);
        const coinGeckoResults = await searchCoinGeckoTokens(q, 15);
        const formattedCGResults = coinGeckoResults.map(token => ({
          symbol: token.symbol,
          name: token.name,
          category: MEME_TOKENS.includes(token.symbol) ? 'meme' : 'market',
          type: 'coingecko',
          rank: token.market_cap_rank,
          source: 'CoinGecko',
          verified: true,
          priority: 2,
          image: token.thumb,
          isMeme: MEME_TOKENS.includes(token.symbol),
          id: token.id
        }));
        allResults.push(...formattedCGResults);
        console.log(`✅ Found ${formattedCGResults.length} CoinGecko results`);
      } catch (error) {
        console.log('⚠️ CoinGecko search failed:', error.message);
      }
    }
    
    // Add DEXScreener search results
    if (source === 'all' || source === 'dexscreener') {
      try {
        console.log(`🔍 Searching DEXScreener for: ${q}`);
        const dexResults = await searchDEXScreenerForAll(q);
        const formattedDexResults = dexResults.map((token, index) => ({
          symbol: token.symbol,
          name: token.name,
          category: MEME_TOKENS.includes(token.symbol) ? 'meme' : 'defi',
          type: 'dexscreener',
          source: 'DEXScreener',
          verified: true,
          priority: 3,
          isMeme: MEME_TOKENS.includes(token.symbol),
          address: token.address,
          chain: token.chain,
          dexInfo: token.dexInfo,
          liquidity: token.liquidity
        }));
        allResults.push(...formattedDexResults);
        console.log(`✅ Found ${formattedDexResults.length} DEXScreener results`);
      } catch (error) {
        console.log('⚠️ DEXScreener search failed:', error.message);
      }
    }
    
    // Sort by priority and relevance, but keep ALL results
    allResults.sort((a, b) => {
      // Exact symbol match gets priority
      const aExact = a.symbol.toLowerCase() === query;
      const bExact = b.symbol.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      
      // Then by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by rank if available
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      }
      
      return 0;
    });
    
    // Get enhanced data for results
    const enhancedResults = await Promise.all(
      allResults.slice(0, parseInt(limit as string)).map(async (result, index) => {
        try {
          let enhancedData = null;
          
          // For predefined tokens, get enhanced data
          if (result.type === 'predefined') {
            enhancedData = await getEnhancedTokenData(result.symbol);
          }
          
          return {
            ...result,
            name: enhancedData?.name || result.name || result.symbol,
            price: enhancedData?.price || result.price || 'N/A',
            change24h: enhancedData?.change24h || result.change24h || 'N/A',
            marketCap: enhancedData?.marketCap || result.marketCap || (result.rank ? `Rank #${result.rank}` : 'N/A'),
            sourceDetails: {
              platform: result.source,
              type: result.type,
              verified: result.verified,
              ...(result.address && { contractAddress: result.address }),
              ...(result.chain && { blockchain: result.chain }),
              ...(result.dexInfo && { dexInfo: result.dexInfo }),
              ...(result.liquidity && { liquidity: result.liquidity }),
              ...(result.id && { coinGeckoId: result.id })
            }
          };
        } catch (error) {
          console.error(`Error enhancing ${result.symbol}:`, error);
          return {
            ...result,
            price: 'N/A',
            change24h: 'N/A',
            marketCap: result.rank ? `Rank #${result.rank}` : 'N/A',
            sourceDetails: {
              platform: result.source,
              type: result.type,
              verified: result.verified || false
            }
          };
        }
      })
    );
    
    res.json({
      success: true,
      query: q,
      results: enhancedResults,
      total: allResults.length,
      limit: parseInt(limit as string),
      sources: {
        predefined: allResults.filter(r => r.type === 'predefined').length,
        coingecko: allResults.filter(r => r.type === 'coingecko').length,
        dexscreener: allResults.filter(r => r.type === 'dexscreener').length,
        showingAll: true
      }
    });
  } catch (error) {
    console.error('Error searching tokens:', error);
    res.status(500).json({ error: 'Failed to search tokens' });
  }
});

// Search DEXScreener for all matching tokens
async function searchDEXScreenerForAll(query: string): Promise<any[]> {
  try {
    const response = await fetch(`${DEXSCREENER_API_BASE}/dex/search/?q=${query}`, {
      headers: {
        'User-Agent': 'ThreadFlowPro/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DEXScreener search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }
    
    // Group by symbol and get the best pair for each
    const tokenMap = new Map();
    
    data.pairs.forEach((pair: any) => {
      if (!pair.baseToken?.symbol) return;
      
      const symbol = pair.baseToken.symbol.toUpperCase();
      const liquidity = parseFloat(pair.liquidity?.usd || '0');
      
      if (!tokenMap.has(symbol) || tokenMap.get(symbol).liquidity < liquidity) {
        tokenMap.set(symbol, {
          symbol: symbol,
          name: pair.baseToken.name || symbol,
          address: pair.baseToken.address,
          chain: pair.chainId,
          price: parseFloat(pair.priceUsd || '0'),
          volume24h: parseFloat(pair.volume?.h24 || '0'),
          liquidity: liquidity,
          dexInfo: {
            dexName: pair.dexId,
            pairAddress: pair.pairAddress,
            chainId: pair.chainId
          }
        });
      }
    });
    
    return Array.from(tokenMap.values()).slice(0, 10);
  } catch (error) {
    console.error(`DEXScreener search error:`, error);
    return [];
  }
}

// POST /api/tokens/validate-contract - Validate contract address (requires auth)
router.post('/validate-contract', requireAuth, async (req, res) => {
  try {
    const { address, chain } = req.body;
    
    if (!address || !chain) {
      return res.status(400).json({ error: 'Contract address and chain are required' });
    }
    
    console.log(`🔍 Validating contract ${address} on ${chain}...`);
    
    // Validate address format
    if (!isValidContractAddress(address, chain)) {
      return res.status(400).json({ 
        error: 'Invalid contract address format',
        address,
        chain,
        expected: chain === 'solana' ? 'Base58 address (32-44 chars)' : 'Hex address (0x + 40 chars)'
      });
    }
    
    // Validate chain is supported
    if (!SUPPORTED_CHAINS[chain]) {
      return res.status(400).json({ 
        error: 'Unsupported chain',
        supported: Object.keys(SUPPORTED_CHAINS)
      });
    }
    
    try {
      const tokenData = await validateTokenContract(address, chain);
      
      res.json({
        success: true,
        valid: true,
        token: tokenData,
        chain: SUPPORTED_CHAINS[chain],
        timestamp: new Date().toISOString()
      });
    } catch (validationError) {
      res.status(400).json({
        success: false,
        valid: false,
        error: validationError.message,
        address,
        chain
      });
    }
  } catch (error) {
    console.error('Error validating contract:', error);
    res.status(500).json({ error: 'Failed to validate contract' });
  }
});

// GET /api/tokens/supported-chains - Get supported blockchain networks (public)
router.get('/supported-chains', async (req, res) => {
  try {
    const chains = Object.entries(SUPPORTED_CHAINS).map(([key, config]) => ({
      id: key,
      ...config,
      contractFormat: key === 'solana' ? 'Base58 (32-44 chars)' : 'Hex (0x + 40 chars)',
      example: key === 'solana' 
        ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        : '0xA0b86a33E6441cF4d8F4a81c15e3D2E8a0E6E1E6'
    }));
    
    res.json({
      success: true,
      chains,
      total: chains.length
    });
  } catch (error) {
    console.error('Error fetching supported chains:', error);
    res.status(500).json({ error: 'Failed to fetch supported chains' });
  }
});

// GET /api/tokens/symbol/:symbol - Get token data by symbol with smart source selection
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { source = 'auto' } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Token symbol is required' });
    }
    
    console.log(`🔍 Getting token data for ${symbol} with source preference: ${source}`);
    
    let tokenData = null;
    
    if (source === 'auto') {
      // Use intelligent source selection
      tokenData = await getEnhancedTokenData(symbol);
    } else if (source === 'coingecko') {
      // Force CoinGecko
      tokenData = await fetchTokenFromCoinGeckoBySymbol(symbol);
    } else if (source === 'dexscreener') {
      // Force DEXScreener
      tokenData = await searchDEXScreenerBySymbol(symbol);
    } else {
      // Default to auto
      tokenData = await getEnhancedTokenData(symbol);
    }
    
    if (!tokenData) {
      return res.status(404).json({ 
        error: 'Token not found',
        symbol: symbol.toUpperCase(),
        searchedWith: source 
      });
    }
    
    // Format response
    const formattedData = {
      symbol: tokenData.symbol || symbol.toUpperCase(),
      name: tokenData.name || `${symbol.toUpperCase()} Token`,
      price: tokenData.price ? `$${tokenData.price.toLocaleString()}` : 'N/A',
      change24h: tokenData.change24h ? `${tokenData.change24h > 0 ? '+' : ''}${tokenData.change24h.toFixed(2)}%` : 'N/A',
      marketCap: tokenData.marketCap ? `$${(tokenData.marketCap / 1e6).toFixed(0)}M` : 'N/A',
      volume24h: tokenData.volume24h ? `$${(tokenData.volume24h / 1e6).toFixed(0)}M` : 'N/A',
      rank: tokenData.rank || null,
      image: tokenData.image || tokenData.thumb || null,
      verified: tokenData.verified || false,
      source: tokenData.source || 'Unknown',
      sourceData: {
        coingecko: tokenData.coingeckoData || null,
        dex: tokenData.dexData || null
      }
    };
    
    res.json({
      success: true,
      token: formattedData,
      searchedWith: source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching token by symbol:', error);
    res.status(500).json({ error: 'Failed to fetch token data' });
  }
});

// GET /api/tokens/enhanced-data/:address - Get enhanced token data with X integration (requires auth)
router.get('/enhanced-data/:address', requireAuth, async (req, res) => {
  try {
    const { address } = req.params;
    const { chain = 'ethereum' } = req.query;
    
    console.log(`🚀 Fetching enhanced data for ${address} on ${chain}...`);
    
    // Get token validation data
    const tokenData = await validateTokenContract(address, chain as string);
    
    // Get X social data if we have a symbol
    let xData = null;
    if (tokenData.symbol && tokenData.symbol !== 'UNKNOWN') {
      try {
        xData = await xIntegrationService.getXData(tokenData.symbol, 'token');
      } catch (xError) {
        console.log('⚠️ X data unavailable for token:', xError.message);
      }
    }
    
    const enhancedData = {
      ...tokenData,
      xIntegration: xData ? {
        enabled: true,
        sentiment: xData.sentiment?.overall || 'N/A',
        mentions: xData.metrics?.totalMentions || 0,
        engagement: xData.metrics?.totalEngagement || 0,
        community: xData.keyTopics || [],
        trending: xData.trendingHashtags || []
      } : {
        enabled: false,
        message: 'Social data unavailable'
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      token: enhancedData
    });
  } catch (error) {
    console.error('Error fetching enhanced token data:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced token data' });
  }
});

export default router; 