import React from 'react';
import { useUserData } from '../hooks/useUserData.js';
import { PaymentButton } from './PaymentButton.jsx';
import { SyncFixButton } from './SyncFixButton.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Crown, Lock, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Example component showing how to use the new user data system
 * Demonstrates conditional rendering based on plan status
 */
export function PremiumFeatureExample() {
  const { 
    isPremium, 
    isFree, 
    loading, 
    error, 
    planStatus, 
    clerkUser,
    supabaseUser 
  } = useUserData();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading user data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            Sync Error
          </CardTitle>
          <CardDescription className="text-red-400">
            We couldn't sync your account data. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-red-600 mb-4">
            <p className="text-sm">{error}</p>
          </div>
          <SyncFixButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Status Card */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPremium ? (
              <Crown className="w-5 h-5 text-yellow-500" />
            ) : (
              <Lock className="w-5 h-5 text-gray-500" />
            )}
            Account Status
          </CardTitle>
          <CardDescription>
            Current plan: <span className="font-medium capitalize">{planStatus}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> {clerkUser?.primaryEmailAddress?.emailAddress}</p>
            <p><strong>User ID:</strong> {clerkUser?.id}</p>
            <p><strong>Plan Status:</strong> {planStatus}</p>
            {supabaseUser && (
              <p><strong>Synced:</strong> ✅ Yes</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <SyncFixButton className="w-full" />
        </CardFooter>
      </Card>

      {/* Premium Features Card */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Premium Features
          </CardTitle>
          <CardDescription>
            {isPremium 
              ? "You have access to all premium features!" 
              : "Upgrade to unlock premium features"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Feature List */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isPremium ? 'text-green-600' : 'text-gray-400'}`}>
              {isPremium ? '✅' : '🔒'} Unlimited thread generation
            </div>
            <div className={`flex items-center gap-2 ${isPremium ? 'text-green-600' : 'text-gray-400'}`}>
              {isPremium ? '✅' : '🔒'} Advanced formatting options
            </div>
            <div className={`flex items-center gap-2 ${isPremium ? 'text-green-600' : 'text-gray-400'}`}>
              {isPremium ? '✅' : '🔒'} Priority support
            </div>
            <div className={`flex items-center gap-2 ${isPremium ? 'text-green-600' : 'text-gray-400'}`}>
              {isPremium ? '✅' : '🔒'} Analytics & insights
            </div>
          </div>

          {/* Action Button */}
          {!isPremium && (
            <div className="pt-4">
              <PaymentButton 
                amount={9.99}
                className="w-full"
                variant="default"
              >
                Upgrade to Premium
              </PaymentButton>
            </div>
          )}

          {isPremium && (
            <div className="pt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <Crown className="w-4 h-4" />
                Premium Active
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="w-full max-w-md border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                isPremium,
                isFree,
                planStatus,
                loading,
                error,
                hasClerkUser: !!clerkUser,
                hasSupabaseUser: !!supabaseUser
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PremiumFeatureExample; 