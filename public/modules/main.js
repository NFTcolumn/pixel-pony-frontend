// Main Application Module - Coordination and Initialization
import gameState from './state.js';
import WalletManager from './wallet.js';
import RacingManager from './racing.js';
import DemoManager from './demo.js';
import UIManager from './ui.js';

class Application {
    constructor() {
        this.walletManager = null;
        this.racingManager = null;
        this.demoManager = null;
        this.uiManager = null;
    }

    // Initialize the application
    async initialize() {
        try {
            // Check for ethers availability
            if (typeof ethers === 'undefined') {
                console.error('Ethers.js failed to load');
                this.showError('Failed to load required libraries. Please refresh the page.');
                return;
            }

            // Initialize managers
            this.walletManager = new WalletManager();
            this.racingManager = new RacingManager();
            this.demoManager = new DemoManager();
            this.uiManager = new UIManager();

            // Make managers globally available
            window.walletManager = this.walletManager;
            window.racingManager = this.racingManager;
            window.demoManager = this.demoManager;
            window.uiManager = this.uiManager;

            // Always start the demo race
            this.demoManager.startDemoMode();
            
            // Initialize betting interface
            this.uiManager.initializeBettingInterface();
            
            // Try to initialize contracts in the background (non-blocking)
            this.initializeContractsBackground();

        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    // Contract initialization (non-blocking background process)
    async initializeContractsBackground() {
        // Wait for page to fully load and wallet injection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Don't show errors immediately - this runs in background
        if (typeof window.ethereum === 'undefined') {
            console.log('MetaMask not detected after initial delay - staying in demo mode');
            return;
        }
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check network with timeout
            const networkPromise = provider.getNetwork();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Network check timeout')), 3000);
            });
            
            const network = await Promise.race([networkPromise, timeoutPromise]);
            console.log('Connected to network:', network.chainId);
            
            if (network.chainId !== 11155111) {
                console.log(`Wrong network detected: ${network.chainId}. Need 11155111 for Ethereum Sepolia.`);
                console.log('Please switch to Ethereum Sepolia to use the game. Staying in demo mode.');
                // Don't show error immediately, let them explore demo first
                return;
            }

            // Don't auto-connect - let user click "Connect Wallet" button
            console.log('Ethereum Sepolia detected. Click "Connect Wallet" to play with real tokens!');
            
        } catch (error) {
            console.error('Error initializing contracts:', error);
            console.log('Could not connect to blockchain - staying in demo mode');
        }
    }

    // Show error message
    showError(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = message;
        
        const container = document.querySelector('.container');
        const main = document.querySelector('main');
        if (container && main) {
            container.insertBefore(div, main);
        } else {
            document.body.appendChild(div);
        }
        
        setTimeout(() => div.remove(), 8000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new Application();
    await app.initialize();
});

export default Application;