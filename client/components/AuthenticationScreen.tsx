import React, { useState } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { User, LogIn, Mail, Lock, Loader2, AlertCircle, UserPlus } from 'lucide-react';

export function AuthenticationScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    signIn,
    signUp,
    clearError
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isSignUp) {
      const result = await signUp(email, password, username);
      if (result?.needsEmailConfirmation) {
        setShowEmailConfirmation(true);
      }
    } else {
      await signIn(email, password);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Check Your Email</h1>
          <p className="text-gray-300 mb-8">
            We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-md w-full mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          {isSignUp ? (
            <UserPlus className="w-10 h-10 text-white" />
          ) : (
            <LogIn className="w-10 h-10 text-white" />
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        
        <p className="text-gray-300 mb-8 text-center">
          {isSignUp 
            ? 'Join ThreadFlowPro to start creating viral threads' 
            : 'Sign in to access your ThreadFlowPro account'}
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your username"
                />
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : isSignUp ? (
              <UserPlus className="w-5 h-5 mr-2" />
            ) : (
              <LogIn className="w-5 h-5 mr-2" />
            )}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-gray-400 hover:text-purple-400 text-sm font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
} 