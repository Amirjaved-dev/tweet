import { Link } from 'wouter';
import { useState } from 'react';
import ClerkUserButton from './Auth/ClerkUserButton';
import { useAuth } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { Menu, X, BarChart3, Zap, Settings, User, MessageSquare } from 'lucide-react';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Define navigation items based on authentication status
  const publicNavItems = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/features', label: 'Features' },
    { href: '/faq', label: 'FAQ' }
  ];

  const dashboardNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/dashboard/new-thread', label: 'New Thread', icon: Zap },
    { href: '/dashboard/new-tweet', label: 'New Tweet', icon: MessageSquare },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings }
  ];

  const navItems = isLoaded && isSignedIn ? dashboardNavItems : publicNavItems;

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo and Brand */}
          <a href="/" className="flex items-center space-x-2">
            <img 
              src="/logo-64.png" 
              alt="ThreadFlowPro Logo" 
              className="w-10 h-10 flex-shrink-0 object-contain"
              onError={(e) => {
                // If the logo fails to load, try an alternative path or show a fallback
                console.error('Logo failed to load, trying alternative path');
                e.currentTarget.src = 'logo-64.png';
                e.currentTarget.onerror = (err) => {
                  console.error('Alternative logo path also failed');
                  // Show text fallback if both paths fail
                  e.currentTarget.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 grid place-items-center bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex-shrink-0 shadow-md';
                  fallback.innerHTML = '<div class="w-6 h-6 text-white font-bold">T</div>';
                  e.currentTarget.parentNode.insertBefore(fallback, e.currentTarget);
                };
              }}
            />
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">ThreadFlowPro</span>
          </a>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a className="text-gray-300 transition-colors hover:text-blue-400 flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        
        {/* User Menu */}
        <div className="hidden md:block">
          {isLoaded && isSignedIn ? (
            <ClerkUserButton />
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <a className="text-gray-300 hover:text-blue-400 transition-colors">
                  Sign In
                </a>
              </Link>
              <Link href="/sign-up">
                <a className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">
                  Get Started
                </a>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-white/10 absolute w-full z-50 shadow-xl">
          <div className="p-4 space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a 
                    className="block text-gray-300 py-2 hover:text-blue-400 transition-colors flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </a>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-white/10">
              {isLoaded && isSignedIn ? (
                <ClerkUserButton />
              ) : (
                <div className="space-y-2">
                  <Link href="/sign-in">
                    <a 
                      className="block text-gray-300 py-2 hover:text-blue-400 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </a>
                  </Link>
                  <Link href="/sign-up">
                    <a 
                      className="block bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 