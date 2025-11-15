// Wallet Management Module
import gameState from './state.js';

class WalletManager {
    constructor() {
        this.setupEventListeners();
    }

    // Check if running in Farcaster miniapp
    isFarcasterMiniapp() {
        return typeof window.farcasterSdk !== 'undefined';
    }

    // Get Farcaster wallet provider
    async getFarcasterProvider() {
        const debug = (msg, isError = false) => {
            console.log(msg);
            if (window.showMobileDebug) window.showMobileDebug(msg, isError);
        };

        try {
            if (!window.farcasterSdk) {
                debug('❌ Farcaster SDK not available', true);
                return null;
            }

            debug('✅ Farcaster miniapp detected');

            // Get context and check user info
            const context = await window.farcasterSdk.context;
            debug('User FID: ' + (context.user?.fid || 'none'));
            console.log('Farcaster context:', context);

            // Check if wallet is available in SDK
            if (!window.farcasterSdk.wallet) {
                debug('❌ SDK.wallet not available', true);
                return null;
            }

            // Check wallet methods available
            const walletMethods = Object.keys(window.farcasterSdk.wallet);
            debug('Wallet methods: ' + walletMethods.join(', '));

            // Farcaster provides an EIP-1193 compatible provider via getEthereumProvider() method
            if (typeof window.farcasterSdk.wallet.getEthereumProvider !== 'function') {
                debug('❌ getEthereumProvider not a function', true);
                return null;
            }

            debug('Calling getEthereumProvider()...');
            const provider = await window.farcasterSdk.wallet.getEthereumProvider();

            if (provider) {
                debug('✅ Wallet provider obtained');
                debug('Provider type: ' + typeof provider);
                console.log('Provider details:', {
                    hasRequest: typeof provider.request === 'function',
                    hasOn: typeof provider.on === 'function',
                    isConnected: typeof provider.isConnected === 'function' ? provider.isConnected() : 'unknown'
                });
                return provider;
            }

            debug('❌ Provider is null/undefined', true);
            debug('Need wallet in Warpcast settings?', true);
            return null;
        } catch (error) {
            debug('❌ Error: ' + error.message, true);
            console.error('Error getting Farcaster provider:', error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }

    // Detect available wallet provider with modern wallet support
    async detectWalletProvider() {
        console.log('=== WALLET DETECTION DEBUG ===');

        // First check if running in Farcaster miniapp
        if (this.isFarcasterMiniapp()) {
            const farcasterProvider = await this.getFarcasterProvider();
            if (farcasterProvider) {
                return farcasterProvider;
            }
        }

        // Wait for wallet injection with multiple attempts
        for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise(resolve => setTimeout(resolve, attempt * 500));

            console.log(`Attempt ${attempt + 1}:`);
            console.log('window.ethereum exists:', typeof window.ethereum !== 'undefined');
            
            if (typeof window.ethereum !== 'undefined') {
                console.log('window.ethereum value:', window.ethereum);
                console.log('window.ethereum.isMetaMask:', window.ethereum.isMetaMask);
                console.log('window.ethereum.providers:', window.ethereum.providers);
                
                // If MetaMask is available directly
                if (window.ethereum.isMetaMask) {
                    console.log('✅ MetaMask detected directly');
                    return window.ethereum;
                }
                
                // If multiple providers, try to find MetaMask
                if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
                    console.log('Multiple providers found:', window.ethereum.providers.length);
                    const metamaskProvider = window.ethereum.providers.find(provider => provider.isMetaMask);
                    if (metamaskProvider) {
                        console.log('✅ MetaMask found in providers array');
                        return metamaskProvider;
                    }
                }
                
                // Check for other wallet indicators
                if (window.ethereum._metamask || 
                    (window.ethereum.request && window.ethereum.send) ||
                    window.ethereum.selectedAddress !== undefined) {
                    console.log('✅ Detected wallet via alternative properties');
                    return window.ethereum;
                }
                
                // Generic ethereum provider
                console.log('✅ Using generic ethereum provider');
                return window.ethereum;
            }
            
            // Check for specific wallet types
            if (window.coinbaseWalletExtension) {
                console.log('✅ Coinbase Wallet detected');
                return window.coinbaseWalletExtension;
            }
            
            if (window.trustWallet) {
                console.log('✅ Trust Wallet detected');
                return window.trustWallet;
            }
            
            if (window.okexchain) {
                console.log('✅ OKX Wallet detected');
                return window.okexchain;
            }
            
            if (window.web3 && window.web3.currentProvider) {
                console.log('✅ Legacy web3 provider detected');
                return window.web3.currentProvider;
            }
            
            // Check for wallet extension APIs
            if (window.walletLinkProvider) {
                console.log('✅ WalletLink provider detected');
                return window.walletLinkProvider;
            }
        }
        
        // Final debug info
        const walletKeys = Object.keys(window).filter(key => 
            key.toLowerCase().includes('eth') || 
            key.toLowerCase().includes('web3') || 
            key.toLowerCase().includes('meta') ||
            key.toLowerCase().includes('wallet') ||
            key.toLowerCase().includes('coin')
        );
        console.log('All wallet-related window properties:', walletKeys);
        
        console.log('❌ No wallet provider detected after all attempts');
        return null;
    }

