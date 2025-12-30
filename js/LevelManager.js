/**
 * ============================================
 * LEVELMANAGER - Asset Loading & World Data
 * ============================================
 * Responsible for fetching and parsing JSON data files.
 * Acts as the bridge between local JSON files and GameState.
 */

import { GameState } from './GameState.js';

export const LevelManager = {
    /**
     * LOAD WORLD - Initialize all assets for a specific world
     * Fetches maps, questions, and lessons from JSON files
     * 
     * @param {string} worldId - "world_1", "world_2", or "world_3"
     * @returns {Promise<boolean>} True if successful
     */
    async loadWorld(worldId) {
        console.log(`Loading World: ${worldId}...`);
        
        try {
            // Fetch map data (node definitions, connections, backgrounds)
            const mapRes = await fetch('assets/data/maps.json');
            const mapData = await mapRes.json();
            
            // Fetch quiz questions organized by curriculum and topics
            const qRes = await fetch('assets/data/questions.json');
            const qData = await qRes.json();
            
            // Fetch educational lesson slides and code examples
            const lRes = await fetch('assets/data/lessons.json');
            const lData = await lRes.json();

            // Locate this world's curriculum
            const worldCurriculum = qData.curriculum.find(c => c.worldId === worldId);
            
            if (!worldCurriculum) {
                console.error("Curriculum not found for this world");
                return false;
            }

            // Populate GameState with world-specific data
            GameState.currentMapData = mapData[worldId];
            GameState.activeWorldTopics = qData.curriculum.find(c => c.worldId === worldId)?.topics || [];
            GameState.lessonData = lData.lessons;
            GameState.progression.currentWorldId = worldId;
            GameState.player.currentNodeId = 0;

            // Update world title display
            const titleEl = document.getElementById('world-title');
            if (titleEl) titleEl.innerText = GameState.currentMapData.name;

            // Future expansion: Different music per world
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

    /**
     * UPDATE BACKGROUND - Apply background images to battle/map screens
     * Adds dark overlay for text readability
     */
    updateBackground(imageName) {
        const arena = document.getElementById('battle-arena');
        const mapScreen = document.getElementById('map-screen');
        
        const bgUrl = `url('assets/images/${imageName}')`;
        const gradient = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))`;

        if(arena) arena.style.backgroundImage = bgUrl;
        if(mapScreen) mapScreen.style.backgroundImage = `${gradient}, ${bgUrl}`;
    },

    /**
     * GET QUESTIONS FOR NODE - Retrieve questions based on node type
     * Boss nodes: All questions (comprehensive test)
     * Standard: Topic-specific questions only
     */
    getQuestionsForNode(node) {
        // Boss battles use ALL questions from world
        if (node.type === 'boss') {
            if (!GameState.activeWorldTopics) return [];
            console.log("Boss Fight! Aggregating all topics...");
            return GameState.activeWorldTopics.flatMap(t => t.questions);
        }

        // Standard enemies use topic-specific questions
        if (!node.topicId) return null; 
        
        if (!GameState.activeWorldTopics) return [];

        const topic = GameState.activeWorldTopics.find(t => t.id === node.topicId);
        if (topic) return topic.questions;
        
        // Fallback to all questions
        console.warn(`Topic ${node.topicId} not found, using random pool.`);
        return GameState.activeWorldTopics.flatMap(t => t.questions);
    }
};