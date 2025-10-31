// UI Management Module
import gameState from './state.js';

class UIManager {
    constructor() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => window.walletManager.connectWallet());
        document.getElementById('disconnectWallet').addEventListener('click', () => window.walletManager.disconnectWallet());
        document.getElementById('placeBetBtn').addEventListener('click', () => window.racingManager.placeBet());
        document.getElementById('checkJackpotBtn').addEventListener('click', () => window.racingManager.checkJackpot());
        document.getElementById('claimWinningsBtn').addEventListener('click', () => window.racingManager.claimWinnings());
        document.getElementById('clearBetsBtn').addEventListener('click', () => this.clearAllBets());

        // Horse selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('horse-bet-button')) {
                this.addHorseToBet(parseInt(e.target.dataset.horseId));
            }
        });
    }

    // Generate horses betting grid
    generateHorsesGrid(horseBets) {
        const container = document.getElementById('horsesGrid');
        container.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const horseDiv = document.createElement('div');
            horseDiv.className = 'horse-bet-button';
            horseDiv.dataset.horseId = i;
            
            if (gameState.selectedHorseId === i) {
                horseDiv.classList.add('selected');
            }
            
            const betAmount = horseBets ? ethers.utils.formatEther(horseBets[i] || 0) : '0.00';
            
            const isSelected = gameState.selectedBets.has(i);
            const betAmountValue = isSelected ? gameState.selectedBets.get(i).amount : 10;
            
            horseDiv.innerHTML = `
                <button class="horse-bet-remove" onclick="window.uiManager.removeBet(${i})">×</button>
                <div class="horse-emoji"><img src="sprites/${(i % 16) + 1}.png" alt="Pony ${i + 1}" style="width: 24px; height: 24px; image-rendering: pixelated; transform: scaleX(-1);"></div>
                <div class="horse-bets">${parseFloat(betAmount).toFixed(2)} PONY</div>
                <input type="number" class="horse-bet-input" value="${betAmountValue}" min="1" step="0.1" 
                       onchange="window.uiManager.updateBetAmount(${i}, this.value)" placeholder="Bet amount">
            `;
            
            if (isSelected) {
                horseDiv.classList.add('selected');
            }
            
            container.appendChild(horseDiv);
        }
    }

    // Add horse to betting selection
    addHorseToBet(horseId) {
        const horseName = gameState.demoMode ? 
            (gameState.demoHorseNames[horseId] || `Pony #${horseId + 1}`) : 
            `Pony #${horseId + 1}`;
        
        // If horse already selected, don't add again
        if (gameState.selectedBets.has(horseId)) {
            return;
        }
        
        // Add to selected bets with default amount
        gameState.addBet(horseId, horseName, 10);
        
        this.updateSelectedBetsDisplay();
        this.updateTotalBetAmount();
    }

    // Update the horse cards to reflect current selections
    updateSelectedBetsDisplay() {
        // Regenerate the horses grid to reflect current selections
        if (gameState.demoMode) {
            window.demoManager.generateDemoHorses();
        } else {
            this.generateHorsesGrid([]);
        }
    }

    // Update bet amount for a specific horse
    updateBetAmount(horseId, amount) {
        gameState.updateBetAmount(horseId, amount);
        this.updateTotalBetAmount();
    }

    // Remove a bet from selection
    removeBet(horseId) {
        gameState.removeBet(horseId);
        this.updateSelectedBetsDisplay();
        this.updateTotalBetAmount();
    }

    // Clear all bets
    clearAllBets() {
        gameState.clearBets();
        this.updateSelectedBetsDisplay();
        this.updateTotalBetAmount();
    }

    // Update total bet amount display
    updateTotalBetAmount() {
        const total = gameState.getTotalBetAmount();
        
        document.getElementById('totalBetAmount').textContent = total.toFixed(2);
        document.getElementById('placeBetBtn').disabled = total === 0 || (!gameState.demoMode && !gameState.ponyRacingContract);
    }

    // Legacy function for compatibility
    selectHorse(horseId) {
        this.addHorseToBet(horseId);
    }

    // Display running race animation
    displayRunningRace() {
        const container = document.getElementById('horsesContainer');
        const trackHeight = container.clientHeight || 480;
        const laneHeight = trackHeight / 16;
        container.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const horseDiv = document.createElement('div');
            horseDiv.className = 'horse';
            horseDiv.style.top = `${(i * laneHeight) + (laneHeight / 2) - 14}px`;
            horseDiv.style.left = '8px';
            
            // Add random movement animation
            const randomPosition = Math.random() * 70 + 8; // Keep within track bounds
            horseDiv.style.left = `${randomPosition}%`;
            
            horseDiv.innerHTML = `<img src="sprites/${(i % 16) + 1}.png" alt="Pony ${i + 1}" style="width: 32px; height: 32px; image-rendering: pixelated; transform: scaleX(-1);">`;
            
            container.appendChild(horseDiv);
        }
    }

    // Initialize betting interface
    initializeBettingInterface() {
        this.updateSelectedBetsDisplay();
        this.updateTotalBetAmount();
    }

    // Show success message
    showSuccess(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'success-message';
        div.textContent = message;
        document.querySelector('.container').insertBefore(div, document.querySelector('main'));
        
        setTimeout(() => div.remove(), 5000);
    }

    // Show error message
    showError(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = message;
        document.querySelector('.container').insertBefore(div, document.querySelector('main'));
        
        setTimeout(() => div.remove(), 8000);
    }

    // Show message
    showMessage(message) {
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const div = document.createElement('div');
        div.className = 'success-message';
        div.innerHTML = message;
        document.querySelector('.container').insertBefore(div, document.querySelector('main'));
    }
}

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.addHorseToBet = (horseId) => window.uiManager.addHorseToBet(horseId);
    window.updateBetAmount = (horseId, amount) => window.uiManager.updateBetAmount(horseId, amount);
    window.removeBet = (horseId) => window.uiManager.removeBet(horseId);
    window.selectHorse = (horseId) => window.uiManager.selectHorse(horseId);
}

export default UIManager;