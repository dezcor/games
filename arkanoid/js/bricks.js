const BRICK_LAYOUTS = [
    {
        rows: 4,
        cols: 8,
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ],
        speed: BASE_SPEED,
    },
    {
        rows: 5,
        cols: 8,
        grid: [
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ],
        speed: BASE_SPEED + 0.5,
    },
    {
        rows: 6,
        cols: 8,
        grid: [
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ],
        speed: BASE_SPEED + 1,
    },
];

const SPECIAL_BRICK_CHANCES = [0.1, 0.15, 0.2];

function getBrickLayout(level) {
    const layout = BRICK_LAYOUTS[level - 1] || BRICK_LAYOUTS[0];
    return {
        rows: layout.rows,
        cols: layout.cols,
        grid: layout.grid.map(row => [...row]),
        speed: layout.speed,
    };
}

function getBrickColors(level) {
    const levelColors = {
        1: { 1: '#22d3ee', 2: '#06b6d4' },
        2: { 1: '#06b6d4', 2: '#67e8f9', 3: '#22d3ee' },
        3: { 1: '#67e8f9', 2: '#22d3ee', 3: '#06b6d4', 4: '#a5f3fc' },
    };
    return levelColors[level] || levelColors[1];
}

function isSpecialBrick(level, row, col) {
    const chance = SPECIAL_BRICK_CHANCES[level - 1] || 0.1;
    return Math.random() < chance;
}

function getPowerUpType() {
    return Math.random() < 0.5 ? POWER_UP_TYPES.MULTI_BALL : POWER_UP_TYPES.EXTRA_LIFE;
}
