import { useAuth } from '@clerk/clerk-react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ClerkProtectedRouteProps {
  children: React.ReactNode;
}

export default function ClerkProtectedRoute({ children }: ClerkProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation('/sign-in');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
} 