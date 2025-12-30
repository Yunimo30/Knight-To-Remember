# A Knight to Remember 

A turn-based RPG educational game where players answer Java programming questions to defeat enemies and progress through three worlds of increasing difficulty. Learn coding fundamentals while battling logic-themed monsters!

**Game Status:** Alpha (3 worlds complete)  
**Created by:** Yunimo30  
**Play Online:** [GitHub Pages Link Coming Soon]

---

##  Table of Contents

- [About the Game](#about-the-game)
- [How to Play](#how-to-play)
- [Game Features](#game-features)
- [Technical Architecture](#technical-architecture)
- [Installation & Setup](#installation--setup)
- [Game Worlds](#game-worlds)
- [File Structure](#file-structure)
- [Module Documentation](#module-documentation)
- [Data Formats](#data-formats)
- [Contribution Guidelines](#contribution-guidelines)

---

## About the Game

**A Knight to Remember** combines RPG gameplay with computer science education. Instead of buying swords or finding magic spells, you strengthen your knowledge of Java programming. Every question you answer correctly deals damage to your enemy; every wrong answer means you take damage.

### Core Philosophy
- **Learning Through Gameplay:** Questions are integrated naturally into combat, not just tacked on
- **Progressive Difficulty:** Three worlds teach Java from basics to advanced loops
- **Multiple Question Types:** Multiple-choice, code fill-in, and input-based questions
- **Persistent Progress:** Save/load system preserves your progression
- **Accessible Combat:** Quick-Time Events (QTE) provide bonus defense opportunities

---

## How to Play

### Main Menu
1. **New Game** - Start fresh from World 1
2. **Continue** - Resume from your last save (if available)
3. **How To Play** - View tutorial overlay

### Map Navigation
- **Click Nodes** - Select which challenge to tackle next
- **Available Nodes** (white) - Ready to challenge
- **Locked Nodes** (gray) - Blocked until prerequisites complete
- **Completed Nodes** (blue) - Already cleared

### Combat System

#### Your Turn
1. **Question Display** - Read the programming question carefully
2. **Choose Answer** - Click a multiple-choice button or type your answer
3. **Deal Damage** - Correct answers damage the enemy
4. **Wrong Answer** - Incorrect answers damage you instead

#### Enemy Turn
1. **Attack Animation** - Enemy prepares to attack
2. **QTE Challenge** - Press **SPACE** to block and reduce incoming damage
3. **Take Damage** - Remaining damage applies to your HP

#### Combat Items
- **Hints** (!) - Remove wrong answers (max 5, regenerate between worlds)
- **Potions**  - Heal yourself (found in treasure events)
- **Journal**  - Read lessons to unlock knowledge and hints

### Progression
- **Win Combat** - Complete the node and unlock adjacent nodes
- **Defeat Boss** - Clear entire world and advance to next region
- **World Progression** - World 2 unlocks after defeating World 1 boss

### Saving
- Auto-saves after each major event (defeating enemies, collecting items)
- Floppy disk icon appears briefly when saving
- **Continue** button only appears if a save exists

---

## Game Features

### Combat System
- **Turn-based combat** - Plan your answer carefully
- **Dynamic difficulty** - Enemy damage scales by world (World 1: 1 DMG, World 2: 2 DMG, World 3: 3 DMG)
- **QTE Defense** - Press SPACE during enemy attacks to block
- **HP Management** - Collect potions to stay alive

### Educational Features
- **Interactive Lessons** - Accessible from the Journal at any time
- **Contextual Learning** - Lesson nodes teach before you face questions
- **Code Examples** - Real Java code snippets in lessons and questions
- **Progressive Curriculum** - Topics build on previous knowledge

### UI/UX Features
- **Save System** - Browser localStorage persistence
- **Settings Panel** - Adjust BGM, Game, and UI volumes independently
- **Inventory System** - Manage collected items
- **Journal** - Unlock and read educational content
- **Responsive Design** - Works on desktop browsers

### Audio
- **Background Music** - Dynamic music changes per screen
- **Sound Effects** - Contextual audio for attacks, blocks, UI interactions
- **Volume Controls** - Three independent volume sliders
- **Autoplay Handling** - Respects browser autoplay policies

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                              │
│  (HTML Structure: Screens, Divs, Canvas Elements)              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                        main.js                                   │
│  (Game Loop Engine & Event Orchestrator)                       │
│  ├─ initGame() - Bootstrap all systems                         │
│  ├─ Game Loop - Handle turns, combat flow                      │
│  └─ Event Listeners - Keyboard/Button inputs                   │
└─────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
    ┌────────────────────────────────────────────────────┐
    │  CORE MODULES (Imported in main.js)               │
    └────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   GameState.js   │  │ LevelManager.js  │  │  UIManager.js    │
│  (State/Data)    │  │ (Data Loading)   │  │ (Rendering)      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         ↓                    ↓                    ↓
    ┌─────────────────────────────────────────────────────┐
    │        assets/data/ (JSON Files)                   │
    │  ├─ maps.json (World/Node definitions)           │
    │  ├─ questions.json (Quiz content)                │
    │  └─ lessons.json (Educational content)           │
    └─────────────────────────────────────────────────────┘
```

### Design Patterns

**Single Responsibility Principle**
- **GameState.js** - Pure data store
- **LevelManager.js** - File loading only
- **CombatManager.js** - Combat logic only
- **UIManager.js** - Display updates only
- **main.js** - Game loop and orchestration

**Module Pattern**
All core modules export a single object with methods:
```javascript
export const ModuleName = {
    method1() { /* ... */ },
    method2() { /* ... */ }
};
```

---

## Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No dependencies required (vanilla JavaScript)
- Optional: Local server for testing (Python, Node.js, etc.)

### Quick Start

1. **Clone or Download**
   ```bash
   git clone https://github.com/yourusername/KnightToRemember.git
   cd KnightToRemember
   ```

2. **Run Locally (Python)**
   ```bash
   python -m http.server 8000
   # Open http://localhost:8000
   ```

3. **Or Node.js**
   ```bash
   npx serve
   ```

4. **Or Just Open in Browser**
   - Many modern browsers allow opening local HTML files directly
   - Due to CORS, avoid direct file:// protocol for JSON loading
   - Use a local server for best results

### File Requirements
- All audio files in `assets/audio/` (see sounds list in AudioManager.js)
- All images in `assets/images/`
- All data in `assets/data/` (maps.json, questions.json, lessons.json)

---

## Game Worlds

### World 1: The Dark Forest 🌲
**Topic:** Java Basics (Types, Output, Syntax, Logic)  
**Difficulty:** Beginner  
**Enemy Count:** 5 (3 normal, 1 mini-boss, 1 boss)  

**Lessons Covered:**
- Data Types (int, String, etc.)
- System Output (println, print)
- Syntax Rules (semicolons, case sensitivity, braces)
- Control Flow (if/else statements)
- Booleans and Comparisons

**Boss:** Syntax Guardian (5 HP) - Tests all knowledge from World 1

---

### World 2: The Logic Caves 
**Topic:** Conditionals & Boolean Logic  
**Difficulty:** Intermediate  
**Enemy Count:** 5 (3 normal, 1 mini-boss, 1 boss)  

**Lessons Covered:**
- If/Else structures
- Boolean operators (&&, ||, !)
- Comparison operators (==, !=, <, >)
- Nested conditions
- Complex logic puzzles

**Boss:** Binary Behemoth (8 HP) - Advanced boolean logic questions

---

### World 3: The Castle of Code 
**Topic:** Loops & Arrays  
**Difficulty:** Advanced  
**Enemy Count:** 5 (3 normal, 1 mini-boss, 1 boss)  

**Lessons Covered:**
- For loops
- While loops
- Array fundamentals
- Loop control (break, continue)
- Nested loops and arrays

**Final Boss:** The Runtime Terror (12 HP) - Ultimate programming challenge

---

## File Structure

```
KnightToRemember/
├── README.md                          # This file
├── index.html                         # Main HTML page
├── PROJECT_ARCHITECTURE.md            # Detailed technical docs
│
├── css/
│   └── style.css                      # All styling
│
├── js/                                # Game modules
│   ├── main.js                        # Game loop & orchestration
│   ├── GameState.js                   # Central state management
│   ├── LevelManager.js                # Asset loading
│   ├── UIManager.js                   # Rendering & display
│   ├── CombatManager.js               # Combat system logic
│   ├── MapRenderer.js                 # Map visualization
│   ├── SaveManager.js                 # Save/load system
│   └── AudioManager.js                # Sound management
│
└── assets/
    ├── audio/                         # Music & sound files
    │   ├── mainMenuBGM.ogg
    │   ├── forestBGM.mp3
    │   ├── combatBGM.mp3
    │   ├── swordSlash.wav
    │   ├── blockAttack.wav
    │   ├── playerHurt.mp3
    │   ├── hoverUI.ogg
    │   ├── interactUI.ogg
    │   ├── journalOpen.ogg
    │   ├── journalClose.ogg
    │   └── journalFlip.ogg
    │
    ├── images/                        # Backgrounds & assets
    │   ├── dark-forest-bg.jpg
    │   ├── logic-caves-bg.jpg
    │   ├── castle-bg.jpg
    │   └── helm.png
    │
    └── data/                          # JSON data files
        ├── maps.json                  # World definitions
        ├── questions.json             # Quiz content
        └── lessons.json               # Educational slides
```

---

## Module Documentation

### GameState.js
**Purpose:** Central state management - Single Source of Truth

**Key Objects:**
```javascript
GameState.player          // Character stats, inventory, progression
GameState.enemy           // Current enemy in combat
GameState.currentMapData  // Active world map
GameState.activeWorldTopics // Current quiz questions
GameState.lessonData      // Educational content
```

**When to Modify:**
- After damage taken/dealt
- When collecting items
- After completing nodes
- On world advancement

---

### LevelManager.js
**Purpose:** Load and parse JSON data files

**Key Methods:**
```javascript
LevelManager.loadWorld(worldId)      // Load all assets for a world
LevelManager.getQuestionsForNode(node) // Get questions for a node
LevelManager.updateBackground(img)    // Set battle/map backgrounds
```

**Data Flow:**
```
maps.json → LevelManager.loadWorld() → GameState.currentMapData
questions.json → LevelManager.loadWorld() → GameState.activeWorldTopics
lessons.json → LevelManager.loadWorld() → GameState.lessonData
```

---

### CombatManager.js
**Purpose:** Handle turn-based combat logic

**Key Methods:**
```javascript
CombatManager.startCombat(node)       // Begin battle with enemy
CombatManager.handleAnswer(index)     // Process answer choice
CombatManager.handleInputAnswer(text) // Process text input
CombatManager.resolveQTE()            // Handle blocking mechanic
CombatManager.useHint()               // Remove wrong answers
```

**Combat Flow:**
1. Player answers question
2. Check if correct
3. Apply damage to enemy
4. Check for victory
5. If alive, switch to enemy turn
6. Enemy attacks → QTE opportunity
7. Apply damage to player
8. Loop or end combat

---

### UIManager.js
**Purpose:** Manage all visual updates and user interface

**Key Methods:**
```javascript
UI.displayQuestion(questionObj)      // Show question in combat
UI.setupEnemy(enemyData)             // Display enemy stats
UI.updateStats()                     // Update HP bars
UI.setTurnIndicator(isPlayer)        // Update whose turn it is
UI.removeWrongAnswer(index)          // Hint system
```

**Managed Elements:**
- Question text and answer buttons
- HP bars (hearts)
- Turn indicators
- Hint counter
- Timer bars
- Enemy/player sprites

---

### MapRenderer.js
**Purpose:** Render and manage the world map

**Key Methods:**
```javascript
MapRenderer.render(containerId, onNodeClick) // Draw entire map
MapRenderer.updatePlayerTokenPosition(nodeId) // Move player token
MapRenderer.setupScrolling()                  // Enable map scrolling
```

**Features:**
- BFS graph traversal for node positioning
- Progressive node unlocking with animations
- Player token movement with smooth transitions
- Horizontal scrolling for wide maps

---

### SaveManager.js
**Purpose:** Persist game state to browser localStorage

**Key Methods:**
```javascript
SaveManager.save()        // Save current game state
SaveManager.load()        // Load previous save
SaveManager.hasSave()     // Check if save exists
SaveManager.clear()       // Delete save (new game)
```

**Saved Data:**
- Player stats (HP, inventory, hints)
- World progression (current world, unlocked worlds)
- Map state (node statuses)
- Timestamp

---

### AudioManager.js
**Purpose:** Centralized sound and music management

**Key Methods:**
```javascript
AudioManager.playBGM(key)           // Start looping background music
AudioManager.playSFX(key)           // Play sound effect once
AudioManager.setVolume(type, value) // Adjust volume (0.0-1.0)
```

**Volume Channels:**
- `bgm` - Background music
- `game` - Combat and gameplay sounds
- `ui` - Interface sounds

---

## Data Formats

### maps.json Structure
```json
{
  "world_1": {
    "name": "The Dark Forest",
    "background": "dark-forest-bg.jpg",
    "nodes": [
      {
        "id": 0,
        "name": "Starting Path",
        "type": "lesson",
        "topicId": "java_basics",
        "desc": "Learn Java fundamentals",
        "status": "completed",
        "connections": [1, 2]
      },
      {
        "id": 1,
        "name": "Type Test",
        "type": "enemy",
        "topicId": "java_types",
        "desc": "Battle the Glitch Slime",
        "status": "available",
        "connections": [3]
      }
    ]
  }
}
```

**Node Types:**
- `enemy` - Standard combat (topic-specific questions)
- `miniboss` - Harder enemy (topic-specific questions)
- `boss` - Final world challenge (ALL questions)
- `lesson` - Read educational content
- `item` - Treasure event (collect potions)
- `wildcard` - Random event (ambush or safe passage)

---

### questions.json Structure
```json
{
  "curriculum": [
    {
      "worldId": "world_1",
      "name": "Java Basics",
      "topics": [
        {
          "id": "java_types",
          "name": "Data Types",
          "questions": [
            {
              "id": 1,
              "text": "Which is a valid Java variable declaration?",
              "type": "multiple_choice",
              "answers": ["int x = 5;", "string name;", "var x;"],
              "correct": 0,
              "explanation": "int x = 5; is correct. 'string' should be 'String' with capital S."
            },
            {
              "id": 2,
              "text": "What will this print?\nSystem.out.println(3 + 5 + \" is the sum\");",
              "type": "code_mc",
              "codeSnippet": "System.out.println(3 + 5 + \" is the sum\");",
              "answers": ["3 5 is the sum", "8 is the sum", "Error"],
              "correct": 1
            }
          ]
        }
      ]
    }
  ]
}
```

**Question Types:**
- `multiple_choice` - Select one of 4 answers
- `code_mc` - Multiple choice with code display
- `input` - Type your answer as text

---

### lessons.json Structure
```json
{
  "lessons": {
    "java_types": {
      "title": "Data Types 101",
      "slides": [
        "In Java, every piece of data has a specific type.",
        "<b>int</b> stores whole numbers (e.g., 1, 42, -99).",
        "<b>String</b> stores text (must use double quotes)."
      ],
      "code": "int health = 100;\nString name = \"Paladin\";"
    }
  }
}
```

---

## Contribution Guidelines

### Reporting Issues
1. Create a GitHub Issue with detailed steps to reproduce
2. Include browser/OS information
3. Attach screenshots if applicable

### Adding New Questions
1. Edit `assets/data/questions.json`
2. Follow the structure in Data Formats section
3. Test in-game to verify difficulty/clarity
4. Submit pull request

### Adding New Worlds
1. Add world data to `maps.json` (nodes, connections)
2. Add curriculum to `questions.json`
3. Add lessons to `lessons.json`
4. Create background image
5. Add audio files
6. Update world progression logic in `main.js`

### Code Style
- Use meaningful variable names
- Add comments for complex logic
- Follow existing module patterns
- Test in multiple browsers

---

## Troubleshooting

### Game Won't Load
- Check browser console (F12) for errors
- Ensure all asset files exist in correct folders
- Verify JSON files are valid (use JSONLint)
- Clear browser cache

### Audio Not Playing
- Check browser autoplay settings
- Ensure audio files are in `assets/audio/`
- Verify file paths match in AudioManager.js
- Some browsers block audio until user interaction

### Questions Not Appearing
- Verify `assets/data/questions.json` is valid
- Check that node has matching `topicId`
- Ensure questions array isn't empty
- Check browser console for loading errors

### Save Not Working
- Check browser localStorage is enabled
- Verify no quota exceeded
- Try clearing old saves with F12 console:
  ```javascript
  localStorage.removeItem('knight_save_v1');
  ```

---

## Future Roadmap

### Planned Features
- [ ] World 4: Advanced OOP Concepts
- [ ] Multiplayer turn-based combat
- [ ] Achievements/trophy system
- [ ] Difficulty settings
- [ ] Sound customization (mute boss themes, etc.)
- [ ] Mobile-optimized controls
- [ ] Accessibility improvements (screen reader support)
- [ ] Leaderboards (server-based)

### Performance Optimizations
- [ ] WebGL canvas rendering instead of DOM
- [ ] Asset lazy-loading
- [ ] Service Worker offline support
- [ ] Minification and bundling

---

## Credits

**Game Design & Development:** Yunimo30  
**Music & Sound Effects:** [To be credited]  
**Educational Content:** Java Programming Community  

### Assets Used
- FontAwesome icons (6.4.0)
- Google Fonts (VT323, Satisfy, MedievalSharp, Modern Antiqua)
- CDNJS CDN

---

## License

This project is open source. Feel free to fork, modify, and learn from it!  
**For educational purposes:** You are free to use this as a learning tool.  
**For commercial use:** Please contact the author for licensing.

---

## Contact

Have suggestions or bugs to report?  
- **Email:** [your-email@example.com]
- **GitHub Issues:** [Submit here]
- **Discord:** [If applicable]

---

**Enjoy your journey through the worlds of programming! May your logic be sound and your syntax be correct.** ⚔️🖥️

