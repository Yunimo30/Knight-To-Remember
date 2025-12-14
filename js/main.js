import { GameState, EnemyTypes, Items } from './GameState.js';
import UI from './UIManager.js';

let allQuestions = [];
let pendingNode = null; // Stores the node currently viewed in the tooltip

// --- CONSTANTS ---
const DELAY_ATTACK_ANIM = 900;
const DELAY_DAMAGE = 1000;
const DELAY_TURN_SWITCH = 1500;
const TURN_TIME_LIMIT = 10000; // 10 Seconds per turn

// Globals
let turnTimerId = null;
let turnStartTime = 0;
let qteAnimationId = null;
let qteDirection = 1;
let qtePosition = 0;
let qteSpeed = 2.5;

// --- INITIALIZATION ---
async function initGame() {
    try {
        // 1. Load Data (Preload)
        const response = await fetch('assets/data/questions.json');
        const data = await response.json();
        allQuestions = data.topics; 
        
        // 2. Setup Global Inputs
        window.addEventListener('keydown', (e) => {
            if (GameState.isQTEActive && e.code === 'Space') resolveQTE();
        });

        setupInventoryUI();
        document.getElementById('btn-use-hint').onclick = useHint;

        // 3. SETUP MENU LISTENERS (New)
        setupMainMenu();

    } catch (error) {
        console.error("Error during Init:", error);
    }
}

// --- MENU SYSTEM LOGIC ---
function setupMainMenu() {
    // Start Button
    document.getElementById('btn-start-game').onclick = () => {
        document.getElementById('main-menu-screen').classList.add('hidden');
        startCutscene();
    };

    // Tutorial Button
    document.getElementById('btn-tutorial').onclick = () => {
        document.getElementById('tutorial-screen').classList.remove('hidden');
    };

    // Close Tutorial
    document.getElementById('btn-close-tutorial').onclick = () => {
        document.getElementById('tutorial-screen').classList.add('hidden');
    };
}

function startCutscene() {
    const cutscene = document.getElementById('cutscene-screen');
    cutscene.classList.remove('hidden');

    // Auto-end after 18 seconds (matching CSS animation roughly)
    const timer = setTimeout(() => {
        endCutscene();
    }, 18000);

    // Skip Button
    document.getElementById('btn-skip-cutscene').onclick = () => {
        clearTimeout(timer); // Stop auto-end
        endCutscene();
    };
}

function endCutscene() {
    const cutscene = document.getElementById('cutscene-screen');
    cutscene.classList.add('hidden');
    
    // REVEAL GAME CONTAINER
    const gameContainer = document.getElementById('game-container');
    gameContainer.classList.remove('hidden');

    // NOW RENDER THE MAP
    renderMap();
}

// --- TIMER SYSTEM ---
function startTurnTimer() {
    if (!GameState.isPlayerTurn) return;
    
    turnStartTime = Date.now();
    cancelAnimationFrame(turnTimerId); // Clear any old timer
    
    function update() {
        if (!GameState.isPlayerTurn) return; // Stop if turn ended abruptly

        const elapsed = Date.now() - turnStartTime;
        const remaining = Math.max(0, TURN_TIME_LIMIT - elapsed);
        const percent = (remaining / TURN_TIME_LIMIT) * 100;
        
        UI.updateTimer(percent);

        if (remaining <= 0) {
            handleTimeOut();
        } else {
            turnTimerId = requestAnimationFrame(update);
        }
    }
    
    update();
}

function stopTurnTimer() {
    cancelAnimationFrame(turnTimerId);
    UI.updateTimer(100); // Visual reset
}

function handleTimeOut() {
    stopTurnTimer();
    UI.showFeedback("TIME'S UP!", false);
    // Block input and force enemy turn
    document.getElementById('input-blocker').classList.remove('hidden');
    setTimeout(() => {
        startEnemyTurn();
    }, 1000);
}