    // Request account access with proper error handling
    async requestAccountAccess(walletProvider) {
        try {
            const accounts = await walletProvider.request({ 
                method: 'eth_requestAccounts' 
            });
            return accounts;
        } catch (error) {
            if (error.code === 4001) {
                this.showError('Please connect your wallet to continue');
                return null;
            } else if (error.code === -32002) {
                this.showError('Wallet connection request is already pending. Please check your wallet.');
                return null;
            } else {
                throw error;
            }
        }
    }

    // Handle network checking and switching
    async handleNetworkCheck() {
        try {
            const network = await gameState.provider.getNetwork();
            console.log('Connected to network:', network.chainId);

            // Accept Base mainnet and test networks
            const acceptedChainIds = [
                8453,     // Base Mainnet (PRIMARY NETWORK FOR THIS GAME)
                84532,    // Base Sepolia Testnet
                1,        // Ethereum Mainnet
                5,        // Goerli
                11155111, // Ethereum Sepolia
                1337,     // Hardhat
                31337     // Hardhat alternate
            ];

            if (!acceptedChainIds.includes(network.chainId)) {
                if (network.chainId === 1) {
                    this.showError(`You're on Ethereum Mainnet. Please switch to Base Network to play!`);
                } else {
                    this.showError(`Unsupported network (Chain ID: ${network.chainId}). Please switch to Base Network (8453).`);
                }
                return false;
            }

            // Warn if not on Base mainnet but allow to continue
            if (network.chainId !== 8453) {
                console.warn(`⚠️ Not on Base mainnet (8453). Current chain: ${network.chainId}`);
            }

            return true;
        } catch (error) {
            console.error('Network check failed:', error);
            this.showError('Unable to check network. Connection may be unstable.');
            return true; // Continue anyway
        }
    }

    // Enhanced wallet connection with multiple wallet support
    async connectWallet() {
        try {
            // Check for wallet availability
            const walletProvider = await this.detectWalletProvider();
            if (!walletProvider) {
                this.showWalletInstallationMessage();
                return;
            }
            
            // Request account access with better error handling
            const accounts = await this.requestAccountAccess(walletProvider);
            if (!accounts || accounts.length === 0) {
                this.showError('No accounts found. Please make sure your wallet is unlocked.');
                return;
            }
            
            // Create provider and get signer
            const provider = new ethers.providers.Web3Provider(walletProvider);
            const signer = provider.getSigner();
            const userAddress = accounts[0];
            
            // Update state
            gameState.setBlockchainState({ provider, signer, userAddress });
            
            // Check and handle network
            const networkResult = await this.handleNetworkCheck();
            if (!networkResult) {
                return; // Network check failed, error already shown
            }
            
            // Try to initialize contracts (optional - continue even if fails)
            const contractsInitialized = await window.racingManager.initializeContracts();
            
            // Update UI
            this.updateWalletUI(true, contractsInitialized);
            
            if (contractsInitialized) {
                // Switch out of demo mode only if contracts work
                await window.racingManager.switchToBlockchainMode();
                this.showSuccess('Wallet connected! Playing with real blockchain data!');
            } else {
                // Stay in demo mode but show wallet is connected
                const network = await provider.getNetwork().catch(() => ({ chainId: 'unknown' }));
                this.showSuccess(`Wallet connected on network ${network.chainId}! Game contracts not deployed here - staying in demo mode.`);
            }
            
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.handleWalletError(error);
        }
    }

