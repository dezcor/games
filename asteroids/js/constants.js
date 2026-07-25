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
        rotationSpeed: 0.40,
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
        rotationSpeed: 0.45,
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
        rotationSpeed: 0.50,
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
        rotationSpeed: 0.55,
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
    rotationSpeed: 0.45,
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
    ufoLarge: 200,
    ufoSmall: 1000,
    powerup: 50,
};

// ── Player ──
const INITIAL_LIVES = 3;
const MAX_LIVES = 6;

// ── Particles ──
const PARTICLE_COUNT_EXPLOSION = 16;
const PARTICLE_LIFETIME = 600;
const PARTICLE_SPEED = 5;
const MAX_PARTICLES = 200;
const PARTICLE_THRUST_RATE = 0.5;
const PARTICLE_PLAYER_EXPLOSION = 32;

// ── Persistence Keys ──
const STORAGE_KEY = 'asteroid_highscores';
const PLAYER_NAME_STORAGE = 'asteroid_player_name';
const AUDIO_VOLUME_STORAGE = 'asteroid_audio_volume';
const BGM_VOLUME_STORAGE = 'asteroid_bgm_volume';
const SFX_MUTED_STORAGE = 'asteroid_sfx_muted';
const BGM_MUTED_STORAGE = 'asteroid_bgm_muted';
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
    HYPERSPACE: 'h',
};

// ── UI Classes ──
const UI_CLASSES = {
    SCORE_FLASH: 'score-flash',
    OVERLAY_SHOW: 'overlay-show',
};

// ── Power-ups ──
const POWERUP_TYPES = {
    shield: {
        duration: 8,
        color: '#22d3ee',
        shape: 'ring',
        label: 'SHIELD',
    },
    double: {
        duration: 10,
        color: '#fbbf24',
        shape: 'arrow',
        label: 'DOUBLE',
    },
    life: {
        color: '#4ade80',
        shape: 'plus',
        label: 'LIFE',
    },
};

const POWERUP_DROP_RATE = {
    large: 0.15,
    medium: 0.10,
    small: 0.05,
};

const POWERUP_LIFETIME = 10;
const POWERUP_SPEED = 0.6;
const POWERUP_RADIUS = 12;

// ── Hyperspace ──
const HYPERSPACE_COOLDOWN = 5000;
const HYPERSPACE_SAFE_RADIUS = 60;
const HYPERSPACE_SELF_DESTRUCT_CHANCE = 0.10;
const HYPERSPACE_REENTRY_INVULN = 0.3;
const HYPERSPACE_FLASH_FRAMES = 3;
const HYPERSPACE_SEARCH_ATTEMPTS = 20;

// ── UFO ──
const UFO_SIZES = {
    large: {
        score: 200,
        fireInterval: 1.1,
        speed: 1.8,
        r: 22,
        minLevel: 1,
    },
    small: {
        score: 1000,
        fireInterval: 0.7,
        speed: 2.6,
        r: 14,
        minLevel: 3,
    },
};

const UFO_SPAWN_INTERVAL_MIN = 18;
const UFO_SPAWN_INTERVAL_MAX = 30;
const UFO_SPAWN_INTERVAL_LEVEL_REDUCTION = 1.5;
const UFO_DIRECTION_CHANGE_MIN = 1.5;
const UFO_DIRECTION_CHANGE_MAX = 3.0;
const UFO_BULLET_SPEED = 4.5;
const UFO_BULLET_LIFETIME = 1.4;
const UFO_Y_FRACTION = 0.25;

// ── BGM Intensity ──
const BGM_INTENSITY = {
    CALM: 0,
    NORMAL: 1,
    PANIC: 2,
};
const BGM_TEMPO = [110, 125, 140];
const BGM_VOLUME = [0.05, 0.10, 0.15];
const BGM_LARGE_ASTEROID_THRESHOLD = 4;

// ── Game balance (computed per frame) ──
function getBgmIntensity(level, largeAsteroids, ufoActive) {
    if (ufoActive) return BGM_INTENSITY.PANIC;
    if (level >= 3 || largeAsteroids < BGM_LARGE_ASTEROID_THRESHOLD / 2) return BGM_INTENSITY.NORMAL;
    if (largeAsteroids < BGM_LARGE_ASTEROID_THRESHOLD) return BGM_INTENSITY.NORMAL;
    return BGM_INTENSITY.CALM;
}
