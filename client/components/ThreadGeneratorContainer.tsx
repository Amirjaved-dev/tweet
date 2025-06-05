import { useState } from 'react';
import ThreadGenerator from './ThreadGenerator';
import Web3ThreadGenerator from './Web3ThreadGenerator';
import RealTimeThreadGenerator from './RealTimeThreadGenerator';

interface ThreadGeneratorContainerProps {
  onThreadGenerated?: (thread: any) => void;
  hasReachedLimit?: boolean;
}

export default function ThreadGeneratorContainer({ onThreadGenerated, hasReachedLimit = false }: ThreadGeneratorContainerProps) {
  const [activeTab, setActiveTab] = useState<string>('token-based');

  const tabs = [
    {
      id: 'token-based',
      name: 'Token-Based',
      icon: (
        <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'regular',
      name: 'Regular',
      icon: (
        <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'real-time',
      name: 'Real-time',
      icon: (
        <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  // Handle thread generation and pass to parent
  const handleThreadGenerated = (thread: any) => {
    if (onThreadGenerated) {
      // Add the generator type to the thread metadata
      const threadWithSource = {
        ...thread,
        metadata: {
          ...(thread.metadata || {}),
          generatorType: activeTab
        }
      };
      onThreadGenerated(threadWithSource);
    }
  };

  return (
    <div className="bg-[#070B1B] rounded-xl border border-blue-900/30 overflow-hidden">
      <div className="flex border-b border-blue-900/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-[#0F1736] text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#0F1736]/50'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'token-based' && (
          <Web3ThreadGenerator 
            onThreadGenerated={handleThreadGenerated}
            hasReachedLimit={hasReachedLimit}
          />
        )}
        
        {activeTab === 'regular' && (
          <ThreadGenerator 
            onThreadGenerated={handleThreadGenerated}
            hasReachedLimit={hasReachedLimit}
          />
        )}
        
        {activeTab === 'real-time' && (
          <RealTimeThreadGenerator 
            onThreadGenerated={handleThreadGenerated}
            hasReachedLimit={hasReachedLimit}
          />
        )}
      </div>
    </div>
  );
} 