// --- HINT SYSTEM ---
function useHint() {
    // Validation
    if (!GameState.isPlayerTurn || GameState.isQTEActive) return;
    if (GameState.player.hints <= 0) {
        UI.showFeedback("No Hints Left!", false);
        return;
    }
    if (!GameState.currentQuestion) return;

    // Find wrong answers that are currently enabled
    const wrongIndices = [];
    GameState.currentQuestion.answers.forEach((_, index) => {
        if (index !== GameState.currentQuestion.correct) {
            // Check if button is not already disabled
            if (!document.getElementById(`btn-${index}`).disabled) {
                wrongIndices.push(index);
            }
        }
    });

    if (wrongIndices.length === 0) return; 

    // Pick random wrong answer to remove
    const removeIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    
    // Apply logic
    GameState.player.hints--;
    UI.removeWrongAnswer(removeIndex);
    UI.updateStats();
}

// --- MAP SYSTEM ---
function renderMap() {
    const mapContainer = document.getElementById('map-nodes-container');
    const mapScreen = document.getElementById('map-screen');
    mapScreen.classList.remove('hidden-map');
    
    mapContainer.innerHTML = ''; 

    // Helper: Create Node Element
    const createNodeEl = (node, visibility) => {
        const el = document.createElement('div');
        el.className = `map-node ${node.status}`;
        if (node.type === 'boss') el.classList.add('boss');
        
        if (visibility === 'obscured') {
            el.innerHTML = `<span>???</span>`;
            el.classList.add('obscured');
        } else {
            el.innerHTML = `<span>${node.name}</span>`;
            // Only add click listener if accessible
            if (node.status === 'unlocked' || node.status === 'available') {
                el.onclick = () => openScrollModal(node);
            }
        }
        return el;
    };

    // Define Ranks for Horizontal Layout
    const ranks = [
        [GameState.map[0]],
        [GameState.map[1]],
        [GameState.map[2], GameState.map[3]],
        [GameState.map[4]],
        [GameState.map[5]],
        [GameState.map[6]]
    ];

    // Determine current Max Reachable Rank for Fog of War
    let currentRankIndex = 0;
    ranks.forEach((rank, index) => {
        if (rank.find(n => n.id === GameState.player.currentNodeId)) {
            currentRankIndex = index;
        }
    });

    ranks.forEach((rank, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'map-row';
        
        let visibility = 'visible';
        
        // Logic: Show current + next rank. Obscure the one after. Hide the rest.
        if (index <= currentRankIndex + 1) {
            visibility = 'visible';
        } else if (index === currentRankIndex + 2) {
            visibility = 'obscured';
        } else {
            visibility = 'hidden';
            rowDiv.classList.add('hidden-rank');
        }

        rank.forEach(node => {
            if(node) rowDiv.appendChild(createNodeEl(node, visibility));
        });
        
        mapContainer.appendChild(rowDiv);
    });
}

function openScrollModal(node) {
    // Validate Connection (Same logic as before)
    const previousNode = GameState.map[GameState.player.currentNodeId];
    if (GameState.player.currentNodeId === 0 && node.id === 1) {
        // Allow
    } else if (!previousNode.connections.includes(node.id)) {
        return; 
    }

    pendingNode = node;
    const modal = document.getElementById('scroll-modal');
    
    // Update Text
    document.getElementById('scroll-title').innerText = node.name;
    document.getElementById('scroll-desc').innerText = node.desc || "The path ahead is unclear...";

    // Show & Animate
    modal.classList.remove('hidden');
    // Small timeout to allow CSS transition to catch the "hidden" removal
    setTimeout(() => {
        modal.classList.add('active'); // Triggers height expansion
    }, 10);

    // Setup Buttons
    document.getElementById('scroll-btn-go').onclick = () => {
        closeScrollModal();
        // Wait for close anim, then transition
        setTimeout(() => {
             playTransition(() => proceedToNode(pendingNode));
        }, 300);
    };

    document.getElementById('scroll-btn-close').onclick = () => {
        closeScrollModal();
    };
}

