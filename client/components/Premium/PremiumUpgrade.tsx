import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { userService } from '../../lib/supabaseClient';
import { Crown, Zap, Check, Loader2 } from 'lucide-react';

export default function PremiumUpgrade() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check user plan status
  useEffect(() => {
    const checkPlanStatus = async () => {
      if (!isLoaded || !user) return;

      try {
        const dbUser = await userService.getUserByClerkId(user.id);
        setIsPremium(dbUser?.is_premium === true || dbUser?.plan === 'premium');
      } catch (error) {
        console.error('Error checking plan status:', error);
      } finally {
        setIsCheckingPlan(false);
      }
    };

    checkPlanStatus();
  }, [isLoaded, user]);

  const handleUpgrade = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsCreatingCharge(true);
    setError(null);

    try {
      // Get Clerk session token
      const token = await getToken();

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planPrice: 9.99
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create payment');
      }

      // Redirect to Coinbase Commerce checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setIsCreatingCharge(false);
    }
  };

  if (!isLoaded || isCheckingPlan) {
    return (
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Premium Active</h3>
        </div>
        <p className="text-gray-300 mb-4">
          You have access to all premium features including unlimited thread generation.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Unlimited thread generation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Priority AI model access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Advanced analytics</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold text-white">Upgrade to Premium</h3>
      </div>
      
      <p className="text-gray-300 mb-6">
        Unlock unlimited thread generation and premium features with our one-time crypto payment.
      </p>

      <div className="bg-black/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">Premium Plan</h4>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">$9.99</div>
            <div className="text-sm text-gray-400">One-time payment</div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Unlimited thread generation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Priority AI model access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Advanced analytics & insights</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            <span>Export & save threads</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleUpgrade}
        disabled={isCreatingCharge}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isCreatingCharge ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Payment...
          </>
        ) : (
          <>
            <Crown className="w-4 h-4" />
            Pay with Crypto
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Secure crypto payment powered by Coinbase Commerce
      </p>
    </div>
  );
} 