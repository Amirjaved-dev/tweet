import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface Token {
  id?: string;
  symbol: string;
  name: string;
  address?: string;
  chain?: string;
  category: string;
  verified?: boolean;
  source?: string;
  price?: string;
  change24h?: string;
  rank?: number;
  isMeme?: boolean;
  dataStrategy?: string;
  sourceDetails?: {
    platform: string;
    type: string;
    verified: boolean;
    contractAddress?: string;
    blockchain?: string;
    coinGeckoId?: string;
    dexInfo?: any;
    liquidity?: number;
  };
}

interface TokenBrowserProps {
  onTokenSelect: (symbol: string) => void;
  selectedToken?: string;
}

export default function TokenBrowser({ onTokenSelect, selectedToken }: TokenBrowserProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'categories' | 'search' | 'custom'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [myTokens, setMyTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceCounts, setSourceCounts] = useState({ predefined: 0, coingecko: 0, dexscreener: 0 });

  // Local storage key for user tokens
  const STORAGE_KEY = 'threadflowpro_custom_tokens';

  // Load tokens from localStorage
  const loadMyTokens = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const tokens = JSON.parse(saved);
        setMyTokens(tokens);
      }
    } catch (err) {
      console.error('Failed to load tokens from localStorage:', err);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    loadMyTokens();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/tokens/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const searchTokens = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tokens/search?q=${searchQuery}&limit=20&source=all`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
        setSourceCounts(data.sources || { predefined: 0, coingecko: 0, dexscreener: 0 });
      }
    } catch (err) {
      console.error('Failed to search tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = (symbol: string) => {
    onTokenSelect(symbol);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'CoinGecko': return 'bg-orange-500/20 text-orange-400';
      case 'DEXScreener': return 'bg-blue-500/20 text-blue-400';
      case 'Built-in Categories': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-3">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 rounded-lg p-1">
        {[
          { id: 'categories', label: 'Categories', count: categories.length },
          { id: 'search', label: 'Search', count: searchResults.length },
          { id: 'custom', label: 'My Tokens', count: myTokens.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.name} className="bg-black/20 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-white text-sm font-medium capitalize">{category.displayName}</h5>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                  {category.count}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {category.tokens.slice(0, 8).map((token: string) => (
                  <button
                    key={token}
                    onClick={() => handleTokenClick(token)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      selectedToken === token
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {token}
                  </button>
                ))}
                {category.tokens.length > 8 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{category.tokens.length - 8} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search all sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTokens()}
              className="flex-1 bg-black/50 border border-white/20 rounded-md text-white text-sm px-3 py-2 focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={searchTokens}
              disabled={loading || !searchQuery.trim()}
              className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm"
            >
              {loading ? '...' : 'Search All'}
            </button>
          </div>
          
          {/* Source Summary */}
          {searchResults.length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Found from:</span>
                <div className="flex gap-2">
                  {sourceCounts.predefined > 0 && (
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                      {sourceCounts.predefined} Built-in
                    </span>
                  )}
                  {sourceCounts.coingecko > 0 && (
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                      {sourceCounts.coingecko} CoinGecko
                    </span>
                  )}
                  {sourceCounts.dexscreener > 0 && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      {sourceCounts.dexscreener} DEXScreener
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((token, index) => (
                <button
                  key={`${token.sourceDetails?.platform}-${token.symbol}-${index}`}
                  onClick={() => handleTokenClick(token.symbol)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedToken === token.symbol
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{token.symbol}</span>
                        {token.isMeme && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">
                            🐸 MEME
                          </span>
                        )}
                        {token.verified && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-1 py-0.5 rounded">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getPlatformColor(token.sourceDetails?.platform || 'Unknown')}`}>
                        {token.sourceDetails?.platform}
                      </span>
                    </div>
                    
                    {/* Token Name */}
                    <div className="text-gray-400 text-xs">{token.name || token.symbol}</div>
                    
                    {/* Price Data */}
                    {(token.price !== 'N/A' || token.change24h !== 'N/A') && (
                      <div className="flex items-center gap-2">
                        {token.price && token.price !== 'N/A' && (
                          <span className="text-xs text-gray-300">{token.price}</span>
                        )}
                        {token.change24h && token.change24h !== 'N/A' && (
                          <span className={`text-xs ${
                            token.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {token.change24h}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Source Details */}
                    {token.sourceDetails && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {token.sourceDetails.contractAddress && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Contract:</span>
                            <span className="font-mono">
                              {token.sourceDetails.contractAddress.slice(0, 6)}...{token.sourceDetails.contractAddress.slice(-4)}
                            </span>
                          </div>
                        )}
                        {token.sourceDetails.blockchain && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Chain:</span>
                            <span>{token.sourceDetails.blockchain}</span>
                          </div>
                        )}
                        {token.sourceDetails.dexInfo && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">DEX:</span>
                            <span>{token.sourceDetails.dexInfo.dexName}</span>
                          </div>
                        )}
                        {token.rank && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Rank:</span>
                            <span>#{token.rank}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Tokens Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-2">
          {myTokens.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-2">No custom tokens saved</p>
              <p className="text-gray-500 text-xs mb-3">
                Add custom tokens by contract address via the API
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Your Custom Tokens</span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {myTokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => handleTokenClick(token.symbol)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedToken === token.symbol
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium text-sm flex items-center gap-2">
                          {token.symbol}
                          {token.verified && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-1 py-0.5 rounded">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs">{token.name}</div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="bg-gray-700 px-2 py-1 rounded">{token.category}</div>
                        <div className="text-gray-600">{token.chain}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 