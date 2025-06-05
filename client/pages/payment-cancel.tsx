import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

export default function PaymentCancelPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clean up payment attempt data
    localStorage.removeItem('paymentAttemptInProgress');
    localStorage.removeItem('lastPaymentUserId');
    
    // We don't remove charge-specific data as it might be used
    // if the user returns to complete the payment
  }, []);

  const handleRetry = () => {
    setLocation('/pricing');
  };

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center">
              <X className="w-10 h-10 text-amber-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Cancelled
            </h1>
            
            <div className="text-gray-300 mb-6">
              <p className="mb-2">Your payment process was cancelled.</p>
              <p>No charges were made to your account.</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              <span>Try Again</span>
              <ArrowRight className="ml-2 -mr-1 w-4 h-4" />
            </button>
            
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 