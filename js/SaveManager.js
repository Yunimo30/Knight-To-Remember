/**
 * ============================================
 * SAVEMANAGER - Game State Persistence
 * ============================================
 * Handles saving and loading game progress to browser localStorage.
 * Persists: player stats, world progression, cleared nodes, inventory.
 * Auto-triggered after major events (defeating enemies, collecting items).
 */

import { GameState } from './GameState.js';

export const SaveManager = {
    // Browser localStorage key for save data
    SAVE_KEY: 'knight_save_v1',

    /**
     * SAVE - Persist current game state to localStorage
     * Called after: defeating enemies, collecting items, progressing nodes
     */
    save() {
        try {
            // Only save essential data (not entire GameState)
            const data = {
                player: GameState.player,           // HP, inventory, hints, unlocked lessons
                progression: GameState.progression, // Current world, unlocked worlds, cleared stages
                currentMapData: GameState.currentMapData, // Node statuses (completed/locked/available)
                timestamp: Date.now()               // When save occurred
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            console.log("Game Saved!");
            this.showSaveIcon();
        } catch (e) {
            console.error("Save failed:", e);
        }
    },

    /**
     * LOAD - Retrieve saved game state from localStorage
     * @returns {Object|null} Saved game data or null if no save exists
     */
    load() {
        try {
            const json = localStorage.getItem(this.SAVE_KEY);
            if (!json) return null;
            return JSON.parse(json);
        } catch (e) {
            console.error("Load failed:", e);
            return null;
        }
    },

    /**
     * HAS SAVE - Check if a save file exists
     * @returns {boolean} True if save data exists
     */
    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    /**
     * CLEAR - Delete all save data (used when starting new game)
     */
    clear() {
        localStorage.removeItem(this.SAVE_KEY);
    },

    /**
     * SHOW SAVE ICON - Visual feedback that game was saved
     * Displays yellow floppy disk icon briefly in bottom-right corner
     */
    showSaveIcon() {
        const existing = document.getElementById('save-icon');
        if (existing) existing.remove();

        const icon = document.createElement('div');
        icon.id = 'save-icon';
        icon.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
        icon.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; color: #f1c40f; 
            font-size: 2rem; opacity: 0; transition: opacity 0.5s; z-index: 9999;
            filter: drop-shadow(0 2px 3px black); pointer-events: none;
        `;
        document.body.appendChild(icon);
        
        // Fade in, then fade out after 2 seconds
        requestAnimationFrame(() => { icon.style.opacity = '1'; });
        setTimeout(() => {
            icon.style.opacity = '0';
            setTimeout(() => icon.remove(), 500);
        }, 2000);
    }
};