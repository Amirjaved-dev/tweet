import { SignIn } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export default function ClerkSignIn() {
  const [currentDomain, setCurrentDomain] = useState<string>('');

  // Get the current domain for callback URLs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.origin);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            ThreadNova
          </h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>
        
        {/* Clerk Sign In Component */}
        <SignIn 
          routing="path"
          path="/sign-in"
          signUpUrl={`${currentDomain}/sign-up` || '/sign-up'}
          afterSignInUrl={`${currentDomain}/dashboard` || '/dashboard'}
        />
      </div>
    </div>
  );
} 