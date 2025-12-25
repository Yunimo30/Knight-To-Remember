import { GameState, Items } from './GameState.js';
import UI from './UIManager.js';
import { LevelManager } from './LevelManager.js';
import { MapRenderer } from './MapRenderer.js';     // NEW
import { CombatManager } from './CombatManager.js'; // NEW
import { SaveManager } from './SaveManager.js'; // Add to imports
import { AudioManager } from './AudioManager.js';



// --- GLOBAL STATE ---
let pendingNode = null; 

// =========================================
// 1. INITIALIZATION
// =========================================
async function initGame() {
    try {
        console.log("Initializing Game...");

        // Setup Combat Manager callbacks
        CombatManager.init(
            () => { // On Victory
                // We trigger the black screen transition FIRST
                playTransition(() => {
                    // NOW we clean up, while the player can't see anything.
                    CombatManager.cleanup(); 
                    
                    // Then we proceed.
                    completeNode();
                });
            },
            () => { // On Defeat
                setTimeout(() => {
                    showGameMessage("Game Over", "fa-skull", "You have fallen...", () => location.reload());
                }, 1200);
            }
        );

        // STARTUP MUSIC (Browsers require interaction first)
        document.body.addEventListener('click', () => {
            // Only start menu music if nothing is playing
            if (!AudioManager.currentBgmKey) AudioManager.playBGM('bgm_menu');
        }, { once: true });

        // GLOBAL BUTTON SOUNDS
        // This finds every button currently in HTML and adds sound listeners
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => AudioManager.playSFX('sfx_hover'));
            btn.addEventListener('click', () => AudioManager.playSFX('sfx_click'));
        });

        // 1. Input Listeners
        window.addEventListener('keydown', (e) => {
            if (GameState.isQTEActive && e.code === 'Space') CombatManager.resolveQTE();
            // Debug Keys
            if (e.code === 'F8') debugKill(); // See debug section below
            if (e.code === 'F9') debugTeleportBoss();
        });

        const btnSubmit = document.getElementById('btn-submit-input');
        const playerInput = document.getElementById('player-input');
        if (btnSubmit) btnSubmit.onclick = () => CombatManager.handleInputAnswer(playerInput.value);
        if (playerInput) {
            playerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                     CombatManager.handleInputAnswer(playerInput.value);
                     playerInput.value = "";
                }
            });
        }

        for (let i = 0; i < 4; i++) {
            const btn = document.getElementById(`btn-${i}`);
            if (btn) btn.onclick = () => CombatManager.handleAnswer(i);
        }

        // QTE Button
        const qteBtn = document.getElementById('btn-qte-block');
        if(qteBtn) qteBtn.onclick = () => { if (GameState.isQTEActive) CombatManager.resolveQTE(); };

        // Hint & Inventory
        document.getElementById('btn-use-hint').onclick = () => CombatManager.useHint();
        setupInventoryUI();
        setupSettings();

        // 2. Window Resize (Delegate to MapRenderer)
        window.addEventListener('resize', () => {
            const overlay = document.getElementById('transition-overlay');
            if (overlay && (overlay.classList.contains('active') || !overlay.classList.contains('hidden'))) return;
            // Only update if map is visible
            if(!document.getElementById('map-screen').classList.contains('hidden-map')) {
                 const token = document.getElementById('player-token');
                 if(token) token.style.transition = 'none';
                 MapRenderer.updatePlayerTokenPosition(GameState.player.currentNodeId);
            }
        });

        // Journal System
        document.getElementById('journal-btn-container').onclick = openJournal;
        document.getElementById('btn-close-journal').onclick = closeJournalWithAnim;

        // 3. Menus
        setupMainMenu();

    } catch (error) {
        console.error("Critical Error during Init:", error);
    }
}

