import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  MessageSquare,
  Clock,
  Calendar,
  Zap,
  Crown,
  ArrowLeft,
  Eye,
  Target,
  Users,
  Star,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Link } from 'wouter';
import { useUserData } from '../../hooks/useUserData';

interface RealAnalytics {
  threadGeneration: {
    total: number;
    thisMonth: number;
    today: number;
    thisWeek: number;
  };
  userActivity: {
    daysActive: number;
    totalSessions: number;
    accountAge: number;
  };
}

export default function Analytics() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isPremium } = useUserData();
  const [analytics, setAnalytics] = useState<RealAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRealAnalytics = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
    setError(null);
    
        console.log('🔍 Current user clerk_id:', user.id);
        console.log('🔍 User object:', user);

        // First test if the route is accessible
        try {
          const testResponse = await fetch('/api/analytics/test');
          const testText = await testResponse.text();
          console.log('✅ Test response:', testResponse.status, testText);
        } catch (testError) {
          console.error('❌ Test endpoint failed:', testError);
        }

        // Get the session token for authentication
        const token = await getToken();
        console.log('🔑 Got token:', token ? 'yes' : 'no');

        // Fetch real analytics data with authentication
        const url = `/api/analytics?clerk_id=${user.id}`;
        console.log('📡 Fetching from URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`Failed to fetch analytics: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📈 Analytics data received:', data);
        setAnalytics(data);
      } catch (err) {
        console.error('💥 Error loading analytics:', err);
        
        // Log what we know about the database
        console.log('🗄️ Expected threads in database for user_2xxRmGeAONdm5PNQ1r8KbjmqBir:');
        console.log('🗄️ - SOL Analysis');
        console.log('🗄️ - BENDOG Analysis');  
        console.log('🗄️ - WAL Analysis');
        console.log('🗄️ - etc... (7 total threads)');
        
        setError(`Failed to load analytics data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Fallback to basic calculation if API fails
        try {
          console.log('🔄 Attempting fallback calculation...');
          const token = await getToken();
          
          // Try to fetch from multiple endpoints to get thread data
          let threads = [];
          
          // First try the threads service endpoint
          try {
            const threadsResponse = await fetch(`/api/threads`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('Threads service response:', threadsResponse.status);
            
            if (threadsResponse.ok) {
              const threadsData = await threadsResponse.json();
              threads = threadsData.threads || threadsData || [];
              console.log('Got threads from threads service:', threads.length);
            }
          } catch (threadsError) {
            console.log('Threads service failed, trying individual thread endpoint...');
            
            // Try the individual thread endpoint with user ID
            try {
              const threadResponse = await fetch(`/api/thread/user/${user.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log('Individual thread response:', threadResponse.status);
              
              if (threadResponse.ok) {
                const threadData = await threadResponse.json();
                threads = threadData.threads || threadData || [];
                console.log('Got threads from thread endpoint:', threads.length);
              }
            } catch (threadError) {
              console.error('Both thread endpoints failed:', threadError);
            }
          }
          
          if (threads.length >= 0) {
            console.log('Fallback threads data:', threads);
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const todayThreads = threads.filter((t: any) => new Date(t.created_at) >= today).length;
            const monthThreads = threads.filter((t: any) => new Date(t.created_at) >= thisMonth).length;
            const weekThreads = threads.filter((t: any) => new Date(t.created_at) >= thisWeek).length;

            const fallbackData = {
              threadGeneration: {
                total: threads.length,
                thisMonth: monthThreads,
                today: todayThreads,
                thisWeek: weekThreads
              },
              userActivity: {
                daysActive: Math.floor((now.getTime() - new Date(user.createdAt || now).getTime()) / (1000 * 60 * 60 * 24)),
                totalSessions: threads.length, // Approximate
                accountAge: Math.floor((now.getTime() - new Date(user.createdAt || now).getTime()) / (1000 * 60 * 60 * 24))
              }
            };
            
            console.log('Using fallback data:', fallbackData);
            setAnalytics(fallbackData);
            setError(null); // Clear error since fallback worked
          } else {
            console.log('No threads found, using zero data');
            setAnalytics({
              threadGeneration: { total: 0, thisMonth: 0, today: 0, thisWeek: 0 },
              userActivity: { daysActive: 0, totalSessions: 0, accountAge: 0 }
            });
            setError(null);
          }
        } catch (fallbackError) {
          console.error('Fallback calculation failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRealAnalytics();
  }, [user?.id, getToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">Your Thread Generation Insights</p>
            </div>
          </div>

          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading your analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">Your Thread Generation Insights</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <div className="text-red-500 mb-4">
              <Activity className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
          <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Your real thread generation insights</p>
          </div>
          </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Total Threads</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {analytics?.threadGeneration.total || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">All time</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">This Month</h3>
                  </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {analytics?.threadGeneration.thisMonth || 0}
                </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generated threads</p>
                </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Today</h3>
                  </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {analytics?.threadGeneration.today || 0}
                      </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generated today</p>
                    </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">This Week</h3>
                  </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {analytics?.threadGeneration.thisWeek || 0}
                </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Past 7 days</p>
                          </div>
                    </div>
                    
        {/* Your Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Activity</h2>
                </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Days Active</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analytics?.userActivity.daysActive || 0} days
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Total Sessions</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analytics?.userActivity.totalSessions || 0}
                        </span>
                    </div>
                    
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Account Age</span>
                              </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analytics?.userActivity.accountAge || 0} days
                        </span>
                          </div>
                      
              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-900 dark:text-white">Plan Status</span>
                </div>
                <span className={`font-semibold ${isPremium ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {isPremium ? 'Premium' : 'Free'}
                </span>
                    </div>
                    </div>
                  </div>

          {/* Performance Tracking - Coming Soon */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Tracking</h2>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                Coming Soon
              </span>
                    </div>
                    
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Thread Performance Coming Soon!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Track clicks, impressions, and engagement when you connect your X (Twitter) account.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                <div>📊 Clicks & Impressions</div>
                <div>❤️ Likes & Retweets</div>
                <div>💬 Comments & Engagement</div>
                <div>⭐ Best Performing Threads</div>
                          </div>
                    </div>
                  </div>
            </div>

        {/* Insights */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analytics?.threadGeneration.total ? 
                  Math.round((analytics.threadGeneration.thisMonth / analytics.threadGeneration.total) * 100) 
                  : 0}%
                </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">of threads created this month</p>
                </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analytics?.threadGeneration.total ? 
                  (analytics.threadGeneration.total / Math.max(analytics.userActivity.daysActive, 1)).toFixed(1)
                  : '0.0'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">average threads per day</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analytics?.threadGeneration.thisWeek || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">threads this week</p>
                </div>
          </div>
        </div>
        </div>
    </div>
  );
} 