import { useEffect, useState } from 'react';

export default function AutoPaymentVerifier() {
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  useEffect(() => {
    // Check if there's a payment in progress
    const checkPaymentStatus = () => {
      try {
        const paymentAttempt = localStorage.getItem('paymentAttemptInProgress');
        
        if (paymentAttempt) {
          // Parse the timestamp
          const timestamp = parseInt(paymentAttempt, 10);
          const now = Date.now();
          
          // If payment attempt is older than 30 minutes, clear it
          if (now - timestamp > 30 * 60 * 1000) {
            localStorage.removeItem('paymentAttemptInProgress');
            localStorage.removeItem('lastPaymentChargeId');
            setPaymentInProgress(false);
          } else {
            setPaymentInProgress(true);
          }
        } else {
          setPaymentInProgress(false);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };
    
    // Check immediately
    checkPaymentStatus();
    
    // Then check periodically
    const interval = setInterval(checkPaymentStatus, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // This component doesn't render anything visible
  // It just monitors payment status in the background
  return null;
} 