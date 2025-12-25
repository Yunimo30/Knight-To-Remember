import { GameState } from './GameState.js';

export const LevelManager = {
    
    async loadWorld(worldId) {
        console.log(`Loading World: ${worldId}...`);
        
        try {
            // 1. Fetch Maps
            const mapRes = await fetch('assets/data/maps.json');
            const mapData = await mapRes.json();
            
            // 2. Fetch Questions
            const qRes = await fetch('assets/data/questions.json');
            const qData = await qRes.json();
            
            // 3. NEW: Fetch Lessons
            const lRes = await fetch('assets/data/lessons.json');
            const lData = await lRes.json();

            // Find the curriculum for this world
            const worldCurriculum = qData.curriculum.find(c => c.worldId === worldId);
            
            if (!worldCurriculum) {
                console.error("Curriculum not found for this world");
                return false;
            }

            // Update GameState
            GameState.currentMapData = mapData[worldId]; 
            GameState.activeWorldTopics = qData.curriculum.find(c => c.worldId === worldId)?.topics || []; 
            GameState.lessonData = lData.lessons; // STORE LESSONS HERE
            GameState.progression.currentWorldId = worldId;
            GameState.player.currentNodeId = 0; 

            // Update world title
            const titleEl = document.getElementById('world-title');
            if (titleEl) titleEl.innerText = GameState.currentMapData.name;

            // Future-proofing music for different worlds
            if (worldId === 'world_2') {
                // AudioManager.playBGM('bgm_cave'); 
            }

            this.updateBackground(GameState.currentMapData.background);
            return true;

        } catch (error) {
            console.error("Failed to load world:", error);
            return false;
        }
    },

    updateBackground(imageName) {
        const arena = document.getElementById('battle-arena');
        const mapScreen = document.getElementById('map-screen');
        
        // Path logic (adjust if your folder structure is different)
        const bgUrl = `url('assets/images/${imageName}')`;
        const gradient = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))`;

        if(arena) arena.style.backgroundImage = bgUrl;
        if(mapScreen) mapScreen.style.backgroundImage = `${gradient}, ${bgUrl}`;
    },

    // --- THIS IS THE FUNCTION THAT IS LIKELY MISSING ---
    getQuestionsForNode(node) {
        // 1. BOSS LOGIC: Return ALL questions from the current world
        if (node.type === 'boss') {
            if (!GameState.activeWorldTopics) return [];
            console.log("Boss Fight! aggregating all topics...");
            // Flattens all topics into one giant array of questions
            return GameState.activeWorldTopics.flatMap(t => t.questions);
        }

        // 2. STANDARD LOGIC: Return questions for specific topic
        if (!node.topicId) return null; 
        
        if (!GameState.activeWorldTopics) return [];

        const topic = GameState.activeWorldTopics.find(t => t.id === node.topicId);
        if (topic) return topic.questions;
        
        // Fallback
        console.warn(`Topic ${node.topicId} not found, using random pool.`);
        return GameState.activeWorldTopics.flatMap(t => t.questions);
    }
};