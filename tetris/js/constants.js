const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 20;
const COLORS = {
    'I': '#0DC2FF',
    'J': '#3877FF',
    'L': '#FFE17E',
    'O': '#FFE138',
    'S': '#0FA850',
    'T': '#FF0D72',
    'Z': '#F538FF',
};

// ── Scoring (standard guideline) ──
const LINE_SCORES = {
    1: 100, // single
    2: 300, // double
    3: 500, // triple
    4: 800, // tetris
};
const BACK_TO_BACK_MULTIPLIER = 1.5;

// ── Timing (frames at 60fps) ──
const GRAVITY_SPEEDS = [60, 50, 40, 30, 20, 15, 10, 5]; // frames per drop, indexed by level
const DAS_DELAY = 10;          // ~170ms
const ARR_RATE = 3;            // ~50ms
const ANIMATION_SPEED = 0.15;  // piece glide easing per frame
const ROTATION_STEP = 0.08;    // rotation animation progress per frame
const ROW_FADE_STEP = 0.2;     // clear-flash fade per frame

// ── Limits and UI timing ──
const MAX_ROTATION_QUEUE = 3;
const HIGH_SCORE_LIMIT = 5;
const NOTICE_DURATION_MS = 2500;
const HELD_KEYS = { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown' };

// ── North theme easter egg phrases ──
const NORTHERN_GAME_OVER_PHRASES = [
    'The North Remembers',
    'Winter is Coming',
    'You Know Nothing, Jon Snow',
    'The King in the North',
    'For the Watch',
    'The Night is Dark and Full of Terrors',
    'Valar Morghulis',
    'The Long Night Has Come',
];

const NORTHERN_RECORD_PHRASES = [
    'The North Remembers Your Score',
    'The King in the North Approves',
    'Winter Has Come for the Records',
    'The Wall Stands Tall',
    'First of His Name',
    'The Stark Score Stands',
    'A Score This High Must Be Guarded',
];
