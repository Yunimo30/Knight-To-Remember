export const GameState = {
    player: {
        maxHp: 3,
        currentHp: 3,
        inventory: [], 
        hints: 1,
        maxHints: 5,
        currentNodeId: 0,
        previousNodeId: 0, // NEW: Track where we came from
        unlockedLessons: []
    },
    // NEW: Progression Tracking
    progression: {
        currentWorldId: "world_1", // Default start
        unlockedWorlds: ["world_1"],
        clearedStages: [] 
    },
    // The Active Map (Populated by LevelManager)
    currentMapData: {
        name: "Loading...",
        background: "",
        nodes: []
    },
    // The Active Questions (Populated by LevelManager)
    activeWorldTopics: [], 

    // Active Combat State (Same as before)
    enemy: {
        name: "Enemy",
        maxHp: 2,
        currentHp: 2,
        damage: 1,
        icon: "fa-skull"
    },
    isPlayerTurn: true,
    isQTEActive: false,
    currentQuestion: null
};

export const Items = {
    potion_small: { name: "Small Potion", hp: 1, desc: "Restores 1 HP" },
    potion_large: { name: "Large Potion", hp: 2, desc: "Restores 2 HP" }
};

export const EnemyTypes = [
    // Standard Enemies
    { name: "Frail Zombie", hp: 1, icon: "fa-person-falling" },     // ID 0
    { name: "Glitch Slime", hp: 1, icon: "fa-ghost" },              // ID 1
    { name: "Skeleton", hp: 1, icon: "fa-skull" },                  // ID 2
    
    // Mini-Bosses / Elites
    { name: "Stone Sentry", hp: 1, icon: "fa-chess-rook" },         // ID 3 (Mini-Boss)
    
    // Bosses
    { name: "Syntax Guardian", hp: 1, icon: "fa-gavel" }            // ID 4 (Main Boss)
];