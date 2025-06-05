import React, { useState } from 'react';
import { X, Crown, Check, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'pro' | 'business' | 'enterprise';
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const planDetails = {
    pro: {
      name: 'Pro Plan',
      price: '$29',
      features: [
        'Unlimited threads per day',
        'Advanced AI models',
        'Real-time token data',
        'All tone presets',
        'Priority support'
      ]
    },
    business: {
      name: 'Business Plan',
      price: '$99',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Advanced analytics'
      ]
    },
    enterprise: {
      name: 'Enterprise Plan',
      price: '$299',
      features: [
        'Everything in Business',
        'White-label solution',
        'Custom AI training',
        'Dedicated support',
        'SLA guarantee'
      ]
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Redirect to payment endpoint
      window.location.href = `/api/payment/create-session?plan=${plan}`;
    } catch (error) {
      console.error('Payment error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-white/20 rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade to {planDetails[plan].name}
          </h2>
          <p className="text-gray-400">
            Unlock premium features and take your content to the next level
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-white">
              {planDetails[plan].price}
            </span>
            <span className="text-gray-400 ml-1">/month</span>
          </div>
          
          <ul className="space-y-2">
            {planDetails[plan].features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              Subscribe Now
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Cancel anytime. No hidden fees. 30-day money-back guarantee.
        </p>
      </div>
    </div>
  );
} 