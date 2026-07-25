# Tetris Game Development Backlog

## Estado actual

Todas las fases están completadas (ver `PLAN.md`). El juego incluye persistencia de audio (SFX + BGM, volumen + mute), scoring real con Single/Double/Triple/Tetris (100/300/500/800 × nivel) y back-to-back con multiplicador x1.5, banner visual de combos, easter egg "North theme" (alias `JonSnow`/`Jon`/`JSnow`), high scores con medallas, DAS/ARR, ghost piece, y ARIA + focus-visible.

## Phase 1: Project Setup & Infrastructure ✅
- [x] Initialize project repository (Git)
- [x] Select and set up tech stack (HTML5 Canvas/JavaScript)
- [x] Define project structure and constants (grid size, colors, piece shapes)

## Phase 2: Core Game Logic (Engine) ✅
- [x] **Grid System**: Create a 2D array to represent the game board
- [x] **Tetriminos**: Define shapes and colors for all 7 types (I, J, L, O, S, T, Z)
- [x] **Piece Movement**: Implement left, right, and down movement
- [x] **Collision Detection**: Logic to prevent pieces from moving outside boundaries or into other pieces
- [x] **Rotation Logic**: Implement SRS (Super Rotation System) or basic rotation logic
- [x] **Hard Drop**: Implement immediate piece placement
- [x] **Line Clearing**: Logic to detect full rows, remove them, and shift rows above down

## Phase 3: Rendering & Graphics ✅
- [x] **Game Loop**: Create a consistent frame rate (e.g., 60 FPS)
- [x] **Draw Function**: Render the grid, current piece, and cleared lines
- [x] **Ghost Piece**: Render a "shadow" piece showing where it will land
- [x] **Animations**: Smooth transitions for movements and rotations

## Phase 4: Input & User Interaction ✅
- [x] **Keyboard Listeners**: Map keys (Arrows, Space, etc.) to game actions
- [x] **Input Buffer**: Handle rapid key presses correctly (DAS/ARR system)
- [x] **Touch Buttons**: On-screen left/right/rotate/down/drop/restart

## Phase 5: Game State & Scoring ✅
- [x] **Score System**: Single 100 / Double 300 / Triple 500 / Tetris 800, multiplicado por nivel; back-to-back Tetris con x1.5
- [x] **Combo Banner**: Banner visual de TETRIS / DOUBLE / TRIPLE / BACK-TO-BACK TETRIS con puntos
- [x] **Next Piece Preview**: Render a UI element showing the next shape
- [x] **Levels/Speed**: Increase gravity speed as the score increases
- [x] **Game Over State**: Detection and "Game Over" overlay
- [x] **High Scores**: Persistent local storage for top scores
- [x] **Player Name**: Sanitizado y persistido, con easter egg "North theme"

## Phase 6: Polish & Audio ✅
- [x] **Sound Effects**: Move, rotate, line clear, hard drop, game over sounds
- [x] **Background Music**: Loopable track
- [x] **UI Polish**: Menu screens, "Pause" functionality, styled fonts
- [x] **Audio Persistence**: SFX vol + SFX mute + BGM vol + BGM mute en `localStorage`
- [x] **Accessibility**: `aria-label` en canvas/botones/score, `aria-pressed` en toggles, focus-visible global
