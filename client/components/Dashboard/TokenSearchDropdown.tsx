import React, { useState, useEffect, useRef } from 'react';
import { Hash, Loader2, ChevronDown, Search, Star, TrendingUp } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  category?: string;
  verified?: boolean;
  source?: string;
  price?: string;
  change24h?: string;
  rank?: number;
  isMeme?: boolean;
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

interface TokenSearchDropdownProps {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TokenSearchDropdown({ 
  value, 
  onChange, 
  placeholder = "Search tokens...", 
  disabled = false 
}: TokenSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popularTokens, setPopularTokens] = useState<Token[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load popular tokens on mount
  useEffect(() => {
    fetchPopularTokens();
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && searchQuery.length > 1) {
        searchTokens(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPopularTokens = async () => {
    try {
      const response = await fetch('/api/tokens/categories');
      const data = await response.json();
      if (data.success && data.categories) {
        // Extract popular tokens from categories
        const popular = [
          'BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK',
          'UNI', 'AAVE', 'COMP', 'SUSHI', 'DOGE', 'SHIB', 'PEPE'
        ].map(symbol => ({
          symbol,
          name: symbol,
          category: 'popular',
          source: 'Built-in'
        }));
        setPopularTokens(popular);
      }
    } catch (error) {
      console.error('Failed to fetch popular tokens:', error);
    }
  };

  const searchTokens = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tokens/search?q=${encodeURIComponent(query)}&limit=15&source=all`);
      const data = await response.json();
      
      if (data.success && data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Failed to search tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setSearchQuery(newValue);
    onChange(newValue);
    setIsDropdownOpen(true);
  };

  const handleTokenSelect = (token: Token) => {
    onChange(token.symbol);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setSearchResults([]);
  };

  const handleInputClick = () => {
    setIsDropdownOpen(true);
    if (!searchQuery && searchResults.length === 0) {
      // Show popular tokens when clicked without search
      setSearchResults(popularTokens);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'CoinGecko': return 'bg-orange-500/20 text-orange-400';
      case 'DEXScreener': return 'bg-blue-500/20 text-blue-400';
      case 'Built-in Categories': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const displayResults = searchQuery ? searchResults : popularTokens;
  const showDropdown = isDropdownOpen && displayResults.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-white font-medium mb-2">Token Symbol</label>
      
      {/* Input Field */}
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-black/50 border border-white/20 rounded-lg text-white pl-10 pr-12 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        
        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          )}
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform cursor-pointer ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-black/95 border-b border-white/10 px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                {searchQuery ? `Results for "${searchQuery}"` : 'Popular Tokens'}
              </span>
              {searchQuery && (
                <span className="text-purple-400 text-xs">
                  {searchResults.length} found
                </span>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="py-2">
            {displayResults.map((token, index) => (
              <button
                key={`${token.symbol}-${index}`}
                onClick={() => handleTokenSelect(token)}
                className="w-full px-4 py-3 hover:bg-white/5 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  {/* Token Info */}
                  <div className="flex items-center gap-3">
                    {/* Token Icon */}
                    <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white text-sm">
                      {token.symbol.substring(0, 1)}
                    </div>
                    
                    {/* Token Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{token.symbol}</span>
                        
                        {/* Badges */}
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
                        {token.rank && token.rank <= 10 && (
                          <Star className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                      
                      <div className="text-gray-400 text-sm">
                        {token.name || token.symbol}
                      </div>
                      
                      {/* Additional info */}
                      {token.price && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>${token.price}</span>
                          {token.change24h && (
                            <span className={`flex items-center gap-1 ${
                              parseFloat(token.change24h) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              <TrendingUp className="w-3 h-3" />
                              {token.change24h}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Source Badge */}
                  {token.sourceDetails?.platform && (
                    <span className={`text-xs px-2 py-1 rounded ${getPlatformColor(token.sourceDetails.platform)}`}>
                      {token.sourceDetails.platform}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !isLoading && (
            <div className="px-4 py-6 text-center">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No tokens found for "{searchQuery}"</p>
              <p className="text-gray-500 text-xs mt-1">Try searching by symbol or name</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 