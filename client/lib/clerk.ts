import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';

// Clerk configuration with fallback for development
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                       import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Default key for development environments
const devFallbackKey = 'pk_test_Z3JlYXQtZ3J1Yi01MC5jbGVyay5hY2NvdW50cy5kZXYk';

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development' || 
                     import.meta.env.DEV === true;

export const clerkPublishableKey = publishableKey || 
                                   (isDevelopment ? devFallbackKey : undefined);

if (!clerkPublishableKey) {
  console.error('Missing Clerk publishable key. Authentication will not work.');
} else if (!publishableKey && isDevelopment) {
  console.warn('Using development fallback for Clerk publishable key');
}

export const clerkSignInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL || '/sign-in';
export const clerkSignUpUrl = import.meta.env.VITE_CLERK_SIGN_UP_URL || '/sign-up';
export const clerkAfterSignInUrl = import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard';
export const clerkAfterSignUpUrl = import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard'; 