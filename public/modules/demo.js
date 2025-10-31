// Demo Mode Module
import gameState from './state.js';

class DemoManager {
    constructor() {
        // Random pony names for demo mode
        this.ponyNames = [
            'Lightning', 'Thunder', 'Sparkle', 'Rainbow', 'Stardust', 'Comet', 'Flash', 'Blaze',
            'Moonbeam', 'Sunset', 'Stormy', 'Crystal', 'Diamond', 'Ruby', 'Emerald', 'Sapphire',
            'Phoenix', 'Spirit', 'Magic', 'Wonder', 'Shadow', 'Galaxy', 'Nova', 'Cosmic',
            'Mystic', 'Dreamer', 'Dancer', 'Prancer', 'Dasher', 'Vixen', 'Comet', 'Cupid'
        ];
    }

    // Start demo mode
    startDemoMode() {
        gameState.setDemoMode(true);
        
        // Initialize demo race state
        gameState.initializeDemoRace();
        
        document.getElementById('currentRaceId').textContent = gameState.demoRaceId;
        document.getElementById('raceStatus').textContent = 'DEMO MODE - Connect wallet to bet with real tokens!';
        
        // Generate new race data and display
        this.generateNewRaceData();
        this.generateDemoHorses();
        
        // Start demo timers
        gameState.clearIntervals();
        
        gameState.countdownInterval = setInterval(() => this.updateDemoCountdown(), 1000);
        gameState.raceUpdateInterval = setInterval(() => this.updateDemoRace(), 1000);
        
        // Update jackpot with demo data
        document.getElementById('jackpotAmount').textContent = '1,337.42';
        const demoNumbers = ['07', '13', '21', '42'];
        document.getElementById('jackpotNumbers').innerHTML = demoNumbers.map(num => 
            `<div class="number-ball">${num}</div>`
        ).join('');
    }

    // Update demo countdown
    updateDemoCountdown() {
        const elapsed = (Date.now() - gameState.demoRaceStartTime) / 1000;
        const raceLength = 30; // 30 second demo races
        const interval = 45; // 45 seconds between races
        const overlay = document.getElementById('raceStateOverlay');
        const stateText = document.getElementById('raceStateText');
        const stateCountdown = document.getElementById('raceStateCountdown');
        
        if (elapsed < 5) {
            // Pre-race: Show only horse names
            const remaining = Math.ceil(5 - elapsed);
            document.getElementById('countdown').textContent = `00:${remaining.toString().padStart(2, '0')}`;
            document.getElementById('raceStatus').textContent = 'RACE STARTING SOON...';
            
            // Show race state overlay
            if (overlay && stateText && stateCountdown) {
                stateText.textContent = 'RACE STARTING SOON';
                stateCountdown.textContent = `00:${remaining.toString().padStart(2, '0')}`;
                overlay.classList.add('visible');
            }
            
            this.showPreRaceHorses();
        } else if (elapsed < raceLength) {
            // Race in progress
            const remaining = Math.ceil(raceLength - elapsed);
            document.getElementById('countdown').textContent = `00:${remaining.toString().padStart(2, '0')}`;
            document.getElementById('raceStatus').textContent = 'DEMO RACE IN PROGRESS';
            
            // Hide race state overlay during race
            if (overlay) {
                overlay.classList.remove('visible');
            }
            
            this.updateDemoRaceAnimation((elapsed - 5) / (raceLength - 5));
        } else if (elapsed < raceLength + 5) {
            // Show winners overlay for 5 seconds
            document.getElementById('countdown').textContent = 'FINISHED';
            document.getElementById('raceStatus').textContent = 'RACE COMPLETED';
            
            // Show race completed state
            if (overlay && stateText && stateCountdown) {
                stateText.textContent = 'RACE FINISHED!';
                stateCountdown.textContent = 'CHECK RESULTS';
                overlay.classList.add('visible');
            }
            
            this.showWinnerOverlay();
        } else if (elapsed < interval) {
            // Waiting for next race
            const remaining = Math.ceil(interval - elapsed);
            document.getElementById('countdown').textContent = `00:${remaining.toString().padStart(2, '0')}`;
            document.getElementById('raceStatus').textContent = 'NEXT DEMO RACE STARTING...';
            
            // Show next race countdown
            if (overlay && stateText && stateCountdown) {
                stateText.textContent = 'NEXT RACE IN';
                stateCountdown.textContent = `00:${remaining.toString().padStart(2, '0')}`;
                overlay.classList.add('visible');
            }
            
            this.hideWinnerOverlay();
            this.showDemoResults();
        } else {
            // Start new race
            gameState.demoRaceStartTime = Date.now();
            gameState.demoRaceId++;
            
            gameState.saveDemoState();
            
            document.getElementById('currentRaceId').textContent = gameState.demoRaceId;
            this.generateNewRaceData();
            this.generateDemoHorses();
        }
    }

