// Web3 Polyfill - Fix compatibility issues with browser
(function() {
  try {
    // Polyfill Buffer
    if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
      window.Buffer = {
        from: function(data, encoding) {
          if (encoding === 'hex') {
            return data;
          }
          return data;
        },
        isBuffer: function() {
          return false;
        },
        alloc: function() {
          return {};
        }
      };
    }
    
    // Polyfill process for dependencies
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
    
    // Fix ethereum property conflict that some providers might have
    if (typeof window !== 'undefined' && window.ethereum) {
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
    }
    
    console.log('Web3 polyfills loaded successfully');
  } catch (error) {
    console.error('Error initializing Web3 polyfills:', error);
  }
})(); 