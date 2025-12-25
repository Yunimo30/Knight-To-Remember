# A Knight to Remember - Project Architecture Wireframe

## 🏗️ System Overview
A turn-based RPG game where players answer coding questions to defeat enemies. The game is built on a modular architecture with clear separation of concerns: **Game State**, **Level Management**, **UI Rendering**, and **Game Loop**.

---

## 📊 Architecture Diagram

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
    ┌────────────────────────────────────────────────┐
    │  THREE CORE MODULES (Imported in main.js)     │
    └────────────────────────────────────────────────┘
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

---

## 📦 Module Details

### 1️⃣ **GameState.js** - The Single Source of Truth
**Purpose:** Centralized state management. All game data lives here.

**Contains:**
```
GameState = {
  player: {
    maxHp, currentHp, inventory, hints, currentNodeId
  },
  enemy: {
    name, maxHp, currentHp, damage, icon
  },
  currentMapData: {
    name, background, nodes[]
  },
  activeWorldTopics: [
    { id, questions[] }
  ],
  progression: {
    currentWorldId, unlockedWorlds[], clearedStages[]
  },
  isPlayerTurn: boolean,
  isQTEActive: boolean,
  currentQuestion: object
}
```

**Accessed By:** main.js (primary), UIManager.js, LevelManager.js
**Modified By:** main.js (game loop)

---

### 2️⃣ **LevelManager.js** - The Data Loader
**Purpose:** Fetch and parse JSON data files, populate GameState.

**Key Functions:**
- `loadWorld(worldId)` 
  - Fetches maps.json → populates GameState.currentMapData
  - Fetches questions.json → populates GameState.activeWorldTopics
  - Fetches lessons.json → populates GameState.lessonData
  
- `getQuestionsForNode(node)`
  - Returns questions for a specific node
  - Special logic: Boss fights use ALL world questions

**Data Flow:**
```
maps.json → LevelManager.loadWorld() → GameState.currentMapData
questions.json → LevelManager.loadWorld() → GameState.activeWorldTopics
lessons.json → LevelManager.loadWorld() → GameState.lessonData
```

**Accessed By:** main.js
**Modified By:** Never (read-only)

---

### 3️⃣ **UIManager.js** - The Renderer
**Purpose:** Display game state to the player.

**Core Responsibilities:**
- `displayQuestion(questionObj)` - Shows question based on type
  - Type "code_mc": Shows code snippet + multiple choice buttons
  - Type "input": Shows text input field
  - Type "mc": Shows 4 answer buttons
  
- `setupEnemy(enemyData)` - Displays enemy sprite/name
- `updateStats()` - Updates HP bars, hint counter, level
- `setTurnIndicator(isPlayer)` - Shows whose turn it is
- `renderHearts()` - Visual HP representation
- `removeWrongAnswer()` - Hint system visualization

**Accessed By:** main.js (to render after state changes)
**Modified By:** main.js (calls render functions)

---

## 🎮 Game Flow - Turn by Turn

### **Combat Turn Sequence:**

```
┌─────────────────────────────────────────────────┐
│  PLAYER TURN                                    │
├─────────────────────────────────────────────────┤
│ 1. LevelManager.getQuestionsForNode() → question
│ 2. UI.displayQuestion(question)                 │
│ 3. Player answers → handleAnswer()              │
│ 4. Check answer vs question.correct             │
│    ├─ CORRECT: Player attacks, deal damage      │
│    └─ WRONG: Skip to enemy turn               │
│ 5. Check enemy.currentHp                        │
│    ├─ = 0: Battle won, load next node         │
│    └─ > 0: Continue                            │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  ENEMY TURN                                     │
├─────────────────────────────────────────────────┤
│ 1. UI.setTurnIndicator(false)                  │
│ 2. Activate QTE (Quick Time Event)              │
│ 3. UI.displayQTE() - Show defense slider      │
│ 4. Player presses SPACE to block damage        │
│    ├─ In red zone: Block successful            │
│    └─ Missed: Take full damage                 │
│ 5. Check player.currentHp                       │
│    ├─ ≤ 0: Battle lost, restart node          │
│    └─ > 0: Back to player turn                │
└─────────────────────────────────────────────────┘
```

---

## 🗺️ World Map System

**Structure (from maps.json):**
```
world_1 {
  nodes: [
    { id, type, name, topicId, connections, status }
  ]
}
```

**Node Types:**
- `start` - Game beginning
- `lesson` - Non-combat study (topicId determines content)
- `enemy` - Combat encounter (topicId determines questions)
- `miniboss` - Stronger combat
- `boss` - Final encounter (uses ALL world questions)
- `item` - Pickup (restore HP, get potion)
- `wildcard` - Random events
- `wildcard` - Random events

**Node Status:**
- `completed` - Already cleared
- `unlocked` - Available to play
- `locked` - Requires previous node completion

**Player Progression:**
```
Start (completed) → Node 1 (unlocked) → Node 2 (locked)
                          ↓
                   Player beats Node 1
                          ↓
                   Node 1 (completed)
                   Node 2 (unlocked)
```

---

## 📋 Data Files Structure

### **maps.json**
```
{
  "world_1": {
    "name": "The Syntax Forest",
    "background": "forestbg.png",
    "nodes": [
      {
        "id": 0,
        "type": "enemy",
        "name": "Var Valley",
        "topicId": "java_types",      ← Links to questions.json
        "connections": [1, 2],        ← Next available nodes
        "status": "locked"
      }
    ]
  }
}
```

