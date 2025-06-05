import { useEffect } from 'react';
import { useNavigate } from 'wouter';
import { X, ArrowRight } from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Clean up payment attempt data
    localStorage.removeItem('paymentAttemptInProgress');
    localStorage.removeItem('lastPaymentUserId');
    
    // We don't remove charge-specific data as it might be used
    // if the user returns to complete the payment
  }, []);
  
  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">Payment Cancelled</h2>
            <p className="mt-2 text-gray-400 text-center max-w-md">
              Your payment process was cancelled. No payment has been processed and your account status remains unchanged.
            </p>
            
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                View Plans
                <ArrowRight className="ml-2 -mr-1 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 