// =========================================
// 2. MENU SYSTEM
// =========================================
function setupMainMenu() {
    const startBtn = document.getElementById('btn-start-game');
    const continueBtn = document.getElementById('btn-continue');

    // CHECK FOR SAVE
    if (SaveManager.hasSave()) {
        continueBtn.classList.remove('hidden');
        
        continueBtn.onclick = async () => {
            continueBtn.style.transform = "scale(0.95)";
            
            // 1. Load Data
            const savedData = SaveManager.load();
            if (savedData) {
                // 2. Load World Assets (Questions/Lessons)
                await LevelManager.loadWorld(savedData.progression.currentWorldId);
                AudioManager.playBGM('bgm_forest'); // Switch to Forest Theme
                
                // 3. Inject Saved State (Overwriting default world data)
                Object.assign(GameState.player, savedData.player);
                Object.assign(GameState.progression, savedData.progression);
                GameState.currentMapData = savedData.currentMapData; // Restore cleared nodes

                // 4. Launch Game (Skip Cutscene)
                document.getElementById('main-menu-screen').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
                MapRenderer.render('map-nodes-container', openScrollModal);
                
                showGameMessage("Welcome Back", "fa-dungeon", "Your journey continues...");
            }
        };
    }

    // NEW GAME HANDLER
    startBtn.onclick = async () => {
        if (SaveManager.hasSave()) {
            if (!confirm("Start a new game? Your previous save will be overwritten.")) return;
        }
        
        SaveManager.clear(); // Wipe old save
        startBtn.style.transform = "scale(0.95)";
        
        // Load default world 1
        await LevelManager.loadWorld('world_1');
        AudioManager.playBGM('bgm_forest'); // Switch to Forest Theme
        
        setTimeout(() => {
            document.getElementById('main-menu-screen').classList.add('hidden');
            startCutscene();
        }, 200);
    };

    document.getElementById('btn-tutorial').onclick = () => {
        document.getElementById('tutorial-screen').classList.remove('hidden');
    };
    document.getElementById('btn-close-tutorial').onclick = () => {
        document.getElementById('tutorial-screen').classList.add('hidden');
    };

    setupPauseMenu();
}

function setupPauseMenu() {
    const btnMenu = document.getElementById('btn-menu');
    const pauseModal = document.getElementById('pause-menu');
    const btnResume = document.getElementById('btn-resume');
    const btnQuit = document.getElementById('btn-quit');

    if (btnMenu) {
        btnMenu.onclick = () => {
            const gameHidden = document.getElementById('game-container').classList.contains('hidden');
            if(!GameState.isQTEActive && !gameHidden) {
                pauseModal.classList.remove('hidden');
            }
        };
    }
    if (btnResume) btnResume.onclick = () => pauseModal.classList.add('hidden');
    if (btnQuit) btnQuit.onclick = () => {
        if(confirm("Quit to Title Screen? Unsaved progress will be lost.")) location.reload();
    };
}

function startCutscene() {
    const cutscene = document.getElementById('cutscene-screen');
    cutscene.classList.remove('hidden');
    const timer = setTimeout(() => { endCutscene(); }, 20000);
    document.getElementById('btn-skip-cutscene').onclick = () => {
        clearTimeout(timer);
        endCutscene();
    };
}

function endCutscene() {
    document.getElementById('cutscene-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    // RENDER MAP VIA RENDERER
    MapRenderer.render('map-nodes-container', openScrollModal);
}

// =========================================
// 3. MAP & NODE LOGIC
// =========================================
// Note: MapRenderer now handles the drawing. 
// We just need to handle what happens when a node is CLICKED.

function openScrollModal(node) {
    const nodes = GameState.currentMapData.nodes;
    const previousNode = nodes.find(n => n.id === GameState.player.currentNodeId);
    
    // Prevent clicking backward unless it's start
    if (GameState.player.currentNodeId !== 0 && !previousNode.connections.includes(node.id) && node.id !== GameState.player.currentNodeId) {
        return;
    }

    pendingNode = node;
    const modal = document.getElementById('scroll-modal');
    document.getElementById('scroll-title').innerText = node.name;
    document.getElementById('scroll-desc').innerText = node.desc || "The path ahead is unclear...";

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.add('active'); }, 10);

    document.getElementById('scroll-btn-go').onclick = () => {
        closeScrollModal();
        setTimeout(() => {
             playTransition(() => proceedToNode(pendingNode));
        }, 300);
    };
    document.getElementById('scroll-btn-close').onclick = () => closeScrollModal();
}

