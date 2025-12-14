export const GameState = {
    player: {
        maxHp: 3,
        currentHp: 3,
        inventory: [], 
        hints: 1,
        maxHints: 5,
        currentNodeId: 0 
    },
    level: { current: 0, max: 6 },
    // UPDATE: Added 'desc' field to all nodes
    map: [
        { id: 0, type: 'start', name: "Start", desc: "Your journey begins here.", connections: [1], status: 'completed' },
        
        { id: 1, type: 'enemy', name: "Java Intro", topicId: "java_basics", desc: "A weak enemy guarding the forest entrance. Topic: Java Basics.", difficulty: 'easy', connections: [2, 3], status: 'unlocked' },
        
        { id: 2, type: 'enemy', name: "OOP Basics", topicId: "oop_concepts", desc: "A stronger foe awaits. Topic: OOP Concepts.", difficulty: 'easy', connections: [4], status: 'locked' },
        
        { id: 3, type: 'item', name: "Forest Cache", desc: "A quiet clearing. Looks safe.", connections: [4], status: 'locked' },
        
        { id: 4, type: 'enemy', name: "Code Syntax", topicId: "java_basics", desc: "Mid-level enemy. Topic: Syntax & Logic.", difficulty: 'medium', connections: [5], status: 'locked' },
        
        { id: 5, type: 'wildcard', name: "Unknown Path", desc: "High risk, high reward? Anything could happen.", connections: [6], status: 'locked' },
        
        { id: 6, type: 'boss', name: "BOSS: Undead Lord", topicId: "oop_concepts", desc: "The final test. Prepare yourself.", difficulty: 'hard', connections: [], status: 'locked' }
    ],
    // Active Combat State
    enemy: {
        name: "Enemy",
        maxHp: 2,
        currentHp: 2,
        damage: 1,
        icon: "fa-skull"
    },
    isPlayerTurn: true,
    isQTEActive: false
};

export const Items = {
    potion_small: { name: "Small Potion", hp: 1, desc: "Restores 1 HP" },
    potion_large: { name: "Large Potion", hp: 2, desc: "Restores 2 HP" }
};

export const EnemyTypes = [
    { name: "Frail Zombie", hp: 2, icon: "fa-person-falling" },
    { name: "Zombie", hp: 3, icon: "fa-biohazard" },
    { name: "Skeleton", hp: 3, icon: "fa-skull" },
    { name: "Tough Undead", hp: 4, icon: "fa-dungeon" } 
];