### **questions.json**
```
{
  "curriculum": [
    {
      "worldId": "world_1",
      "topics": [
        {
          "id": "java_types",           ← Referenced by node.topicId
          "questions": [
            {
              "id": "t1",
              "type": "mc|code_mc|input",
              "text": "Question text",
              "answers": ["A", "B", "C", "D"],
              "correct": 0,              ← Index of correct answer
              "difficulty": "easy"
            }
          ]
        }
      ]
    }
  ]
}
```

### **lessons.json**
```
{
  "lessons": [
    {
      "id": "java_types",
      "title": "Variables and Types",
      "content": "Educational text/HTML"
    }
  ]
}
```

---

## 🔄 Key Data Flow Examples

### **Example 1: Loading a World**
```
User clicks "Start Game"
     ↓
main.js: LevelManager.loadWorld("world_1")
     ↓
LevelManager: fetch maps.json, questions.json, lessons.json
     ↓
GameState.currentMapData = maps.json["world_1"]
GameState.activeWorldTopics = questions.json curriculum
     ↓
UI: Render map with connected nodes
```

### **Example 2: Player Encounters Enemy**
```
Player clicks on node (id=2, topicId="java_types")
     ↓
main.js: Initiate combat with EnemyTypes[randomId]
     ↓
LevelManager.getQuestionsForNode(node)
     ↓
Return all questions where topic.id === "java_types"
     ↓
UI.displayQuestion(questions[0])
     ↓
Show question text + 4 answer buttons
```

### **Example 3: Player Answers Correctly**
```
Player clicks answer button (index = 2)
     ↓
main.js: handleAnswer(2)
     ↓
Check: questions[current].correct === 2 ?
     ↓
TRUE:
  GameState.enemy.currentHp -= 1
  UI.updateStats()
  Check if enemy.currentHp === 0?
    - YES: Battle won, unlock next nodes
    - NO: Continue to next question
     ↓
FALSE:
  Skip to enemy turn
```

---

## 🎯 State Management Rules

1. **Single Source of Truth**: All game data in GameState
2. **Immutable Rendering**: UIManager reads state, doesn't modify it
3. **Main.js Controls Flow**: Only main.js modifies GameState
4. **LevelManager Loads Data**: Never modifies active game state directly
5. **Event Listeners in Main**: All input → main.js → state change → UI update

---

## 🔌 Integration Points

| Component | Receives Data From | Sends Data To | Purpose |
|-----------|-------------------|---------------|---------|
| GameState | LevelManager | main.js, UIManager | Central storage |
| LevelManager | JSON files | GameState | Data loading |
| main.js | GameState, Events | GameState, UIManager | Logic & orchestration |
| UIManager | GameState | HTML DOM | Rendering |
| HTML (index.html) | CSS, JS | UIManager | Structure & display |

---

## 📝 Example: Complete Combat Flow

```
INITIALIZATION:
  index.html loads → main.js loads → initGame()
    ↓
  LevelManager.loadWorld("world_1")
    ↓
  GameState populated with maps & questions
    ↓
  UI.displayMap() shows world layout

USER CLICKS NODE (Enemy):
  main.js: handleNodeClick(nodeId)
    ↓
  Spawn enemy: GameState.enemy = EnemyTypes[id]
    ↓
  UI.setupEnemy(GameState.enemy) 
    ↓
  Switch screen to battle arena
    ↓
  Load questions: LevelManager.getQuestionsForNode(node)

BATTLE ROUND:
  GameState.isPlayerTurn = true
    ↓
  UI.setTurnIndicator(true) → "YOUR TURN"
    ↓
  questions = LevelManager.getQuestionsForNode(node)
    ↓
  UI.displayQuestion(questions[0])
    ↓
  Player clicks answer → main.js: handleAnswer(index)
    ↓
  Check: index === questions[0].correct?
    ↓
  IF YES:
    GameState.enemy.currentHp -= 1
    UI.updateStats()
    IF enemy.currentHp === 0:
      showVictoryScreen()
      UnlockNextNodes()
    ELSE:
      Next question
  IF NO:
    GameState.isPlayerTurn = false
    ↓
  GameState.isQTEActive = true
    ↓
  UI.displayQTE() (defense slider)
    ↓
  Player presses SPACE → resolveQTE()
    ↓
  IF blocked:
    No damage
  ELSE:
    GameState.player.currentHp -= GameState.enemy.damage
    UI.updateStats()
    ↓
  IF player.currentHp <= 0:
    showGameOverScreen()
  ELSE:
    GameState.isPlayerTurn = true
    Next question
```

---

## ✨ Key Design Patterns

1. **State Centralization** - GameState is the source of truth
2. **Separation of Concerns** - Data (GameState) ≠ Logic (main.js) ≠ Rendering (UIManager)
3. **Event-Driven** - User input triggers main.js which modifies state and calls UI
4. **Lazy Loading** - Questions loaded only when needed for battles
5. **Module Pattern** - Each .js file is an export object/function

---

## 🐛 Debug Entry Points

From main.js:
- `F8` - Kill current enemy (skip battle)
- `F9` - Teleport to boss node

---

## 📈 Extensibility

**To Add New Content:**
1. Add node to maps.json (set topicId)
2. Add topic + questions to questions.json
3. Add lesson to lessons.json (optional)
4. Game automatically loads and displays

**To Add New Question Type:**
1. Add case in UIManager.displayQuestion()
2. Update questions.json with new "type" field
3. Update answer validation logic in main.js

**To Add New Enemy Type:**
1. Add to EnemyTypes[] in GameState.js
2. Update map nodes to reference new enemy ID
3. Game automatically spawns and displays
