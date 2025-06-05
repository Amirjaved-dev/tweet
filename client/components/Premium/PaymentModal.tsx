import { useState } from 'react';
import PaymentProcessor from './PaymentProcessor';

interface PlanType {
  id: string;
  name: string;
  price: number;
  features: string[];
  dailyLimit: number;
  popular?: boolean;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanType;
  billingPeriod: 'monthly' | 'yearly';
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  selectedPlan, 
  billingPeriod 
}: PaymentModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePaymentComplete = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
      window.location.href = '/dashboard';
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="green" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for upgrading to ThreadFlow Pro. Your account has been upgraded.
            </p>
            <div className="animate-pulse">Redirecting to dashboard...</div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Upgrade to {selectedPlan.name}</h2>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <PaymentProcessor 
              planId={selectedPlan.id}
              planName={selectedPlan.name}
              planPrice={selectedPlan.price}
              billingPeriod={billingPeriod}
              onPaymentComplete={handlePaymentComplete}
              onPaymentCancel={onClose}
            />
          </>
        )}
      </div>
    </div>
  );
} 