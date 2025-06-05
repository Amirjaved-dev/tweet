import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';
import { Check, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [userPlan, setUserPlan] = useState<string>('free');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPayment = async () => {
      if (!isLoaded || !user || !userId) {
        console.log('❌ User not loaded yet');
        return;
      }

      try {
        console.log('🔄 Processing payment for user:', userId);
        
        // First, try to activate payment via the backend
        const chargeId = localStorage.getItem('lastPaymentChargeId');
        const planId = localStorage.getItem('lastPaymentPlanId') || 'premium';
        const billingPeriod = localStorage.getItem('lastPaymentBillingPeriod') || 'monthly';
        
        if (chargeId) {
          console.log('💳 Found charge ID, activating subscription:', { chargeId, planId, billingPeriod });
          
          try {
          const activateResponse = await axios.post('/api/payment/activate-subscription', {
            userId,
            sessionId: chargeId,
              planId,
              planType: planId,
              billingPeriod,
              forceDbUpdate: true
          });
          
          if (activateResponse.data.success) {
              console.log('✅ Subscription activated successfully');
              setUserPlan(activateResponse.data.plan);
            setStatus('success');
              setMessage('Payment confirmed! Your account has been upgraded to premium.');
            
              // Clear payment localStorage
            localStorage.removeItem('lastPaymentChargeId');
            localStorage.removeItem('lastPaymentPlanId');
            localStorage.removeItem('lastPaymentBillingPeriod');
            localStorage.removeItem('paymentAttemptInProgress');
            localStorage.removeItem('lastPaymentUserId');
            localStorage.removeItem('lastPaymentDate');
            
              // Store premium status for immediate recognition
              localStorage.setItem('userSubscription', JSON.stringify({
                plan_id: planId,
                plan_type: planId,
                status: 'active',
                billing_period: billingPeriod,
                starts_at: new Date().toISOString(),
                ends_at: activateResponse.data.expires_at
              }));
              
              // Trigger UI refresh
              window.dispatchEvent(new Event('user-data-updated'));
              document.dispatchEvent(new Event('user-data-updated'));
              window.dispatchEvent(new Event('localStorageChange'));
              
              // Redirect to dashboard after 3 seconds
              setTimeout(() => {
                setLocation('/dashboard?upgraded=true');
              }, 3000);
              
              return;
            }
          } catch (activationError) {
            console.warn('⚠️ Activation API failed, checking database directly:', activationError);
          }
        }
        
        // Wait a bit for webhooks/background processes
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check current user status in database
        console.log('🔍 Checking user status in database...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();
        
        if (userError) {
          console.error('❌ Error checking user status:', userError);
          setStatus('error');
          setMessage('Unable to verify payment status. Please contact support.');
          return;
        }
        
        if (userData) {
          console.log('📊 Current user data:', userData);
          
          // Check if user is now premium
          const isPremium = userData.is_premium === true || 
                           userData.plan === 'premium' || 
                           userData.plan === 'pro' ||
                           userData.plan_status === 'premium';
          
          if (isPremium) {
            console.log('✅ User is premium in database');
            setUserPlan(userData.plan);
            setStatus('success');
            setMessage('Payment confirmed! Your account has been upgraded to premium.');
            
            // Store premium status
            localStorage.setItem('userSubscription', JSON.stringify({
              plan_id: userData.plan,
              plan_type: userData.plan,
              status: 'active',
              billing_period: 'monthly',
              starts_at: new Date().toISOString(),
              ends_at: userData.subscription_expires_at
            }));
            
            // Trigger UI refresh
            window.dispatchEvent(new Event('user-data-updated'));
            document.dispatchEvent(new Event('user-data-updated'));
            window.dispatchEvent(new Event('localStorageChange'));
            
            // Redirect after delay
            setTimeout(() => {
              setLocation('/dashboard?upgraded=true');
            }, 3000);
          } else {
            console.log('⚠️ User still shows as free plan, payment may be processing');
            setStatus('processing');
            setMessage('Payment is being processed. This may take a few minutes...');
            
            // Try again in 5 seconds
            setTimeout(() => {
              console.log('🔄 Retrying payment check...');
              processPayment();
            }, 5000);
          }
        }
        
      } catch (error) {
        console.error('❌ Payment processing error:', error);
        setStatus('error');
        setMessage('There was an issue processing your payment. Please contact support if you were charged.');
      } finally {
        setIsProcessing(false);
      }
    };

    // Start processing after component mounts
    if (isLoaded && user) {
      processPayment();
    }
  }, [isLoaded, user, userId]);

  const handleContinue = () => {
    setLocation('/dashboard');
  };

  const handleContactSupport = () => {
    window.open('mailto:niceearn7@gmail.com?subject=Payment%20Issue', '_blank');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg">
          
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'processing' && (
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"></div>
                <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                    </div>
                      </div>
                    )}
                    
            {status === 'error' && (
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-full"></div>
                <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              )}
          </div>

          {/* Status Message */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {status === 'processing' && 'Processing Payment'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'error' && 'Payment Issue'}
            </h1>
            
            <p className="text-gray-300">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-300 text-sm">
                  🎉 Welcome to <strong>{userPlan}</strong> plan! 
                  You now have access to all premium features.
                </p>
              </div>
            )}
              </div>
    
          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <button
                onClick={handleContinue}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                <span>Continue to Dashboard</span>
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            )}
            
            {status === 'error' && (
              <>
                <button
                  onClick={handleContactSupport}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Contact Support
                </button>
                
                <button
                  onClick={handleContinue}
                  className="w-full flex items-center justify-center px-4 py-3 border border-white/20 text-gray-300 font-medium rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  Go to Dashboard
                </button>
              </>
            )}
            
            {status === 'processing' && (
              <div className="text-center text-gray-400 text-sm">
                Please wait while we confirm your payment...
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
} 