// Simple error handler and conflict resolver
(function() {
    // Handle ethers loading
    window.addEventListener('error', function(e) {
        console.error('Loading error:', e.error);
        if (e.error && e.error.message && e.error.message.includes('ethers')) {
            setTimeout(function() {
                if (typeof ethers === 'undefined') {
                    document.body.innerHTML = `
                        <div style="padding: 20px; text-align: center; font-family: Arial;">
                            <h2>⚠️ Loading Error</h2>
                            <p>Failed to load Ethers.js library. Please refresh the page.</p>
                            <button onclick="location.reload()">Refresh Page</button>
                        </div>
                    `;
                }
            }, 2000);
        }
    });
    
    // Handle wallet conflicts - use a more gentle approach
    let cachedEthereum = null;
    
    // Cache the first ethereum provider we see
    if (typeof window.ethereum !== 'undefined') {
        cachedEthereum = window.ethereum;
        console.log('Cached ethereum provider:', cachedEthereum.constructor.name);
    }
    
    // Override with a getter that returns the cached version
    if (cachedEthereum) {
        try {
            Object.defineProperty(window, 'ethereum', {
                get: function() {
                    return cachedEthereum;
                },
                configurable: true
            });
        } catch (e) {
            // If we can't redefine it, that's okay
            console.warn('Could not prevent ethereum redefinition:', e.message);
        }
    }
})();