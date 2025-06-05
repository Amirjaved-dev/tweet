import { useClerkSupabaseSync } from '../../hooks/useClerkSupabaseSync';
import { usePlanStatus } from '../../hooks/usePlanStatus';

export default function SyncStatus() {
  const { 
    isLoading: isSyncing, 
    isSynced, 
    error: syncError, 
    supabaseUser,
    user: clerkUser,
    isClerkLoaded 
  } = useClerkSupabaseSync();
  
  const { planStatus, loading: planLoading, isPremium } = usePlanStatus();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 border border-gray-700 rounded-lg p-3 text-xs text-white max-w-xs z-50">
      <div className="font-semibold mb-2 text-green-400">🔄 Clerk-Supabase Sync Status</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Clerk Loaded:</span>
          <span className={isClerkLoaded ? 'text-green-400' : 'text-red-400'}>
            {isClerkLoaded ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>User ID:</span>
          <span className="text-gray-300 font-mono text-xs">
            {clerkUser?.id ? `${clerkUser.id.substring(0, 8)}...` : 'None'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Syncing:</span>
          <span className={isSyncing ? 'text-yellow-400' : 'text-gray-400'}>
            {isSyncing ? '⏳' : '✓'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Synced:</span>
          <span className={isSynced ? 'text-green-400' : 'text-red-400'}>
            {isSynced ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Plan Status:</span>
          <span className={planLoading ? 'text-yellow-400' : 'text-blue-400'}>
            {planLoading ? '⏳' : planStatus || 'Unknown'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Is Premium:</span>
          <span className={isPremium ? 'text-purple-400' : 'text-gray-400'}>
            {isPremium ? '⭐' : '✗'}
          </span>
        </div>
        
        {syncError && (
          <div className="mt-2 p-2 bg-red-900/50 rounded text-red-200">
            <div className="font-semibold">Sync Error:</div>
            <div className="break-words">{syncError}</div>
          </div>
        )}
        
        {supabaseUser && (
          <div className="mt-2 p-2 bg-green-900/50 rounded text-green-200">
            <div className="font-semibold">Supabase User:</div>
            <div>Plan: {supabaseUser.plan_status}</div>
            <div>Created: {new Date(supabaseUser.created_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </div>
  );
} 