    // Update wallet UI
    updateWalletUI(connected, contractsAvailable) {
        const connectBtn = document.getElementById('connectWallet');
        const disconnectBtn = document.getElementById('disconnectWallet');
        const walletAddress = document.getElementById('walletAddress');
        const ponyBalance = document.getElementById('ponyBalance');

        if (connected) {
            // Hide connect button, show disconnect button
            connectBtn.classList.add('hidden');
            disconnectBtn.classList.remove('hidden');

            // Show wallet address with status indicator
            const statusText = contractsAvailable ? '🟢' : '🟡';
            const statusLabel = contractsAvailable ? 'Connected' : 'Demo Mode';
            walletAddress.textContent = `${statusText} ${gameState.userAddress.slice(0, 6)}...${gameState.userAddress.slice(-4)} (${statusLabel})`;
            walletAddress.classList.remove('hidden');

            // Enable betting only if contracts are available
            document.getElementById('placeBetBtn').disabled = !contractsAvailable;
            document.getElementById('checkJackpotBtn').disabled = !contractsAvailable;
            document.getElementById('claimWinningsBtn').disabled = !contractsAvailable;
        } else {
            // Show connect button, hide disconnect button
            connectBtn.classList.remove('hidden');
            disconnectBtn.classList.add('hidden');
            walletAddress.classList.add('hidden');
            ponyBalance.classList.add('hidden');

            document.getElementById('placeBetBtn').disabled = true;
            document.getElementById('checkJackpotBtn').disabled = true;
            document.getElementById('claimWinningsBtn').disabled = true;
        }
    }

    // Show wallet installation message
    showWalletInstallationMessage() {
        // Check if in Farcaster miniapp
        if (this.isFarcasterMiniapp()) {
            const farcasterMessage = `
                <div style="text-align: center; padding: 16px;">
                    <h3>🔐 Wallet Setup Required</h3>
                    <p style="font-size: 10px; margin: 10px 0;">To play with real bets, connect a wallet in Warpcast:</p>
                    <ol style="text-align: left; margin: 16px auto; max-width: 320px; font-size: 9px; line-height: 1.6;">
                        <li><strong>Open Warpcast Settings</strong> (Profile → Settings)</li>
                        <li><strong>Go to "Wallets"</strong> section</li>
                        <li><strong>Connect a wallet</strong> (Coinbase Wallet, Rainbow, etc.)</li>
                        <li><strong>Make sure it's on Base network</strong> (Chain ID: 8453)</li>
                        <li><strong>Return here and click Retry</strong></li>
                    </ol>
                    <button onclick="window.walletManager.retryWalletConnection()" class="wallet-install-btn">
                        🔄 Retry Connection
                    </button>
                    <p style="font-size: 7px; margin: 8px 0; color: #666;">Or continue in demo mode with fake bets!</p>
                </div>
            `;
            this.showMessage(farcasterMessage);
        } else {
            const installMessage = `
                <div style="text-align: center; padding: 16px;">
                    <h3>No Crypto Wallet Detected</h3>
                    <p>Having trouble? Try these steps:</p>
                    <div style="margin: 16px 0;">
                        <button onclick="window.walletManager.retryWalletConnection()" class="wallet-install-btn">
                            🔄 Retry Connection
                        </button>
                        <button onclick="window.open('https://metamask.io/', '_blank')" class="wallet-install-btn">
                            Install MetaMask
                        </button>
                    </div>
                    <p style="font-size: 6px; margin: 8px 0;">If you have MetaMask installed, try refreshing the page or clicking Retry.</p>
                    <p>You can still play in demo mode!</p>
                </div>
            `;
            this.showMessage(installMessage);
        }
    }

    // Retry wallet connection
    async retryWalletConnection() {
        console.log('=== RETRYING WALLET CONNECTION ===');
        
        // Remove any existing messages
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        // Force a fresh detection
        await this.connectWallet();
    }

    // Handle wallet errors
    handleWalletError(error) {
        let errorMessage = 'Wallet connection failed. ';
        
        if (error.code === 4001) {
            errorMessage += 'Connection rejected by user.';
        } else if (error.code === -32002) {
            errorMessage += 'Connection request already pending.';
        } else if (error.message.includes('User rejected')) {
            errorMessage += 'Connection rejected by user.';
        } else {
            errorMessage += `Error: ${error.message}`;
        }
        
        this.showError(errorMessage + ' Continuing in demo mode.');
    }

    // Disconnect wallet
    disconnectWallet() {
        console.log('Disconnecting wallet...');
        gameState.resetBlockchainState();
        this.updateWalletUI(false, false);

        // Return to demo mode
        gameState.setDemoMode(true);
        window.demoManager.startDemoMode();

        this.showSuccess('Wallet disconnected. Switched to demo mode.');
    }

    // Setup event listeners
    setupEventListeners() {
        // Account change detection
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    // Utility methods
    showMessage(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'success-message';
        div.innerHTML = message;
        document.querySelector('.container').insertBefore(div, document.querySelector('main'));
    }

    showSuccess(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'success-message';
        div.textContent = message;
        document.querySelector('.container').insertBefore(div, document.querySelector('main'));
        
        setTimeout(() => div.remove(), 5000);
    }

    showError(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = message;
        document.querySelector('.container').insertBefore(div, document.querySelector('main'));
        
        setTimeout(() => div.remove(), 8000);
    }
}

export default WalletManager;