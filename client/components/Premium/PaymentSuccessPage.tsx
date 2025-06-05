import { useEffect, useState } from 'react';
import { useNavigate } from 'wouter';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Check, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment details from localStorage
        const chargeId = localStorage.getItem('lastPaymentChargeId');
        const planId = localStorage.getItem('lastPaymentPlanId');
        const billingPeriod = localStorage.getItem('lastPaymentBillingPeriod');
        const attemptId = localStorage.getItem('paymentAttemptInProgress');
        const storedUserId = localStorage.getItem('lastPaymentUserId');
        
        if (!chargeId || !userId || !planId) {
          console.error('Missing payment information');
          setStatus('error');
          setErrorMessage('Payment information not found');
          return;
        }
        
        // Verify that the payment is for the logged-in user
        if (storedUserId !== userId) {
          console.error('User mismatch in payment verification');
          setStatus('error');
          setErrorMessage('User mismatch in payment verification');
          return;
        }

        console.log('Verifying payment:', { chargeId, planId, billingPeriod });
        
        // Verify the charge status with Coinbase
        const chargeResponse = await axios.get(`/api/payment/coinbase/charge/${chargeId}`);
        
        if (!chargeResponse.data.success) {
          throw new Error('Failed to verify payment');
        }
        
        const charge = chargeResponse.data.charge;
        
        // If payment is confirmed, activate the subscription
        if (charge.timeline.some(event => event.status === 'COMPLETED')) {
          // Activate the subscription
          const activateResponse = await axios.post('/api/payment/activate-subscription', {
            userId,
            sessionId: chargeId,
            planId,
            planType: planId,
            billingPeriod: billingPeriod || 'monthly',
          });
          
          if (activateResponse.data.success) {
            setStatus('success');
            
            // Clear payment data from localStorage
            localStorage.removeItem('lastPaymentChargeId');
            localStorage.removeItem('lastPaymentPlanId');
            localStorage.removeItem('lastPaymentBillingPeriod');
            localStorage.removeItem('paymentAttemptInProgress');
            localStorage.removeItem('lastPaymentUserId');
            localStorage.removeItem('lastPaymentDate');
          } else {
            throw new Error('Failed to activate subscription');
          }
        } else if (charge.timeline.some(event => ['EXPIRED', 'CANCELED'].includes(event.status))) {
          // Payment failed or was canceled
          setStatus('error');
          setErrorMessage('Payment was not completed');
        } else {
          // Payment is still pending
          setStatus('verifying');
          setErrorMessage('Payment is still being processed. Please check back later.');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setErrorMessage('Failed to verify payment status');
      } finally {
        setIsVerifying(false);
      }
    };

    if (userId) {
      verifyPayment();
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col items-center justify-center">
          {isVerifying ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 relative">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">Verifying Payment</h2>
              <p className="mt-2 text-gray-400">Please wait while we confirm your payment...</p>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">Payment Successful!</h2>
              <p className="mt-2 text-gray-400 text-center max-w-md">
                Your payment has been confirmed and your account has been upgraded. Thank you for your purchase!
              </p>
              
              <div className="mt-8">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 -mr-1 w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">Payment Verification Failed</h2>
              <p className="mt-2 text-gray-400 text-center max-w-md">
                {errorMessage || "We couldn't verify your payment. Please contact support if you believe this is an error."}
              </p>
              
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 