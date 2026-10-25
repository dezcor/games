const COLS = 10;
const ROWS = 6;
const BLOCK_SIZE = 44;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const BASE_SPEED = 2;
// Bounce tuning: keeps trajectories playable (no sideways flings, no near-horizontal crawls)
const PADDLE_MAX_BOUNCE = Math.PI / 3; // max deflection off the paddle: 60° from vertical
const PADDLE_JITTER = 0.1;             // random aim spread (~5.7°) so identical volleys never loop
const MIN_VERTICAL_SHARE = 0.25;       // |dy| never drops below this share of total speed
const POWER_UP_CHANCE = 0.15;

const COLORS = {
    1: '#22d3ee',
    2: '#06b6d4',
    3: '#67e8f9',
    4: '#a5f3fc',
    5: '#cffafe',
    6: '#22d3ee',
};

const POWER_UP_TYPES = {
    MULTI_BALL: 'multi-ball',
    EXTRA_LIFE: 'extra-life',
};

const POWER_UP_COLORS = {
    'multi-ball': '#22d3ee',
    'extra-life': '#4ade80',
};
