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