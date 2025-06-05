import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

interface RequireAuthProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

export function RequireAuth({ children, requirePremium = false }: RequireAuthProps) {
  const { isLoaded, isAuthenticated, isPremium } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to sign-in
  if (!isAuthenticated) {
    // Save the current location for redirect after sign-in
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If premium is required but user doesn't have it
  if (requirePremium && !isPremium()) {
    toast({
      title: 'Premium Required',
      description: 'This feature requires a premium subscription.',
      variant: 'destructive',
    });
    
    // Redirect to pricing page
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
} 