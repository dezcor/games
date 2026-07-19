/**
 * Asteroids Game Constants
 */

// ── Difficulty Presets ──
const DIFFICULTY_PRESETS = {
    easy: {
        label: 'Fácil',
        color: '#4ade80',
        asteroidMinSpeed: 0.8,
        asteroidMaxSpeed: 1.5,
        lives: 5,
        bulletSpeed: 7,
        bulletLifetime: 50,
        maxBullets: 6,
        fireRate: 300,
        invulnTime: 1000,
        rotationSpeed: 0.08,
        thrust: 0.12,
        friction: 0.995,
    },
    normal: {
        label: 'Normal',
        color: '#fbbf24',
        asteroidMinSpeed: 1.2,
        asteroidMaxSpeed: 2.2,
        lives: 3,
        bulletSpeed: 9,
        bulletLifetime: 40,
        maxBullets: 5,
        fireRate: 200,
        invulnTime: 600,
        rotationSpeed: 0.07,
        thrust: 0.15,
        friction: 0.99,
    },
    hard: {
        label: 'Difícil',
        color: '#f87171',
        asteroidMinSpeed: 1.5,
        asteroidMaxSpeed: 3.0,
        lives: 2,
        bulletSpeed: 10,
        bulletLifetime: 35,
        maxBullets: 4,
        fireRate: 150,
        invulnTime: 500,
        rotationSpeed: 0.07,
        thrust: 0.18,
        friction: 0.98,
    },
    insane: {
        label: 'Loco',
        color: '#d946ef',
        asteroidMinSpeed: 2.0,
        asteroidMaxSpeed: 3.8,
        lives: 1,
        bulletSpeed: 12,
        bulletLifetime: 30,
        maxBullets: 3,
        fireRate: 100,
        invulnTime: 300,
        rotationSpeed: 0.08,
        thrust: 0.2,
        friction: 0.97,
    },
};

// ── Game Config ──

const GAME_CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    shipColor: '#06b6d4',
    bulletColor: '#fbbf24',
    asteroidColors: ['#a8a29e', '#d4d4d8', '#e8e8ec'],
    asteroidMinSpeed: 1.0,
    asteroidMaxSpeed: 3.0,
    lives: 3,
    bulletSpeed: 9,
    bulletLifetime: 40,
    maxBullets: 5,
    fireRate: 200,
    invulnTime: 600,
    rotationSpeed: 0.07,
    thrust: 0.15,
    friction: 0.99,
};

// ── Asteroid ──
const ASTEROID_SIZE = 40;
const ASTEROID_VERTICES_MIN = 8;
const ASTEROID_VERTICES_MAX = 12;
const ASTEROID_INITIAL_COUNT = 5;
const EXTRA_ASTEROID_PER_LEVEL = 3;
const ASTEROID_SPREAD = 60;

// ── Score ──
const SCORE_TABLE = {
    large: 20,
    medium: 50,
    small: 100,
};

// ── Player ──
const INITIAL_LIVES = 3;

// ── Particles ──
const PARTICLE_COUNT_EXPLOSION = 16;
const PARTICLE_LIFETIME = 600;
const PARTICLE_SPEED = 5;

// ── Persistence Keys ──
const STORAGE_KEY = 'asteroid_highscores';
const PLAYER_NAME_STORAGE = 'asteroid_player_name';
const AUDIO_VOLUME_STORAGE = 'asteroid_audio_volume';
const BGM_VOLUME_STORAGE = 'asteroid_bgm_volume';
const DIFFICULTY_STORAGE = 'asteroid_difficulty';

// ── Screen Shake ──
const SHAKE_DURATION = 300;
const SHAKE_INTENSITY = 5;

// ── Input Mapping ──
const INPUT_KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    SPACE: 'Space',
    PAUSE: 'Escape',
    RESTART: 'r',
};

// ── UI Classes ──
const UI_CLASSES = {
    SCORE_FLASH: 'score-flash',
    OVERLAY_SHOW: 'overlay-show',
};
