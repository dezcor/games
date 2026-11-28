// Hook Run constants
const BOARD_WIDTH = 480;
const BOARD_HEIGHT = 360;
const GROUND_Y = 306;
const GROUND_HEIGHT = BOARD_HEIGHT - GROUND_Y;

// Player
const PLAYER_X = 140;
const PLAYER_BODY_HEIGHT = 36;
const PLAYER_HALF_WIDTH = 10;
const PLAYER_FALL_GRAVITY = 1800;

// Auto-run
const BASE_SPEED = 140;
const SPEED_FACTOR = 6000; // +1 px/s per this distance
const SPEED_CAP = 230;

// Obstacles
const OBSTACLE_FIRST_DISTANCE = 700;
const OBSTACLE_BASE_SPACING = 420;
const OBSTACLE_MIN_SPACING = 360;
const OBSTACLE_MAX_SPACING = 560;
const WALL_MIN_HEIGHT = 72;
const WALL_MAX_HEIGHT = 112;
const WALL_MIN_WIDTH = 52;
const WALL_MAX_WIDTH = 80;
const PIT_MIN_WIDTH = 54;
const PIT_MAX_WIDTH = 88;
const PLANK_Y = 60;

// Hook
const HOOK_FLY_TIME = 0.08;
const HOOK_LATCH_TIME = 0.02;
const HOOK_HOIST_TIME = 0.22;
const HOOK_MAX_HANG = 3.0;
// Obstacle left edge window (x) where the hook fires. The minimum still leaves
// time to rise above the tallest wall at top speed.
const HOOK_TRIGGER_MIN = 205;
const HOOK_TRIGGER_MAX = 270;
const HOIST_END_FEET_Y = 130;  // figure feet at the end of the hoist (swing starts here)
const SWING_DIP = 22;          // how far the swing sags under the plank (px)
const SWING_BLEND_TIME = 0.25;
const SWING_TILT = 0.4;        // body tilt per radian of rope angle
const GATE_MARGIN = 15;

// Zombies. Speeds are relative to the auto-run (px/s); `from` is the distance
// at which a variant starts to appear.
const ZOMBIE_TYPES = {
    walker: { hp: 1, minSpeed: 16, maxSpeed: 34, height: 38, hitRadius: 18, contact: 22, score: 10, weight: 5, from: 0 },
    crawler: { hp: 1, minSpeed: 30, maxSpeed: 55, height: 24, hitRadius: 18, contact: 22, score: 15, weight: 2.5, from: 1200 },
    runner: { hp: 1, minSpeed: 75, maxSpeed: 105, height: 38, hitRadius: 18, contact: 20, score: 15, weight: 3, from: 1800 },
    brute: { hp: 3, minSpeed: 0, maxSpeed: 8, height: 54, hitRadius: 22, contact: 26, score: 30, weight: 1.5, from: 3000 },
};
const ZOMBIE_FIRST_DISTANCE = 700;
const ZOMBIE_MIN_SPACING = 420;  // between packs
const ZOMBIE_MAX_SPACING = 760;
const ZOMBIE_PACK_START = 2;     // largest pack at the start of a run
const ZOMBIE_PACK_MAX = 4;
const ZOMBIE_PACK_GROWTH = 3000; // distance per extra zombie in the largest pack
const ZOMBIE_PACK_MIN_GAP = 70;
const ZOMBIE_PACK_MAX_GAP = 110;
const ZOMBIE_HIT_FLASH = 0.12;
const STOMP_MIN_HEIGHT = 40;     // a lower drop does not crush anything
const STOMP_REACH_BACK = 30;
const STOMP_REACH_FRONT = 110;

// Pellets
const PELLET_SPEED = 430;
const PELLET_RANGE = 360;
const PELLET_FIRE_COOLDOWN = 0.28;
const PELLET_HALF_LENGTH = 7;

// Flow
const COUNTDOWN_SECONDS = 3;

const DISTANCE_PER_POINT = 100;
