import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';
import { 
  clerkPublishableKey, 
  clerkSignInUrl, 
  clerkSignUpUrl,
  clerkAfterSignInUrl,
  clerkAfterSignUpUrl
} from '../../lib/clerk';

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Show an error message if no key is available
  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="max-w-md w-full bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-red-500">Authentication Error</h2>
          <p className="mb-4">
            Missing Clerk publishable key. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkReactProvider 
      publishableKey={clerkPublishableKey}
      signInUrl={clerkSignInUrl}
      signUpUrl={clerkSignUpUrl}
      afterSignInUrl={clerkAfterSignInUrl}
      afterSignUpUrl={clerkAfterSignUpUrl}
      appearance={{
        variables: {
          colorPrimary: '#8B5CF6',
          colorBackground: '#111827',
          colorText: '#F9FAFB',
          colorInputBackground: '#1F2937',
          colorInputText: '#F9FAFB',
        },
        elements: {
          card: 'bg-gray-900 border border-gray-800',
          formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white',
          footer: 'hidden',
        }
      }}
    >
      {children}
    </ClerkReactProvider>
  );
} 