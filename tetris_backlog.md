# Tetris Game Development Backlog

## Phase 1: Project Setup & Infrastructure
- [x] Initialize project repository (Git)
- [x] Select and set up tech stack (HTML5 Canvas/JavaScript)
- [x] Define project structure and constants (grid size, colors, piece shapes)

## Phase 2: Core Game Logic (Engine)
- [x] **Grid System**: Create a 2D array to represent the game board
- [x] **Tetriminos**: Define shapes and colors for all 7 types (I, J, L, O, S, T, Z)
- [x] **Piece Movement**: Implement left, right, and down movement
- [x] **Collision Detection**: Logic to prevent pieces from moving outside boundaries or into other pieces
- [x] **Rotation Logic**: Implement SRS (Super Rotation System) or basic rotation logic
- [ ] **Hard Drop**: Implement immediate piece placement
- [ ] **Line Clearing**: Logic to detect full rows, remove them, and shift rows above down

## Phase 3: Rendering & Graphics
- [x] **Game Loop**: Create a consistent frame rate (e.g., 60 FPS)
- [x] **Draw Function**: Render the grid, current piece, and cleared lines
- [ ] **Ghost Piece**: Render a "shadow" piece showing where it will land
- [ ] **Animations**: Smooth transitions for movements and rotations

## Phase 4: Input & User Interaction
- [x] **Keyboard Listeners**: Map keys (Arrows, Space, etc.) to game actions
- [ ] **Input Buffer**: Handle rapid key presses correctly

## Phase 5: Game State & Scoring
- [ ] **Score System**: Points for lines cleared and "Tetris" combos
- [ ] **Next Piece Preview**: Render a UI element showing the next shape
- [ ] **Levels/Speed**: Increase gravity speed as the score increases
- [ ] **Game Over State**: Detection and "Game Over" overlay
- [ ] **High Scores**: Persistent local storage for top scores

## Phase 6: Polish & Audio
- [ ] **Sound Effects**: Move, rotate, line clear, and game over sounds
- [ ] **Background Music**: Loopable track
- [ ] **UI Polish**: Menu screens, "Pause" functionality, and styled fonts
