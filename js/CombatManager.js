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
        AudioManager.playBGM('bgm_combat'); // Switch to Battle Theme
        // Unhide Arena (Fix from Phase 1)
        document.getElementById('battle-arena').classList.remove('hidden');
        document.getElementById('turn-banner').classList.remove('hidden');
        
        let enemyTemplate;
        if (node.type === 'boss') enemyTemplate = EnemyTypes[4];
        else if (node.type === 'miniboss') enemyTemplate = EnemyTypes[3];
        else if (isWildcard) enemyTemplate = EnemyTypes[Math.floor(Math.random() * 3)];
        else enemyTemplate = EnemyTypes[node.id % 3];

        // Setup Enemy Stats
        GameState.enemy.name = enemyTemplate.name;
        GameState.enemy.maxHp = enemyTemplate.hp;
        GameState.enemy.currentHp = enemyTemplate.hp;
        GameState.enemy.icon = enemyTemplate.icon;
        GameState.enemy.damage = 1;

        // Setup Questions
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
        UI.animatePlayerAttack();
        AudioManager.playSFX('sfx_click');
        setTimeout(() => AudioManager.playSFX('sfx_attack'), 200);
        UI.showFeedback("Correct!", true);
        document.getElementById('input-blocker').classList.remove('hidden');

        setTimeout(() => {
            GameState.enemy.currentHp -= 1;
            UI.shakeScreen(document.getElementById('enemy-sprite'));
            UI.updateStats();
            this.checkWinCondition();
        }, this.DELAY_ATTACK_ANIM);
    },

    processWrongAnswer() {
        UI.showFeedback("Missed!", false);
        document.getElementById('input-blocker').classList.remove('hidden');
        setTimeout(() => { this.startEnemyTurn(); }, this.DELAY_TURN_SWITCH);
    },

checkWinCondition() {
    if (GameState.enemy.currentHp <= 0) {
        this.stopTurnTimer();
        setTimeout(() => {
            UI.showFeedback("VICTORY!", true);
            AudioManager.playBGM('bgm_forest'); // Switch back to exploration music
            setTimeout(() => {
                // DO NOT PUT this.cleanup() HERE! 
                // It must be empty so the UI stays fully visible until the black screen hits.
                
                if(this.onVictory) this.onVictory();
            }, 1500);
        }, this.DELAY_DAMAGE);
    } else {
        setTimeout(() => this.startEnemyTurn(), this.DELAY_TURN_SWITCH);
    }
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