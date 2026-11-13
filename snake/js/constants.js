/**
 * Snake Game Constants
 */

// ── Board / Grid ──
const GRID_SIZE = 20;   // px per cell (canvas is 400×400)
const TILE_COUNT = 20;  // cells per side

// ── Gameplay ──
const INITIAL_GAME_SPEED = 100; // ms per step at start
const MIN_GAME_SPEED = 50;      // fastest speed
const SPEED_STEP = 2;           // speed-up per food eaten

const START_SNAKE = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
];

// ── Persistence Keys ──
const SNAKE_HIGH_SCORE_KEY = 'snakeHighScore';
