const CANVAS_WIDTH = 240;
const CANVAS_HEIGHT = 400;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 10;
const PLAYER_Y = CANVAS_HEIGHT - 20;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 10;
const ALIEN_WIDTH = 18;
const ALIEN_HEIGHT = 10;
const ALIEN_X_GAP = 4;
const ALIEN_Y_GAP = 4;
const ALIEN_START_X = 15;
const ALIEN_START_Y = 30;
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 6;
const BULLET_SPEED = 5;
const ALIEN_BASE_SPEED = 0.5;
const ALIEN_DROP = 8;
const STORAGE_KEY = 'si_highscores';
const PLAYER_NAME_STORAGE = 'si_player_name';
const PARTICLE_COUNT = 8;
const PARTICLE_LIFETIME = 600;
const PARTICLE_SPEED = 2;
const LEVEL_BASE_SCORE = 1000;
const LEVEL_BONUS_MULTIPLIER = 1.5;
const SURVIVAL_BONUS = 500;

// ── Alien Shooting ──
const ALIEN_SHOOT_CHANCE_BASE = 0.02;

// ── UFO ──
const UFO_WIDTH = 40;
const UFO_HEIGHT = 12;
const UFO_Y = 0;
const UFO_SPEED = 1.5;
const UFO_SPAWN_MIN = 15000;
const UFO_SPAWN_MAX = 25000;
const UFO_SCORE_RANGE = [50, 300];

// ── Difficulty Presets ──
const DIFFICULTY_PRESETS = {
    easy:   { alienSpeed: 0.3,  alienDrop: 10, shootInterval: 4000, lives: 5, bulletSpeed: 4,   alienBulletSpeed: 2 },
    normal: { alienSpeed: 0.5,  alienDrop: 8,  shootInterval: 2500, lives: 3, bulletSpeed: 5,   alienBulletSpeed: 3 },
    hard:   { alienSpeed: 0.8,  alienDrop: 6,  shootInterval: 1500, lives: 2, bulletSpeed: 6,   alienBulletSpeed: 4 },
    insane: { alienSpeed: 1.2,  alienDrop: 4,  shootInterval: 800,  lives: 1, bulletSpeed: 7,   alienBulletSpeed: 5 },
};
