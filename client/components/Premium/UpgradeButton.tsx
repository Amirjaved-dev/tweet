import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '../../src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Sparkles, Zap, Trophy, Star } from 'lucide-react';
import { userService } from '../../lib/supabaseClient';
import { useToast } from '../../src/hooks/use-toast';

interface UpgradeButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showFeatures?: boolean;
  price?: number;
}

export default function UpgradeButton({ 
  className = '', 
  variant = 'default', 
  size = 'default',
  showFeatures = false,
  price = 9.99
}: UpgradeButtonProps) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check user plan status
  useEffect(() => {
    const checkUserPlan = async () => {
      if (isLoaded && user) {
        try {
          const dbUser = await userService.getUserByClerkId(user.id);
          setIsPremium(dbUser?.is_premium === true || dbUser?.plan === 'premium');
        } catch (error) {
          console.error('Error checking plan status:', error);
        } finally {
          setPlanLoading(false);
        }
      } else if (isLoaded) {
        // User is not logged in
        setPlanLoading(false);
      }
    };
    
    checkUserPlan();
  }, [isLoaded, user]);

  const premiumFeatures = [
    { icon: Zap, text: 'Unlimited thread generation' },
    { icon: Sparkles, text: 'Advanced AI models' },
    { icon: Trophy, text: 'Priority support' },
    { icon: Star, text: 'Premium templates' },
  ];

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get Clerk session token
      let token;
      try {
        token = await getToken();
        if (!token) {
          throw new Error("Unable to get authentication token");
        }
      } catch (authError) {
        console.error('Auth token error:', authError);
        throw new Error("Authentication failed. Please try signing out and back in.");
      }

      // Store payment attempt information in localStorage
      localStorage.setItem('paymentAttemptInProgress', 'true');
      localStorage.setItem('lastPaymentUserId', user.id);
      localStorage.setItem('lastPaymentPlanId', 'premium');
      localStorage.setItem('lastPaymentBillingPeriod', 'monthly');
      localStorage.setItem('lastPaymentDate', new Date().toISOString());

      // Create payment session
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planPrice: price
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment creation failed:', errorData);
        
        throw new Error(errorData.message || errorData.error || 'Failed to create payment');
      }

      const paymentData = await response.json();
      console.log('Payment session created:', paymentData);
      
      // Store the charge ID for later verification
      if (paymentData.charge_id) {
        localStorage.setItem('lastPaymentChargeId', paymentData.charge_id);
      }
      
      // Redirect to Coinbase Commerce checkout
      window.location.href = paymentData.checkout_url;

    } catch (err) {
      console.error('Error during payment setup:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Clear payment attempt data in case of error
      localStorage.removeItem('paymentAttemptInProgress');
      
      toast({
        title: "Payment Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || planLoading) {
    return (
      <Button disabled className={className} variant={variant} size={size}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (isPremium) {
    return (
      <Badge variant="secondary" className={`${className} gap-2`}>
        <Sparkles className="h-4 w-4" />
        Premium Active
      </Badge>
    );
  }

  if (showFeatures) {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Upgrade to Premium
          </CardTitle>
          <CardDescription>
            Unlock powerful features with crypto payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <feature.icon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-2">
            <div className="text-center mb-3">
              <span className="text-2xl font-bold">${price}</span>
              <span className="text-sm text-muted-foreground ml-2">USD (via crypto)</span>
            </div>
            
            <Button 
              onClick={handleUpgrade} 
              disabled={isLoading} 
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Pay with Crypto
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-red-500 text-center mt-2">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Button 
      onClick={handleUpgrade} 
      disabled={isLoading} 
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </>
      )}
    </Button>
  );
} 