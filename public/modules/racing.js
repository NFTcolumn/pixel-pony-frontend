// Racing and Blockchain Module
import gameState from './state.js';

class RacingManager {
    constructor() {
        // PonyRacingSimplified addresses (Ethereum Sepolia)
        this.CONTRACT_ADDRESSES = {
            PONY_TOKEN: "0xAc8bB9569D720527dA2445781E176c5D3eDC5E0f",
            PONY_RACING: "0x5C209DC0C81EA0fa825134a7125fA793c2976984"
        };

        this.PONY_TOKEN_ABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ];

        this.PONY_RACING_ABI = [
            "function placeBetAndRace(uint256 _horseId, uint256 _amount) external payable returns (uint256 raceId, bool won, uint256 payout)",
            "function totalRaces() view returns (uint256)",
            "function jackpotPool() view returns (uint256)",
            "function baseFeeAmount() view returns (uint256)",
            "function getCurrentJackpotNumbers() view returns (uint256[4])",
            "function getGameStats() view returns (uint256 totalRacesCount, uint256 totalTicketsCount, uint256 jackpotAmount, uint256[4] memory jackpotNumbers)",
            "function getUserRaces(address _user) view returns (uint256[])",
            "function getUserTickets(address _user) view returns (uint256[])",
            "function checkJackpot(uint256[] calldata _ticketIds) external",
            "function races(uint256) view returns (uint256 raceId, address player, uint256 horseId, uint256 betAmount, uint256 ethFee, uint256 timestamp, uint256[3] memory winners, uint256 payout, bool won)",
            "event RaceExecuted(uint256 indexed raceId, address indexed player, uint256 horseId, uint256[3] winners, uint256 payout, bool won)",
            "event LotteryTicketIssued(uint256 indexed ticketId, address indexed player, uint256[4] numbers)",
            "event JackpotWon(address indexed winner, uint256 amount, uint256[4] numbers)",
            "event EthFeesDistributed(address indexed player, uint256 devAmount, uint256 marketingAmount)",
            "event LostBetAddedToJackpot(uint256 indexed raceId, uint256 amount)"
        ];
    }

    // Initialize contracts with error handling
    async initializeContracts() {
        try {
            if (!gameState.provider || !gameState.signer) {
                console.log('Provider or signer not available - cannot initialize contracts');
                return false;
            }

            const network = await gameState.provider.getNetwork();
            console.log(`🔍 Attempting to initialize contracts on network ${network.chainId} (${network.name})`);
            console.log(`📍 Token Address: ${this.CONTRACT_ADDRESSES.PONY_TOKEN}`);
            console.log(`📍 Racing Address: ${this.CONTRACT_ADDRESSES.PONY_RACING}`);
            console.log(`👤 User Address: ${gameState.userAddress}`);

            const ponyTokenContract = new ethers.Contract(
                this.CONTRACT_ADDRESSES.PONY_TOKEN,
                this.PONY_TOKEN_ABI,
                gameState.signer
            );

            const ponyRacingContract = new ethers.Contract(
                this.CONTRACT_ADDRESSES.PONY_RACING,
                this.PONY_RACING_ABI,
                gameState.signer
            );

            console.log('✅ Contract objects created, testing contract calls...');

            // Test contract calls to verify they work
            const balance = await ponyTokenContract.balanceOf(gameState.userAddress);
            console.log(`✅ Token contract call successful - Balance: ${ethers.utils.formatEther(balance)} PONY`);

            const totalRaces = await ponyRacingContract.totalRaces();
            console.log(`✅ Racing contract call successful - Total Races: ${totalRaces}`);

            gameState.setContracts({ ponyTokenContract, ponyRacingContract });

            console.log('🎉 Contract initialization SUCCESS!');
            return true;
        } catch (error) {
            console.error('❌ Contract initialization failed:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                reason: error.reason,
                data: error.data
            });

            const network = await gameState.provider.getNetwork().catch(() => ({ chainId: 'unknown' }));

            if (error.code === 'CALL_EXCEPTION') {
                console.log(`⚠️ Contracts not deployed on network ${network.chainId}. This is normal for Mainnet.`);
                window.walletManager.showMessage(`Connected to network ${network.chainId}, but game contracts are not deployed here. Playing in demo mode.`);
            } else {
                console.log('⚠️ Contract error:', error.message);
                console.log('⚠️ Make sure you are on Ethereum Sepolia (Chain ID: 11155111)');
            }

            return false;
        }
    }

    // Switch to blockchain mode
    async switchToBlockchainMode() {
        gameState.setDemoMode(false);
        gameState.clearIntervals();
        
        // Start real blockchain updates
        this.startPeriodicUpdates();
        
        // Load user data
        try {
            await this.updateUserBalance();
            await this.loadUserBets();
            await this.loadUserTickets();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Periodic updates
    startPeriodicUpdates() {
        // Update race info every 5 seconds
        gameState.raceUpdateInterval = setInterval(() => this.updateRaceInfo(), 5000);
        
        // Update countdown every second
        gameState.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
        
        // Initial load
        this.updateRaceInfo();
        this.updateJackpotInfo();
    }

    // Update race information
    async updateRaceInfo() {
        if (!gameState.ponyRacingContract) {
            document.getElementById('currentRaceId').textContent = '--';
            return;
        }
        
        try {
            const raceInfo = await gameState.ponyRacingContract.getCurrentRaceInfo();
            const [raceId, startTime, timeRemaining, horseBets, isFinished] = raceInfo;
            
            gameState.currentRaceId = raceId.toNumber();
            document.getElementById('currentRaceId').textContent = gameState.currentRaceId;
            
            // Update horses grid
            window.uiManager.generateHorsesGrid(horseBets);
            
            // Update race track
            if (isFinished) {
                await this.displayRaceResults(gameState.currentRaceId);
            } else {
                window.uiManager.displayRunningRace();
            }
            
        } catch (error) {
            console.error('Error updating race info:', error);
            document.getElementById('currentRaceId').textContent = '--';
            document.getElementById('raceStatus').textContent = 'Unable to connect to contract';
        }
    }

    // Update countdown timer
    async updateCountdown() {
        if (!gameState.ponyRacingContract) {
            document.getElementById('countdown').textContent = '--:--';
            document.getElementById('raceStatus').textContent = 'Connect wallet to see races';
            return;
        }
        
        try {
            const timeUntilNext = await gameState.ponyRacingContract.getTimeUntilNextRace();
            const seconds = timeUntilNext.toNumber();
            
            if (seconds === 0) {
                document.getElementById('countdown').textContent = 'RACE STARTING!';
                document.getElementById('raceStatus').textContent = 'New race is starting...';
            } else {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                document.getElementById('countdown').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                document.getElementById('raceStatus').textContent = 'Place your bets now!';
            }
            
        } catch (error) {
            console.error('Error updating countdown:', error);
            document.getElementById('countdown').textContent = '--:--';
            document.getElementById('raceStatus').textContent = 'Unable to connect to contract';
        }
    }

    // Display race results
    async displayRaceResults(raceId) {
        try {
            const results = await gameState.ponyRacingContract.getRaceResults(raceId);
            const [winners, positions, totalBets, isFinished] = results;
            
            if (!isFinished) return;
            
            const container = document.getElementById('horsesContainer');
            container.innerHTML = '';
            
            for (let i = 0; i < 16; i++) {
                const horseDiv = document.createElement('div');
                horseDiv.className = 'horse';
                horseDiv.style.top = `${(positions[i] - 1) * 22 + 20}px`;
                horseDiv.style.left = '85%';
                
                // Add winner styling
                if (i === winners[0]) {
                    horseDiv.classList.add('winner-1');
                    horseDiv.textContent = `🥇 #${i + 1}`;
                } else if (i === winners[1]) {
                    horseDiv.classList.add('winner-2');
                    horseDiv.textContent = `🥈 #${i + 1}`;
                } else if (i === winners[2]) {
                    horseDiv.classList.add('winner-3');
                    horseDiv.textContent = `🥉 #${i + 1}`;
                } else {
                    horseDiv.innerHTML = `<img src="sprites/${(i % 16) + 1}.png" alt="Pony ${i + 1}" style="width: 32px; height: 32px; image-rendering: pixelated; margin-right: 4px; transform: scaleX(-1);"> #${i + 1}`;
                }
                
                container.appendChild(horseDiv);
            }
            
        } catch (error) {
            console.error('Error displaying results:', error);
        }
    }

    // Switch from demo mode to blockchain mode
    async switchToBlockchainMode() {
        console.log('Switching to blockchain mode...');

        // Stop demo mode
        gameState.setDemoMode(false);
        gameState.clearIntervals();

        // Update UI to show we're in blockchain mode
        document.getElementById('raceStatus').textContent = 'Ready to race! Select a horse and place your bet.';
        document.getElementById('countdown').textContent = 'READY';

        // Clear any demo overlays
        const overlay = document.getElementById('raceStateOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }

        // Update display
        await this.updateUserBalance();

        console.log('Now in blockchain mode - ready for instant races!');
    }

    // Place bet
    async placeBet() {
        if (gameState.selectedBets.size === 0) {
            window.walletManager.showError('Please select at least one horse to bet on');
            return;
        }
        
        if (gameState.demoMode) {
            // Demo mode - just show success message
            window.walletManager.showSuccess(`Demo bets placed on ${gameState.selectedBets.size} horses! Total: ${gameState.getTotalBetAmount().toFixed(2)} PONY`);
            gameState.clearBets();
            window.uiManager.updateSelectedBetsDisplay();
            window.uiManager.updateTotalBetAmount();
            return;
        }
        
        if (!gameState.ponyRacingContract || !gameState.ponyTokenContract) {
            window.walletManager.showError('Please connect your wallet');
            return;
        }
        
        try {
            // PonyRacingInstant only supports one bet per race
            if (gameState.selectedBets.size !== 1) {
                window.walletManager.showError('Please select exactly ONE horse to bet on (instant races support single bets)');
                return;
            }

            const [horseId, bet] = Array.from(gameState.selectedBets)[0];
            const betAmount = ethers.utils.parseEther(bet.amount.toString());

            // Check balance
            const balance = await gameState.ponyTokenContract.balanceOf(gameState.userAddress);
            if (balance.lt(betAmount)) {
                window.walletManager.showError('Insufficient PONY balance');
                return;
            }

            // Check allowance
            const allowance = await gameState.ponyTokenContract.allowance(gameState.userAddress, this.CONTRACT_ADDRESSES.PONY_RACING);
            if (allowance.lt(betAmount)) {
                window.walletManager.showMessage('Approving PONY spending...');
                const approveTx = await gameState.ponyTokenContract.approve(this.CONTRACT_ADDRESSES.PONY_RACING, betAmount);
                await approveTx.wait();
            }

            window.walletManager.showMessage('Placing bet and racing...');

            // Get the base fee (0.0005 ETH)
            const baseFee = await gameState.ponyRacingContract.baseFeeAmount();

            // Place bet and race instantly
            const tx = await gameState.ponyRacingContract.placeBetAndRace(horseId, betAmount, {
                value: baseFee,
                gasLimit: 2000000  // High gas limit for complex transaction
            });

            window.walletManager.showMessage('Racing in progress...');

            const receipt = await tx.wait();

            // Parse the result from the transaction
            console.log('Race completed! Receipt:', receipt);

            // Extract race results from event logs
            const raceEvent = receipt.events?.find(e => e.event === 'RaceExecuted');
            if (raceEvent) {
                const { raceId, winners: topThree, won, payout } = raceEvent.args;
                console.log('Race Results:', { raceId: raceId.toString(), topThree, won, payout: ethers.utils.formatEther(payout) });

                // Show race animation with results
                await this.animateInstantRace(horseId, topThree, won);

                // Update race status
                document.getElementById('raceStatus').textContent = won ?
                    `🎉 YOU WON ${ethers.utils.formatEther(payout)} PONY!` :
                    `Race finished. Better luck next time!`;
            }

            window.walletManager.showSuccess(`Race completed! ${raceEvent?.args.won ? 'You won!' : 'Try again!'}`);

            // Clear bets
            gameState.clearBets();
            window.uiManager.updateSelectedBetsDisplay();
            window.uiManager.updateTotalBetAmount();

            // Update data
            await this.updateUserBalance();

        } catch (error) {
            console.error('Bet failed:', error);
            window.walletManager.showError('Failed to place bet: ' + error.message);
        }
    }

    // Format large numbers (show trillions as 1000B instead of 1T)
    formatPonyAmount(num) {
        const absNum = Math.abs(num);

        // For trillions, show as thousands of billions (e.g., 1.5T = 1500B)
        if (absNum >= 1e12) {
            const billions = absNum / 1e9;
            return billions.toFixed(2) + 'B';
        }
        // For billions
        else if (absNum >= 1e9) {
            return (absNum / 1e9).toFixed(2) + 'B';
        }
        // For millions
        else if (absNum >= 1e6) {
            return (absNum / 1e6).toFixed(2) + 'M';
        }
        // For thousands
        else if (absNum >= 1e3) {
            return (absNum / 1e3).toFixed(2) + 'K';
        }
        // For smaller amounts
        else {
            return absNum.toFixed(2);
        }
    }

    // Update user balance
    async updateUserBalance() {
        if (!gameState.ponyTokenContract || !gameState.userAddress) {
            document.getElementById('ponyBalance').textContent = 'Balance: -- PONY';
            return;
        }

        try {
            const balance = await gameState.ponyTokenContract.balanceOf(gameState.userAddress);
            const formattedBalance = ethers.utils.formatEther(balance);
            const balanceNum = parseFloat(formattedBalance);

            document.getElementById('ponyBalance').textContent = `Balance: ${this.formatPonyAmount(balanceNum)} PONY`;
            document.getElementById('ponyBalance').classList.remove('hidden');

            // Check if user has insufficient PONY tokens (less than 1)
            if (balanceNum < 1) {
                this.showNoPonyModal();
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            document.getElementById('ponyBalance').textContent = 'Balance: Error loading';
            document.getElementById('ponyBalance').classList.remove('hidden');
        }
    }

    // Animate instant race with results
    async animateInstantRace(playerHorse, topThree, won) {
        const container = document.getElementById('horsesContainer');
        container.innerHTML = '';

        // Show countdown
        document.getElementById('raceStatus').textContent = 'Race starting...';
        await this.sleep(500);

        // Create all 16 horses
        const horses = [];
        for (let i = 0; i < 16; i++) {
            const horseDiv = document.createElement('div');
            horseDiv.className = 'horse';
            horseDiv.style.left = '0px';
            horseDiv.innerHTML = `
                <img src="sprites/${i + 1}.png" alt="Pony ${i + 1}"
                     style="width: 32px; height: 32px; image-rendering: pixelated; transform: scaleX(-1);">
                <span>#${i + 1}</span>
            `;

            if (i === playerHorse) {
                horseDiv.style.border = '2px solid yellow';
            }

            container.appendChild(horseDiv);
            horses.push(horseDiv);
        }

        // Animate race (5 seconds)
        document.getElementById('raceStatus').textContent = '🏇 Racing...';
        const raceDistance = 500;
        const raceDuration = 5000;
        const steps = 50;
        const stepTime = raceDuration / steps;

        for (let step = 0; step <= steps; step++) {
            await this.sleep(stepTime);
            horses.forEach((horse, i) => {
                // Winners go faster
                let speed = 1;
                if (topThree[0] === i) speed = 1.2;  // 1st place
                else if (topThree[1] === i) speed = 1.1;  // 2nd place
                else if (topThree[2] === i) speed = 1.05; // 3rd place

                const position = (step / steps) * raceDistance * speed;
                horse.style.left = Math.min(position, raceDistance) + 'px';
            });
        }

        // Show results
        await this.sleep(1000);
        this.displayResults(topThree);
    }

    // Sleep helper
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Load user bets
    async loadUserBets() {
        if (!gameState.ponyRacingContract || !gameState.userAddress) return;

        try {
            const container = document.getElementById('userBetsList');
            container.innerHTML = '<p>Loading races...</p>';

            // Get user's race IDs
            const userRaceIds = await gameState.ponyRacingContract.getUserRaces(gameState.userAddress);

            if (userRaceIds.length === 0) {
                container.innerHTML = '<p>No races yet. Place a bet to start racing!</p>';
                return;
            }

            const betsHtml = [];
            // Show last 10 races
            const recentRaceIds = userRaceIds.slice(-10).reverse();

            for (const raceId of recentRaceIds) {
                try {
                    const race = await gameState.ponyRacingContract.races(raceId);
                    const amount = ethers.utils.formatEther(race.betAmount);
                    const payout = ethers.utils.formatEther(race.payout);
                    const statusClass = race.won ? 'winning' : 'losing';
                    const statusEmoji = race.won ? '✅' : '❌';

                    betsHtml.push(`
                        <div class="bet-item ${statusClass}">
                            <div>Race #${raceId} - Horse #${race.horseId}</div>
                            <div>Bet: ${this.formatPonyAmount(parseFloat(amount))} PONY ${statusEmoji}</div>
                            ${race.won ? `<div>Won: ${this.formatPonyAmount(parseFloat(payout))} PONY</div>` : ''}
                        </div>
                    `);
                } catch (error) {
                    console.error(`Error loading race ${raceId}:`, error);
                }
            }

            container.innerHTML = betsHtml.length > 0 ? betsHtml.join('') : '<p>Unable to load race history.</p>';

        } catch (error) {
            console.error('Error loading user bets:', error);
        }
    }

    // Load user lottery tickets
    async loadUserTickets() {
        const container = document.getElementById('userTickets');
        container.innerHTML = '<p>Lottery tickets are issued automatically when you bet!</p>';
    }

    // Update jackpot information
    async updateJackpotInfo() {
        if (!gameState.ponyRacingContract) return;

        try {
            const jackpotPool = await gameState.ponyRacingContract.jackpotPool();
            const winningNumbers = await gameState.ponyRacingContract.getCurrentJackpotNumbers();

            document.getElementById('jackpotAmount').textContent =
                this.formatPonyAmount(parseFloat(ethers.utils.formatEther(jackpotPool)));

            const numbersHtml = winningNumbers.map(num =>
                `<div class="number-ball">${num}</div>`
            ).join('');
            document.getElementById('jackpotNumbers').innerHTML = numbersHtml;

        } catch (error) {
            console.error('Error updating jackpot:', error);
        }
    }

    // Check jackpot
    async checkJackpot() {
        if (!gameState.ponyRacingContract || !gameState.userAddress) {
            window.walletManager.showError('Please connect your wallet first');
            return;
        }

        try {
            // Get user's ticket IDs
            const ticketIds = await gameState.ponyRacingContract.getUserTickets(gameState.userAddress);

            if (ticketIds.length === 0) {
                window.walletManager.showMessage('You have no lottery tickets yet. Place a bet to get tickets!');
                return;
            }

            window.walletManager.showMessage(`Checking ${ticketIds.length} lottery tickets...`);

            // Check all tickets
            const tx = await gameState.ponyRacingContract.checkJackpot(ticketIds);
            await tx.wait();

            window.walletManager.showSuccess('Tickets checked! If you won, the jackpot has been transferred to your wallet!');
            await this.updateUserBalance();
            await this.updateJackpotInfo();

        } catch (error) {
            console.error('Error checking jackpot:', error);
            if (error.message.includes('No matching tickets')) {
                window.walletManager.showMessage('No winning tickets found. Better luck next time!');
            } else {
                window.walletManager.showError('Failed to check jackpot: ' + error.message);
            }
        }
    }

    // Claim winnings (not needed for instant races - payouts are automatic)
    async claimWinnings() {
        window.walletManager.showMessage('Payouts are instant! Your winnings are automatically transferred when you win a race.');
    }

    // Show modal for users without PONY tokens
    showNoPonyModal() {
        // Don't show modal if already exists
        if (document.querySelector('.no-pony-modal')) return;
        
        const modal = document.createElement('div');
        modal.className = 'no-pony-modal';
        modal.innerHTML = `
            <div class="no-pony-content">
                <h3>🐎 Need $PONY to Race! 🐎</h3>
                <p>You need $PONY tokens to place bets and participate in races.</p>
                <p>Get some tokens from a DEX to start racing!</p>
                <div class="no-pony-buttons">
                    <button onclick="window.open('buy.html', '_blank')" class="buy-button">
                        💰 Buy $PONY
                    </button>
                    <button onclick="this.closest('.no-pony-modal').remove()" style="background: #306230; color: #9bbc0f;">
                        ✕ Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            const modal = document.querySelector('.no-pony-modal');
            if (modal) modal.remove();
        }, 10000);
    }
}

export default RacingManager;