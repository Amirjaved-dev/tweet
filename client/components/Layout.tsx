import { ReactNode, useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import Navigation from './Navigation';
import { Link, useLocation } from 'wouter';
import AutoPaymentVerifier from './AutoPaymentVerifier';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isHomePage = location === '/';

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <AutoPaymentVerifier />
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        {!isHomePage && (
          <footer className="bg-black/80 border-t border-purple-500/20">
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <a href="https://threadnova.xyz/" className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 grid place-items-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex-shrink-0 shadow-md">
                      <div className="w-5 h-5 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                          <path d="M12 8v8" />
                          <path d="m15 11-3-3-3 3" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Thread Nova</span>
                  </a>
                  <p className="text-gray-400 text-sm mb-4">
                    Generate viral crypto & Web3 threads for X with AI that speaks the language of the blockchain community.
                  </p>
                  <div className="flex space-x-4">
                    <a href="https://twitter.com/threadnova" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </a>
                    <a href="https://discord.gg/threadnova" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
                        <path d="M15 11.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
                        <path d="M18 3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7l-3 3v-4a3 3 0 0 1-1-2.236V6a3 3 0 0 1 3-3h12Z" />
                      </svg>
                    </a>
                    <a href="https://github.com/threadnova" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                        <path d="M9 18c-4.51 2-5-2-7-2"/>
                      </svg>
                    </a>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-4">Product</h3>
                  <ul className="space-y-2">
                    <li><Link href="/"><a className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Home</a></Link></li>
                    <li><Link href="/pricing"><a className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Pricing</a></Link></li>
                    <li><Link href="/dashboard"><a className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Dashboard</a></Link></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-4">Resources</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Crypto Writing Guide</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Web3 Growth Playbook</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">NFT Marketing Strategies</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">DeFi Explanation Templates</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-4">Join Our Community</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Join thousands of Web3 creators sharing insights and growing together.
                  </p>
                  <a href="mailto:niceearn7@gmail.com" className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors">
                    niceearn7@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="border-t border-purple-500/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm">
                  © {new Date().getFullYear()} Thread Nova. All rights reserved.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <a href="#" className="text-gray-500 text-xs hover:text-purple-400 transition-colors">Privacy</a>
                  <a href="#" className="text-gray-500 text-xs hover:text-purple-400 transition-colors">Terms</a>
                  <a href="#" className="text-gray-500 text-xs hover:text-purple-400 transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </ThemeProvider>
  );
} 