import React, { useEffect } from 'react';
import { useAuth } from './Auth/AuthProvider';
import { LogIn, User, LogOut, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export const ConnectButton: React.FC = () => {
  const { user, dbUser, isLoaded, signOut } = useAuth();

  // Debug logging
  useEffect(() => {
    if (isLoaded) {
      console.log('ConnectButton: Auth loaded with user data:', { user, dbUser });
    }
  }, [isLoaded, user, dbUser]);

  if (!isLoaded) {
    return (
      <button 
        disabled
        className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  if (user) {
    // Get username from email or user ID
    const displayName = dbUser?.email ? 
      dbUser.email.split('@')[0] : 
      `User ${user.id.substring(0, 6)}`;
      
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <a className="hidden sm:flex items-center px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200">
            <User className="w-4 h-4 mr-2" />
            {displayName}
          </a>
        </Link>
        <button 
          onClick={signOut}
          className="px-4 py-2 bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 rounded-lg font-medium transition-all duration-200 flex items-center"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <Link href="/sign-in">
      <a className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
        <LogIn className="w-5 h-5" />
        <span>Sign In</span>
      </a>
    </Link>
  );
}

export default ConnectButton; 