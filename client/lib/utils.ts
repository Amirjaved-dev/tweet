import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility functions for Web3 and wallet interactions
 */

/**
 * Checks if the current environment supports Web3 wallets
 */
export const isWeb3Supported = (): boolean => {
  try {
    // Check if running in a browser context
    if (typeof window === 'undefined') return false;
    
    // Check if window.ethereum is available or could be made available
    const hasEthereum = typeof window.ethereum !== 'undefined' || 
                       (window as any).web3 !== undefined || 
                       navigator.userAgent.includes('MetaMask');
    
    // Check if the device is likely mobile with wallet capabilities
    const isMobileWithWallets = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Modern browsers with extension support
    const hasModernBrowser = typeof navigator !== 'undefined' && 
                            typeof navigator.serviceWorker !== 'undefined';
    
    return hasEthereum || isMobileWithWallets || hasModernBrowser;
  } catch (error) {
    console.warn('Error checking Web3 support:', error);
    return false;
  }
};

/**
 * Gets a shortened display address from a full wallet address
 */
export const formatDisplayAddress = (address: string | undefined): string => {
  if (!address) return 'Unknown';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Detects if a known wallet is installed
 */
export const detectInstalledWallet = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    // Check for MetaMask
    if ((window as any).ethereum?.isMetaMask) return 'MetaMask';
    
    // Check for Coinbase Wallet
    if ((window as any).ethereum?.isCoinbaseWallet) return 'Coinbase Wallet';
    
    // Check for Trust Wallet
    if ((window as any).ethereum?.isTrust) return 'Trust Wallet';
    
    // Check for generic injected provider
    if (typeof (window as any).ethereum !== 'undefined') return 'Browser Wallet';
    
    return null;
  } catch (error) {
    console.warn('Error detecting wallet:', error);
    return null;
  }
}; 