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
// Jump: peaks ~68 px (over zombies and pits, below the lowest wall) and
// stays ~0.85 s in the air.
const JUMP_VELOCITY = 320;
const JUMP_GRAVITY = 750;

// Auto-run
const BASE_SPEED = 140;
const SPEED_FACTOR = 6000; // +1 px/s per this distance
const SPEED_CAP = 230;

// Obstacles
const OBSTACLE_FIRST_DISTANCE = 700;
const OBSTACLE_MIN_SPACING = 360;
const OBSTACLE_MAX_SPACING = 560;
// `hookable` obstacles carry a beam. Traps are low and have none: jump them.
// `anchor` is a free beam over open road that arrives together with a horde.
const OBSTACLE_TYPES = {
    wall: { hookable: true, minWidth: 52, maxWidth: 80, minHeight: 72, maxHeight: 112, weight: 3, from: 0 },
    pit: { hookable: true, minWidth: 54, maxWidth: 88, minHeight: 0, maxHeight: 0, weight: 2, from: 0 },
    fire: { hookable: false, minWidth: 34, maxWidth: 46, minHeight: 28, maxHeight: 28, weight: 1.2, from: 0 },
    spikes: { hookable: false, minWidth: 30, maxWidth: 40, minHeight: 32, maxHeight: 32, weight: 1.2, from: 0 },
    electric: { hookable: false, minWidth: 18, maxWidth: 26, minHeight: 40, maxHeight: 40, weight: 1.2, from: 900 },
    anchor: { hookable: true, minWidth: 120, maxWidth: 120, minHeight: 0, maxHeight: 0, weight: 1.8, from: 1500 },
};
const TRAP_INSET = 4;            // forgiving edge on the trap hitboxes (px)
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
const ANCHOR_TRIGGER_MIN = 110; // nothing to clear under a free beam: later is fine
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
    brute: { hp: 3, minSpeed: 0, maxSpeed: 8, height: 44, hitRadius: 22, contact: 24, score: 30, weight: 1.5, from: 3000 },
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
// The horde that comes with a free beam
const HORDE_MIN_SIZE = 4;
const HORDE_MAX_SIZE = 6;
const HORDE_LEAD = 100;          // first zombie, this far behind the beam's left edge
const HORDE_MIN_GAP = 45;
const HORDE_MAX_GAP = 65;
const HORDE_QUIET = 700;         // distance without ordinary packs after a horde
const STOMP_MIN_HEIGHT = 145;    // above the double-jump peak: only a drop from the rope crushes
const STOMP_REACH_BACK = 30;
const STOMP_REACH_FRONT = 110;

// Pellets
const PELLET_SPEED = 430;
const PELLET_RANGE = 360;
const PELLET_FIRE_COOLDOWN = 0.28;
const PELLET_HALF_LENGTH = 7;

// Power-ups: picked up by running into them, always placed between two obstacles.
// duration 0 = not timed (the shield waits for a hit, the bomb is instant).
const POWER_TYPES = {
    rapid: { label: 'RÁPIDO', duration: 10, weight: 3, from: 0 },
    doubleJump: { label: 'DOBLE SALTO', duration: 15, weight: 3, from: 0 },
    shield: { label: 'ESCUDO', duration: 0, weight: 2.5, from: 0 },
    pierce: { label: 'PERFORANTE', duration: 10, weight: 2, from: 0 },
    bomb: { label: 'BOMBA', duration: 0, weight: 1, from: 2000 },
};
const POWER_FIRST_DISTANCE = 900;
const POWER_MIN_SPACING = 900;
const POWER_MAX_SPACING = 1600;
const POWER_RADIUS = 12;
const POWER_Y = GROUND_Y - 24;   // centre of a pickup: run into it
const POWER_NOTICE_TIME = 1.4;
const RAPID_FIRE_COOLDOWN = 0.12;
const PIERCE_HITS = 3;           // zombies one piercing pellet goes through
const SHIELD_GRACE = 1.2;        // invulnerable seconds after the shield breaks

// Flow
const COUNTDOWN_SECONDS = 3;

const DISTANCE_PER_POINT = 100;
