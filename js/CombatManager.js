import { GameState, EnemyTypes } from './GameState.js';
import UI from './UIManager.js';
import { LevelManager } from './LevelManager.js';
import { AudioManager } from './AudioManager.js';

export const CombatManager = {
    // Config
    DELAY_ATTACK_ANIM: 800,
    DELAY_DAMAGE: 1200,
    DELAY_TURN_SWITCH: 1400,
    TURN_TIME_LIMIT: 15000,

    // State
    turnTimerId: null,
    turnStartTime: 0,
    usedQuestionIds: [],
    isProcessing: false,
    
    // QTE State
    qteAnimationId: null,
    qteDirection: 1,
    qtePosition: 0,
    qteSpeed: 2,
    
    // Callbacks to Main.js
    onVictory: null,
    onDefeat: null,

    init(victoryCallback, defeatCallback) {
        this.onVictory = victoryCallback;
        this.onDefeat = defeatCallback;
    },

    startCombat(node, isWildcard = false) {
        AudioManager.playBGM('bgm_combat'); 
        document.getElementById('battle-arena').classList.remove('hidden');
        document.getElementById('turn-banner').classList.remove('hidden');

        // 1. DETERMINE ENEMY POOL BASED ON WORLD
        const worldId = GameState.progression.currentWorldId; // "world_1", "world_2", "world_3"
        let baseIndex = 0;
        
        if (worldId === 'world_2') baseIndex = 5;      // Start at ID 5 (Caves)
        else if (worldId === 'world_3') baseIndex = 10; // Start at ID 10 (Castle)
        
        let enemyTemplate;

        // 2. SELECT SPECIFIC ENEMY
        if (node.type === 'boss') {
            // Boss is always the last one in the set (Index + 4)
            enemyTemplate = EnemyTypes[baseIndex + 4]; 
        } 
        else if (node.type === 'miniboss') {
            // Mini-boss is second to last (Index + 3)
            enemyTemplate = EnemyTypes[baseIndex + 3]; 
        } 
        else if (isWildcard) {
            // Random standard enemy from the set (Index + 0, 1, or 2)
            const offset = Math.floor(Math.random() * 3);
            enemyTemplate = EnemyTypes[baseIndex + offset];
        } 
        else {
            // Deterministic standard enemy based on Node ID
            const offset = node.id % 3; 
            enemyTemplate = EnemyTypes[baseIndex + offset];
        }

        // 3. APPLY STATS
        GameState.enemy.name = enemyTemplate.name;
        GameState.enemy.maxHp = enemyTemplate.hp;
        GameState.enemy.currentHp = enemyTemplate.hp;
        GameState.enemy.icon = enemyTemplate.icon;
        
        // Dynamic Damage Scaling: World 1 = 1dmg, World 2 = 2dmg, World 3 = 3dmg
        GameState.enemy.damage = 1; 
        if (worldId === 'world_2') GameState.enemy.damage = 2;
        if (worldId === 'world_3') GameState.enemy.damage = 3;

        // --- Rest of your logic remains the same ---
        const nodeQuestions = LevelManager.getQuestionsForNode(node);
        if (nodeQuestions && nodeQuestions.length > 0) {
            GameState.currentTopicQuestions = nodeQuestions;
        } else {
            GameState.currentTopicQuestions = GameState.activeWorldTopics.flatMap(t => t.questions);
        }

        this.usedQuestionIds = [];
        GameState.isPlayerTurn = true;

        UI.setupEnemy(GameState.enemy);
        UI.updateStats();
        UI.setTurnIndicator(true);
        UI.triggerBattleStartAnim();

        this.setCombatUIFurl(false);
        document.getElementById('input-blocker').classList.add('hidden');

        this.generateNewQuestion();
    },

    generateNewQuestion() {
        // UNLOCK input for the new turn
        this.isProcessing = false;
        
        // Re-enable buttons
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach(b => b.disabled = false);

        const questions = GameState.currentTopicQuestions || [];
        let availableQuestions = questions.filter(q => !this.usedQuestionIds.includes(q.id));

        if (availableQuestions.length === 0) {
            this.usedQuestionIds = [];
            availableQuestions = questions;
        }

        let selectedQ;
        const isBoss = GameState.enemy.name === 'Syntax Guardian' || GameState.enemy.name === 'The Compiler';

        if (isBoss) {
            const hardQ = availableQuestions.filter(q => q.difficulty === 'hard');
            if (hardQ.length > 0 && Math.random() < 0.7) selectedQ = hardQ[Math.floor(Math.random() * hardQ.length)];
            else selectedQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        } else {
            selectedQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        }

        this.usedQuestionIds.push(selectedQ.id);
        GameState.currentQuestion = selectedQ;
        UI.displayQuestion(selectedQ);
        this.startTurnTimer();
    },

    handleAnswer(selectedIndex) {
        // 1. SPAM CHECK: If we are already processing an attack, STOP.
        if (this.isProcessing) return; 
        
        // 2. LOCK INPUT immediately
        this.isProcessing = true;
        
        // Disable buttons visually
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach(b => b.disabled = true);

        if (!GameState.isPlayerTurn || GameState.isQTEActive) return;

        this.stopTurnTimer();
        const correctIndex = GameState.currentQuestion.correct;

        if (selectedIndex === correctIndex) this.processCorrectAnswer();
        else this.processWrongAnswer();
    },

    handleInputAnswer(text) {
        if (!GameState.isPlayerTurn || GameState.isQTEActive) return;
        
        const playerText = text.trim().toLowerCase();
        if (playerText === "") return;

        this.stopTurnTimer();
        const accepted = GameState.currentQuestion.acceptedAnswers.map(a => a.toLowerCase());
        
        if (accepted.includes(playerText)) this.processCorrectAnswer();
        else this.processWrongAnswer();
    },

    processCorrectAnswer() {
        this.stopTurnTimer();

        // 1. Trigger Animation
        UI.triggerPlayerAttackAnim(); 

        setTimeout(() => {
            AudioManager.playSFX('sfx_attack');
            
            // --- FIX: Lower default damage from 10 to 1 ---
            let dmg = 1; 
            
            // If the player has stats, use them
            if (GameState.player.stats && GameState.player.stats.attack) {
                dmg = GameState.player.stats.attack;
            }

            GameState.enemy.currentHp -= dmg;

            // Ensure we don't drop below 0 logic-wise yet
            if (GameState.enemy.currentHp < 0) GameState.enemy.currentHp = 0;

            // Update UI
            UI.updateHP(GameState.player.currentHp, GameState.player.maxHp, GameState.enemy.currentHp, GameState.enemy.maxHp);
            
            // Show Feedback
            UI.showFeedback(`HIT! -${dmg}`, true);
            
            // Check Win
            this.checkWinCondition();
        }, 100); 
    },

    processWrongAnswer() {
        this.stopTurnTimer();
        AudioManager.playSFX('sfx_wrong');
        UI.triggerPlayerHurtAnim();
        UI.showFeedback("Missed!", false);
        document.getElementById('input-blocker').classList.remove('hidden');
        setTimeout(() => { this.startEnemyTurn(); }, this.DELAY_TURN_SWITCH);
    },

checkWinCondition() {
    if (GameState.enemy.currentHp <= 0) {
        this.winBattle();
    } else {
        // Enemy is still alive -> Start their turn
        setTimeout(() => this.startEnemyTurn(), 1000);
    }
},

    winBattle() {
        this.stopTurnTimer();
        
        // 1. Victory Feedback
        UI.showFeedback("VICTORY!", true);
        
        // 2. Wait 2 seconds, then tell Main.js we won
        setTimeout(() => {
            if (this.onVictory) {
                this.onVictory(); // <--- This calls the logic in main.js to show the map correctly
            } else {
                console.error("Victory callback missing! Reloading...");
                location.reload(); // Failsafe
            }
        }, 2000);
    },

    startEnemyTurn() {
        if (GameState.enemy.currentHp <= 0) return;

        GameState.isPlayerTurn = false;
        UI.setTurnIndicator(false);
        this.setCombatUIFurl(true);
        document.getElementById('input-blocker').classList.remove('hidden');

        setTimeout(() => {
            UI.animateEnemyAttack();
            this.startQTE();
        }, 1500);
    },

    // --- TIMERS ---
    startTurnTimer() {
        if (!GameState.isPlayerTurn) return;
        this.turnStartTime = Date.now();
        cancelAnimationFrame(this.turnTimerId);

        const update = () => {
            if (!GameState.isPlayerTurn) return;
            const elapsed = Date.now() - this.turnStartTime;
            const remaining = Math.max(0, this.TURN_TIME_LIMIT - elapsed);
            const percent = (remaining / this.TURN_TIME_LIMIT) * 100;

            UI.updateTimer(percent);

            if (remaining <= 0) {
                this.stopTurnTimer();
                UI.showFeedback("TIME'S UP!", false);
                document.getElementById('input-blocker').classList.remove('hidden');
                setTimeout(() => { this.startEnemyTurn(); }, 1000);
            } else {
                this.turnTimerId = requestAnimationFrame(update);
            }
        };
        update();
    },

    stopTurnTimer() {
        cancelAnimationFrame(this.turnTimerId);
        UI.updateTimer(100);
    },

    // --- QTE SYSTEM ---
    startQTE() {
        GameState.isQTEActive = true;
        document.getElementById('qte-container').classList.remove('hidden');

        const targetZone = document.getElementById('qte-target-zone');
        const randomLeft = Math.floor(Math.random() * 60) + 20;
        targetZone.style.left = randomLeft + '%';

        this.qtePosition = 0;
        this.qteDirection = 1;
        this.qteSpeed = 1.5;
        if (GameState.enemy.name === 'Syntax Guardian') this.qteSpeed = 2.2;

        this.runQTELoop();
    },

    runQTELoop() {
        if (!GameState.isQTEActive) return;
        const cursor = document.getElementById('qte-cursor');

        this.qtePosition += this.qteSpeed * this.qteDirection;
        if (this.qtePosition >= 98 || this.qtePosition <= 0) this.qteDirection *= -1;

        cursor.style.left = this.qtePosition + '%';
        this.qteAnimationId = requestAnimationFrame(() => this.runQTELoop());
    },

    resolveQTE() {
        if (!GameState.isQTEActive) return;
        GameState.isQTEActive = false;
        cancelAnimationFrame(this.qteAnimationId);

        const container = document.getElementById('qte-container');
        const bar = document.getElementById('qte-bar');
        const cursor = this.qtePosition;
        const targetEl = document.getElementById('qte-target-zone');
        const targetStart = parseFloat(targetEl.style.left);
        const targetEnd = targetStart + 20;

        const isSuccess = (cursor >= targetStart && cursor <= targetEnd);

        if (isSuccess) {
            UI.showFeedback("BLOCKED!", true);
            AudioManager.playSFX('sfx_block'); // BLOCK SOUND
            bar.classList.add('qte-success');
        } else {
            UI.showFeedback("TOOK DAMAGE!", false);
            AudioManager.playSFX('sfx_hurt');  // HURT SOUND
            UI.triggerPlayerHurtAnim();
            bar.classList.add('qte-fail');
            UI.flashDamage();
            GameState.player.currentHp -= GameState.enemy.damage;
        }
        UI.updateStats();

        setTimeout(() => {
            container.classList.add('slide-out-down');
            setTimeout(() => {
                container.classList.add('hidden');
                container.classList.remove('slide-out-down');
                bar.classList.remove('qte-success', 'qte-fail');

                if (GameState.player.currentHp <= 0) {
                    if(this.onDefeat) this.onDefeat();
                } else {
                    GameState.isPlayerTurn = true;
                    UI.setTurnIndicator(true);
                    this.setCombatUIFurl(false);
                    document.getElementById('input-blocker').classList.add('hidden');
                    this.generateNewQuestion();
                }
            }, 500);
        }, 600);
    },

    // --- UTILS ---
    useHint() {
        if (!GameState.isPlayerTurn || GameState.isQTEActive) return;
        if (GameState.player.hints <= 0) {
            UI.showFeedback("No Hints!", false);
            return;
        }
        if (GameState.currentQuestion.type === 'input') {
            UI.showFeedback("Cannot hint here!", false);
            return;
        }

        const wrongIndices = [];
        GameState.currentQuestion.answers.forEach((_, index) => {
            if (index !== GameState.currentQuestion.correct) {
                if (!document.getElementById(`btn-${index}`).disabled) {
                    wrongIndices.push(index);
                }
            }
        });

        if (wrongIndices.length === 0) return;

        const removeIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
        GameState.player.hints--;
        UI.removeWrongAnswer(removeIndex);
        UI.updateStats();
    },

    setCombatUIFurl(isFurled) {
        const ids = ['question-box', 'answer-grid', 'input-answer-container'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (isFurled) el.classList.add('furled');
                else el.classList.remove('furled');
            }
        });
    },

    // The fix for the wildcard crash
    cleanup() {
        document.getElementById('battle-arena').classList.add('hidden');
        document.getElementById('turn-banner').classList.add('hidden');
        this.setCombatUIFurl(true);
        GameState.isQTEActive = false;
        GameState.isPlayerTurn = false;
        this.stopTurnTimer();
        cancelAnimationFrame(this.qteAnimationId);
    }
};