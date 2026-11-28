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
const HOOK_FLY_TIME = 0.16;
const HOOK_LATCH_TIME = 0.1;
const HOOK_HOIST_TIME = 0.22;
const SWING_OMEGA0 = 3.8;
const SWING_DAMPING = 0.6;
const SWING_GRAVITY = 1100;
const HOOK_MAX_HANG = 3.0;
const HOOK_TRIGGER_MIN = 160; // obstacle left edge window (x) where the hook fires
const HOOK_TRIGGER_MAX = 220;
const HOIST_END_FEET_Y = 130;  // figure feet at the end of the hoist (swing starts here)
const GATE_MARGIN = 15;

// Zombies
const ZOMBIE_FIRST_DISTANCE = 1300;
const ZOMBIE_MIN_SPACING = 900;
const ZOMBIE_MAX_SPACING = 1900;
const ZOMBIE_MIN_SPEED = 16;  // relative walk speed (px/s, slower than the auto-run)
const ZOMBIE_MAX_SPEED = 34;
const PURSUER_FIRST_DISTANCE = 17000;
const PURSUER_MIN_SPACING = 12000;
const PURSUER_MAX_SPACING = 23000;
const PURSUER_SPEED = 68;     // screen-space walk speed toward the player

// Pellets
const PELLET_SPEED = 430;
const PELLET_RANGE = 240;
const PELLET_FIRE_COOLDOWN = 0.45;
const PELLET_HALF_LENGTH = 7;

// Flow
const COUNTDOWN_SECONDS = 3;

const SCORE_PER_KILL = 10;
const DISTANCE_PER_POINT = 100;
