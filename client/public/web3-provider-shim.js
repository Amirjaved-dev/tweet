// This script helps prevent conflicts between browser extensions and WalletConnect
(function() {
  try {
    // Store original ethereum property if it exists
    const originalEthereum = window.ethereum;
    
    // Make ethereum property configurable
    if (originalEthereum) {
      delete window.ethereum;
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: originalEthereum
      });
    }
    
    // Add event to handle potential WalletConnect errors
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('ethereum')) {
        console.log('Handled ethereum property error');
        event.preventDefault();
        event.stopPropagation();
      }
    });
    
    console.log('Web3 provider shim initialized successfully');
  } catch (error) {
    console.error('Error initializing Web3 provider shim:', error);
  }
})(); 