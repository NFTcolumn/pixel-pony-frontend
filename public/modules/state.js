// Global State Management Module
class GameState {
    constructor() {
        // Blockchain state
        this.provider = null;
        this.signer = null;
        this.ponyTokenContract = null;
        this.ponyRacingContract = null;
        this.userAddress = null;
        this.currentRaceId = 0;
        
        // Game state
        this.selectedHorseId = null;
        this.selectedBets = new Map();
        this.demoMode = true;
        
        // Demo state
        this.demoRaceStartTime = Date.now();
        this.demoRaceId = 1;
        this.demoHorseSpeeds = [];
        this.demoHorseNames = [];
        
        // Intervals
        this.countdownInterval = null;
        this.raceUpdateInterval = null;
    }

    // Reset blockchain state
    resetBlockchainState() {
        this.provider = null;
        this.signer = null;
        this.ponyTokenContract = null;
        this.ponyRacingContract = null;
        this.userAddress = null;
        this.currentRaceId = 0;
    }

    // Set blockchain state
    setBlockchainState({ provider, signer, userAddress }) {
        this.provider = provider;
        this.signer = signer;
        this.userAddress = userAddress;
    }

    // Set contracts
    setContracts({ ponyTokenContract, ponyRacingContract }) {
        this.ponyTokenContract = ponyTokenContract;
        this.ponyRacingContract = ponyRacingContract;
    }

    // Demo mode management
    setDemoMode(enabled) {
        this.demoMode = enabled;
    }

    // Betting state management
    addBet(horseId, horseName, amount = 10) {
        this.selectedBets.set(horseId, { name: horseName, amount });
    }

    removeBet(horseId) {
        this.selectedBets.delete(horseId);
    }

    clearBets() {
        this.selectedBets.clear();
    }

    updateBetAmount(horseId, amount) {
        if (this.selectedBets.has(horseId)) {
            const bet = this.selectedBets.get(horseId);
            bet.amount = parseFloat(amount) || 0;
            this.selectedBets.set(horseId, bet);
        }
    }

    getTotalBetAmount() {
        let total = 0;
        this.selectedBets.forEach(bet => {
            total += bet.amount;
        });
        return total;
    }

    // Demo race management
    initializeDemoRace() {
        const storedRaceStartTime = localStorage.getItem('demoRaceStartTime');
        const storedRaceId = localStorage.getItem('demoRaceId');
        
        if (storedRaceStartTime) {
            this.demoRaceStartTime = parseInt(storedRaceStartTime);
            this.demoRaceId = parseInt(storedRaceId) || 1;
            
            const elapsed = (Date.now() - this.demoRaceStartTime) / 1000;
            const totalCycle = 45;
            
            if (elapsed >= totalCycle) {
                const cyclesPassed = Math.floor(elapsed / totalCycle);
                this.demoRaceStartTime = Date.now() - (elapsed % totalCycle) * 1000;
                this.demoRaceId += cyclesPassed;
                
                this.saveDemoState();
            }
        } else {
            this.demoRaceStartTime = Date.now();
            this.saveDemoState();
        }
    }

    saveDemoState() {
        localStorage.setItem('demoRaceStartTime', this.demoRaceStartTime.toString());
        localStorage.setItem('demoRaceId', this.demoRaceId.toString());
    }

    // Clear intervals
    clearIntervals() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        if (this.raceUpdateInterval) clearInterval(this.raceUpdateInterval);
        this.countdownInterval = null;
        this.raceUpdateInterval = null;
    }
}

// Export singleton instance
const gameState = new GameState();

// Make available globally for compatibility
if (typeof window !== 'undefined') {
    window.gameState = gameState;
}

export default gameState;