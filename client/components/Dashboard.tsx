import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useUserData } from '../hooks/useUserData.js';
import { useClerkSync } from '../hooks/useClerkSync';
import UpgradeButton from './UpgradeButton';
import { User, Crown, Calendar, Sparkles, Zap, BarChart3, Settings, ChevronRight, Check, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { supabase } from '../lib/supabaseClient';

const formatShortDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    if (date > lastWeek) {
      return 'This week';
    }
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    if (date > lastMonth) {
      return 'This month';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

export default function Dashboard() {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { supabaseUser, isPremium, isLoading, refreshUserData } = useUserData();
  const { syncUserToSupabase, isLoading: isSyncing } = useClerkSync();
  
  const [hasSyncAttempted, setHasSyncAttempted] = useState(false);
  const [directDbPremiumStatus, setDirectDbPremiumStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  // Automatic premium status detection (NO AUTO-UPGRADE)
  useEffect(() => {
    const detectPremiumStatus = async () => {
      if (!clerkUser?.id || !isClerkLoaded) return;
      
      console.log('🔍 [Dashboard] Checking premium status for user:', clerkUser.id);
      
      try {
        // Just check database status, don't auto-upgrade
        const { data: currentUserData, error } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', clerkUser.id)
          .single();
        
        if (error) {
          console.log('❌ [Dashboard] User not found in database, will be created as free user');
          return;
        }
        
        if (currentUserData) {
          console.log('📊 [Dashboard] User found in database:', {
            plan: currentUserData.plan,
            is_premium: currentUserData.is_premium,
            status: currentUserData.status
          });
          
          // Only log status, don't auto-upgrade
          if (currentUserData.plan === 'premium' && currentUserData.is_premium) {
            console.log('✅ [Dashboard] User has legitimate premium status');
          } else {
            console.log('📋 [Dashboard] User has free plan (normal)');
          }
          
          // Refresh UI to show correct status
          await refreshUserData();
        }
      } catch (err) {
        console.error('❌ [Dashboard] Status check error:', err);
      }
    };

    // Run status check after component loads
    if (isClerkLoaded && clerkUser) {
      setTimeout(detectPremiumStatus, 1000);
    }
  }, [clerkUser?.id, isClerkLoaded, refreshUserData]);

  // Automatic data sync on mount
  useEffect(() => {
    const performInitialSync = async () => {
      if (clerkUser && !hasSyncAttempted) {
        console.log('🔄 Performing initial data sync...');
        setHasSyncAttempted(true);
        
        try {
          await refreshUserData();
          
          if (!supabaseUser) {
            console.log('👤 No user data found, syncing with Clerk...');
            const result = await syncUserToSupabase();
            
            if (result.success) {
              setTimeout(() => refreshUserData(), 1000);
            }
          }
        } catch (err) {
          console.error('❌ Error during initial sync:', err);
        }
      }
    };
    
    if (isClerkLoaded && clerkUser) {
      performInitialSync();
    }
  }, [clerkUser, isClerkLoaded, hasSyncAttempted, refreshUserData, syncUserToSupabase, supabaseUser]);

  // Direct database check for premium status (bypasses state issues)
  useEffect(() => {
    const checkDirectDbStatus = async () => {
      if (!clerkUser?.id) return;
      
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('plan, is_premium, status')
          .eq('clerk_id', clerkUser.id)
          .single();
        
        if (dbUser) {
          const isDbPremium = dbUser.plan === 'premium' || 
                             dbUser.is_premium === true || 
                             (dbUser.status === 'active' && dbUser.plan === 'premium');
          
          console.log('💎 [Dashboard] Direct DB premium check:', {
            dbUser,
            isDbPremium
          });
          
          setDirectDbPremiumStatus(isDbPremium);
        }
      } catch (err) {
        console.error('❌ [Dashboard] Direct DB check error:', err);
      }
    };

    if (isClerkLoaded && clerkUser) {
      checkDirectDbStatus();
      // Re-check every 3 seconds
      const interval = setInterval(checkDirectDbStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [clerkUser?.id, isClerkLoaded]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse-slow"></div>
            <div className="absolute inset-1 bg-black rounded-full"></div>
            <div className="absolute inset-3 border-t-2 border-purple-500 rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mt-4">
            Thread Nova
          </h2>
          <p className="text-gray-400 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // Get user information with proper fallbacks
  const userEmail = supabaseUser?.email || 
                   (clerkUser?.emailAddresses?.[0]?.emailAddress) || 
                   (clerkUser?.primaryEmailAddress?.emailAddress) || 
                   "user@threadflowpro.com";
  
  const creationDate = supabaseUser?.created_at || 
                      (clerkUser?.createdAt ? new Date(clerkUser.createdAt).toISOString() : null);
  
  const joinDate = creationDate ? formatDate(creationDate) : "Recently";
  
  // DIRECT premium status calculation - use database check as primary source
  const userPlan = supabaseUser?.plan || "Free";
  const finalIsPremium = directDbPremiumStatus === true || 
                        isPremium || 
                        userPlan.toLowerCase() === 'premium' || 
                        userPlan.toLowerCase() === 'pro' ||
                        supabaseUser?.is_premium === true ||
                        (supabaseUser?.status === 'active' && supabaseUser?.plan === 'premium');

  console.log('📊 Dashboard render - PREMIUM STATUS ANALYSIS:', {
    directDbPremiumStatus,
    isPremium,
    userPlan,
    supabaseUser_plan: supabaseUser?.plan,
    supabaseUser_is_premium: supabaseUser?.is_premium,
    supabaseUser_status: supabaseUser?.status,
    finalIsPremium,
    hasSupabaseUser: !!supabaseUser
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl -z-5 animate-pulse-slow"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-5 animate-pulse-slow"></div>
      
      {/* Welcome Section */}
      <div className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Welcome to your Dashboard
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-4 text-white">
            Your Thread Control Center
          </h1>
          <p className="text-gray-300 mt-2">Generate, manage, and analyze your viral threads</p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* User Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-lg hover:border-purple-500/20 transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <User className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Account</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Email Address</p>
                    <p className="text-white font-mono text-sm sm:text-base break-all">
                      {userEmail}
                    </p>
                  </div>
                </div>
            
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Member Since</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Join Date</p>
                    <p className="text-white font-medium">
                      {joinDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Status Card */}
          <div className="lg:col-span-1">
            <div className={`bg-black/40 backdrop-blur-xl border rounded-2xl p-6 shadow-lg transition-all duration-300 ${
              finalIsPremium 
                ? 'border-yellow-500/30 hover:border-yellow-500/50' 
                : 'border-white/10 hover:border-purple-500/20'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <Crown className={`w-6 h-6 ${finalIsPremium ? 'text-yellow-400' : 'text-gray-400'}`} />
                <h3 className="text-lg font-semibold text-white">Plan Status</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Plan</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      finalIsPremium 
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {finalIsPremium ? 'Premium' : 'Free'}
                    </span>
                  </div>
                </div>
                
                {finalIsPremium && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Plan Features</p>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center text-white">
                            <Check className="w-4 h-4 text-green-400 mr-2" />
                            <span>Unlimited Thread Generation</span>
                          </li>
                          <li className="flex items-center text-white">
                            <Check className="w-4 h-4 text-green-400 mr-2" />
                            <span>Advanced Analytics</span>
                          </li>
                          <li className="flex items-center text-white">
                            <Check className="w-4 h-4 text-green-400 mr-2" />
                            <span>Priority Support</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {!finalIsPremium && (
                  <div className="pt-4 border-t border-white/10">
                    <UpgradeButton className="w-full" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/new-thread">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <Zap className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="text-white font-semibold">New Thread</h3>
                    <p className="text-gray-400 text-sm">Create viral content</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/new-tweet">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <MessageSquare className="w-8 h-8 text-cyan-400 mb-3" />
                    <h3 className="text-white font-semibold">New Tweet</h3>
                    <p className="text-gray-400 text-sm">Generate engaging tweets</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/analytics">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <BarChart3 className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="text-white font-semibold">Analytics</h3>
                    <p className="text-gray-400 text-sm">Track performance</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/settings">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <Settings className="w-8 h-8 text-green-400 mb-3" />
                    <h3 className="text-white font-semibold">Settings</h3>
                    <p className="text-gray-400 text-sm">Customize experience</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 