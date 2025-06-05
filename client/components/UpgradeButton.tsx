import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { userService } from '../lib/supabaseClient';

interface UpgradeButtonProps {
  className?: string;
}

export default function UpgradeButton({ className = '' }: UpgradeButtonProps) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!isLoaded || !user) {
      setError('Please sign in to upgrade');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create payment');
      }

      const paymentData = await response.json();
      
      // Redirect to Coinbase Commerce checkout
      window.location.href = paymentData.checkout_url;
      
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleUpgrade}
        disabled={isLoading || !isLoaded}
        className={`
          bg-gradient-to-r from-purple-600 to-blue-600 
          hover:from-purple-700 hover:to-blue-700 
          disabled:from-gray-600 disabled:to-gray-700
          text-white font-semibold py-3 px-6 rounded-lg 
          transition-all duration-200 
          ${className}
        `}
      >
        {isLoading ? 'Creating Checkout...' : 'Upgrade to Premium'}
      </button>
      
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  );
} 