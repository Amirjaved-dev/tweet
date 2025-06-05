import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../components/Auth/AuthProvider';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [autoVerifying, setAutoVerifying] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  
  const chargeId = searchParams.get('charge_id');
  const plan = searchParams.get('plan') || 'premium';

  // Auto-verification effect
  useEffect(() => {
    if (!chargeId || !autoVerifying) return;

    const checkPaymentStatus = async () => {
      try {
        console.log(`🔍 Auto-checking payment status (attempt ${checkCount + 1})`);
        
        const response = await fetch('/api/payment/verify-manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chargeId }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.user?.is_premium) {
          console.log('✅ Auto-verification successful!');
          setVerificationMessage('✅ Payment verified automatically! Your account has been upgraded to premium.');
          setAutoVerifying(false);
          
          // Clear any payment tracking
          localStorage.removeItem('paymentAttemptInProgress');
          localStorage.removeItem('lastPaymentChargeId');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          console.log(`⏳ Payment still pending (attempt ${checkCount + 1})`);
          setCheckCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Auto-verification error:', error);
        setCheckCount(prev => prev + 1);
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Stop auto-checking after 10 attempts (5 minutes)
    if (checkCount >= 10) {
      setAutoVerifying(false);
      setVerificationMessage('⏳ Payment is taking longer than expected. You can try manual verification below.');
      return;
    }

    // Check every 30 seconds
    const interval = setTimeout(() => {
      checkPaymentStatus();
    }, 30000);

    return () => clearTimeout(interval);
  }, [chargeId, autoVerifying, checkCount, navigate]);

  const handleManualVerification = async () => {
    if (!chargeId) {
      setVerificationMessage('No charge ID found. Please try creating a new payment.');
      return;
    }

    setVerifying(true);
    setVerificationMessage('Verifying your payment...');

    try {
      const response = await fetch('/api/payment/verify-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chargeId }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationMessage('✅ Payment verified successfully! Your account has been upgraded to premium.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setVerificationMessage(`❌ Verification failed: ${data.error}`);
      }
    } catch (error) {
      setVerificationMessage('❌ Error verifying payment. Please try again.');
      console.error('Manual verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Completed!</h1>
          <p className="text-white/80 mb-6">
            Thank you for your payment. We're processing your upgrade to {plan} plan.
          </p>

          {/* Auto-verification status */}
          {autoVerifying && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                <p className="text-blue-300 font-medium">Auto-verifying payment...</p>
              </div>
              <p className="text-blue-200/80 text-sm">
                Checking payment status (attempt {checkCount + 1}/10)
              </p>
            </div>
          )}

          {/* Verification message */}
          {verificationMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              verificationMessage.includes('✅') 
                ? 'bg-green-500/10 border-green-500/20 text-green-300' 
                : verificationMessage.includes('❌')
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
            }`}>
              <p className="text-sm">{verificationMessage}</p>
            </div>
          )}

          {chargeId && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/60 mb-2">Charge ID:</p>
              <p className="text-xs text-white/80 font-mono break-all">{chargeId}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>

            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
            >
              View Plans
            </button>

            {chargeId && (
              <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h3 className="text-white font-medium mb-2">Payment Not Reflecting?</h3>
                <p className="text-white/80 text-sm mb-4">
                  If your account hasn't been upgraded yet, you can manually verify your payment:
                </p>
                <button
                  onClick={handleManualVerification}
                  disabled={verifying}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  {verifying ? 'Verifying...' : 'Verify Payment Manually'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess; 