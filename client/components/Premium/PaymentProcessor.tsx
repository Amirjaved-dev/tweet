import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

interface PaymentProcessorProps {
  planId: string;
  planName: string;
  planPrice: number;
  billingPeriod: 'monthly' | 'yearly';
  onPaymentComplete?: () => void;
  onPaymentCancel?: () => void;
}

export default function PaymentProcessor({
  planId,
  planName,
  planPrice,
  billingPeriod,
  onPaymentComplete,
  onPaymentCancel
}: PaymentProcessorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cryptocurrency'>('credit_card');
  const { userId } = useAuth();

  const handlePayment = async () => {
    if (!userId) {
      console.error("User ID is required for payment processing");
      return;
    }

    setIsLoading(true);

    try {
      if (paymentMethod === 'cryptocurrency') {
        await handleCryptoPayment();
      } else {
        await handleCreditCardPayment();
      }
    } catch (error) {
      console.error(`Payment error: ${error}`);
      setIsLoading(false);
    }
  };

  const handleCryptoPayment = async () => {
    try {
      console.log("Creating Coinbase Commerce charge...");
      
      // Set a flag that we're attempting payment - this helps recovery if redirect fails
      localStorage.setItem('paymentAttemptInProgress', Date.now().toString());
      localStorage.setItem('lastPaymentUserId', userId || '');
      
      // Get the current origin for redirect URLs
      const origin = window.location.origin;
      
      // Create a charge with Coinbase Commerce
      const response = await axios.post('/api/payment/coinbase/create-charge', {
        clerkUserId: userId,
        plan: planId,
        planPrice,
        billingPeriod,
        redirectUrl: `${origin}/payment-success`,
        cancelUrl: `${origin}/payment-cancel`
      });

      console.log("Coinbase Commerce response:", response.data);

      if (response.data?.hosted_url) {
        // Save payment information for verification
        localStorage.setItem('lastPaymentChargeId', response.data.id);
        localStorage.setItem('lastPaymentPlanId', planId);
        localStorage.setItem('lastPaymentBillingPeriod', billingPeriod);
        localStorage.setItem('lastPaymentDate', new Date().toISOString());
        
        // Redirect to Coinbase Commerce checkout
        window.location.href = response.data.hosted_url;
      } else {
        throw new Error("Failed to create payment charge");
      }
    } catch (error) {
      console.error("Error creating cryptocurrency payment:", error);
      setIsLoading(false);
      
      // Clear payment attempt flag since it failed
      localStorage.removeItem('paymentAttemptInProgress');
      localStorage.removeItem('lastPaymentUserId');
      localStorage.removeItem('lastPaymentChargeId');
      localStorage.removeItem('lastPaymentPlanId');
      localStorage.removeItem('lastPaymentBillingPeriod');
      localStorage.removeItem('lastPaymentDate');
      
      throw error;
    }
  };

  const handleCreditCardPayment = async () => {
    // This would normally integrate with Stripe
    alert("Credit card payments are currently in development");
    setIsLoading(false);
  };

  return (
    <div className="p-6 bg-background rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-6">Choose Payment Method</h2>
      
      {/* Payment Method Selection */}
      <div className="mb-6">
        <div className="space-y-4">
          {/* Credit Card Option */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              className="mr-3 h-4 w-4 text-primary"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
            />
            <div className="flex items-center">
              <span className="h-6 w-6 mr-2 flex items-center justify-center text-muted-foreground">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <span>Credit Card (Stripe)</span>
            </div>
          </label>

          {/* Cryptocurrency Option */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              className="mr-3 h-4 w-4 text-primary"
              checked={paymentMethod === 'cryptocurrency'}
              onChange={() => setPaymentMethod('cryptocurrency')}
            />
            <div className="flex items-center">
              <span className="h-6 w-6 mr-2 flex items-center justify-center text-amber-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 2h5M9.5 22h5M17 7.5c0-3.5-2-5.5-5-5.5s-5 2-5 5.5c0 5 10 5 10 10 0 3.5-2 5.5-5 5.5s-5-2-5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Cryptocurrency (Coinbase)</span>
            </div>
          </label>
        </div>
      </div>

      {/* Cryptocurrency Payment Info */}
      {paymentMethod === 'cryptocurrency' && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg text-sm">
          <p className="text-amber-800 mb-2">
            Pay with Bitcoin, Ethereum, Litecoin, and other cryptocurrencies. You'll be redirected to Coinbase Commerce to complete your payment.
          </p>
          <div className="flex items-center mt-2">
            <div className="text-amber-700 bg-amber-100 p-1 rounded mr-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.5 2h5M9.5 22h5M17 7.5c0-3.5-2-5.5-5-5.5s-5 2-5 5.5c0 5 10 5 10 10 0 3.5-2 5.5-5 5.5s-5-2-5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-amber-800">Crypto payments processed by Coinbase Commerce</span>
          </div>
        </div>
      )}

      {/* Plan Summary */}
      <div className="mb-6 p-4 bg-accent/40 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">{planName} Plan</span>
          <span className="font-bold">${planPrice}/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {planId === 'premium' ? 'Unlimited threads' : '15 threads per day'} + premium features
        </p>
      </div>

      {/* Security Note */}
      <div className="flex items-center text-xs text-muted-foreground mb-6">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0110 0v4"></path>
        </svg>
        <span className="ml-2">Secure payment processing. Your payment information is never stored on our servers.</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Pay $${planPrice}/${billingPeriod === 'monthly' ? 'month' : 'year'}`
          )}
        </button>
        <button
          onClick={onPaymentCancel}
          disabled={isLoading}
          className="w-full py-2 text-sm text-muted-foreground rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 