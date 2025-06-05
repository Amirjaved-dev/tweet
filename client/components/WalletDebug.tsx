import React from 'react';

export default function WalletDebug() {
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 border border-white/20 rounded-lg p-4 text-white text-sm max-w-sm">
      <h3 className="font-bold mb-2">Wallet Debug</h3>
      <div className="space-y-1">
        <div>Web3 integrations have been removed</div>
        <div>To re-enable wallet functionality, install required packages:</div>
        <div className="text-xs text-gray-400 mt-2">npm install wagmi @web3modal/wagmi</div>
      </div>
    </div>
  );
} 