function closeScrollModal() {
    const modal = document.getElementById('scroll-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.classList.add('hidden'); }, 600);
}

function playTransition(callback) {
    const overlay = document.getElementById('transition-overlay');
    overlay.classList.remove('hidden');
    void overlay.offsetWidth; 
    overlay.classList.add('active'); 

    setTimeout(() => {
        if(callback) callback();
        setTimeout(() => {
            overlay.classList.remove('active'); 
            setTimeout(() => overlay.classList.add('hidden'), 500);
        }, 500);
    }, 600); 
}

function proceedToNode(node) {
    // A: LESSON
    if (node.type === 'lesson') {
        if (!GameState.player.unlockedLessons.includes(node.topicId)) {
            GameState.player.unlockedLessons.push(node.topicId);
        }
        openJournalTopic(node.topicId, true, node); 
    } 
    // B: COMBAT
    else if (node.type === 'enemy' || node.type === 'boss' || node.type === 'miniboss') {
        updatePlayerNodeState(node);
        document.getElementById('map-screen').classList.add('hidden-map');
        // DELEGATE TO COMBAT MANAGER
        CombatManager.startCombat(node);
    } 
    // C: EVENTS
    else if (node.type === 'item') {
        runEventScene('item', node);
    } 
    else if (node.type === 'wildcard') {
        runEventScene('wildcard', node);
    }
}

function updatePlayerNodeState(node) {
    GameState.player.previousNodeId = GameState.player.currentNodeId;
    GameState.player.currentNodeId = node.id;

    const nodes = GameState.currentMapData.nodes;
    const previousNode = nodes.find(n => n.id === GameState.player.previousNodeId);
    if(previousNode && previousNode.connections) {
        previousNode.connections.forEach(connectedId => {
            const connectedNode = nodes.find(n => n.id === connectedId);
            if (connectedNode && connectedId !== node.id && connectedNode.status === 'available') {
                connectedNode.status = 'locked';
            }
        });
    }
}

// In js/main.js

function completeNode() {
    const nodes = GameState.currentMapData.nodes;
    const currentNode = nodes.find(n => n.id === GameState.player.currentNodeId);
    if(currentNode) currentNode.status = 'completed';
    
    // Unlock next nodes
    if (currentNode.connections) {
        currentNode.connections.forEach(nextId => {
            const nextNode = nodes.find(n => n.id === nextId);
            if(nextNode) nextNode.status = 'available';
        });
    }

    // --- FIX STARTS HERE ---
    
    SaveManager.save(); // Auto-save after clearing a stage
    
    // 1. Always render the map first. 
    // This covers up the combat UI with the Map Screen immediately.
    MapRenderer.render('map-nodes-container', openScrollModal);

    // 2. NOW check for Boss condition
    if (currentNode.type === 'boss') {
        showGameMessage("Region Cleared!", "fa-crown", "The corruption fades...", () => {
            if (GameState.progression.currentWorldId === 'world_1') {
                playTransition(async () => {
                    await LevelManager.loadWorld('world_2');
                    GameState.player.currentNodeId = 0;
                    GameState.player.previousNodeId = undefined;
                    MapRenderer.render('map-nodes-container', openScrollModal);
                    showGameMessage("New Region", "fa-map", "Entered: The Logic Caves");
                });
            } else {
                showGameMessage("Alpha Complete!", "fa-trophy", "Thanks for playing!", () => location.reload());
            }
        });
        return; 
    } else if (currentNode.type === 'miniboss') {
        showGameMessage("Mini-Boss Defeated!", "fa-shield-halved", "The guardian crumbles.");
    }
}

// =========================================
// 4. EVENT SCENES
// =========================================
function runEventScene(type, targetNode) {
    // USE MANAGER CLEANUP
    CombatManager.cleanup();

    const screen = document.getElementById('event-screen');
    const title = document.getElementById('event-title');
    const icon = document.getElementById('event-icon');
    const desc = document.getElementById('event-desc');
    
    let btnContainer = screen.querySelector('.modal-actions');
    if (!btnContainer) {
        btnContainer = document.createElement('div');
        btnContainer.className = 'modal-actions';
        screen.querySelector('.event-content').appendChild(btnContainer);
    }
    btnContainer.innerHTML = ''; 

    screen.classList.remove('hidden');

    if (type === 'item') {
        title.innerText = "Treasure Discovered";
        icon.innerHTML = '<i class="fa-solid fa-chest-open"></i>'; 
        desc.innerText = "Hidden inside a hollow stump, you find a potion.";
        
        const item = Math.random() > 0.7 ? Items.potion_large : Items.potion_small;
        GameState.player.inventory.push(item);
        
        const btn = document.createElement('button');
        btn.innerText = "Collect & Continue";
        btn.onclick = () => { 
            screen.classList.add('hidden'); 
            
            SaveManager.save(); // Auto-save after getting item
            
            resolveMoveAndComplete(targetNode);
        };
        btnContainer.appendChild(btn);

    } else if (type === 'wildcard') {
        const isAmbush = Math.random() > 0.5;

        if (isAmbush) {
            title.innerText = "It's a Trap!";
            icon.innerHTML = '<i class="fa-solid fa-skull-crossbones"></i>';
            desc.innerText = "As you approach, a shadow lunges at you!";
            
            const btn = document.createElement('button');
            btn.innerText = "Defend Yourself!";
            btn.onclick = () => { 
                screen.classList.add('hidden'); 
                document.getElementById('map-screen').classList.add('hidden-map');
                updatePlayerNodeState(targetNode);
                
                playTransition(() => {
                    CombatManager.startCombat(targetNode, true);
                });
            };
            btnContainer.appendChild(btn);
        } else {
            title.innerText = "A Quiet Path";
            icon.innerHTML = '<i class="fa-solid fa-sun"></i>';
            desc.innerText = "The path is clear. You take a moment to rest.";
            
            const btn = document.createElement('button');
            btn.innerText = "Continue Journey";
            btn.onclick = () => { 
                screen.classList.add('hidden'); 
                resolveMoveAndComplete(targetNode);
            };
            btnContainer.appendChild(btn);
        }
    }
}

function resolveMoveAndComplete(targetNode) {
    targetNode.status = 'completed';
    updatePlayerNodeState(targetNode);
    MapRenderer.render('map-nodes-container', openScrollModal);
    setTimeout(() => { completeNode(); }, 900);
}

// =========================================
// 5. UI HELPERS (Journal/Inventory)
// =========================================
function showGameMessage(title, iconClass, text, callback = null) {
    const modal = document.getElementById('message-modal');
    document.getElementById('msg-title').innerText = title;
    document.getElementById('msg-icon').innerHTML = `<i class="fa-solid ${iconClass}" style="color: #f1c40f;"></i>`;
    document.getElementById('msg-text').innerText = text;
    
    const btn = document.getElementById('btn-msg-action');
    btn.onclick = () => {
        modal.classList.add('hidden');
        if (callback) callback();
    };
    modal.classList.remove('hidden');
}

function setupInventoryUI() {
    const btnItems = document.getElementById('btn-items');
    const btnCloseInv = document.getElementById('close-inventory');
    const invModal = document.getElementById('inventory-modal');
    
    if(btnItems) btnItems.onclick = openInventory;
    if(btnCloseInv) btnCloseInv.onclick = () => invModal.classList.add('hidden');
}

function setupSettings() {
    const btn = document.getElementById('settings-btn-container');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('btn-close-settings');

    // Toggle Modal
    btn.onclick = (e) => {
        e.stopPropagation(); // Prevent global click listener from firing
        modal.classList.toggle('hidden');
        AudioManager.playSFX('sfx_click');
    };

    closeBtn.onclick = () => {
        modal.classList.add('hidden');
        AudioManager.playSFX('sfx_click');
    };

    // Close if clicking outside
    document.addEventListener('click', (e) => {
        if (!modal.classList.contains('hidden') && 
            !modal.contains(e.target) && 
            !btn.contains(e.target)) {
            modal.classList.add('hidden');
        }
    });

    // Wire Sliders
    document.getElementById('vol-bgm').oninput = (e) => {
        AudioManager.setVolume('bgm', e.target.value);
    };
    document.getElementById('vol-game').oninput = (e) => {
        AudioManager.setVolume('game', e.target.value);
    };
    document.getElementById('vol-ui').oninput = (e) => {
        AudioManager.setVolume('ui', e.target.value);
    };
}

function openInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    
    if(GameState.player.inventory.length === 0) {
        list.innerHTML = '<li>Empty</li>';
    } else {
        GameState.player.inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${item.name} <button class="scroll-btn confirm" style="margin-left:10px; padding: 5px 10px;">Use</button>`;
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

// Journal Functions (Keep these here for now or move to JournalManager later)
function openJournal() {
    AudioManager.playSFX('sfx_journal_open');
    const modal = document.getElementById('journal-modal');
    const list = document.getElementById('journal-list');
    modal.classList.remove('hidden'); 
    
    list.innerHTML = '';
    const allLessons = GameState.lessonData || {};
    
    for (const [topicId, lesson] of Object.entries(allLessons)) {
        const btn = document.createElement('button');
        btn.className = 'journal-topic-btn';
        if (GameState.player.unlockedLessons.includes(topicId)) {
            btn.innerText = lesson.title;
            btn.onclick = () => openJournalTopic(topicId, false);
        } else {
            btn.innerText = "??? Locked";
            btn.classList.add('locked');
        }
        list.appendChild(btn);
    }
    document.getElementById('journal-topic-title').innerText = "Select a Topic";
    document.getElementById('journal-display-area').innerHTML = "<p><i>Knowledge is power...</i></p>";
}

function closeJournalWithAnim() {
    AudioManager.playSFX('sfx_journal_close');
    const modal = document.getElementById('journal-modal');
    modal.classList.add('hidden');
}

function openJournalTopic(topicId, isLiveEvent, targetNode = null) {
    AudioManager.playSFX('sfx_journal_flip');
    const modal = document.getElementById('journal-modal');
    modal.classList.remove('hidden'); 
    
    const lesson = GameState.lessonData[topicId];
    if(!lesson) return;

    document.getElementById('journal-topic-title').innerText = lesson.title;
    const display = document.getElementById('journal-display-area');
    let html = '';
    lesson.slides.forEach(text => { html += `<p style="margin-bottom:15px;">${text}</p>`; });
    if (lesson.code) { html += `<div class="journal-code-block">${lesson.code}</div>`; }
    
    if (isLiveEvent) {
        html += `<button id="btn-finish-lesson" class="scroll-btn confirm" style="width:100%; margin-top:20px;">Mark as Read & Continue</button>`;
    }
    
    display.innerHTML = html;
    
    if (isLiveEvent) {
        document.getElementById('btn-finish-lesson').onclick = () => {
            closeJournalWithAnim();
            if (targetNode) {
                targetNode.status = 'completed';
                updatePlayerNodeState(targetNode);
                setTimeout(() => {
                    MapRenderer.render('map-nodes-container', openScrollModal);
                    setTimeout(() => completeNode(), 900);
                }, 300);
            }
        };
    }
}

// =========================================
// 6. DEBUG (UPDATED)
// =========================================
function debugKill() {
    console.log("DEBUG: Instant Win...");
    if (GameState.isQTEActive) {
        CombatManager.resolveQTE(); // Helper to end QTE
    }
    if (GameState.enemy.currentHp > 0 && !document.getElementById('game-container').classList.contains('hidden')) {
            GameState.enemy.currentHp = 0;
            UI.updateStats();
            CombatManager.checkWinCondition();
    } else {
        completeNode();
    }
}

function debugTeleportBoss() {
    console.log("DEBUG: Teleporting to Boss...");
    GameState.player.currentNodeId = 8; 
    const nodes = GameState.currentMapData.nodes;
    const bossNode = nodes.find(n => n.id === 8);
    if (bossNode) bossNode.status = 'available';
    MapRenderer.render('map-nodes-container', openScrollModal);
}

// START
initGame();