import { useState, useEffect } from 'react';
import { PaymentModal } from '../src/components/payment-modal';
import UpgradeButton from './Premium/UpgradeButton';
import { useUserData } from '../hooks/useUserData';
import { Loader2 } from 'lucide-react';

// Price plan types
interface PricePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  dailyLimit: number;
  popular?: boolean;
}

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricePlan | null>(null);
  const [plans, setPlans] = useState<PricePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPremium, isLoading } = useUserData();

  useEffect(() => {
    // Use default plans since we're not fetching from Supabase anymore
    setPlans(getDefaultPlans());
    setLoading(false);
  }, [billingPeriod]); // Refetch when billing period changes to update prices

  // Default plans as fallback
  const getDefaultPlans = (): PricePlan[] => [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      features: [
        '3 threads per day',
        'Basic thread formatting',
        'Copy to clipboard',
      ],
      dailyLimit: 3,
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'For casual content creators',
      price: 9.99,
      features: [
        '15 threads per day',
        'Advanced formatting options',
        'Export as .txt',
        'Thread history',
        'Email support',
      ],
      dailyLimit: 15,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For serious content creators',
      price: 9.99,
      features: [
        '30 threads per day',
        'All basic features',
        'Thread scheduling',
        'Analytics',
        'Priority support',
      ],
      dailyLimit: 30,
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For power users and teams',
      price: 9.99,
      features: [
        'Unlimited threads',
        'All pro features',
        'Team collaboration',
        'Custom templates',
        'Dedicated support',
        'API access',
      ],
      dailyLimit: 999,
    },
  ];

  const handleSubscribe = (plan: PricePlan) => {
    // Free plan doesn't need payment
    if (plan.id === 'free') {
      console.log('Signed up for free plan');
      return;
    }
    
    // Set the selected plan and show payment modal
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <span>Loading plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Upgrade to premium for unlimited threads and advanced features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-white mb-1">$0</div>
              <div className="text-gray-400">per month</div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                3 threads per day
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic templates
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Community support
              </li>
            </ul>
            
            <button
              disabled
              className="w-full bg-gray-700 text-gray-400 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/50 rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Premium</h3>
              <div className="text-3xl font-bold text-white mb-1">$9.99</div>
              <div className="text-gray-400">per month</div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited threads
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Premium templates
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced analytics
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
            </ul>
            
            {isPremium ? (
              <button
                disabled
                className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
              >
                ✓ Current Plan
              </button>
            ) : (
              <UpgradeButton 
                className="w-full" 
                price={9.99}
              />
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={(selectedPlan.id === 'premium' ? 'enterprise' : selectedPlan.id) as 'pro' | 'business' | 'enterprise'}
        />
      )}
    </div>
  );
} 