function closeScrollModal() {
    const modal = document.getElementById('scroll-modal');
    modal.classList.remove('active'); // Retracts paper
    
    // Wait for retraction (0.6s) before hiding element
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 600);
}

function closeTooltipOutside(e) {
    const tooltip = document.getElementById('map-tooltip');
    // If click is NOT inside tooltip and NOT on a map node
    if (!tooltip.contains(e.target) && !e.target.classList.contains('map-node')) {
        tooltip.classList.remove('active');
    }
}

// --- TRANSITION & STATE CHANGE ---
function playTransition(callback) {
    const overlay = document.getElementById('transition-overlay');
    overlay.classList.remove('hidden');
    
    // --- THE FIX ---
    // Force a Browser Reflow. This trick makes the browser "acknowledge" 
    // the element is transparent BEFORE we make it black.
    void overlay.offsetWidth; 
    // ----------------
    
    overlay.classList.add('active'); // Start fading to black

    // Wait for the fade-in (0.5s) to finish
    setTimeout(() => {
        callback(); // Change the game state while screen is black
        
        // Small delay to ensure the new scene is rendered behind the black screen
        setTimeout(() => {
            overlay.classList.remove('active'); // Fade back to transparent
            
            // Wait for the fade-out (0.5s) to finish before hiding the div
            setTimeout(() => overlay.classList.add('hidden'), 500);
        }, 100);
    }, 500); 
}

function proceedToNode(node) {
    const previousNode = GameState.map[GameState.player.currentNodeId];
    
    // Lock non-selected paths
    if(previousNode) {
        previousNode.connections.forEach(connectedId => {
            if (connectedId !== node.id) {
                GameState.map[connectedId].status = 'locked';
            }
        });
    }

    document.getElementById('map-screen').classList.add('hidden-map');
    GameState.player.currentNodeId = node.id;
    GameState.level.current = node.id;

    // Resolve Node Type
    if (node.type === 'enemy' || node.type === 'boss') {
        startCombat(node);
    } else if (node.type === 'item') {
        runEventScene('item');
    } else if (node.type === 'wildcard') {
        runEventScene('wildcard');
    }
}

// --- EVENT SCENE (Immersion) ---
function runEventScene(type) {
    const screen = document.getElementById('event-screen');
    const title = document.getElementById('event-title');
    const icon = document.getElementById('event-icon');
    const desc = document.getElementById('event-desc');

    screen.classList.remove('hidden');
    title.innerText = "Exploring...";
    icon.innerHTML = '<i class="fa-solid fa-shoe-prints"></i>';
    desc.innerText = "You venture deeper into the forest...";

    // Trigger Slide-Up Animation (even though empty)
    UI.triggerBattleStartAnim();

    setTimeout(() => {
        if (type === 'item') {
            title.innerText = "Treasure Found!";
            icon.innerHTML = '<i class="fa-solid fa-chest"></i>';
            desc.innerText = "You found a potion!";
            
            const item = Math.random() > 0.7 ? Items.potion_large : Items.potion_small;
            GameState.player.inventory.push(item);
            
            setTimeout(() => {
                playTransition(() => {
                    screen.classList.add('hidden');
                    completeNode();
                });
            }, 1500);

        } else if (type === 'wildcard') {
            const isAmbush = Math.random() > 0.5;
            if (isAmbush) {
                title.innerText = "AMBUSH!";
                icon.innerHTML = '<i class="fa-solid fa-skull-crossbones"></i>';
                desc.innerText = "Prepare to fight!";
                setTimeout(() => {
                    playTransition(() => {
                        screen.classList.add('hidden');
                        startCombat(GameState.map[GameState.player.currentNodeId], true);
                    });
                }, 1500);
            } else {
                title.innerText = "Safe Path";
                icon.innerHTML = '<i class="fa-solid fa-sun"></i>';
                desc.innerText = "You find a dropped item.";
                
                const item = Items.potion_small;
                GameState.player.inventory.push(item);

                setTimeout(() => {
                    playTransition(() => {
                        screen.classList.add('hidden');
                        completeNode();
                    });
                }, 1500);
            }
        }
    }, 2000);
}

