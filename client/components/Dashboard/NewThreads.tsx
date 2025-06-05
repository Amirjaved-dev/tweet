import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Zap, Loader2 } from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';

export default function NewThreads() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isPremium, supabaseUser, isLoading } = useUserData();
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadCreated, setThreadCreated] = useState(false);
  const [threadData, setThreadData] = useState<any>(null);

  const handleCreateThread = async () => {
    if (!user || !content.trim()) return;
    
    setIsCreating(true);
    setError(null);
    setThreadCreated(false);
    
    try {
      // Get Clerk session token
      const token = await getToken();
      
      const response = await fetch('/api/threads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create thread');
      }
      
      setThreadData(data.thread);
      setThreadCreated(true);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Thread</h2>
      
      {!isPremium && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-300 font-medium">
              Free Plan Limit: {supabaseUser?.thread_count || 0}/3 threads today
            </p>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            Upgrade to premium for unlimited thread generation.
          </p>
        </div>
      )}
      
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg p-6 shadow-lg">
        <div className="mb-4">
          <label htmlFor="thread-content" className="block text-white font-medium mb-2">
            Thread Content
          </label>
          <textarea
            id="thread-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your thread content here..."
            className="w-full bg-black/50 border border-white/20 rounded-lg text-white p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            rows={6}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleCreateThread}
            disabled={isCreating || !content.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Create Thread
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {threadCreated && (
          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 font-medium">Thread created successfully!</p>
            <pre className="mt-2 bg-black/40 p-3 rounded-md text-gray-300 text-sm overflow-auto max-h-40">
              {JSON.stringify(threadData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 