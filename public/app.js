// Legacy compatibility layer for app.js
// This file provides backward compatibility while the new modular system loads

console.log('Loading modular Pixel Ponies application...');

// Provide basic error handling until modules load
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});

// Show loading message
document.addEventListener('DOMContentLoaded', () => {
    const raceStatus = document.getElementById('raceStatus');
    if (raceStatus) {
        raceStatus.textContent = 'Loading Pixel Ponies...';
    }
});

// Export empty object for any legacy references
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}