    // Generate new race data (names and speeds) - only call when starting a NEW race
    generateNewRaceData() {
        // Generate random speeds and names for this race
        gameState.demoHorseSpeeds = [];
        gameState.demoHorseNames = [];
        
        // Shuffle names to ensure unique names for each horse
        const shuffledNames = [...this.ponyNames].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < 16; i++) {
            // Generate random speed between 0.6 and 1.4 for variety
            gameState.demoHorseSpeeds[i] = 0.6 + (Math.random() * 0.8);
            
            // Pick unique name from shuffled pool
            gameState.demoHorseNames[i] = shuffledNames[i];
        }
    }

    // Generate demo horses display (preserves existing names)
    generateDemoHorses() {
        const container = document.getElementById('horsesGrid');
        container.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const horseDiv = document.createElement('div');
            horseDiv.className = 'horse-bet-button';
            horseDiv.dataset.horseId = i;
            
            const isSelected = gameState.selectedBets.has(i);
            const betAmountValue = isSelected ? gameState.selectedBets.get(i).amount : 10;
            
            const horseName = gameState.demoHorseNames[i] || `Pony #${i + 1}`;
            horseDiv.innerHTML = `
                <button class="horse-bet-remove" onclick="window.uiManager.removeBet(${i})" style="display: ${isSelected ? 'block' : 'none'};">×</button>
                <div class="horse-emoji"><img src="sprites/${(i % 16) + 1}.png" alt="${horseName}" style="width: 24px; height: 24px; image-rendering: pixelated; transform: scaleX(-1);"></div>
                <div class="horse-name">${horseName}</div>
                <div class="horse-number">Pony #${i + 1}</div>
                <input type="number" class="horse-bet-input" value="${betAmountValue}" min="1" step="0.1" 
                       onchange="window.uiManager.updateBetAmount(${i}, this.value)" placeholder="Bet amount" style="opacity: ${isSelected ? '1' : '0'}; transition: opacity 0.3s ease;">
            `;
            
            if (isSelected) {
                horseDiv.classList.add('selected');
            }
            
            container.appendChild(horseDiv);
        }
    }

    // Update demo race (placeholder)
    updateDemoRace() {
        // This function is called every second to update race state
        // Most logic is now in updateDemoCountdown()
    }

    // Show pre-race horses with sprites and names
    showPreRaceHorses() {
        const container = document.getElementById('horsesContainer');
        const trackHeight = container.clientHeight || 480;
        const laneHeight = trackHeight / 16;
        container.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const horseDiv = document.createElement('div');
            horseDiv.className = 'horse pre-race';
            horseDiv.style.top = `${(i * laneHeight) + (laneHeight / 2) - 14}px`;
            horseDiv.style.left = '8px';
            horseDiv.style.animation = 'none'; // No gallop animation pre-race
            
            const horseName = gameState.demoHorseNames[i] || `Pony #${i + 1}`;
            horseDiv.innerHTML = `<img src="sprites/${(i % 16) + 1}.png" alt="${horseName}" style="width: 32px; height: 32px; image-rendering: pixelated; margin-right: 4px; transform: scaleX(-1);"> <span style="font-size: 10px; font-weight: bold;">${horseName}</span>`;
            
            container.appendChild(horseDiv);
        }
    }

    // Show winner overlay
    showWinnerOverlay() {
        let overlay = document.getElementById('winnerOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'winnerOverlay';
            overlay.className = 'winner-overlay';
            document.body.appendChild(overlay);
        }
        
        // Determine winners based on speeds
        const horseData = [];
        for (let i = 0; i < 16; i++) {
            horseData.push({ 
                index: i, 
                speed: gameState.demoHorseSpeeds[i] || 1.0,
                name: gameState.demoHorseNames[i] || `Pony #${i + 1}`
            });
        }
        
        // Sort by speed (fastest first)
        horseData.sort((a, b) => b.speed - a.speed);
        const winners = horseData.slice(0, 3);
        
        overlay.innerHTML = `
            <div class="winner-content">
                <h2>🏁 RACE RESULTS 🏁</h2>
                <div class="winner-podium">
                    <div class="winner-place first-place">
                        <div class="medal">🥇</div>
                        <img src="sprites/${(winners[0].index % 16) + 1}.png" alt="${winners[0].name}" style="width: 32px; height: 32px; image-rendering: pixelated; transform: scaleX(-1);">
                        <div class="winner-name">${winners[0].name}</div>
                        <div class="winner-position">1st Place</div>
                    </div>
                    <div class="winner-place second-place">
                        <div class="medal">🥈</div>
                        <img src="sprites/${(winners[1].index % 16) + 1}.png" alt="${winners[1].name}" style="width: 28px; height: 28px; image-rendering: pixelated; transform: scaleX(-1);">
                        <div class="winner-name">${winners[1].name}</div>
                        <div class="winner-position">2nd Place</div>
                    </div>
                    <div class="winner-place third-place">
                        <div class="medal">🥉</div>
                        <img src="sprites/${(winners[2].index % 16) + 1}.png" alt="${winners[2].name}" style="width: 24px; height: 24px; image-rendering: pixelated; transform: scaleX(-1);">
                        <div class="winner-name">${winners[2].name}</div>
                        <div class="winner-position">3rd Place</div>
                    </div>
                </div>
            </div>
        `;
        
        overlay.style.display = 'flex';
    }

    // Hide winner overlay
    hideWinnerOverlay() {
        const overlay = document.getElementById('winnerOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Update demo race animation
    updateDemoRaceAnimation(progress) {
        const container = document.getElementById('horsesContainer');
        const trackHeight = container.clientHeight || 480;
        const laneHeight = trackHeight / 16;
        
        if (progress === 0 || progress < 0.01) {
            // Reset horses to start
            container.innerHTML = '';
            for (let i = 0; i < 16; i++) {
                const horseDiv = document.createElement('div');
                horseDiv.className = 'horse';
                horseDiv.style.top = `${(i * laneHeight) + (laneHeight / 2) - 14}px`;
                horseDiv.style.left = '8px';
                horseDiv.innerHTML = `<img src="sprites/${(i % 16) + 1}.png" alt="${gameState.demoHorseNames[i] || 'Pony #' + (i + 1)}" style="width: 32px; height: 32px; image-rendering: pixelated; transform: scaleX(-1);">`;
                horseDiv.dataset.originalSpeed = gameState.demoHorseSpeeds[i] || 1.0;
                container.appendChild(horseDiv);
            }
        } else {
            // Animate horses based on progress and their individual speeds
            const horses = container.querySelectorAll('.horse');
            horses.forEach((horse, i) => {
                const baseSpeed = gameState.demoHorseSpeeds[i] || 1.0;
                const randomFactor = 0.95 + (Math.random() * 0.1);
                const horseSpeed = baseSpeed * randomFactor;
                
                const containerWidth = container.clientWidth || 800;
                const finishLine = containerWidth * 0.9;
                const basePosition = Math.min(finishLine, progress * finishLine * horseSpeed);
                const verticalBob = Math.sin(progress * Math.PI * 8) * 2;
                
                horse.style.left = `${basePosition}px`;
                horse.style.top = `${(i * laneHeight) + (laneHeight / 2) - 14 + verticalBob}px`;
            });
        }
    }

    // Show demo results
    showDemoResults() {
        const container = document.getElementById('horsesContainer');
        const horses = container.querySelectorAll('.horse');
        const trackHeight = container.clientHeight || 480;
        const laneHeight = trackHeight / 16;
        const containerWidth = container.clientWidth || 800;
        const finishLine = containerWidth * 0.9;
        
        // Determine winners based on who was fastest
        const horseData = [];
        for (let i = 0; i < 16; i++) {
            horseData.push({ index: i, speed: gameState.demoHorseSpeeds[i] || 1.0 });
        }
        
        horseData.sort((a, b) => b.speed - a.speed);
        const winners = [horseData[0].index, horseData[1].index, horseData[2].index];
        
        horses.forEach((horse, i) => {
            horse.style.left = `${finishLine}px`;
            horse.style.top = `${(i * laneHeight) + (laneHeight / 2) - 16}px`;
            horse.style.transform = 'translateY(0px)';
            horse.style.display = 'flex';
            horse.style.alignItems = 'center';
            horse.style.height = '32px';
            
            const horseName = gameState.demoHorseNames[i] || `Pony #${i + 1}`;
            
            if (i === winners[0]) {
                horse.classList.add('winner-1');
                horse.innerHTML = `🥇 <img src="sprites/${(i % 16) + 1}.png" alt="${horseName}" style="width: 32px; height: 32px; image-rendering: pixelated; margin: 0 4px; transform: scaleX(-1);"> <span style="font-size: 8px; line-height: 32px;">${horseName}</span>`;
            } else if (i === winners[1]) {
                horse.classList.add('winner-2');
                horse.innerHTML = `🥈 <img src="sprites/${(i % 16) + 1}.png" alt="${horseName}" style="width: 32px; height: 32px; image-rendering: pixelated; margin: 0 4px; transform: scaleX(-1);"> <span style="font-size: 8px; line-height: 32px;">${horseName}</span>`;
            } else if (i === winners[2]) {
                horse.classList.add('winner-3');
                horse.innerHTML = `🥉 <img src="sprites/${(i % 16) + 1}.png" alt="${horseName}" style="width: 32px; height: 32px; image-rendering: pixelated; margin: 0 4px; transform: scaleX(-1);"> <span style="font-size: 8px; line-height: 32px;">${horseName}</span>`;
            } else {
                horse.innerHTML = `<img src="sprites/${(i % 16) + 1}.png" alt="${horseName}" style="width: 32px; height: 32px; image-rendering: pixelated; transform: scaleX(-1);">`;
            }
        });
    }
}

export default DemoManager;