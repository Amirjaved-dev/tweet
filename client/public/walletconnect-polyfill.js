// WalletConnect Polyfill - Fixes issues with browser compatibility
(function() {
  try {
    // Fix ethereum property conflict
    const originalEthereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    
    if (originalEthereumDescriptor) {
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        enumerable: true,
        get: originalEthereumDescriptor.get || (() => originalEthereumDescriptor.value),
        set: function(newValue) {
          Object.defineProperty(window, 'ethereum', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: newValue
          });
        }
      });
    }
    
    // Polyfill Buffer if needed
    if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
      window.Buffer = {
        from: function(data) {
          return data;
        },
        isBuffer: function() {
          return false;
        }
      };
    }
    
    // Polyfill process for some WalletConnect dependencies
    if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
      window.process = {
        env: { 
          NODE_ENV: 'production',
          DEBUG: undefined
        },
        version: '',
        nextTick: function(cb) { setTimeout(cb, 0); }
      };
    }
    
    console.log('WalletConnect polyfills loaded successfully');
  } catch (error) {
    console.error('Error initializing WalletConnect polyfills:', error);
  }
})(); 