// --- COMBAT SYSTEM ---
function startCombat(node, isWildcard = false) {
    let enemyTemplate;
    
    if (node.type === 'boss') {
        enemyTemplate = EnemyTypes[3]; 
    } else if (isWildcard) {
        enemyTemplate = EnemyTypes[Math.floor(Math.random() * 3)]; 
    } else {
        enemyTemplate = EnemyTypes[node.id % 3]; 
    }

    GameState.enemy.name = enemyTemplate.name;
    GameState.enemy.maxHp = enemyTemplate.hp;
    GameState.enemy.currentHp = enemyTemplate.hp;
    GameState.enemy.icon = enemyTemplate.icon;
    GameState.enemy.damage = 1; 

    // Topic Selection
    let topicData;
    if(node.topicId) {
        topicData = allQuestions.find(t => t.id === node.topicId);
    } 
    if(!topicData) topicData = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    GameState.currentTopicQuestions = topicData.questions;

    // Setup State
    GameState.isPlayerTurn = true;
    UI.setupEnemy(GameState.enemy);
    UI.updateStats();
    UI.setTurnIndicator(true);
    
    // Trigger Slide Animation
    UI.triggerBattleStartAnim();
    
    // Unlock Input
    document.getElementById('input-blocker').classList.add('hidden');
    
    generateNewQuestion();
}

function completeNode() {
    const currentNode = GameState.map[GameState.player.currentNodeId];
    currentNode.status = 'completed';
    
    currentNode.connections.forEach(nextId => {
        if(GameState.map[nextId]) {
            GameState.map[nextId].status = 'available';
        }
    });

    renderMap(); 
}

// --- TURN LOGIC ---
function generateNewQuestion() {
    const questions = GameState.currentTopicQuestions || [];
    const q = questions[Math.floor(Math.random() * questions.length)];
    GameState.currentQuestion = q;
    UI.displayQuestion(q);
    
    // Start Timer
    startTurnTimer();
}

window.handleAnswer = function(selectedIndex) {
    if (!GameState.isPlayerTurn || GameState.isQTEActive) return;

    stopTurnTimer(); // Stop timer immediately

    const correctIndex = GameState.currentQuestion.correct;

    if (selectedIndex === correctIndex) {
        // CORRECT
        UI.animatePlayerAttack();
        UI.showFeedback("Correct!", true);
        document.getElementById('input-blocker').classList.remove('hidden'); // Block during anim
        
        setTimeout(() => {
            GameState.enemy.currentHp -= 1;
            UI.shakeScreen(document.getElementById('enemy-sprite'));
            UI.updateStats();
            checkWinCondition();
        }, DELAY_ATTACK_ANIM);

    } else {
        // WRONG
        UI.showFeedback("Missed!", false);
        document.getElementById('input-blocker').classList.remove('hidden');
        setTimeout(() => {
            startEnemyTurn();
        }, DELAY_TURN_SWITCH);
    }
};

function startEnemyTurn() {
    GameState.isPlayerTurn = false;
    UI.setTurnIndicator(false);
    document.getElementById('input-blocker').classList.remove('hidden');

    setTimeout(() => {
        UI.animateEnemyAttack();
        startQTE();
    }, 1500);
}

// --- QTE SYSTEM ---
function startQTE() {
    GameState.isQTEActive = true;
    document.getElementById('qte-container').classList.remove('hidden');
    
    const targetZone = document.getElementById('qte-target-zone');
    const randomLeft = Math.floor(Math.random() * 60) + 20; 
    targetZone.style.left = randomLeft + '%';

    qtePosition = 0;
    qteDirection = 1;
    qteSpeed = 1.5;

    runQTELoop();
}

