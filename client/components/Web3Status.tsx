import React from 'react';
import { Wallet } from 'lucide-react';

interface Web3StatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function Web3Status({ showDetails = false, className = '' }: Web3StatusProps) {
  return (
    <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
      <Wallet className="w-4 h-4" />
      {showDetails && <span className="text-sm">Web3 Disabled</span>}
    </div>
  );
} 