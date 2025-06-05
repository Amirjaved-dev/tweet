import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutGrid, PenTool, BarChart3, Settings, Menu } from 'lucide-react';

export default function DashboardNavigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
      active: location === '/dashboard',
    },
    {
      label: 'New Thread',
      href: '/dashboard/new-thread',
      icon: PenTool,
      active: location === '/dashboard/new-thread',
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      active: location === '/dashboard/analytics',
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      active: location === '/dashboard/settings',
    },
  ];

  return (
    <div className="bg-black/40 backdrop-blur-md border-r border-white/10">
      {/* Mobile menu toggle */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between md:hidden">
        <span className="font-bold text-white">Dashboard Menu</span>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Navigation menu - desktop always visible, mobile toggleable */}
      <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <ul className="px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
} 