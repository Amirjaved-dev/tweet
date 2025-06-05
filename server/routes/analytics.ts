import express from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

interface AnalyticsData {
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
  planInfo: {
    plan: string;
    isPremium: boolean;
  };
}

// Test endpoint for debugging
router.get('/test', async (req, res) => {
  try {
    console.log('Analytics test endpoint called');
    res.json({ 
      message: 'Analytics route is working',
      timestamp: new Date().toISOString(),
      query: req.query
    });
  } catch (error) {
    console.error('Analytics test error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Get analytics data for a user - now with authentication
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('🎯 Analytics route called');
    
    const { clerk_id } = req.query;
    const authUserId = (req as any).auth?.userId;

    console.log('🔍 Query clerk_id:', clerk_id);
    console.log('🔍 Auth userId:', authUserId);
    console.log('🔍 Known threads in DB for user_2xxRmGeAONdm5PNQ1r8KbjmqBir');

    if (!clerk_id || typeof clerk_id !== 'string') {
      console.log('❌ Invalid clerk_id provided');
      return res.status(400).json({ error: 'clerk_id is required' });
    }

    // Security: Ensure user can only access their own data
    if (authUserId && authUserId !== clerk_id) {
      console.log('❌ Security check failed: auth user != query user');
      return res.status(403).json({ error: 'Unauthorized: Cannot access other user data' });
    }

    console.log('✅ Security check passed, fetching threads...');

    // Get user's threads
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, created_at, title, tags')
      .eq('clerk_id', clerk_id)
      .order('created_at', { ascending: false });

    console.log('📊 Threads query result:');
    console.log('📊 - Error:', threadsError);
    console.log('📊 - Thread count:', threads?.length || 0);
    console.log('📊 - Threads:', threads);

    if (threadsError) {
      console.error('❌ Error fetching threads:', threadsError);
      return res.status(500).json({ error: 'Failed to fetch threads data' });
    }

    console.log('✅ Threads fetched successfully, fetching user...');

    // Get user data for account info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('created_at, plan, is_premium')
      .eq('clerk_id', clerk_id)
      .single();

    console.log('👤 User query result:');
    console.log('👤 - Error:', userError);
    console.log('👤 - User:', user);

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      
      // If user doesn't exist, provide fallback data
      if (userError.code === 'PGRST116') {
        console.log('⚠️ User not found in database, providing fallback data');
        const fallbackAnalytics: AnalyticsData = {
          threadGeneration: {
            total: threads?.length || 0,
            thisMonth: 0,
            today: 0,
            thisWeek: 0
          },
          userActivity: {
            daysActive: 0,
            totalSessions: 0,
            accountAge: 0
          },
          planInfo: {
            plan: 'free',
            isPremium: false
          }
        };
        
        console.log('📤 Sending fallback analytics:', fallbackAnalytics);
        return res.json(fallbackAnalytics);
      }
      
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    console.log('User found:', user ? 'yes' : 'no');

    // Calculate time ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const userCreatedAt = new Date(user.created_at);

    // Filter threads by time periods
    const todayThreads = threads?.filter(t => new Date(t.created_at) >= today) || [];
    const monthThreads = threads?.filter(t => new Date(t.created_at) >= thisMonth) || [];
    const weekThreads = threads?.filter(t => new Date(t.created_at) >= thisWeek) || [];

    // Calculate account age in days
    const accountAgeMs = now.getTime() - userCreatedAt.getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    // Calculate active days (days with at least one thread)
    const uniqueDays = new Set<string>();
    threads?.forEach(thread => {
      const threadDate = new Date(thread.created_at);
      const dayKey = `${threadDate.getFullYear()}-${threadDate.getMonth()}-${threadDate.getDate()}`;
      uniqueDays.add(dayKey);
    });

    const analytics: AnalyticsData = {
      threadGeneration: {
        total: threads?.length || 0,
        thisMonth: monthThreads.length,
        today: todayThreads.length,
        thisWeek: weekThreads.length
      },
      userActivity: {
        daysActive: uniqueDays.size,
        totalSessions: threads?.length || 0, // Using thread count as session approximation
        accountAge: accountAgeDays
      },
      planInfo: {
        plan: user.plan || 'free',
        isPremium: user.is_premium || false
      }
    };

    console.log('Analytics calculated successfully:', analytics);
    res.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 