function runQTELoop() {
    if (!GameState.isQTEActive) return;
    const cursor = document.getElementById('qte-cursor');
    qtePosition += qteSpeed * qteDirection;
    if (qtePosition >= 98 || qtePosition <= 0) qteDirection *= -1;
    cursor.style.left = qtePosition + '%';
    qteAnimationId = requestAnimationFrame(runQTELoop);
}

function resolveQTE() {
    GameState.isQTEActive = false;
    cancelAnimationFrame(qteAnimationId);
    document.getElementById('qte-container').classList.add('hidden');

    const cursor = qtePosition;
    const targetEl = document.getElementById('qte-target-zone');
    const targetStart = parseFloat(targetEl.style.left);
    const targetEnd = targetStart + 20;

    if (cursor >= targetStart && cursor <= targetEnd) {
        UI.showFeedback("BLOCKED!", true);
    } else {
        UI.showFeedback("TOOK DAMAGE!", false);
        UI.flashDamage();
        GameState.player.currentHp -= GameState.enemy.damage;
    }

    UI.updateStats();
    checkLossCondition();

    // End Turn if Player Survives
    if (GameState.player.currentHp > 0) {
        setTimeout(() => {
            GameState.isPlayerTurn = true;
            UI.setTurnIndicator(true);
            document.getElementById('input-blocker').classList.add('hidden');
            generateNewQuestion();
        }, DELAY_TURN_SWITCH);
    }
}

// --- WIN/LOSS CONDITIONS ---
function checkWinCondition() {
    if (GameState.enemy.currentHp <= 0) {
        setTimeout(() => {
            alert("Victory!");
            playTransition(() => completeNode());
        }, DELAY_DAMAGE);
    } else {
        setTimeout(startEnemyTurn, DELAY_TURN_SWITCH);
    }
}

function checkLossCondition() {
    if (GameState.player.currentHp <= 0) {
        setTimeout(() => {
            alert("Game Over.");
            location.reload();
        }, DELAY_DAMAGE);
    }
}

// --- INVENTORY ---
function setupInventoryUI() {
    const btnItems = document.getElementById('btn-items');
    const btnCloseInv = document.getElementById('close-inventory');
    const invModal = document.getElementById('inventory-modal');

    if(btnItems) btnItems.onclick = openInventory;
    if(btnCloseInv) btnCloseInv.onclick = () => invModal.classList.add('hidden');
}

function openInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    
    if(GameState.player.inventory.length === 0) {
        list.innerHTML = '<li>Empty</li>';
    } else {
        GameState.player.inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${item.name} <button class="use-btn" style="margin-left:10px;">Use</button>`;
            li.querySelector('button').onclick = () => useItem(index);
            list.appendChild(li);
        });
    }
    document.getElementById('inventory-modal').classList.remove('hidden');
}

function useItem(index) {
    const item = GameState.player.inventory[index];
    
    if(GameState.player.currentHp < GameState.player.maxHp) {
        GameState.player.currentHp += item.hp;
        if(GameState.player.currentHp > GameState.player.maxHp) GameState.player.currentHp = GameState.player.maxHp;
        
        GameState.player.inventory.splice(index, 1);
        UI.updateStats();
        openInventory(); 
        alert(`Used ${item.name}! HP is now ${GameState.player.currentHp}`);
    } else {
        alert("HP is already full!");
    }
}

// --- BUTTONS ---
document.getElementById('btn-0').onclick = () => handleAnswer(0);
document.getElementById('btn-1').onclick = () => handleAnswer(1);
document.getElementById('btn-2').onclick = () => handleAnswer(2);
document.getElementById('btn-3').onclick = () => handleAnswer(3);

initGame();