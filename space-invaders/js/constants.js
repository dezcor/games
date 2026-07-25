const CANVAS_WIDTH = 240;
const CANVAS_HEIGHT = 400;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 10;
const PLAYER_Y = CANVAS_HEIGHT - 20;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 10;
const ALIEN_X_GAP = 4;
const ALIEN_Y_GAP = 4;
const ALIEN_START_X = 15;
const ALIEN_START_Y = 30;
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 6;
const BULLET_SPEED = 5;
const ALIEN_BULLET_WIDTH = 2;
const ALIEN_BULLET_HEIGHT = 6;
const ALIEN_BASE_SPEED = 0.5;
const ALIEN_DROP = 8;
const STORAGE_KEY = 'si_highscores';
const PLAYER_NAME_STORAGE = 'si_player_name';
const AUDIO_VOLUME_STORAGE = 'si_audio_volume';
const BGM_VOLUME_STORAGE = 'si_bgm_volume';
const SFX_MUTED_STORAGE = 'si_sfx_muted';
const BGM_MUTED_STORAGE = 'si_bgm_muted';
const DIFFICULTY_STORAGE = 'si_difficulty';
const PARTICLE_COUNT = 8;
const PARTICLE_LIFETIME = 600;
const PARTICLE_SPEED = 2;
const MAX_PARTICLES = 160;
const LEVEL_BASE_SCORE = 1000;
const LEVEL_BONUS_MULTIPLIER = 1.5;
const SURVIVAL_BONUS = 500;
const COMBO_WINDOW = 1500;
const COMBO_BONUS_STEP = 5;
const MAX_COMBO_BONUS = 50;

// Alien metadata is the source of truth for rendering, movement and scoring.
const ALIEN_TYPES = {
    TYPE_1: {
        shape: 'small',
        width: 18,
        height: 10,
        points: 10,
        speed: 0.5,
        shootWeight: 1,
        color: '#ff6b8a',
    },
    TYPE_2: {
        shape: 'medium',
        width: 18,
        height: 10,
        points: 20,
        speed: 0.6,
        shootWeight: 1.25,
        color: '#ff8fa3',
    },
    TYPE_3: {
        shape: 'large',
        width: 18,
        height: 10,
        points: 30,
        speed: 0.7,
        shootWeight: 1.5,
        color: '#ff2060',
    },
};

// The classic order is worth preserving: stronger aliens occupy the top rows.
const ALIEN_ROW_TYPES = ['TYPE_3', 'TYPE_3', 'TYPE_2', 'TYPE_2', 'TYPE_1'];

// ── Alien Shooting ──
const MAX_ALIEN_BULLETS = 5;

// ── UFO ──
const UFO_WIDTH = 40;
const UFO_HEIGHT = 12;
const UFO_Y = 0;
const UFO_SPEED = 1.5;
const UFO_SPAWN_MIN = 15000;
const UFO_SPAWN_MAX = 25000;
const UFO_MIN_INTERVAL = 7000;
const UFO_LEVEL_INTERVAL_FACTOR = 0.9;
const UFO_LEVEL_SPEED_FACTOR = 0.08;
const UFO_SCORE_RANGE = [50, 300];

// ── Difficulty Presets ──
const DIFFICULTY_PRESETS = {
    easy:   { alienSpeed: 0.3,  alienDrop: 10, shootInterval: 4000, lives: 5, bulletSpeed: 4, alienBulletSpeed: 2, maxAlienBullets: 2, ufoIntervalFactor: 1.15, ufoSpeedFactor: 0.9 },
    normal: { alienSpeed: 0.5,  alienDrop: 8,  shootInterval: 2500, lives: 3, bulletSpeed: 5, alienBulletSpeed: 3, maxAlienBullets: 3, ufoIntervalFactor: 1,    ufoSpeedFactor: 1 },
    hard:   { alienSpeed: 0.8,  alienDrop: 6,  shootInterval: 1500, lives: 2, bulletSpeed: 6, alienBulletSpeed: 4, maxAlienBullets: 4, ufoIntervalFactor: 0.9,  ufoSpeedFactor: 1.1 },
    insane: { alienSpeed: 1.2,  alienDrop: 4,  shootInterval: 800,  lives: 1, bulletSpeed: 7, alienBulletSpeed: 5, maxAlienBullets: MAX_ALIEN_BULLETS, ufoIntervalFactor: 0.75, ufoSpeedFactor: 1.2 },
};
