/**
 * ============================================
 * GAMESTATE - Central State Management
 * ============================================
 * This is the Single Source of Truth for all game data.
 * All modules read/write to GameState to maintain consistency.
 * 
 * Structure:
 * - player: Character stats, inventory, progression
 * - progression: Unlocked worlds and completed stages
 * - currentMapData: Active world map (nodes and connections)
 * - activeWorldTopics: Quiz questions grouped by topic
 * - lessonData: Educational content unlocked during gameplay
 * - enemy: Current enemy stats during combat
 * - Combat flags: isPlayerTurn, isQTEActive, currentQuestion
 */

export const GameState = {
    // ========== PLAYER DATA ==========
    // Tracks player health, items, hints, and current location
    player: {
        maxHp: 3,              // Maximum health points
        currentHp: 3,          // Current health points
        inventory: [],         // Array of items player has collected
        hints: 1,              // Number of hints remaining (max 5)
        maxHints: 5,           // Maximum hints available
        currentNodeId: 0,      // Index of the current map node
        previousNodeId: 0,     // Index of the last visited node (for animation)
        unlockedLessons: []    // Array of lesson IDs the player has accessed
    },

    // ========== PROGRESSION DATA ==========
    // Tracks which worlds are available and which stages are cleared
    progression: {
        currentWorldId: "world_1",     // "world_1" | "world_2" | "world_3"
        unlockedWorlds: ["world_1"],   // List of accessible worlds
        clearedStages: []              // List of completed node IDs
    },

    // ========== WORLD DATA ==========
    // Dynamically loaded by LevelManager.loadWorld()
    // Contains the map structure for the current world
    currentMapData: {
        name: "Loading...",        // World display name (e.g., "The Dark Forest")
        background: "",            // Background image filename
        nodes: []                  // Array of map nodes (rooms/challenges)
    },

    // ========== CURRICULUM DATA ==========
    // Dynamically loaded by LevelManager.loadWorld()
    // Organized by topic, each topic contains multiple-choice questions
    activeWorldTopics: [],         // Array of {id, name, questions[]}

    // ========== LESSON DATA ==========
    // Loaded from lessons.json by LevelManager.loadWorld()
    // Contains educational content for Java fundamentals
    lessonData: {},                // Map of {topicId: {title, slides[], code}}

    // ========== COMBAT DATA ==========
    // Current enemy facing the player in battle
    enemy: {
        name: "Enemy",             // Enemy display name
        maxHp: 2,                  // Enemy maximum health
        currentHp: 2,              // Enemy current health
        damage: 1,                 // Damage enemy deals per attack
        icon: "fa-skull"           // FontAwesome icon class
    },

    // ========== COMBAT FLAGS ==========
    // Control flow during turn-based combat
    isPlayerTurn: true,            // True if waiting for player input
    isQTEActive: false,            // True if Quick Time Event (block) is active
    currentQuestion: null          // Current quiz question being answered
};

/**
 * ITEMS - Inventory Item Definitions
 * Each item has a name, healing amount, and description
 * Players collect these through events and can use them during combat
 */
export const Items = {
    potion_small: { name: "Small Potion", hp: 1, desc: "Restores 1 HP" },
    potion_large: { name: "Large Potion", hp: 2, desc: "Restores 2 HP" }
};

/**
 * ENEMY TYPES - All Enemies in the Game
 * Enemies are organized by World. Each world has 5 enemies:
 * - 3 Standard enemies (variations, different from others)
 * - 1 Mini-Boss (middle difficulty, special appearance)
 * - 1 Boss (hardest, world finale)
 * 
 * Worlds:
 * - World 1 (IDs 0-4):   The Dark Forest - Java Basics
 * - World 2 (IDs 5-9):   The Logic Caves - Conditionals/Booleans
 * - World 3 (IDs 10-14): The Castle of Code - Loops/Arrays
 */
export const EnemyTypes = [
    // --- WORLD 1: DARK FOREST (Indices 0-4) ---
    { id: 0, name: "Frail Zombie", hp: 1, icon: "fa-person-falling" },
    { id: 1, name: "Glitch Slime", hp: 1, icon: "fa-ghost" },
    { id: 2, name: "Skeleton", hp: 1, icon: "fa-skull" },
    { id: 3, name: "Stone Sentry", hp: 1, icon: "fa-chess-rook" },       // Mini-Boss
    { id: 4, name: "Syntax Guardian", hp: 1, icon: "fa-gavel" },         // Boss

    // --- WORLD 2: LOGIC CAVES (Indices 5-9) ---
    { id: 5, name: "Crypto Bat", hp: 1, icon: "fa-crow" },
    { id: 6, name: "Logic Golem", hp: 1, icon: "fa-cubes" },
    { id: 7, name: "Null Spider", hp: 1, icon: "fa-spider" },
    { id: 8, name: "Obsidian Guard", hp: 1, icon: "fa-shield-halved" },  // Mini-Boss
    { id: 9, name: "The Compiler", hp: 1, icon: "fa-brain" },            // Boss

    // --- WORLD 3: CASTLE OF CODE (Indices 10-14) ---
    { id: 10, name: "Phantom Bug", hp: 1, icon: "fa-locust" },
    { id: 11, name: "Array Archer", hp: 1, icon: "fa-bullseye" },
    { id: 12, name: "Infinite Looper", hp: 1, icon: "fa-rotate" },
    { id: 13, name: "Stack Tower", hp: 1, icon: "fa-layer-group" },      // Mini-Boss
    { id: 14, name: "Runtime Terror", hp: 12, icon: "fa-dragon" }        // Final Boss
];