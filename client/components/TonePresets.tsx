import React from 'react';

interface TonePresetProps {
  onSelect: (tone: string) => void;
  currentTone?: string;
  variant?: 'web3' | 'general';
}

export default function TonePresets({ onSelect, currentTone = '', variant = 'web3' }: TonePresetProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        {variant === 'web3' ? 'Web3-Native Tone Presets' : 'Thread Tone Presets'}
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variant === 'web3' ? (
          // Web3 specific presets
          <>
            {/* Degen Mode */}
            <button
              type="button"
              onClick={() => onSelect('degen')}
              className={`bg-green-900/20 border ${currentTone === 'degen' ? 'border-green-500/70' : 'border-green-900/50'} hover:border-green-500/50 rounded-lg p-3 text-left transition-all hover:bg-green-900/30`}
            >
              <h5 className="text-green-400 font-medium text-sm mb-1">Degen Mode</h5>
              <p className="text-gray-400 text-xs">gm frens. lfg with this alpha on solana. ser, this is the play. straight up degen szn vibes rn. apeing in with my last eth. ngmi if u don't follow.</p>
            </button>
            
            {/* Hype Mode */}
            <button
              type="button"
              onClick={() => onSelect('hype')}
              className={`bg-yellow-900/20 border ${currentTone === 'hype' ? 'border-yellow-500/70' : 'border-yellow-900/50'} hover:border-yellow-500/50 rounded-lg p-3 text-left transition-all hover:bg-yellow-900/30`}
            >
              <h5 className="text-yellow-400 font-medium text-sm mb-1">Hype Mode</h5>
              <p className="text-gray-400 text-xs">🔥🔥🔥 HUGE ALERT!!! THE GAINS ARE COMING AND THEY'RE GOING TO BE MASSIVE!!! 📈📈📈 I'VE NEVER BEEN MORE BULLISH IN MY ENTIRE LIFE!!!</p>
            </button>
            
            {/* Educational Mode */}
            <button
              type="button"
              onClick={() => onSelect('educational')}
              className={`bg-blue-900/20 border ${currentTone === 'educational' ? 'border-blue-500/70' : 'border-blue-900/50'} hover:border-blue-500/50 rounded-lg p-3 text-left transition-all hover:bg-blue-900/30`}
            >
              <h5 className="text-blue-400 font-medium text-sm mb-1">Educational Mode</h5>
              <p className="text-gray-400 text-xs">An Educational Thread: To understand this project properly, we need to examine the underlying technology and its potential applications in the broader ecosystem.</p>
            </button>
            
            {/* Shill Mode */}
            <button
              type="button"
              onClick={() => onSelect('shill')}
              className={`bg-purple-900/20 border ${currentTone === 'shill' ? 'border-purple-500/70' : 'border-purple-900/50'} hover:border-purple-500/50 rounded-lg p-3 text-left transition-all hover:bg-purple-900/30`}
            >
              <h5 className="text-purple-400 font-medium text-sm mb-1">Shill Mode</h5>
              <p className="text-gray-400 text-xs">$BTC is the most undervalued gem in crypto right now. Still early. Team is based and delivers. Already partnered with huge names that I can't reveal yet.</p>
            </button>
          </>
        ) : (
          // General thread presets
          <>
            {/* Professional Tone */}
            <button
              type="button"
              onClick={() => onSelect('Professional')}
              className={`bg-blue-900/20 border ${currentTone === 'Professional' ? 'border-blue-500/70' : 'border-blue-900/50'} hover:border-blue-500/50 rounded-lg p-3 text-left transition-all hover:bg-blue-900/30`}
            >
              <h5 className="text-blue-400 font-medium text-sm mb-1">Professional</h5>
              <p className="text-gray-400 text-xs">Clear, concise insights with factual information and actionable advice for your audience.</p>
            </button>
            
            {/* Storytelling Tone */}
            <button
              type="button"
              onClick={() => onSelect('Storytelling')}
              className={`bg-purple-900/20 border ${currentTone === 'Storytelling' ? 'border-purple-500/70' : 'border-purple-900/50'} hover:border-purple-500/50 rounded-lg p-3 text-left transition-all hover:bg-purple-900/30`}
            >
              <h5 className="text-purple-400 font-medium text-sm mb-1">Storytelling</h5>
              <p className="text-gray-400 text-xs">Engaging narratives that draw readers in with personal experiences and emotional connection.</p>
            </button>
            
            {/* Bold Tone */}
            <button
              type="button"
              onClick={() => onSelect('Bold')}
              className={`bg-red-900/20 border ${currentTone === 'Bold' ? 'border-red-500/70' : 'border-red-900/50'} hover:border-red-500/50 rounded-lg p-3 text-left transition-all hover:bg-red-900/30`}
            >
              <h5 className="text-red-400 font-medium text-sm mb-1">Bold</h5>
              <p className="text-gray-400 text-xs">Direct, confident statements that challenge conventional thinking and stand out from the crowd.</p>
            </button>
            
            {/* Educational Tone */}
            <button
              type="button"
              onClick={() => onSelect('Educational')}
              className={`bg-green-900/20 border ${currentTone === 'Educational' ? 'border-green-500/70' : 'border-green-900/50'} hover:border-green-500/50 rounded-lg p-3 text-left transition-all hover:bg-green-900/30`}
            >
              <h5 className="text-green-400 font-medium text-sm mb-1">Educational</h5>
              <p className="text-gray-400 text-xs">Informative content that teaches concepts clearly with examples, analogies, and step-by-step explanations.</p>
            </button>
          </>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Switch between different tones to match your audience and community style
      </p>
    </div>
  );
} 