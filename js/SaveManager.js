import { GameState } from './GameState.js';

export const SaveManager = {
    SAVE_KEY: 'knight_save_v1',

    save() {
        try {
            const data = {
                player: GameState.player,
                progression: GameState.progression,
                currentMapData: GameState.currentMapData,
                timestamp: Date.now()
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            console.log("Game Saved!");
            this.showSaveIcon();
        } catch (e) {
            console.error("Save failed:", e);
        }
    },

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

    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    clear() {
        localStorage.removeItem(this.SAVE_KEY);
    },

    // Small visual indicator so players know the game saved
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
        
        // Flash animation
        requestAnimationFrame(() => { icon.style.opacity = '1'; });
        setTimeout(() => {
            icon.style.opacity = '0';
            setTimeout(() => icon.remove(), 500);
        }, 2000);
    }
};