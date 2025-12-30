/**
 * ============================================
 * AUDIOMANAGER - Sound & Music Management
 * ============================================
 * Centralized audio control with three volume channels:
 * - bgm: Background music (50% default)
 * - game: Gameplay sounds (50% default)
 * - ui: Interface sounds (10% default)
 * 
 * Usage:
 * AudioManager.playBGM('bgm_forest')  - Start looping background music
 * AudioManager.playSFX('sfx_click')   - Play sound effect once
 * AudioManager.setVolume('bgm', 0.3)  - Adjust volume
 */

export const AudioManager = {
    // ========== VOLUME LEVELS ==========
    // Values between 0.0 (mute) and 1.0 (full volume)
    volumes: {
        bgm: 0.5,     // Background music
        game: 0.5,    // Combat/gameplay sounds
        ui: 0.1       // Button clicks, menu sounds
    },
    
    // ========== SOUND CATEGORIZATION ==========
    // Maps individual sounds to volume channels
    // This allows adjusting all combat sounds together, for example
    categories: {
        sfx_attack: 'game',         // Sword attacks
        sfx_block: 'game',          // Defense/block sounds
        sfx_hurt: 'game',           // Player/enemy damage
        sfx_win: 'game',            // Victory sound
        
        sfx_hover: 'ui',            // Button hover
        sfx_click: 'ui',            // Button click
        sfx_journal_open: 'game',   // Open journal
        sfx_journal_close: 'game',  // Close journal
        sfx_journal_flip: 'game'    // Flip page
    },

    // ========== AUDIO ASSETS ==========
    // Current background music instance
    bgm: null,
    currentBgmKey: null,

    // Sound file paths (must exist in assets/audio/)
    sounds: {
        // Background Music
        bgm_menu:   'assets/audio/mainMenuBGM.ogg',
        bgm_forest: 'assets/audio/forestBGM.mp3',
        bgm_combat: 'assets/audio/combatBGM.mp3',
        
        // Combat Effects
        sfx_attack: 'assets/audio/swordSlash.wav',
        sfx_block:  'assets/audio/blockAttack.wav',
        sfx_hurt:   'assets/audio/playerHurt.mp3',
        sfx_win:    'assets/audio/victoryChime.ogg', // If exists
        
        // UI Sounds
        sfx_hover:  'assets/audio/hoverUI.ogg',
        sfx_click:  'assets/audio/interactUI.ogg',
        
        // Journal Sounds
        sfx_journal_open:  'assets/audio/journalOpen.ogg',
        sfx_journal_close: 'assets/audio/journalClose.ogg',
        sfx_journal_flip:  'assets/audio/journalFlip.ogg'
    },

    /**
     * PLAY BGM - Start background music (loops continuously)
     * Automatically stops previous music before starting new
     * 
     * @param {string} key - Sound key (e.g., 'bgm_forest')
     */
    playBGM(key) {
        // Don't restart same music
        if (this.currentBgmKey === key && this.bgm) return; 

        // Stop previous music
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }

        const path = this.sounds[key];
        if (!path) return;

        // Create and configure new audio element
        this.bgm = new Audio(path);
        this.bgm.loop = true;                    // Loop infinitely
        this.bgm.volume = this.volumes.bgm;      // Apply stored volume
        this.bgm.play().catch(e => console.log("Autoplay blocked")); // Some browsers require user interaction
        
        this.currentBgmKey = key;
    },

    /**
     * PLAY SFX - Play a one-time sound effect
     * Uses category-based volume for consistent mixing
     * 
     * @param {string} key - Sound key (e.g., 'sfx_click')
     */
    playSFX(key) {
        const path = this.sounds[key];
        if (!path) return;

        // Determine which volume channel to use
        const category = this.categories[key] || 'game'; // Default to game if undefined
        const vol = this.volumes[category];

        // Skip if volume is muted
        if (vol <= 0) return;

        // Play sound once
        const sfx = new Audio(path);
        sfx.volume = vol;
        sfx.play().catch(e => {});
    },

    /**
     * SET VOLUME - Adjust volume for a category
     * Updates background music immediately if playing
     * 
     * @param {string} type - 'bgm', 'game', or 'ui'
     * @param {number} value - 0.0 to 1.0
     */
    setVolume(type, value) {
        this.volumes[type] = parseFloat(value);
        
        // If music is playing, update its volume immediately
        if (type === 'bgm' && this.bgm) {
            this.bgm.volume = this.volumes.bgm;
        }
    }
};