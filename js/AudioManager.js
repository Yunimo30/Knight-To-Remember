export const AudioManager = {
    // 1. Volume State (0.0 to 1.0)
    volumes: {
        bgm: 0.5,
        game: 0.5,
        ui: 0.1
    },
    
    // 2. Category Map (Definitions)
    // Maps sound keys to their volume channel
    categories: {
        sfx_attack: 'game',
        sfx_block: 'game',
        sfx_hurt: 'game',
        sfx_win: 'game',
        
        sfx_hover: 'ui',
        sfx_click: 'ui',
        sfx_journal_open: 'game',
        sfx_journal_close: 'game',
        sfx_journal_flip: 'game'
    },

    bgm: null,
    currentBgmKey: null,

    sounds: {
        bgm_menu:   'assets/audio/mainMenuBGM.ogg',
        bgm_forest: 'assets/audio/forestBGM.mp3',
        bgm_combat: 'assets/audio/combatBGM.mp3',
        sfx_attack: 'assets/audio/swordSlash.wav',
        sfx_block:  'assets/audio/blockAttack.wav',
        sfx_hurt:   'assets/audio/playerHurt.mp3',
        sfx_hover:  'assets/audio/hoverUI.ogg',
        sfx_click:  'assets/audio/interactUI.ogg',
        sfx_journal_open:  'assets/audio/journalOpen.ogg',
        sfx_journal_close: 'assets/audio/journalClose.ogg',
        sfx_journal_flip:  'assets/audio/journalFlip.ogg'
    },

    playBGM(key) {
        if (this.currentBgmKey === key && this.bgm) return; 

        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }

        const path = this.sounds[key];
        if (!path) return;

        this.bgm = new Audio(path);
        this.bgm.loop = true;
        this.bgm.volume = this.volumes.bgm; // Apply stored volume
        this.bgm.play().catch(e => console.log("Autoplay blocked"));
        
        this.currentBgmKey = key;
    },

    playSFX(key) {
        const path = this.sounds[key];
        if (!path) return;

        // Determine Category
        const category = this.categories[key] || 'game'; // Default to game if undefined
        const vol = this.volumes[category];

        if (vol <= 0) return; // Silent

        const sfx = new Audio(path);
        sfx.volume = vol;
        sfx.play().catch(e => {});
    },

    // NEW: Live Volume Update
    setVolume(type, value) {
        this.volumes[type] = parseFloat(value);
        
        // If music is playing, update it immediately
        if (type === 'bgm' && this.bgm) {
            this.bgm.volume = this.volumes.bgm;
        }
    }
};