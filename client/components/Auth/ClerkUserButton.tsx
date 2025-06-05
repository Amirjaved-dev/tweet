import { UserButton } from '@clerk/clerk-react';

export default function ClerkUserButton() {
  return (
    <UserButton 
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8',
          userButtonPopoverCard: 'bg-gray-900 border border-gray-700',
          userButtonPopoverActionButton: 'text-white hover:bg-gray-800',
          userButtonPopoverActionButtonText: 'text-white',
          userButtonPopoverFooter: 'hidden', // Hide Clerk branding
        },
        variables: {
          colorBackground: '#111827',
          colorInputBackground: '#1f2937',
          colorText: '#ffffff',
          colorTextSecondary: '#9ca3af',
          colorPrimary: '#8b5cf6',
        },
      }}
      afterSignOutUrl="/"
    />
  );
} 