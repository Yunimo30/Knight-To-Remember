import { GameState } from './GameState.js';

const ui = {
    // --- ELEMENT REFERENCES ---
    questionText: document.getElementById('question-text'),
    answerButtons: [
        document.getElementById('btn-0'),
        document.getElementById('btn-1'),
        document.getElementById('btn-2'),
        document.getElementById('btn-3')
    ],
    playerHpBar: document.getElementById('player-hp-bar'),
    enemyHpBar: document.getElementById('enemy-hp-bar'),
    enemyName: document.getElementById('enemy-name'),
    enemySprite: document.getElementById('enemy-sprite'),
    playerSprite: document.getElementById('player-sprite'),
    combatFeedback: document.getElementById('combat-feedback'),
    turnBanner: document.getElementById('turn-banner'),
    flashOverlay: document.getElementById('flash-overlay'),
    
    // New Elements
    hintBtn: document.getElementById('btn-use-hint'),
    hintCounter: document.getElementById('hint-counter'),
    levelIndicator: document.getElementById('level-indicator'),
    timerLeft: document.getElementById('timer-bar-left'),
    timerRight: document.getElementById('timer-bar-right'),
    dashboard: document.getElementById('ui-dashboard'),

    // --- SETUP & UPDATES ---
    setupEnemy(enemyData) {
        this.enemyName.innerText = enemyData.name;
        this.enemySprite.innerHTML = `<i class="fa-solid ${enemyData.icon}"></i>`;
        this.renderHearts(this.enemyHpBar, enemyData.currentHp);
    },

    updateStats() {
        if(this.levelIndicator) this.levelIndicator.innerText = GameState.level.current;
        
        if(this.hintCounter) {
            this.hintCounter.innerHTML = `<i class="fa-solid fa-lightbulb"></i> x ${GameState.player.hints}`;
        }
        
        this.renderHearts(this.playerHpBar, GameState.player.currentHp);
        this.renderHearts(this.enemyHpBar, GameState.enemy.currentHp);
    },

    renderHearts(container, amount) {
        container.innerHTML = '';
        for (let i = 0; i < amount; i++) {
            container.innerHTML += '<i class="fa-solid fa-heart" style="color:#e74c3c; margin-right:3px;"></i>';
        }
    },

    // --- TURN & QUESTION LOGIC ---
    setTurnIndicator(isPlayer) {
        this.turnBanner.innerText = isPlayer ? "YOUR TURN" : "ENEMY ATTACKING!";
        this.turnBanner.style.backgroundColor = isPlayer ? "#27ae60" : "#c0392b";
    },

    displayQuestion(questionObj) {
        this.questionText.innerText = questionObj.text;
        
        // Reset Buttons (Re-enable and style)
        this.answerButtons.forEach((btn, index) => {
            btn.innerText = questionObj.answers[index];
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.backgroundColor = '#ecf0f1'; 
            btn.classList.remove('hidden');
        });
    },

    // --- HINT SYSTEM VISUALS ---
    removeWrongAnswer(index) {
        const btn = this.answerButtons[index];
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.backgroundColor = '#95a5a6';
        btn.innerHTML = '<span style="text-decoration: line-through;">' + btn.innerText + '</span>';
    },

    // --- TIMER VISUALS ---
    updateTimer(percent) {
        // We split the percent between the two bars
        // Each bar gets half of the percent width relative to its container (50%)
        // Actually simpler: Set width of both bars to (percent / 2)% relative to container
        this.timerLeft.style.width = (percent / 2) + '%';
        this.timerRight.style.width = (percent / 2) + '%';

        // Color Logic
        let color = '#2ecc71'; // Green
        if (percent < 60) color = '#f1c40f'; // Yellow
        if (percent < 30) color = '#e74c3c'; // Red
        
        this.timerLeft.style.backgroundColor = color;
        this.timerRight.style.backgroundColor = color;
    },

    // --- ANIMATIONS ---
    triggerBattleStartAnim() {
        this.dashboard.classList.remove('slide-up');
        // Force Reflow
        void this.dashboard.offsetWidth; 
        this.dashboard.classList.add('slide-up');
    },

    animatePlayerAttack() {
        this.playerSprite.classList.add('anim-attack-player');
        setTimeout(() => this.playerSprite.classList.remove('anim-attack-player'), 300);
    },

    animateEnemyAttack() {
        this.enemySprite.classList.add('anim-attack-enemy');
        setTimeout(() => this.enemySprite.classList.remove('anim-attack-enemy'), 300);
    },

    flashDamage() {
        this.flashOverlay.classList.add('anim-damage-flash');
        setTimeout(() => this.flashOverlay.classList.remove('anim-damage-flash'), 500);
    },
    
    showFeedback(text, isGood) {
        this.combatFeedback.innerText = text;
        this.combatFeedback.style.color = isGood ? '#2ecc71' : '#e74c3c';
        this.combatFeedback.style.borderColor = isGood ? '#2ecc71' : '#e74c3c';
        this.combatFeedback.classList.remove('hidden');
        setTimeout(() => this.combatFeedback.classList.add('hidden'), 1000);
    },

    shakeScreen(element) {
        if(!element) return;
        element.style.transform = 'translateX(5px)';
        setTimeout(() => element.style.transform = 'translateX(-5px)', 50);
        setTimeout(() => element.style.transform = 'translateX(0)', 100);
    }
};

export default ui;