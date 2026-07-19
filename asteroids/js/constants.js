/**
 * Asteroids Game Constants
 */
const GAME_CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    fps: 60,
    
    // Physics
    rotationSpeed: 4,           // Radians per second
    acceleration: 0.004,       // Thrust power
    friction: 0.98,            // Speed retention
    bulletSpeed: 5,             // Velocity
    asteroidMinSpeed: 0.5,
    asteroidMaxSpeed: 1.5,
    
    // Balance
    maxBullets: 5,
    asteroidSpawnRate: 2000,    // ms
    lives: 3,
    
    // Entities
    shipColor: '#22d3ee',
    asteroidColors: ['#c4b5d4', '#f6e05e', '#fbbf24'],
    
    // Score
    scoreMultiplier: 100,
};

// Input mapping
const INPUT_KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    SPACE: ' ',
    PAUSE: 'Escape',
    RESTART: 'r'
};

// UI Elements
const UI_CLASSES = {
    SCORE_FLASH: 'score-flash',
    OVERLAY_SHOW: 'overlay-show'
};
